import { Mp3Encoder } from "@breezystack/lamejs";
import { analyzeText, estimateDurationSec } from "./analysis";
import { hashString, mulberry32 } from "./hash";
import { getEmotion, getVoice } from "./presets";
import type {
  AnalysisResult,
  CancelSignal,
  SynthesizedAudio,
  SynthesisSettings,
  VoiceEngine,
} from "./types";

const SAMPLE_RATE = 44100;

/** Indonesian vowel formants (F1, F2) in Hz. */
const VOWEL_FORMANTS: Record<string, { f1: number; f2: number }> = {
  a: { f1: 730, f2: 1090 },
  i: { f1: 270, f2: 2290 },
  u: { f1: 300, f2: 870 },
  e: { f1: 530, f2: 1500 },
  o: { f1: 570, f2: 840 },
};

const VOWEL_RE = /[aiueoAIUEO]/;
const DIGRAPHS = new Set(["ng", "ny", "sy", "kh", "ch", "th", "sh", "dh"]);
const NASALS = new Set(["m", "n", "ng", "ny"]);
const FRICATIVES = new Set(["s", "f", "h", "c", "sy", "z", "v", "x", "sh"]);
const PLOSIVES = new Set(["p", "t", "k", "b", "d", "g", "q", "j"]);
const LIQUIDS = new Set(["l", "r"]);
const GLIDES = new Set(["w", "y"]);

export class DemoEngineCancelledError extends Error {
  constructor() {
    super("Generation cancelled");
    this.name = "DemoEngineCancelledError";
  }
}

interface Syllable {
  onset: string;
  vowel: string;
  coda: string;
}

interface PlanToken {
  start: number; // seconds
  dur: number; // seconds
  kind: "syllable" | "gap";
  gap?: number;
  syllable?: Syllable;
  emphasis?: boolean;
  /** pitch multiplier from sentence contour + intonation */
  pitchMul: number;
  /** base frequency for this syllable (Hz) */
  f0: number;
  sentenceIndex: number;
  wordIndex: number;
}

function isVowel(ch: string): boolean {
  return VOWEL_RE.test(ch);
}

/** Rough Indonesian syllabification: (C)(C)V(C) with digraph awareness. */
function syllabifyWord(raw: string): Syllable[] {
  const word = raw.toLowerCase().replace(/[^a-zà-ỹ]/g, "");
  if (word.length === 0) return [];
  const chars = word.split("");
  const vowelIdx: number[] = [];
  chars.forEach((c, i) => {
    if (isVowel(c)) vowelIdx.push(i);
  });
  if (vowelIdx.length === 0) {
    // consonant-only token ("sst", "br") — render as a neutral hum.
    return [{ onset: word.slice(0, 2), vowel: "e", coda: "" }];
  }

  const syllables: Syllable[] = [];
  for (let vi = 0; vi < vowelIdx.length; vi++) {
    const vPos = vowelIdx[vi];
    const prevVowelPos = vi > 0 ? vowelIdx[vi - 1] : -1;
    const cons = chars.slice(prevVowelPos + 1, vPos).join("");
    const vowel = chars[vPos];
    const nextVowelPos = vi + 1 < vowelIdx.length ? vowelIdx[vi + 1] : chars.length;

    let onset = cons;
    let coda = "";
    if (vi > 0) {
      // Give a coda to the previous syllable from this run, unless the run
      // ends in a digraph (which prefers to start the next syllable).
      if (cons.length >= 2) {
        const lastTwo = cons.slice(-2);
        const lastOne = cons.slice(-1);
        if (!DIGRAPHS.has(lastTwo) && !GLIDES.has(lastOne)) {
          coda = lastOne;
          onset = cons.slice(0, -1);
        }
      }
    } else if (cons.length === 0) {
      onset = "";
    }

    // coda after the vowel (only on the final syllable of the word)
    let tail = chars.slice(vPos + 1, nextVowelPos).join("");
    if (tail.length >= 2 && DIGRAPHS.has(tail.slice(0, 2))) {
      // keep digraph as coda (e.g. "bang" -> ng)
      coda = coda || tail.slice(0, 2);
    } else if (tail.length > 0) {
      coda = coda || tail[0];
    }

    syllables.push({ onset, vowel, coda });
  }
  return syllables;
}

