/**
 * ROOT LAYOUT
 * ------------------------------------------------------
 * Route: app/layout.js
 *
 * Purpose:
 * Global application layout wrapper for the entire Next.js app.
 * Defines fonts, base metadata, and top-level HTML structure.
 *
 * Core Responsibilities:
 * - Load and configure global fonts (Geist Sans + Mono)
 * - Apply global CSS (globals.css)
 * - Define application metadata (title, description)
 * - Provide top-level HTML/body structure
 * - Wrap all pages inside a shared app-shell container
 *
 * Data Sources:
 * - next/font/google (Geist, Geist_Mono)
 * - globals.css
 *
 * Security / Env:
 * - No environment variables required
 * - No runtime data access
 */

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "VTech",
  description: "Remote tech assistance dashboard (MVP)",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
          antialiased
        `}
      >
        {/* Neutral app wrapper.
            Pages own their own backgrounds + layout. */}
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}
