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
 * Google Cloud Text-to-Speech engine (free tier friendly).
 *
 * Audio is synthesized server-side through a Convex action
 * (src/convex/tts.ts) so the API key never touches the browser. The action
 * stores the MP3 in Convex file storage and returns a URL, which this engine
 * fetches into a playable, downloadable blob.
 *
 * Google's free Indonesian catalog has four neural (WaveNet) voices
 * (A/B/C/D). Higher-quality "Chirp3 HD" voices can be swapped in by editing
 * GOOGLE_VOICE_MAP — e.g. "id-ID-Chirp3-HD-Aoede".
 */

export interface GoogleTtsSpeechRequest {
  text: string;
  voiceName: string;
  languageCode: string;
  speakingRate: number;
  pitch: number;
  volumeGainDb: number;
}

export type GoogleTtsTransport = (
  request: GoogleTtsSpeechRequest,
) => Promise<{ url: string; mimeType: string; format: "mp3" }>;

/** PSvoice voice id → Google TTS voice name (id-ID). */
const GOOGLE_VOICE_MAP: Record<string, string> = {
  arka: "id-ID-Wavenet-C", // male, deeper
  bagas: "id-ID-Wavenet-B", // male
  sari: "id-ID-Wavenet-A", // female
  dewi: "id-ID-Wavenet-D", // female
  rendra: "id-ID-Wavenet-B", // male
  maya: "id-ID-Wavenet-A", // female
  prabu: "id-ID-Wavenet-C", // male, deeper
  laras: "id-ID-Wavenet-D", // female
  doni: "id-ID-Wavenet-B", // male
  kevin: "id-ID-Wavenet-C", // male
  citra: "id-ID-Wavenet-A", // female
  anggun: "id-ID-Wavenet-D", // female
};

const DEFAULT_GOOGLE_VOICE = "id-ID-Wavenet-A";

const clamp = (min: number, max: number, value: number) =>
  Math.max(min, Math.min(max, value));

export class GoogleTtsVoiceEngine implements VoiceEngine {
  readonly id = "google-tts";
  readonly name = "Google TTS (Gratis)";
  readonly description =
    "Suara neural Bahasa Indonesia via Google Cloud Text-to-Speech — free tier, butuh API key GOOGLE_TTS_API_KEY.";
  readonly requiresNetwork = true;
  readonly format = "mp3" as const;

  private transport: GoogleTtsTransport | null = null;

  /** Studio attaches the Convex action that performs the actual request. */
  setTransport(transport: GoogleTtsTransport): void {
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
        "Engine Google TTS belum siap. Muat ulang halaman dan coba lagi.",
      );
    }

    const trimmed = text.trim();
    const emotion = getEmotion(settings.emotionId);
    const voiceName =
      GOOGLE_VOICE_MAP[settings.voiceId] ?? DEFAULT_GOOGLE_VOICE;

    // Google ranges: speakingRate 0.25..4, pitch -20..20 semitones,
    // volumeGainDb -96..16.
    const speakingRate = clamp(0.25, 4, settings.speed * emotion.rateDelta);
    const pitch = clamp(
      -15,
      15,
      settings.pitch / 4 + emotion.pitchDelta * 0.5,
    );
    const volumeGainDb = clamp(-10, 6, (settings.volume - 85) * 0.15);

    onProgress?.(0.1);
    const result = await this.transport({
      text: trimmed,
      voiceName,
      languageCode: "id-ID",
      speakingRate,
      pitch,
      volumeGainDb,
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

export const googleTtsEngine = new GoogleTtsVoiceEngine();
