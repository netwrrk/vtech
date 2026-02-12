/**
 * USER WEBRTC FLOW MODULE
 * ------------------------------------------------------
 * Route: frontend/app/shared/webrtc/userFlow.js
 *
 * Purpose:
 * Encapsulate the user-side WebRTC lifecycle:
 * capture local media, create/send offer, handle answer,
 * and manage ICE candidate buffering.
 *
 * Core Responsibilities:
 * - Request camera + microphone via getUserMedia
 * - Attach local stream to video element
 * - Create RTCPeerConnection (sendrecv)
 * - Add local media tracks to peer
 * - Generate and send offer (once)
 * - Handle incoming answer + ICE candidates
 * - Queue ICE until remoteDescription is set
 * - Provide cleanup (stop media + close peer)
 *
 * Data Sources:
 * - Shared peer connection builder (peer.js)
 * - ICE queue utility (iceQueue.js)
 * - Signaling layer for offer/answer/ICE exchange
 * - Browser mediaDevices API
 *
 * Security / Env:
 * - Requires user media permissions (camera/mic)
 * - No direct environment variable usage
 * - ICE config delegated to shared ICE module
 */

import { createPeerConnection } from "./peer";
import { createIceQueue } from "./iceQueue";

/**
 * @typedef {Object} StartUserFlowOpts
 * @property {string} sessionId
 * @property {React.RefObject<HTMLVideoElement>} localVideoRef
 * @property {React.RefObject<HTMLVideoElement>} remoteVideoRef
 * @property {(signalType:"offer"|"answer"|"ice", payload:any)=>boolean} sendSignal
 * @property {(status:string)=>void} setStatus
 */

/**
 * Starts the user call flow and returns handles for cleanup + WS message handling.
 *
 * Usage:
 * - call startUserFlow()
 * - when WS receives {type:"signal", signalType, payload}, call handleSignal(...)
 * - when session is joined/peer joined, call maybeSendOffer()
 */
export async function startUserFlow(opts) {
  const sessionId = String(opts?.sessionId || "").trim();
  if (!sessionId) throw new Error("startUserFlow: missing sessionId");

  const localVideoRef = opts?.localVideoRef;
  const remoteVideoRef = opts?.remoteVideoRef;

  const sendSignal =
    typeof opts?.sendSignal === "function" ? opts.sendSignal : () => false;

  const setStatus =
    typeof opts?.setStatus === "function" ? opts.setStatus : () => {};

  let offerSent = false;
  let cancelled = false;

  const iceQ = createIceQueue();

  setStatus("getting-media");
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });

  if (cancelled) {
    // If caller cancelled while permissions prompt was open.
    try {
      stream.getTracks().forEach((t) => t.stop());
    } catch {}
    throw new Error("startUserFlow: cancelled");
  }

  if (localVideoRef?.current) {
    localVideoRef.current.srcObject = stream;
  }

  setStatus("creating-peer");
  const pc = await createPeerConnection({
    role: "user",
    remoteVideoRef,
    onLocalIce: (payload) => {
      sendSignal("ice", payload);
    },
    onPcState: (state) => setStatus(`pc-${state}`),
  });

  // Add user tracks
  stream.getTracks().forEach((t) => pc.addTrack(t, stream));

  async function maybeSendOffer() {
    if (offerSent) return;
    offerSent = true;

    setStatus("creating-offer");
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    sendSignal("offer", offer);
    setStatus("offer-sent");
  }

  /**
   * Handle incoming WS signal messages for this session.
   * @param {"offer"|"answer"|"ice"} signalType
   * @param {any} payload
   */
  async function handleSignal(signalType, payload) {
    if (!pc) return;

    if (signalType === "answer") {
      setStatus("received-answer");
      await pc.setRemoteDescription(payload);
      await iceQ.flush(pc);
      setStatus("connected-handshake");
      return;
    }

    if (signalType === "ice" && payload) {
      if (!pc.remoteDescription) {
        iceQ.push(payload);
        return;
      }
      try {
        await pc.addIceCandidate(new RTCIceCandidate(payload));
      } catch (e) {
        console.warn("addIceCandidate failed:", e);
      }
      return;
    }

    // Fallback (not expected in normal flow)
    if (signalType === "offer") {
      setStatus("received-offer");
      await pc.setRemoteDescription(payload);
      await iceQ.flush(pc);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      sendSignal("answer", answer);
      setStatus("sent-answer");
    }
  }

  function stop() {
    cancelled = true;
    try {
      pc?.close();
    } catch {}
    try {
      stream?.getTracks()?.forEach((t) => t.stop());
    } catch {}
  }

  return {
    pc,
    stream,
    maybeSendOffer,
    handleSignal,
    stop,
  };
}
