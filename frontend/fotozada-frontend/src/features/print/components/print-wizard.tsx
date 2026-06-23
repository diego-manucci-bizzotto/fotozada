import { useState } from "react";
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

  return (
    <div className="grid gap-5">
      {/* Wizard header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="shrink-0" onClick={onCancel}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <Stepper steps={STEPS} current={step} />
        </div>
      </div>

      {/* Step body */}
      <div className="rounded-2xl border bg-white p-5">
        {step === 0 && (
          <StepLayout
            onSelect={(l) => {
              setLayout(l);
              setStep(1);
            }}
          />
        )}

        {step === 1 && layout && (
          <StepPhotos
            layout={layout}
            onBack={() => setStep(0)}
            onDone={(f) => {
              setFrames(f);
              setStep(2);
            }}
          />
        )}

        {step === 2 && layout && frames && (
          <StepReview
            layout={layout}
            frames={frames}
            remainingSheets={remainingSheets}
            onBack={() => setStep(1)}
            onConfirm={onAdd}
          />
        )}
      </div>
    </div>
  );
}
