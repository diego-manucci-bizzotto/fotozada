import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/stepper";
import type { LayoutDef, PhotoItem } from "../types";
import { StepLayout } from "./step-layout";
import { StepPhotos, type FrameData } from "./step-photos";
import { StepReview } from "./step-review";

const STEPS = ["Formato", "Fotos", "Revisão"];

interface Props {
  remainingSheets: number;
  onAdd: (item: PhotoItem) => void;
  onCancel: () => void;
}

export function PrintWizard({ remainingSheets, onAdd, onCancel }: Props) {
  const [step, setStep] = useState(0);
  const [layout, setLayout] = useState<LayoutDef | null>(null);
  const [frames, setFrames] = useState<FrameData[] | null>(null);
  const directionRef = useRef(1);

  function goTo(next: number) {
    directionRef.current = next > step ? 1 : -1;
    setStep(next);
  }

  return (
    <div className="grid gap-5">
      {/* Wizard header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="flex items-center gap-3"
      >
        <motion.div whileHover={{ x: -3 }} whileTap={{ scale: 0.9 }}>
          <Button variant="ghost" size="icon" className="shrink-0" onClick={onCancel}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </motion.div>
        <div className="flex-1">
          <Stepper steps={STEPS} current={step} />
        </div>
      </motion.div>

      {/* Step body */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.1 }}
        className="overflow-hidden rounded-2xl border bg-white shadow-sm"
      >
        <AnimatePresence mode="wait" custom={directionRef.current}>
          <motion.div
            key={step}
            custom={directionRef.current}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d * 40 }),
              center: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: d * -40 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="p-5"
          >
            {step === 0 && (
              <StepLayout
                onSelect={(l) => {
                  setLayout(l);
                  goTo(1);
                }}
              />
            )}

            {step === 1 && layout && (
              <StepPhotos
                layout={layout}
                onBack={() => goTo(0)}
                onDone={(f) => {
                  setFrames(f);
                  goTo(2);
                }}
              />
            )}

            {step === 2 && layout && frames && (
              <StepReview
                layout={layout}
                frames={frames}
                remainingSheets={remainingSheets}
                onBack={() => goTo(1)}
                onConfirm={onAdd}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
