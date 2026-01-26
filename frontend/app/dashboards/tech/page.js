"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./page.module.css";

export default function Page() {
  const HTTP = process.env.NEXT_PUBLIC_BACKEND_HTTP;
  const WS_URL = process.env.NEXT_PUBLIC_BACKEND_WS;

  const [health, setHealth] = useState("checking...");
  const [wsStatus, setWsStatus] = useState("disconnected");

  const [sessionId, setSessionId] = useState("");
  const [sessionStatus, setSessionStatus] = useState("idle"); // idle | waiting | active

  const [connectedWsId, setConnectedWsId] = useState("");
  const [roleAck, setRoleAck] = useState("");

  const wsRef = useRef(null);
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

  function connectWs() {
    if (!canConnect) return addLog("Missing NEXT_PUBLIC_BACKEND_WS");
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    setWsStatus("connecting");
    addLog("connecting ws...");

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus("connected");
      addLog("ws open");
      ws.send(JSON.stringify({ type: "hello", role: "tech" }));
    };

    ws.onmessage = (ev) => {
      addLog(ev.data);
      try {
        const msg = JSON.parse(ev.data);

        if (msg.type === "connected") setConnectedWsId(msg.wsId || "");
        if (msg.type === "hello_ack") setRoleAck(msg.role || "");

        if (msg.type === "session_joined") setSessionStatus(msg.status || "waiting");
        if (msg.type === "peer_joined") setSessionStatus(msg.status || "active");
        if (msg.type === "peer_left") setSessionStatus(msg.status || "waiting");
        if (msg.type === "session_ended") {
          setSessionStatus("idle");
          addLog("session ended");
        }

        if (msg.type === "error" && msg.code === "NO_SESSION") {
          addLog("That sessionId doesn't exist. Create a fresh one.");
        }
      } catch {
        // ignore non-JSON
      }
    };

    ws.onclose = () => {
      setWsStatus("disconnected");
      setSessionStatus("idle");
      addLog("ws closed");
    };

    ws.onerror = () => addLog("ws error");
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

  useEffect(() => {
    checkHealth();
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
      className={`${styles.mini} ${
        tone === "primary" ? styles.miniPrimary : ""
      }`}
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
            Tech console MVP — sessions + signaling verified.
          </p>
        </div>

        <Pill tone={consoleOnline ? "good" : "neutral"}>Tech Console</Pill>
      </header>

      <section className={styles.layout}>
        <div className={styles.tiles}>
          <article className={styles.tile}>
            <div className={styles.tileHead}>
              <div>
                <div className={styles.tileTitle}>CONNECTION</div>
                <div className={styles.tileSub}>Backend + WebSocket</div>
              </div>

              <div className={styles.tileActions}>
                <MiniAction onClick={checkHealth}>Recheck</MiniAction>
                <MiniAction tone="primary" onClick={connectWs}>
                  {isConnected ? "WS Connected" : "Connect WS"}
                </MiniAction>
              </div>
            </div>

            <div className={styles.metrics}>
              <Metric label="Backend" value={HTTP ? "set" : "missing"} tone={HTTP ? "good" : "bad"} />
              <Metric label="Health" value={health} tone={healthTone} />
              <Metric label="WS" value={wsStatus} tone={wsTone} />
              <Metric label="Role" value={roleAck || "—"} tone={roleAck ? "good" : "neutral"} />
              <Metric label="Session" value={sessionStatus} tone={sessionTone} />
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
                <span className={`${styles.rowValue} mono`}>{connectedWsId || "—"}</span>
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
                <MiniAction tone="primary" onClick={joinSession}>Join</MiniAction>
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
            <div className={styles.subhead}>Console: {consoleOnline ? "Online" : "Standby"}</div>
            <div className={styles.subhead}>Backend: {HTTP ? "Configured" : "Missing"}</div>
            <div className={styles.subhead}>Health: {health}</div>
            <div className={styles.subhead}>WebSocket: {wsStatus}</div>
            <div className={styles.subhead}>Session: {sessionStatus}</div>
          </div>
        </aside>
      </section>
    </main>
  );
}
