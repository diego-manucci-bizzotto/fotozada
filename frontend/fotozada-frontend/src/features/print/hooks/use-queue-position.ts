import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface QueuePositionState {
  pending: boolean;
  ahead: number;
}

// Polls the queue_position RPC (capability = the unguessable batch id).
// Returns null until the first poll resolves (or while disabled) so callers
// can tell "not checked yet" apart from "checked, nothing pending" — the
// latter matters when resuming a batch after a refresh: if it already
// finished printing while the tab was closed, no Realtime broadcast will
// ever arrive to say so, so `pending: false` here is the only signal.
export function useQueuePosition(batchId: string | undefined, enabled: boolean) {
  const [state, setState] = useState<QueuePositionState | null>(null);

  useEffect(() => {
    if (!batchId || !enabled) {
      setState(null);
      return;
    }
    let active = true;

    async function fetchPosition() {
      const { data, error } = await supabase.rpc("queue_position", { p_batch_id: batchId });
      if (!active) return;
      if (error || !data) {
        setState(null);
        return;
      }
      setState(data as QueuePositionState);
    }

    fetchPosition();
    const id = setInterval(fetchPosition, 4000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [batchId, enabled]);

  return state;
}
