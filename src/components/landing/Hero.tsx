import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { ArrowRight, AudioWaveform, Download, Play, Sparkles } from "lucide-react";
import { useNavigate } from "react-router";

const EQ_BARS = [0.35, 0.7, 1, 0.5, 0.85, 0.4, 0.95, 0.6, 0.3, 0.75, 0.5, 0.9];

const STATS = [
  { value: "12+", label: "Suara Indonesia" },
  { value: "11", label: "Emosi & ekspresi" },
  { value: "7", label: "Preset siap pakai" },
  { value: "MP3", label: "Preview + download" },
];

export function Hero() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const studioHref = isAuthenticated ? "/studio" : "/auth?returnTo=/studio";

  return (
    <section className="relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-24">
      {/* ambient glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,color-mix(in_oklch,var(--primary)_16%,transparent),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-[-10%] -z-10 size-[32rem] rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--primary)_12%,transparent),transparent_65%)] blur-2xl"
      />

      <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
        {/* copy */}
        <div className="text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-semibold text-muted-foreground"
          >
            <Sparkles className="size-3.5 text-primary" />
            Smart AI Voiceover Generator — Bahasa Indonesia
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl"
          >
            Ubah teks jadi{" "}
            <span className="bg-gradient-to-r from-amber-300 via-primary to-orange-400 bg-clip-text text-transparent">
              suara yang hidup
            </span>{" "}
            dalam Bahasa Indonesia
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="mx-auto mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg lg:mx-0"
          >
            PSvoice membaca dan menganalisis teks Anda — mendeteksi tanda baca,
            kalimat tanya, penekanan, dan jeda — lalu mengatur intonasi, emosi,
            pitch, dan kecepatan secara otomatis. Tulis teks, biarkan AI bekerja,
            preview, dan download MP3.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.24 }}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start"
          >
            <Button
              type="button"
              size="lg"
              className="w-full cursor-pointer gap-2 sm:w-auto"
              onClick={() => navigate(studioHref)}
            >
              <AudioWaveform className="size-4" />
              Mulai Buat Voiceover
              <ArrowRight className="size-4" />
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="w-full cursor-pointer sm:w-auto"
              onClick={() => {
                document.querySelector("#alur")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Lihat Cara Kerja
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border/70 bg-card/50 px-4 py-3 text-center lg:text-left"
              >
                <div className="text-xl font-extrabold text-primary">{stat.value}</div>
                <div className="mt-0.5 text-xs font-medium text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* studio mock visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative mx-auto w-full max-w-md lg:max-w-none"
        >
          <div className="relative rounded-2xl border border-border/80 bg-card/70 p-5 backdrop-blur-sm">
            {/* window dots */}
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-red-400/80" />
              <span className="size-2.5 rounded-full bg-amber-400/80" />
              <span className="size-2.5 rounded-full bg-emerald-400/80" />
              <span className="ml-3 h-1.5 w-24 rounded-full bg-muted" />
            </div>

            {/* fake script */}
            <div className="mt-5 space-y-2.5">
              <p className="text-sm leading-6 text-foreground">
                <span className="font-semibold text-primary">Selamat datang</span>{" "}
                di dunia voiceover Bahasa Indonesia yang natural...
              </p>
              <div className="h-1.5 w-11/12 rounded-full bg-muted" />
              <div className="h-1.5 w-4/5 rounded-full bg-muted" />
            </div>

            {/* equalizer */}
            <div className="mt-6 flex h-16 items-center justify-center gap-1.5 rounded-xl border border-border/70 bg-background/60 px-4">
              {EQ_BARS.map((height, i) => (
                <motion.span
                  key={i}
                  className="w-1.5 origin-center rounded-full bg-gradient-to-t from-primary/60 to-primary"
                  style={{ height: `${height * 100}%` }}
                  animate={{ scaleY: [height, height * 0.35, height * 0.8, height] }}
                  transition={{
                    duration: 1.1 + (i % 4) * 0.18,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.07,
                  }}
                />
              ))}
            </div>

            {/* transport bar */}
            <div className="mt-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Play className="size-4 fill-current" />
                </span>
                <div>
                  <div className="text-xs font-semibold">Preview voiceover</div>
                  <div className="text-[11px] text-muted-foreground">
                    Suara Sari · Natural · 0:12
                  </div>
                </div>
              </div>
              <span className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                <Download className="size-3.5" />
                MP3
              </span>
            </div>
          </div>

          {/* floating chips */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="absolute -left-4 top-8 hidden rounded-xl border border-border/70 bg-card px-3.5 py-2.5 text-xs font-semibold shadow-none sm:block"
          >
            🎙️ Arka · Deep Narrator
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="absolute -right-4 bottom-10 hidden rounded-xl border border-border/70 bg-card px-3.5 py-2.5 text-xs font-semibold shadow-none sm:block"
          >
            ✨ AI Auto Direct aktif
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
