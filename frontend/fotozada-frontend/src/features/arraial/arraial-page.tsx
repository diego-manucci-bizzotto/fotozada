import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  PartyPopper,
  Printer,
  RotateCcw,
  Sparkles,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { newId } from "@/lib/device";
import { LAYOUTS, LAYOUT_LIST } from "../print/lib/layouts";
import { canvasToBlob, composeSheet, cropToCell, sha256Hex } from "../print/lib/compose";
import { useTotemSettings } from "../print/hooks/use-totem-settings";
import { useSubmitBatch } from "../print/hooks/use-submit-batch";
import { useBatchStatus } from "../print/hooks/use-batch-status";
import type { CropPixels, JobStatus, LayoutDef, PhotoItem } from "../print/types";

type Step = "welcome" | "layout" | "photos" | "review" | "status";

interface FrameData {
  crop: CropPixels;
  canvas: HTMLCanvasElement;
  blob: Blob;
  width: number;
  height: number;
}

interface BatchResult {
  batchId: string;
  jobIds: string[];
  status: JobStatus;
  items: PhotoItem[];
}

const LABEL: Record<JobStatus, string> = {
  pending_approval: "Aguardando",
  queued: "Na fila",
  printing: "Imprimindo…",
  done: "Pronto!",
  error: "Erro",
  canceled: "Cancelado",
};

const BADGE_VARIANT: Record<JobStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending_approval: "outline",
  queued: "outline",
  printing: "secondary",
  done: "default",
  error: "destructive",
  canceled: "destructive",
};