export class DemoVoiceEngine implements VoiceEngine {
  readonly id = "psvoice-demo";
  readonly name = "Demo Studio Engine";
  readonly description =
    "Synthesizer offline — suara demo dibangkitkan langsung di browser (Web Audio), tanpa API. Siap diganti dengan engine TTS sungguhan.";
  readonly requiresNetwork = false;
  readonly format = "mp3" as const;

  analyze(text: string): AnalysisResult {
    return analyzeText(text);
  }

  estimateDurationSec(text: string, settings: SynthesisSettings): number {
    return estimateDurationSec(text, settings);
  }

  dispose(): void {
    // Nothing to clean up — all synthesis state is local to each call.
  }

  async synthesize(
    text: string,
    settings: SynthesisSettings,
    onProgress?: (progress: number) => void,
    signal?: CancelSignal,
  ): Promise<SynthesizedAudio> {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      throw new Error("Teks masih kosong");
    }

    const analysis = analyzeText(trimmed);
    const voice = getVoice(settings.voiceId);
    const emotion = getEmotion(settings.emotionId);

    // Deterministic noise seed — same text + settings always sound identical,
    // so voices stay consistent across scenes/paragraphs.
    const rng = mulberry32(hashString(trimmed + settings.voiceId + settings.emotionId));

    const rateMult =
      settings.speed * emotion.rateDelta * (voice.traits.rate / 165);
    const baseSyllableDur = 0.155 / Math.max(rateMult, 0.25);
    const basePitch =
      voice.traits.basePitch *
      Math.pow(2, (settings.pitch + emotion.pitchDelta) / 12);
    const brightness = clamp01(voice.traits.brightness + emotion.brightnessDelta);
    const energy = clamp01(voice.traits.energy + emotion.energyDelta);
    const breath = clamp01(voice.traits.breathiness + emotion.breathDelta);
    const contour = emotion.contour;

    // --- planning pass: tokenize into timed units ---
    const emphasisPhrases = analysis.highlights
      .filter((h) => h.kind === "emphasis")
      .map((h) => trimmed.slice(h.start, h.end).toLowerCase());

    const tokens: PlanToken[] = [];
    let cursor = 0;

    const addGap = (sec: number) => {
      if (sec <= 0) return;
      tokens.push({
        start: cursor,
        dur: sec,
        kind: "gap",
        pitchMul: 1,
        f0: basePitch,
        sentenceIndex: 0,
        wordIndex: 0,
      });
      cursor += sec;
    };

    const sentences = splitIntoRawSentences(trimmed);
    for (let si = 0; si < sentences.length; si++) {
      const sentence = sentences[si];
      const kind = sentence.kind;
      const words = sentence.text.split(/(\s+)/).filter((w) => w.trim().length > 0);

      for (let wi = 0; wi < words.length; wi++) {
        const word = words[wi];
        const isWordEmphasis = emphasisPhrases.some((phrase) => word.toLowerCase().includes(phrase) || phrase.includes(word.toLowerCase()));
        const syllables = syllabifyWord(word);
        if (syllables.length === 0) continue;

        const sylCount = syllables.length;
        for (let sy = 0; sy < sylCount; sy++) {
          const syl = syllables[sy];
          const t = sylCount === 1 ? 0.5 : sy / (sylCount - 1);
          const shape = sentenceShape(kind, t, contour);
          const intonationFactor =
            1 + (shape - 1) * (0.35 + (settings.intonation / 100) * 0.65);
          const emphMul = isWordEmphasis ? 1.16 : 1;
          const dur = baseSyllableDur * (isWordEmphasis ? 1.2 : 1);
          tokens.push({
            start: cursor,
            dur,
            kind: "syllable",
            syllable: syl,
            emphasis: isWordEmphasis,
            pitchMul: intonationFactor * emphMul,
            f0: basePitch,
            sentenceIndex: si,
            wordIndex: wi,
          });
          cursor += dur;
        }

        // word gap
        const gap = 0.05 / Math.max(rateMult, 0.25);
        addGap(gap);
      }

      // sentence-end pause
      const pauseSec = 0.45 + (settings.pause / 100) * 1.0;
      const punctBonus = kind === "question" ? 0.05 : kind === "exclamation" ? 0.02 : 0;
      addGap(pauseSec + punctBonus + (sentence.hasComma ? 0.16 : 0) + (sentence.hasEllipsis ? 0.45 : 0));
    }

