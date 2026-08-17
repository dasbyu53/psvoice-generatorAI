import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const STEPS = ["Tulis Teks", "AI Analyze", "Auto Direct", "Generate Voice", "Preview & Download"];

export function StepFlow({
  hasText,
  hasAnalysis,
  isGenerating,
  hasAudio,
}: {
  hasText: boolean;
  hasAnalysis: boolean;
  isGenerating: boolean;
  hasAudio: boolean;
}) {
  const done = [hasText, hasAnalysis, hasAnalysis, isGenerating || hasAudio, hasAudio];
  const activeIndex = isGenerating ? 3 : done.findIndex((d) => !d);

  return (
    <ol className="flex items-center gap-0 overflow-x-auto pb-1">
      {STEPS.map((step, i) => {
        const isDone = done[i];
        const isActive = activeIndex === i;
        return (
          <li key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold transition-colors",
                  isDone
                    ? "border-primary bg-primary text-primary-foreground"
                    : isActive
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border bg-card text-muted-foreground",
                )}
              >
                {isDone ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  "whitespace-nowrap text-[10px] font-semibold sm:text-[11px]",
                  isDone || isActive ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span
                className={cn(
                  "mx-2 mb-5 h-px w-6 sm:w-10",
                  isDone ? "bg-primary/60" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
