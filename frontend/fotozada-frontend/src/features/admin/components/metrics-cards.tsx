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
  const single = jobs.filter((j) => j.layout === "single_10x15").length;
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
      {cards.map((c) => (
        <Card key={c.label} className="gap-0 py-4">
          <CardContent className="px-4">
            <div className="text-2xl font-bold">{c.value}</div>
            <div className="text-xs text-muted-foreground">{c.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
