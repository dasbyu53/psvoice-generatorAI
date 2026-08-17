import { motion } from "framer-motion";
import { AudioWaveform, Download, FileText, Sparkles, Wand2 } from "lucide-react";

const STEPS = [
  {
    icon: FileText,
    title: "Tulis Teks",
    desc: "Ketik atau tempel naskah Bahasa Indonesia — satu scene atau banyak paragraf.",
  },
  {
    icon: Sparkles,
    title: "AI Analyze",
    desc: "AI membaca teks: tanda baca, kalimat tanya, penekanan, jeda, dan kata penting.",
  },
  {
    icon: Wand2,
    title: "Auto Direct",
    desc: "Emosi, intonasi, pitch, kecepatan, dan jeda diatur otomatis sesuai isi teks.",
  },
  {
    icon: AudioWaveform,
    title: "Generate Voice",
    desc: "Pilih suara dan emosi, lalu bangkitkan voiceover dengan durasi terestimasi.",
  },
  {
    icon: Download,
    title: "Preview & Download",
    desc: "Dengarkan hasilnya, lalu download dalam format MP3 untuk dipakai langsung.",
  },
];

export function FlowSection() {
  return (
    <section id="alur" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Alur kerja
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Dari teks ke MP3 dalam lima langkah
          </h2>
          <p className="mt-4 text-muted-foreground">
            Satu alur yang sama untuk iklan, TikTok, YouTube, podcast, hingga
            narasi sinematik.
          </p>
        </motion.div>

        <div className="relative mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* connector line (desktop) */}
          <div
            aria-hidden
            className="absolute left-[10%] right-[10%] top-7 hidden border-t border-dashed border-border lg:block"
          />
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="relative flex flex-col items-center text-center"
            >
              <div className="relative z-10 flex size-14 items-center justify-center rounded-2xl border border-border/80 bg-card">
                <step.icon className="size-6 text-primary" />
                <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-extrabold text-primary-foreground">
                  {i + 1}
                </span>
              </div>
              <h3 className="mt-4 text-sm font-bold">{step.title}</h3>
              <p className="mt-1.5 max-w-[16rem] text-xs leading-5 text-muted-foreground">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
