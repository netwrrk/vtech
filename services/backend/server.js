import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { WebSocketServer } from "ws";
import { nanoid } from "nanoid";
import { z } from "zod";

const PORT = Number(process.env.PORT || 8080);

const app = express();
app.use(cors());
app.use(express.json());

app.get("/healthz", (_req, res) => res.status(200).send("ok"));

const server = http.createServer(app);

// ---- In-memory session store (Phase 1) ----
// sessionId -> { status, user: { wsId }, tech: { wsId } }
const sessions = new Map(); // sessionId -> session
const clients = new Map();  // wsId -> ws

const wss = new WebSocketServer({ server, path: "/ws" });

// ---- Message schema ----
const BaseMsg = z.object({
  type: z.string(),
  requestId: z.string().optional()
});

const HelloMsg = BaseMsg.extend({
  type: z.literal("hello"),
  role: z.enum(["user", "tech"])
});

const CreateSessionMsg = BaseMsg.extend({
  type: z.literal("create_session")
});

const JoinSessionMsg = BaseMsg.extend({
  type: z.literal("join_session"),
  sessionId: z.string(),
  role: z.enum(["user", "tech"])
});

const SignalMsg = BaseMsg.extend({
  type: z.literal("signal"),
  sessionId: z.string(),
  // offer | answer | ice
  signalType: z.enum(["offer", "answer", "ice"]),
  payload: z.unknown()
});

const EndSessionMsg = BaseMsg.extend({
  type: z.literal("end_session"),
  sessionId: z.string()
});

const AnyMsg = z.union([
  HelloMsg,
  CreateSessionMsg,
  JoinSessionMsg,
  SignalMsg,
  EndSessionMsg
]);

sessions.set("demo", {
  sessionId: "demo",
  status: "waiting",
  user: null,
  tech: null,
  createdAt: Date.now(),
});

function send(ws, obj) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
}

function broadcastToSessionPeer(session, fromRole, msg) {
  const target =
    fromRole === "user" ? session.tech?.wsId : session.user?.wsId;

  if (!target) return false;

  const peerWs = clients.get(target);
  if (!peerWs) return false;

  send(peerWs, msg);
  return true;
}

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
      return send(ws, { type: "error", code: "BAD_JSON", message: "Invalid JSON." });
    }

    const res = AnyMsg.safeParse(parsed);
    if (!res.success) {
      return send(ws, {
        type: "error",
        code: "BAD_MESSAGE",
        message: "Message failed validation.",
        details: res.error.issues
      });
    }

    const msg = res.data;

    // ---- handlers ----
    if (msg.type === "hello") {
      ws._role = msg.role;
      return send(ws, { type: "hello_ack", wsId, role: ws._role });
    }

    if (msg.type === "create_session") {
      const sessionId = nanoid(8);
      sessions.set(sessionId, {
        sessionId,
        status: "waiting",
        user: null,
        tech: null,
        createdAt: Date.now()
      });

      return send(ws, { type: "session_created", sessionId });
    }

    if (msg.type === "join_session") {
      const session = sessions.get(msg.sessionId);
      if (!session) {
        return send(ws, { type: "error", code: "NO_SESSION", message: "Session not found." });
      }

      // attach by role
      if (msg.role === "user") {
        if (session.user) {
          return send(ws, { type: "error", code: "ROLE_TAKEN", message: "User slot already taken." });
        }
        session.user = { wsId };
      } else {
        if (session.tech) {
          return send(ws, { type: "error", code: "ROLE_TAKEN", message: "Tech slot already taken." });
        }
        session.tech = { wsId };
      }

      session.status = session.user && session.tech ? "active" : "waiting";

      // ack to joiner
      send(ws, {
        type: "session_joined",
        sessionId: session.sessionId,
        role: msg.role,
        status: session.status
      });

      // notify the other side (if present)
      const otherRole = msg.role === "user" ? "tech" : "user";
      broadcastToSessionPeer(session, msg.role, {
        type: "peer_joined",
        sessionId: session.sessionId,
        role: msg.role,
        status: session.status
      });

      return;
    }

    if (msg.type === "signal") {
      const session = sessions.get(msg.sessionId);
      if (!session) {
        return send(ws, { type: "error", code: "NO_SESSION", message: "Session not found." });
      }

      // determine sender role
      const fromRole =
        session.user?.wsId === wsId ? "user" :
        session.tech?.wsId === wsId ? "tech" :
        null;

      if (!fromRole) {
        return send(ws, { type: "error", code: "NOT_IN_SESSION", message: "You are not part of this session." });
      }

      const ok = broadcastToSessionPeer(session, fromRole, {
        type: "signal",
        sessionId: msg.sessionId,
        signalType: msg.signalType,
        payload: msg.payload
      });

      if (!ok) {
        return send(ws, { type: "error", code: "NO_PEER", message: "Peer not connected yet." });
      }

      return;
    }

    if (msg.type === "end_session") {
      const session = sessions.get(msg.sessionId);
      if (!session) return send(ws, { type: "error", code: "NO_SESSION", message: "Session not found." });

      // notify both sides if connected
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

      if (changed) {
        session.status = session.user && session.tech ? "active" : "waiting";

        // notify remaining peer
        const remaining =
          session.user?.wsId ? clients.get(session.user.wsId) :
          session.tech?.wsId ? clients.get(session.tech.wsId) :
          null;

        if (remaining) {
          send(remaining, {
            type: "peer_left",
            sessionId: sid,
            status: session.status
          });
        } else {
          // if nobody left, delete session
          sessions.delete(sid);
        }
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
  console.log(`WS signaling on ws://localhost:${PORT}/ws`);
});