"use client";

import { useEffect, useRef, useState } from "react";

const WS_URL = process.env.NEXT_PUBLIC_BACKEND_WS;

export default function WebRtcCallTechPage() {
  const SESSION_ID = "demo";
  const role = "tech";

  const localVideoRef = useRef(null); // unused for now (receive-only)
  const remoteVideoRef = useRef(null);

  const pcRef = useRef(null);
  const wsRef = useRef(null);

  const [status, setStatus] = useState("init");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let pendingIce = []; // candidates that arrive before remoteDescription

    async function start() {
      try {
        setStatus("starting");

        // ✅ TECH = receive-only for now (no getUserMedia).
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });
        pcRef.current = pc;

        // (Optional but helpful for receive-only)
        pc.addTransceiver("video", { direction: "recvonly" });
        pc.addTransceiver("audio", { direction: "recvonly" });

        pc.ontrack = (ev) => {
          const [remoteStream] = ev.streams;
          console.log("TRACK:", ev.track.kind, ev.streams?.[0]);
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

        setStatus("connecting-ws");
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          setStatus("ws-open");
          console.log("WS OUT: hello/join_session sent");

          ws.send(JSON.stringify({ type: "hello", role }));

          ws.send(
            JSON.stringify({
              type: "join_session",
              sessionId: SESSION_ID,
              role,
            })
          );
        };

        ws.onmessage = async (msg) => {
          const data = JSON.parse(msg.data);
          console.log("WS IN:", data);

          if (data.type === "error") {
            setError(`${data.code || "ERROR"}: ${data.message || ""}`);
            setStatus("error");
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

            if (data.signalType === "ice" && data.payload) {
              // If offer hasn't been set yet, queue it
              if (!pc.remoteDescription) {
                pendingIce.push(data.payload);
                return;
              }
              try {
                await pc.addIceCandidate(data.payload);
              } catch {}
              return;
            }

            if (data.signalType === "answer") {
              // Not expected for tech in this flow, but harmless
              setStatus("received-answer");
              await pc.setRemoteDescription(data.payload);
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
    };
  }, []);

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
        <div>role: {role}</div>
        <div>session: {SESSION_ID}</div>
        <div>status: {status}</div>
        {error ? (
          <div style={{ marginTop: 8, color: "crimson" }}>{error}</div>
        ) : null}
      </div>
    </div>
  );
}
