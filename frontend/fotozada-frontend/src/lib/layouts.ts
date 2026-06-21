import type { LayoutDef, LayoutId } from "./types";

// Final sheet = 10x15 cm portrait @ 300 DPI.
const SHEET = { width: 1200, height: 1800 };

// Photo-strip geometry: 3 frames stacked with outer padding + gaps.
const PAD = 24;
const GAP = 18;
const FRAME_W = SHEET.width - 2 * PAD;
const FRAME_H = (SHEET.height - 2 * PAD - 2 * GAP) / 3;

export const LAYOUTS: Record<LayoutId, LayoutDef> = {
  single_10x15: {
    id: "single_10x15",
    label: "Foto 10x15",
    photos: 1,
    sheet: SHEET,
    cellAspect: SHEET.width / SHEET.height,
    cells: [{ x: 0, y: 0, w: SHEET.width, h: SHEET.height }],
  },
  strip_3: {
    id: "strip_3",
    label: "Tirinha de 3",
    photos: 3,
    sheet: SHEET,
    cellAspect: FRAME_W / FRAME_H,
    cells: [0, 1, 2].map((i) => ({
      x: PAD,
      y: PAD + i * (FRAME_H + GAP),
      w: FRAME_W,
      h: FRAME_H,
    })),
  },
};

export const LAYOUT_LIST: LayoutDef[] = Object.values(LAYOUTS);
