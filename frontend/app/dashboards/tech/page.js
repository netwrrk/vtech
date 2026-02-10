"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const TECH_ID_LS_KEY = "vtech.techId";

export default function Page() {
  const router = useRouter();

  const HTTP = process.env.NEXT_PUBLIC_BACKEND_HTTP;
  const WS_URL = process.env.NEXT_PUBLIC_BACKEND_WS;

  const [health, setHealth] = useState("checking...");
  const [wsStatus, setWsStatus] = useState("disconnected");

  const [sessionId, setSessionId] = useState("");
  const [sessionStatus, setSessionStatus] = useState("idle"); // idle | waiting | active

  const [connectedWsId, setConnectedWsId] = useState("");
  const [roleAck, setRoleAck] = useState("");

  // Presence (Tech online beacon)
  const [techId, setTechId] = useState("");
  const [presenceAck, setPresenceAck] = useState("");

  // Incoming call
  const [incoming, setIncoming] = useState(null); // { sessionId, techId } | null

  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const didAutoConnectRef = useRef(false);

  const [log, setLog] = useState([]);

  const canConnect = useMemo(() => Boolean(WS_URL), [WS_URL]);
  const isConnected = wsStatus === "connected";

  function addLog(line) {
    const stamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setLog((prev) => [`[${stamp}] ${line}`, ...prev].slice(0, 40));
  }

  function clearLog() {
    setLog([]);
  }

  async function checkHealth() {
    try {
      if (!HTTP) {
        setHealth("missing");
        addLog("Missing NEXT_PUBLIC_BACKEND_HTTP");
        return;
      }
      const res = await fetch(`${HTTP}/healthz`, { cache: "no-store" });
      const txt = await res.text();
      setHealth(res.ok ? txt : `bad (${res.status})`);
    } catch (e) {
      setHealth("error");
      addLog(`health error: ${e?.message || e}`);
    }
  }

  function getQS() {
    if (typeof window === "undefined") return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  }

  function inferTechId() {
    const qs = getQS();
    return (qs.get("techId") || "").trim().toLowerCase();
  }

  function inferAutoJoin() {
    const qs = getQS();
    const v = (qs.get("autoJoin") || "").trim().toLowerCase();
    return v === "1" || v === "true" || v === "yes";
  }

  function readStoredTechId() {
    if (typeof window === "undefined") return "";
    try {
      return String(localStorage.getItem(TECH_ID_LS_KEY) || "").trim().toLowerCase();
    } catch {
      return "";
    }
  }

  function storeTechId(id) {
    if (typeof window === "undefined") return;
    const v = String(id || "").trim().toLowerCase();
    if (!v) return;
    try {
      localStorage.setItem(TECH_ID_LS_KEY, v);
    } catch {}
  }

  function safeCloseWs() {
    try {
      wsRef.current?.close();
    } catch {}
    wsRef.current = null;
  }

  function scheduleReconnect() {
    if (!canConnect) return;

    // basic backoff: 0.6s, 1.2s, 2.4s, 3.5s cap
    const n = reconnectAttemptsRef.current;
    const delay = Math.min(3500, Math.round(600 * Math.pow(2, n)));

    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    reconnectTimerRef.current = setTimeout(() => {
      reconnectAttemptsRef.current += 1;
      connectWs({ isReconnect: true });
    }, delay);

    addLog(`reconnect scheduled in ${delay}ms`);
  }

  function registerPresence(idOverride) {
    const ws = wsRef.current;
    const id = String(idOverride || techId || "").trim().toLowerCase();
    if (!ws || ws.readyState !== WebSocket.OPEN) return addLog("ws not connected");
    if (!id) return addLog("missing techId (use ?techId=maria-qsr or set it below)");
    ws.send(JSON.stringify({ type: "register_tech", techId: id }));
    addLog(`WS OUT: register_tech ${id}`);
  }

  function connectWs(opts = {}) {
    if (!canConnect) return addLog("Missing NEXT_PUBLIC_BACKEND_WS");

    const existing = wsRef.current;
    if (existing && existing.readyState === WebSocket.OPEN) return;
    if (existing && existing.readyState === WebSocket.CONNECTING) return;

    if (!opts.isReconnect) reconnectAttemptsRef.current = 0;

    setWsStatus("connecting");
    addLog(opts.isReconnect ? "reconnecting ws..." : "connecting ws...");

    // Clear any pending reconnect timer
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus("connected");
      addLog("ws open");

      // always identify role
      ws.send(JSON.stringify({ type: "hello", role: "tech" }));

      // Auto-register presence if techId exists (query param OR stored OR input)
      const inferred = inferTechId();
      const stored = readStoredTechId();
      const idToUse =
        inferred || stored || String(techId || "").trim().toLowerCase();

      if (idToUse) {
        setTechId(idToUse);
        storeTechId(idToUse);
        registerPresence(idToUse);
      }
    };

    ws.onmessage = (ev) => {
      addLog(ev.data);

      let msg;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }

      if (msg.type === "connected") setConnectedWsId(msg.wsId || "");
      if (msg.type === "hello_ack") setRoleAck(msg.role || "");

      // Presence ack
      if (msg.type === "register_tech_ack") {
        const ackId = String(msg.techId || "").trim().toLowerCase();
        setPresenceAck(ackId);
        if (ackId) {
          setTechId(ackId);
          storeTechId(ackId);
        }
      }

      // Incoming call from user
      if (msg.type === "incoming_call" && msg.sessionId) {
        const sid = String(msg.sessionId);

        setIncoming({ sessionId: sid, techId: msg.techId || "" });
        setSessionId(sid); // prefill so Join works
        setSessionStatus("waiting");

        // Optional: auto-join for demos (enable with ?autoJoin=1)
        if (inferAutoJoin()) {
          const inferred = inferTechId();
          const stored = readStoredTechId();
          const idToUse =
            inferred ||
            stored ||
            String(techId || "").trim().toLowerCase() ||
            String(presenceAck || "").trim().toLowerCase() ||
            String(msg.techId || "").trim().toLowerCase();

          const qs = idToUse ? `?techId=${encodeURIComponent(idToUse)}` : "";
          addLog(`autoJoin enabled -> routing to call ${sid}${qs}`);
          router.push(
            `/dashboards/tech/call/${encodeURIComponent(sid)}${qs}`
          );
        }

        return;
      }

      if (msg.type === "session_joined") setSessionStatus(msg.status || "waiting");
      if (msg.type === "peer_joined") setSessionStatus(msg.status || "active");
      if (msg.type === "peer_left") setSessionStatus(msg.status || "waiting");

      if (msg.type === "session_ended") {
        setSessionStatus("idle");
        setIncoming(null);
        addLog("session ended");
      }

      if (msg.type === "error" && msg.code === "NO_SESSION") {
        addLog("That sessionId doesn't exist. Create a fresh one.");
      }
    };

    ws.onclose = () => {
      setWsStatus("disconnected");
      setSessionStatus("idle");
      setPresenceAck("");
      setIncoming(null);
      addLog("ws closed");

      // If the user is sitting on the dashboard, keep them online by reconnecting
      scheduleReconnect();
    };

    ws.onerror = () => {
      addLog("ws error");
      // allow onclose to handle reconnect
    };
  }

  function joinSession() {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return addLog("ws not connected");
    if (!sessionId.trim()) return addLog("missing sessionId");
    ws.send(JSON.stringify({ type: "join_session", sessionId, role: "tech" }));
  }

  function endSession() {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return addLog("ws not connected");
    if (!sessionId.trim()) return addLog("missing sessionId");
    ws.send(JSON.stringify({ type: "end_session", sessionId }));
  }

  // ✅ pass techId through to the WebRTC page as ?techId=...
  function joinIncomingCall() {
    if (!incoming?.sessionId) return;

    // Prefer URL techId, then stored, then current input/ack, then incoming techId
    const inferred = inferTechId();
    const stored = readStoredTechId();
    const idToUse =
      inferred ||
      stored ||
      String(techId || "").trim().toLowerCase() ||
      String(presenceAck || "").trim().toLowerCase() ||
      String(incoming.techId || "").trim().toLowerCase();

    const qs = idToUse ? `?techId=${encodeURIComponent(idToUse)}` : "";
    router.push(
      `/dashboards/tech/call/${encodeURIComponent(incoming.sessionId)}${qs}`
    );
  }

  function dismissIncoming() {
    setIncoming(null);
  }

  useEffect(() => {
    // Pre-fill techId from URL for demo, else from localStorage
    const inferred = inferTechId();
    const stored = readStoredTechId();
    const idToUse = inferred || stored;

    if (idToUse) {
      setTechId(idToUse);
      storeTechId(idToUse);
    }

    checkHealth();

    // Auto-connect once (so tech dashboard presence works without clicking)
    if (!didAutoConnectRef.current && WS_URL) {
      didAutoConnectRef.current = true;
      connectWs();
    }

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
      safeCloseWs();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- visual tones ---------- */
  const healthTone =
    health === "ok" ? "good" : health === "checking..." ? "neutral" : "bad";

  const wsTone = wsStatus === "connected" ? "good" : "bad";

  const sessionTone =
    sessionStatus === "active"
      ? "good"
      : sessionStatus === "waiting"
      ? "neutral"
      : "neutral";

  const consoleOnline = wsStatus === "connected" && health === "ok";

  const presenceTone = presenceAck ? "good" : isConnected ? "bad" : "neutral";

  /* ---------- UI atoms ---------- */
  const Metric = ({ label, value, tone = "neutral" }) => (
    <div
      className={`${styles.metric} ${
        tone === "good"
          ? styles.metricGood
          : tone === "bad"
          ? styles.metricBad
          : ""
      }`}
    >
      <div className={styles.metricLabel}>{label}</div>
      <div className={styles.metricValue}>{value}</div>
    </div>
  );

  const MiniAction = ({ children, onClick, tone }) => (
    <button
      className={`${styles.mini} ${tone === "primary" ? styles.miniPrimary : ""}`}
      onClick={onClick}
    >
      {children} <span className={styles.arrow}>↗</span>
    </button>
  );

  const Pill = ({ children, tone }) => (
    <div
      className={`${styles.pill} ${
        tone === "good"
          ? styles.pillGood
          : tone === "bad"
          ? styles.pillBad
          : ""
      }`}
    >
      <span className={styles.pillDot} />
      <span className={styles.pillText}>{children}</span>
    </div>
  );

  return (
    <main className={styles.wrap}>
      <header className={styles.top}>
        <div>
          <div className={styles.kicker}>VTECH</div>
          <h1 className={styles.headline}>Tech Dashboard</h1>
          <p className={styles.subhead}>
            Tech console MVP — sessions + signaling + presence + incoming calls.
          </p>
        </div>

        <Pill tone={consoleOnline ? "good" : "neutral"}>Tech Console</Pill>
      </header>

      <section className={styles.layout}>
        <div className={styles.tiles}>
          {/* INCOMING CALL */}
          {incoming ? (
            <article className={styles.tile}>
              <div className={styles.tileHead}>
                <div>
                  <div className={styles.tileTitle}>INCOMING CALL</div>
                  <div className={styles.tileSub}>
                    Session: <span className="mono">{incoming.sessionId}</span>
                  </div>
                </div>

                <div className={styles.tileActions}>
                  <MiniAction tone="primary" onClick={joinIncomingCall}>
                    Join
                  </MiniAction>
                  <MiniAction onClick={dismissIncoming}>Dismiss</MiniAction>
                </div>
              </div>

              <div className={styles.subhead}>
                If you click Join, you’ll open the call page for this sessionId.
                {inferAutoJoin() ? " (autoJoin is ON)" : ""}
              </div>
            </article>
          ) : null}

          <article className={styles.tile}>
            <div className={styles.tileHead}>
              <div>
                <div className={styles.tileTitle}>CONNECTION</div>
                <div className={styles.tileSub}>Backend + WebSocket</div>
              </div>

              <div className={styles.tileActions}>
                <MiniAction onClick={checkHealth}>Recheck</MiniAction>
                <MiniAction tone="primary" onClick={() => connectWs()}>
                  {isConnected ? "WS Connected" : "Connect WS"}
                </MiniAction>
              </div>
            </div>

            <div className={styles.metrics}>
              <Metric
                label="Backend"
                value={HTTP ? "set" : "missing"}
                tone={HTTP ? "good" : "bad"}
              />
              <Metric label="Health" value={health} tone={healthTone} />
              <Metric label="WS" value={wsStatus} tone={wsTone} />
              <Metric
                label="Role"
                value={roleAck || "—"}
                tone={roleAck ? "good" : "neutral"}
              />
              <Metric label="Session" value={sessionStatus} tone={sessionTone} />
              <Metric
                label="Presence"
                value={presenceAck ? `online (${presenceAck})` : "not registered"}
                tone={presenceTone}
              />
            </div>

            <div className={styles.rows}>
              <div className={styles.row}>
                <span className={styles.rowKey}>HTTP</span>
                <span className={`${styles.rowValue} mono`}>{HTTP || "—"}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.rowKey}>WS</span>
                <span className={`${styles.rowValue} mono`}>{WS_URL || "—"}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.rowKey}>wsId</span>
                <span className={`${styles.rowValue} mono`}>
                  {connectedWsId || "—"}
                </span>
              </div>
            </div>
          </article>

          <article className={styles.tile}>
            <div className={styles.tileHead}>
              <div>
                <div className={styles.tileTitle}>PRESENCE</div>
                <div className={styles.tileSub}>
                  Mark yourself online (demo: use ?techId=maria-qsr)
                </div>
              </div>

              <div className={styles.tileActions}>
                <MiniAction tone="primary" onClick={() => registerPresence()}>
                  Register
                </MiniAction>
              </div>
            </div>

            <div>
              <input
                value={techId}
                onChange={(e) => {
                  const v = e.target.value;
                  setTechId(v);
                  storeTechId(v);
                }}
                placeholder="techId (e.g., maria-qsr)"
              />

              <div className={styles.subhead}>
                When registered, user dashboards subscribing to presence will see
                this tech as online.
              </div>

              <div className={styles.rows}>
                <div className={styles.row}>
                  <span className={styles.rowKey}>techId</span>
                  <span className={`${styles.rowValue} mono`}>
                    {techId || "—"}
                  </span>
                </div>
                <div className={styles.row}>
                  <span className={styles.rowKey}>registered</span>
                  <span className={`${styles.rowValue} mono`}>
                    {presenceAck ? "yes" : "no"}
                  </span>
                </div>
              </div>
            </div>
          </article>

          <article className={styles.tile}>
            <div className={styles.tileHead}>
              <div>
                <div className={styles.tileTitle}>SESSION</div>
                <div className={styles.tileSub}>Join / end a room</div>
              </div>

              <div className={styles.tileActions}>
                <MiniAction tone="primary" onClick={joinSession}>
                  Join
                </MiniAction>
                <MiniAction onClick={endSession}>End</MiniAction>
              </div>
            </div>

            <div>
              <input
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="Paste sessionId"
              />

              <div className={styles.subhead}>
                Sessions are in-memory. Backend restarts invalidate old IDs.
              </div>

              <div className={styles.stage}>
                <div className={styles.stageTitle}>VIDEO STAGE</div>
                <div className={styles.stageSub}>
                  Waiting for stream… (WebRTC next)
                </div>
              </div>
            </div>
          </article>

          <article className={`${styles.tile} ${styles.tileWide}`}>
            <div className={styles.tileHead}>
              <div>
                <div className={styles.tileTitle}>LOG</div>
                <div className={styles.tileSub}>Last 40 events</div>
              </div>

              <div className={styles.tileActions}>
                <MiniAction onClick={clearLog}>Clear</MiniAction>
              </div>
            </div>

            <div className={`${styles.terminal} mono`}>
              {log.length ? log.join("\n") : "No messages yet."}
            </div>
          </article>
        </div>

        <aside className={styles.rail}>
          <div className={styles.railBlock}>
            <div className={styles.railTitle}>STATUS</div>
            <div className={styles.subhead}>
              Console: {consoleOnline ? "Online" : "Standby"}
            </div>
            <div className={styles.subhead}>
              Backend: {HTTP ? "Configured" : "Missing"}
            </div>
            <div className={styles.subhead}>Health: {health}</div>
            <div className={styles.subhead}>WebSocket: {wsStatus}</div>
            <div className={styles.subhead}>
              Presence: {presenceAck ? "Online" : "Offline"}
            </div>
            <div className={styles.subhead}>Session: {sessionStatus}</div>
            <div className={styles.subhead}>
              Incoming: {incoming ? "Yes" : "No"}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
