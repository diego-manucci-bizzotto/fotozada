import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { submitBatch } from "../api/submit-batch";
import type { PhotoItem } from "../types";

interface Vars {
  kioskId: string;
  items: PhotoItem[];
  clientRequestId: string;
}

export function useSubmitBatch() {
  return useMutation({
    mutationFn: ({ kioskId, items, clientRequestId }: Vars) =>
      submitBatch(kioskId, items, clientRequestId),
    onError: (e: unknown) =>
      toast.error("Falha ao enviar", {
        description: e instanceof Error ? e.message : String(e),
      }),
  });
}
