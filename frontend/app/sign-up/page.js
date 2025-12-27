"use client";

import { useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import styles from "./page.module.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role] = useState(inferRole);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return Boolean(email.trim()) && Boolean(password.trim()) && !loading;
  }, [email, password, loading]);

  async function handleSignUp(e) {
    e.preventDefault();
    setErr("");

    const emailTrimmed = email.trim();
    const passwordTrimmed = password.trim();

    if (!emailTrimmed || !passwordTrimmed) {
      setErr("CREDENTIALS REQUIRED.");
      return;
    }

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      setErr("AUTH CONFIG MISSING.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: emailTrimmed,
      password: passwordTrimmed,
      options: {
        data: { role },
      },
    });

    setLoading(false);

    if (error) {
      // Keep it blunt. No friendly guidance.
      setErr("ACCESS DENIED.");
      return;
    }

    const userRole = data.user?.user_metadata?.role || role;
    window.location.href =
      userRole === "tech" ? "/tech-dashboard" : "/user-dashboard";
  }

  return (
    <main className={styles.root}>
      {/* Frame is optional; CSS currently disables it (display:none) */}
      <div className={styles.frame} aria-hidden="true" />

      <section className={styles.card} aria-label="Access checkpoint">
        <header className={styles.header}>
          <div className={styles.brand}>
            <span className={styles.dot} aria-hidden="true" />
            <h1 className={styles.title}>VTech</h1>
          </div>

          <div className={styles.meta}>
            <p className={styles.sub}>ACCESS</p>
            <p className={styles.hint}>Restricted console entry.</p>
          </div>
        </header>

        <form className={styles.form} onSubmit={handleSignUp} noValidate>
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
              autoComplete="new-password"
              required
              disabled={loading}
            />
          </label>

          {/* Role is intentionally not selectable here */}
          <input type="hidden" name="role" value={role} />

          {err ? (
            <div className={styles.error} role="alert" aria-live="polite">
              {err}
            </div>
          ) : null}

          <button className={styles.primary} type="submit" disabled={!canSubmit}>
            {loading ? "VERIFYING…" : "INITIATE"}
          </button>
        </form>

        <footer className={styles.footer}>
          <span className={styles.muted}>CONSOLE • AUTH</span>
        </footer>
      </section>
    </main>
  );
}
