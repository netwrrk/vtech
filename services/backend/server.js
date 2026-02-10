import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { WebSocketServer } from "ws";
import { nanoid } from "nanoid";
import { z } from "zod";

const PORT = Number(process.env.PORT || 8080);

// Keep “waiting” sessions alive briefly so navigation / socket churn doesn’t delete them.
const WAITING_TTL_MS = Number(process.env.WAITING_TTL_MS || 5 * 60 * 1000); // 5 min
const ACTIVE_TTL_MS = Number(process.env.ACTIVE_TTL_MS || 60 * 60 * 1000); // 60 min
const CLEANUP_INTERVAL_MS = Number(process.env.CLEANUP_INTERVAL_MS || 30 * 1000); // 30s

const app = express();
app.use(cors());
app.use(express.json());

app.get("/healthz", (_req, res) => res.status(200).send("ok"));

const server = http.createServer(app);

// ---- In-memory session store (Phase 1) ----
// sessionId -> {
//   sessionId,
//   status: "waiting" | "active",
//   user: { wsId } | null,
//   tech: { wsId } | null,
//   requestedTechId?,
//   createdByWsId?,
//   createdAt,
//   expiresAt
// }
const sessions = new Map(); // sessionId -> session
const clients = new Map(); // wsId -> ws

// ---- Presence store (Phase 1) ----
// techId -> wsId (single active connection per techId for MVP)
const techPresence = new Map(); // techId -> wsId
const wsIdToTechId = new Map(); // wsId -> techId

// subscribers that want presence updates (usually user dashboards)
const presenceSubscribers = new Set(); // wsId

const wss = new WebSocketServer({ server, path: "/ws" });

/* -------------------- schemas -------------------- */
const BaseMsg = z.object({
  type: z.string(),
  requestId: z.string().optional(),
});

const HelloMsg = BaseMsg.extend({
  type: z.literal("hello"),
  role: z.enum(["user", "tech"]),
});

const CreateSessionMsg = BaseMsg.extend({
  type: z.literal("create_session"),
  sessionId: z.string().optional(),
  requestedTechId: z.string().optional(),
});

const JoinSessionMsg = BaseMsg.extend({
  type: z.literal("join_session"),
  sessionId: z.string(),
  role: z.enum(["user", "tech"]),
});

const SignalMsg = BaseMsg.extend({
  type: z.literal("signal"),
  sessionId: z.string(),
  signalType: z.enum(["offer", "answer", "ice"]),
  payload: z.unknown(),
});

const EndSessionMsg = BaseMsg.extend({
  type: z.literal("end_session"),
  sessionId: z.string(),
});

// Presence messages
const RegisterTechMsg = BaseMsg.extend({
  type: z.literal("register_tech"),
  techId: z.string().min(1),
});

const SubscribePresenceMsg = BaseMsg.extend({
  type: z.literal("subscribe_presence"),
});

// Call (Phase 1)
const CallRequestMsg = BaseMsg.extend({
  type: z.literal("call_request"),
  techId: z.string().min(1),
});

const AnyMsg = z.union([
  HelloMsg,
  CreateSessionMsg,
  JoinSessionMsg,
  SignalMsg,
  EndSessionMsg,
  RegisterTechMsg,
  SubscribePresenceMsg,
  CallRequestMsg,
]);


/* -------------------- helpers -------------------- */
function now() {
  return Date.now();
}

function normTechId(x) {
  return String(x || "").trim().toLowerCase();
}

function send(ws, obj) {
  // ws.OPEN isn’t a stable instance property across libs; use readyState === 1
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj));
}

function broadcastToSessionPeer(session, fromRole, msg) {
  const target = fromRole === "user" ? session.tech?.wsId : session.user?.wsId;
  if (!target) return false;

  const peerWs = clients.get(target);
  if (!peerWs) return false;

  send(peerWs, msg);
  return true;
}

/* -------------------- presence helpers -------------------- */
function onlineTechIds() {
  return Array.from(techPresence.keys());
}

function broadcastPresenceUpdate(payload) {
  for (const subWsId of presenceSubscribers) {
    const subWs = clients.get(subWsId);
    if (!subWs) continue;
    send(subWs, { type: "presence_update", ...payload });
  }
}

function sendPresenceState(ws) {
  send(ws, { type: "presence_state", onlineTechIds: onlineTechIds() });
}

function markTechOnline(wsId, techId) {
  const prevWsId = techPresence.get(techId);
  if (prevWsId && prevWsId !== wsId) {
    wsIdToTechId.delete(prevWsId);
  }

  techPresence.set(techId, wsId);
  wsIdToTechId.set(wsId, techId);

  broadcastPresenceUpdate({ techId, online: true });
}

function markTechOfflineByWsId(wsId) {
  const techId = wsIdToTechId.get(wsId);
  if (!techId) return;

  const current = techPresence.get(techId);
  if (current === wsId) {
    techPresence.delete(techId);
    broadcastPresenceUpdate({ techId, online: false });
  }

  wsIdToTechId.delete(wsId);
}

