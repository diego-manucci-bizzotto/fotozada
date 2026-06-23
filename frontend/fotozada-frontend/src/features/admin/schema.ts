import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const settingsSchema = z.object({
  queue_paused: z.boolean(),
  require_approval: z.boolean(),
  max_sheets_per_batch: z.number().int().min(1).max(50),
});
export type SettingsValues = z.infer<typeof settingsSchema>;
