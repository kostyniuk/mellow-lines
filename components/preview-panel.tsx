"use client";

import { ResizablePanel } from "@/components/ui/resizable";
import { CanvasPreview } from "./canvas-preview";
import { PlayerControls } from "./player-controls";
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
  soundEnabled: boolean;
  onSoundToggle: () => void;
  backgroundPadding: number;
  backgroundThemeId: string;
  onBackgroundThemeIdChange: (id: string) => void;
  backgroundPaddingPx: number;
  onBackgroundPaddingPxChange: (value: number) => void;
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
  soundEnabled,
  onSoundToggle,
  backgroundPadding,
  backgroundThemeId,
  onBackgroundThemeIdChange,
  backgroundPaddingPx,
  onBackgroundPaddingPxChange,
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
        typingWpm={typingWpm}
        onTypingWpmChange={onTypingWpmChange}
        transitionMs={transitionMs}
        onTransitionMsChange={onTransitionMsChange}
        themeVariant={themeVariant}
        backgroundPadding={backgroundPadding}
        backgroundThemeId={backgroundThemeId}
        onBackgroundThemeIdChange={onBackgroundThemeIdChange}
        backgroundPaddingPx={backgroundPaddingPx}
        onBackgroundPaddingPxChange={onBackgroundPaddingPxChange}
      >
        <PlayerControls
          isPlaying={isPlaying}
          onPlayPause={onPlayPause}
          playheadMs={playheadMs}
          totalMs={totalMs}
          onSeek={onSeek}
          onReset={onReset}
          disabled={!stepLayouts}
          soundEnabled={soundEnabled}
          onSoundToggle={onSoundToggle}
          downloadUrl={downloadUrl}
          isExporting={isExporting}
          exportPhase={exportPhase}
          exportProgress={exportProgress}
          onExport={onExport}
          canExport={canExport}
          filename={filename}
        />
      </CanvasPreview>
    </ResizablePanel>
  );
}
