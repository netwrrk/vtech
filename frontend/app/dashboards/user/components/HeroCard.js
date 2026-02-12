/**
 * HERO CARD COMPONENT
 * ------------------------------------------------------
 * Route: frontend/app/user-dashboard/components/HeroCard.js
 *
 * Purpose:
 * Featured status card displayed on the User Dashboard.
 * Highlights system health and secure connection state
 * with a visual device preview.
 *
 * Core Responsibilities:
 * - Display primary system stat (value + label)
 * - Show secure connection pill with status text
 * - Provide optional open action via onOpen callback
 * - Render device preview mock on right panel
 *
 * Data Sources:
 * - Props: statValue, statLabel, primary, secondary, rightLabel, onOpen
 * - Local SVG icon components
 *
 * Security / Env:
 * - No environment dependencies (UI-only component)
 */

import styles from "../page.module.css";

const STROKE = 1.6;

function IconBolt(props) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconLink(props) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M10 13a5 5 0 0 1 0-7l1.5-1.5a5 5 0 0 1 7 7L17 13"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      <path
        d="M14 11a5 5 0 0 1 0 7L12.5 19.5a5 5 0 0 1-7-7L7 11"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconChevronRight(props) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M10 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function HeroCard({
  statValue = "98%",
  statLabel = "system health",
  primary = "On",
  secondary = "secure connection",
  rightLabel = "device preview",
  onOpen, // optional: click/enter to open details
}) {
  const openable = typeof onOpen === "function";

  return (
    <section className={styles.heroCard} aria-label="Featured device">
      <div className={styles.heroLeft}>
        {/* mini eyebrow row like the reference: label + tiny affordance */}
        <div className={styles.heroEyebrowRow}>
          <div className={styles.heroEyebrowLabel}>Device Status</div>

          <button
            type="button"
            onClick={openable ? onOpen : undefined}
            aria-label="Open device details"
            className={`${styles.heroOpenBtn} ${
              openable ? "" : styles.heroOpenBtnDisabled
            }`}
            disabled={!openable}
          >
            <IconChevronRight />
          </button>
        </div>

        <div className={styles.statRow}>
          <div className={styles.statMain}>
            <div className={styles.statValue}>{statValue}</div>
          </div>

          <div className={styles.statLabel}>
            <IconBolt />
            {statLabel}
          </div>
        </div>

        <div className={styles.pill}>
          <div>
            <div className={styles.pillMain}>{primary}</div>
            <div className={styles.pillSub}>
              <span className={styles.pillInline}>
                <IconLink />
                {secondary}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.heroRight} aria-label={rightLabel}>
        {/* device silhouette */}
        <div className={styles.deviceMock} />
      </div>
    </section>
  );
}
