import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { JobStatus } from "../types";

// Subscribes to the per-batch Realtime Broadcast channel and keeps a
// job_id -> status map. The batch id (unguessable uuid) is the capability.
export function useBatchStatus(
  batchId: string,
  jobIds: string[],
  initialStatus: JobStatus,
) {
  const [statuses, setStatuses] = useState<Record<string, JobStatus>>(() =>
    Object.fromEntries(jobIds.map((id) => [id, initialStatus])),
  );

  useEffect(() => {
    const channel = supabase
      .channel(`batch-status:${batchId}`, { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "job_status" }, ({ payload }) => {
        if (!payload?.job_id) return;
        setStatuses((prev) => ({ ...prev, [payload.job_id]: payload.status as JobStatus }));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [batchId]);

  return statuses;
}
