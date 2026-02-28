"use client";

import { ResizablePanel } from "@/components/ui/resizable";
import { CanvasPreview } from "./canvas-preview";
import { PlayerControls } from "./player-controls";
import { ExportControls } from "./export-controls";
import type { AnimationType } from "@/app/lib/magicMove/types";
import type { RenderTheme } from "@/app/lib/magicMove/codeLayout";

interface PreviewPanelProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  layoutError: string | null;
  onDismissError: () => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  playheadMs: number;
  totalMs: number;
  onSeek: (ms: number) => void;
  onReset: () => void;
  stepLayouts: unknown[] | null;
  stepCount: number;
  transitionMs: number;
  onTransitionMsChange: (value: number) => void;
  downloadUrl: string | null;
  isExporting: boolean;
  exportPhase: "recording" | "saving" | null;
  exportProgress: number;
  onExport: (format: "webm" | "mp4") => void;
  canExport: boolean;
  filename: string;
  onFilenameChange: (value: string) => void;
  animationType: AnimationType;
  onAnimationTypeChange: (value: AnimationType) => void;
  typingWpm: number;
  onTypingWpmChange: (value: number) => void;
  naturalFlow: boolean;
  onNaturalFlowChange: (value: boolean) => void;
  themeVariant: RenderTheme;
}

export function PreviewPanel({
  canvasRef,
  layoutError,
  onDismissError,
  isPlaying,
  onPlayPause,
  playheadMs,
  totalMs,
  onSeek,
  onReset,
  stepLayouts,
  stepCount,
  transitionMs,
  onTransitionMsChange,
  downloadUrl,
  isExporting,
  exportPhase,
  exportProgress,
  onExport,
  canExport,
  filename,
  onFilenameChange,
  animationType,
  onAnimationTypeChange,
  typingWpm,
  onTypingWpmChange,
  naturalFlow,
  onNaturalFlowChange,
  themeVariant,
}: PreviewPanelProps) {
  return (
    <ResizablePanel
      defaultSize={100}
      minSize={50}
      className="flex flex-col h-full bg-zinc-950/5 dark:bg-black"
    >
      <CanvasPreview
        canvasRef={canvasRef}
        layoutError={layoutError}
        onDismissError={onDismissError}
        isLoading={!stepLayouts}
        filename={filename}
        onFilenameChange={onFilenameChange}
        animationType={animationType}
        onAnimationTypeChange={onAnimationTypeChange}
        naturalFlow={naturalFlow}
        onNaturalFlowChange={onNaturalFlowChange}
        themeVariant={themeVariant}
      />

      <PlayerControls
        isPlaying={isPlaying}
        onPlayPause={onPlayPause}
        playheadMs={playheadMs}
        totalMs={totalMs}
        onSeek={onSeek}
        onReset={onReset}
        disabled={!stepLayouts}
      />

      <ExportControls
        stepCount={stepCount}
        totalMs={totalMs}
        transitionMs={transitionMs}
        onTransitionMsChange={onTransitionMsChange}
        downloadUrl={downloadUrl}
        isExporting={isExporting}
        exportPhase={exportPhase}
        exportProgress={exportProgress}
        onExport={onExport}
        canExport={canExport}
        filename={filename}
        animationType={animationType}
        typingWpm={typingWpm}
        onTypingWpmChange={onTypingWpmChange}
      />
    </ResizablePanel>
  );
}
