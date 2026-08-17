/**
 * PSvoice — core types for the modular voice engine architecture.
 *
 * The `VoiceEngine` interface is the contract every voice provider implements
 * (the built-in offline demo engine, and later real TTS providers such as
 * ElevenLabs, OpenAI, Google Cloud TTS, etc.). The UI only talks to the engine
 * through this interface, so providers can be added or swapped without
 * touching any component.
 */

export type Gender = "male" | "female";

export type VoiceStyle =
  | "professional"
  | "casual"
  | "deep"
  | "energetic"
  | "storyteller"
  | "ad"
  | "warm";

export type AgeRange = "young" | "adult" | "mature";

export interface VoiceTraits {
  /** Base pitch in Hz at neutral settings. */
  basePitch: number;
  /** Baseline speaking rate in words per minute. */
  rate: number;
  /** Voice brightness 0..1 (formant energy / clarity). */
  brightness: number;
  /** Breathiness 0..1 (amount of air noise). */
  breathiness: number;
  /** Overall energy 0..1. */
  energy: number;
}

export interface VoicePreset {
  id: string;
  name: string;
  gender: Gender;
  style: VoiceStyle;
  age: AgeRange;
  tagline: string;
  traits: VoiceTraits;
}

export type ContourKind =
  | "neutral"
  | "lifted"
  | "calm"
  | "intense"
  | "dramatic"
  | "persuasive";

export interface EmotionPreset {
  id: string;
  name: string;
  description: string;
  /** Pitch offset in semitones. */
  pitchDelta: number;
  /** Rate multiplier on top of the speed setting. */
  rateDelta: number;
  brightnessDelta: number;
  energyDelta: number;
  breathDelta: number;
  contour: ContourKind;
}

export interface ScenePreset {
  id: string;
  name: string;
  description: string;
  emotionId: string;
  speed: number;
  pitch: number;
  intonation: number;
  volume: number;
  pause: number;
  suggestedVoiceId: string;
}

export interface SynthesisSettings {
  voiceId: string;
  emotionId: string;
  /** 0..100 — how much the melody/intonation varies. */
  intonation: number;
  /** -50..50 — manual pitch shift. */
  pitch: number;
  /** 0.5..1.6 — speaking speed multiplier. */
  speed: number;
  /** 0..100 — master volume. */
  volume: number;
  /** 0..100 — extra pause length between sentences. */
  pause: number;
  /** AI Auto Direct: engine picks the best settings from the text. */
  autoDirect: boolean;
}

export type HighlightKind = "question" | "exclamation" | "emphasis" | "pause";

export interface AnalysisHighlight {
  start: number;
  end: number;
  kind: HighlightKind;
  label: string;
}

export type SentenceKind = "statement" | "question" | "exclamation";

export interface SentenceInsight {
  index: number;
  text: string;
  kind: SentenceKind;
  wordCount: number;
  /** Approximate melodic profile the engine should use. */
  pitchProfile: "fall" | "rise" | "flat";
}

export interface AnalysisResult {
  charCount: number;
  wordCount: number;
  sentenceCount: number;
  questions: number;
  exclamations: number;
  pausesDetected: number;
  emphasisCount: number;
  highlights: AnalysisHighlight[];
  sentences: SentenceInsight[];
  dominantEmotionId: string;
  emotionScores: Record<string, number>;
  /** Best settings the AI suggests for this text. */
  suggestion: {
    emotionId: string;
    pitch: number;
    speed: number;
    intonation: number;
    volume: number;
    pause: number;
    reason: string;
  };
  /** Estimated duration in seconds at neutral/default settings. */
  estimatedDurationSec: number;
}

export interface SynthesizedAudio {
  blob: Blob;
  objectUrl: string;
  mimeType: string;
  durationSec: number;
  format: "mp3" | "wav";
  engineId: string;
}

export interface CancelSignal {
  cancelled: boolean;
}

export interface VoiceEngine {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  /** True if the engine needs a network request / API key. */
  readonly requiresNetwork: boolean;
  readonly format: "mp3" | "wav";

  /** Runs the "AI Analyze" pass over the text (deterministic, offline). */
  analyze(text: string): AnalysisResult;

  /** Estimate duration in seconds for a text + settings. */
  estimateDurationSec(text: string, settings: SynthesisSettings): number;

  /** Render the voiceover. Returns a playable, downloadable blob. */
  synthesize(
    text: string,
    settings: SynthesisSettings,
    onProgress?: (progress: number) => void,
    signal?: CancelSignal,
  ): Promise<SynthesizedAudio>;

  dispose(): void;
}
