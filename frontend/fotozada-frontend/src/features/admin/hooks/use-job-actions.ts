import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { JobStatus } from "@/features/print/types";

const JOBS_KEY = ["admin", "jobs"];

export function useJobActions() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: JOBS_KEY });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: JobStatus }) => {
      const { error } = await supabase.from("print_jobs").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const reprint = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("admin_reprint_job", { p_job_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Reimpressão na fila");
    },
  });

  const simulate = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("simulate-printer", {
        body: { kiosk_id: "kiosk-01" },
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { setStatus, reprint, simulate };
}
