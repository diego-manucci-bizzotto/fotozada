import type { CropPixels, JobStatus, PhotoItem } from "../print/types";

export type Step = "welcome" | "layout" | "photos" | "review" | "status";

export interface FrameData {
  crop: CropPixels;
  canvas: HTMLCanvasElement;
  blob: Blob;
  width: number;
  height: number;
}

export interface BatchResult {
  batchId: string;
  jobIds: string[];
  status: JobStatus;
  items: PhotoItem[];
}
