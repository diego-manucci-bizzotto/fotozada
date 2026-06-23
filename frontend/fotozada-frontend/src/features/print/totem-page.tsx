import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
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

  if (mode === "wizard") {
    return (
      <div className="flex min-h-svh flex-col bg-background">
        <div className="mx-auto w-full max-w-md flex-1 p-4">
          <PrintWizard
            remainingSheets={remaining}
            onAdd={addItem}
            onCancel={() => setMode("tabs")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-primary px-4 py-3">
        <div className="mx-auto flex max-w-md items-center gap-2">
          <img src="/logo.svg" alt="Fotozada" className="h-7" />
          <span className="text-lg font-bold text-primary-foreground">Fotozada</span>
        </div>
      </header>

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
            <GalleryTab
              items={items}
              maxSheets={maxSheets}
              sheets={sheets}
              onRemove={removeItem}
            />
          </TabsContent>

          <TabsContent value="fila" className="mt-4">
            <QueueTab result={result} items={items} onNew={newOrder} />
          </TabsContent>
        </Tabs>
      </div>

      {/* FAB: adicionar fotos */}
      <button
        className="fixed bottom-6 right-6 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:shadow-none"
        style={{ bottom: items.length > 0 ? "5rem" : "1.5rem" }}
        disabled={remaining < 1}
        onClick={() => setMode("wizard")}
        aria-label="Adicionar fotos"
      >
        <svg className="h-6 w-6 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Barra "Imprimir" — aparece só quando tem fotos */}
      {items.length > 0 && (
        <div className="sticky bottom-0 border-t bg-white px-4 py-3">
          <div className="mx-auto max-w-md">
            <button
              className="w-full rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
              disabled={submit.isPending}
              onClick={print}
            >
              {submit.isPending
                ? "Enviando…"
                : `Imprimir ${sheets} folha${sheets === 1 ? "" : "s"}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
