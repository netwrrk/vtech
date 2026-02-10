// frontend/app/tech/[techId]/page.js
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./page.module.css";

import { getTechById, normStatus, statusLabel } from "../techData";

// shared WS helper (keeps this consistent with call pages)
import { createSignalingClient } from "../../shared/sessions/signaling";

export default function TechContactPage() {
  const router = useRouter();
  const params = useParams();
  const techId = params?.techId;

  const tech = useMemo(() => getTechById(techId), [techId]);

  const WS_URL = process.env.NEXT_PUBLIC_BACKEND_WS;

  const signalingRef = useRef(null);
  const startingRef = useRef(false);

  const [starting, setStarting] = useState(false);
  const [startErr, setStartErr] = useState("");

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      startingRef.current = false;
      try {
        signalingRef.current?.close?.();
      } catch {}
      signalingRef.current = null;
    };
  }, []);

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/dashboards/user");
  }

  function goDashboard() {
    router.push("/dashboards/user");
  }

  function openChat() {
    router.push(`/sessions?tech=${encodeURIComponent(tech?.id || "")}&mode=chat`);
  }

  async function startSession() {
    if (!tech) return;

    const targetTechId = String(tech.id || "").trim().toLowerCase();
    if (!targetTechId) {
      setStartErr("Missing tech.id (cannot place call).");
      return;
    }

    if (!WS_URL) {
      setStartErr("Missing NEXT_PUBLIC_BACKEND_WS");
      return;
    }

    if (startingRef.current) return;

    setStartErr("");
    setStarting(true);
    startingRef.current = true;

    // close any old client
    try {
      signalingRef.current?.close?.();
    } catch {}
    signalingRef.current = null;

    const finish = (errMsg = "") => {
      if (errMsg) setStartErr(errMsg);
      setStarting(false);
      startingRef.current = false;

      try {
        signalingRef.current?.close?.();
      } catch {}
      signalingRef.current = null;
    };

    try {
      const signaling = createSignalingClient({
        wsUrl: WS_URL,
        role: "user",
        onOpen: () => {
          // request call session
          signaling.send({ type: "call_request", techId: targetTechId });
        },
        onMessage: (msg) => {
          if (msg?.type === "error") {
            finish(msg.message || "Failed to start session.");
            return;
          }

          // backend returns this when call_request succeeds
          if (msg?.type === "call_created" && msg.sessionId) {
            const sessionId = String(msg.sessionId).trim();

            // navigate into the call page (this will open a new WS and join_session)
            setStarting(false);
            startingRef.current = false;

            try {
              signaling.close();
            } catch {}
            if (signalingRef.current === signaling) signalingRef.current = null;

            router.push(`/dashboards/user/call/${encodeURIComponent(sessionId)}`);
            return;
          }
        },
        onError: () => finish("WebSocket error. Check NEXT_PUBLIC_BACKEND_WS + port visibility."),
        onClose: () => {
          if (startingRef.current) finish("WS closed before call could be created.");
        },
      });

      signalingRef.current = signaling;
      signaling.connect();
    } catch (e) {
      finish(e?.message || String(e));
    }
  }

  if (!tech) {
    return (
      <main className={styles.root}>
        <div className={styles.shell}>
          <header className={styles.header}>
            <button className={styles.backBtn} onClick={goBack} aria-label="Back">
              ←
            </button>
            <div className={styles.headerTitle}>Tech</div>
            <div className={styles.headerSpacer} />
          </header>

          <section className={styles.section}>
            <div className={styles.sectionTitle}>Not found</div>
            <div className={styles.sectionBody}>
              This tech profile doesn’t exist (or the link is wrong).
            </div>

            <div className={styles.actions} style={{ marginTop: 12 }}>
              <button className={styles.btnPrimary} onClick={goDashboard}>
                Back to Dashboard
              </button>
              <button className={styles.btnSecondary} onClick={goBack}>
                Go Back
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const s = normStatus(tech.status);
  const badge = statusLabel(s);

  const eta =
    s === "available" && Number.isFinite(tech.etaMin)
      ? `~${Math.max(1, Math.round(tech.etaMin))}m`
      : null;

  const canStartSession = s === "available";

  return (
    <main className={styles.root}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={goBack} aria-label="Back">
            ←
          </button>
          <div className={styles.headerTitle}>Tech</div>
          <div className={styles.headerSpacer} />
        </header>

        <section className={styles.contactCard}>
          <div className={styles.avatarWrap}>
            {tech.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className={styles.avatar} src={tech.avatarUrl} alt={tech.name} />
            ) : (
              <div className={styles.avatarFallback}>{tech.name?.[0] || "T"}</div>
            )}
          </div>

          <div className={styles.name}>{tech.name}</div>
          <div className={styles.role}>{tech.role}</div>

          <div className={styles.metaRow}>
            <span className={`${styles.statusPill} ${styles[`pill_${s}`]}`}>
              {badge}
            </span>
            <span className={styles.metaText}>
              {eta
                ? `Avg response ${eta}`
                : s === "busy"
                ? "Currently busy"
                : s === "away"
                ? "Temporarily away"
                : "Offline"}
            </span>
          </div>

          {!!startErr && (
            <div className={styles.sectionBody} style={{ color: "crimson", marginTop: 10 }}>
              {startErr}
            </div>
          )}

          <div className={styles.actions}>
            <button className={styles.btnPrimary} onClick={openChat}>
              Message
            </button>

            <button
              className={styles.btnSecondary}
              onClick={startSession}
              disabled={!canStartSession || !WS_URL || starting}
              title={
                !WS_URL
                  ? "Backend WS not configured"
                  : starting
                  ? "Starting..."
                  : s !== "available"
                  ? "Tech not available right now"
                  : "Start virtual session"
              }
            >
              {starting ? "Starting…" : "Start Virtual Session"}
            </button>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionTitle}>About</div>
          <div className={styles.sectionBody}>{tech.bio}</div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionTitle}>Expertise</div>
          <div className={styles.tags}>
            {(tech.expertise || []).map((x) => (
              <span key={x} className={styles.tag}>
                {x}
              </span>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionTitle}>Background</div>
          <ul className={styles.list}>
            {(tech.background || []).map((x) => (
              <li key={x} className={styles.listItem}>
                {x}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
