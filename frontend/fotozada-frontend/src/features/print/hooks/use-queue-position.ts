import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface QueuePositionResult {
  pending: boolean;
  ahead: number;
}

// Polls the queue_position RPC (capability = the unguessable batch id) and
// returns how many jobs print before this batch — or null when the batch has
// nothing pending (done / not yet deployed / error). Place in line = ahead + 1.
export function useQueuePosition(batchId: string | undefined, enabled: boolean) {
  const [ahead, setAhead] = useState<number | null>(null);

  useEffect(() => {
    if (!batchId || !enabled) {
      setAhead(null);
      return;
    }
    let active = true;

    async function fetchPosition() {
      const { data, error } = await supabase.rpc("queue_position", { p_batch_id: batchId });
      if (!active) return;
      if (error || !data) {
        setAhead(null);
        return;
      }
      const res = data as QueuePositionResult;
      setAhead(res.pending ? res.ahead : null);
    }

    fetchPosition();
    const id = setInterval(fetchPosition, 4000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [batchId, enabled]);

  return ahead;
}
