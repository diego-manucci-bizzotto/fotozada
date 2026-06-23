import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { ArrowLeft, Upload, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import type { CropPixels, LayoutDef } from "../types";
import { canvasToBlob, cropToCell } from "../lib/compose";

export interface FrameData {
  crop: CropPixels;
  canvas: HTMLCanvasElement;
  blob: Blob;
  width: number;
  height: number;
}

interface Props {
  layout: LayoutDef;
  onDone: (frames: FrameData[]) => void;
  onBack: () => void;
}

export function StepPhotos({ layout, onDone, onBack }: Props) {
  const [frames, setFrames] = useState<FrameData[]>([]);
  const current = frames.length;
  const [pickedSrc, setPickedSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_a: Area, px: Area) => setAreaPixels(px), []);

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (pickedSrc) URL.revokeObjectURL(pickedSrc);
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
    const next = [
      ...frames,
      { crop: areaPixels, canvas, blob, width: canvas.width, height: canvas.height },
    ];
    URL.revokeObjectURL(pickedSrc);
    setPickedSrc(null);
    setAreaPixels(null);
    setBusy(false);
    setFrames(next);
    if (next.length === layout.photos) onDone(next);
  }

  return (
    <div className="grid gap-4">
      <div>
        <h3 className="text-base font-semibold text-foreground">
          Foto {current + 1} de {layout.photos}
        </h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {!pickedSrc ? "Escolha uma imagem da galeria" : "Ajuste o recorte e confirme"}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!pickedSrc ? (
          <motion.div
            key="picker"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="grid gap-3"
          >
            <motion.label
              whileHover={{ scale: 1.02, borderColor: "var(--primary)" }}
              whileTap={{ scale: 0.98 }}
              className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-primary/20 bg-gradient-to-b from-primary/[0.05] to-transparent py-12 transition-colors"
            >
              <div className="flex h-12 w-12 animate-float items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5">
                <Camera className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-primary">Escolher foto</span>
              <input type="file" accept="image/*" hidden onChange={pickFile} />
            </motion.label>
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="cropper"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="grid gap-4"
          >
            <div className="relative h-64 w-full overflow-hidden rounded-xl bg-neutral-900">
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
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.01}
              onValueChange={([z]) => setZoom(z)}
            />
            <div className="flex gap-2">
              <Button asChild variant="outline" className="flex-1 rounded-xl">
                <label>
                  <Upload className="mr-1.5 h-4 w-4" />
                  Trocar
                  <input type="file" accept="image/*" hidden onChange={pickFile} />
                </label>
              </Button>
              <motion.div className="flex-1" whileTap={{ scale: 0.97 }}>
                <Button className="w-full rounded-xl bg-gradient-to-r from-primary to-blue-700" disabled={busy || !areaPixels} onClick={confirmCrop}>
                  {current + 1 < layout.photos ? "Próxima" : "Concluir"}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
