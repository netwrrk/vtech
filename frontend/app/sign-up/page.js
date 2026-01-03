"use client";

import { useMemo, useState } from "react";
import styles from "./page.module.css";

// Role is not a “UI choice” in Liminal Systems.
// We infer it (query param) and default to tech.
// Example: /sign-up?role=user
function inferRole() {
  if (typeof window === "undefined") return "tech";
  const qs = new URLSearchParams(window.location.search);
  const r = (qs.get("role") || "").toLowerCase();
  return r === "user" ? "user" : "tech";
}

export default function Page() {
  const [mode, setMode] = useState("signup"); // "signup" | "login"

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role] = useState(inferRole);

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    const hasBase = Boolean(email.trim()) && Boolean(password.trim()) && !loading;
    if (mode === "login") return hasBase;
    return hasBase && Boolean(confirm.trim());
  }, [email, password, confirm, loading, mode]);

  function switchMode(next) {
    setMode(next);
    setErr("");
    setLoading(false);

    // Keep email + password (nice UX), clear confirm when leaving signup
    if (next === "login") setConfirm("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");

    const emailTrimmed = email.trim();
    const passwordTrimmed = password.trim();
    const confirmTrimmed = confirm.trim();

    if (!emailTrimmed || !passwordTrimmed) {
      setErr("CREDENTIALS REQUIRED.");
      return;
    }

    if (mode === "signup") {
      if (!confirmTrimmed) {
        setErr("CREDENTIALS REQUIRED.");
        return;
      }
      if (passwordTrimmed !== confirmTrimmed) {
        setErr("PASSWORDS DO NOT MATCH.");
        return;
      }
    }

    // Placeholder “submit” state so the UI feels real.
    setLoading(true);
    await new Promise((r) => setTimeout(r, 450));
    setLoading(false);

    setErr(
      mode === "signup"
        ? "SIGN-UP FLOW NOT CONNECTED YET."
        : "LOGIN FLOW NOT CONNECTED YET."
    );
  }

  const isSignup = mode === "signup";

  return (
    <main className={styles.root}>
      {/* Frame is optional; CSS currently disables it (display:none) */}
      <div className={styles.frame} aria-hidden="true" />

      <section
        className={styles.card}
        aria-label={isSignup ? "Account creation checkpoint" : "Access checkpoint"}
      >
        <header className={styles.header}>
          <div className={styles.brand}>
            <span className={styles.dot} aria-hidden="true" />
            <h1 className={styles.title}>VTech</h1>
          </div>

          <div className={styles.meta}>
            <p className={styles.sub}>ACCESS</p>
            <p className={styles.hint}>
              {isSignup ? "New account entry." : "Restricted console entry."}
            </p>
          </div>
        </header>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <label className={styles.field}>
            <span className={styles.label}>EMAIL</span>
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              required
              disabled={loading}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>PASSWORD</span>
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              disabled={loading}
            />
          </label>

          {isSignup ? (
            <label className={styles.field}>
              <span className={styles.label}>CONFIRM PASSWORD</span>
              <input
                className={styles.input}
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
                disabled={loading}
              />
            </label>
          ) : null}

          {/* Role is intentionally not selectable here */}
          <input type="hidden" name="role" value={role} />

          {err ? (
            <div className={styles.error} role="alert" aria-live="polite">
              {err}
            </div>
          ) : null}

          <button className={styles.primary} type="submit" disabled={!canSubmit}>
            {loading ? (isSignup ? "CREATING…" : "VERIFYING…") : isSignup ? "CREATE ACCOUNT" : "LOG IN"}
          </button>
        </form>

        <footer className={styles.footer}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              alignItems: "center",
            }}
          >
            <span className={styles.muted}>CONSOLE • AUTH</span>

            {isSignup ? (
              <button
                type="button"
                className={styles.muted}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "0.20em",
                }}
                onClick={() => switchMode("login")}
                aria-label="Switch to log in"
              >
                ALREADY HAVE AN ACCOUNT? LOG IN
              </button>
            ) : (
              <button
                type="button"
                className={styles.muted}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "0.20em",
                }}
                onClick={() => switchMode("signup")}
                aria-label="Switch to create account"
              >
                NEW HERE? CREATE ACCOUNT
              </button>
            )}
          </div>
        </footer>
      </section>
    </main>
  );
}
