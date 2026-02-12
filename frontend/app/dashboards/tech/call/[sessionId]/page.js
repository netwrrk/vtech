/**
 * TECH WEBRTC CALL PAGE
 * ------------------------------------------------------
 * Route: frontend/app/dashboards/tech/call/[sessionId]/page.js
 *
 * Purpose:
 * Handles the live WebRTC session for a Tech user.
 * Connects to backend signaling, joins the assigned
 * session, and receives the User’s media stream.
 *
 * Core Responsibilities:
 * - Extract sessionId from route params
 * - Resolve and persist techId (URL or localStorage)
 * - Initialize receive-only WebRTC flow (startTechFlow)
 * - Establish WebSocket signaling connection
 * - Register tech presence before joining session
 * - Handle signaling messages (offer, answer, ICE)
 * - Reflect connection state via shared CALL_STATUS
 * - Attach remote user stream to video element
 *
 * Data Sources:
 * - shared/sessions/signaling (WS abstraction)
 * - shared/sessions/ids (session + techId helpers)
 * - shared/sessions/state (call status constants)
 * - shared/webrtc/techFlow (WebRTC logic)
 * - Backend WebSocket signaling server
 *
 * Security / Env:
 * - Requires NEXT_PUBLIC_BACKEND_WS
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { createSignalingClient } from "../../../../shared/sessions/signaling";
import {
  getSessionIdFromParams,
  getTechIdFromUrlOrStorage,
  storeTechId,
} from "../../../../shared/sessions/ids";
import { CALL_STATUS, statusFromPcState } from "../../../../shared/sessions/state";
import { startTechFlow } from "../../../../shared/webrtc/techFlow";

const WS_URL = process.env.NEXT_PUBLIC_BACKEND_WS;

export default function WebRtcCallTechPage() {
  const router = useRouter();
  const params = useParams();

  const SESSION_ID = getSessionIdFromParams(params);
  const role = "tech";

  const localVideoRef = useRef(null); // still unused (receive-only)
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

    const TECH_ID = getTechIdFromUrlOrStorage();
    if (!TECH_ID) {
      setStatus(CALL_STATUS.MISSING_TECH_ID);
      setError(
        "Missing techId. Add ?techId=maria-qsr to the URL or register once on Tech Dashboard so it saves to localStorage."
      );
      return;
    }

    let cancelled = false;

    async function start() {
      try {
        setError("");
        setStatus(CALL_STATUS.CREATING_PEER);

        // 1) Start WebRTC (recvonly) flow
        const flow = await startTechFlow({
          sessionId: SESSION_ID,
          remoteVideoRef,
          sendSignal: (signalType, payload) => {
            const s = signalingRef.current;
            if (!s) return false;
            return s.signal(SESSION_ID, signalType, payload);
          },
          setStatus: (s) => {
            // normalize pc-* statuses into shared naming
            if (String(s || "").startsWith("pc-")) setStatus(s);
            else setStatus(s);
          },
        });

        flowRef.current = flow;

        // 2) WS signaling client
        setStatus(CALL_STATUS.CONNECTING_WS);

        const signaling = createSignalingClient({
          wsUrl: WS_URL,
          role,
          onOpen: () => {
            if (cancelled) return;

            // Must register presence on THIS WS connection (backend requires it)
            setStatus(CALL_STATUS.PRESENCE_REGISTERING);
            signaling.registerTech(TECH_ID);
          },
          onMessage: async (msg) => {
            if (cancelled) return;

            // errors
            if (msg.type === "error") {
              setError(`${msg.code || "ERROR"}: ${msg.message || ""}`);
              setStatus(CALL_STATUS.ERROR);
              return;
            }

            // ✅ Gate: wait for register_tech_ack before joining assigned sessions
            if (msg.type === "register_tech_ack") {
              const ackId = String(msg.techId || TECH_ID).trim().toLowerCase();
              if (ackId) storeTechId(ackId);

              setStatus(CALL_STATUS.PRESENCE_REGISTERED);

              signaling.joinSession(SESSION_ID, "tech");
              setStatus(CALL_STATUS.JOINING_SESSION);
              return;
            }

            if (msg.type === "session_joined" && msg.sessionId === SESSION_ID) {
              const st = String(msg.status || "").toLowerCase();
              setStatus(
                st === "active"
                  ? CALL_STATUS.SESSION_JOINED_ACTIVE
                  : CALL_STATUS.SESSION_JOINED_WAITING
              );
              return;
            }

            if (msg.type === "peer_joined" && msg.sessionId === SESSION_ID) {
              setStatus(CALL_STATUS.PEER_JOINED);
              return; // tech waits for offer
            }

            if (msg.type === "peer_left" && msg.sessionId === SESSION_ID) {
              setStatus(CALL_STATUS.PEER_LEFT);
              return;
            }

            if (msg.type === "session_ended" && msg.sessionId === SESSION_ID) {
              setStatus(CALL_STATUS.SESSION_ENDED);
              return;
            }

            // WebRTC signaling
            if (msg.type === "signal" && msg.sessionId === SESSION_ID) {
              const flowNow = flowRef.current;
              if (!flowNow) return;

              // forward into shared tech flow
              await flowNow.handleSignal(msg.signalType, msg.payload);

              // reflect pc state changes if needed
              // (techFlow sets statuses like "received-offer", "sent-answer", etc.)
              return;
            }
          },
          onError: () => {
            if (cancelled) return;
            setError("WebSocket error. Check NEXT_PUBLIC_BACKEND_WS + port visibility.");
            setStatus(CALL_STATUS.WS_ERROR);
          },
          onClose: () => {
            if (cancelled) return;
            setStatus(CALL_STATUS.WS_CLOSED);
          },
        });

        signalingRef.current = signaling;
        signaling.connect();
        setStatus(CALL_STATUS.WS_OPEN);
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

  // Keep the same simple debug UI for now (we'll swap to Call UI next step)
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
          <div>
            status:{" "}
            {String(status || "").startsWith("pc-")
              ? statusFromPcState(status.replace("pc-", ""))
              : status}
          </div>
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
