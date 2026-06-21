import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import type { CartItem, CropPixels, LayoutDef } from "../lib/types";
import { canvasToBlob, composeSheet, cropToCell, sha256Hex } from "../lib/compose";
import { newId } from "../lib/device";

interface FrameData {
  src: string;
  crop: CropPixels;
  canvas: HTMLCanvasElement;
  blob: Blob;
  width: number;
  height: number;
}

interface Props {
  layout: LayoutDef;
  remainingSheets: number; // capacity left in the cart
  onAdd: (item: CartItem) => void;
  onCancel: () => void;
}

export default function PhotoEditor({ layout, remainingSheets, onAdd, onCancel }: Props) {
  const [frames, setFrames] = useState<(FrameData | null)[]>(() =>
    Array(layout.photos).fill(null),
  );
  const [current, setCurrent] = useState(0); // 0..photos-1 editing, === photos -> review
  const [pickedSrc, setPickedSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const [composedUrl, setComposedUrl] = useState<string | null>(null);
  const [composedBlob, setComposedBlob] = useState<Blob | null>(null);
  const [composedHash, setComposedHash] = useState("");
  const [copies, setCopies] = useState(1);

  const onCropComplete = useCallback((_area: Area, px: Area) => setAreaPixels(px), []);

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPickedSrc(URL.createObjectURL(file));
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setAreaPixels(null);
  }

  async function confirmCrop() {
    if (!pickedSrc || !areaPixels) return;
    setBusy(true);
    const cell = layout.cells[current];
    const canvas = await cropToCell(pickedSrc, areaPixels, cell.w, cell.h);
    const blob = await canvasToBlob(canvas, "image/jpeg", 0.92);
    const fd: FrameData = {
      src: pickedSrc,
      crop: areaPixels,
      canvas,
      blob,
      width: canvas.width,
      height: canvas.height,
    };
    const next = frames.slice();
    next[current] = fd;
    setFrames(next);
    setPickedSrc(null);
    setAreaPixels(null);
    setBusy(false);

    if (current + 1 < layout.photos) {
      setCurrent(current + 1);
    } else {
      setCurrent(layout.photos);
      await buildComposed(next);
    }
  }

  async function buildComposed(fs: (FrameData | null)[]) {
    setBusy(true);
    const canvases = fs.map((f) => f!.canvas);
    const blob = await composeSheet(layout, canvases);
    const hash = await sha256Hex(blob);
    setComposedBlob(blob);
    setComposedHash(hash);
    setComposedUrl(URL.createObjectURL(blob));
    setCopies(1);
    setBusy(false);
  }

  function restart() {
    setFrames(Array(layout.photos).fill(null));
    setCurrent(0);
    setPickedSrc(null);
    setAreaPixels(null);
    setComposedBlob(null);
    setComposedUrl(null);
    setComposedHash("");
  }

  function addToCart() {
    if (!composedBlob || !composedUrl) return;
    const item: CartItem = {
      id: newId(),
      layout: layout.id,
      copies,
      photos: frames.map((f) => ({
        blob: f!.blob,
        width: f!.width,
        height: f!.height,
        crop: f!.crop,
      })),
      composedBlob,
      composedHash,
      composedUrl,
    };
    onAdd(item);
  }

  const reviewing = current >= layout.photos;
  const maxCopies = Math.max(1, remainingSheets);

  return (
    <div className="editor card">
      <div className="editor-head">
        <h2>{layout.label}</h2>
        <button className="link" onClick={onCancel}>
          Cancelar
        </button>
      </div>

      {!reviewing && (
        <>
          <p className="muted">
            Foto {current + 1} de {layout.photos}
          </p>

          {!pickedSrc ? (
            <label className="filepick">
              <input type="file" accept="image/*" onChange={pickFile} hidden />
              <span>Escolher foto</span>
            </label>
          ) : (
            <>
              <div className="cropper">
                <Cropper
                  image={pickedSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={layout.cellAspect}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <input
                className="zoom"
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
              <div className="row">
                <label className="link filepick-inline">
                  <input type="file" accept="image/*" onChange={pickFile} hidden />
                  Trocar foto
                </label>
                <button className="primary" disabled={busy || !areaPixels} onClick={confirmCrop}>
                  {current + 1 < layout.photos ? "Próxima foto" : "Concluir"}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {reviewing && composedUrl && (
        <>
          <p className="muted">Pré-visualização (exatamente como vai sair)</p>
          <div className="preview">
            <img src={composedUrl} alt="Pré-visualização" />
          </div>
          <div className="row copies">
            <span>Cópias</span>
            <div className="stepper">
              <button onClick={() => setCopies((c) => Math.max(1, c - 1))} disabled={copies <= 1}>
                –
              </button>
              <strong>{copies}</strong>
              <button
                onClick={() => setCopies((c) => Math.min(maxCopies, c + 1))}
                disabled={copies >= maxCopies}
              >
                +
              </button>
            </div>
            <span className="muted">resta(m) {remainingSheets} folha(s)</span>
          </div>
          <div className="row">
            <button className="link" onClick={restart}>
              Refazer
            </button>
            <button className="primary" onClick={addToCart}>
              Adicionar ao carrinho
            </button>
          </div>
        </>
      )}
    </div>
  );
}
