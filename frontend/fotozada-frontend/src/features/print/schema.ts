import { z } from "zod";

// Settings the totem needs (subset of kiosk_settings). anon can read these.
export const totemSettingsSchema = z.object({
  max_sheets_per_batch: z.number().int().positive(),
  queue_paused: z.boolean().optional(),
  require_approval: z.boolean().optional(),
});
export type TotemSettings = z.infer<typeof totemSettingsSchema>;

// Response shape from the create-print-job Edge Function.
export const submitResultSchema = z.object({
  batch_id: z.string().uuid().optional(),
  job_ids: z.array(z.string()).optional(),
  status: z.string().optional(),
  idempotent: z.boolean().optional(),
  blocked: z.boolean().optional(),
  reason: z.string().optional(),
  max: z.number().optional(),
  requested: z.number().optional(),
  error: z.string().optional(),
});
export type SubmitResult = z.infer<typeof submitResultSchema>;
