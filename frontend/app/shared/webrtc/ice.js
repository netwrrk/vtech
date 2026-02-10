// frontend/app/shared/webrtc/ice.js
// Centralized ICE server config.
// Today: STUN-only. Later: fetch STUN+TURN from backend.

export async function getIceServers() {
  // For MVP keep it simple + reliable.
  // Later, replace with something like:
  // const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_HTTP}/ice`, { cache: "no-store" });
  // return await res.json();
  return [{ urls: "stun:stun.l.google.com:19302" }];
}