function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {steps.map((_, i) => (
        <motion.div
          key={i}
          animate={{
            scale: i === current ? 1 : 0.7,
            opacity: i <= current ? 1 : 0.3,
          }}
          className={`h-2 rounded-full transition-colors ${
            i < current
              ? "w-2 bg-amber-400"
              : i === current
                ? "w-6 bg-amber-500"
                : "w-2 bg-white/30"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Welcome ────────────────────────────────────────────────────────────────
function WelcomeStep({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -30 }}
      className="relative flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center"
    >
      {/* Bandeirinhas decoration at top */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="pointer-events-none absolute top-0 left-0 right-0 h-16 overflow-hidden"
      >
        <img src="/bandeirinhas.svg" alt="" className="w-full h-full object-cover" />
      </motion.div>

      {/* Mascot floating top-right */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 150, damping: 12, delay: 0.2 }}
        className="pointer-events-none absolute top-20 right-0 w-32 h-40"
      >
        <img src="/arraial-mascot.svg" alt="" className="w-full h-full object-contain drop-shadow-xl" />
      </motion.div>

      {/* Main content */}
      <div className="mt-16 flex flex-col items-center gap-6">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
        >
          <img src="/arraial-logo.svg" alt="Arraial UNAERP" className="h-20 drop-shadow-md" />
        </motion.div>

        {/* Description text */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="max-w-xs"
        >
          <p className="text-base leading-relaxed text-white/90">
            Registre os melhores momentos do arraial!
            <br />
            <span className="text-sm text-white/60">Escolha suas fotos e leve a recordação impressa.</span>
          </p>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="pt-4"
        >
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStart}
            className="rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-12 py-3.5 text-base font-bold text-white shadow-lg shadow-amber-500/40 transition-shadow hover:shadow-amber-500/50"
          >
            Começar
          </motion.button>
        </motion.div>
      </div>

      {/* UNAERP watermark bottom-left */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="pointer-events-none absolute bottom-8 left-6 h-12 opacity-40"
      >
        <img src="/unaerp.png" alt="" className="h-full object-contain" />
      </motion.div>
    </motion.div>
  );
}

// ─── Layout selection ───────────────────────────────────────────────────────
function LayoutStep({
  onSelect,
  onBack,
}: {
  onSelect: (layout: LayoutDef) => void;
  onBack: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="flex flex-1 flex-col gap-6 px-5 pt-4"
    >
      <button onClick={onBack} className="flex items-center gap-1 self-start text-sm text-white/60">
        <ChevronLeft className="h-4 w-4" /> Voltar
      </button>

      <div className="space-y-1 text-center">
        <h2 className="text-xl font-bold text-white">Escolha o formato</h2>
        <p className="text-sm text-white/60">Como quer levar sua recordação?</p>
      </div>

      <div className="grid gap-4">
        {LAYOUT_LIST.map((l, i) => (
          <motion.button
            key={l.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.1, type: "spring", stiffness: 300, damping: 25 }}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(l)}
            className="group relative overflow-hidden rounded-2xl bg-white/10 p-5 text-left backdrop-blur-sm"
          >
            <div className="absolute inset-0 bg-linear-to-r from-amber-500/0 to-amber-500/0 transition-all group-hover:from-amber-500/10 group-hover:to-orange-500/10" />
            <div className="relative flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-500/20">
                {l.id === "single_10x15" ? (
                  <ImagePlus className="h-7 w-7 text-amber-400" />
                ) : (
                  <Sparkles className="h-7 w-7 text-amber-400" />
                )}
              </div>
              <div>
                <div className="text-base font-bold text-white">{l.label}</div>
                <div className="text-sm text-white/50">
                  {l.photos} foto{l.photos > 1 ? "s" : ""} por folha
                </div>
              </div>
              <ChevronRight className="ml-auto h-5 w-5 text-white/30" />
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Photo input ────────────────────────────────────────────────────────────
function PhotoStep({
  layout,
  onDone,
  onBack,
}: {
  layout: LayoutDef;
  onDone: (frames: FrameData[]) => void;
  onBack: () => void;
}) {
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
        <h2 className="flex items-center justify-center gap-2 text-lg font-bold text-white">
          <Camera className="h-5 w-5 text-amber-400" />
          Suas fotos
        </h2>
        <p className="mt-1 text-sm text-white/50">
          {!pickedSrc ? "Escolha uma foto da galeria" : "Ajuste o enquadramento"}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!pickedSrc ? (
          <motion.label
            key="upload"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileTap={{ scale: 0.97 }}
            className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-white/20 bg-white/5"
          >
            <div className="animate-float flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20">
              <Upload className="h-8 w-8 text-amber-400" />
            </div>
            <span className="text-base font-semibold text-amber-400">Escolher foto</span>
            <span className="text-xs text-white/40">Toque para abrir a galeria</span>
            <input type="file" accept="image/*" hidden onChange={pickFile} />
          </motion.label>
        ) : (
          <motion.div
            key="crop"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-1 flex-col gap-4"
          >
            <div className="relative flex-1 overflow-hidden rounded-2xl bg-black/40">
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
              className="[&_[role=slider]]:bg-amber-500"
            />
            <div className="flex gap-3">
              <Button asChild variant="outline" className="flex-1 rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                <label>
                  <RotateCcw className="mr-1.5 h-4 w-4" />
                  Trocar
                  <input type="file" accept="image/*" hidden onChange={pickFile} />
                </label>
              </Button>
              <motion.div className="flex-1" whileTap={{ scale: 0.97 }}>
                <Button
                  className="w-full rounded-xl bg-amber-500 text-white hover:bg-amber-600"
                  disabled={busy || !areaPixels}
                  onClick={confirmCrop}
                >
                  {current + 1 < layout.photos ? "Próxima" : "Concluir"}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Review ─────────────────────────────────────────────────────────────────
function ReviewStep({
  layout,
  frames,
  onConfirm,
  onBack,
}: {
  layout: LayoutDef;
  frames: FrameData[];
  remainingSheets?: number;
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

// ─── Status ─────────────────────────────────────────────────────────────────
function StatusStep({
  result,
  onNew,
}: {
  result: BatchResult;
  onNew: () => void;
}) {
  const statuses = useBatchStatus(result.batchId, result.jobIds, result.status);

  const jobs = result.jobIds.map((id, i) => ({
    id,
    layout: result.items[i]?.layout,
    copies: result.items[i]?.copies ?? 1,
  }));

  const total = jobs.reduce((s, j) => s + j.copies, 0);
  const done = jobs
    .filter((j) => statuses[j.id] === "done")
    .reduce((s, j) => s + j.copies, 0);
  const allDone = jobs.length > 0 && jobs.every((j) => statuses[j.id] === "done");

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-1 flex-col items-center justify-center gap-6 px-5"
    >
      <motion.div
        animate={allDone ? { scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] } : {}}
        transition={{ duration: 0.6 }}
        className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm"
      >
        {allDone ? (
          <PartyPopper className="h-10 w-10 text-amber-400" />
        ) : (
          <Printer className="h-10 w-10 animate-pulse text-amber-400" />
        )}
      </motion.div>

      <div className="text-center">
        <h2 className="text-xl font-bold text-white">
          {allDone ? "Pronto! Retire sua foto" : "Imprimindo…"}
        </h2>
        <p className="mt-1 text-sm text-white/50">
          {done} de {total} folha{total !== 1 ? "s" : ""} pronta{done !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="w-full max-w-xs">
        <Progress value={total ? (done / total) * 100 : 0} className="h-3 bg-white/10" />
      </div>

      <div className="w-full max-w-xs space-y-2">
        {jobs.map((j, i) => {
          const st = statuses[j.id] ?? "queued";
          return (
            <motion.div
              key={j.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm"
            >
              <span className="text-sm text-white">
                {j.layout ? LAYOUTS[j.layout].label : "Item"} ×{j.copies}
              </span>
              <Badge variant={BADGE_VARIANT[st]} className="text-[11px]">
                {LABEL[st]}
              </Badge>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {allDone && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNew}
              className="rounded-2xl bg-amber-500 px-8 py-3.5 font-bold text-white shadow-lg shadow-amber-500/25"
            >
              Nova foto
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────
const STEP_NAMES = ["Início", "Formato", "Foto", "Revisão", "Status"];

export function ArraialPage() {
  const kioskId = useMemo(
    () => new URLSearchParams(window.location.search).get("kiosk") ?? "kiosk-01",
    [],
  );
  const settings = useTotemSettings(kioskId);
  const maxSheets = settings.data?.max_sheets_per_batch ?? 5;
  const submit = useSubmitBatch();

  const [step, setStep] = useState<Step>("welcome");
  const [layout, setLayout] = useState<LayoutDef | null>(null);
  const [frames, setFrames] = useState<FrameData[] | null>(null);
  const [items, setItems] = useState<PhotoItem[]>([]);
  const [result, setResult] = useState<BatchResult | null>(null);
  const requestIdRef = useRef<string | null>(null);

  const sheets = items.reduce((s, i) => s + i.copies, 0);
  const remaining = maxSheets - sheets;

  async function handleConfirm(item: PhotoItem) {
    const allItems = [...items, item];
    setItems(allItems);

    if (!requestIdRef.current) requestIdRef.current = newId();
    const res = await submit
      .mutateAsync({ kioskId, items: allItems, clientRequestId: requestIdRef.current })
      .catch(() => null);
    if (!res) return;
    if (res.blocked) {
      toast.warning(`Limite de ${res.max} folhas por envio`);
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
        items: allItems,
      });
      setStep("status");
    }
  }

  function reset() {
    items.forEach((i) => URL.revokeObjectURL(i.composedUrl));
    setItems([]);
    setResult(null);
    requestIdRef.current = null;
    setLayout(null);
    setFrames(null);
    setStep("welcome");
  }

  const stepIndex = STEP_NAMES.indexOf(
    step === "welcome" ? "Início" : step === "layout" ? "Formato" : step === "photos" ? "Foto" : step === "review" ? "Revisão" : "Status",
  );

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-linear-to-b from-[#1a0a2e] via-[#2d1b4e] to-[#1a0a2e]">
      {/* Step indicator (always reserving space to prevent layout shift) */}
      <div className="relative z-20 pb-2 pt-14 h-12">
        {step !== "welcome" && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <StepIndicator steps={STEP_NAMES} current={stepIndex} />
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className={`relative z-10 flex flex-1 flex-col`}>
        <AnimatePresence mode="wait">
          {step === "welcome" && (
            <WelcomeStep key="welcome" onStart={() => setStep("layout")} />
          )}
          {step === "layout" && (
            <LayoutStep
              key="layout"
              onSelect={(l) => {
                setLayout(l);
                setStep("photos");
              }}
              onBack={() => setStep("welcome")}
            />
          )}
          {step === "photos" && layout && (
            <PhotoStep
              key="photos"
              layout={layout}
              onDone={(f) => {
                setFrames(f);
                setStep("review");
              }}
              onBack={() => setStep("layout")}
            />
          )}
          {step === "review" && layout && frames && (
            <ReviewStep
              key="review"
              layout={layout}
              frames={frames}
              onConfirm={handleConfirm}
              onBack={() => setStep("photos")}
            />
          )}
          {step === "status" && result && (
            <StatusStep key="status" result={result} onNew={reset} />
          )}
        </AnimatePresence>
      </div>

      {/* Ambient glow */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 translate-y-1/2 rounded-full bg-amber-500/10 blur-3xl" />
    </div>
  );
}
