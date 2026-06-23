import type { CropPixels, LayoutDef } from "../types";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = "image/jpeg",
  quality = 0.92,
): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      type,
      quality,
    ),
  );
}

// Crop the chosen region of a source image and scale it to the target cell
// resolution. Re-used both as the uploaded photo and as a tile of the sheet.
export async function cropToCell(
  imageSrc: string,
  crop: CropPixels,
  outW: number,
  outH: number,
): Promise<HTMLCanvasElement> {
  const img = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(outW);
  canvas.height = Math.round(outH);
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    img,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return canvas;
}

// Assemble the cropped cells onto the final white sheet (10x15) and return a PNG.
export async function composeSheet(
  layout: LayoutDef,
  cells: HTMLCanvasElement[],
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = layout.sheet.width;
  canvas.height = layout.sheet.height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  layout.cells.forEach((cell, i) => {
    if (cells[i]) ctx.drawImage(cells[i], cell.x, cell.y, cell.w, cell.h);
  });
  return canvasToBlob(canvas, "image/png");
}

export async function sha256Hex(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
