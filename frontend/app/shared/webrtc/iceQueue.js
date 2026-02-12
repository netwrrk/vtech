/**
 * ICE QUEUE MODULE
 * ------------------------------------------------------
 * Route: frontend/app/shared/webrtc/iceQueue.js
 *
 * Purpose:
 * Buffer incoming ICE candidates until the peer
 * connection has a remoteDescription set, preventing
 * race-condition errors during offer/answer exchange.
 *
 * Core Responsibilities:
 * - Temporarily store ICE candidates
 * - Safely flush candidates into RTCPeerConnection
 * - Prevent addIceCandidate failures during signaling races
 * - Provide queue state helpers (hasPending, clear)
 *
 * Data Sources:
 * - Incoming WebRTC ICE candidates from signaling layer
 *
 * Security / Env:
 * - No environment dependencies
 * - Pure client-side WebRTC utility
 */

export function createIceQueue() {
  /** @type {any[]} */
  let pending = [];

  function push(iceInit) {
    if (!iceInit) return;
    pending.push(iceInit);
  }

  function clear() {
    pending = [];
  }

  function hasPending() {
    return pending.length > 0;
  }

  /**
   * Flush queued ICE into the peer connection.
   * Safe to call multiple times.
   * @param {RTCPeerConnection} pc
   */
  async function flush(pc) {
    if (!pc || !pending.length) return;

    const batch = pending;
    pending = [];

    for (const iceInit of batch) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(iceInit));
      } catch (e) {
        // Don't hard-fail the session; just warn.
        console.warn("addIceCandidate failed:", e);
      }
    }
  }

  return {
    push,
    flush,
    clear,
    hasPending,
  };
}