/* -------------------- session ttl -------------------- */
function extendExpiry(session) {
  session.expiresAt =
    session.status === "active" ? now() + ACTIVE_TTL_MS : now() + WAITING_TTL_MS;
}

function isExpired(session) {
  const exp = Number(session?.expiresAt || 0);
  return exp > 0 && now() > exp;
}

// periodic cleanup to avoid memory leaks
setInterval(() => {
  for (const [sid, s] of sessions.entries()) {
    if (isExpired(s)) sessions.delete(sid);
  }
}, CLEANUP_INTERVAL_MS);

/* -------------------- ws server -------------------- */
wss.on("connection", (ws) => {
  const wsId = nanoid(10);
  ws._id = wsId;
  ws._role = null;

  clients.set(wsId, ws);

  // greet
  send(ws, { type: "connected", wsId });

  ws.on("message", (raw) => {
    let parsed;
    try {
      parsed = JSON.parse(raw.toString());
    } catch {
      return send(ws, {
        type: "error",
        code: "BAD_JSON",
        message: "Invalid JSON.",
      });
    }

    const res = AnyMsg.safeParse(parsed);
    if (!res.success) {
      return send(ws, {
        type: "error",
        code: "BAD_MESSAGE",
        message: "Message failed validation.",
        details: res.error.issues,
      });
    }

    const msg = res.data;

    // ---- hello ----
    if (msg.type === "hello") {
      ws._role = msg.role;
      return send(ws, { type: "hello_ack", wsId, role: ws._role });
    }

    // ---- presence: tech registers ----
    if (msg.type === "register_tech") {
      const techId = normTechId(msg.techId);
      if (!techId) {
        return send(ws, {
          type: "error",
          code: "BAD_TECH_ID",
          message: "techId is required.",
        });
      }

      markTechOnline(wsId, techId);

      return send(ws, {
        type: "register_tech_ack",
        techId,
      });
    }

    // ---- presence: user dashboard subscribes ----
    if (msg.type === "subscribe_presence") {
      presenceSubscribers.add(wsId);
      sendPresenceState(ws);
      return;
    }

    // ---- call request: user -> tech ----
    // KEY FIX:
    // - create session WITHOUT binding user to this ephemeral socket
    // - give it a TTL so it survives navigation
    if (msg.type === "call_request") {
      const techId = normTechId(msg.techId);
      if (!techId) {
        return send(ws, {
          type: "error",
          code: "BAD_TECH_ID",
          message: "techId is required.",
        });
      }

      const techWsId = techPresence.get(techId);
      const techWs = techWsId ? clients.get(techWsId) : null;

      if (!techWsId || !techWs) {
        return send(ws, {
          type: "error",
          code: "TECH_OFFLINE",
          message: "Requested tech is not online.",
        });
      }

      const sessionId = nanoid(8).toUpperCase();
      const session = {
        sessionId,
        status: "waiting",
        user: null, // <-- important: user will join from the call page socket
        tech: null,
        requestedTechId: techId,
        createdByWsId: wsId,
        createdAt: now(),
        expiresAt: now() + WAITING_TTL_MS,
      };

      sessions.set(sessionId, session);

      // Notify user (caller)
      send(ws, { type: "call_created", sessionId, techId });

      // Notify tech (incoming)
      send(techWs, {
        type: "incoming_call",
        sessionId,
        techId,
        from: { role: "user" },
      });

      return;
    }

    if (msg.type === "create_session") {
  // If client requests a specific sessionId, enforce format + uniqueness
  const requested = String(msg.sessionId || "").trim();

  if (requested) {
    const ok = /^[A-Z0-9]{7}$/.test(requested);
    if (!ok) {
      return send(ws, {
        type: "error",
        code: "BAD_SESSION_ID",
        message: "sessionId must be 7 chars (A-Z, 0-9).",
      });
    }

    if (sessions.has(requested)) {
      return send(ws, {
        type: "error",
        code: "SESSION_TAKEN",
        message: "Session already exists.",
      });
    }

    const session = {
      sessionId: requested,
      status: "waiting",
      user: null,
      tech: null,
      requestedTechId: msg.requestedTechId ? normTechId(msg.requestedTechId) : undefined,
      createdByWsId: wsId,
      createdAt: now(),
      expiresAt: now() + WAITING_TTL_MS,
    };

    sessions.set(requested, session);
    return send(ws, { type: "session_created", sessionId: requested });
  }

  // Otherwise server generates one (collision-safe)
  let sessionId;
  do {
    sessionId = nanoid(7).toUpperCase().replace(/[^A-Z0-9]/g, "A");
  } while (sessions.has(sessionId));

  const session = {
    sessionId,
    status: "waiting",
    user: null,
    tech: null,
    createdByWsId: wsId,
    createdAt: now(),
    expiresAt: now() + WAITING_TTL_MS,
  };

  sessions.set(sessionId, session);
  return send(ws, { type: "session_created", sessionId });
  }


    // ---- join_session ----
    if (msg.type === "join_session") {
      const session = sessions.get(msg.sessionId);
      if (!session || isExpired(session)) {
        if (session) sessions.delete(msg.sessionId);
        return send(ws, {
          type: "error",
          code: "NO_SESSION",
          message: "Session not found.",
        });
      }

      // Enforce assigned tech on call_request sessions
      if (msg.role === "tech" && session.requestedTechId) {
        const myTechId = normTechId(wsIdToTechId.get(wsId));
        if (!myTechId) {
          return send(ws, {
            type: "error",
            code: "TECH_NOT_REGISTERED",
            message: "Tech must register presence before joining assigned sessions.",
          });
        }
        if (myTechId !== normTechId(session.requestedTechId)) {
          return send(ws, {
            type: "error",
            code: "NOT_AUTHORIZED",
            message: "This session is assigned to a different tech.",
          });
        }
      }

      // attach by role (idempotent for same wsId)
      if (msg.role === "user") {
        if (session.user && session.user.wsId !== wsId) {
          return send(ws, {
            type: "error",
            code: "ROLE_TAKEN",
            message: "User slot already taken.",
          });
        }
        session.user = { wsId };
      } else {
        if (session.tech && session.tech.wsId !== wsId) {
          return send(ws, {
            type: "error",
            code: "ROLE_TAKEN",
            message: "Tech slot already taken.",
          });
        }
        session.tech = { wsId };
      }

      session.status = session.user && session.tech ? "active" : "waiting";
      extendExpiry(session);

      // ack to joiner
      send(ws, {
        type: "session_joined",
        sessionId: session.sessionId,
        role: msg.role,
        status: session.status,
      });

      // notify the other side (if present)
      broadcastToSessionPeer(session, msg.role, {
        type: "peer_joined",
        sessionId: session.sessionId,
        role: msg.role,
        status: session.status,
      });

      return;
    }

    // ---- signal ----
    if (msg.type === "signal") {
      const session = sessions.get(msg.sessionId);
      if (!session || isExpired(session)) {
        if (session) sessions.delete(msg.sessionId);
        return send(ws, {
          type: "error",
          code: "NO_SESSION",
          message: "Session not found.",
        });
      }

      const fromRole =
        session.user?.wsId === wsId
          ? "user"
          : session.tech?.wsId === wsId
          ? "tech"
          : null;

      if (!fromRole) {
        return send(ws, {
          type: "error",
          code: "NOT_IN_SESSION",
          message: "You are not part of this session.",
        });
      }

      const ok = broadcastToSessionPeer(session, fromRole, {
        type: "signal",
        sessionId: msg.sessionId,
        signalType: msg.signalType,
        payload: msg.payload,
      });

      if (!ok) {
        return send(ws, {
          type: "error",
          code: "NO_PEER",
          message: "Peer not connected yet.",
        });
      }

      return;
    }

    // ---- end_session ----
    if (msg.type === "end_session") {
      const session = sessions.get(msg.sessionId);
      if (!session)
        return send(ws, {
          type: "error",
          code: "NO_SESSION",
          message: "Session not found.",
        });

      const userWs = session.user?.wsId ? clients.get(session.user.wsId) : null;
      const techWs = session.tech?.wsId ? clients.get(session.tech.wsId) : null;

      if (userWs) send(userWs, { type: "session_ended", sessionId: msg.sessionId });
      if (techWs) send(techWs, { type: "session_ended", sessionId: msg.sessionId });

      sessions.delete(msg.sessionId);
      return;
    }
  });

  ws.on("close", () => {
    clients.delete(wsId);

    // presence cleanup
    presenceSubscribers.delete(wsId);
    markTechOfflineByWsId(wsId);

    // clean up sessions where this wsId was user/tech
    for (const [sid, session] of sessions.entries()) {

      let changed = false;

      if (session.user?.wsId === wsId) {
        session.user = null;
        changed = true;
      }
      if (session.tech?.wsId === wsId) {
        session.tech = null;
        changed = true;
      }

      if (!changed) continue;

      session.status = session.user && session.tech ? "active" : "waiting";
      extendExpiry(session);

      // notify remaining peer
      const remaining = session.user?.wsId
        ? clients.get(session.user.wsId)
        : session.tech?.wsId
        ? clients.get(session.tech.wsId)
        : null;

      if (remaining) {
        send(remaining, {
          type: "peer_left",
          sessionId: sid,
          status: session.status,
        });
      } else {
        // IMPORTANT:
        // Do NOT delete immediately — let TTL cleanup remove it.
        // This prevents the call_request socket closing from nuking the session before join.
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
  console.log(`WS signaling on ws://localhost:${PORT}/ws`);
  console.log(
    `TTL: waiting=${WAITING_TTL_MS}ms active=${ACTIVE_TTL_MS}ms cleanup=${CLEANUP_INTERVAL_MS}ms`
  );
});
