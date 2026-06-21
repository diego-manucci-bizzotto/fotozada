import { createClient } from "npm:@supabase/supabase-js@2";

// Service-role client. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected
// automatically into the Edge Function runtime — the key never reaches the front.
export function supabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
