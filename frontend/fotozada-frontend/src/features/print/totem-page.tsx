import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { newId } from "@/lib/device";
import { useTotemSettings } from "./hooks/use-totem-settings";
import { useSubmitBatch } from "./hooks/use-submit-batch";
import { GalleryTab } from "./components/gallery-tab";
import { QueueTab } from "./components/queue-tab";
import { PrintWizard } from "./components/print-wizard";
import type { JobStatus, PhotoItem } from "./types";

type Mode = "tabs" | "wizard";

interface BatchResult {
  batchId: string;
  jobIds: string[];
  status: JobStatus;
  items: PhotoItem[];
}

export function TotemPage() {
  const kioskId = useMemo(
    () => new URLSearchParams(window.location.search).get("kiosk") ?? "kiosk-01",
    [],
  );
  const settings = useTotemSettings(kioskId);
  const maxSheets = settings.data?.max_sheets_per_batch ?? 5;
  const submit = useSubmitBatch();

  const [items, setItems] = useState<PhotoItem[]>([]);
  const [mode, setMode] = useState<Mode>("tabs");
  const [activeTab, setActiveTab] = useState("galeria");
  const [result, setResult] = useState<BatchResult | null>(null);
  const requestIdRef = useRef<string | null>(null);

  const sheets = items.reduce((s, i) => s + i.copies, 0);
  const remaining = maxSheets - sheets;

  function addItem(item: PhotoItem) {
    setItems((c) => [...c, item]);
    setMode("tabs");
    setActiveTab("galeria");
  }

  function removeItem(id: string) {
    setItems((c) => {
      const item = c.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.composedUrl);
      return c.filter((i) => i.id !== id);
    });
  }

  async function print() {
    if (items.length === 0) return;
    if (!requestIdRef.current) requestIdRef.current = newId();
    const res = await submit
      .mutateAsync({ kioskId, items, clientRequestId: requestIdRef.current })
      .catch(() => null);
    if (!res) return;
    if (res.blocked) {
      toast.warning(`Limite de ${res.max} folhas por envio`, {
        description: `Você pediu ${res.requested}.`,
      });
      return;
    }
    if (res.error) {
      toast.error("Erro", { description: res.error });
      return;
    }
    if (res.batch_id && res.job_ids) {
      setResult({
        batchId: res.batch_id,
        jobIds: res.job_ids,
        status: (res.status as JobStatus) ?? "queued",
        items,
      });
      setActiveTab("fila");
    }
  }

  function newOrder() {
    items.forEach((i) => URL.revokeObjectURL(i.composedUrl));
    setItems([]);
    setResult(null);
    requestIdRef.current = null;
    setActiveTab("galeria");
    setMode("tabs");
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <AnimatePresence mode="wait" initial={false}>
        {mode === "wizard" ? (
          <motion.div
            key="wizard"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex min-h-svh flex-col"
          >
            <div className="mx-auto w-full max-w-md flex-1 p-4">
              <PrintWizard
                remainingSheets={remaining}
                onAdd={addItem}
                onCancel={() => setMode("tabs")}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="tabs"
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex min-h-svh flex-col"
          >
            {/* Header */}
            <motion.header
              initial={{ y: -40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.1 }}
              className="relative overflow-hidden border-b bg-gradient-to-r from-primary via-primary to-blue-700 px-4 py-3"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
              <div className="relative mx-auto flex max-w-md items-center gap-2">
                <motion.img
                  src="/logo.svg"
                  alt="Fotozada"
                  className="h-7"
                  whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
                />
                <span className="text-lg font-bold tracking-tight text-primary-foreground">
                  Fotozada
                </span>
              </div>
            </motion.header>

            {/* Tabs */}
            <div className="mx-auto w-full max-w-md flex-1 px-4 pt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="galeria" className="flex-1">
                    Galeria{items.length > 0 && ` (${items.length})`}
                  </TabsTrigger>
                  <TabsTrigger value="fila" className="flex-1">
                    Fila{result ? " ·" : ""}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="galeria" className="mt-4">
                  <motion.div
                    key="galeria-content"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <GalleryTab
                      items={items}
                      maxSheets={maxSheets}
                      sheets={sheets}
                      onRemove={removeItem}
                    />
                  </motion.div>
                </TabsContent>

                <TabsContent value="fila" className="mt-4">
                  <motion.div
                    key="fila-content"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <QueueTab result={result} items={items} onNew={newOrder} />
                  </motion.div>
                </TabsContent>
              </Tabs>
            </div>

            {/* FAB: adicionar fotos */}
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.3 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="fixed right-6 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-700 shadow-lg shadow-primary/30 disabled:opacity-40 disabled:shadow-none"
              style={{ bottom: items.length > 0 ? "5rem" : "1.5rem" }}
              disabled={remaining < 1}
              onClick={() => setMode("wizard")}
              aria-label="Adicionar fotos"
            >
              <svg className="h-6 w-6 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </motion.button>

            {/* Barra "Imprimir" */}
            <AnimatePresence>
              {items.length > 0 && (
                <motion.div
                  initial={{ y: 80, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 80, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  className="sticky bottom-0 border-t bg-white/80 px-4 py-3 backdrop-blur-lg"
                >
                  <div className="mx-auto max-w-md">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full rounded-xl bg-gradient-to-r from-primary to-blue-700 px-4 py-3.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-colors disabled:opacity-40"
                      disabled={submit.isPending}
                      onClick={print}
                    >
                      {submit.isPending
                        ? "Enviando…"
                        : `Imprimir ${sheets} folha${sheets === 1 ? "" : "s"}`}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