    if (tokens.length === 0) {
      throw new Error("Tidak ada suku kata yang bisa dibaca");
    }

    // --- render pass: additive formant synthesis ---
    const totalSec = cursor + 0.15;
    const totalSamples = Math.ceil(totalSec * SAMPLE_RATE);
    const out = new Float32Array(totalSamples);
    let lastProgress = -1;

    for (let ti = 0; ti < tokens.length; ti++) {
      if (signal?.cancelled) {
        throw new DemoEngineCancelledError();
      }
      const token = tokens[ti];
      if (token.kind === "gap") continue;
      renderSyllable(
        out,
        token,
        rng,
        brightness,
        energy,
        breath,
        contour,
      );

      if (onProgress) {
        const p = Math.min(0.99, ti / Math.max(tokens.length, 1));
        const rounded = Math.round(p * 100);
        if (rounded !== lastProgress) {
          lastProgress = rounded;
          onProgress(p);
        }
      }
    }

    // Trim trailing silence
    const actualSamples = Math.max(1, Math.min(out.length, Math.ceil(cursor * SAMPLE_RATE)));
    const pcm = out.subarray(0, actualSamples);
    const durationSec = Math.round((actualSamples / SAMPLE_RATE) * 100) / 100;

    // --- encode: MP3 (fallback WAV) ---
    const blob = encodeAudio(pcm);
    const objectUrl =
      typeof URL !== "undefined" && typeof URL.createObjectURL === "function"
        ? URL.createObjectURL(blob)
        : "";

    return {
      blob,
      objectUrl,
      mimeType: blob.type,
      durationSec,
      format: blob.type === "audio/mpeg" ? "mp3" : "wav",
      engineId: this.id,
    };
  }
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function splitIntoRawSentences(text: string): { text: string; kind: "statement" | "question" | "exclamation"; hasComma: boolean; hasEllipsis: boolean }[] {
  const parts = text.split(/(?<=[.!?…])\s+/);
  return parts
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => {
      const last = p[p.length - 1];
      const kind = last === "?" || last === "？" ? "question" : last === "!" || last === "！" ? "exclamation" : "statement";
      return { text: p, kind, hasComma: p.includes(","), hasEllipsis: p.includes("…") || p.includes("...") };
    });
}

/** Sentence-level melodic shape (0..1 across the sentence). */
function sentenceShape(kind: "statement" | "question" | "exclamation", t: number, contour: string): number {
  let shape: number;
  if (kind === "question") {
    shape = 0.98 + 0.28 * Math.pow(t, 1.4);
  } else if (kind === "exclamation") {
    shape = 1.12 - 0.18 * t;
  } else {
    shape = 1.02 - 0.14 * t;
  }
  // emotion contours adjust the overall melodic frame
  switch (contour) {
    case "lifted":
      shape = 1 + (shape - 1) * 1.15 + 0.05;
      break;
    case "calm":
      shape = 1 + (shape - 1) * 0.7;
      break;
    case "intense":
      shape = 1 + (shape - 1) * 1.3 + 0.03;
      break;
    case "dramatic":
      shape = 1 + (shape - 1) * 1.45;
      break;
    case "persuasive":
      shape = 1 + (shape - 1) * 1.2 + 0.04;
      break;
    default:
      break;
  }
  return shape;
}

