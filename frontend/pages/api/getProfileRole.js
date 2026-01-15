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