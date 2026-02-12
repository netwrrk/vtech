/**
 * DASHBOARD ICONS MODULE
 * ------------------------------------------------------
 * Route: frontend/app/user-dashboard/components/icons.js
 *
 * Purpose:
 * Centralized SVG icon library for the User Dashboard.
 * Provides category icons, action tile icons, and
 * convenience mapping objects for dynamic rendering.
 *
 * Core Responsibilities:
 * - Define reusable SVG icon components
 * - Provide category icons for equipment filtering
 * - Provide action tile icons for dashboard features
 * - Export CATEGORY_ICON_MAP and DEVICE_ICON_MAP
 *   for dynamic lookup in UI components
 *
 * Data Sources:
 * - CATEGORY_ICON_MAP (category → icon component)
 * - DEVICE_ICON_MAP (action key → icon component)
 *
 * Security / Env:
 * - No environment dependencies (static UI asset module)
 */

import React from "react";

const STROKE = 1.8;

function Base({ children, size = 18, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

/* ---------- Category icons (hands-on assistance) ---------- */

export function IconAll(props) {
  return (
    <Base {...props}>
      {/* stacked layers (all) */}
      <path
        d="M12 5.2 20 9l-8 3.8L4 9l8-3.8Z"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <path
        d="M4.6 12.1 12 15.6l7.4-3.5"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.6 15.3 12 18.8l7.4-3.5"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Base>
  );
}

export function IconFood(props) {
  return (
    <Base {...props}>
      {/* simple oven/appliance */}
      <path
        d="M6.5 6.5h11A2.5 2.5 0 0 1 20 9v9A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 18V9a2.5 2.5 0 0 1 2.5-2.5Z"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <path
        d="M4 10h16"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      <path
        d="M8 8.2h0M11 8.2h0M14 8.2h0"
        stroke="currentColor"
        strokeWidth={STROKE + 1.2}
        strokeLinecap="round"
      />
      <path
        d="M8.2 14.2h7.6v4H8.2v-4Z"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
    </Base>
  );
}

export function IconVending(props) {
  return (
    <Base {...props}>
      {/* vending machine */}
      <path
        d="M7 4.5h10A2.5 2.5 0 0 1 19.5 7v10A2.5 2.5 0 0 1 17 19.5H7A2.5 2.5 0 0 1 4.5 17V7A2.5 2.5 0 0 1 7 4.5Z"
        stroke="currentColor"
        strokeWidth={STROKE}
      />
      <path
        d="M9 8h3M9 11h3M9 14h3"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      <path
        d="M14.8 8.2h0"
        stroke="currentColor"
        strokeWidth={STROKE + 1.4}
        strokeLinecap="round"
      />
      <path
        d="M14.8 11.2h0"
        stroke="currentColor"
        strokeWidth={STROKE + 1.4}
        strokeLinecap="round"
      />
      <path
        d="M14.8 15.6h2.2"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    </Base>
  );
}

export function IconPOS(props) {
  return (
    <Base {...props}>
      {/* card + swipe */}
      <path
        d="M6.5 7h11A2.5 2.5 0 0 1 20 9.5v5A2.5 2.5 0 0 1 17.5 17h-11A2.5 2.5 0 0 1 4 14.5v-5A2.5 2.5 0 0 1 6.5 7Z"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <path
        d="M4 10h16"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      <path
        d="M8 14.2h4.5"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      <path
        d="M14.5 19.5l2.2-2.2"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      <path
        d="M16.7 19.5l-2.2-2.2"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    </Base>
  );
}

export function IconHVAC(props) {
  return (
    <Base {...props}>
      {/* fan */}
      <path
        d="M12 13.2a1.2 1.2 0 1 0 0-2.4a1.2 1.2 0 0 0 0 2.4Z"
        stroke="currentColor"
        strokeWidth={STROKE}
      />
      <path
        d="M12 3.8c2.3 0 3.4 2.1 2.2 3.8c-.5.8-1.2 1.3-2.2 1.3"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      <path
        d="M20.2 12c0 2.3-2.1 3.4-3.8 2.2c-.8-.5-1.3-1.2-1.3-2.2"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      <path
        d="M12 20.2c-2.3 0-3.4-2.1-2.2-3.8c.5-.8 1.2-1.3 2.2-1.3"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      <path
        d="M3.8 12c0-2.3 2.1-3.4 3.8-2.2c.8.5 1.3 1.2 1.3 2.2"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    </Base>
  );
}

export function IconElectrical(props) {
  return (
    <Base {...props}>
      {/* plug */}
      <path
        d="M9 7v4M15 7v4"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      <path
        d="M7.5 11h9v2.2A4.5 4.5 0 0 1 12 17.7A4.5 4.5 0 0 1 7.5 13.2V11Z"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <path
        d="M12 17.7V20.2"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    </Base>
  );
}

export function IconOther(props) {
  return (
    <Base {...props}>
      {/* grid/dots */}
      <path
        d="M7.2 7.2h0M12 7.2h0M16.8 7.2h0M7.2 12h0M12 12h0M16.8 12h0M7.2 16.8h0M12 16.8h0M16.8 16.8h0"
        stroke="currentColor"
        strokeWidth={STROKE + 1.6}
        strokeLinecap="round"
      />
    </Base>
  );
}

/* ---------- Action tile icons ---------- */

export function IconStart(props) {
  return (
    <Base {...props}>
      {/* play in a rounded box */}
      <path
        d="M7 4.8h10A2.8 2.8 0 0 1 19.8 7.6v8.8A2.8 2.8 0 0 1 17 19.2H7A2.8 2.8 0 0 1 4.2 16.4V7.6A2.8 2.8 0 0 1 7 4.8Z"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <path
        d="M11 9.6l4 2.4-4 2.4V9.6Z"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
    </Base>
  );
}

export function IconWorkOrder(props) {
  return (
    <Base {...props}>
      {/* clipboard */}
      <path
        d="M8 6.5h8A2.5 2.5 0 0 1 18.5 9v10A2.5 2.5 0 0 1 16 21.5H8A2.5 2.5 0 0 1 5.5 19V9A2.5 2.5 0 0 1 8 6.5Z"
        stroke="currentColor"
        strokeWidth={STROKE}
      />
      <path
        d="M9 6.5a3 3 0 0 1 6 0"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      <path
        d="M8.8 12h6.4M8.8 15.5h6.4"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    </Base>
  );
}

export function IconActiveJob(props) {
  return (
    <Base {...props}>
      {/* briefcase */}
      <path
        d="M8 7.5V6.8A2.8 2.8 0 0 1 10.8 4h2.4A2.8 2.8 0 0 1 16 6.8v.7"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      <path
        d="M5.5 9h13A2.5 2.5 0 0 1 21 11.5v6A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-6A2.5 2.5 0 0 1 5.5 9Z"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <path
        d="M3 13h18"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    </Base>
  );
}

export function IconEquipment(props) {
  return (
    <Base {...props}>
      {/* location pin + list */}
      <path
        d="M12 21s6-5 6-10a6 6 0 0 0-12 0c0 5 6 10 6 10Z"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <path
        d="M12 11.2a1.8 1.8 0 1 0 0-3.6a1.8 1.8 0 0 0 0 3.6Z"
        stroke="currentColor"
        strokeWidth={STROKE}
      />
    </Base>
  );
}

/* ---------- Convenience maps (used by page.js) ---------- */

export const CATEGORY_ICON_MAP = {
  all: IconAll,
  food: IconFood,
  vending: IconVending,
  pos: IconPOS,
  hvac: IconHVAC,
  electrical: IconElectrical,
  other: IconOther,
};

export const DEVICE_ICON_MAP = {
  start: IconStart,
  workorder: IconWorkOrder,
  active: IconActiveJob,
  equipment: IconEquipment,
};
