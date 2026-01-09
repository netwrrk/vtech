// frontend/app/user-dashboard/components/BottomNav.js
"use client";

import styles from "../page.module.css";

function IconHome(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 10.5 12 4l8 6.5V20a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 20v-9.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 21.5v-6.2c0-.7.6-1.3 1.3-1.3h2.4c.7 0 1.3.6 1.3 1.3v6.2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconDevice(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M7 4.5h10A2.5 2.5 0 0 1 19.5 7v10A2.5 2.5 0 0 1 17 19.5H7A2.5 2.5 0 0 1 4.5 17V7A2.5 2.5 0 0 1 7 4.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M9 19.5v1.5h6v-1.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconTicket(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2.5 2.5 0 0 0 0 5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2.5 2.5 0 0 0 0-5V8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 10h6M9 14h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconChat(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M20 12a7.5 7.5 0 0 1-7.5 7.5H8l-4 2 1.4-3.7A7.5 7.5 0 1 1 20 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M8.7 12h.01M12 12h.01M15.3 12h.01"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconUser(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 12a4.2 4.2 0 1 0-4.2-4.2A4.2 4.2 0 0 0 12 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4.5 20.5a7.5 7.5 0 0 1 15 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

const items = [
  { key: "home", label: "Home", Icon: IconHome },
  { key: "devices", label: "Devices", Icon: IconDevice },
  { key: "tickets", label: "Tickets", Icon: IconTicket },
  { key: "chat", label: "Messages", Icon: IconChat },
  { key: "profile", label: "Profile", Icon: IconUser },
];

export default function BottomNav({ activeKey = "home", onChange }) {
  return (
    <nav className={styles.bottomNav} aria-label="Bottom navigation">
      {items.map(({ key, label, Icon }) => {
        const active = key === activeKey;
        return (
          <button
            key={key}
            type="button"
            className={`${styles.navBtn} ${active ? styles.navActive : ""}`}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            onClick={() => onChange?.(key)}
          >
            <Icon />
          </button>
        );
      })}
    </nav>
  );
}
