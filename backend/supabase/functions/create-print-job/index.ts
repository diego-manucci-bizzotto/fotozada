// create-print-job: the single security control point for submissions.
// Delegates to the create_print_batch RPC, which runs (in one transaction):
//   1. idempotency on client_request_id
//   2. per-batch sheet limit (Σ copies <= max_sheets_per_batch)
//   3. insert batch + jobs + photos
// Captures ip / user_agent as metadata.
import { corsHeaders, json } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad_json" }, 400);
  }

  const kioskId = String(body.kiosk_id ?? "kiosk-01");
  const deviceId = String(body.device_id ?? "");
  const clientRequestId = String(body.client_request_id ?? "");
  const items = Array.isArray(body.items) ? body.items : null;
  if (!deviceId || !clientRequestId || !items || items.length === 0) {
    return json({ error: "bad_request" }, 400);
  }

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || null;
  const userAgent = req.headers.get("user-agent");

  const admin = supabaseAdmin();
  const { data, error } = await admin.rpc("create_print_batch", {
    p_kiosk_id: kioskId,
    p_device_id: deviceId,
    p_client_request_id: clientRequestId,
    p_user_agent: userAgent,
    p_ip: ip,
    p_items: items,
  });

  if (error) return json({ error: "rpc_failed", detail: error.message }, 500);
  // data is one of: { error }, { blocked, ... }, { batch_id, job_ids, idempotent }
  return json(data, 200);
});
