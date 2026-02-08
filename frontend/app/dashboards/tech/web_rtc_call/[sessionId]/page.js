"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const WS_URL = process.env.NEXT_PUBLIC_BACKEND_WS;

/**
 * ICE CONFIG SOURCE (STUN-only for now)
 * Later: replace to fetch STUN + TURN from backend
 */
async function getIceServers() {
  return [{ urls: "stun:stun.l.google.com:19302" }];
}

function getTechIdFromUrlOrStorage() {
  if (typeof window === "undefined") return "";
  const qs = new URLSearchParams(window.location.search);
  const fromQS = String(qs.get("techId") || "").trim().toLowerCase();
  const fromLS = String(localStorage.getItem("vtech.techId") || "")
    .trim()
    .toLowerCase();
  return fromQS || fromLS || "";
}

export default function WebRtcCallTechPage() {
  const router = useRouter();
  const params = useParams();

  const SESSION_ID = String(params?.sessionId || "").trim();
  const role = "tech";

  const localVideoRef = useRef(null); // unused for now (receive-only)
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);

  const pcRef = useRef(null);
  const wsRef = useRef(null);

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

    const TECH_ID = getTechIdFromUrlOrStorage();

    if (!TECH_ID) {
      setStatus("missing-techId");
      setError(
        "Missing techId. Add ?techId=maria-qsr to the URL or register once on Tech Dashboard so it saves to localStorage."
      );
      return;
    }

    let pendingIce = [];

    const safeParse = (s) => {
      try {
        return JSON.parse(s);
      } catch {
        return null;
      }
    };

    const wsSend = (obj) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return false;
      ws.send(JSON.stringify(obj));
      return true;
    };

    async function flushPendingIce(pc) {
      if (!pendingIce.length) return;
      const batch = pendingIce;
      pendingIce = [];
      for (const iceInit of batch) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(iceInit));
        } catch (e) {
          console.warn("addIceCandidate failed:", e);
        }
      }
    }

    async function start() {
      try {
        setStatus("starting");

        const iceServers = await getIceServers();
        const pc = new RTCPeerConnection({ iceServers });
        pcRef.current = pc;

                // --- TECH: get local media (audio + video) ---
        const localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        localStreamRef.current = localStream;

        // Optional: show tech's own camera
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        // Add tracks to PeerConnection (this makes tech a sender)
        for (const track of localStream.getTracks()) {
          pc.addTrack(track, localStream);
        }

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

        setStatus("connecting-ws");
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          setStatus("ws-open");

          // 1) Identify role
          wsSend({ type: "hello", role });

          // 2) ✅ Register presence on THIS WS connection (required by backend)
          wsSend({ type: "register_tech", techId: TECH_ID });

          // NOTE: join_session will be sent after register_tech_ack
        };

        ws.onmessage = async (msg) => {
          const data = safeParse(msg.data);
          if (!data) return;

          // errors
          if (data.type === "error") {
            setError(`${data.code || "ERROR"}: ${data.message || ""}`);
            setStatus("error");
            return;
          }

          // 3) ✅ Wait for ack before joining assigned session
          if (data.type === "register_tech_ack") {
            // keep techId sticky for future call pages
            try {
              localStorage.setItem("vtech.techId", String(data.techId || TECH_ID));
            } catch {}

            setStatus("presence-registered");

            wsSend({
              type: "join_session",
              sessionId: SESSION_ID,
              role,
            });

            setStatus("joining-session");
            return;
          }

          if (data.type === "session_joined" && data.sessionId === SESSION_ID) {
            setStatus(`session-joined-${data.status}`);
            return;
          }

          if (data.type === "peer_joined" && data.sessionId === SESSION_ID) {
            setStatus("peer-joined");
            return; // tech waits for offer
          }

          if (data.type === "signal" && data.sessionId === SESSION_ID) {
            if (data.signalType === "offer") {
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

            if (data.signalType === "answer") {
              // not expected for tech in this flow, but harmless
              setStatus("received-answer");
              await pc.setRemoteDescription(data.payload);
              return;
            }
          }

          if (data.type === "session_ended" && data.sessionId === SESSION_ID) {
            setStatus("session-ended");
          }
        };

        ws.onerror = () => {
          setError("WebSocket error. Check NEXT_PUBLIC_BACKEND_WS + port visibility.");
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
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      try {
        wsRef.current?.close();
        pcRef.current?.close();
      } catch {}
    };
  }, [SESSION_ID]);

  return (
    <div style={{ padding: 16, display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 320px" }}>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>
            Local (Tech)
          </div>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{ width: "100%", borderRadius: 12 }}
          />
          <div style={{ fontSize: 12, opacity: 0.65, marginTop: 6 }}>
            (Local disabled for now — receive-only)
          </div>
        </div>

        <div style={{ flex: "1 1 320px" }}>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>
            Remote (User)
          </div>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted
            style={{ width: "100%", borderRadius: 12 }}
          />
        </div>
      </div>

      <div style={{ fontSize: 12, opacity: 0.85 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div>role: tech</div>
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
