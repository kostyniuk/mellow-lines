"use client";

import { useState } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Download, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useThrottledValue } from "@tanstack/react-pacer";

interface PlayerControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  playheadMs: number;
  totalMs: number;
  onSeek: (ms: number) => void;
  onReset: () => void;
  soundEnabled: boolean;
  onSoundToggle: () => void;
  disabled?: boolean;
  downloadUrl: string | null;
  isExporting: boolean;
  exportPhase: "recording" | "saving" | null;
  exportProgress: number;
  onExport: (format: "webm" | "mp4") => void;
  canExport: boolean;
  filename: string;
}

export function PlayerControls({
  isPlaying,
  onPlayPause,
  playheadMs,
  totalMs,
  onSeek,
  onReset,
  soundEnabled,
  onSoundToggle,
  disabled = false,
  downloadUrl,
  isExporting,
  exportPhase,
  exportProgress,
  onExport,
  canExport,
  filename,
}: PlayerControlsProps) {
  const [format, setFormat] = useState<"webm" | "mp4">("mp4");
  const statusText = exportPhase === "saving" ? "Preparing" : "Recording";

  // Throttle (not debounce) because we want regular updates during playback.
  // Debounce would wait for the value to stop changing, which never happens during playback.
  const [throttledPlayheadMs] = useThrottledValue(playheadMs, {
    wait: 20,
  });

  return (
    <div className="absolute bottom-2 left-4 right-4 z-10 rounded-2xl bg-background/60 backdrop-blur-xl shadow-lg ring-1 ring-black/[0.08] dark:ring-white/[0.08] p-3 flex items-center gap-4">
      <Button
        size="icon"
        className="h-10 w-10 shrink-0 rounded-full"
        onClick={onPlayPause}
        disabled={disabled}
      >
        {isPlaying ? (
          <Pause className="w-5 h-5 fill-current" />
        ) : (
          <Play className="w-5 h-5 fill-current ml-0.5" />
        )}
      </Button>

      <div className="flex-1 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span className="font-mono">{Math.round(throttledPlayheadMs)}ms</span>
          <span className="font-mono">{Math.round(totalMs)}ms</span>
        </div>
        <Slider
          value={[playheadMs]}
          max={Math.max(1, totalMs)}
          step={1}
          onValueChange={([value]) => onSeek(value)}
          disabled={disabled}
          className="py-1"
          noThumb
        />
      </div>

      <div className="flex items-center gap-2 pl-1">
        <div className="w-px h-4 bg-border/50" />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          onClick={onReset}
          title="Reset"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          onClick={onSoundToggle}
          title={soundEnabled ? "Mute typing sound" : "Unmute typing sound"}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </Button>
      </div>

      <div className="flex items-center gap-2 pl-1">
        <div className="w-px h-4 bg-border/50" />
        <Tabs
          value={format}
          onValueChange={(v) => setFormat(v as "webm" | "mp4")}
          className="w-fit"
        >
          <TabsList variant="transparent">
            <TabsTrigger value="mp4">MP4</TabsTrigger>
            <TabsTrigger value="webm">WebM</TabsTrigger>
          </TabsList>
        </Tabs>

        {downloadUrl && (
          <Button variant="outline" size="sm" asChild className="gap-2">
            <a href={downloadUrl} download={`${filename || "Mellow_Lines"}.${format}`}>
              <Film className="w-4 h-4" />
              Save Video
            </a>
          </Button>
        )}
        <Button
          size="sm"
          className={cn("min-w-[100px]", isExporting && "opacity-80")}
          onClick={() => onExport(format)}
          disabled={!canExport || isExporting}
        >
          <Download className="w-4 h-4" />
          {isExporting ? `${statusText} ${Math.round(exportProgress * 100)}%` : "Export"}
        </Button>
      </div>
    </div>
  );
}
