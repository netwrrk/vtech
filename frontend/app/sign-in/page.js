"use client";

import { useEffect, useState } from "react";

export default function Page() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("tech"); // "tech" | "user"
  const [err, setErr] = useState("");

  // Load page-local CSS (since you already created sign.css)
  useEffect(() => {
    const id = "vtech-signin-css";
    if (document.getElementById(id)) return;

    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "/sign.css"; // served from /public
    document.head.appendChild(link);
  }, []);

  function fakeSignIn(e) {
    e.preventDefault();
    setErr("");

    // basic validation (keep it simple)
    if (!email.trim() || !password.trim()) {
      setErr("Enter email + password.");
      return;
    }

    // MVP session (replace later with real auth)
    const session = {
      role, // tech or user
      email: email.trim(),
      createdAt: Date.now(),
    };

    try {
      localStorage.setItem("vtech_session", JSON.stringify(session));
    } catch {
      setErr("Couldn’t save session (storage blocked).");
      return;
    }

    // redirect based on role
    window.location.href = role === "tech" ? "/tech-dashboard" : "/user-dashboard";
  }

  return (
    <main className="signin-root">
      <div className="signin-card">
        <header className="signin-header">
          <div className="signin-brand">
            <span className="dot" aria-hidden="true" />
            <h1>VTech</h1>
          </div>
          <p>Sign in to continue</p>
        </header>

        <form className="signin-form" onSubmit={fakeSignIn}>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </label>

          <label className="field">
            <span>Role</span>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="tech">Tech</option>
              <option value="user">User</option>
            </select>
          </label>

          {err ? <div className="signin-error">{err}</div> : null}

          <button className="primary-btn" type="submit">
            Sign In
          </button>

          <div className="signin-meta">
            <span className="muted">MVP auth (local session)</span>
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                localStorage.removeItem("vtech_session");
                setEmail("");
                setPassword("");
                setErr("");
              }}
            >
              Clear
            </button>
          </div>
        </form>

        <footer className="signin-footer">
          <span className="muted">Tech Console • Soft UI MVP</span>
        </footer>
      </div>
    </main>
  );
}
