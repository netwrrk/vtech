/**
 * ICE CONFIG MODULE
 * ------------------------------------------------------
 * Route: frontend/app/shared/webrtc/ice.js
 *
 * Purpose:
 * Provide centralized ICE server configuration for
 * all WebRTC peer connections (user + tech).
 *
 * Core Responsibilities:
 * - Return ICE server list for RTCPeerConnection
 * - Currently provides STUN-only configuration
 * - Designed to support future backend-fetched TURN servers
 *
 * Data Sources:
 * - Static STUN server (Google STUN)
 * - Future: backend endpoint for dynamic STUN/TURN
 *
 * Security / Env:
 * - No required env variables in current MVP
 * - Future version may depend on NEXT_PUBLIC_BACKEND_HTTP
 */

export async function getIceServers() {
  // For MVP keep it simple + reliable.
  // Later, replace with something like:
  // const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_HTTP}/ice`, { cache: "no-store" });
  // return await res.json();
  return [{ urls: "stun:stun.l.google.com:19302" }];
}
