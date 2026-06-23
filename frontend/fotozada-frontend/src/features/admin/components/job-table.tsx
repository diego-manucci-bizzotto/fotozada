import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LAYOUTS } from "@/features/print/lib/layouts";
import type { JobStatus } from "@/features/print/types";
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

interface Props {
  jobs: Job[];
  actions: ReturnType<typeof useJobActions>;
}

export function JobTable({ jobs, actions }: Props) {
  if (jobs.length === 0) {
    return <p className="text-sm text-muted-foreground">Nada aqui.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Quando</TableHead>
            <TableHead>Layout</TableHead>
            <TableHead>Cópias</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Device</TableHead>
            <TableHead>Duração</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((j) => (
            <TableRow key={j.id}>
              <TableCell>{new Date(j.created_at).toLocaleTimeString()}</TableCell>
              <TableCell>{LAYOUTS[j.layout]?.label ?? j.layout}</TableCell>
              <TableCell>{j.copies}</TableCell>
              <TableCell>
                <Badge variant={VARIANT[j.status]}>{j.status}</Badge>
              </TableCell>
              <TableCell title={j.device_id}>{j.device_id.slice(0, 8)}</TableCell>
              <TableCell>{j.print_ms ? `${j.print_ms} ms` : "—"}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <JobPreviewDialog path={j.composed_path} />
                  {j.status === "pending_approval" && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => actions.setStatus.mutate({ id: j.id, status: "queued" })}
                    >
                      Aprovar
                    </Button>
                  )}
                  {j.status !== "done" && j.status !== "canceled" && (
                    <Button
                      variant="link"
                      size="sm"
                      className="text-destructive"
                      onClick={() => actions.setStatus.mutate({ id: j.id, status: "canceled" })}
                    >
                      Cancelar
                    </Button>
                  )}
                  <Button variant="link" size="sm" onClick={() => actions.reprint.mutate(j.id)}>
                    Reimprimir
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
