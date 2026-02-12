/**
 * USER DASHBOARD ERROR BOUNDARY
 * ------------------------------------------------------
 * Route: frontend/app/dashboards/user/error.js
 *
 * Purpose:
 * Provides a route-level error fallback UI for the
 * User Dashboard segment. Displays a recovery interface
 * when a runtime error occurs within this route.
 *
 * Core Responsibilities:
 * - Render a user-friendly error message
 * - Allow retry via Next.js reset() mechanism
 * - Allow full page reload for hard recovery
 * - Maintain consistent dashboard styling
 *
 * Data Sources:
 * - Next.js route error boundary API (reset function)
 */

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
