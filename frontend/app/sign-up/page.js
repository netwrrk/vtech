"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import styles from "./page.module.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Page() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("tech");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignUp(e) {
    e.preventDefault();
    setErr("");

    if (!email.trim() || !password.trim()) {
      setErr("Enter email and password.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          role: role, // user_metadata
        },
      },
    });

    setLoading(false);

    if (error) {
      setErr(error.message);
      return;
    }

    const userRole = data.user?.user_metadata?.role;

    if (userRole === "tech") {
      window.location.href = "/tech-dashboard";
    } else {
      window.location.href = "/user-dashboard";
    }
  }

  return (
    <main className={styles.root}>
      <div className={styles.card}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <span className={styles.dot} aria-hidden="true" />
            <h1 className={styles.title}>VTech</h1>
          </div>
          <p className={styles.sub}>Create an account</p>
        </header>

        <form className={styles.form} onSubmit={handleSignUp}>
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
              autoComplete="new-password"
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

          <button className={styles.primary} type="submit" disabled={loading}>
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>

        <footer className={styles.footer}>
          <span className={styles.muted}>Tech Console • Supabase Auth</span>
        </footer>
      </div>
    </main>
  );
}
