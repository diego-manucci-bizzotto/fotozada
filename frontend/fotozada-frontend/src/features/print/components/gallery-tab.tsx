import { ImagePlus, Trash2 } from "lucide-react";
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
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/20 bg-primary/[0.03] px-6 py-16">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <ImagePlus className="h-7 w-7 text-primary" />
        </div>
        <h3 className="text-base font-semibold text-foreground">Adicione suas fotos</h3>
        <p className="mt-1 text-center text-sm leading-snug text-muted-foreground">
          Toque para escolher imagens da galeria e prepará-las para impressão
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-medium text-muted-foreground">
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
      </div>

      <div className="grid grid-cols-2 gap-3">
        {items.map((it) => (
          <div key={it.id} className="group relative overflow-hidden rounded-xl border bg-white">
            <img
              src={it.composedUrl}
              alt=""
              className="aspect-[2/3] w-full object-cover"
            />
            <div className="flex items-center justify-between px-3 py-2">
              <div>
                <div className="text-xs font-medium text-foreground">{LAYOUTS[it.layout].label}</div>
                <div className="text-[11px] text-muted-foreground">×{it.copies} cópia{it.copies > 1 ? "s" : ""}</div>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => onRemove(it.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
