"use client";

import { useState } from "react";
import styles from "./page.module.css";

export default function Page() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("tech");
  const [err, setErr] = useState("");

  function fakeSignIn(e) {
    e.preventDefault();
    setErr("");

    if (!email.trim() || !password.trim()) {
      setErr("Enter email + password.");
      return;
    }

    const session = { role, email: email.trim(), createdAt: Date.now() };
    localStorage.setItem("vtech_session", JSON.stringify(session));

    window.location.href = role === "tech" ? "/tech-dashboard" : "/user-dashboard";
  }

  function clear() {
    localStorage.removeItem("vtech_session");
    setEmail("");
    setPassword("");
    setErr("");
  }

  return (
    <main className={styles.root}>
      <div className={styles.card}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <span className={styles.dot} aria-hidden="true" />
            <h1 className={styles.title}>VTech</h1>
          </div>
          <p className={styles.sub}>Sign in to continue</p>
        </header>

        <form className={styles.form} onSubmit={fakeSignIn}>
          <label className={styles.field}>
            <span>Email</span>
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
            />
          </label>

          <label className={styles.field}>
            <span>Password</span>
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </label>

          <label className={styles.field}>
            <span>Role</span>
            <select
              className={styles.select}
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="tech">Tech</option>
              <option value="user">User</option>
            </select>
          </label>

          {err ? <div className={styles.error}>{err}</div> : null}

          <button className={styles.primary} type="submit">
            Sign In
          </button>

          <div className={styles.meta}>
            <span className={styles.muted}>MVP auth (local session)</span>
            <button type="button" className={styles.link} onClick={clear}>
              Clear
            </button>
          </div>
        </form>

        <footer className={styles.footer}>
          <span className={styles.muted}>Tech Console • Soft UI MVP</span>
        </footer>
      </div>
    </main>
  );
}
