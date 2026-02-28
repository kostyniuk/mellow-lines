"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { nanoid } from "nanoid";

import { animateLayouts } from "../lib/magicMove/animate";
import { drawCodeFrame } from "../lib/magicMove/canvasRenderer";
import { animateTyping, computeChangedChars } from "../lib/typing/animateTyping";
import {
  calculateCanvasHeight,
  calculateCanvasWidth,
  GUTTER_PADDING,
  layoutTokenLinesToCanvas,
  makeDefaultLayoutConfig,
  makePreviewLayoutConfig,
} from "../lib/magicMove/codeLayout";
import type { CanvasLayoutConfig, LayoutResult, RenderTheme } from "../lib/magicMove/codeLayout";
import {
  getThemeVariant,
  shikiTokenizeToLines,
  type ShikiThemeChoice,
  type TokenLine,
} from "../lib/magicMove/shikiHighlighter";
import type { AnimationType, Step, SimpleStep } from "../lib/magicMove/types";
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

const CURSOR_BLINK_MS = 530;

function createEmptyLayout(reference: StepLayout): StepLayout {
  return {
    layout: {
      tokens: [],
      bg: reference.layout.bg,
      fg: reference.layout.fg,
      gutter: reference.layout.gutter,
      tokenLineCount: 0,
    },
    tokenLineCount: 0,
    startLine: reference.startLine,
    showLineNumbers: reference.showLineNumbers,
  };
}

type TimelineInfo = {
  totalMs: number;
  startHold: number;
  betweenHold: number;
  endHold: number;
};

function renderTimeline(opts: {
  ctx: CanvasRenderingContext2D;
  config: CanvasLayoutConfig;
  layouts: StepLayout[];
  codes: string[];
  timeline: TimelineInfo;
  ms: number;
  themeVariant: "light" | "dark";
  charWidth: number;
  isTyping: boolean;
  transitionMs: number;
  typingDurations: number[] | null;
  title?: string;
  naturalFlow?: boolean;
}): void {
  const {
    ctx, config, layouts, codes, timeline, ms, themeVariant,
    charWidth, isTyping, transitionMs, typingDurations, title, naturalFlow,
  } = opts;

  const clampMs = Math.max(0, Math.min(timeline.totalMs, ms));
  const gutterWidth = layouts[0]?.layout.gutter.width ?? 0;

  const getBlinkCursor = (layout: LayoutResult) => {
    if (!isTyping) return undefined;
    const blinkOn = Math.floor(ms / CURSOR_BLINK_MS) % 2 === 0;
    if (!blinkOn || layout.tokens.length === 0) return undefined;
    const lastToken = layout.tokens[layout.tokens.length - 1];
    return {
      x: lastToken.x + lastToken.content.length * charWidth,
      y: lastToken.y,
      color: layout.fg,
    };
  };

  const stepCount = layouts.length;

  if (stepCount === 1) {
    const only = layouts[0]!;
    drawCodeFrame({
      ctx, config, layout: only.layout, theme: themeVariant,
      showLineNumbers: only.showLineNumbers, startLine: only.startLine,
      lineCount: only.tokenLineCount, title, cursor: getBlinkCursor(only.layout),
    });
    return;
  }

  let t = clampMs;
  if (t < timeline.startHold) {
    const first = layouts[0]!;
    drawCodeFrame({
      ctx, config, layout: first.layout, theme: themeVariant,
      showLineNumbers: first.showLineNumbers, startLine: first.startLine,
      lineCount: first.tokenLineCount, title, cursor: getBlinkCursor(first.layout),
    });
    return;
  }
  t -= timeline.startHold;

  for (let i = 0; i < stepCount - 1; i++) {
    const a = layouts[i]!;
    const b = layouts[i + 1]!;
    const tDur = typingDurations ? typingDurations[i] : transitionMs;

    if (t <= tDur) {
      const progress = tDur <= 0 ? 1 : t / tDur;

      if (isTyping) {
        const result = animateTyping({
          from: a.tokenLineCount === 0 ? null : a.layout,
          to: b.layout,
          fromCode: codes[i],
          toCode: codes[i + 1],
          progress,
          charWidth,
          lineHeight: config.lineHeight,
          paddingX: config.paddingX,
          paddingY: config.paddingY,
          gutterWidth,
          naturalFlow,
        });
        drawCodeFrame({
          ctx, config, layout: b.layout, theme: themeVariant,
          tokens: result.tokens, showLineNumbers: b.showLineNumbers,
          startLine: b.startLine, lineCount: result.visibleLineCount, title,
          cursor: result.cursor ? { ...result.cursor, color: b.layout.fg } : undefined,
        });
      } else {
        const animated = animateLayouts({ from: a.layout, to: b.layout, progress });
        drawCodeFrame({
          ctx, config, layout: b.layout, theme: themeVariant,
          tokens: animated,
          showLineNumbers: a.showLineNumbers || b.showLineNumbers,
          startLine: b.startLine,
          lineCount: Math.max(a.tokenLineCount, b.tokenLineCount),
          prevLineCount: a.tokenLineCount, targetLineCount: b.tokenLineCount,
          transitionProgress: progress, title,
        });
      }
      return;
    }

    t -= tDur;
    if (t <= timeline.betweenHold) {
      drawCodeFrame({
        ctx, config, layout: b.layout, theme: themeVariant,
        showLineNumbers: b.showLineNumbers, startLine: b.startLine,
        lineCount: b.tokenLineCount, title, cursor: getBlinkCursor(b.layout),
      });
      return;
    }
    t -= timeline.betweenHold;
  }

  const last = layouts[stepCount - 1]!;
  drawCodeFrame({
    ctx, config, layout: last.layout, theme: themeVariant,
    showLineNumbers: last.showLineNumbers, startLine: last.startLine,
    lineCount: last.tokenLineCount, title, cursor: getBlinkCursor(last.layout),
  });
}

