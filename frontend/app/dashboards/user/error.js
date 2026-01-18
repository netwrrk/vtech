// frontend/app/user-dashboard/error.js
"use client";

import styles from "./page.module.css";

export default function Error({ reset }) {
  return (
    <main className={styles.root}>
      <div className={styles.shell}>
        <section className={styles.heroCard} style={{ gridTemplateColumns: "1fr" }}>
          <div className={styles.heroLeft}>
            <div className={styles.kicker}>VTECH</div>
            <div className={styles.title} style={{ fontSize: 24 }}>
              Something broke.
            </div>

            <div className={styles.helperText} style={{ marginTop: 6 }}>
              Try again. If it keeps happening, it’s probably a data fetch or env issue.
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => reset?.()}
                style={{ width: "auto", padding: "10px 14px" }}
              >
                Retry
              </button>

              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => location.reload()}
                style={{ width: "auto", padding: "10px 14px" }}
              >
                Reload
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
