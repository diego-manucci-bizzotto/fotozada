import type { LayoutDef, LayoutId } from "../types";

const SHEET = { width: 1200, height: 1800 }; // 10×15 cm portrait @ 300 DPI
const SHEET_H = { width: 1800, height: 1200 }; // 10×15 cm landscape @ 300 DPI

const PHOTO_INSET = 2.5; // viewBox units of white padding per side

// --- Tirinha 5×15 (two mirrored strips per sheet) ---
const SVG_VB_W = 141.75;
const STRIP_W = SHEET.width / 2;
const STRIP_H = SHEET.height;
const S = STRIP_W / SVG_VB_W;

const SVG_SLOTS_RAW = [
  { x: 14.0, y: 77.5, w: 115.5, h: 97.0 },
  { x: 15.0, y: 183.5, w: 113.5, h: 95.5 },
  { x: 14.0, y: 288.5, w: 114.0, h: 95.5 },
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

// --- 10×15 Vertical (portrait frame over full sheet) ---
const V_VB_W = 283.5;
const V_S = SHEET.width / V_VB_W;
const V_SLOT_RAW = { x: 13.3, y: 83.5, w: 256.3, h: 291.3 };
const V_CELL = {
  x: Math.round((V_SLOT_RAW.x + PHOTO_INSET) * V_S),
  y: Math.round((V_SLOT_RAW.y + PHOTO_INSET) * V_S),
  w: Math.round((V_SLOT_RAW.w - PHOTO_INSET * 2) * V_S),
  h: Math.round((V_SLOT_RAW.h - PHOTO_INSET * 2) * V_S),
};

// --- 10×15 Horizontal (landscape frame over full sheet) ---
const H_VB_W = 425.25;
const H_S = SHEET_H.width / H_VB_W;
const H_SLOT_RAW = { x: 15, y: 59.5, w: 395, h: 187 };
const H_CELL = {
  x: Math.round((H_SLOT_RAW.x + PHOTO_INSET) * H_S),
  y: Math.round((H_SLOT_RAW.y + PHOTO_INSET) * H_S),
  w: Math.round((H_SLOT_RAW.w - PHOTO_INSET * 2) * H_S),
  h: Math.round((H_SLOT_RAW.h - PHOTO_INSET * 2) * H_S),
};

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
  single_10x15_v: {
    id: "single_10x15_v",
    label: "10×15 Vertical",
    photos: 1,
    sheet: SHEET,
    cellAspect: V_CELL.w / V_CELL.h,
    cells: [V_CELL],
    _frameSvg: "/moldura-10x15-v.svg",
  },
  single_10x15_h: {
    id: "single_10x15_h",
    label: "10×15 Horizontal",
    photos: 1,
    sheet: SHEET_H,
    cellAspect: H_CELL.w / H_CELL.h,
    cells: [H_CELL],
    _frameSvg: "/moldura-10x15-h.svg",
  },
};

export const LAYOUT_LIST: LayoutDef[] = Object.values(LAYOUTS);
