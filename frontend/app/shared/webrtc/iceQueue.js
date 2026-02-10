// frontend/app/shared/webrtc/iceQueue.js
// ICE candidate buffering until remoteDescription is set.
// Prevents addIceCandidate errors during offer/answer race.

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
