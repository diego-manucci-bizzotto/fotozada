import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import type { Job } from "../types";

function compute(jobs: Job[]) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const today = jobs.filter((j) => new Date(j.created_at) >= startOfToday);
  const sheetsToday = today.reduce((s, j) => s + j.copies, 0);
  const active = jobs.filter((j) => j.status === "queued" || j.status === "printing").length;
  const done = jobs.filter((j) => j.status === "done");
  const errored = jobs.filter((j) => j.status === "error");
  const finished = done.length + errored.length;
  const successRate = finished ? `${Math.round((done.length / finished) * 100)}%` : "—";
  const durations = done.map((j) => j.print_ms ?? 0).filter((n) => n > 0);
  const avgMs = durations.length
    ? `${Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)} ms`
    : "—";
  const single = jobs.filter((j) => j.layout === "single_10x15_v" || j.layout === "single_10x15_h").length;
  const strip = jobs.filter((j) => j.layout === "strip_3").length;
  return { sheetsToday, active, successRate, avgMs, single, strip };
}

export function MetricsCards({ jobs }: { jobs: Job[] }) {
  const m = compute(jobs);
  const cards = [
    { label: "Folhas hoje", value: m.sheetsToday },
    { label: "Na fila / imprimindo", value: m.active },
    { label: "Taxa de sucesso", value: m.successRate },
    { label: "Tempo médio", value: m.avgMs },
    { label: "10x15 / tirinha", value: `${m.single} / ${m.strip}` },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: i * 0.06, type: "spring", stiffness: 300, damping: 25 }}
        >
          <Card className="gap-0 py-4 transition-shadow hover:shadow-md">
            <CardContent className="px-4">
              <div className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-2xl font-bold text-transparent">
                {c.value}
              </div>
              <div className="text-xs text-muted-foreground">{c.label}</div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