function renderSyllable(
  out: Float32Array,
  token: PlanToken,
  rng: () => number,
  brightness: number,
  energy: number,
  breath: number,
  contour: string,
): void {
  const syl = token.syllable!;
  const start = Math.floor(token.start * SAMPLE_RATE);
  const dur = token.dur;
  const f0 = token.f0 * token.pitchMul;
  const onsetDur = clamp(0.04, 0.09, Math.min(dur * 0.4, 0.075));
  const vowelDur = Math.max(0.045, dur - onsetDur - (syl.coda ? Math.min(dur * 0.28, 0.06) : 0));
  const codaDur = syl.coda ? Math.min(dur * 0.28, 0.06) : 0;

  let pos = start;

  // onset consonant
  pos = renderConsonant(out, pos, syl.onset, f0, onsetDur, brightness, energy, breath, rng);

  // vowel nucleus
  pos = renderVowel(out, pos, syl.vowel, f0, vowelDur, brightness, energy, breath, rng, contour);

  // coda consonant
  renderConsonant(out, pos, syl.coda, f0 * 0.9, codaDur, brightness, energy, breath, rng);
}

function renderVowel(
  out: Float32Array,
  startSample: number,
  vowel: string,
  f0: number,
  durSec: number,
  brightness: number,
  energy: number,
  breath: number,
  rng: () => number,
  contour: string,
): number {
  const formants = VOWEL_FORMANTS[vowel] ?? VOWEL_FORMANTS.a;
  const n = Math.floor(durSec * SAMPLE_RATE);
  if (n <= 0) return startSample;
  const attack = Math.max(1, Math.floor(0.012 * SAMPLE_RATE));
  const release = Math.max(1, Math.floor(0.025 * SAMPLE_RATE));
  const vibratoDepth = 0.006 * (0.4 + energy) * (contour === "dramatic" ? 1.4 : 1);
  const a1 = 0.32 * (0.55 + 0.45 * brightness);
  const a2 = 0.2 * brightness;
  const a3 = 0.09 * brightness;
  const amp = 0.5 + 0.12 * energy;

  let phase = 0;
  const f1Ratio = formants.f1 / f0;
  const f2Ratio = formants.f2 / f0;
  const f3Ratio = 2600 / f0;

  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const vib = 1 + Math.sin(2 * Math.PI * 5.5 * t) * vibratoDepth;
    const freq = f0 * vib;
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;
    const env = envelope(i, n, attack, release);
    const voiced =
      Math.sin(phase) * 0.5 +
      Math.sin(phase * f1Ratio) * a1 +
      Math.sin(phase * f2Ratio) * a2 +
      Math.sin(phase * f3Ratio) * a3;
    const noise = (rng() * 2 - 1) * breath * 0.18;
    out[startSample + i] += (voiced * amp + noise) * env;
  }
  return startSample + n;
}

