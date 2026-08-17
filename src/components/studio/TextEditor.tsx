import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Eraser, FileText, Sparkles } from "lucide-react";

const SAMPLES = [
  {
    label: "Iklan",
    text: "Halo! Selamat datang di promo spesial bulan ini. Diskon hingga 50% hanya untuk kamu yang beruntung! Jangan lewatkan kesempatan emas ini — karena penawaran ini terbatas, dan akan segera berakhir. Ayo, belanja sekarang juga!",
  },
  {
    label: "Podcast",
    text: "Halo teman-teman, selamat datang kembali di podcast kita! Hari ini kita akan ngobrol santai tentang cara menjaga konsistensi dalam berkarya. Pernah nggak sih, kamu merasa semangat di awal, tapi kemudian melambat di tengah jalan? Tenang, kamu nggak sendirian. Yuk, kita bahas bareng-bareng.",
  },
  {
    label: "Dokumenter",
    text: "Di balik kabut pagi, desa ini menyimpan cerita yang jarang terdengar. Selama berabad-abad, para nelayan menjaga tradisi yang diwariskan turun-temurun. Namun, perubahan iklim kini mengancam cara hidup mereka. Apa yang akan terjadi pada generasi berikutnya?",
  },
];

export function TextEditor({
  text,
  onChange,
  onAnalyze,
}: {
  text: string;
  onChange: (value: string) => void;
  onAnalyze: () => void;
}) {
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <section className="rounded-2xl border border-border/70 bg-card/50">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-primary" />
          <h2 className="text-sm font-bold tracking-tight">Naskah</h2>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
          <span>{wordCount} kata</span>
          <span aria-hidden>·</span>
          <span>{text.length} karakter</span>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <Textarea
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Tulis atau tempel naskah Bahasa Indonesia di sini... Contoh: Selamat datang di dunia voiceover yang natural dan ekspresif. Pernahkah kamu membayangkan suaramu sendiri?"
          className="min-h-44 resize-y rounded-xl bg-background/60 leading-7 text-[15px]"
          aria-label="Naskah voiceover"
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] font-medium text-muted-foreground">
              Contoh naskah:
            </span>
            {SAMPLES.map((sample) => (
              <Button
                key={sample.label}
                type="button"
                variant="outline"
                size="sm"
                className="h-7 cursor-pointer rounded-full px-3 text-[11px]"
                onClick={() => onChange(sample.text)}
              >
                {sample.label}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="cursor-pointer text-muted-foreground"
              disabled={text.length === 0}
              onClick={() => onChange("")}
            >
              <Eraser className="size-3.5" />
              Bersihkan
            </Button>
            <Button
              type="button"
              className="cursor-pointer gap-1.5"
              disabled={text.trim().length < 5}
              onClick={onAnalyze}
            >
              <Sparkles className="size-4" />
              AI Analyze
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
