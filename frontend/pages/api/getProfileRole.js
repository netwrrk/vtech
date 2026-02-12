/**
 * GET PROFILE ROLE API
 * ------------------------------------------------------
 * Route: frontend/pages/api/getProfileRole.js
 *
 * Purpose:
 * Server-side API endpoint that retrieves a user's role
 * from the Supabase "Profile" table using their userId.
 *
 * Core Responsibilities:
 * - Accept POST requests only
 * - Validate presence of userId in request body
 * - Query Supabase for the user’s role
 * - Return role (default: "user") or appropriate error
 *
 * Data Sources:
 * - Supabase (Profile table)
 * - Environment variables:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *
 * Security / Env:
 * - Uses SUPABASE_SERVICE_ROLE_KEY (server-only)
 * - Must never be exposed to client-side code
 * - Endpoint restricted to POST method
 */

import { createClient } from "@supabase/supabase-js";
 
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // service role here
);
 
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
 
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "Missing userId" });
 
  try {
    const { data, error } = await supabase
      .from("Profile")
      .select("role")
      .eq("id", userId)
      .single();
 
    if (error) throw error;
 
    res.status(200).json({ role: data?.role || "user" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}