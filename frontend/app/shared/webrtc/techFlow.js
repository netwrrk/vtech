// frontend/app/shared/webrtc/techFlow.js
// Tech-side WebRTC flow: recvonly, handle offer -> answer, handle ICE with queue.

import { createPeerConnection } from "./peer";
import { createIceQueue } from "./iceQueue";

/**
 * @typedef {Object} StartTechFlowOpts
 * @property {string} sessionId
 * @property {React.RefObject<HTMLVideoElement>} remoteVideoRef
 * @property {(signalType:"offer"|"answer"|"ice", payload:any)=>boolean} sendSignal
 * @property {(status:string)=>void} setStatus
 */

/**
 * Starts the tech call flow and returns handles for cleanup + WS message handling.
 *
 * Usage:
 * - call startTechFlow()
 * - when WS receives {type:"signal", signalType, payload}, call handleSignal(...)
 * - tech generally waits for offer (from user)
 */
export async function startTechFlow(opts) {
  const sessionId = String(opts?.sessionId || "").trim();
  if (!sessionId) throw new Error("startTechFlow: missing sessionId");

  const remoteVideoRef = opts?.remoteVideoRef;

  const sendSignal =
    typeof opts?.sendSignal === "function" ? opts.sendSignal : () => false;

  const setStatus =
    typeof opts?.setStatus === "function" ? opts.setStatus : () => {};

  const iceQ = createIceQueue();

  setStatus("creating-peer");
  const pc = await createPeerConnection({
    role: "tech",
    remoteVideoRef,
    onLocalIce: (payload) => {
      sendSignal("ice", payload);
    },
    onPcState: (state) => setStatus(`pc-${state}`),
  });

  /**
   * Handle incoming WS signal messages for this session.
   * @param {"offer"|"answer"|"ice"} signalType
   * @param {any} payload
   */
  async function handleSignal(signalType, payload) {
    if (!pc) return;

    if (signalType === "offer") {
      setStatus("received-offer");

      await pc.setRemoteDescription(payload);
      await iceQ.flush(pc);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      sendSignal("answer", answer);
      setStatus("sent-answer");
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

    // Not expected for tech in your intended flow, but keep safe.
    if (signalType === "answer") {
      setStatus("received-answer");
      await pc.setRemoteDescription(payload);
      await iceQ.flush(pc);
      return;
    }
  }

  function stop() {
    try {
      pc?.close();
    } catch {}
  }

  return {
    pc,
    handleSignal,
    stop,
  };
}
