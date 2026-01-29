"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

const WS_URL = process.env.NEXT_PUBLIC_BACKEND_WS;

function makeRoomCode7() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < 7; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export default function WebRtcCallUserPage() {
  const role = "user";

  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const techId = params?.techId;

  // Pull session from query: ?session=XXXXXXX
  const sessionFromUrl = (searchParams.get("session") || "").trim();

  const [sessionId, setSessionId] = useState(sessionFromUrl);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const pcRef = useRef(null);
  const wsRef = useRef(null);
  const localStreamRef = useRef(null);

  const [status, setStatus] = useState("init");
  const [error, setError] = useState("");

  // Ensure we always have a session in the URL (Option A)
  useEffect(() => {
    if (sessionFromUrl && sessionFromUrl !== sessionId) {
      setSessionId(sessionFromUrl);
      return;
    }

    if (!sessionFromUrl) {
      const fresh = makeRoomCode7();
      router.replace(
        `/dashboards/user/web_rtc_call/${encodeURIComponent(techId)}?session=${fresh}`
      );
    }
  }, [sessionFromUrl, sessionId, router, techId]);

  useEffect(() => {
    // Don't start until we have a valid sessionId from the URL
    if (!sessionId) return;

    const SESSION_ID = sessionId;

    let cancelled = false;
    let offerSent = false;
    let pendingIce = []; // candidates that arrive before remoteDescription

    async function sendOffer(ws) {
      if (offerSent) return;
      const pc = pcRef.current;
      if (!pc) return;

      offerSent = true;
      setStatus("creating-offer");

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      ws.send(
        JSON.stringify({
          type: "signal",
          sessionId: SESSION_ID,
          signalType: "offer",
          payload: offer,
        })
      );

      setStatus("offer-sent");
      console.log("WS OUT: offer sent");
    }

    async function start() {
      try {
        setError("");
        setStatus("starting");

        // 1) Media
        setStatus("getting-media");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (cancelled) return;

        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

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
          if (wsRef.current?.readyState !== WebSocket.OPEN) return;

          wsRef.current.send(
            JSON.stringify({
              type: "signal",
              sessionId: SESSION_ID,
              signalType: "ice",
              payload: ev.candidate,
            })
          );
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
          console.log("WS OUT: hello/create_session sent");

          ws.send(JSON.stringify({ type: "hello", role }));

          // Create session first (collision-safe on backend)
          ws.send(
            JSON.stringify({
              type: "create_session",
              sessionId: SESSION_ID,
            })
          );
        };

        ws.onmessage = async (msg) => {
          const data = JSON.parse(msg.data);
          console.log("WS IN:", data);

          // Handle collision specifically (you said YES to prevention)
          if (data.type === "error" && data.code === "SESSION_TAKEN") {
            const fresh = makeRoomCode7();
            router.replace(
              `/dashboards/user/web_rtc_call/${encodeURIComponent(techId)}?session=${fresh}`
            );
            return;
          }

          // Other errors
          if (data.type === "error") {
            setError(`${data.code || "ERROR"}: ${data.message || ""}`);
            setStatus("error");
            return;
          }

          // After creating the session, join it
          if (data.type === "session_created" && data.sessionId === SESSION_ID) {
            console.log("WS OUT: join_session sent");
            ws.send(
              JSON.stringify({
                type: "join_session",
                sessionId: SESSION_ID,
                role,
              })
            );
            return;
          }

          // Join ack; if session is already active, tech is already there → offer now.
          if (data.type === "session_joined" && data.sessionId === SESSION_ID) {
            setStatus(`session-joined-${data.status}`);
            if (data.status === "active") {
              await sendOffer(ws);
            }
            return;
          }

          // If user is first, server will send peer_joined when tech joins → offer now.
          if (data.type === "peer_joined" && data.sessionId === SESSION_ID) {
            setStatus("peer-joined");
            if (data.role === "tech") {
              await sendOffer(ws);
            }
            return;
          }

          // Relayed WebRTC signals
          if (data.type === "signal" && data.sessionId === SESSION_ID) {
            const pc = pcRef.current;
            if (!pc) return;

            if (data.signalType === "answer") {
              setStatus("received-answer");
              await pc.setRemoteDescription(data.payload);

              // flush any ICE that arrived early
              if (pendingIce.length) {
                const toAdd = pendingIce;
                pendingIce = [];
                for (const c of toAdd) {
                  try {
                    await pc.addIceCandidate(c);
                  } catch {}
                }
              }

              setStatus("connected-handshake");
              return;
            }

            if (data.signalType === "ice" && data.payload) {
              if (!pc.remoteDescription) {
                pendingIce.push(data.payload);
                return;
              }
              try {
                await pc.addIceCandidate(data.payload);
              } catch {}
              return;
            }

            if (data.signalType === "offer") {
              setStatus("received-offer");
              await pc.setRemoteDescription(data.payload);
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);

              ws.send(
                JSON.stringify({
                  type: "signal",
                  sessionId: SESSION_ID,
                  signalType: "answer",
                  payload: answer,
                })
              );

              setStatus("sent-answer");
              return;
            }
          }
        };

        ws.onerror = () => {
          setError(
            "WebSocket error. Check NEXT_PUBLIC_BACKEND_WS and Codespaces port 8080 visibility."
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
  }, [sessionId, router, techId]); // <-- reruns cleanly when we regenerate session

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
        </div>
      </div>

      <div style={{ fontSize: 12, opacity: 0.85 }}>
        <div>role: {role}</div>
        <div>session: {sessionId}</div>
        <div>status: {status}</div>
        {error ? (
          <div style={{ marginTop: 8, color: "crimson" }}>{error}</div>
        ) : null}
      </div>
    </div>
  );
}
