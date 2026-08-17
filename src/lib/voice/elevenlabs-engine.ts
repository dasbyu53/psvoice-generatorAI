import { analyzeText, estimateDurationSec } from "./analysis";
import { DemoEngineCancelledError } from "./demo-engine";
import { getEmotion, getVoice } from "./presets";
import type {
  AnalysisResult,
  CancelSignal,
  SynthesizedAudio,
  SynthesisSettings,
  VoiceEngine,
} from "./types";

/**
 * ElevenLabs TTS engine.
 *
 * Audio is synthesized server-side through a Convex action
 * (src/convex/tts.ts) so the API key never touches the browser. The action
 * stores the MP3 in Convex file storage and returns a URL, which this engine
 * fetches into a playable, downloadable blob.
 *
 * Voices: every PSvoice "cast member" maps to a fixed ElevenLabs premade
 * voice id, so the same voice always renders with the same character —
 * multi-scene projects stay consistent.
 */

export interface ElevenLabsSpeechRequest {
  text: string;
  /** ElevenLabs voice id (not the PSvoice id). */
  voiceId: string;
  stability: number;
  similarityBoost: number;
  style: number;
  speakerBoost: boolean;
  speed: number;
}

export type ElevenLabsTransport = (
  request: ElevenLabsSpeechRequest,
) => Promise<{ url: string; mimeType: string; format: "mp3" }>;

/** PSvoice voice id → ElevenLabs premade voice id. Feel free to swap voices. */
const ELEVENLABS_VOICE_MAP: Record<string, string> = {
  arka: "ErXwobaYiN019PkySvjV", // Antoni — deep male narrator
  bagas: "jBpfuIE2acO8UUC6RXG", // Samyo — young energetic male
  sari: "21m00Tcm4TlvDq8ikWAM", // Rachel — female professional
  dewi: "EXAVITQu4vr4xnSDxMaL", // Bella — young female casual
  rendra: "N2lVS1w4EtoT3dr4eOWO", // Callum — male storyteller
  maya: "XB0fDUnXU5powFXDhCwa", // Charlotte — female storyteller
  prabu: "VR6AewLTigWG4xSOukaG", // Arnold — deep mature male
  laras: "oWAxZDx7w5VEj9dCyTzz", // Grace — warm female
  doni: "TxGEqnHWrfWFTfGW9XjX", // Josh — casual male
  kevin: "RRE5jqKvZxZmEwLc5yME", // Dan — energetic ad male
  citra: "MF3mGyEYCl7XYWbV9V6O", // Elli — young bright female
  anggun: "jsCqWAovK2LkecY7zXl4", // Freya — elegant female
};

const DEFAULT_ELEVENLABS_VOICE = "21m00Tcm4TlvDq8ikWAM";

/** PSvoice emotion contour → ElevenLabs style (0..1). */
const STYLE_BY_CONTOUR: Record<string, number> = {
  neutral: 0.25,
  lifted: 0.55,
  calm: 0.12,
  intense: 0.7,
  dramatic: 0.8,
  persuasive: 0.6,
};

const clamp = (min: number, max: number, value: number) =>
  Math.max(min, Math.min(max, value));

export class ElevenLabsVoiceEngine implements VoiceEngine {
  readonly id = "elevenlabs";
  readonly name = "ElevenLabs AI";
  readonly description =
    "Suara AI natural Bahasa Indonesia via ElevenLabs — butuh API key ELEVENLABS_API_KEY.";
  readonly requiresNetwork = true;
  readonly format = "mp3" as const;

  private transport: ElevenLabsTransport | null = null;

  /** Studio attaches the Convex action that performs the actual request. */
  setTransport(transport: ElevenLabsTransport): void {
    this.transport = transport;
  }

  analyze(text: string): AnalysisResult {
    return analyzeText(text);
  }

  estimateDurationSec(text: string, settings: SynthesisSettings): number {
    return estimateDurationSec(text, settings);
  }

  dispose(): void {
    // Nothing to clean up — the transport is owned by the Studio page.
  }

  async synthesize(
    text: string,
    settings: SynthesisSettings,
    onProgress?: (progress: number) => void,
    signal?: CancelSignal,
  ): Promise<SynthesizedAudio> {
    if (signal?.cancelled) {
      throw new DemoEngineCancelledError();
    }
    if (!this.transport) {
      throw new Error(
        "Engine ElevenLabs belum siap. Muat ulang halaman dan coba lagi.",
      );
    }

    const trimmed = text.trim();
    const voice = getVoice(settings.voiceId);
    const emotion = getEmotion(settings.emotionId);

    const elevenVoiceId =
      ELEVENLABS_VOICE_MAP[settings.voiceId] ?? DEFAULT_ELEVENLABS_VOICE;
    // Higher intonation → lower stability (more melodic variation).
    const stability = clamp(0.2, 0.65, 0.6 - (settings.intonation / 100) * 0.35);
    const style = STYLE_BY_CONTOUR[emotion.contour] ?? 0.3;
    const speed = clamp(0.5, 2, settings.speed * emotion.rateDelta);

    onProgress?.(0.1);
    const result = await this.transport({
      text: trimmed,
      voiceId: elevenVoiceId,
      stability,
      similarityBoost: 0.78,
      style,
      speakerBoost: true,
      speed,
    });
    onProgress?.(0.7);

    if (signal?.cancelled) {
      throw new DemoEngineCancelledError();
    }

    const blob = await (await fetch(result.url)).blob();
    const objectUrl =
      typeof URL !== "undefined" && typeof URL.createObjectURL === "function"
        ? URL.createObjectURL(blob)
        : "";
    onProgress?.(0.95);

    return {
      blob,
      objectUrl,
      mimeType: blob.type || result.mimeType || "audio/mpeg",
      durationSec: estimateDurationSec(trimmed, settings),
      format: "mp3",
      engineId: this.id,
    };
  }
}

export const elevenLabsEngine = new ElevenLabsVoiceEngine();
