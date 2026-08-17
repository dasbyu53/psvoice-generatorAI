import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/format";
import type { SynthesizedAudio } from "@/lib/voice/types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { AlertTriangle, Download, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const EQ_BARS = [0.5, 0.9, 0.65, 1, 0.4];

export function AudioPlayer({
  audio,
  filename,
  stale,
}: {
  audio: SynthesizedAudio;
  filename: string;
  stale: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(audio.durationSec);

  useEffect(() => {
    setCurrent(0);
    setPlaying(false);
    setDuration(audio.durationSec);
  }, [audio]);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
    } else {
      void el.play().catch(() => {
        // autoplay policies or decode issues — just reset state
        setPlaying(false);
      });
    }
  };

  const seek = (value: number) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = value;
    setCurrent(value);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-card/60 to-card/60"
    >
      <audio
        ref={audioRef}
        src={audio.objectUrl}
        preload="metadata"
        className="hidden"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          if (Number.isFinite(e.currentTarget.duration)) {
            setDuration(e.currentTarget.duration);
          }
        }}
      />

      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:px-5">
        {/* transport */}
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="default"
            size="icon-lg"
            className="cursor-pointer rounded-full"
            onClick={togglePlay}
            aria-label={playing ? "Jeda preview" : "Putar preview"}
          >
            {playing ? (
              <Pause className="size-5 fill-current" />
            ) : (
              <Play className="ml-0.5 size-5 fill-current" />
            )}
          </Button>

          {/* equalizer */}
          <div className="flex h-8 items-center gap-1" aria-hidden>
            {EQ_BARS.map((height, i) => (
              <motion.span
                key={i}
                className="w-1 origin-center rounded-full bg-primary"
                style={{ height: `${height * 100}%` }}
                animate={
                  playing
                    ? { scaleY: [height, height * 0.3, height * 0.85, height] }
                    : { scaleY: height }
                }
                transition={
                  playing
                    ? {
                        duration: 0.9 + (i % 3) * 0.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.08,
                      }
                    : { duration: 0.2 }
                }
              />
            ))}
          </div>

          <div className="text-left">
            <div className="text-xs font-bold text-foreground">
              Preview Voiceover
            </div>
            <div className="text-[11px] text-muted-foreground">
              {audio.format === "mp3" ? "MP3" : "WAV"} ·{" "}
              {formatDuration(audio.durationSec)}
            </div>
          </div>
        </div>

        {/* seek */}
        <div className="flex flex-1 items-center gap-3">
          <span className="w-10 text-right text-xs font-bold tabular-nums text-muted-foreground">
            {formatDuration(current)}
          </span>
          <input
            type="range"
            min={0}
            max={Math.max(0.1, duration)}
            step={0.05}
            value={Math.min(current, duration)}
            onChange={(e) => seek(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary"
            aria-label="Posisi pemutaran"
          />
          <span className="w-10 text-xs font-bold tabular-nums text-muted-foreground">
            {formatDuration(duration)}
          </span>
        </div>

        {/* actions */}
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          {stale && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold text-amber-300">
              <AlertTriangle className="size-3" />
              Pengaturan berubah
            </span>
          )}
          <a
            href={audio.objectUrl}
            download={filename}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90",
              "bg-primary text-primary-foreground",
            )}
          >
            <Download className="size-4" />
            Download MP3
          </a>
        </div>
      </div>
    </motion.section>
  );
}
