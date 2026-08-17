import { demoEngine } from "./demo-engine";
import { elevenLabsEngine } from "./elevenlabs-engine";
import { googleTtsEngine } from "./google-engine";
import type { VoiceEngine } from "./types";

/**
 * Registry of available voice engines.
 *
 * To add another TTS provider later (OpenAI, Google Cloud TTS, …):
 *   1. Create `src/lib/voice/<provider>-engine.ts` implementing `VoiceEngine`
 *      (synthesize calls the provider API and returns an MP3 blob).
 *   2. Push it here.
 *   3. The studio UI automatically gains a "engine" selector — no component
 *      changes needed.
 */
const REGISTRY: VoiceEngine[] = [demoEngine, elevenLabsEngine, googleTtsEngine];

export function getEngines(): VoiceEngine[] {
  return REGISTRY;
}

export function getEngine(id: string): VoiceEngine {
  return REGISTRY.find((e) => e.id === id) ?? demoEngine;
}
