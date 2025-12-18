"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
        setHealth("missing env");
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

    setWsStatus("connecting...");
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

        // session lifecycle
        if (msg.type === "session_joined") {
          setSessionStatus(msg.status || "waiting");
        }
        if (msg.type === "peer_joined") {
          setSessionStatus(msg.status || "active");
        }
        if (msg.type === "peer_left") {
          setSessionStatus(msg.status || "waiting");
        }
        if (msg.type === "session_ended") {
          setSessionStatus("idle");
          addLog("session ended");
        }

        // common error patterns
        if (msg.type === "error" && msg.code === "NO_SESSION") {
          addLog(
            "That sessionId doesn't exist (backend restart or wrong id). Create a fresh one."
          );
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

    ws.onerror = () => {
      addLog("ws error");
    };
  }

  function joinSession() {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN)
      return addLog("ws not connected");
    const sid = sessionId.trim();
    if (!sid) return addLog("missing sessionId");

    ws.send(
      JSON.stringify({
        type: "join_session",
        sessionId: sid,
        role: "tech",
      })
    );
  }

  function endSession() {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN)
      return addLog("ws not connected");
    const sid = sessionId.trim();
    if (!sid) return addLog("missing sessionId");

    ws.send(
      JSON.stringify({
        type: "end_session",
        sessionId: sid,
      })
    );
  }

  useEffect(() => {
    checkHealth();
    // keep manual connect on purpose
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusPill = (label, value, tone = "neutral") => (
    <div className={`pill pill-${tone}`}>
      <span className="pill-label">{label}</span>
      <span className="pill-value">{value}</span>
    </div>
  );

  const healthTone =
    health === "ok" ? "good" : health === "checking..." ? "neutral" : "bad";
  const wsTone =
    wsStatus === "connected"
      ? "good"
      : wsStatus === "connecting..."
      ? "warn"
      : "bad";
  const sessionTone =
    sessionStatus === "active"
      ? "good"
      : sessionStatus === "waiting"
      ? "warn"
      : "neutral";

  return (
    <main className="page">
      <header className="header">
        <div className="header-left">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true" />
            <div>
              <h1 className="title">VTech • Tech Dashboard</h1>
              <p className="subtitle">
                Soft UI MVP — sessions + signaling verified.
              </p>
            </div>
          </div>
        </div>

        <div className="header-right">
          <div className="meta-chip">
            <span className="meta-dot" />
            <span className="meta-text">Tech Console</span>
          </div>
        </div>
      </header>

      <section className="grid">
        <div className="card panel">
          <div className="panel-head">
            <div className="panel-title-wrap">
              <h2 className="panel-title">Connection</h2>
              <span className="panel-sub">Backend + WebSocket status</span>
            </div>
            <div className="panel-actions">
              <button className="btn" onClick={checkHealth}>
                Recheck
              </button>
              <button className="btn btn-primary" onClick={connectWs}>
                {isConnected ? "WS Connected" : "Connect WS"}
              </button>
            </div>
          </div>

          <div className="status-row">
            {statusPill(
              "Backend",
              HTTP ? "set" : "missing",
              HTTP ? "good" : "bad"
            )}
            {statusPill("Health", health, healthTone)}
            {statusPill("WS", wsStatus, wsTone)}
            {statusPill("Role", roleAck || "—", roleAck ? "good" : "neutral")}
            {statusPill("Session", sessionStatus, sessionTone)}
          </div>

          <div className="kv">
            <div className="kv-row">
              <div className="kv-key">HTTP</div>
              <div className="kv-val mono">{HTTP || "(missing env)"}</div>
            </div>
            <div className="kv-row">
              <div className="kv-key">WS</div>
              <div className="kv-val mono">{WS_URL || "(missing env)"}</div>
            </div>
            <div className="kv-row">
              <div className="kv-key">wsId</div>
              <div className="kv-val mono">{connectedWsId || "—"}</div>
            </div>
          </div>
        </div>

        <div className="card panel">
          <div className="panel-head">
            <div className="panel-title-wrap">
              <h2 className="panel-title">Session</h2>
              <span className="panel-sub">Join / end a room</span>
            </div>
            <div className="panel-actions">
              <button className="btn btn-primary" onClick={joinSession}>
                Join
              </button>
              <button className="btn" onClick={endSession}>
                End
              </button>
            </div>
          </div>

          <div className="session-row">
            <input
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="Paste sessionId"
              aria-label="Session ID"
            />
          </div>

          <div className="hint">
            Tip: sessions are in-memory right now. If you restart the backend, old
            sessionIds die.
          </div>

          <div className="video-placeholder card">
            <div className="video-inner">
              <div className="video-title">Video Stage</div>
              <div className="video-sub">
                Waiting for stream… (WebRTC comes next)
              </div>
            </div>
          </div>
        </div>

        <div className="card panel log-panel">
          <div className="panel-head">
            <div className="panel-title-wrap">
              <h2 className="panel-title">Log</h2>
              <span className="panel-sub">Last 40 events</span>
            </div>
            <div className="panel-actions">
              <button className="btn" onClick={clearLog}>
                Clear
              </button>
            </div>
          </div>

          <div className="log-box mono">
            {log.length ? log.join("\n") : "No messages yet."}
          </div>
        </div>
      </section>

      {/* CSS tuned to “champagne + antique gold” + more premium contrast */}
      <style jsx>{`
        .page {
          padding: 32px 28px 40px;
          max-width: 1160px;
          margin: 0 auto;
        }

        .header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* Tiny “gold hardware” mark */
        .brand-mark {
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: radial-gradient(
            circle at 30% 30%,
            rgba(255, 255, 255, 0.9),
            rgba(255, 255, 255, 0) 55%
          );
          box-shadow: 0 0 0 6px var(--gold-glow), 0 10px 18px var(--shadow-soft);
          border: 1px solid var(--border-warm);
        }

        .title {
          margin: 0;
          letter-spacing: -0.03em;
          font-weight: 820;
          font-size: 28px;
          line-height: 1.05;
        }

        .subtitle {
          margin-top: 7px;
          color: var(--muted);
          font-size: 13px;
          letter-spacing: 0.01em;
        }

        .meta-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid var(--border-warm);
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.45),
            rgba(255, 255, 255, 0)
          );
          box-shadow: 0 14px 28px var(--shadow-soft);
        }

        .meta-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: rgba(176, 140, 74, 0.6);
          box-shadow: 0 0 0 6px rgba(176, 140, 74, 0.08);
        }

        .meta-text {
          font-size: 12px;
          color: var(--muted);
          font-weight: 650;
          letter-spacing: 0.01em;
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .panel {
          padding: 16px;
        }

        .log-panel {
          grid-column: 1 / -1;
        }

        .panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
        }

        .panel-title-wrap {
          display: grid;
          gap: 2px;
        }

        .panel-title {
          margin: 0;
          font-size: 15px;
          letter-spacing: -0.01em;
          font-weight: 820;
        }

        .panel-sub {
          font-size: 12px;
          color: var(--muted-2);
        }

        .panel-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        /* Buttons: “gold hardware” but still clean */
        .btn {
          border-radius: 999px;
          padding: 8px 14px;
          font-weight: 720;
        }

        .btn-primary {
          border-color: var(--border-warm);
          box-shadow: 0 10px 22px var(--shadow-soft), 0 0 0 6px var(--gold-glow);
        }

        .status-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }

        .pill {
          display: inline-flex;
          gap: 8px;
          align-items: center;
          padding: 7px 10px;
          border-radius: 999px;
          border: 1px solid var(--border-soft);
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.42),
            rgba(255, 255, 255, 0)
          );
          box-shadow: 0 12px 24px var(--shadow-soft);
        }

        .pill-label {
          font-size: 12px;
          color: var(--muted);
        }

        .pill-value {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.01em;
        }

        /* Premium status tones (all warm) */
        .pill-good {
          border-color: var(--border-warm);
          box-shadow: 0 12px 24px var(--shadow-soft), 0 0 0 6px var(--gold-glow);
        }

        .pill-warn {
          border-color: rgba(176, 140, 74, 0.24);
          box-shadow: 0 12px 24px var(--shadow-soft),
            0 0 0 6px rgba(176, 140, 74, 0.07);
        }

        .pill-bad {
          border-color: rgba(120, 60, 50, 0.22);
          box-shadow: 0 12px 24px var(--shadow-soft),
            0 0 0 6px rgba(120, 60, 50, 0.06);
        }

        .kv {
          display: grid;
          gap: 8px;
        }

        .kv-row {
          display: grid;
          grid-template-columns: 60px 1fr;
          gap: 10px;
          align-items: baseline;
          padding: 10px 12px;
          border: 1px solid var(--border-soft);
          border-radius: 12px;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.35),
            rgba(255, 255, 255, 0)
          );
          box-shadow: 0 14px 28px var(--shadow-soft);
        }

        .kv-key {
          font-size: 12px;
          color: var(--muted);
        }

        .kv-val {
          font-size: 12px;
          overflow-wrap: anywhere;
        }

        .session-row {
          display: flex;
          gap: 8px;
          margin-bottom: 10px;
        }

        .hint {
          font-size: 12px;
          color: var(--muted);
          margin-bottom: 12px;
          line-height: 1.35;
        }

        .video-placeholder {
          padding: 14px;
        }

        .video-inner {
          border: 1px dashed var(--border-soft);
          border-radius: 12px;
          padding: 18px;
          min-height: 170px;
          display: grid;
          place-content: center;
          text-align: center;
          background: radial-gradient(
              700px 260px at 30% 0%,
              rgba(176, 140, 74, 0.12),
              rgba(176, 140, 74, 0) 60%
            ),
            linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.32),
              rgba(255, 255, 255, 0)
            );
        }

        .video-title {
          font-weight: 900;
          margin-bottom: 6px;
          letter-spacing: -0.01em;
        }

        .video-sub {
          font-size: 13px;
          color: var(--muted);
        }

        .log-box {
          white-space: pre-wrap;
          border: 1px solid var(--border-soft);
          border-radius: 12px;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.30),
            rgba(255, 255, 255, 0)
          );
          padding: 12px;
          height: 270px;
          overflow: auto;
          font-size: 12px;
          line-height: 1.45;
          box-shadow: 0 16px 30px var(--shadow-soft);
        }

        .mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            monospace;
        }

        :global(input) {
          width: 100%;
        }

        @media (max-width: 900px) {
          .grid {
            grid-template-columns: 1fr;
          }
          .page {
            padding: 18px;
          }
          .title {
            font-size: 24px;
          }
        }
      `}</style>
    </main>
  );
}
