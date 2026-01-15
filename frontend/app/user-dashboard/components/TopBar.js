// frontend/app/user-dashboard/components/TopBar.js
import styles from "../page.module.css";

function IconMenu(props) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconUser(props) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4.5 20c1.6-3.3 4.5-5 7.5-5s5.9 1.7 7.5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function TopBar({
  kicker = "",
  title = "",
  onMenu,
  onSettings,
}) {
  const showCenter = Boolean((kicker || "").trim()) || Boolean((title || "").trim());

  return (
    <header className={styles.topBar}>
      <button
        className={styles.iconBtn}
        type="button"
        aria-label="Open menu"
        onClick={onMenu}
      >
        <IconMenu />
      </button>

      <div className={styles.titleWrap} aria-hidden={!showCenter}>
        {Boolean((kicker || "").trim()) && <div className={styles.kicker}>{kicker}</div>}
        {Boolean((title || "").trim()) && <div className={styles.title}>{title}</div>}
      </div>

      <button
        className={styles.iconBtn}
        type="button"
        aria-label="Open profile"
        onClick={onSettings}
      >
        <IconUser />
      </button>
    </header>
  );
}
