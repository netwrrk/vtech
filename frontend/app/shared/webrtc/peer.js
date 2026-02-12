/**
 * PEER CONNECTION MODULE
 * ------------------------------------------------------
 * Route: frontend/app/shared/webrtc/peer.js
 *
 * Purpose:
 * Create and configure a shared RTCPeerConnection
 * instance for both user and tech call flows.
 *
 * Core Responsibilities:
 * - Initialize RTCPeerConnection with ICE config
 * - Configure role-based behavior (user vs tech)
 * - Wire remote media to video element
 * - Emit local ICE candidates to signaling layer
 * - Surface connection state changes
 * - Provide safe peer shutdown helper
 *
 * Data Sources:
 * - ICE configuration from getIceServers()
 * - Media tracks (added in userFlow or techFlow)
 * - Signaling layer for ICE exchange
 *
 * Security / Env:
 * - Depends indirectly on ICE config (may later use backend env)
 * - No direct environment variable access
 */

import { getIceServers } from "./ice";

/**
 * @typedef {Object} CreatePeerOpts
 * @property {"user"|"tech"} role
 * @property {React.RefObject<HTMLVideoElement>} remoteVideoRef
 * @property {(payload:any)=>void} onLocalIce  Called when we produce an ICE candidate (send via WS)
 * @property {(state:string)=>void} [onPcState] Connection state updates
 */

/**
 * Create and wire a RTCPeerConnection for user/tech.
 * - tech: recvonly transceivers (no camera yet)
 * - user: caller adds tracks elsewhere (userFlow)
 *
 * @param {CreatePeerOpts} opts
 * @returns {Promise<RTCPeerConnection>}
 */
export async function createPeerConnection(opts) {
  const role = opts?.role;
  if (role !== "user" && role !== "tech") {
    throw new Error("createPeerConnection: role must be 'user' or 'tech'");
  }

  const remoteVideoRef = opts?.remoteVideoRef;
  const onLocalIce = typeof opts?.onLocalIce === "function" ? opts.onLocalIce : null;
  const onPcState = typeof opts?.onPcState === "function" ? opts.onPcState : null;

  const iceServers = await getIceServers();

  const pc = new RTCPeerConnection({ iceServers });

  if (role === "tech") {
    // receive-only for now
    pc.addTransceiver("video", { direction: "recvonly" });
    pc.addTransceiver("audio", { direction: "recvonly" });
  }
  // role === "user": addTrack happens in userFlow.js

  pc.ontrack = (ev) => {
    const [remoteStream] = ev.streams;
    if (remoteVideoRef?.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  };

  pc.onicecandidate = (ev) => {
    if (!ev.candidate || !onLocalIce) return;

    // Serialize ICE properly (RTCICECandidate isn't structured-clone safe)
    const payload = ev.candidate.toJSON ? ev.candidate.toJSON() : ev.candidate;

    onLocalIce(payload);
  };

  pc.onconnectionstatechange = () => {
    if (onPcState) onPcState(pc.connectionState);
  };

  return pc;
}

/**
 * Close peer safely.
 * @param {RTCPeerConnection|null} pc
 */
export function closePeer(pc) {
  try {
    pc?.close();
  } catch {}
}
