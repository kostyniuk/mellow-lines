"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { nanoid } from "nanoid";

import { animateLayouts } from "../lib/magicMove/animate";
import { drawCodeFrame } from "../lib/magicMove/canvasRenderer";
import {
  calculateCanvasHeight,
  calculateCanvasWidth,
  GUTTER_PADDING,
  layoutTokenLinesToCanvas,
  makeDefaultLayoutConfig,
  makePreviewLayoutConfig,
} from "../lib/magicMove/codeLayout";
import type { LayoutResult } from "../lib/magicMove/codeLayout";
import {
  getThemeVariant,
  shikiTokenizeToLines,
  type ShikiThemeChoice,
  type TokenLine,
} from "../lib/magicMove/shikiHighlighter";
import type { MagicMoveStep, SimpleStep } from "../lib/magicMove/types";
import { recordCanvasToWebm } from "../lib/video/recordCanvas";
import { convertWebmToMp4, terminateFFmpeg } from "../lib/video/converter";
import { DEFAULT_STEPS } from "../lib/constants";

import { ResizableHandle, ResizablePanelGroup } from "@/components/ui/resizable";
import { StepsEditor } from "@/components/steps-editor";
import { PreviewPanel } from "@/components/preview-panel";

type StepLayout = {
  layout: LayoutResult;
  tokenLineCount: number;
  startLine: number;
  showLineNumbers: boolean;
};

type CanvasDimensions = {
  width: number;
  height: number;
};

