// app/tech/[techId]/page.js
"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./page.module.css";

import { getTechById, normStatus, statusLabel } from "../techData";

function makeSessionCodeFromTechName(name) {
  // "Maria" -> "maria"
  // "Sam Network" -> "sam-network"
  // You said "tech's name as the code" — this keeps it URL/WS friendly.
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

export default function TechContactPage() {
  const router = useRouter();
  const params = useParams();
  const techId = params?.techId;

  const tech = useMemo(() => getTechById(techId), [techId]);

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/dashboards/user");
  }

  function goDashboard() {
    router.push("/dashboards/user");
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

  function openChat() {
    router.push(`/sessions?tech=${encodeURIComponent(tech.id)}&mode=chat`);
  }

  function makeRoomCode7() {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let out = "";
    for (let i = 0; i < 7; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
    return out;
  }

  function startSession() {
    const room = makeRoomCode7();
    router.push(`/dashboards/user/web_rtc_call/${encodeURIComponent(techId)}?session=${room}`);
  } 

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

          <div className={styles.actions}>
            <button className={styles.btnPrimary} onClick={openChat}>
              Message
            </button>

            <button
              className={styles.btnSecondary}
              onClick={startSession}
              disabled={!canStartSession}
              title={!canStartSession ? "Tech not available right now" : "Start virtual session"}
            >
              Start Virtual Session
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
