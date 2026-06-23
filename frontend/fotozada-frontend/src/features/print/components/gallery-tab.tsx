import { motion, AnimatePresence } from "framer-motion";
import { ImagePlus, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LAYOUTS } from "../lib/layouts";
import type { PhotoItem } from "../types";

interface Props {
  items: PhotoItem[];
  maxSheets: number;
  sheets: number;
  onRemove: (id: string) => void;
}

export function GalleryTab({ items, maxSheets, sheets, onRemove }: Props) {
  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/20 bg-gradient-to-b from-primary/[0.04] to-transparent px-6 py-16"
      >
        <div
          className="mb-4 flex h-14 w-14 animate-float items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5"
        >
          <ImagePlus className="h-7 w-7 text-primary" />
        </div>
        <h3 className="text-base font-semibold text-foreground">Adicione suas fotos</h3>
        <p className="mt-1 text-center text-sm leading-snug text-muted-foreground">
          Toque no <span className="font-semibold text-primary">+</span> para escolher imagens e prepará-las para impressão
        </p>
      </motion.div>
    );
  }


  return (
    <div className="grid gap-3">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between px-1"
      >
        <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          {items.length} {items.length === 1 ? "foto" : "fotos"} selecionada{items.length > 1 ? "s" : ""}
        </span>
        <span
          className={cn(
            "text-xs font-semibold",
            sheets >= maxSheets ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {sheets}/{maxSheets} folhas
        </span>
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        <AnimatePresence mode="popLayout">
          {items.map((it, i) => (
            <motion.div
              key={it.id}
              layout
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.6, y: -20 }}
              transition={{ type: "spring", stiffness: 350, damping: 25, delay: i * 0.05 }}
              className="group relative overflow-hidden rounded-xl border bg-white shadow-sm"
            >
              <motion.img
                src={it.composedUrl}
                alt=""
                className="aspect-[2/3] w-full object-cover"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              />
              <div className="flex items-center justify-between px-3 py-2">
                <div>
                  <div className="text-xs font-medium text-foreground">{LAYOUTS[it.layout].label}</div>
                  <div className="text-[11px] text-muted-foreground">×{it.copies} cópia{it.copies > 1 ? "s" : ""}</div>
                </div>
                <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.8 }}>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => onRemove(it.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
