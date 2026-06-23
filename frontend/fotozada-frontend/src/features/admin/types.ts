import type { JobStatus, LayoutId } from "@/features/print/types";

export interface Batch {
  id: string;
  device_id: string;
  ip: string | null;
  user_agent: string | null;
  total_sheets: number;
  created_at: string;
}

export interface Job {
  id: string;
  batch_id: string;
  idx: number;
  layout: LayoutId;
  copies: number;
  composed_path: string;
  status: JobStatus;
  error: string | null;
  device_id: string;
  created_at: string;
  printing_at: string | null;
  printed_at: string | null;
  print_ms: number | null;
  print_batches?: Batch | null;
}

export interface AdminSettings {
  kiosk_id: string;
  queue_paused: boolean;
  require_approval: boolean;
  max_sheets_per_batch: number;
}
