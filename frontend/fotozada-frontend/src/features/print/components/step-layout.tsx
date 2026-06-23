import { Image, LayoutGrid } from "lucide-react";
import { LAYOUT_LIST } from "../lib/layouts";
import type { LayoutDef } from "../types";

const ICONS: Record<string, typeof Image> = {
  single_10x15: Image,
  strip_3: LayoutGrid,
};

export function StepLayout({ onSelect }: { onSelect: (layout: LayoutDef) => void }) {
  return (
    <div className="grid gap-4">
      <div>
        <h3 className="text-base font-semibold text-foreground">Escolha o formato</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Como deseja imprimir suas fotos?
        </p>
      </div>
      <div className="grid gap-3">
        {LAYOUT_LIST.map((l) => {
          const Icon = ICONS[l.id] ?? Image;
          return (
            <button
              key={l.id}
              onClick={() => onSelect(l)}
              className="flex items-center gap-4 rounded-xl border bg-background p-4 text-left transition-colors hover:border-primary hover:bg-primary/[0.03]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">{l.label}</div>
                <div className="text-xs text-muted-foreground">
                  {l.photos} foto{l.photos > 1 ? "s" : ""} por folha
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
