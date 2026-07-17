import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { newId } from "@/lib/device";
import { useTotemSettings } from "../print/hooks/use-totem-settings";
import { useSubmitBatch } from "../print/hooks/use-submit-batch";
import type { JobStatus, LayoutDef, PhotoItem } from "../print/types";
import type { BatchResult, FrameData, Step } from "./types";
import { saveBatch, loadBatch, clearBatch } from "./lib/persisted-batch";
import { StepIndicator } from "./components/step-indicator";
import { WelcomeStep } from "./components/welcome-step";
import { LayoutStep } from "./components/layout-step";
import { PhotoStep } from "./components/photo-step";
import { ReviewStep } from "./components/review-step";
import { StatusStep } from "./components/status-step";

const STEP_NAMES = ["Início", "Formato", "Foto", "Revisão", "Status"];

export function ArraialPage() {
  const kioskId = useMemo(
    () => new URLSearchParams(window.location.search).get("kiosk") ?? "kiosk-01",
    [],
  );
  const settings = useTotemSettings(kioskId);
  const maxSheets = settings.data?.max_sheets_per_batch ?? 5;
  const submit = useSubmitBatch();

  // A batch that was still printing survives a refresh/tab close — resume
  // straight to the status screen instead of losing track of it.
  const [initialResult] = useState<BatchResult | null>(loadBatch);

  const [step, setStep] = useState<Step>(initialResult ? "status" : "welcome");
  const [layout, setLayout] = useState<LayoutDef | null>(null);
  const [frames, setFrames] = useState<FrameData[] | null>(null);
  const [items, setItems] = useState<PhotoItem[]>([]);
  const [result, setResult] = useState<BatchResult | null>(initialResult);
  const [submitting, setSubmitting] = useState(false);
  const requestIdRef = useRef<string | null>(null);

  const sheets = items.reduce((s, i) => s + i.copies, 0);
  const remaining = maxSheets - sheets;
  void remaining; void sheets;

  function handleConfirm(item: PhotoItem) {
    const allItems = [...items, item];
    setItems(allItems);
    setSubmitting(true);
    setStep("status");

    if (!requestIdRef.current) requestIdRef.current = newId();
    submit
      .mutateAsync({ kioskId, items: allItems, clientRequestId: requestIdRef.current })
      .then((res) => {
        if (res.blocked) {
          toast.warning(`Limite de ${res.max} folhas por envio`);
          setSubmitting(false);
          setStep("review");
          return;
        }
        if (res.error) {
          toast.error("Erro", { description: res.error });
          setSubmitting(false);
          setStep("review");
          return;
        }
        if (res.batch_id && res.job_ids) {
          const newResult: BatchResult = {
            batchId: res.batch_id,
            jobIds: res.job_ids,
            status: (res.status as JobStatus) ?? "queued",
            items: allItems.map((i) => ({ layout: i.layout, copies: i.copies })),
          };
          setResult(newResult);
          saveBatch(newResult);
          setSubmitting(false);
        }
      })
      .catch(() => {
        toast.error("Falha ao enviar");
        setSubmitting(false);
        setStep("review");
      });
  }

  function reset() {
    items.forEach((i) => URL.revokeObjectURL(i.composedUrl));
    setItems([]);
    setResult(null);
    clearBatch();
    requestIdRef.current = null;
    setLayout(null);
    setFrames(null);
    setStep("welcome");
  }

  const stepIndex = STEP_NAMES.indexOf(
    step === "welcome" ? "Início" : step === "layout" ? "Formato" : step === "photos" ? "Foto" : step === "review" ? "Revisão" : "Status",
  );

  return (
    <div className="relative flex h-svh flex-col overflow-hidden bg-linear-to-b from-[#1a0a2e] via-[#2d1b4e] to-[#1a0a2e]">
      {/* Sky layer — animated stars, fades out near the bonfire glow */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-40"
        style={{
          backgroundImage: "url(/ceu-animado.svg)",
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 85%, rgba(26,10,46,1) 0%, rgba(26,10,46,0.85) 30%, transparent 70%)",
        }}
      />

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

      <div className="relative z-10 flex flex-1 flex-col">
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
          {step === "status" && (
            <StatusStep key="status" result={result} submitting={submitting} onNew={reset} />
          )}
        </AnimatePresence>
      </div>

      {/* Firelight — 2 layers (consolidated from 5 for performance) */}

      {/* Outer: wide warm halo */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1.05, 1.2, 1],
          opacity: [0.25, 0.45, 0.3, 0.5, 0.25],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute bottom-0 left-1/2 h-[500px] w-[500px] -translate-x-1/2 translate-y-1/3 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(245,158,11,0.7) 0%, rgba(249,115,22,0.4) 40%, rgba(234,179,8,0.15) 70%, transparent 100%)" }}
      />

      {/* Inner: bright flickering core */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1.08, 1.35, 1],
          opacity: [0.45, 0.8, 0.5, 0.85, 0.45],
        }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute bottom-0 left-1/2 h-40 w-44 -translate-x-1/2 translate-y-1/6 rounded-full blur-2xl"
        style={{ background: "radial-gradient(circle, rgba(251,191,36,0.9) 0%, rgba(239,68,68,0.3) 60%, transparent 100%)" }}
      />
    </div>
  );
}
