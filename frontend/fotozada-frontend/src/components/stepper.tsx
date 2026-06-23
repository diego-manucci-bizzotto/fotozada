import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperProps {
  steps: string[];
  current: number;
}

export function Stepper({ steps, current }: StepperProps) {
  return (
    <ol className="flex items-center justify-center gap-1">
      {steps.map((label, i) => {
        const state = i < current ? "done" : i === current ? "active" : "todo";
        return (
          <li key={label} className="flex items-center gap-2">
            <motion.span
              layout
              initial={false}
              animate={{
                scale: state === "active" ? 1 : 0.9,
                backgroundColor:
                  state === "active"
                    ? "var(--primary)"
                    : state === "done"
                      ? "oklch(0.55 0.22 264 / 0.15)"
                      : "var(--muted)",
              }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                state === "active" && "text-primary-foreground shadow-sm shadow-primary/30",
                state === "done" && "text-primary",
                state === "todo" && "text-muted-foreground",
              )}
            >
              {state === "done" ? (
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </motion.div>
              ) : (
                i + 1
              )}
            </motion.span>
            <span
              className={cn(
                "text-sm",
                state === "active" ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
            {i < steps.length - 1 && (
              <motion.span
                className="mx-1 h-px w-5"
                initial={false}
                animate={{
                  backgroundColor: i < current ? "var(--primary)" : "var(--border)",
                }}
                transition={{ duration: 0.3 }}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
