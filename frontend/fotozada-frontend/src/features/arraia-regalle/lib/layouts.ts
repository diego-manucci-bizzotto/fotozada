import type { Cell, LayoutId } from "../../print/types";

// Motor de layout do evento Arraiá Regalle — cópia independente do motor
// genérico (features/print/lib/layouts.ts) porque este evento compõe em 3
// camadas (fundo -> foto -> overlay) e tem 5 designs de moldura selecionáveis
// por formato. A geometria das células foi remedida diretamente nos novos SVGs
// (flood-fill nos pixels brancos) e é idêntica à do arraiá UNAERP — só a arte
// ao redor da foto muda entre os designs.

export interface RegalleLayoutDef {
  id: LayoutId;
  label: string;
  photos: number;
  sheet: { width: number; height: number };
  cellAspect: number; // width / height, alimenta o cropper
  cells: Cell[];
  frameNumber: FrameNumber;
  _mirrorX?: number;
  _frameSvg?: string; // fundo (camada 1) — ausente na opção "sem moldura"
  _overlaySvg?: string; // arte sobre a foto (camada 3) — ausente no design 1
  _stripSize?: { w: number; h: number };
}

const SHEET = { width: 1200, height: 1800 }; // 10×15 retrato @ 300 DPI
const SHEET_H = { width: 1800, height: 1200 }; // 10×15 paisagem @ 300 DPI

const PHOTO_INSET = 2.5; // padding branco por lado, em unidades do viewBox

// --- Tirinha 5×15 (duas tiras espelhadas por folha) ---
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

// --- 10×15 Vertical (moldura retrato sobre a folha inteira) ---
const V_VB_W = 283.5;
const V_S = SHEET.width / V_VB_W;
const V_SLOT_RAW = { x: 13.3, y: 83.5, w: 256.3, h: 291.3 };
const V_CELL = {
  x: Math.round((V_SLOT_RAW.x + PHOTO_INSET) * V_S),
  y: Math.round((V_SLOT_RAW.y + PHOTO_INSET) * V_S),
  w: Math.round((V_SLOT_RAW.w - PHOTO_INSET * 2) * V_S),
  h: Math.round((V_SLOT_RAW.h - PHOTO_INSET * 2) * V_S),
};

// --- 10×15 Horizontal (moldura paisagem sobre a folha inteira) ---
const H_VB_W = 425.25;
const H_S = SHEET_H.width / H_VB_W;
const H_SLOT_RAW = { x: 15, y: 59.5, w: 395, h: 187 };
const H_CELL = {
  x: Math.round((H_SLOT_RAW.x + PHOTO_INSET) * H_S),
  y: Math.round((H_SLOT_RAW.y + PHOTO_INSET) * H_S),
  w: Math.round((H_SLOT_RAW.w - PHOTO_INSET * 2) * H_S),
  h: Math.round((H_SLOT_RAW.h - PHOTO_INSET * 2) * H_S),
};

export type FrameFolder = "Tirinha" | "Vertical" | "Horizontal";

export interface BaseLayout {
  id: LayoutId;
  label: string;
  photos: number;
  folder: FrameFolder;
  sheet: { width: number; height: number };
  cellAspect: number;
  cells: Cell[];
  _mirrorX?: number;
  _stripSize?: { w: number; h: number };
}

export const BASE_LAYOUTS: BaseLayout[] = [
  {
    id: "strip_3",
    label: "Tirinha de 3",
    photos: 3,
    folder: "Tirinha",
    sheet: SHEET,
    cellAspect: STRIP_CELLS[0].w / STRIP_CELLS[0].h,
    cells: STRIP_CELLS,
    _mirrorX: STRIP_W,
    _stripSize: { w: STRIP_W, h: STRIP_H },
  },
  {
    id: "single_10x15_v",
    label: "10×15 Vertical",
    photos: 1,
    folder: "Vertical",
    sheet: SHEET,
    cellAspect: V_CELL.w / V_CELL.h,
    cells: [V_CELL],
  },
  {
    id: "single_10x15_h",
    label: "10×15 Horizontal",
    photos: 1,
    folder: "Horizontal",
    sheet: SHEET_H,
    cellAspect: H_CELL.w / H_CELL.h,
    cells: [H_CELL],
  },
];

// 0 = "sem moldura" (nem fundo nem overlay, só a foto na folha branca).
export const FRAME_NUMBERS = [0, 1, 2, 3, 4, 5] as const;
export type FrameNumber = (typeof FRAME_NUMBERS)[number];

export function frameAssetPaths(folder: FrameFolder, n: FrameNumber) {
  if (n === 0) return { bg: undefined, overlay: undefined };
  return {
    bg: `/arraia-regalle/${folder}/${n}-bg.svg`,
    // O design 1 é a versão "limpa", sem clipart decorativo sobre a foto.
    // Overlay em SVG com o mesmo artboard do fundo — sem distorção nem corte.
    overlay: n === 1 ? undefined : `/arraia-regalle/${folder}/${n}-overlay.svg`,
  };
}

// "Sem moldura": a foto preenche a folha (ou cada terço da tira) inteira,
// de ponta a ponta — sem a margem que as molduras reservam pra arte do
// fundo. Divide a tira em fatias iguais sem gaps mesmo se `h/photos` não
// for um inteiro exato.
function fullBleedCells(base: BaseLayout): Cell[] {
  if (base._stripSize) {
    const { w, h } = base._stripSize;
    const n = base.photos;
    const bounds = Array.from({ length: n + 1 }, (_, i) => Math.round((i * h) / n));
    return Array.from({ length: n }, (_, i) => ({
      x: 0,
      y: bounds[i],
      w,
      h: bounds[i + 1] - bounds[i],
    }));
  }
  return [{ x: 0, y: 0, w: base.sheet.width, h: base.sheet.height }];
}

export function buildLayout(baseId: LayoutId, frameNumber: FrameNumber): RegalleLayoutDef {
  const base = BASE_LAYOUTS.find((b) => b.id === baseId);
  if (!base) throw new Error(`layout desconhecido: ${baseId}`);
  const { bg, overlay } = frameAssetPaths(base.folder, frameNumber);
  const cells = frameNumber === 0 ? fullBleedCells(base) : base.cells;
  return {
    id: base.id,
    label: base.label,
    photos: base.photos,
    sheet: base.sheet,
    cellAspect: cells[0].w / cells[0].h,
    cells,
    frameNumber,
    _mirrorX: base._mirrorX,
    _frameSvg: bg,
    _overlaySvg: overlay,
    _stripSize: base._stripSize,
  };
}
