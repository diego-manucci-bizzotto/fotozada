import type { CropPixels, JobStatus, LayoutId } from "../print/types";

export type Step = "welcome" | "layout" | "photos" | "review" | "status";

export interface FrameData {
  crop: CropPixels;
  canvas: HTMLCanvasElement;
  blob: Blob;
  width: number;
  height: number;
}

// What StatusStep needs per job — deliberately excludes blobs/object URLs so
// BatchResult stays JSON-serializable (it's persisted to localStorage to
// survive a refresh/tab close while a batch is still printing).
export interface JobSummary {
  layout: LayoutId;
  copies: number;
}

export interface BatchResult {
  batchId: string;
  jobIds: string[];
  status: JobStatus;
  items: JobSummary[];
}
