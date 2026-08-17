import { hashString } from "./hash";
import { DEFAULT_SETTINGS, EMOTIONS, getEmotion, getVoice } from "./presets";
import type {
  AnalysisHighlight,
  AnalysisResult,
  SentenceInsight,
  SynthesisSettings,
} from "./types";

/** Indonesian keyword lexicon per emotion — used by the AI analyze pass. */
const EMOTION_LEXICON: Record<string, string[]> = {
  happy: [
    "senang", "hebat", "luar biasa", "selamat", "bahagia", "ceria", "menang",
    "sukses", "terima kasih", "wow", "seru", "indah", "bangga", "meriah",
  ],
  excited: [
    "ayo", "cepat", "sekarang", "dahsyat", "mantap", "gas", "cuan", "viral",
    "heboh", "menakjubkan", "wow", "keren", "gilaa",
  ],
  calm: [
    "tenang", "damai", "santai", "nyaman", "rileks", "pelan", "hening",
    "lembut", "sunyi", "sejuk", "nikmati",
  ],
  friendly: [
    "teman", "sahabat", "halo", "hai", "kita", "bareng", "ngobrol", "guys",
    "kawan", "jangan khawatir",
  ],
  serious: [
    "penting", "serius", "kritis", "mendesak", "wajib", "resmi", "darurat",
    "ancaman", "bahaya", "kewajiban", "hukum", "fatal", "perhatian",
  ],
  dramatic: [
    "malam", "gelap", "misteri", "tiba-tiba", "rahasia", "takut", "menakutkan",
    "diam", "bayangan", "gema", "terakhir", "selamanya", "hilang", "bisikan",
  ],
  persuasive: [
    "beli", "hemat", "diskon", "promo", "gratis", "terbatas", "kesempatan",
    "jangan lewatkan", "sekarang juga", "murah", "spesial", "eksklusif",
    "penawaran", "garansi", "hanya",
  ],
  professional: [
    "resmi", "laporan", "data", "hasil", "perusahaan", "produk", "layanan",
    "solusi", "sistem", "tim", "klien", "analisis", "strategi", "target",
    "kualitas", "efisien",
  ],
  sedih: [
    "sedih", "kehilangan", "pilu", "rindu", "menangis", "perih", "duka",
    "sendiri", "hancur", "berat", "air mata",
  ],
  misterius: [
    "misteri", "tersembunyi", "aneh", "tak dikenal", "teka-teki", "hantu",
    "lorong", "lorong", "jauh di sana",
  ],
};

