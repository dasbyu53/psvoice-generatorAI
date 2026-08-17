import { PsMark } from "@/components/PsLogo";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";

export function Footer() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const studioHref = isAuthenticated ? "/studio" : "/auth?returnTo=/studio";

  return (
    <footer className="border-t border-border/70 bg-card/30">
      {/* CTA band */}
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/12 via-card to-card px-6 py-12 text-center sm:px-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,color-mix(in_oklch,var(--primary)_14%,transparent),transparent)]"
          />
          <h2 className="relative text-2xl font-extrabold tracking-tight sm:text-3xl">
            Siap mengubah naskah Anda menjadi suara?
          </h2>
          <p className="relative mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            Gratis mulai sekarang — tulis teks, biarkan AI menganalisis, dan
            dengarkan hasilnya dalam hitungan detik.
          </p>
          <button
            type="button"
            onClick={() => navigate(studioHref)}
            className="relative mt-7 inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Buka Studio PSvoice
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>

      {/* bottom bar */}
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 border-t border-border/60 px-4 py-8 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <PsMark className="size-6" />
          <span>
            PS<span className="text-primary">voice</span>
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} PSvoice. Dibuat untuk narator dan
          podcaster Indonesia.
        </p>
        <p className="text-[11px] font-medium text-muted-foreground/80">
          Powered by Pakseh
        </p>
      </div>
    </footer>
  );
}
