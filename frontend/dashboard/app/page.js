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
    const stamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLog((prev) => [`[${stamp}] ${line}`, ...prev].slice(0, 30));
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
          addLog("That sessionId doesn't exist (backend restart or wrong id). Create a fresh one.");
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
    if (!ws || ws.readyState !== WebSocket.OPEN) return addLog("ws not connected");
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
    if (!ws || ws.readyState !== WebSocket.OPEN) return addLog("ws not connected");
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

  const statusPill = (label, value) => (
    <div className="pill">
      <span className="pill-label">{label}</span>
      <span className="pill-value">{value}</span>
    </div>
  );

  return (
    <main className="page">
      <header className="header">
        <div>
          <h1 className="title">VTech • Tech Dashboard</h1>
          <p className="subtitle">Soft UI MVP — sessions + signaling verified.</p>
        </div>
      </header>

      <section className="grid">
        <div className="card panel">
          <div className="panel-head">
            <h2 className="panel-title">Connection</h2>
            <div className="panel-actions">
              <button onClick={checkHealth}>Recheck</button>
              <button onClick={connectWs}>{isConnected ? "WS Connected" : "Connect WS"}</button>
            </div>
          </div>

          <div className="status-row">
            {statusPill("Backend", HTTP ? "set" : "missing")}
            {statusPill("Health", health)}
            {statusPill("WS", wsStatus)}
            {statusPill("Role", roleAck || "—")}
            {statusPill("Session", sessionStatus)}
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
            <h2 className="panel-title">Session</h2>
            <div className="panel-actions">
              <button onClick={joinSession}>Join</button>
              <button onClick={endSession}>End</button>
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
            Tip: sessions are in-memory right now. If you restart the backend, old sessionIds die.
          </div>

          <div className="video-placeholder card">
            <div className="video-inner">
              <div className="video-title">Video Stage</div>
              <div className="video-sub">Waiting for stream… (WebRTC comes next)</div>
            </div>
          </div>
        </div>

        <div className="card panel log-panel">
          <div className="panel-head">
            <h2 className="panel-title">Log</h2>
            <div className="panel-actions">
              <button onClick={clearLog}>Clear</button>
            </div>
          </div>

          <div className="log-box mono">
            {log.length ? log.join("\n") : "No messages yet."}
          </div>
        </div>
      </section>

      {/* Minimal CSS for this page to match your global vibe (no extra files) */}
      <style jsx>{`
        .page {
          padding: 28px;
          max-width: 1100px;
          margin: 0 auto;
        }

        .header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .title {
          margin: 0;
          letter-spacing: -0.02em;
        }

        .subtitle {
          margin-top: 6px;
          opacity: 0.75;
          font-size: 14px;
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

        .panel-title {
          margin: 0;
          font-size: 16px;
          letter-spacing: -0.01em;
        }

        .panel-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
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
          background: var(--background-elevated);
        }

        .pill-label {
          font-size: 12px;
          opacity: 0.7;
        }

        .pill-value {
          font-size: 12px;
          font-weight: 600;
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
          background: var(--background-elevated);
        }

        .kv-key {
          font-size: 12px;
          opacity: 0.7;
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
          opacity: 0.75;
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
        }

        .video-title {
          font-weight: 700;
          margin-bottom: 6px;
        }

        .video-sub {
          font-size: 13px;
          opacity: 0.75;
        }

        .log-box {
          white-space: pre-wrap;
          border: 1px solid var(--border-soft);
          border-radius: 12px;
          background: var(--background-elevated);
          padding: 12px;
          height: 260px;
          overflow: auto;
          font-size: 12px;
          line-height: 1.4;
        }

        .mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }

        @media (max-width: 900px) {
          .grid {
            grid-template-columns: 1fr;
          }
          .page {
            padding: 18px;
          }
        }
      `}</style>
    </main>
  );
}
