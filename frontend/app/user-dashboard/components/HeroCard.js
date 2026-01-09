// frontend/app/user-dashboard/components/HeroCard.js
import styles from "../page.module.css";

function IconBolt(props) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconLink(props) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M10 13a5 5 0 0 1 0-7l1.5-1.5a5 5 0 0 1 7 7L17 13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M14 11a5 5 0 0 1 0 7L12.5 19.5a5 5 0 0 1-7-7L7 11"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function HeroCard({
  statValue = "98%",
  statLabel = "system health",
  primary = "On",
  secondary = "secure connection",
  rightLabel = "device",
}) {
  return (
    <section className={styles.heroCard}>
      <div className={styles.heroLeft}>
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
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <IconLink />
                {secondary}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.heroRight} aria-label={rightLabel}>
        <div className={styles.deviceMock} />
      </div>
    </section>
  );
}
