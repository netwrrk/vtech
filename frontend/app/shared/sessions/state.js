// frontend/app/shared/sessions/state.js
// Single source of truth for session/call UI statuses across pages.

export const CALL_STATUS = Object.freeze({
  INIT: "init",

  // preflight
  MISSING_SESSION: "missing-session",
  MISSING_WS_URL: "missing-ws-url",
  MISSING_TECH_ID: "missing-techId",

  // ws
  CONNECTING_WS: "connecting-ws",
  WS_OPEN: "ws-open",
  WS_ERROR: "ws-error",
  WS_CLOSED: "ws-closed",

  // presence (tech)
  PRESENCE_REGISTERING: "presence-registering",
  PRESENCE_REGISTERED: "presence-registered",

  // session
  JOINING_SESSION: "joining-session",
  SESSION_JOINED_WAITING: "session-joined-waiting",
  SESSION_JOINED_ACTIVE: "session-joined-active",
  PEER_JOINED: "peer-joined",
  PEER_LEFT: "peer-left",
  SESSION_ENDED: "session-ended",

  // webrtc setup
  GETTING_MEDIA: "getting-media",
  CREATING_PEER: "creating-peer",

  // offer/answer handshake
  CREATING_OFFER: "creating-offer",
  OFFER_SENT: "offer-sent",
  RECEIVED_OFFER: "received-offer",
  SENT_ANSWER: "sent-answer",
  RECEIVED_ANSWER: "received-answer",
  CONNECTED_HANDSHAKE: "connected-handshake",

  // generic
  ERROR: "error",
});

export function statusFromPcState(pcState) {
  return `pc-${String(pcState || "").trim().toLowerCase()}`;
}

export function isFatalStatus(status) {
  return (
    status === CALL_STATUS.ERROR ||
    status === CALL_STATUS.MISSING_SESSION ||
    status === CALL_STATUS.MISSING_WS_URL ||
    status === CALL_STATUS.MISSING_TECH_ID
  );
}

export function isSessionLive(status) {
  return (
    status === CALL_STATUS.SESSION_JOINED_ACTIVE ||
    status === CALL_STATUS.CONNECTED_HANDSHAKE ||
    String(status || "").startsWith("pc-")
  );
}
