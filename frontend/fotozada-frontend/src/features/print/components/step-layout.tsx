import { motion } from "framer-motion";
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
        {LAYOUT_LIST.map((l, i) => {
          const Icon = ICONS[l.id] ?? Image;
          return (
            <motion.button
              key={l.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 300, damping: 25 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(l)}
              className="flex items-center gap-4 rounded-xl border bg-background p-4 text-left shadow-sm transition-colors hover:border-primary hover:bg-primary/[0.03] hover:shadow-md"
            >
              <motion.div
                whileHover={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.4 }}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5"
              >
                <Icon className="h-6 w-6 text-primary" />
              </motion.div>
              <div>
                <div className="text-sm font-semibold text-foreground">{l.label}</div>
                <div className="text-xs text-muted-foreground">
                  {l.photos} foto{l.photos > 1 ? "s" : ""} por folha
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
