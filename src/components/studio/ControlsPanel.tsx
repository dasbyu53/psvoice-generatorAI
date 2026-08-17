import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { formatDuration } from "@/lib/format";
import type { SynthesisSettings } from "@/lib/voice/types";
import { cn } from "@/lib/utils";
import { Clock3, Loader2, Square, Wand2, Zap } from "lucide-react";

interface SliderRow {
  key: keyof Pick<
    SynthesisSettings,
    "intonation" | "pitch" | "speed" | "volume" | "pause"
  >;
  label: string;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
}

const SLIDERS: SliderRow[] = [
  {
    key: "intonation",
    label: "Intonation",
    min: 0,
    max: 100,
    step: 1,
    format: (v) => `${v}%`,
  },
  {
    key: "pitch",
    label: "Pitch",
    min: -50,
    max: 50,
    step: 1,
    format: (v) => (v > 0 ? `+${v}` : `${v}`),
  },
  {
    key: "speed",
    label: "Speed",
    min: 0.5,
    max: 1.6,
    step: 0.05,
    format: (v) => `×${v.toFixed(2)}`,
  },
  {
    key: "volume",
    label: "Volume",
    min: 0,
    max: 100,
    step: 1,
    format: (v) => `${v}%`,
  },
  {
    key: "pause",
    label: "Pause",
    min: 0,
    max: 100,
    step: 1,
    format: (v) => `${v}%`,
  },
];

export function ControlsPanel({
  settings,
  estimatedSeconds,
  onChange,
  onAutoDirectChange,
  onGenerate,
  onCancel,
  generating,
  progress,
  canGenerate,
}: {
  settings: SynthesisSettings;
  estimatedSeconds: number;
  onChange: (patch: Partial<SynthesisSettings>) => void;
  onAutoDirectChange: (enabled: boolean) => void;
  onGenerate: () => void;
  onCancel: () => void;
  generating: boolean;
  progress: number;
  canGenerate: boolean;
}) {
  const slidersLocked = settings.autoDirect;

  return (
    <section className="rounded-2xl border border-border/70 bg-card/50 p-4 sm:p-5">
      <h2 className="text-sm font-bold tracking-tight">Kontrol Suara</h2>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        Atur emosi, intonasi, pitch, kecepatan, volume, dan jeda.
      </p>

      {/* auto direct */}
      <div
        className={cn(
          "mt-4 flex items-center justify-between gap-3 rounded-xl border p-3.5 transition-colors",
          settings.autoDirect
            ? "border-primary/40 bg-primary/10"
            : "border-border/70 bg-background/40",
        )}
      >
        <div className="flex items-start gap-2.5">
          <Zap
            className={cn(
              "mt-0.5 size-4",
              settings.autoDirect ? "text-primary" : "text-muted-foreground",
            )}
          />
          <div>
            <div className="text-sm font-bold">AI Auto Direct</div>
            <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
              AI memilih emosi, intonasi, pitch, kecepatan, dan jeda terbaik
              berdasarkan isi teks.
            </p>
          </div>
        </div>
        <Switch
          checked={settings.autoDirect}
          onCheckedChange={onAutoDirectChange}
          aria-label="AI Auto Direct"
        />
      </div>

      {/* sliders */}
      <div className="mt-5 space-y-4">
        {SLIDERS.map((row) => {
          const value = settings[row.key];
          return (
            <div key={row.key}>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span
                  className={cn(
                    "font-semibold",
                    slidersLocked ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  {row.label}
                </span>
                <span className="font-bold tabular-nums text-primary">
                  {row.format(value)}
                </span>
              </div>
              <Slider
                min={row.min}
                max={row.max}
                step={row.step}
                value={[value]}
                disabled={slidersLocked}
                onValueChange={([next]) =>
                  next !== undefined && onChange({ [row.key]: next })
                }
                aria-label={row.label}
              />
            </div>
          );
        })}
        {slidersLocked && (
          <p className="text-[11px] text-muted-foreground">
            Slider dikunci — AI Auto Direct sedang mengatur semuanya. Matikan
            toggle untuk kontrol manual.
          </p>
        )}
      </div>

      {/* duration estimate */}
      <div className="mt-5 flex items-center justify-between rounded-xl border border-border/60 bg-background/40 px-3.5 py-2.5">
        <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Clock3 className="size-3.5 text-primary" />
          Estimasi durasi
        </span>
        <span className="text-sm font-extrabold tabular-nums">
          {estimatedSeconds > 0 ? `~${formatDuration(estimatedSeconds)}` : "—"}
        </span>
      </div>

      {/* generate */}
      <div className="mt-4">
        {generating ? (
          <div className="space-y-2.5">
            <Progress value={Math.round(progress * 100)} className="h-2" />
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Membangkitkan suara... {Math.round(progress * 100)}%
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 cursor-pointer text-xs text-muted-foreground"
                onClick={onCancel}
              >
                <Square className="size-3" />
                Batal
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            size="lg"
            className="w-full cursor-pointer gap-2"
            disabled={!canGenerate}
            onClick={onGenerate}
          >
            <Wand2 className="size-4" />
            Generate Voice
          </Button>
        )}
      </div>
    </section>
  );
}
