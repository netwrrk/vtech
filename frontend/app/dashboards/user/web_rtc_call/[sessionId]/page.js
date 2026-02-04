"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const WS_URL = process.env.NEXT_PUBLIC_BACKEND_WS;

export default function WebRtcCallUserPage() {
  const router = useRouter();
  const params = useParams();

  const SESSION_ID = String(params?.sessionId || "").trim();
  const role = "user";

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const pcRef = useRef(null);
  const wsRef = useRef(null);
  const localStreamRef = useRef(null);

  const [status, setStatus] = useState("init");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!SESSION_ID) {
      setStatus("missing-session");
      setError("Missing sessionId in the URL.");
      return;
    }
    if (!WS_URL) {
      setStatus("missing-ws-url");
      setError("Missing NEXT_PUBLIC_BACKEND_WS.");
      return;
    }

    let cancelled = false;
    let offerSent = false;

    // store ICE until remoteDescription is set
    let pendingIce = [];

    function safeJsonParse(s) {
      try {
        return JSON.parse(s);
      } catch {
        return null;
      }
    }

    function wsSend(obj) {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return false;
      ws.send(JSON.stringify(obj));
      return true;
    }

    async function flushPendingIce(pc) {
      if (!pendingIce.length) return;
      const batch = pendingIce;
      pendingIce = [];
      for (const iceInit of batch) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(iceInit));
        } catch (e) {
          // don’t hard fail; just surface if needed
          console.warn("addIceCandidate failed:", e);
        }
      }
    }

    async function sendOffer() {
      if (offerSent) return;
      const pc = pcRef.current;
      if (!pc) return;

      offerSent = true;
      setStatus("creating-offer");

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      wsSend({
        type: "signal",
        sessionId: SESSION_ID,
        signalType: "offer",
        payload: offer,
      });

      setStatus("offer-sent");
      console.log("WS OUT: offer sent");
    }

    async function start() {
      try {
        setStatus("starting");

        // 1) Media
        setStatus("getting-media");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (cancelled) return;

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // 2) PeerConnection
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });
        pcRef.current = pc;

        stream.getTracks().forEach((t) => pc.addTrack(t, stream));

        pc.ontrack = (ev) => {
          const [remoteStream] = ev.streams;
          if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
        };

        pc.onicecandidate = (ev) => {
          if (!ev.candidate) return;

          // ✅ IMPORTANT: serialize ICE properly
          const payload = ev.candidate.toJSON ? ev.candidate.toJSON() : ev.candidate;

          wsSend({
            type: "signal",
            sessionId: SESSION_ID,
            signalType: "ice",
            payload,
          });
        };

        pc.onconnectionstatechange = () => {
          setStatus(`pc-${pc.connectionState}`);
        };

        // 3) WebSocket signaling
        setStatus("connecting-ws");
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          setStatus("ws-open");

          wsSend({ type: "hello", role });

          wsSend({
            type: "join_session",
            sessionId: SESSION_ID,
            role,
          });

          console.log("WS OUT: hello/join_session sent");
        };

        ws.onmessage = async (msg) => {
          const data = safeJsonParse(msg.data);
          if (!data) return;
          console.log("WS IN:", data);

          if (data.type === "error") {
            setError(`${data.code || "ERROR"}: ${data.message || ""}`);
            setStatus("error");
            return;
          }

          if (data.type === "session_joined" && data.sessionId === SESSION_ID) {
            setStatus(`session-joined-${data.status}`);
            if (data.status === "active") {
              await sendOffer();
            }
            return;
          }

          if (data.type === "peer_joined" && data.sessionId === SESSION_ID) {
            setStatus("peer-joined");
            if (data.role === "tech") {
              await sendOffer();
            }
            return;
          }

          if (data.type === "signal" && data.sessionId === SESSION_ID) {
            const pc = pcRef.current;
            if (!pc) return;

            if (data.signalType === "answer") {
              setStatus("received-answer");
              await pc.setRemoteDescription(data.payload);
              await flushPendingIce(pc);
              setStatus("connected-handshake");
              return;
            }

            if (data.signalType === "ice" && data.payload) {
              if (!pc.remoteDescription) {
                pendingIce.push(data.payload);
                return;
              }
              try {
                await pc.addIceCandidate(new RTCIceCandidate(data.payload));
              } catch (e) {
                console.warn("addIceCandidate failed:", e);
              }
              return;
            }

            if (data.signalType === "offer") {
              // fallback (not expected)
              setStatus("received-offer");
              await pc.setRemoteDescription(data.payload);
              await flushPendingIce(pc);

              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);

              wsSend({
                type: "signal",
                sessionId: SESSION_ID,
                signalType: "answer",
                payload: answer,
              });

              setStatus("sent-answer");
              return;
            }
          }

          if (data.type === "session_ended" && data.sessionId === SESSION_ID) {
            setStatus("session-ended");
          }
        };

        ws.onerror = () => {
          setError(
            "WebSocket error. Check NEXT_PUBLIC_BACKEND_WS and Codespaces port visibility."
          );
          setStatus("ws-error");
        };

        ws.onclose = () => {
          setStatus("ws-closed");
        };
      } catch (e) {
        setError(e?.message || String(e));
        setStatus("error");
      }
    }

    start();

    return () => {
      cancelled = true;
      try {
        wsRef.current?.close();
      } catch {}
      try {
        pcRef.current?.close();
      } catch {}
      try {
        localStreamRef.current?.getTracks()?.forEach((t) => t.stop());
      } catch {}
    };
  }, [SESSION_ID]);

  return (
    <div style={{ padding: 16, display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 320px" }}>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>
            Local (User)
          </div>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{ width: "100%", borderRadius: 12 }}
          />
        </div>

        <div style={{ flex: "1 1 320px" }}>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>
            Remote (Tech)
          </div>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ width: "100%", borderRadius: 12 }}
          />
          <div style={{ fontSize: 12, opacity: 0.65, marginTop: 6 }}>
            (Tech is receive-only right now, so this will stay blank until you enable tech camera.)
          </div>
        </div>
      </div>

      <div style={{ fontSize: 12, opacity: 0.85 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div>role: {role}</div>
          <div>session: {SESSION_ID || "—"}</div>
          <div>status: {status}</div>
          <button
            onClick={() => router.back()}
            style={{
              marginLeft: "auto",
              padding: "6px 10px",
              borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.12)",
              background: "white",
              cursor: "pointer",
            }}
          >
            Back
          </button>
        </div>
        {error ? <div style={{ marginTop: 8, color: "crimson" }}>{error}</div> : null}
      </div>
    </div>
  );
}
