// request-upload: validates the batch manifest and returns signed upload URLs
// for every source photo + composed sheet. Keeps direct Storage write away from
// anon — the client can only upload to the exact paths we mint tokens for.
import { corsHeaders, json } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";

const PHOTOS_PER_LAYOUT: Record<string, number> = {
  single_10x15: 1,
  strip_3: 3,
};

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
  const uploadId = String(body.upload_id ?? "");
  const items = Array.isArray(body.items) ? body.items : null;
  if (!uploadId || !items || items.length === 0) {
    return json({ error: "bad_request" }, 400);
  }

  const admin = supabaseAdmin();

  const { data: settings, error: sErr } = await admin
    .from("kiosk_settings")
    .select("max_sheets_per_batch")
    .eq("kiosk_id", kioskId)
    .single();
  if (sErr || !settings) return json({ error: "unknown_kiosk" }, 400);

  // Validate layouts/photo counts and the sheet limit up front (real
  // enforcement still happens in create-print-job).
  let totalSheets = 0;
  for (const it of items) {
    const need = PHOTOS_PER_LAYOUT[it.layout];
    if (!need) return json({ error: "bad_layout", layout: it.layout }, 400);
    const count = Number(it.photo_count ?? need);
    if (count !== need) {
      return json({ error: "bad_photo_count", layout: it.layout, expected: need }, 400);
    }
    totalSheets += Math.max(1, Number(it.copies ?? 1));
  }
  if (totalSheets > settings.max_sheets_per_batch) {
    return json(
      { blocked: true, reason: "batch_limit", max: settings.max_sheets_per_batch, requested: totalSheets },
      200,
    );
  }

  const out: any[] = [];
  for (const it of items) {
    const idx = Number(it.idx);
    const base = `${kioskId}/${uploadId}/item-${idx}`;
    const need = PHOTOS_PER_LAYOUT[it.layout];

    const photos: any[] = [];
    for (let p = 0; p < need; p++) {
      const path = `${base}/photo-${p}.jpg`;
      const { data, error } = await admin.storage.from("prints").createSignedUploadUrl(path);
      if (error) return json({ error: "sign_failed", detail: error.message }, 500);
      photos.push({ idx: p, path: data.path, token: data.token });
    }

    const composedPath = `${base}/composed.png`;
    const { data: cData, error: cErr } = await admin.storage
      .from("prints")
      .createSignedUploadUrl(composedPath);
    if (cErr) return json({ error: "sign_failed", detail: cErr.message }, 500);

    out.push({
      idx,
      layout: it.layout,
      photos,
      composed: { path: cData.path, token: cData.token },
    });
  }

  return json({ upload_id: uploadId, items: out });
});
