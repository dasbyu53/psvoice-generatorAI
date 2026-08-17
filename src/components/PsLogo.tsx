import { cn } from "@/lib/utils";

export function PsMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="size-[62%]"
        aria-hidden="true"
      >
        {/* waveform bars */}
        <rect x="3.5" y="8" width="2.6" height="8" rx="1.3" fill="currentColor" className="text-black/70" />
        <rect x="8" y="4.5" width="2.6" height="15" rx="1.3" fill="currentColor" className="text-white" />
        <rect x="12.5" y="6.5" width="2.6" height="11" rx="1.3" fill="currentColor" className="text-black/70" />
        <rect x="17" y="9.5" width="2.6" height="5" rx="1.3" fill="currentColor" className="text-black/70" />
      </svg>
    </span>
  );
}

export function PsLogo({
  className,
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex cursor-pointer items-center gap-2.5 outline-none",
        className,
      )}
      aria-label="PSvoice — kembali ke beranda"
    >
      <PsMark className="size-8 transition-transform group-hover:scale-105" />
      <span className="text-lg font-extrabold tracking-tight text-foreground">
        PS<span className="text-primary">voice</span>
      </span>
    </button>
  );
}
