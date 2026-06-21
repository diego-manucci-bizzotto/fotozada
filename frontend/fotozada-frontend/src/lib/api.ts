import { supabase } from "./supabase";
import { getDeviceId, newId } from "./device";
import type { CartItem } from "./types";

export interface SubmitResult {
  batch_id?: string;
  job_ids?: string[];
  status?: string;
  idempotent?: boolean;
  blocked?: boolean;
  reason?: string;
  max?: number;
  requested?: number;
  error?: string;
}

interface UploadSlot {
  idx: number;
  layout: string;
  photos: { idx: number; path: string; token: string }[];
  composed: { path: string; token: string };
}

// Full submission: request signed URLs -> upload files -> create the job batch.
// clientRequestId is supplied by the caller and kept stable across retries so
// the backend can dedupe a double submit (idempotency).
export async function submitBatch(
  kioskId: string,
  items: CartItem[],
  clientRequestId: string,
): Promise<SubmitResult> {
  const uploadId = newId();
  const deviceId = getDeviceId();

  // 1) signed upload URLs
  const { data: ru, error: ruErr } = await supabase.functions.invoke("request-upload", {
    body: {
      kiosk_id: kioskId,
      upload_id: uploadId,
      items: items.map((it, idx) => ({
        idx,
        layout: it.layout,
        photo_count: it.photos.length,
        copies: it.copies,
      })),
    },
  });
  if (ruErr) throw new Error(ruErr.message);
  if (ru.error) throw new Error(ru.error);
  if (ru.blocked) return ru as SubmitResult;

  const slots: UploadSlot[] = ru.items;

  // 2) upload every photo + composed sheet
  const itemsPayload = [];
  for (let idx = 0; idx < items.length; idx++) {
    const it = items[idx];
    const slot = slots.find((s) => s.idx === idx)!;

    const photosPayload = [];
    for (let p = 0; p < it.photos.length; p++) {
      const photo = it.photos[p];
      const target = slot.photos[p];
      const up = await supabase.storage
        .from("prints")
        .uploadToSignedUrl(target.path, target.token, photo.blob, {
          contentType: "image/jpeg",
        });
      if (up.error) throw new Error(up.error.message);
      photosPayload.push({
        idx: p,
        storage_path: target.path,
        width: photo.width,
        height: photo.height,
        size_bytes: photo.blob.size,
        crop: photo.crop,
      });
    }

    const cu = await supabase.storage
      .from("prints")
      .uploadToSignedUrl(slot.composed.path, slot.composed.token, it.composedBlob, {
        contentType: "image/png",
      });
    if (cu.error) throw new Error(cu.error.message);

    itemsPayload.push({
      idx,
      layout: it.layout,
      copies: it.copies,
      composed_path: slot.composed.path,
      composed_hash: it.composedHash,
      photos: photosPayload,
    });
  }

  // 3) create the batch (idempotency + sheet-limit enforced server-side)
  const { data: cj, error: cjErr } = await supabase.functions.invoke("create-print-job", {
    body: {
      kiosk_id: kioskId,
      device_id: deviceId,
      client_request_id: clientRequestId,
      items: itemsPayload,
    },
  });
  if (cjErr) throw new Error(cjErr.message);
  return cj as SubmitResult;
}
