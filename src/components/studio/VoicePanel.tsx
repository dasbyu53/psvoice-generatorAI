import { Badge } from "@/components/ui/badge";
import { EMOTIONS, SCENE_PRESETS, VOICES } from "@/lib/voice/presets";
import type { ScenePreset, SynthesisSettings } from "@/lib/voice/types";
import { cn } from "@/lib/utils";
import { Mic2, Sparkles } from "lucide-react";

const STYLE_LABEL: Record<string, string> = {
  professional: "Profesional",
  casual: "Santai",
  deep: "Deep",
  energetic: "Energik",
  storyteller: "Storyteller",
  ad: "Iklan",
  warm: "Hangat",
};

export function VoicePanel({
  settings,
  scenePresetId,
  onVoiceChange,
  onEmotionChange,
  onScenePreset,
}: {
  settings: SynthesisSettings;
  scenePresetId: string | null;
  onVoiceChange: (voiceId: string) => void;
  onEmotionChange: (emotionId: string) => void;
  onScenePreset: (preset: ScenePreset | null) => void;
}) {
  return (
    <div className="space-y-6">
      {/* scene presets */}
      <section className="rounded-2xl border border-border/70 bg-card/50 p-4 sm:p-5">
        <h2 className="text-sm font-bold tracking-tight">Preset Scene</h2>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Satu klik — suara, emosi, dan kecepatan langsung diatur.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SCENE_PRESETS.map((preset) => {
            const active = scenePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onScenePreset(active ? null : preset)}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background/50 text-muted-foreground hover:border-primary/50 hover:text-foreground",
                )}
              >
                {preset.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* voices */}
      <section className="rounded-2xl border border-border/70 bg-card/50 p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Mic2 className="size-4 text-primary" />
          <h2 className="text-sm font-bold tracking-tight">Pilih Suara</h2>
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Suara yang sama selalu konsisten di seluruh scene.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {VOICES.map((voice) => {
            const active = settings.voiceId === voice.id;
            return (
              <button
                key={voice.id}
                type="button"
                onClick={() => onVoiceChange(voice.id)}
                className={cn(
                  "cursor-pointer rounded-xl border p-3 text-left transition-colors",
                  active
                    ? "border-primary bg-primary/10"
                    : "border-border/70 bg-background/40 hover:border-primary/40 hover:bg-background/70",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold">{voice.name}</span>
                  <span
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      active ? "bg-primary" : "bg-border",
                    )}
                  />
                </div>
                <div className="mt-0.5 flex items-center gap-1">
                  <Badge variant="secondary" className="px-1.5 py-0 text-[9px]">
                    {voice.gender === "male" ? "Pria" : "Wanita"}
                  </Badge>
                  <Badge variant="secondary" className="px-1.5 py-0 text-[9px]">
                    {STYLE_LABEL[voice.style]}
                  </Badge>
                  <Badge variant="secondary" className="px-1.5 py-0 text-[9px]">
                    {voice.age === "young" ? "Muda" : voice.age === "adult" ? "Dewasa" : "Matang"}
                  </Badge>
                </div>
                <p className="mt-1.5 line-clamp-2 text-[11px] leading-4 text-muted-foreground">
                  {voice.tagline}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* emotions */}
      <section className="rounded-2xl border border-border/70 bg-card/50 p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h2 className="text-sm font-bold tracking-tight">Emosi & Ekspresi</h2>
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Mengubah warna suara tanpa mengubah karakter suaranya.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {EMOTIONS.map((emotion) => {
            const active = settings.emotionId === emotion.id;
            return (
              <button
                key={emotion.id}
                type="button"
                onClick={() => onEmotionChange(emotion.id)}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background/50 text-muted-foreground hover:border-primary/50 hover:text-foreground",
                )}
              >
                {emotion.name}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
