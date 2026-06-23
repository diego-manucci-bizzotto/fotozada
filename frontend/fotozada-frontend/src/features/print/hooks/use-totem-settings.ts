import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { totemSettingsSchema, type TotemSettings } from "../schema";

async function fetchSettings(kioskId: string): Promise<TotemSettings> {
  const { data, error } = await supabase
    .from("kiosk_settings")
    .select("max_sheets_per_batch, queue_paused, require_approval")
    .eq("kiosk_id", kioskId)
    .single();
  if (error) throw error;
  return totemSettingsSchema.parse(data);
}

export function useTotemSettings(kioskId: string) {
  return useQuery({
    queryKey: ["totem-settings", kioskId],
    queryFn: () => fetchSettings(kioskId),
    staleTime: 60_000,
  });
}
