import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { newId } from "@/lib/device";
import type { LayoutDef, PhotoItem } from "../types";
import type { FrameData } from "./step-photos";
import { composeSheet, sha256Hex } from "../lib/compose";

interface Props {
  layout: LayoutDef;
  frames: FrameData[];
  remainingSheets: number;
  onConfirm: (item: PhotoItem) => void;
  onBack: () => void;
}

export function StepReview({ layout, frames, remainingSheets, onConfirm, onBack }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [hash, setHash] = useState("");
  const [copies, setCopies] = useState(1);

  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;
    (async () => {
      const composed = await composeSheet(layout, frames.map((f) => f.canvas));
      const h = await sha256Hex(composed);
      const url = URL.createObjectURL(composed);
      createdUrl = url;
      if (active) {
        setBlob(composed);
        setHash(h);
        setPreviewUrl(url);
      } else {
        URL.revokeObjectURL(url);
      }
    })();
    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [layout, frames]);

  const maxCopies = Math.max(1, remainingSheets);

  function confirm() {
    if (!blob) return;
    onConfirm({
      id: newId(),
      layout: layout.id,
      copies,
      photos: frames.map((f) => ({
        blob: f.blob,
        width: f.width,
        height: f.height,
        crop: f.crop,
      })),
      composedBlob: blob,
      composedHash: hash,
      composedUrl: URL.createObjectURL(blob),
    });
  }

  return (
    <div className="grid gap-5">
      <div>
        <h3 className="text-base font-semibold text-foreground">Ficou bom?</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Confira como vai sair na impressão
        </p>
      </div>

      <div className="flex justify-center">
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Pré-visualização"
            className="max-h-72 rounded-xl border bg-white shadow-sm"
          />
        )}
      </div>

      <div className="flex items-center justify-between rounded-xl border bg-background p-4">
        <span className="text-sm font-medium text-foreground">Cópias</span>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon-xs"
            className="rounded-lg"
            onClick={() => setCopies((c) => Math.max(1, c - 1))}
            disabled={copies <= 1}
          >
            <Minus className="size-3.5" />
          </Button>
          <span className="w-5 text-center text-sm font-bold">{copies}</span>
          <Button
            variant="outline"
            size="icon-xs"
            className="rounded-lg"
            onClick={() => setCopies((c) => Math.min(maxCopies, c + 1))}
            disabled={copies >= maxCopies}
          >
            <Plus className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 rounded-xl" onClick={onBack}>
          Refazer
        </Button>
        <Button className="flex-1 rounded-xl" disabled={!blob} onClick={confirm}>
          Adicionar
        </Button>
      </div>
    </div>
  );
}
