import { motion, AnimatePresence } from "framer-motion";
import { Inbox, PartyPopper, Printer } from "lucide-react";
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
  const hasError = jobs.some((j) => statuses[j.id] === "error" || statuses[j.id] === "canceled");
  const showNew = allDone || hasError;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="grid gap-4"
    >
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="p-4">
          <div className="mb-3 flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 ${allDone ? "animate-bounce" : "animate-pulse"}`}
            >
              {allDone ? (
                <PartyPopper className="h-5 w-5 text-primary" />
              ) : (
                <Printer className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {allDone ? "Tudo pronto!" : "Imprimindo…"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {done} de {total} folha{total !== 1 ? "s" : ""} pronta{done !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <Progress value={total ? (done / total) * 100 : 0} className="mb-4 h-2" />
          <ul className="grid gap-2">
            <AnimatePresence>
              {jobs.map((j, i) => {
                const st = statuses[j.id] ?? "queued";
                return (
                  <motion.li
                    key={j.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08, type: "spring", stiffness: 300, damping: 25 }}
                    className="flex items-center justify-between rounded-xl border px-3 py-2.5"
                  >
                    <span className="text-sm text-foreground">
                      {i + 1}. {j.layout ? LAYOUTS[j.layout].label : "Item"} ×{j.copies}
                    </span>
                    <motion.div
                      key={st}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                      <Badge variant={VARIANT[st]} className="text-[11px]">
                        {LABEL[st]}
                      </Badge>
                    </motion.div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        </div>
      </div>

      <AnimatePresence>
        {showNew && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Button
              size="lg"
              className="w-full rounded-xl bg-gradient-to-r from-primary to-blue-700 shadow-md shadow-primary/25"
              onClick={onNew}
            >
              Nova impressão
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function QueueTab({ result, onNew }: Props) {
  if (!result) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/15 px-6 py-16"
      >
        <div className="mb-4 flex h-14 w-14 animate-float items-center justify-center rounded-2xl bg-muted">
          <Inbox className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold text-foreground">Fila vazia</h3>
        <p className="mt-1 text-center text-sm leading-snug text-muted-foreground">
          Adicione fotos e toque em Imprimir para vê-las aqui
        </p>
      </motion.div>
    );
  }

  return <ActiveQueue result={result} onNew={onNew} />;
}