export default function Home() {
  const [simpleSteps, setSimpleSteps] = useState<SimpleStep[]>(DEFAULT_STEPS);
  const [selectedLang, setSelectedLang] = useState<string>("typescript");
  const [simpleShowLineNumbers, setSimpleShowLineNumbers] = useState<boolean>(true);
  const [simpleStartLine, setSimpleStartLine] = useState<number>(1);

  const [theme, setTheme] = useState<ShikiThemeChoice>("vitesse-dark");
  const [fps, setFps] = useState<number>(60);
  const [transitionMs, setTransitionMs] = useState<number>(1200);
  const [startHoldMs, setStartHoldMs] = useState<number>(500);
  const [betweenHoldMs, setBetweenHoldMs] = useState<number>(200);
  const [endHoldMs, setEndHoldMs] = useState<number>(500);

  // Compute steps from simple mode
  const steps = useMemo<MagicMoveStep[]>(() => {
    return simpleSteps.map((step) => ({
      lang: selectedLang,
      code: step.code,
      meta: {
        lines: simpleShowLineNumbers,
        startLine: simpleStartLine,
      },
    }));
  }, [simpleSteps, selectedLang, simpleShowLineNumbers, simpleStartLine]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stepLayouts, setStepLayouts] = useState<StepLayout[] | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState<CanvasDimensions>({
    width: 1920,
    height: 1080,
  });
  const [layoutError, setLayoutError] = useState<string | null>(null);

  // Store tokenized data for reuse in export
  type StepTokenData = {
    lines: TokenLine[];
    bg: string;
    showLineNumbers: boolean;
    startLine: number;
  };
  const stepTokenDataRef = useRef<StepTokenData[] | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadMs, setPlayheadMs] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [exportPhase, setExportPhase] = useState<"recording" | "saving" | null>(null);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [scrollToEndTrigger, setScrollToEndTrigger] = useState(0);

  const timeline = useMemo(() => {
    const stepCount = steps.length;
    const startHold = startHoldMs;
    const betweenHold = betweenHoldMs;
    const endHold = endHoldMs;
    if (stepCount <= 1) return { totalMs: startHold + endHold, startHold, betweenHold, endHold };
    const transitions = stepCount - 1;
    const totalMs = startHold + transitions * transitionMs + transitions * betweenHold + endHold;
    return { totalMs, startHold, betweenHold, endHold };
  }, [steps.length, transitionMs, startHoldMs, betweenHoldMs, endHoldMs]);

  useEffect(() => {
    let cancelled = false;
    setLayoutError(null);
    setStepLayouts(null);

    (async () => {
      const c = document.createElement("canvas");
      const ctx = c.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D not supported");

      // Phase 1: Tokenize all steps and collect data for dimension calculation
      // Use preview config for smaller font size in preview
      const previewCfg = makePreviewLayoutConfig();
      ctx.font = `${previewCfg.fontSize}px ${previewCfg.fontFamily}`;
      const charWidth = ctx.measureText("M").width;

      type StepData = {
        lines: Awaited<ReturnType<typeof shikiTokenizeToLines>>["lines"];
        bg: string;
        showLineNumbers: boolean;
        startLine: number;
      };

      const stepData: StepData[] = [];

      for (const step of steps) {
        const { lines, bg } = await shikiTokenizeToLines({
          code: step.code,
          lang: step.lang,
          theme,
        });
        stepData.push({
          lines,
          bg,
          showLineNumbers: step.meta.lines,
          startLine: step.meta.startLine,
        });
      }

      if (cancelled) return;

      // Calculate max gutter width across all steps for consistent token positioning
      const maxDigits = Math.max(
        ...stepData.map((data) => {
          const lineCount = data.lines.length;
          const lastLineNumber = data.startLine + Math.max(0, lineCount - 1);
          return String(lastLineNumber).length;
        }),
      );
      const maxGutterWidth = simpleShowLineNumbers
        ? Math.ceil(maxDigits * charWidth + GUTTER_PADDING * 2)
        : 0;

      // Phase 2: Calculate required dimensions for each step
      const stepDimensions = stepData.map((data) => {
        const requiredWidth = calculateCanvasWidth({
          tokenLines: data.lines,
          charWidth,
          paddingX: previewCfg.paddingX,
          gutterWidth: maxGutterWidth, // Use max gutter width for consistent positioning
          minWidth: 0, // No minimum for preview - shrink to fit
        });

        const requiredHeight = calculateCanvasHeight({
          lineCount: data.lines.length,
          lineHeight: previewCfg.lineHeight,
          paddingY: previewCfg.paddingY,
          minHeight: 0, // No minimum for preview - shrink to fit
        });

        return { width: requiredWidth, height: requiredHeight };
      });

      // Phase 3: Determine max dimensions across all steps
      const maxWidth = Math.max(...stepDimensions.map((d) => d.width));
      const maxHeight = Math.max(...stepDimensions.map((d) => d.height));

      // Phase 4: Compute layouts with consistent dimensions
      const nextLayouts: StepLayout[] = [];

      for (const data of stepData) {
        const cfg = makePreviewLayoutConfig();
        cfg.canvasWidth = maxWidth;
        cfg.canvasHeight = maxHeight;
        cfg.showLineNumbers = data.showLineNumbers;
        cfg.startLine = data.startLine;

        const layout = layoutTokenLinesToCanvas({
          ctx,
          tokenLines: data.lines,
          bg: data.bg,
          theme: getThemeVariant(theme),
          config: cfg,
          gutterWidthOverride: maxGutterWidth,
        });

        nextLayouts.push({
          layout,
          tokenLineCount: data.lines.length,
          startLine: cfg.startLine,
          showLineNumbers: cfg.showLineNumbers,
        });
      }

      if (cancelled) return;
      setCanvasDimensions({ width: maxWidth, height: maxHeight });
      setStepLayouts(nextLayouts);
      // Store tokenized data for potential use in export
      stepTokenDataRef.current = stepData;
    })().catch((e: unknown) => {
      if (cancelled) return;
      setLayoutError(e instanceof Error ? e.message : "Failed to build preview");
    });

    return () => {
      cancelled = true;
    };
  }, [steps, theme]);

  // Clear outdated download URL when settings change
  useEffect(() => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
  }, [steps, theme, fps, transitionMs, startHoldMs, betweenHoldMs, endHoldMs]); // Only those that affect the video content

  const renderAt = useCallback(
    (ms: number, overrideDimensions?: CanvasDimensions) => {
      const canvas = canvasRef.current;
      if (!canvas || !stepLayouts || stepLayouts.length === 0) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Use override dimensions (for export) or computed dimensions (for preview)
      const dims = overrideDimensions ?? canvasDimensions;

      // Use 2x pixel ratio for sharp rendering on retina displays
      const PIXEL_RATIO = 2;

      // Use preview config for preview rendering
      const cfg = makePreviewLayoutConfig();
      cfg.canvasWidth = dims.width;
      cfg.canvasHeight = dims.height;

      // Set canvas internal size to 2x for retina sharpness
      const targetWidth = dims.width * PIXEL_RATIO;
      const targetHeight = dims.height * PIXEL_RATIO;

      // Always set canvas size and CSS dimensions
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      canvas.style.width = `${dims.width}px`;
      canvas.style.height = `${dims.height}px`;

      // Reset transform and scale context for 2x rendering
      ctx.setTransform(PIXEL_RATIO, 0, 0, PIXEL_RATIO, 0, 0);

      const clampMs = Math.max(0, Math.min(timeline.totalMs, ms));

      const steps = stepLayouts.length;
      if (steps === 1) {
        const only = stepLayouts[0]!;
        drawCodeFrame({
          ctx,
          config: cfg,
          layout: only.layout,
          theme: getThemeVariant(theme),
          showLineNumbers: only.showLineNumbers,
          startLine: only.startLine,
          lineCount: only.tokenLineCount,
        });
        return;
      }

      let t = clampMs;
      if (t < timeline.startHold) {
        const first = stepLayouts[0]!;
        drawCodeFrame({
          ctx,
          config: cfg,
          layout: first.layout,
          theme: getThemeVariant(theme),
          showLineNumbers: first.showLineNumbers,
          startLine: first.startLine,
          lineCount: first.tokenLineCount,
        });
        return;
      }
      t -= timeline.startHold;

      for (let i = 0; i < steps - 1; i++) {
        const a = stepLayouts[i]!;
        const b = stepLayouts[i + 1]!;

        if (t <= transitionMs) {
          const progress = transitionMs <= 0 ? 1 : t / transitionMs;
          const animated = animateLayouts({ from: a.layout, to: b.layout, progress });
          drawCodeFrame({
            ctx,
            config: cfg,
            layout: b.layout,
            theme: getThemeVariant(theme),
            tokens: animated,
            showLineNumbers: a.showLineNumbers || b.showLineNumbers,
            startLine: b.startLine,
            lineCount: Math.max(a.tokenLineCount, b.tokenLineCount),
            prevLineCount: a.tokenLineCount,
            targetLineCount: b.tokenLineCount,
            transitionProgress: progress,
          });
          return;
        }

        t -= transitionMs;
        if (t <= timeline.betweenHold) {
          drawCodeFrame({
            ctx,
            config: cfg,
            layout: b.layout,
            theme: getThemeVariant(theme),
            showLineNumbers: b.showLineNumbers,
            startLine: b.startLine,
            lineCount: b.tokenLineCount,
          });
          return;
        }
        t -= timeline.betweenHold;
      }

      const last = stepLayouts[steps - 1]!;
      drawCodeFrame({
        ctx,
        config: cfg,
        layout: last.layout,
        theme: getThemeVariant(theme),
        showLineNumbers: last.showLineNumbers,
        startLine: last.startLine,
        lineCount: last.tokenLineCount,
      });
    },
    [stepLayouts, theme, timeline, transitionMs, canvasDimensions],
  );

  useEffect(() => {
    if (!stepLayouts || stepLayouts.length === 0) return;
    renderAt(playheadMs);
  }, [playheadMs, renderAt, stepLayouts]);

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
      setPlayheadMs((t) => {
        const next = t + dt;
        return next >= timeline.totalMs ? 0 : next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastFrameRef.current = null;
      return;
    };
  }, [isPlaying, timeline.totalMs]);

  // Cleanup blob URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
      terminateFFmpeg();
    };
  }, [downloadUrl]);

  const canExport = !!stepLayouts && stepLayouts.length > 0;

  // Simple mode handlers
  const insertSimpleStep = (atIndex?: number) => {
    const insertAt = atIndex ?? simpleSteps.length;
    const isAddingAtEnd = insertAt === simpleSteps.length;

    const newStep = { id: nanoid(), code: "// New step" };
    setSimpleSteps([...simpleSteps.slice(0, insertAt), newStep, ...simpleSteps.slice(insertAt)]);

    if (isAddingAtEnd) {
      setScrollToEndTrigger((prev) => prev + 1);
    }
  };

  const removeSimpleStep = (index: number) => {
    if (simpleSteps.length <= 1) return; // Keep at least one step
    setSimpleSteps(simpleSteps.filter((_, i) => i !== index));
  };

  const updateSimpleStep = (index: number, code: string) => {
    const updated = [...simpleSteps];
    updated[index] = { ...updated[index], code };
    setSimpleSteps(updated);
  };

  const onExport = async (format: "webm" | "mp4") => {
    if (!stepTokenDataRef.current || stepTokenDataRef.current.length === 0) return;

    setIsExporting(true);
    setExportPhase("recording");
    setExportProgress(0);
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null);

    // Create a separate offscreen canvas for export (don't use the visible preview canvas)
    const exportCanvas = document.createElement("canvas");
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D not supported");

    // Use export config (26px font, 40px line height, 64px padding)
    const exportCfg = makeDefaultLayoutConfig();
    ctx.font = `${exportCfg.fontSize}px ${exportCfg.fontFamily}`;
    const charWidth = ctx.measureText("M").width;

    // Calculate max gutter width across all steps for consistent token positioning
    const maxDigits = Math.max(
      ...stepTokenDataRef.current.map((data) => {
        const lineCount = data.lines.length;
        const lastLineNumber = data.startLine + Math.max(0, lineCount - 1);
        return String(lastLineNumber).length;
      }),
    );
    const maxGutterWidth = simpleShowLineNumbers
      ? Math.ceil(maxDigits * charWidth + GUTTER_PADDING * 2)
      : 0;

    // Calculate dimensions for each step using export config
    const stepDimensions = stepTokenDataRef.current.map((data) => {
      const requiredWidth = calculateCanvasWidth({
        tokenLines: data.lines,
        charWidth,
        paddingX: exportCfg.paddingX,
        gutterWidth: maxGutterWidth, // Use max gutter width for consistent positioning
        minWidth: 0,
      });

      const requiredHeight = calculateCanvasHeight({
        lineCount: data.lines.length,
        lineHeight: exportCfg.lineHeight,
        paddingY: exportCfg.paddingY,
        minHeight: 0,
      });

      return { width: requiredWidth, height: requiredHeight };
    });

    // Get max dimensions across all steps
    const rawWidth = Math.max(...stepDimensions.map((d) => d.width));
    const rawHeight = Math.max(...stepDimensions.map((d) => d.height));
    // H.264 with yuv420p requires even dimensions
    const exportWidth = rawWidth + (rawWidth % 2);
    const exportHeight = rawHeight + (rawHeight % 2);

    // Compute export layouts with content-sized dimensions
    const exportLayouts: StepLayout[] = [];
    for (const data of stepTokenDataRef.current) {
      const cfg = makeDefaultLayoutConfig();
      cfg.canvasWidth = exportWidth;
      cfg.canvasHeight = exportHeight;
      cfg.showLineNumbers = data.showLineNumbers;
      cfg.startLine = data.startLine;

      const layout = layoutTokenLinesToCanvas({
        ctx,
        tokenLines: data.lines,
        bg: data.bg,
        theme: getThemeVariant(theme),
        config: cfg,
        gutterWidthOverride: maxGutterWidth,
      });

      exportLayouts.push({
        layout,
        tokenLineCount: data.lines.length,
        startLine: cfg.startLine,
        showLineNumbers: cfg.showLineNumbers,
      });
    }

    // Set export canvas to export dimensions (1x, no pixel ratio for video)
    exportCanvas.width = exportWidth;
    exportCanvas.height = exportHeight;

    const finalExportCfg = makeDefaultLayoutConfig();
    finalExportCfg.canvasWidth = exportWidth;
    finalExportCfg.canvasHeight = exportHeight;

    // Local render function for export that uses export layouts
    const renderExportFrame = (ms: number) => {
      const ctx = exportCanvas.getContext("2d");
      if (!ctx) return;

      // Reset transform (preview uses 2x, export uses 1x)
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      const clampMs = Math.max(0, Math.min(timeline.totalMs, ms));
      const stepCount = exportLayouts.length;

      if (stepCount === 1) {
        const only = exportLayouts[0]!;
        drawCodeFrame({
          ctx,
          config: finalExportCfg,
          layout: only.layout,
          theme: getThemeVariant(theme),
          showLineNumbers: only.showLineNumbers,
          startLine: only.startLine,
          lineCount: only.tokenLineCount,
        });
        return;
      }

      let t = clampMs;
      if (t < timeline.startHold) {
        const first = exportLayouts[0]!;
        drawCodeFrame({
          ctx,
          config: finalExportCfg,
          layout: first.layout,
          theme: getThemeVariant(theme),
          showLineNumbers: first.showLineNumbers,
          startLine: first.startLine,
          lineCount: first.tokenLineCount,
        });
        return;
      }
      t -= timeline.startHold;

      for (let i = 0; i < stepCount - 1; i++) {
        const a = exportLayouts[i]!;
        const b = exportLayouts[i + 1]!;

        if (t <= transitionMs) {
          const progress = transitionMs <= 0 ? 1 : t / transitionMs;
          const animated = animateLayouts({ from: a.layout, to: b.layout, progress });
          drawCodeFrame({
            ctx,
            config: finalExportCfg,
            layout: b.layout,
            theme: getThemeVariant(theme),
            tokens: animated,
            showLineNumbers: a.showLineNumbers || b.showLineNumbers,
            startLine: b.startLine,
            lineCount: Math.max(a.tokenLineCount, b.tokenLineCount),
            prevLineCount: a.tokenLineCount,
            targetLineCount: b.tokenLineCount,
            transitionProgress: progress,
          });
          return;
        }

        t -= transitionMs;
        if (t <= timeline.betweenHold) {
          drawCodeFrame({
            ctx,
            config: finalExportCfg,
            layout: b.layout,
            theme: getThemeVariant(theme),
            showLineNumbers: b.showLineNumbers,
            startLine: b.startLine,
            lineCount: b.tokenLineCount,
          });
          return;
        }
        t -= timeline.betweenHold;
      }

      const last = exportLayouts[stepCount - 1]!;
      drawCodeFrame({
        ctx,
        config: finalExportCfg,
        layout: last.layout,
        theme: getThemeVariant(theme),
        showLineNumbers: last.showLineNumbers,
        startLine: last.startLine,
        lineCount: last.tokenLineCount,
      });
    };

    const durationMs = timeline.totalMs;
    let cancelled = false;

    // Draw initial frame synchronously before starting recording
    renderExportFrame(0);

    try {
      let blob: Blob | null = await recordCanvasToWebm({
        canvas: exportCanvas,
        fps,
        durationMs,
        onProgress: (elapsed, total) => {
          setExportProgress(total <= 0 ? 0 : elapsed / total);
        },
        // Pass render function to be called each frame from inside the recording loop
        onFrame: (elapsed) => {
          if (!cancelled) {
            renderExportFrame(elapsed);
          }
        },
      });

      if (format === "mp4") {
        setExportPhase("saving");
        setExportProgress(0);

        const mp4Blob = await convertWebmToMp4(
          blob!,
          (val) => {
            setExportProgress(val);
          },
          durationMs,
        );
        cancelled = true;

        const url = URL.createObjectURL(mp4Blob);
        setDownloadUrl(url);
      } else {
        cancelled = true;
        const url = URL.createObjectURL(blob!);
        setDownloadUrl(url);
      }

      blob = null; // Release WebM blob memory
    } catch (e) {
      cancelled = true;
      setLayoutError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setIsExporting(false);
      setExportPhase(null);
      setExportProgress(0);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background text-foreground overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="flex-1 w-full max-w-full">
        <StepsEditor
          steps={simpleSteps}
          selectedLang={selectedLang}
          onLangChange={setSelectedLang}
          theme={theme}
          onThemeChange={(v) => setTheme(v as ShikiThemeChoice)}
          showLineNumbers={simpleShowLineNumbers}
          onShowLineNumbersChange={setSimpleShowLineNumbers}
          startLine={simpleStartLine}
          onStartLineChange={setSimpleStartLine}
          fps={fps}
          onFpsChange={setFps}
          startHoldMs={startHoldMs}
          onStartHoldMsChange={setStartHoldMs}
          betweenHoldMs={betweenHoldMs}
          onBetweenHoldMsChange={setBetweenHoldMs}
          endHoldMs={endHoldMs}
          onEndHoldMsChange={setEndHoldMs}
          onAddStep={() => insertSimpleStep()}
          onInsertStep={(index) => insertSimpleStep(index)}
          onRemoveStep={removeSimpleStep}
          onUpdateStep={updateSimpleStep}
          scrollToEndTrigger={scrollToEndTrigger}
        />

        <ResizableHandle />

        <PreviewPanel
          canvasRef={canvasRef}
          layoutError={layoutError}
          onDismissError={() => setLayoutError(null)}
          isPlaying={isPlaying}
          onPlayPause={() => setIsPlaying(!isPlaying)}
          playheadMs={playheadMs}
          totalMs={timeline.totalMs}
          onSeek={setPlayheadMs}
          onReset={() => {
            setIsPlaying(false);
            setPlayheadMs(0);
          }}
          stepLayouts={stepLayouts}
          stepCount={steps.length}
          transitionMs={transitionMs}
          onTransitionMsChange={setTransitionMs}
          downloadUrl={downloadUrl}
          isExporting={isExporting}
          exportPhase={exportPhase}
          exportProgress={exportProgress}
          onExport={onExport}
          canExport={canExport}
        />
      </ResizablePanelGroup>
    </div>
  );
}
