import type { CropPixels, LayoutDef } from "../types";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

let frameCache: Map<string, HTMLImageElement> = new Map();

async function loadFrame(url: string): Promise<HTMLImageElement> {
  const cached = frameCache.get(url);
  if (cached) return cached;
  const img = await loadImage(url);
  frameCache.set(url, img);
  return img;
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
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
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

// A DNP RX1 corta uma faixa fixa da borda física da folha em modo borderless
// (overscan do driver/feed) — independe de DPI ou opções do CUPS. Encolhemos
// levemente o conteúdo no eixo Y e centralizamos, deixando uma margem de
// segurança em branco que a impressora descarta em vez de cortar a arte.
// Ajuste este valor com base em impressões reais (aumente se ainda cortar).
const SAFE_MARGIN_Y = 40; // px @300dpi (~3.4mm) de cada lado (topo + base)

// Draw one strip (photos + optional SVG frame overlay) onto a context at (ox, oy).
async function drawStrip(
  ctx: CanvasRenderingContext2D,
  layout: LayoutDef,
  cells: HTMLCanvasElement[],
  ox: number,
  oy: number,
) {
  const sw = layout._stripSize?.w ?? layout.sheet.width;
  const sh = layout._stripSize?.h ?? layout.sheet.height;
  const scale = (sh - SAFE_MARGIN_Y * 2) / sh;

  ctx.save();
  ctx.translate(ox, oy + SAFE_MARGIN_Y);
  ctx.scale(1, scale);

  // Frame first (background), then photos on top in the slots
  if (layout._frameSvg) {
    const frame = await loadFrame(layout._frameSvg);
    ctx.drawImage(frame, 0, 0, sw, sh);
  }

  layout.cells.forEach((cell, i) => {
    if (cells[i]) ctx.drawImage(cells[i], cell.x, cell.y, cell.w, cell.h);
  });

  ctx.restore();
}

// Assemble the full print sheet (10x15). mirror=true duplicates the strip.
export async function composeSheet(
  layout: LayoutDef,
  cells: HTMLCanvasElement[],
  mirror = true,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = layout.sheet.width;
  canvas.height = layout.sheet.height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await drawStrip(ctx, layout, cells, 0, 0);

  if (mirror && layout._mirrorX != null) {
    await drawStrip(ctx, layout, cells, layout._mirrorX, 0);
  }

  return canvasToBlob(canvas, "image/png");
}

// Render a single strip for preview (cropped to strip size).
export async function composeStripPreview(
  layout: LayoutDef,
  cells: HTMLCanvasElement[],
): Promise<Blob> {
  if (!layout._stripSize) return composeSheet(layout, cells, false);

  const sw = layout._stripSize.w;
  const sh = layout._stripSize.h;
  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, sw, sh);

  await drawStrip(ctx, layout, cells, 0, 0);

  return canvasToBlob(canvas, "image/png");
}

export async function sha256Hex(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
