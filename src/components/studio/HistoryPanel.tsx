import { Button } from "@/components/ui/button";
import type { Doc } from "@/convex/_generated/dataModel";
import { formatDuration, formatRelativeDate } from "@/lib/format";
import { getEmotion } from "@/lib/voice/presets";
import { History, Loader2, RotateCcw, Trash2 } from "lucide-react";

type VoiceoverDoc = Doc<"voiceovers">;

export function HistoryPanel({
  items,
  loading,
  onLoad,
  onDelete,
}: {
  items: VoiceoverDoc[] | undefined;
  loading: boolean;
  onLoad: (item: VoiceoverDoc) => void;
  onDelete: (id: VoiceoverDoc["_id"]) => void;
}) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card/50 p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <History className="size-4 text-primary" />
        <h2 className="text-sm font-bold tracking-tight">Riwayat Voiceover</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Memuat riwayat...
        </div>
      ) : items && items.length === 0 ? (
        <p className="py-10 text-center text-xs leading-5 text-muted-foreground">
          Belum ada riwayat.
          <br />
          Generate voiceover pertamamu dan hasilnya akan tersimpan di sini.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items?.map((item) => {
            const emotion = getEmotion(item.emotionId);
            return (
              <li
                key={item._id}
                className="rounded-xl border border-border/60 bg-background/40 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-foreground">
                      {item.title ??
                        item.text.replace(/\s+/g, " ").slice(0, 48) + "…"}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {item.voiceName} · {emotion.name} ·{" "}
                      {formatDuration(item.durationSec)} ·{" "}
                      {formatRelativeDate(item._creationTime)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="cursor-pointer text-muted-foreground"
                      onClick={() => onLoad(item)}
                      aria-label="Muat ulang ke editor"
                    >
                      <RotateCcw className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="cursor-pointer text-muted-foreground hover:text-destructive"
                      onClick={() => onDelete(item._id)}
                      aria-label="Hapus riwayat"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
