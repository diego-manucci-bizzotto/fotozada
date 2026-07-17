import {
  Ban,
  Check,
  CheckCircle2,
  Clock,
  Inbox,
  Loader2,
  RectangleHorizontal,
  RectangleVertical,
  RotateCcw,
  Sparkles,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LAYOUTS } from "@/features/print/lib/layouts";
import type { JobStatus, LayoutId } from "@/features/print/types";
import type { Job } from "../types";
import type { useJobActions } from "../hooks/use-job-actions";
import { JobPreviewDialog } from "./job-preview-dialog";

const VARIANT: Record<JobStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending_approval: "outline",
  queued: "outline",
  printing: "secondary",
  done: "default",
  error: "destructive",
  canceled: "destructive",
};

const STATUS_LABEL: Record<JobStatus, string> = {
  pending_approval: "Aguardando",
  queued: "Na fila",
  printing: "Imprimindo",
  done: "Pronto",
  error: "Erro",
  canceled: "Cancelado",
};

const STATUS_ICON: Record<JobStatus, LucideIcon> = {
  pending_approval: Clock,
  queued: Clock,
  printing: Loader2,
  done: CheckCircle2,
  error: XCircle,
  canceled: Ban,
};

const LAYOUT_ICON: Record<LayoutId, LucideIcon> = {
  strip_3: Sparkles,
  single_10x15_h: RectangleHorizontal,
  single_10x15_v: RectangleVertical,
};

interface Props {
  jobs: Job[];
  actions: ReturnType<typeof useJobActions>;
}

export function JobTable({ jobs, actions }: Props) {
  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
          <Inbox className="h-6 w-6" />
          <p className="text-sm">Nada aqui.</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quando</TableHead>
              <TableHead>Layout</TableHead>
              <TableHead>Cópias</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((j) => {
              const StatusIcon = STATUS_ICON[j.status];
              const LayoutIcon = LAYOUT_ICON[j.layout] ?? RectangleVertical;
              return (
                <TableRow key={j.id}>
                  <TableCell className="text-muted-foreground">
                    {new Date(j.created_at).toLocaleTimeString()}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5">
                      <LayoutIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      {LAYOUTS[j.layout]?.label ?? j.layout}
                    </span>
                  </TableCell>
                  <TableCell>{j.copies}</TableCell>
                  <TableCell>
                    <Badge variant={VARIANT[j.status]} className="gap-1">
                      <StatusIcon
                        className={`h-3 w-3 ${j.status === "printing" ? "animate-spin" : ""}`}
                      />
                      {STATUS_LABEL[j.status]}
                    </Badge>
                  </TableCell>
                  <TableCell title={j.device_id} className="text-muted-foreground">
                    {j.device_id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {j.print_ms ? `${j.print_ms} ms` : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <JobPreviewDialog path={j.composed_path} />
                      {j.status === "pending_approval" && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Aprovar"
                          onClick={() => actions.setStatus.mutate({ id: j.id, status: "queued" })}
                        >
                          <Check className="h-4 w-4 text-emerald-600" />
                        </Button>
                      )}
                      {j.status !== "done" && j.status !== "canceled" && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Cancelar"
                          onClick={() => actions.setStatus.mutate({ id: j.id, status: "canceled" })}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Reimprimir"
                        onClick={() => actions.reprint.mutate(j.id)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
