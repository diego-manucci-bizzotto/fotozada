import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { LAYOUTS } from "../lib/layouts";
import type { CartItem, JobStatus } from "../lib/types";

const STATUS_LABEL: Record<JobStatus, string> = {
  pending_approval: "Aguardando aprovação",
  queued: "Na fila",
  printing: "Imprimindo…",
  done: "Pronto!",
  error: "Erro",
  canceled: "Cancelado",
};

interface Props {
  batchId: string;
  jobIds: string[];
  items: CartItem[];
  initialStatus: JobStatus;
  onNew: () => void;
}

export default function BatchStatus({ batchId, jobIds, items, initialStatus, onNew }: Props) {
  const [statuses, setStatuses] = useState<Record<string, JobStatus>>(() =>
    Object.fromEntries(jobIds.map((id) => [id, initialStatus])),
  );

  const jobs = useMemo(
    () =>
      jobIds.map((id, idx) => ({
        id,
        layout: items[idx]?.layout,
        copies: items[idx]?.copies ?? 1,
      })),
    [jobIds, items],
  );

  useEffect(() => {
    const channel = supabase
      .channel(`batch-status:${batchId}`, { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "job_status" }, ({ payload }) => {
        if (!payload?.job_id) return;
        setStatuses((prev) => ({ ...prev, [payload.job_id]: payload.status }));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [batchId]);

  const totalSheets = jobs.reduce((s, j) => s + j.copies, 0);
  const doneSheets = jobs
    .filter((j) => statuses[j.id] === "done")
    .reduce((s, j) => s + j.copies, 0);
  const allDone = jobs.length > 0 && jobs.every((j) => statuses[j.id] === "done");

  return (
    <div className="card status">
      <h2>{allDone ? "Tudo pronto! 🎉" : "Acompanhe sua impressão"}</h2>
      <p className="muted">
        {doneSheets} de {totalSheets} folha(s) prontas
      </p>

      <ul className="status-list">
        {jobs.map((j, i) => {
          const st = statuses[j.id] ?? "queued";
          return (
            <li key={j.id} className={`status-row st-${st}`}>
              <span>
                {i + 1}. {j.layout ? LAYOUTS[j.layout].label : "Item"} ×{j.copies}
              </span>
              <span className="badge">{STATUS_LABEL[st]}</span>
            </li>
          );
        })}
      </ul>

      {allDone && (
        <button className="primary" onClick={onNew}>
          Nova impressão
        </button>
      )}
    </div>
  );
}
