// frontend/app/shared/sessions/signaling.js
// Browser-side WS signaling client for VTech sessions.
// Matches backend protocol in server.js (hello, register_tech, call_request, join_session, signal, end_session, subscribe_presence).

export function safeJsonParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isWsOpen(ws) {
  return ws && ws.readyState === WebSocket.OPEN;
}

/**
 * Create a lightweight WS signaling client.
 *
 * @param {object} opts
 * @param {string} opts.wsUrl
 * @param {"user"|"tech"} opts.role
 * @param {(msg:any)=>void} [opts.onMessage]
 * @param {()=>void} [opts.onOpen]
 * @param {(ev:CloseEvent)=>void} [opts.onClose]
 * @param {(ev:Event)=>void} [opts.onError]
 * @param {(line:string)=>void} [opts.onLog]
 */
export function createSignalingClient(opts) {
  const wsUrl = String(opts?.wsUrl || "").trim();
  const role = opts?.role;

  if (!wsUrl) throw new Error("Missing wsUrl");
  if (role !== "user" && role !== "tech") throw new Error("Missing/invalid role");

  let ws = null;

  const onMessage = typeof opts.onMessage === "function" ? opts.onMessage : null;
  const onOpen = typeof opts.onOpen === "function" ? opts.onOpen : null;
  const onClose = typeof opts.onClose === "function" ? opts.onClose : null;
  const onError = typeof opts.onError === "function" ? opts.onError : null;
  const onLog = typeof opts.onLog === "function" ? opts.onLog : null;

  function log(line) {
    if (onLog) onLog(line);
  }

  function send(obj) {
    if (!isWsOpen(ws)) return false;
    try {
      ws.send(JSON.stringify(obj));
      return true;
    } catch {
      return false;
    }
  }

  function connect() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      return ws;
    }

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      log("ws open");
      // Always identify role first
      send({ type: "hello", role });
      if (onOpen) onOpen();
    };

    ws.onmessage = (ev) => {
      const msg = safeJsonParse(ev.data);
      if (!msg) return;

      // Optional: surface raw errors in logs
      if (msg.type === "error") {
        log(`WS ERROR ${msg.code || ""} ${msg.message || ""}`.trim());
      }

      if (onMessage) onMessage(msg);
    };

    ws.onerror = (ev) => {
      log("ws error");
      if (onError) onError(ev);
    };

    ws.onclose = (ev) => {
      log("ws closed");
      if (onClose) onClose(ev);
    };

    return ws;
  }

  function close() {
    try {
      ws?.close();
    } catch {}
    ws = null;
  }

  // ---- protocol helpers (match server.js) ----
  function hello() {
    return send({ type: "hello", role });
  }

  function registerTech(techId) {
    const id = String(techId || "").trim().toLowerCase();
    if (!id) return false;
    return send({ type: "register_tech", techId: id });
  }

  function subscribePresence() {
    return send({ type: "subscribe_presence" });
  }

  function callRequest(techId) {
    const id = String(techId || "").trim().toLowerCase();
    if (!id) return false;
    return send({ type: "call_request", techId: id });
  }

  function joinSession(sessionId, joinRole = role) {
    const sid = String(sessionId || "").trim();
    const r = joinRole === "user" || joinRole === "tech" ? joinRole : role;
    if (!sid) return false;
    return send({ type: "join_session", sessionId: sid, role: r });
  }

  function signal(sessionId, signalType, payload) {
    const sid = String(sessionId || "").trim();
    if (!sid) return false;
    if (!["offer", "answer", "ice"].includes(signalType)) return false;
    return send({
      type: "signal",
      sessionId: sid,
      signalType,
      payload,
    });
  }

  function endSession(sessionId) {
    const sid = String(sessionId || "").trim();
    if (!sid) return false;
    return send({ type: "end_session", sessionId: sid });
  }

  return {
    // lifecycle
    connect,
    close,

    // raw send access (sometimes useful)
    send,

    // state
    get ws() {
      return ws;
    },
    get isOpen() {
      return isWsOpen(ws);
    },

    // protocol
    hello,
    registerTech,
    subscribePresence,
    callRequest,
    joinSession,
    signal,
    endSession,
  };
}
