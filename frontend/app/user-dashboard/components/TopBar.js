// frontend/app/user-dashboard/components/TopBar.js
import styles from "../page.module.css";

function IconDots(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="6" cy="12" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="18" cy="12" r="1.6" fill="currentColor" />
    </svg>
  );
}

function IconGear(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 15.25a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M19.4 13.5c.05-.5.05-1 0-1.5l1.55-1.2a.9.9 0 0 0 .22-1.14l-1.48-2.56a.9.9 0 0 0-1.08-.39l-1.82.74a7.7 7.7 0 0 0-1.3-.75l-.28-1.94A.9.9 0 0 0 13.33 3h-2.66a.9.9 0 0 0-.89.75l-.28 1.94c-.45.2-.88.45-1.3.75l-1.82-.74a.9.9 0 0 0-1.08.39L3.82 8.65a.9.9 0 0 0 .22 1.14L5.6 11c-.05.5-.05 1 0 1.5l-1.56 1.2a.9.9 0 0 0-.22 1.14l1.48 2.56c.23.4.7.56 1.08.39l1.82-.74c.42.3.85.55 1.3.75l.28 1.94c.07.43.45.75.89.75h2.66c.44 0 .82-.32.89-.75l.28-1.94c.45-.2.88-.45 1.3-.75l1.82.74c.38.17.85.01 1.08-.39l1.48-2.56a.9.9 0 0 0-.22-1.14l-1.55-1.2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function TopBar({
  kicker = "VTECH",
  title = "My Device",
  onMenu,
  onSettings,
}) {
  return (
    <header className={styles.topBar}>
      <button className={styles.iconBtn} type="button" aria-label="Open menu" onClick={onMenu}>
        <IconDots />
      </button>

      <div className={styles.titleWrap}>
        <div className={styles.kicker}>{kicker}</div>
        <div className={styles.title}>{title}</div>
      </div>

      <button
        className={styles.iconBtn}
        type="button"
        aria-label="Open settings"
        onClick={onSettings}
      >
        <IconGear />
      </button>
    </header>
  );
}
