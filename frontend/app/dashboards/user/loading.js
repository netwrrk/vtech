/**
 * USER DASHBOARD LOADING STATE
 * ------------------------------------------------------
 * Route: frontend/app/dashboards/user/loading.js
 *
 * Purpose:
 * Provides a route-level loading skeleton while the
 * User Dashboard content is fetching or hydrating.
 *
 * Core Responsibilities:
 * - Render structural placeholders matching dashboard layout
 * - Preserve layout stability during async rendering
 * - Improve perceived performance with immediate visual feedback
 *
 * Data Sources:
 * - Next.js route segment loading mechanism
 */

import styles from "./page.module.css";

function Block({ style }) {
  return (
    <div
      style={{
        borderRadius: 16,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
        ...style,
      }}
    />
  );
}

export default function Loading() {
  return (
    <main className={styles.root}>
      <div className={styles.shell}>
        {/* TopBar skeleton */}
        <div className={styles.topBar}>
          <Block style={{ width: 40, height: 40, borderRadius: 999 }} />
          <div className={styles.titleWrap}>
            <Block style={{ width: 120, height: 10, borderRadius: 999, opacity: 0.7 }} />
            <Block style={{ width: 180, height: 28, borderRadius: 12, marginTop: 8 }} />
          </div>
          <Block style={{ width: 40, height: 40, borderRadius: 999 }} />
        </div>

        {/* HeroCard skeleton */}
        <div className={styles.heroCard}>
          <div className={styles.heroLeft}>
            <div className={styles.statRow}>
              <Block style={{ width: 90, height: 30, borderRadius: 12 }} />
              <Block style={{ width: 130, height: 12, borderRadius: 999, opacity: 0.7 }} />
            </div>

            <Block style={{ width: 170, height: 56, borderRadius: 14 }} />
          </div>

          <div className={styles.heroRight}>
            <div className={styles.deviceMock} />
          </div>
        </div>

        {/* SlideAction skeleton */}
        <div className={styles.slideWrap}>
          <div className={styles.slideRow}>
            <Block style={{ width: 56, height: 56, borderRadius: 999 }} />
            <Block style={{ height: 56, borderRadius: 999 }} />
            <Block style={{ width: 56, height: 56, borderRadius: 999 }} />
          </div>
          <Block style={{ width: 260, height: 12, borderRadius: 999, opacity: 0.7 }} />
        </div>

        {/* Tiles skeleton */}
        <div className={styles.tiles}>
          <Block style={{ height: 92, borderRadius: 22 }} />
          <Block style={{ height: 92, borderRadius: 22 }} />
        </div>

        {/* BottomNav skeleton */}
        <div className={styles.bottomNav}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Block key={i} style={{ height: 44, borderRadius: 16, background: "transparent" }} />
          ))}
        </div>
      </div>
    </main>
  );
}
