import { motion } from "framer-motion";
import {
  Clapperboard,
  Crown,
  Film,
  Megaphone,
  Music,
  PlaySquare,
  Radio,
} from "lucide-react";
import { SCENE_PRESETS } from "@/lib/voice/presets";

const PRESET_ICONS: Record<string, typeof Megaphone> = {
  advertisement: Megaphone,
  tiktok: Music,
  youtube: PlaySquare,
  storytelling: Radio,
  documentary: Clapperboard,
  cinematic: Film,
  luxury: Crown,
};

export function PresetsSection() {
  return (
    <section id="preset" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Preset scene
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Mulai dari preset yang tepat
          </h2>
          <p className="mt-4 text-muted-foreground">
            Setiap preset mengatur suara, emosi, kecepatan, dan jeda untuk
            kebutuhan spesifik Anda.
          </p>
        </motion.div>

        <div className="mt-14 flex flex-wrap justify-center gap-3">
          {SCENE_PRESETS.map((preset, i) => {
            const Icon = PRESET_ICONS[preset.id] ?? Megaphone;
            return (
              <motion.div
                key={preset.id}
                initial={{ opacity: 0, scale: 0.94 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className="flex cursor-default items-center gap-3 rounded-2xl border border-border/70 bg-card/50 px-4 py-3 transition-colors hover:border-primary/40 hover:bg-card"
              >
                <Icon className="size-5 text-primary" />
                <div>
                  <div className="text-sm font-bold">{preset.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {preset.description}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