export default function Home() {
  const [simpleSteps, setSimpleSteps] = useState<SimpleStep[]>(DEFAULT_STEPS);
  const [selectedLang, setSelectedLang] = useState<string>("typescript");
  const [simpleShowLineNumbers, setSimpleShowLineNumbers] = useState<boolean>(false);
  const [simpleStartLine, setSimpleStartLine] = useState<number>(1);

  const [theme, setCodeTheme] = useState<ShikiThemeChoice>("vitesse-dark");
  const { setTheme: setSiteTheme } = useTheme();
  const [fps, setFps] = useState<number>(60);
  const [transitionMs, setTransitionMs] = useState<number>(700);
  const [startHoldMs, setStartHoldMs] = useState<number>(500);
  const [betweenHoldMs, setBetweenHoldMs] = useState<number>(200);
  const [endHoldMs, setEndHoldMs] = useState<number>(500);
  const [filename, setFilename] = useState<string>("Untitled-1");
  const [animationType, setAnimationType] = useState<AnimationType>("typing");
  const [typingWpm, setTypingWpm] = useState<number>(120);
  const [naturalFlow, setNaturalFlow] = useState<boolean>(true);
  const previewCharWidthRef = useRef<number>(0);

  // Compute steps from simple mode
  const steps = useMemo<Step[]>(() => {
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

  // For typing mode, we prepend a virtual empty step so the first transition types from scratch
  const effectiveStepCount = animationType === "typing" ? steps.length + 1 : steps.length;

  // Step codes aligned with effectiveStepLayouts
  const effectiveStepCodes = useMemo(() => {
    const codes = steps.map((s) => s.code);
    if (animationType === "typing") return ["", ...codes];
    return codes;
  }, [steps, animationType]);

  // Per-transition durations for typing mode (based on WPM)
  const typingTransitionDurations = useMemo(() => {
    if (animationType !== "typing" || effectiveStepCodes.length <= 1) return null;
    return effectiveStepCodes.slice(0, -1).map((fromCode, i) => {
      const toCode = effectiveStepCodes[i + 1];
      const chars = computeChangedChars(fromCode, toCode);
      return Math.max(500, (chars / 5 / typingWpm) * 60 * 1000);
    });
  }, [animationType, effectiveStepCodes, typingWpm]);

  const timeline = useMemo(() => {
    const stepCount = effectiveStepCount;
    const startHold = startHoldMs;
    const betweenHold = betweenHoldMs;
    const endHold = endHoldMs;
    if (stepCount <= 1) return { totalMs: startHold + endHold, startHold, betweenHold, endHold };
    const transitions = stepCount - 1;
    const transitionTotal =
      typingTransitionDurations
        ? typingTransitionDurations.reduce((sum, d) => sum + d, 0)
        : transitions * transitionMs;
    const totalMs = startHold + transitionTotal + transitions * betweenHold + endHold;
    return { totalMs, startHold, betweenHold, endHold };
  }, [effectiveStepCount, transitionMs, startHoldMs, betweenHoldMs, endHoldMs, typingTransitionDurations]);

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
          titleBarHeight: previewCfg.titleBarHeight,
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
      previewCharWidthRef.current = charWidth;
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

  // For typing mode: prepend a virtual empty step so the first transition types from scratch
  const effectiveStepLayouts = useMemo(() => {
    if (!stepLayouts || stepLayouts.length === 0) return stepLayouts;
    if (animationType !== "typing") return stepLayouts;
    return [createEmptyLayout(stepLayouts[0]!), ...stepLayouts];
  }, [stepLayouts, animationType]);

  // Clear outdated download URL when settings change
  useEffect(() => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
  }, [steps, theme, fps, transitionMs, startHoldMs, betweenHoldMs, endHoldMs, animationType, typingWpm, naturalFlow]); // Only those that affect the video content

  const renderAt = useCallback(
    (ms: number, overrideDimensions?: CanvasDimensions) => {
      const canvas = canvasRef.current;
      if (!canvas || !effectiveStepLayouts || effectiveStepLayouts.length === 0) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dims = overrideDimensions ?? canvasDimensions;
      const PIXEL_RATIO = 2;

      const cfg = makePreviewLayoutConfig();
      cfg.canvasWidth = dims.width;
      cfg.canvasHeight = dims.height;

      const targetWidth = dims.width * PIXEL_RATIO;
      const targetHeight = dims.height * PIXEL_RATIO;
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      canvas.style.width = `${dims.width}px`;
      canvas.style.height = `${dims.height}px`;
      ctx.setTransform(PIXEL_RATIO, 0, 0, PIXEL_RATIO, 0, 0);

      renderTimeline({
        ctx,
        config: cfg,
        layouts: effectiveStepLayouts,
        codes: effectiveStepCodes,
        timeline,
        ms,
        themeVariant: getThemeVariant(theme),
        charWidth: previewCharWidthRef.current,
        isTyping: animationType === "typing",
        transitionMs,
        typingDurations: typingTransitionDurations,
        naturalFlow,
      });
    },
    [effectiveStepLayouts, effectiveStepCodes, animationType, theme, timeline, transitionMs, typingTransitionDurations, canvasDimensions, naturalFlow],
  );

  useEffect(() => {
    if (!effectiveStepLayouts || effectiveStepLayouts.length === 0) return;
    renderAt(playheadMs);
  }, [playheadMs, renderAt, effectiveStepLayouts]);

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
        titleBarHeight: exportCfg.titleBarHeight,
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

    // For typing mode, prepend a virtual empty layout
    const effectiveExportLayouts = animationType === "typing"
      ? [createEmptyLayout(exportLayouts[0]!), ...exportLayouts]
      : exportLayouts;

    const exportStepCodes = animationType === "typing"
      ? ["", ...steps.map((s) => s.code)]
      : steps.map((s) => s.code);

    const exportTypingDurations = animationType === "typing"
      ? exportStepCodes.slice(0, -1).map((fromCode, i) => {
          const toCode = exportStepCodes[i + 1];
          const chars = computeChangedChars(fromCode, toCode);
          return Math.max(500, (chars / 5 / typingWpm) * 60 * 1000);
        })
      : null;

    const renderExportFrame = (ms: number) => {
      const ctx = exportCanvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      renderTimeline({
        ctx,
        config: finalExportCfg,
        layouts: effectiveExportLayouts,
        codes: exportStepCodes,
        timeline,
        ms,
        themeVariant: getThemeVariant(theme),
        charWidth,
        isTyping: animationType === "typing",
        transitionMs,
        typingDurations: exportTypingDurations,
        title: filename,
        naturalFlow,
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
          onThemeChange={(v) => {
            const newTheme = v as ShikiThemeChoice;
            setCodeTheme(newTheme);
            setSiteTheme(getThemeVariant(newTheme));
          }}
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
          filename={filename}
          onFilenameChange={setFilename}
          animationType={animationType}
          onAnimationTypeChange={(type) => {
            setAnimationType(type);
            if (type === "token-flow" && transitionMs > 5000) setTransitionMs(700);
          }}
          typingWpm={typingWpm}
          onTypingWpmChange={setTypingWpm}
          naturalFlow={naturalFlow}
          onNaturalFlowChange={setNaturalFlow}
          themeVariant={getThemeVariant(theme)}
        />
      </ResizablePanelGroup>
    </div>
  );
}
