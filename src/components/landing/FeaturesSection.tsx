import { motion } from "framer-motion";
import {
  Clock3,
  Download,
  Repeat,
  SlidersHorizontal,
  Sparkles,
  Wand2,
} from "lucide-react";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Analyze otomatis",
    desc: "AI membaca dan menganalisis teks Anda: tanda baca, konteks, kalimat tanya, penekanan, jeda, dan kata penting.",
  },
  {
    icon: Wand2,
    title: "AI Auto Direct",
    desc: "Pengaturan terbaik — emosi, intonasi, pitch, kecepatan, dan jeda — dipilih otomatis dari isi teks.",
  },
  {
    icon: SlidersHorizontal,
    title: "Kontrol presisi",
    desc: "Atur manual Emotion, Intonation, Pitch, Speed, Volume, dan Pause untuk hasil yang persis seperti keinginan.",
  },
  {
    icon: Clock3,
    title: "Estimasi durasi",
    desc: "Durasi voiceover diestimasi sebelum generate, jadi Anda bisa merencanakan scene dan paragraf dengan tepat.",
  },
  {
    icon: Repeat,
    title: "Suara konsisten",
    desc: "Suara yang sama selalu terdengar identik di seluruh scene — konsisten untuk multi-paragraf dan proyek panjang.",
  },
  {
    icon: Download,
    title: "Preview & MP3",
    desc: "Preview audio sebelum download. Hasil akhir siap pakai dalam format MP3.",
  },
];

export function FeaturesSection() {
  return (
    <section id="fitur" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Fitur utama
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Bukan sekadar text-to-speech
          </h2>
          <p className="mt-4 text-muted-foreground">
            PSvoice memperlakukan naskah Anda seperti narator profesional:
            membaca konteks, lalu berbicara dengan ekspresi.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: (i % 3) * 0.08 }}
              className="group rounded-2xl border border-border/70 bg-card/50 p-6 transition-colors hover:border-primary/40 hover:bg-card"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
                <feature.icon className="size-5" />
              </div>
              <h3 className="mt-4 text-base font-bold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
