export type LayoutId = "single_10x15" | "strip_3";

export type JobStatus =
  | "pending_approval"
  | "queued"
  | "printing"
  | "done"
  | "error"
  | "canceled";

export interface Cell {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LayoutDef {
  id: LayoutId;
  label: string;
  photos: number;
  sheet: { width: number; height: number };
  cellAspect: number; // width / height, fed to the cropper
  cells: Cell[]; // where each photo sits on the final sheet
}

export interface CropPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ItemPhoto {
  blob: Blob; // cropped cell, JPEG
  width: number;
  height: number;
  crop: CropPixels;
}

// One item in "Minhas fotos" = one composed sheet, printed `copies` times.
export interface PhotoItem {
  id: string;
  layout: LayoutId;
  copies: number;
  photos: ItemPhoto[];
  composedBlob: Blob; // assembled sheet, PNG
  composedHash: string; // sha-256 hex
  composedUrl: string; // object URL for preview
}
