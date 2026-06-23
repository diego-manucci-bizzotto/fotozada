import { cn } from "@/lib/utils";

interface StepperProps {
  steps: string[];
  current: number; // 0-based index of the active step
}

export function Stepper({ steps, current }: StepperProps) {
  return (
    <ol className="flex items-center justify-center gap-1">
      {steps.map((label, i) => {
        const state = i < current ? "done" : i === current ? "active" : "todo";
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                state === "active" && "bg-primary text-primary-foreground",
                state === "done" && "bg-primary/15 text-primary",
                state === "todo" && "bg-muted text-muted-foreground",
              )}
            >
              {i + 1}
            </span>
            <span
              className={cn(
                "text-sm",
                state === "active" ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
            {i < steps.length - 1 && <span className="mx-1 h-px w-5 bg-border" />}
          </li>
        );
      })}
    </ol>
  );
}