const SENTENCE_RE = /[^.!?…]+[.!?…]*/g;
const ELLIPSIS_RE = /…|\.\.\./g;
const COMMA_RE = /,/g;
const QUESTION_RE = /[?？]/g;
const EXCLAMATION_RE = /[!！]/g;
const QUOTE_RE = /[""“”'‘’«»„][^""“”'‘’«»„]*[""“”'‘’«»„]/g;
const CAPS_RE = /\b[A-Z][A-ZÀ-Ỹ]{1,}\b/g;

function countMatches(text: string, re: RegExp): number {
  return (text.match(re) ?? []).length;
}

/** Split into sentences, keeping each sentence's char span in the original text. */
function splitSentences(text: string): { index: number; text: string; start: number }[] {
  const sentences: { index: number; text: string; start: number }[] = [];
  let match: RegExpExecArray | null;
  SENTENCE_RE.lastIndex = 0;
  while ((match = SENTENCE_RE.exec(text)) !== null) {
    const sentence = match[0].trim();
    if (sentence.length === 0) continue;
    sentences.push({ index: sentences.length, text: sentence, start: match.index });
  }
  return sentences;
}

function classifySentence(sentence: string): SentenceInsight["kind"] {
  if (QUESTION_RE.test(sentence)) return "question";
  if (EXCLAMATION_RE.test(sentence)) return "exclamation";
  return "statement";
}

function sentenceWords(sentence: string): string[] {
  return sentence
    .toLowerCase()
    .replace(/[^a-zà-ỹ0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function wordCount(text: string): number {
  const words = text
    .trim()
    .replace(/[^a-zA-Zà-ỹ0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  return words.length;
}

/**
 * Estimate duration (seconds) for a text + settings. Shared by the UI
 * (live estimate) and the engine (pre-render estimate).
 */
export function estimateDurationSec(text: string, settings: SynthesisSettings): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  const words = wordCount(trimmed);
  const sentences = splitSentences(trimmed);
  const voice = getVoice(settings.voiceId);
  const emotion = getEmotion(settings.emotionId);

  const rateMult = settings.speed * emotion.rateDelta * (voice.traits.rate / 165);
  // ~2.6 syllables per Indonesian word, ~0.155s per syllable at baseline.
  const speechSec = (words * 2.6 * 0.155) / Math.max(rateMult, 0.25);

  const commas = countMatches(trimmed, COMMA_RE);
  const ellipses = countMatches(trimmed, ELLIPSIS_RE);
  const sentencePause = sentences.length * (0.35 + (settings.pause / 100) * 1.0);
  const microPauses = commas * 0.14 + ellipses * 0.38;
  const breathRoom = speechSec * 0.045;

  return Math.max(1, Math.round((speechSec + sentencePause + microPauses + breathRoom) * 10) / 10);
}

/**
 * The "AI Analyze" pass — reads the text, detects punctuation, emphasis,
 * questions, pauses and emotional keywords, then suggests the best settings.
 * Deterministic and offline so the whole flow works in the demo.
 */
export function analyzeText(text: string): AnalysisResult {
  const trimmed = text.trim();
  const words = wordCount(trimmed);
  const sentences = splitSentences(trimmed);
  const charCount = trimmed.length;
  const questions = countMatches(trimmed, QUESTION_RE);
  const exclamations = countMatches(trimmed, EXCLAMATION_RE);
  const commas = countMatches(trimmed, COMMA_RE);
  const ellipses = countMatches(trimmed, ELLIPSIS_RE);

  // --- highlights (absolute char offsets into the original text) ---
  const highlights: AnalysisHighlight[] = [];
  const push = (start: number, end: number, kind: AnalysisHighlight["kind"], label: string) => {
    if (start >= end) return;
    highlights.push({ start, end, kind, label });
  };

  for (const s of sentences) {
    const kind = classifySentence(s.text);
    const start = trimmed.indexOf(s.text, s.start);
    const end = start + s.text.length;
    if (kind === "question") push(start, end, "question", "Kalimat tanya");
    else if (kind === "exclamation") push(start, end, "exclamation", "Penekanan kuat");
  }

  let match: RegExpExecArray | null;
  QUOTE_RE.lastIndex = 0;
  while ((match = QUOTE_RE.exec(trimmed)) !== null) {
    push(match.index, match.index + match[0].length, "emphasis", "Kata ditegaskan");
  }
  CAPS_RE.lastIndex = 0;
  while ((match = CAPS_RE.exec(trimmed)) !== null) {
    push(match.index, match.index + match[0].length, "emphasis", "Kata ditegaskan");
  }
  ELLIPSIS_RE.lastIndex = 0;
  while ((match = ELLIPSIS_RE.exec(trimmed)) !== null) {
    push(match.index, match.index + match[0].length, "pause", "Jeda panjang");
  }

  highlights.sort((a, b) => a.start - b.start);

  // --- emotion scoring ---
  const lower = trimmed.toLowerCase();
  const emotionScores: Record<string, number> = {};
  for (const emotion of EMOTIONS) {
    let score = 0;
    for (const keyword of EMOTION_LEXICON[emotion.id] ?? []) {
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      score += countMatches(lower, new RegExp(`\\b${escaped}\\b`, "g")) * 1.5;
    }
    emotionScores[emotion.id] = score;
  }
  if (exclamations > 0) {
    emotionScores.excited = (emotionScores.excited ?? 0) + 0.8 * exclamations;
    emotionScores.happy = (emotionScores.happy ?? 0) + 0.4 * exclamations;
  }
  if (questions > 0) {
    emotionScores.friendly = (emotionScores.friendly ?? 0) + 0.3 * questions;
    emotionScores.misterius = (emotionScores.misterius ?? 0) + 0.2 * questions;
  }
  if (commas > 0) {
    emotionScores.professional = (emotionScores.professional ?? 0) + 0.1 * Math.min(commas, 6);
  }
  if (ellipses > 0) {
    emotionScores.dramatic = (emotionScores.dramatic ?? 0) + 0.5 * ellipses;
    emotionScores.misterius = (emotionScores.misterius ?? 0) + 0.4 * ellipses;
  }

  let dominantEmotionId = "natural";
  let best = 0;
  for (const emotion of EMOTIONS) {
    const score = emotionScores[emotion.id] ?? 0;
    if (score > best) {
      best = score;
      dominantEmotionId = emotion.id;
    }
  }
  // Tie-break: prefer non-natural when everything is 0 but the text has strong cues.
  if (best === 0) {
    if (exclamations > 0) dominantEmotionId = "excited";
    else if (questions >= 3) dominantEmotionId = "friendly";
  }

  // --- suggestions ---
  const base: Record<string, { pitch: number; speed: number; intonation: number; pause: number }> = {
    natural: { pitch: 0, speed: 1, intonation: 55, pause: 35 },
    happy: { pitch: 8, speed: 1.08, intonation: 70, pause: 30 },
    excited: { pitch: 12, speed: 1.18, intonation: 80, pause: 20 },
    calm: { pitch: -8, speed: 0.92, intonation: 45, pause: 55 },
    friendly: { pitch: 3, speed: 1.05, intonation: 65, pause: 40 },
    serious: { pitch: -5, speed: 0.95, intonation: 48, pause: 50 },
    dramatic: { pitch: 4, speed: 0.9, intonation: 82, pause: 70 },
    persuasive: { pitch: 6, speed: 1.1, intonation: 72, pause: 30 },
    professional: { pitch: -2, speed: 0.98, intonation: 50, pause: 45 },
    sedih: { pitch: -10, speed: 0.86, intonation: 55, pause: 65 },
    misterius: { pitch: -6, speed: 0.9, intonation: 78, pause: 72 },
  };
  const b = base[dominantEmotionId] ?? base.natural;

  // Deterministic micro-jitter so Auto Direct feels adaptive to each text.
  const jitter = ((hashString(trimmed) % 7) - 3) * 0.4; // -1.2 .. +1.2

  const suggestion = {
    emotionId: dominantEmotionId,
    pitch: Math.max(-50, Math.min(50, b.pitch + (questions > 0 ? 2 : 0) + (exclamations > 0 ? 2 : 0))),
    speed: Math.max(0.7, Math.min(1.4, b.speed + (commas >= 6 ? -0.04 : 0) + (sentences.length > 4 ? 0.03 : 0) + jitter * 0.03)),
    intonation: Math.max(30, Math.min(95, b.intonation + (highlights.length > 0 ? 5 : 0))),
    volume: 85,
    pause: Math.max(10, Math.min(85, b.pause)),
    reason: buildReason(dominantEmotionId, questions, exclamations, ellipses, highlights.length, best),
  };

  // --- per-sentence insights ---
  const sentenceInsights: SentenceInsight[] = sentences.map((s, i) => {
    const kind = classifySentence(s.text);
    const pitchProfile: SentenceInsight["pitchProfile"] =
      kind === "question" ? "rise" : kind === "exclamation" ? "fall" : "fall";
    return {
      index: i,
      text: s.text,
      kind,
      wordCount: sentenceWords(s.text).length,
      pitchProfile,
    };
  });

  return {
    charCount,
    wordCount: words,
    sentenceCount: sentences.length,
    questions,
    exclamations,
    pausesDetected: commas + ellipses,
    emphasisCount: highlights.filter((h) => h.kind === "emphasis").length,
    highlights,
    sentences: sentenceInsights,
    dominantEmotionId,
    emotionScores,
    suggestion,
    estimatedDurationSec: estimateDurationSec(trimmed, DEFAULT_SETTINGS),
  };
}

function buildReason(
  emotion: string,
  questions: number,
  exclamations: number,
  ellipses: number,
  emphasis: number,
  score: number,
): string {
  const parts: string[] = [];
  const emotionName = getEmotion(emotion).name;
  if (score > 0) parts.push(`ditemukan kata-kata bermuatan emosi ${emotionName.toLowerCase()}`);
  if (questions > 0) parts.push(`${questions} kalimat tanya (nada naik di akhir)`);
  if (exclamations > 0) parts.push(`${exclamations} tanda seru (energi lebih tinggi)`);
  if (ellipses > 0) parts.push(`${ellipses} jeda panjang terdeteksi`);
  if (emphasis > 0) parts.push(`${emphasis} kata perlu penekanan`);
  if (parts.length === 0) parts.push("teks dinilai netral dan mengalir");
  return `AI menganalisis teks: ${parts.join(", ")}.`;
}
