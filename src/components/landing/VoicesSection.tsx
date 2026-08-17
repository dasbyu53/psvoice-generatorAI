import { motion } from "framer-motion";
import { Mic2 } from "lucide-react";
import { VOICES } from "@/lib/voice/presets";

const STYLE_LABEL: Record<string, string> = {
  professional: "Profesional",
  casual: "Santai",
  deep: "Deep",
  energetic: "Energik",
  storyteller: "Storyteller",
  ad: "Iklan",
  warm: "Hangat",
};

export function VoicesSection() {
  return (
    <section id="suara" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Katalog suara
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Pria, wanita, muda, dewasa, dan segala gaya
          </h2>
          <p className="mt-4 text-muted-foreground">
            Dari deep narrator hingga voice iklan yang energik — semua berbicara
            Bahasa Indonesia dengan logat yang natural.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {VOICES.map((voice, i) => (
            <motion.div
              key={voice.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: (i % 4) * 0.06 }}
              className="group flex items-start gap-3.5 rounded-2xl border border-border/70 bg-card/50 p-4 transition-colors hover:border-primary/40 hover:bg-card"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/25 to-orange-500/25 text-primary">
                <Mic2 className="size-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{voice.name}</span>
                  <span className="rounded-full border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {voice.gender === "male" ? "Pria" : "Wanita"} ·{" "}
                    {STYLE_LABEL[voice.style]}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {voice.tagline}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
