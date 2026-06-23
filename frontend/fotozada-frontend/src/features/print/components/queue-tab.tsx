import { Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LAYOUTS } from "../lib/layouts";
import type { JobStatus, PhotoItem } from "../types";
import { useBatchStatus } from "../hooks/use-batch-status";

const LABEL: Record<JobStatus, string> = {
  pending_approval: "Aguardando",
  queued: "Na fila",
  printing: "Imprimindo…",
  done: "Pronto!",
  error: "Erro",
  canceled: "Cancelado",
};

const VARIANT: Record<JobStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending_approval: "outline",
  queued: "outline",
  printing: "secondary",
  done: "default",
  error: "destructive",
  canceled: "destructive",
};

interface BatchResult {
  batchId: string;
  jobIds: string[];
  status: JobStatus;
  items: PhotoItem[];
}

interface Props {
  result: BatchResult | null;
  items: PhotoItem[];
  onNew: () => void;
}

function ActiveQueue({ result, onNew }: { result: BatchResult; onNew: () => void }) {
  const statuses = useBatchStatus(result.batchId, result.jobIds, result.status);

  const jobs = result.jobIds.map((id, i) => ({
    id,
    layout: result.items[i]?.layout,
    copies: result.items[i]?.copies ?? 1,
  }));

  const total = jobs.reduce((s, j) => s + j.copies, 0);
  const done = jobs
    .filter((j) => statuses[j.id] === "done")
    .reduce((s, j) => s + j.copies, 0);
  const allDone = jobs.length > 0 && jobs.every((j) => statuses[j.id] === "done");

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border bg-white p-4">
        <div className="mb-3">
          <h3 className="text-base font-semibold text-foreground">
            {allDone ? "Tudo pronto! 🎉" : "Acompanhe sua impressão"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {done} de {total} folha{total !== 1 ? "s" : ""} pronta{done !== 1 ? "s" : ""}
          </p>
        </div>
        <Progress value={total ? (done / total) * 100 : 0} className="mb-4 h-2" />
        <ul className="grid gap-2">
          {jobs.map((j, i) => {
            const st = statuses[j.id] ?? "queued";
            return (
              <li
                key={j.id}
                className="flex items-center justify-between rounded-xl border px-3 py-2.5"
              >
                <span className="text-sm text-foreground">
                  {i + 1}. {j.layout ? LAYOUTS[j.layout].label : "Item"} ×{j.copies}
                </span>
                <Badge variant={VARIANT[st]} className="text-[11px]">
                  {LABEL[st]}
                </Badge>
              </li>
            );
          })}
        </ul>
      </div>

      {allDone && (
        <Button size="lg" className="rounded-xl" onClick={onNew}>
          Nova impressão
        </Button>
      )}
    </div>
  );
}

export function QueueTab({ result, onNew }: Props) {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/15 px-6 py-16">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <Inbox className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold text-foreground">Fila vazia</h3>
        <p className="mt-1 text-center text-sm leading-snug text-muted-foreground">
          Adicione fotos e toque em Imprimir para vê-las aqui
        </p>
      </div>
    );
  }

  return <ActiveQueue result={result} onNew={onNew} />;
}
