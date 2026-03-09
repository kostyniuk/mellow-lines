"use client";

import { ResizablePanel } from "@/components/ui/resizable";
import { CanvasPreview } from "./canvas-preview";
import { PlayerControls } from "./player-controls";
import type { AnimationType, TokenFlowPreset } from "@/app/lib/magicMove/types";
import type { RenderTheme } from "@/app/lib/magicMove/codeLayout";
import type { ExportFormat } from "@/app/lib/video/types";

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
  downloadFormat: ExportFormat | null;
  isExporting: boolean;
  exportPhase: "rendering" | "saving" | null;
  exportProgress: number;
  onExport: (format: ExportFormat) => void;
  canExport: boolean;
  filename: string;
  onFilenameChange: (value: string) => void;
  animationType: AnimationType;
  onAnimationTypeChange: (value: AnimationType) => void;
  tokenFlowPreset: TokenFlowPreset;
  onTokenFlowPresetChange: (value: TokenFlowPreset) => void;
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
  defaultSize?: number;
  minSize?: number;
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
  downloadFormat,
  isExporting,
  exportPhase,
  exportProgress,
  onExport,
  canExport,
  filename,
  onFilenameChange,
  animationType,
  onAnimationTypeChange,
  tokenFlowPreset,
  onTokenFlowPresetChange,
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
  defaultSize = 40,
  minSize = 30,
}: PreviewPanelProps) {
  return (
    <ResizablePanel
      defaultSize={defaultSize}
      minSize={minSize}
      className="flex flex-col h-full min-h-0 bg-zinc-950/5 dark:bg-black"
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
        tokenFlowPreset={tokenFlowPreset}
        onTokenFlowPresetChange={onTokenFlowPresetChange}
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
          downloadFormat={downloadFormat}
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
