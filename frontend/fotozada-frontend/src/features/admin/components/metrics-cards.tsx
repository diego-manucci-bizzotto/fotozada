import { motion } from "framer-motion";
import { CheckCircle2, Clock, FileStack, Image, Timer, type LucideIcon } from "lucide-react";
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

interface MetricCard {
  label: string;
  value: string | number;
  icon: LucideIcon;
}

export function MetricsCards({ jobs }: { jobs: Job[] }) {
  const m = compute(jobs);
  const cards: MetricCard[] = [
    { label: "Folhas hoje", value: m.sheetsToday, icon: FileStack },
    { label: "Na fila / imprimindo", value: m.active, icon: Clock },
    { label: "Taxa de sucesso", value: m.successRate, icon: CheckCircle2 },
    { label: "Tempo médio", value: m.avgMs, icon: Timer },
    { label: "10x15 / tirinha", value: `${m.single} / ${m.strip}`, icon: Image },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.06, type: "spring", stiffness: 300, damping: 25 }}
          >
            <Card className="gap-3 py-4 transition-shadow hover:shadow-md">
              <CardContent className="flex items-start justify-between px-4">
                <div>
                  <div className="text-2xl font-bold text-foreground">{c.value}</div>
                  <div className="text-xs text-muted-foreground">{c.label}</div>
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
