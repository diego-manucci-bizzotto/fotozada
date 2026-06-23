import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { newId } from "@/lib/device";
import { composeSheet, sha256Hex } from "../../print/lib/compose";
import type { LayoutDef, PhotoItem } from "../../print/types";
import type { FrameData } from "../types";

export function ReviewStep({
  layout,
  frames,
  onConfirm,
  onBack,
}: {
  layout: LayoutDef;
  frames: FrameData[];
  onConfirm: (item: PhotoItem) => void;
  onBack: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [hash, setHash] = useState("");

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

  function confirm() {
    if (!blob) return;
    onConfirm({
      id: newId(),
      layout: layout.id,
      copies: 1,
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
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="flex flex-1 flex-col gap-5 p-6"
    >
      <button onClick={onBack} className="flex items-center gap-1 self-start text-sm text-white/60">
        <ChevronLeft className="h-4 w-4" /> Voltar
      </button>

      <div className="text-center">
        <h2 className="text-lg font-bold text-white">Ficou bonito?</h2>
        <p className="text-sm text-white/50">Confira sua foto antes de imprimir</p>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
        className="flex flex-1 items-center justify-center"
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Pré-visualização"
            className="max-h-72 rounded-xl shadow-2xl shadow-black/40"
          />
        ) : (
          <div className="text-sm text-white/40">Montando…</div>
        )}
      </motion.div>

      <div className="flex gap-3 pb-2">
        <Button
          variant="outline"
          className="flex-1 rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          onClick={onBack}
        >
          Refazer
        </Button>
        <motion.div className="flex-1" whileTap={{ scale: 0.97 }}>
          <Button
            className="w-full rounded-xl bg-amber-500 text-white shadow-lg shadow-amber-500/25 hover:bg-amber-600"
            disabled={!blob}
            onClick={confirm}
          >
            <Printer className="mr-1.5 h-4 w-4" />
            Imprimir
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
