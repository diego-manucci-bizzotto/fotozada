import { motion, AnimatePresence } from "framer-motion";
import { PartyPopper, Printer } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { LAYOUTS } from "../../print/lib/layouts";
import { useBatchStatus } from "../../print/hooks/use-batch-status";
import type { JobStatus } from "../../print/types";
import type { BatchResult } from "../types";

const LABEL: Record<JobStatus, string> = {
  pending_approval: "Aguardando",
  queued: "Na fila",
  printing: "Imprimindo…",
  done: "Pronto!",
  error: "Erro",
  canceled: "Cancelado",
};

const BADGE_CLASS: Record<JobStatus, string> = {
  pending_approval: "bg-white/15 text-white/70 border-white/20",
  queued: "bg-white/15 text-white/80 border-white/20",
  printing: "bg-amber-500/20 text-amber-300 border-amber-400/30",
  done: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
  error: "bg-red-500/20 text-red-300 border-red-400/30",
  canceled: "bg-red-500/15 text-red-300/70 border-red-400/20",
};

export function StatusStep({
  result,
  onNew,
}: {
  result: BatchResult;
  onNew: () => void;
}) {
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
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-6"
    >
      <motion.div
        animate={allDone ? { scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] } : {}}
        transition={{ duration: 0.6 }}
        className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm"
      >
        {allDone ? (
          <PartyPopper className="h-10 w-10 text-amber-400" />
        ) : (
          <Printer className="h-10 w-10 animate-pulse text-amber-400" />
        )}
      </motion.div>

      <div className="text-center">
        <h2 className="text-xl font-bold text-white">
          {allDone ? "Pronto! Retire sua foto" : "Imprimindo…"}
        </h2>
        <p className="mt-1 text-sm text-white/50">
          {done} de {total} folha{total !== 1 ? "s" : ""} pronta{done !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="w-full max-w-xs">
        <Progress value={total ? (done / total) * 100 : 0} className="h-3 bg-white/10" />
      </div>

      <div className="w-full max-w-xs space-y-2">
        {jobs.map((j, i) => {
          const st = statuses[j.id] ?? "queued";
          return (
            <motion.div
              key={j.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm"
            >
              <span className="text-sm text-white">
                {j.layout ? LAYOUTS[j.layout].label : "Item"} ×{j.copies}
              </span>
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${BADGE_CLASS[st]}`}>
                {LABEL[st]}
              </span>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {allDone && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNew}
              className="rounded-2xl bg-amber-500 px-8 py-3.5 font-bold text-white shadow-lg shadow-amber-500/25"
            >
              Nova foto
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
