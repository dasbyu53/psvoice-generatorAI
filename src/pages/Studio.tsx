import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PsLogo } from "@/components/PsLogo";
import { AnalysisPanel } from "@/components/studio/AnalysisPanel";
import { AudioPlayer } from "@/components/studio/AudioPlayer";
import { ControlsPanel } from "@/components/studio/ControlsPanel";
import { HistoryPanel } from "@/components/studio/HistoryPanel";
import { StepFlow } from "@/components/studio/StepFlow";
import { TextEditor } from "@/components/studio/TextEditor";
import { VoicePanel } from "@/components/studio/VoicePanel";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { formatDuration, slugify } from "@/lib/format";
import { DemoEngineCancelledError } from "@/lib/voice/demo-engine";
import { elevenLabsEngine } from "@/lib/voice/elevenlabs-engine";
import { googleTtsEngine } from "@/lib/voice/google-engine";
import {
  DEFAULT_SETTINGS,
  getScenePreset,
  getVoice,
} from "@/lib/voice/presets";
import { getEngines } from "@/lib/voice/registry";
import type {
  AnalysisResult,
  CancelSignal,
  ScenePreset,
  SynthesizedAudio,
  SynthesisSettings,
} from "@/lib/voice/types";
import { motion } from "framer-motion";
import { ChevronDown, LogOut, Mic2, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

type VoiceoverDoc = Doc<"voiceovers">;

export default function Studio() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [engineId, setEngineId] = useState(getEngines()[0].id);
  const engine = getEngines().find((e) => e.id === engineId) ?? getEngines()[0];

  const [text, setText] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [settings, setSettings] = useState<SynthesisSettings>(DEFAULT_SETTINGS);
  const [scenePresetId, setScenePresetId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audio, setAudio] = useState<SynthesizedAudio | null>(null);
  const [audioKey, setAudioKey] = useState("");
  const cancelRef = useRef<CancelSignal>({ cancelled: false });

  const history = useQuery(api.voiceovers.list);
  const saveVoiceover = useMutation(api.voiceovers.save);
  const removeVoiceover = useMutation(api.voiceovers.remove);
  const requestSpeech = useAction(api.tts.elevenlabsSpeech);
  const requestGoogle = useAction(api.tts.googleTtsSpeech);

  // Attach the Convex actions as the network transports for the cloud
  // engines, so API keys stay server-side.
  useEffect(() => {
    elevenLabsEngine.setTransport(requestSpeech);
    googleTtsEngine.setTransport(requestGoogle);
  }, [requestSpeech, requestGoogle]);

  // Revoke object URLs when replaced or unmounted.
  useEffect(() => {
    return () => {
      if (audio) URL.revokeObjectURL(audio.objectUrl);
    };
  }, [audio]);

  const estimatedSeconds = useMemo(
    () => engine.estimateDurationSec(text, settings),
    [engine, text, settings],
  );

  const currentKey = `${text}|${JSON.stringify(settings)}`;
  const stale = audio !== null && audioKey !== currentKey;

  const handleTextChange = (value: string) => {
    setText(value);
    setAnalysis(null);
    setAudio(null);
    setAudioKey("");
  };

  const applySuggestion = (result: AnalysisResult) => {
    const s = result.suggestion;
    setSettings((prev) => ({
      ...prev,
      emotionId: s.emotionId,
      pitch: s.pitch,
      speed: s.speed,
      intonation: s.intonation,
      volume: s.volume,
      pause: s.pause,
    }));
    setScenePresetId(null);
  };

  const handleAnalyze = () => {
    const result = engine.analyze(text);
    setAnalysis(result);
    setAudio(null);
    setAudioKey("");
    if (settings.autoDirect) {
      applySuggestion(result);
    }
    toast.success("Analisis AI selesai", {
      description: result.suggestion.reason,
    });
  };

  const handleAutoDirect = (enabled: boolean) => {
    setSettings((prev) => ({ ...prev, autoDirect: enabled }));
    if (enabled && analysis) {
      applySuggestion(analysis);
      toast.info("AI Auto Direct aktif — pengaturan disesuaikan dari teks");
    }
  };

  const handleScenePreset = (preset: ScenePreset | null) => {
    if (!preset) {
      setScenePresetId(null);
      return;
    }
    setScenePresetId(preset.id);
    setSettings((prev) => ({
      ...prev,
      voiceId: preset.suggestedVoiceId,
      emotionId: preset.emotionId,
      speed: preset.speed,
      pitch: preset.pitch,
      intonation: preset.intonation,
      volume: preset.volume,
      pause: preset.pause,
    }));
  };

  const handleGenerate = async () => {
    const trimmed = text.trim();
    if (trimmed.length < 5 || generating) return;

    cancelRef.current = { cancelled: false };
    setGenerating(true);
    setProgress(0);
    setAudio(null);
    setAudioKey("");

    try {
      const result = await engine.synthesize(
        trimmed,
        settings,
        setProgress,
        cancelRef.current,
      );
      setAudio(result);
      setAudioKey(currentKey);

      const voice = getVoice(settings.voiceId);
      const wordCount =
        analysis?.wordCount ?? trimmed.split(/\s+/).filter(Boolean).length;
      const title = trimmed
        .split(/[.!?…]/)[0]
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 48);

      try {
        await saveVoiceover({
          text: trimmed,
          title: title || undefined,
          voiceId: settings.voiceId,
          voiceName: voice.name,
          emotionId: settings.emotionId,
          scenePresetId: scenePresetId ?? undefined,
          autoDirect: settings.autoDirect,
          settings: {
            intonation: settings.intonation,
            pitch: settings.pitch,
            speed: settings.speed,
            volume: settings.volume,
            pause: settings.pause,
          },
          durationSec: result.durationSec,
          wordCount,
        });
      } catch {
        // history save failure shouldn't block the preview
      }

      toast.success("Voiceover siap!", {
        description: `${voice.name} · ${formatDuration(result.durationSec)}`,
      });
    } catch (error) {
      if (error instanceof DemoEngineCancelledError) {
        toast.info("Generate dibatalkan");
      } else {
        console.error("[PSvoice] generate failed:", error);
        toast.error("Gagal membangkitkan suara", {
          description:
            error instanceof Error ? error.message : "Terjadi kesalahan tak terduga",
        });
      }
    } finally {
      setGenerating(false);
      setProgress(0);
    }
  };

  const handleCancel = () => {
    cancelRef.current.cancelled = true;
  };

  const handleLoadHistory = (item: VoiceoverDoc) => {
    setText(item.text);
    setAnalysis(null);
    setAudio(null);
    setAudioKey("");
    setScenePresetId(item.scenePresetId ?? null);
    setSettings({
      voiceId: item.voiceId,
      emotionId: item.emotionId,
      intonation: item.settings.intonation,
      pitch: item.settings.pitch,
      speed: item.settings.speed,
      volume: item.settings.volume,
      pause: item.settings.pause,
      autoDirect: item.autoDirect,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.success("Riwayat dimuat ke editor");
  };

  const handleDeleteHistory = async (id: VoiceoverDoc["_id"]) => {
    try {
      await removeVoiceover({ id });
      toast.success("Riwayat dihapus");
    } catch {
      toast.error("Gagal menghapus riwayat");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const activePreset = scenePresetId ? getScenePreset(scenePresetId) : null;
  const filename =
    audio !== null
      ? `psvoice-${slugify(text.slice(0, 40))}-${settings.voiceId}.${audio.format}`
      : "psvoice.mp3";

  const displayName = user?.name || user?.email || "Pengguna";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* top bar */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <PsLogo onClick={() => navigate("/")} />
          <div className="flex items-center gap-2">
            <Select value={engineId} onValueChange={setEngineId}>
              <SelectTrigger size="sm" className="hidden w-auto gap-2 sm:flex">
                <Mic2 className="size-3.5 text-primary" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getEngines().map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="cursor-pointer gap-2"
                  size="sm"
                >
                  <Avatar className="size-6">
                    <AvatarFallback className="bg-primary/15 text-[10px] font-bold text-primary">
                      {displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-28 truncate text-xs font-semibold sm:block">
                    {displayName}
                  </span>
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                  {user?.email ?? "Pengguna"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => navigate("/")}
                >
                  <Sparkles className="mr-2 size-4" />
                  Halaman Landing
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 size-4" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* page intro */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Studio Voiceover
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Tulis teks, biarkan AI berbicara.
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            PSvoice membaca, menganalisis, lalu membangkitkan suara Bahasa
            Indonesia yang natural — siap preview dan download MP3.
          </p>
        </motion.div>

        {/* flow indicator */}
        <div className="mb-6 rounded-2xl border border-border/70 bg-card/50 px-4 py-3.5 sm:px-5">
          <StepFlow
            hasText={text.trim().length > 0}
            hasAnalysis={analysis !== null}
            isGenerating={generating}
            hasAudio={audio !== null}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* left: editor + analysis */}
          <div className="space-y-6 lg:col-span-7">
            <TextEditor
              text={text}
              onChange={handleTextChange}
              onAnalyze={handleAnalyze}
            />
            {analysis && (
              <AnalysisPanel
                analysis={analysis}
                isAutoDirect={settings.autoDirect}
                onApplySuggestion={() => applySuggestion(analysis)}
              />
            )}
          </div>

          {/* right: controls + voices + history */}
          <div className="space-y-6 lg:col-span-5">
            <ControlsPanel
              settings={settings}
              estimatedSeconds={estimatedSeconds}
              onChange={(patch) => setSettings((prev) => ({ ...prev, ...patch }))}
              onAutoDirectChange={handleAutoDirect}
              onGenerate={handleGenerate}
              onCancel={handleCancel}
              generating={generating}
              progress={progress}
              canGenerate={text.trim().length >= 5}
            />
            <VoicePanel
              settings={settings}
              scenePresetId={scenePresetId}
              onVoiceChange={(voiceId) => setSettings((prev) => ({ ...prev, voiceId }))}
              onEmotionChange={(emotionId) =>
                setSettings((prev) => ({ ...prev, emotionId }))
              }
              onScenePreset={handleScenePreset}
            />
            <HistoryPanel
              items={history}
              loading={history === undefined}
              onLoad={handleLoadHistory}
              onDelete={handleDeleteHistory}
            />
          </div>
        </div>

        {/* transport bar */}
        {audio && (
          <div className="mt-6">
            <AudioPlayer audio={audio} filename={filename} stale={stale} />
          </div>
        )}

        {activePreset && (
          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            Preset aktif: <span className="font-bold text-primary">{activePreset.name}</span>{" "}
            — {activePreset.description}
          </p>
        )}
      </main>
    </div>
  );
}
