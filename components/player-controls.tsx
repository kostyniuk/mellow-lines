"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Download, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ExportFormat } from "@/app/lib/video/types";
import { cn } from "@/lib/utils";

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
  downloadFormat: ExportFormat | null;
  isExporting: boolean;
  exportPhase: "rendering" | "saving" | null;
  exportProgress: number;
  onExport: (format: ExportFormat) => void;
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
  downloadFormat,
  isExporting,
  exportPhase,
  exportProgress,
  onExport,
  canExport,
  filename,
}: PlayerControlsProps) {
  const [format, setFormat] = useState<ExportFormat>("mp4");
  const [displayPlayheadMs, setDisplayPlayheadMs] = useState(playheadMs);
  const displayPlayheadRef = useRef(playheadMs);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const statusText = exportPhase === "saving" ? "Preparing" : "Rendering";
  const downloadLabel = downloadFormat === "gif" ? "Save GIF" : "Save Video";

  useEffect(() => {
    if (!isPlaying) {
      displayPlayheadRef.current = playheadMs;
      setDisplayPlayheadMs(playheadMs);
      return;
    }

    const hasWrapped = playheadMs < displayPlayheadRef.current;
    const hasDrifted = Math.abs(playheadMs - displayPlayheadRef.current) > 120;
    if (hasWrapped || hasDrifted) {
      displayPlayheadRef.current = playheadMs;
      setDisplayPlayheadMs(playheadMs);
    }
  }, [isPlaying, playheadMs]);

  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastFrameRef.current = null;
      return;
    }

    const tick = (now: number) => {
      const last = lastFrameRef.current ?? now;
      lastFrameRef.current = now;
      const dt = now - last;
      const next = totalMs <= 0
        ? 0
        : (displayPlayheadRef.current + dt) % totalMs;

      displayPlayheadRef.current = next;
      setDisplayPlayheadMs(next);
      rafRef.current = requestAnimationFrame(tick);
    };

    displayPlayheadRef.current = playheadMs;
    setDisplayPlayheadMs(playheadMs);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastFrameRef.current = null;
    };
  }, [isPlaying, playheadMs, totalMs]);

  return (
    <div className="absolute bottom-3 left-3 right-3 z-10 rounded-2xl bg-background/60 p-3 shadow-lg ring-1 ring-black/[0.08] backdrop-blur-xl dark:ring-white/[0.08] sm:bottom-2 sm:left-4 sm:right-4">
      <div className="flex items-center gap-3 sm:gap-4">
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

        <div className="flex-1 flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span className="font-mono">{Math.round(displayPlayheadMs)}ms</span>
            <span className="font-mono">{Math.round(totalMs)}ms</span>
          </div>
          <Slider
            value={[displayPlayheadMs]}
            max={Math.max(1, totalMs)}
            step={1}
            onValueChange={([value]) => {
              displayPlayheadRef.current = value;
              setDisplayPlayheadMs(value);
              onSeek(value);
            }}
            disabled={disabled}
            className="py-1"
            noThumb
          />
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:mt-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
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

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Tabs
            value={format}
            onValueChange={(v) => setFormat(v as ExportFormat)}
            className="w-fit"
          >
            <TabsList variant="transparent">
              <TabsTrigger value="mp4">MP4</TabsTrigger>
              <TabsTrigger value="webm">WebM</TabsTrigger>
              <TabsTrigger value="gif">GIF</TabsTrigger>
            </TabsList>
          </Tabs>

          {downloadUrl && downloadFormat && (
            <Button variant="outline" size="sm" asChild className="gap-2">
              <a href={downloadUrl} download={`${filename || "Mellow_Lines"}.${downloadFormat}`}>
                <Film className="w-4 h-4" />
                {downloadLabel}
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
    </div>
  );
}
