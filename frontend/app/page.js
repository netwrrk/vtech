/**
 * ROOT PAGE (REDIRECT)
 * ------------------------------------------------------
 * Route: app/page.js
 *
 * Purpose:
 * Entry point of the application.
 * Immediately redirects users to the authentication flow.
 *
 * Core Responsibilities:
 * - Redirect "/" to "/auth/sign-in"
 *
 * Data Sources:
 * - next/navigation redirect()
 *
 * Security / Env:
 * - No environment variables required
 * - Ensures unauthenticated users land on sign-in by default
 */

import { redirect } from "next/navigation";

export default function Home() {
  redirect("/auth/sign-in");
}
