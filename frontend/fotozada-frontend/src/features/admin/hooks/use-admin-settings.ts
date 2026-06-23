import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { AdminSettings } from "../types";

const KIOSK = "kiosk-01";
const KEY = ["admin", "settings"];

export function useAdminSettings() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<AdminSettings> => {
      const { data, error } = await supabase
        .from("kiosk_settings")
        .select("kiosk_id, queue_paused, require_approval, max_sheets_per_batch")
        .eq("kiosk_id", KIOSK)
        .single();
      if (error) throw error;
      return data as AdminSettings;
    },
  });

  const update = useMutation({
    mutationFn: async (patch: Partial<AdminSettings>) => {
      const { error } = await supabase
        .from("kiosk_settings")
        .update(patch)
        .eq("kiosk_id", KIOSK);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Configurações salvas");
    },
    onError: (e: unknown) =>
      toast.error("Erro ao salvar", {
        description: e instanceof Error ? e.message : String(e),
      }),
  });

  return { query, update };
}
