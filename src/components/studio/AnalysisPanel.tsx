import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getEmotion } from "@/lib/voice/presets";
import type { AnalysisHighlight, AnalysisResult } from "@/lib/voice/types";
import { cn } from "@/lib/utils";
import { BrainCircuit, Wand2 } from "lucide-react";
import type { ReactNode } from "react";

const PREVIEW_LIMIT = 1500;

const KIND_STYLE: Record<AnalysisHighlight["kind"], string> = {
  question: "bg-sky-400/15 text-sky-300",
  exclamation: "bg-orange-400/15 text-orange-300",
  emphasis: "bg-primary/25 text-primary",
  pause: "bg-amber-400/10 text-amber-300 italic",
};

const KIND_LABEL: Record<AnalysisHighlight["kind"], string> = {
  question: "Kalimat tanya",
  exclamation: "Penekanan kuat",
  emphasis: "Kata ditegaskan",
  pause: "Jeda panjang",
};

const KIND_DOT: Record<AnalysisHighlight["kind"], string> = {
  question: "bg-sky-400",
  exclamation: "bg-orange-400",
  emphasis: "bg-primary",
  pause: "bg-amber-400",
};

/** Merge overlapping highlight ranges, keeping the strongest kind. */
function mergeHighlights(highlights: AnalysisHighlight[]): AnalysisHighlight[] {
  const priority: Record<AnalysisHighlight["kind"], number> = {
    emphasis: 4,
    question: 3,
    exclamation: 2,
    pause: 1,
  };
  const sorted = [...highlights].sort((a, b) => a.start - b.start);
  const merged: AnalysisHighlight[] = [];
  for (const h of sorted) {
    const last = merged[merged.length - 1];
    if (last && h.start <= last.end) {
      last.end = Math.max(last.end, h.end);
      if (priority[h.kind] > priority[last.kind]) {
        last.kind = h.kind;
        last.label = h.label;
      }
    } else {
      merged.push({ ...h });
    }
  }
  return merged;
}

function renderHighlighted(text: string, highlights: AnalysisHighlight[]): ReactNode {
  if (highlights.length === 0) return text;
  const merged = mergeHighlights(highlights);
  const nodes: ReactNode[] = [];
  let cursor = 0;
  for (const h of merged) {
    if (h.start > cursor) nodes.push(text.slice(cursor, h.start));
    nodes.push(
      <mark
        key={h.start}
        className={cn("rounded px-0.5 py-px", KIND_STYLE[h.kind])}
      >
        {text.slice(h.start, h.end)}
      </mark>,
    );
    cursor = h.end;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

export function AnalysisPanel({
  analysis,
  isAutoDirect,
  onApplySuggestion,
}: {
  analysis: AnalysisResult;
  isAutoDirect: boolean;
  onApplySuggestion: () => void;
}) {
  const dominant = getEmotion(analysis.dominantEmotionId);
  const suggestion = analysis.suggestion;
  const suggestedEmotion = getEmotion(suggestion.emotionId);
  const previewText = analysis.sentences
    .map((s) => s.text)
    .join(" ")
    .slice(0, PREVIEW_LIMIT);

  const stats = [
    { label: "Kata", value: analysis.wordCount },
    { label: "Kalimat", value: analysis.sentenceCount },
    { label: "Tanya", value: analysis.questions },
    { label: "Seru", value: analysis.exclamations },
    { label: "Jeda", value: analysis.pausesDetected },
    { label: "Tekanan", value: analysis.emphasisCount },
  ];

  return (
    <section className="rounded-2xl border border-primary/25 bg-card/50">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <BrainCircuit className="size-4 text-primary" />
          <h2 className="text-sm font-bold tracking-tight">Hasil Analisis AI</h2>
        </div>
        <Badge className="gap-1.5 bg-primary/15 text-primary">
          <Wand2 className="size-3" />
          {dominant.name}
        </Badge>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <p className="text-xs leading-6 text-muted-foreground">
          {analysis.suggestion.reason}
        </p>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border/60 bg-background/50 px-2 py-2.5 text-center"
            >
              <div className="text-base font-extrabold text-foreground">
                {stat.value}
              </div>
              <div className="text-[10px] font-medium text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Saran pengaturan (Auto Direct)
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary">{suggestedEmotion.name}</Badge>
            <Badge variant="secondary">
              Pitch {suggestion.pitch > 0 ? "+" : ""}
              {suggestion.pitch}
            </Badge>
            <Badge variant="secondary">Speed ×{suggestion.speed.toFixed(2)}</Badge>
            <Badge variant="secondary">
              Intonation {suggestion.intonation}%
            </Badge>
            <Badge variant="secondary">Pause {suggestion.pause}%</Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3 text-[10px] font-medium text-muted-foreground">
            {(Object.keys(KIND_LABEL) as AnalysisHighlight["kind"][]).map((kind) => (
              <span key={kind} className="inline-flex items-center gap-1.5">
                <span className={cn("size-2 rounded-full", KIND_DOT[kind])} />
                {KIND_LABEL[kind]}
              </span>
            ))}
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="cursor-pointer gap-1.5"
            onClick={onApplySuggestion}
          >
            <Wand2 className="size-3.5" />
            {isAutoDirect ? "Terapkan Ulang Saran" : "Terapkan Saran AI"}
          </Button>
        </div>

        {analysis.highlights.length > 0 && (
          <div className="max-h-44 overflow-y-auto rounded-xl border border-border/60 bg-background/50 p-3.5 text-[13px] leading-7">
            {renderHighlighted(previewText, analysis.highlights)}
            {previewText.length <
              analysis.sentences.reduce((sum, s) => sum + s.text.length, 0) && (
              <span className="text-muted-foreground"> … (teks dipotong untuk pratinjau)</span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
