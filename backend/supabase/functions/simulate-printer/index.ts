// simulate-printer: stand-in for the Raspberry Pi worker. Thin HTTP wrapper
// around the tick_simulated_printer RPC, so the admin "simular agora" button can
// advance the queue on demand. The automatic cadence is driven by pg_cron.
// To go live with a real printer: stop the cron and run the Pi worker instead.
import { corsHeaders, json } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  let kioskId = "kiosk-01";
  try {
    const b = await req.json();
    if (b?.kiosk_id) kioskId = String(b.kiosk_id);
  } catch {
    // no body — use default kiosk
  }

  const admin = supabaseAdmin();
  const { data, error } = await admin.rpc("tick_simulated_printer", { p_kiosk_id: kioskId });
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true, ...data });
});