function renderConsonant(
  out: Float32Array,
  startSample: number,
  consonant: string,
  f0: number,
  durSec: number,
  brightness: number,
  energy: number,
  breath: number,
  rng: () => number,
): number {
  if (!consonant) return startSample;
  const n = Math.floor(durSec * SAMPLE_RATE);
  if (n <= 0) return startSample;

  if (NASALS.has(consonant)) {
    const attack = Math.max(1, Math.floor(0.008 * SAMPLE_RATE));
    const release = Math.max(1, Math.floor(0.02 * SAMPLE_RATE));
    let phase = 0;
    const freq = f0 * 0.55;
    for (let i = 0; i < n; i++) {
      phase += (2 * Math.PI * freq) / SAMPLE_RATE;
      const env = envelope(i, n, attack, release);
      const voiced = Math.sin(phase) * 0.3 + Math.sin(phase * 1.5) * 0.1;
      const noise = (rng() * 2 - 1) * 0.05 * breath;
      out[startSample + i] += (voiced + noise) * env * (0.55 + 0.25 * energy);
    }
    return startSample + n;
  }

  if (FRICATIVES.has(consonant)) {
    const attack = Math.max(1, Math.floor(0.005 * SAMPLE_RATE));
    const release = Math.max(1, Math.floor(0.015 * SAMPLE_RATE));
    for (let i = 0; i < n; i++) {
      const env = envelope(i, n, attack, release);
      const noise = (rng() * 2 - 1) * (0.3 + 0.2 * brightness);
      out[startSample + i] += noise * env * (0.5 + 0.3 * energy);
    }
    return startSample + n;
  }

  if (PLOSIVES.has(consonant)) {
    // sharp click + tiny gap
    const click = Math.max(1, Math.floor(0.016 * SAMPLE_RATE));
    for (let i = 0; i < click; i++) {
      const env = 1 - i / click;
      out[startSample + i] += (rng() * 2 - 1) * 0.28 * env * (0.5 + 0.4 * energy);
    }
    return startSample + n;
  }

  if (consonant === "r") {
    // light trill: two short pulses
    const pulse = Math.max(1, Math.floor(0.02 * SAMPLE_RATE));
    let phase = 0;
    for (let i = 0; i < n; i++) {
      phase += (2 * Math.PI * f0 * 1.05) / SAMPLE_RATE;
      const cycle = i % (pulse * 2);
      const env = cycle < pulse ? Math.sin((Math.PI * cycle) / pulse) : 0;
      out[startSample + i] += Math.sin(phase) * 0.16 * env;
    }
    return startSample + n;
  }

  if (LIQUIDS.has(consonant)) {
    let phase = 0;
    for (let i = 0; i < n; i++) {
      phase += (2 * Math.PI * f0 * 1.1) / SAMPLE_RATE;
      const env = envelope(i, n, 8, 12);
      out[startSample + i] += Math.sin(phase) * 0.18 * env;
    }
    return startSample + n;
  }

  if (GLIDES.has(consonant)) {
    const mul = consonant === "w" ? 0.8 : 1.3;
    let phase = 0;
    for (let i = 0; i < n; i++) {
      phase += (2 * Math.PI * f0 * mul) / SAMPLE_RATE;
      const env = envelope(i, n, 8, 14);
      out[startSample + i] += Math.sin(phase) * 0.14 * env;
    }
    return startSample + n;
  }

  return startSample + n;
}

function envelope(i: number, n: number, attack: number, release: number): number {
  if (i < attack) return i / attack;
  if (i > n - release) return Math.max(0, (n - i) / release);
  return 1;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function clamp(min: number, max: number, v: number): number {
  return Math.max(min, Math.min(max, v));
}

function toInt16(pcm: Float32Array): Int16Array {
  const out = new Int16Array(pcm.length);
  for (let i = 0; i < pcm.length; i++) {
    const s = Math.max(-1, Math.min(1, pcm[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

function encodeWav(pcm: Float32Array): Blob {
  const int16 = toInt16(pcm);
  const dataSize = int16.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);
  new Int16Array(buffer, 44, int16.length).set(int16);
  return new Blob([buffer], { type: "audio/wav" });
}

function encodeMp3(pcm: Float32Array): Blob | null {
  try {
    const encoder = new Mp3Encoder(1, SAMPLE_RATE, 128);
    const samples = toInt16(pcm);
    const chunks: Uint8Array[] = [];
    const blockSize = 1152;
    for (let i = 0; i < samples.length; i += blockSize) {
      const chunk = samples.subarray(i, i + blockSize);
      const encoded = encoder.encodeBuffer(chunk);
      if (encoded.length > 0) chunks.push(encoded);
    }
    const tail = encoder.flush();
    if (tail.length > 0) chunks.push(tail);
    if (chunks.length === 0) return null;
    // Copy each chunk so TS/Blob accept the buffers (lamejs returns shared views).
    const parts = chunks.map((c) => c.slice().buffer as ArrayBuffer);
    return new Blob(parts as BlobPart[], { type: "audio/mpeg" });
  } catch (error) {
    console.warn("[PSvoice] MP3 encoding failed, falling back to WAV:", error);
    return null;
  }
}

function encodeAudio(pcm: Float32Array): Blob {
  const mp3 = encodeMp3(pcm);
  if (mp3) return mp3;
  return encodeWav(pcm);
}

export const demoEngine: VoiceEngine = new DemoVoiceEngine();
