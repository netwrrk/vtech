// frontend/app/dashboards/user/call/[sessionId]/page.js
"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { createSignalingClient } from "../../../../shared/sessions/signaling";
import { getSessionIdFromParams } from "../../../../shared/sessions/ids";
import { CALL_STATUS } from "../../../../shared/sessions/state";
import { startUserFlow } from "../../../../shared/webrtc/userFlow";

const WS_URL = process.env.NEXT_PUBLIC_BACKEND_WS;

export default function WebRtcCallUserPage() {
  const router = useRouter();
  const params = useParams();

  const SESSION_ID = getSessionIdFromParams(params);
  const role = "user";

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const signalingRef = useRef(null);
  const flowRef = useRef(null);

  const [status, setStatus] = useState(CALL_STATUS.INIT);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!SESSION_ID) {
      setStatus(CALL_STATUS.MISSING_SESSION);
      setError("Missing sessionId in the URL.");
      return;
    }
    if (!WS_URL) {
      setStatus(CALL_STATUS.MISSING_WS_URL);
      setError("Missing NEXT_PUBLIC_BACKEND_WS.");
      return;
    }

    let cancelled = false;

    async function start() {
      try {
        setError("");
        setStatus(CALL_STATUS.GETTING_MEDIA);

        // 1) Start WebRTC user flow (captures media + sets up PC)
        const flow = await startUserFlow({
          sessionId: SESSION_ID,
          localVideoRef,
          remoteVideoRef,
          sendSignal: (signalType, payload) => {
            const s = signalingRef.current;
            if (!s) return false;
            return s.signal(SESSION_ID, signalType, payload);
          },
          setStatus: (s) => setStatus(s),
        });

        flowRef.current = flow;

        // 2) WS signaling client
        setStatus(CALL_STATUS.CONNECTING_WS);

        const signaling = createSignalingClient({
          wsUrl: WS_URL,
          role,
          onOpen: () => {
            if (cancelled) return;

            setStatus(CALL_STATUS.WS_OPEN);

            // join session
            signaling.joinSession(SESSION_ID, "user");
            setStatus(CALL_STATUS.JOINING_SESSION);
          },
          onMessage: async (msg) => {
            if (cancelled) return;

            if (msg.type === "error") {
              setError(`${msg.code || "ERROR"}: ${msg.message || ""}`);
              setStatus(CALL_STATUS.ERROR);
              return;
            }

            if (msg.type === "session_joined" && msg.sessionId === SESSION_ID) {
              const st = String(msg.status || "").toLowerCase();
              setStatus(
                st === "active"
                  ? CALL_STATUS.SESSION_JOINED_ACTIVE
                  : CALL_STATUS.SESSION_JOINED_WAITING
              );

              // If tech already there, send offer immediately
              if (st === "active") {
                await flowRef.current?.maybeSendOffer?.();
              }
              return;
            }

            if (msg.type === "peer_joined" && msg.sessionId === SESSION_ID) {
              setStatus(CALL_STATUS.PEER_JOINED);

              // If the peer is tech, user should kick off offer
              if (msg.role === "tech") {
                await flowRef.current?.maybeSendOffer?.();
              }
              return;
            }

            if (msg.type === "peer_left" && msg.sessionId === SESSION_ID) {
              setStatus(CALL_STATUS.PEER_LEFT);
              return;
            }

            if (msg.type === "session_ended" && msg.sessionId === SESSION_ID) {
              setStatus(CALL_STATUS.SESSION_ENDED);
              return;
            }

            if (msg.type === "signal" && msg.sessionId === SESSION_ID) {
              const flowNow = flowRef.current;
              if (!flowNow) return;
              await flowNow.handleSignal(msg.signalType, msg.payload);
              return;
            }
          },
          onError: () => {
            if (cancelled) return;
            setError(
              "WebSocket error. Check NEXT_PUBLIC_BACKEND_WS and port visibility."
            );
            setStatus(CALL_STATUS.WS_ERROR);
          },
          onClose: () => {
            if (cancelled) return;
            setStatus(CALL_STATUS.WS_CLOSED);
          },
        });

        signalingRef.current = signaling;
        signaling.connect();
      } catch (e) {
        setError(e?.message || String(e));
        setStatus(CALL_STATUS.ERROR);
      }
    }

    start();

    return () => {
      cancelled = true;

      try {
        signalingRef.current?.close();
      } catch {}
      signalingRef.current = null;

      try {
        flowRef.current?.stop();
      } catch {}
      flowRef.current = null;
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
        {error ? (
          <div style={{ marginTop: 8, color: "crimson" }}>{error}</div>
        ) : null}
      </div>
    </div>
  );
}
