"use node";

import axios from "axios";
import { v } from "convex/values";
import { action } from "./_generated/server";

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech";
const ELEVENLABS_MODEL = "eleven_multilingual_v2";
const MAX_CHARS = 5000;

/**
 * Synthesize speech via ElevenLabs. The API key lives only in this
 * server-side action (process.env.ELEVENLABS_API_KEY), never in the browser.
 * The resulting MP3 is stored in Convex file storage and returned as a URL.
 */
export const elevenlabsSpeech = action({
  args: {
    text: v.string(),
    voiceId: v.string(),
    stability: v.number(),
    similarityBoost: v.number(),
    style: v.number(),
    speakerBoost: v.boolean(),
    speed: v.number(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error(
        "API key ElevenLabs belum diisi. Tambahkan ELEVENLABS_API_KEY di tab API Keys, lalu coba lagi.",
      );
    }

    const text = args.text.trim();
    if (text.length === 0) {
      throw new Error("Teks masih kosong");
    }
    if (text.length > MAX_CHARS) {
      throw new Error(
        `Teks terlalu panjang untuk sekali generate (maks ${MAX_CHARS} karakter).`,
      );
    }

    const endpoint = `${ELEVENLABS_API_URL}/${encodeURIComponent(args.voiceId)}?output_format=mp3_44100_128`;

    let response;
    try {
      response = await axios.post(
        endpoint,
        {
          text,
          model_id: ELEVENLABS_MODEL,
          voice_settings: {
            stability: args.stability,
            similarity_boost: args.similarityBoost,
            style: args.style,
            speaker_boost: args.speakerBoost,
          },
          speed: args.speed,
        },
        {
          headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
          },
          responseType: "arraybuffer",
          timeout: 60_000,
        },
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const raw = error.response?.data as ArrayBuffer | undefined;
        const detail = extractElevenLabsDetail(raw);
        const hint =
          status === 401
            ? "API key tidak valid."
            : status === 402
              ? "Paket ElevenLabs tidak mendukung aksi ini (free tier tidak bisa memakai suara library lewat API). Upgrade ke paket Starter atau gunakan voice clone sendiri."
              : status === 422
                ? "Parameter/teks ditolak (mungkin melebihi batas akun)."
                : "Permintaan ditolak oleh ElevenLabs.";
        const detailSuffix = detail ? ` — ${detail}` : "";
        throw new Error(
          `ElevenLabs gagal (${status ?? "jaringan"}): ${hint}${detailSuffix}`,
        );
      }
      throw error;
    }

    const bytes = new Uint8Array(response.data as ArrayBuffer);
    const blob = new Blob([bytes], { type: "audio/mpeg" });
    const storageId = await ctx.storage.store(blob);
    const url = await ctx.storage.getUrl(storageId);
    if (!url) {
      throw new Error("Gagal menyimpan audio hasil generate.");
    }

    return { url, mimeType: "audio/mpeg", format: "mp3" as const };
  },
});

const GOOGLE_TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";
const GOOGLE_MAX_CHARS = 4500;

/**
 * Synthesize speech via Google Cloud Text-to-Speech (free tier friendly).
 * The API key lives only here (process.env.GOOGLE_TTS_API_KEY). The MP3 is
 * stored in Convex file storage and returned as a URL.
 */
export const googleTtsSpeech = action({
  args: {
    text: v.string(),
    voiceName: v.string(),
    languageCode: v.string(),
    speakingRate: v.number(),
    pitch: v.number(),
    volumeGainDb: v.number(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.GOOGLE_TTS_API_KEY;
    if (!apiKey) {
      throw new Error(
        "API key Google TTS belum diisi. Tambahkan GOOGLE_TTS_API_KEY di tab API Keys, lalu coba lagi.",
      );
    }

    const text = args.text.trim();
    if (text.length === 0) {
      throw new Error("Teks masih kosong");
    }
    if (text.length > GOOGLE_MAX_CHARS) {
      throw new Error(
        `Teks terlalu panjang untuk sekali generate (maks ${GOOGLE_MAX_CHARS} karakter).`,
      );
    }

    let response;
    try {
      response = await axios.post(
        GOOGLE_TTS_URL,
        {
          input: { text },
          voice: {
            languageCode: args.languageCode,
            name: args.voiceName,
          },
          audioConfig: {
            audioEncoding: "MP3",
            speakingRate: args.speakingRate,
            pitch: args.pitch,
            volumeGainDb: args.volumeGainDb,
          },
        },
        {
          headers: {
            "X-Goog-Api-Key": apiKey,
            "Content-Type": "application/json",
          },
          timeout: 60_000,
        },
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const detail = extractGoogleDetail(error.response?.data);
        const hint =
          status === 403
            ? "Akses ditolak. Pastikan API \"Cloud Text-to-Speech\" sudah diaktifkan dan billing project sudah dinyalakan (free tier tetap gratis)."
            : status === 400
              ? "Permintaan ditolak (cek voice/parameter)."
              : "Permintaan ditolak oleh Google.";
        const detailSuffix = detail ? ` — ${detail}` : "";
        throw new Error(
          `Google TTS gagal (${status ?? "jaringan"}): ${hint}${detailSuffix}`,
        );
      }
      throw error;
    }

    const audioContent = (response.data as { audioContent?: string })
      .audioContent;
    if (!audioContent) {
      throw new Error("Google TTS tidak mengembalikan audio.");
    }

    const bytes = Buffer.from(audioContent, "base64");
    const blob = new Blob([new Uint8Array(bytes)], { type: "audio/mpeg" });
    const storageId = await ctx.storage.store(blob);
    const url = await ctx.storage.getUrl(storageId);
    if (!url) {
      throw new Error("Gagal menyimpan audio hasil generate.");
    }

    return { url, mimeType: "audio/mpeg", format: "mp3" as const };
  },
});

/** Pull a readable message out of a Google error body (JSON or plain). */
function extractGoogleDetail(raw: unknown): string {
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as { error?: { message?: string } };
      return parsed.error?.message ?? raw.slice(0, 300);
    } catch {
      return raw.slice(0, 300);
    }
  }
  if (raw && typeof raw === "object") {
    const err = (raw as { error?: { message?: string } }).error;
    if (typeof err?.message === "string") return err.message;
  }
  return "";
}

/** Pull a readable message out of an ElevenLabs error body (JSON or plain). */
function extractElevenLabsDetail(raw: ArrayBuffer | undefined): string {
  if (!raw) return "";
  const text = Buffer.from(raw).toString("utf8").slice(0, 1000);
  try {
    const parsed = JSON.parse(text) as {
      detail?: string | { message?: string };
      message?: string;
    };
    if (typeof parsed.detail === "string") return parsed.detail;
    if (typeof parsed.detail?.message === "string") return parsed.detail.message;
    if (typeof parsed.message === "string") return parsed.message;
    return text;
  } catch {
    return text.trim();
  }
}
