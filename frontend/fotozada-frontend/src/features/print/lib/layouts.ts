import type { LayoutDef, LayoutId } from "../types";

// Final sheet = 10x15 cm portrait @ 300 DPI.
const SHEET = { width: 1200, height: 1800 };

// Photo-strip with SVG frame (/moldura-tirinha.svg).
// The frame SVG has viewBox 0 0 141.75 425.25 (one 5×15 strip).
// We scale it to fill half the 10×15 sheet (600×1800), then position photos
// at the clip-path slots found in the SVG (scaled up proportionally).
// The full sheet has 2 identical framed strips side by side.
const SVG_VB_W = 141.75;
const STRIP_W = SHEET.width / 2; // 600px per strip
const STRIP_H = SHEET.height;     // 1800px
const S = STRIP_W / SVG_VB_W;     // scale factor ~4.23

// Photo slots measured from the rendered SVG (in viewBox units),
// inset slightly so a white border is visible around each photo.
const PHOTO_INSET = 2.5; // viewBox units of white padding per side
const SVG_SLOTS_RAW = [
  { x: 14.0, y: 77.5, w: 115.5, h: 97.3 },
  { x: 14.8, y: 183.5, w: 114.0, h: 95.8 },
  { x: 14.0, y: 288.8, w: 114.0, h: 95.8 },
];
const SVG_SLOTS = SVG_SLOTS_RAW.map((s) => ({
  x: s.x + PHOTO_INSET,
  y: s.y + PHOTO_INSET,
  w: s.w - PHOTO_INSET * 2,
  h: s.h - PHOTO_INSET * 2,
}));

const STRIP_CELLS = SVG_SLOTS.map((slot) => ({
  x: Math.round(slot.x * S),
  y: Math.round(slot.y * S),
  w: Math.round(slot.w * S),
  h: Math.round(slot.h * S),
}));

export const LAYOUTS: Record<LayoutId, LayoutDef> = {
  strip_3: {
    id: "strip_3",
    label: "Tirinha de 3",
    photos: 3,
    sheet: SHEET,
    cellAspect: STRIP_CELLS[0].w / STRIP_CELLS[0].h,
    cells: STRIP_CELLS,
    _mirrorX: STRIP_W,
    _frameSvg: "/moldura-tirinha.svg",
    _stripSize: { w: STRIP_W, h: STRIP_H },
  },
  single_10x15: {
    id: "single_10x15",
    label: "Foto 10x15",
    photos: 1,
    sheet: SHEET,
    cellAspect: SHEET.width / SHEET.height,
    cells: [{ x: 0, y: 0, w: SHEET.width, h: SHEET.height }],
  },
};

export const LAYOUT_LIST: LayoutDef[] = Object.values(LAYOUTS);
