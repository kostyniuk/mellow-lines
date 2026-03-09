"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { nanoid } from "nanoid";

import { useDefaultCodeTheme } from "../lib/useDefaultCodeTheme";
import { animateLayouts } from "../lib/magicMove/animate";
import { buildBackgroundLayer, drawCodeFrame } from "../lib/magicMove/canvasRenderer";
import { buildTokenFlowTransitionPlan, type TokenFlowStep, type TokenFlowTransitionPlan } from "../lib/magicMove/tokenFlowPlan";
import { getTokenFlowStyle, type TokenFlowStyle } from "../lib/magicMove/tokenFlowPresets";
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
  createBackgroundLayerCacheKey,
  getBackgroundThemeById,
  type BackgroundTheme,
} from "../lib/magicMove/backgroundThemes";
import { getPreviewPixelRatio } from "../lib/magicMove/renderPerformance";
import {
  getThemeVariant,
  shikiTokenizeToLines,
  type ShikiThemeChoice,
} from "../lib/magicMove/shikiHighlighter";
import type { AnimationType, Step, SimpleStep, TokenFlowPreset } from "../lib/magicMove/types";
import {
  encodeFrameSequenceToGif,
  encodeFrameSequenceToMp4,
  encodeFrameSequenceToWebm,
  terminateFFmpeg,
} from "../lib/video/converter";
import { renderCanvasFrameSequence } from "../lib/video/frameSequence";
import { getEffectiveExportFps, type ExportFormat } from "../lib/video/types";
import { DEFAULT_STEPS } from "../lib/constants";
import { useTypingSound } from "../lib/audio/useTypingSound";
import { generateTypingAudioTrack } from "../lib/audio/generateTypingAudioTrack";

import { ResizableHandle, ResizablePanelGroup } from "@/components/ui/resizable";
import { StepsEditor } from "@/components/steps-editor";
import { PreviewPanel } from "@/components/preview-panel";

type StepLayout = TokenFlowStep & {
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
const MOBILE_BREAKPOINT_QUERY = "(max-width: 767px)";

function createEmptyLayout(reference: StepLayout): StepLayout {
  return {
    code: "",
    layout: {
      tokens: [],
      bg: reference.layout.bg,
      fg: reference.layout.fg,
      gutter: reference.layout.gutter,
      tokenLineCount: 0,
    },
    tokenLineCount: 0,
    tokenLines: [],
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

type BackgroundLayerCache = {
  key: string;
  canvas: HTMLCanvasElement;
};

function renderTimeline(opts: {
  ctx: CanvasRenderingContext2D;
  config: CanvasLayoutConfig;
  layouts: StepLayout[];
  codes: string[];
  timeline: TimelineInfo;
  ms: number;
  themeVariant: RenderTheme;
  charWidth: number;
  isTyping: boolean;
  transitionMs: number;
  typingDurations: number[] | null;
  title?: string;
  naturalFlow?: boolean;
  backgroundTheme?: BackgroundTheme | null;
  backgroundLayer?: CanvasImageSource | null;
  tokenFlowPlans?: TokenFlowTransitionPlan[] | null;
  tokenFlowStyle?: TokenFlowStyle;
  scaleSnapThreshold?: number;
}): void {
  const {
    ctx, config, layouts, codes, timeline, ms, themeVariant,
    charWidth, isTyping, transitionMs, typingDurations, title, naturalFlow,
    backgroundTheme, backgroundLayer, tokenFlowPlans, tokenFlowStyle, scaleSnapThreshold,
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
      backgroundTheme,
      backgroundLayer,
      scaleSnapThreshold,
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
      backgroundTheme,
      backgroundLayer,
      scaleSnapThreshold,
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
          backgroundTheme,
          backgroundLayer,
          scaleSnapThreshold,
        });
      } else {
        const animated = tokenFlowPlans?.[i] && tokenFlowStyle
          ? animateLayouts({
            plan: tokenFlowPlans[i]!,
            progress,
            style: tokenFlowStyle,
            backgroundColor: b.layout.bg,
          })
          : {
            tokens: b.layout.tokens.map((token) => ({
              content: token.content,
              color: token.color,
              x: token.x,
              y: token.y,
              opacity: 1,
            })),
            regionHighlights: [],
          };
        drawCodeFrame({
          ctx, config, layout: b.layout, theme: themeVariant,
          tokens: animated.tokens,
          regionHighlights: animated.regionHighlights,
          showLineNumbers: a.showLineNumbers || b.showLineNumbers,
          startLine: b.startLine,
          lineCount: Math.max(a.tokenLineCount, b.tokenLineCount),
          prevLineCount: a.tokenLineCount, targetLineCount: b.tokenLineCount,
          transitionProgress: progress, title, backgroundTheme, backgroundLayer, scaleSnapThreshold,
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
        backgroundTheme,
        backgroundLayer,
        scaleSnapThreshold,
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
    backgroundTheme,
    backgroundLayer,
    scaleSnapThreshold,
  });
}

export default function Home() {
  const [simpleSteps, setSimpleSteps] = useState<SimpleStep[]>(DEFAULT_STEPS);
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [selectedLang, setSelectedLang] = useState<string>("typescript");
  const [simpleShowLineNumbers, setSimpleShowLineNumbers] = useState<boolean>(false);
  const [simpleStartLine, setSimpleStartLine] = useState<number>(1);

  const { codeTheme: theme, setCodeTheme, setSiteTheme } = useDefaultCodeTheme();
  const [fps, setFps] = useState<number>(60);
  const [transitionMs, setTransitionMs] = useState<number>(700);
  const [startHoldMs, setStartHoldMs] = useState<number>(500);
  const [betweenHoldMs, setBetweenHoldMs] = useState<number>(200);
  const [endHoldMs, setEndHoldMs] = useState<number>(500);
  const [filename, setFilename] = useState<string>("");
  const [animationType, setAnimationType] = useState<AnimationType>("typing");
  const [tokenFlowPreset, setTokenFlowPreset] = useState<TokenFlowPreset>("studio");
  const [typingWpm, setTypingWpm] = useState<number>(120);
  const [naturalFlow, setNaturalFlow] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [backgroundThemeId, setBackgroundThemeId] = useState<string>("none");
  const [backgroundPaddingPx, setBackgroundPaddingPx] = useState<number>(48);
  const previewCharWidthRef = useRef<number>(0);

  // Export padding scales proportionally with font size (export 26px / preview 16px)
  const exportBgPaddingPx = Math.round(backgroundPaddingPx * 26 / 16);

  const activeBackgroundTheme = backgroundThemeId !== "none"
    ? getBackgroundThemeById(backgroundThemeId) ?? null
    : null;
  const themeVariant = getThemeVariant(theme);

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
  const [cardDimensions, setCardDimensions] = useState<CanvasDimensions>({
    width: 1920,
    height: 1080,
  });
  const [layoutError, setLayoutError] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadMs, setPlayheadMs] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const previewPlayheadRef = useRef(0);
  const lastUiSyncRef = useRef<number | null>(null);
  const previewSurfaceRef = useRef<{
    logicalWidth: number;
    logicalHeight: number;
    pixelRatio: number;
  } | null>(null);
  const backgroundLayerRef = useRef<BackgroundLayerCache | null>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [exportPhase, setExportPhase] = useState<"rendering" | "saving" | null>(null);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFormat, setDownloadFormat] = useState<ExportFormat | null>(null);
  const [scrollToEndTrigger, setScrollToEndTrigger] = useState(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT_QUERY);
    const updateLayout = (event?: MediaQueryListEvent) => {
      setIsMobileLayout(event ? event.matches : mediaQuery.matches);
    };

    updateLayout();
    mediaQuery.addEventListener("change", updateLayout);

    return () => {
      mediaQuery.removeEventListener("change", updateLayout);
    };
  }, []);

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

  const previewCanvasDimensions = useMemo(() => {
    const bgPad = activeBackgroundTheme ? backgroundPaddingPx : 0;
    return {
      width: cardDimensions.width + bgPad * 2,
      height: cardDimensions.height + bgPad * 2,
    };
  }, [activeBackgroundTheme, backgroundPaddingPx, cardDimensions]);

  useEffect(() => {
    let cancelled = false;
    setLayoutError(null);

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
        code: string;
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
          code: step.code,
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
          minWidth: 300,
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
          theme: themeVariant,
          config: cfg,
          gutterWidthOverride: maxGutterWidth,
        });

        nextLayouts.push({
          code: data.code,
          layout,
          tokenLineCount: data.lines.length,
          tokenLines: data.lines,
          startLine: cfg.startLine,
          showLineNumbers: cfg.showLineNumbers,
        });
      }

      if (cancelled) return;
      previewCharWidthRef.current = charWidth;

      setCardDimensions({
        width: maxWidth,
        height: maxHeight,
      });
      setStepLayouts(nextLayouts);
    })().catch((e: unknown) => {
      if (cancelled) return;
      setLayoutError(e instanceof Error ? e.message : "Failed to build preview");
    });

    return () => {
      cancelled = true;
    };
  }, [steps, theme, themeVariant]);

  // For typing mode: prepend a virtual empty step so the first transition types from scratch
  const effectiveStepLayouts = useMemo(() => {
    if (!stepLayouts || stepLayouts.length === 0) return stepLayouts;
    if (animationType !== "typing") return stepLayouts;
    return [createEmptyLayout(stepLayouts[0]!), ...stepLayouts];
  }, [stepLayouts, animationType]);

  const tokenFlowStyle = useMemo(
    () => getTokenFlowStyle(tokenFlowPreset, themeVariant),
    [tokenFlowPreset, themeVariant],
  );

  const tokenFlowPlans = useMemo(() => {
    if (animationType !== "token-flow" || !effectiveStepLayouts || effectiveStepLayouts.length <= 1) {
      return null;
    }

    return effectiveStepLayouts.slice(0, -1).map((from, index) => (
      buildTokenFlowTransitionPlan({
        from,
        to: effectiveStepLayouts[index + 1]!,
      })
    ));
  }, [animationType, effectiveStepLayouts]);

  // Clear outdated download URL when settings change.
  useEffect(() => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
      setDownloadFormat(null);
    }
  }, [steps, theme, fps, transitionMs, startHoldMs, betweenHoldMs, endHoldMs, animationType, tokenFlowPreset, typingWpm, naturalFlow, backgroundThemeId, backgroundPaddingPx]); // Only those that affect the video content

  const renderAt = useCallback(
    (ms: number, overrideDimensions?: CanvasDimensions) => {
      const canvas = canvasRef.current;
      if (!canvas || !effectiveStepLayouts || effectiveStepLayouts.length === 0) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dims = overrideDimensions ?? previewCanvasDimensions;
      const hasBackground = !!activeBackgroundTheme;
      const pixelRatio = getPreviewPixelRatio(
        hasBackground,
        typeof window === "undefined" ? 1 : window.devicePixelRatio,
      );
      const bgPad = hasBackground ? backgroundPaddingPx : 0;

      const cfg = makePreviewLayoutConfig();
      // canvasWidth/Height = card dimensions (without background padding)
      cfg.canvasWidth = dims.width - bgPad * 2;
      cfg.canvasHeight = dims.height - bgPad * 2;
      cfg.backgroundPadding = bgPad;

      const surface = previewSurfaceRef.current;
      const needsResize =
        !surface ||
        surface.logicalWidth !== dims.width ||
        surface.logicalHeight !== dims.height ||
        surface.pixelRatio !== pixelRatio;

      if (needsResize) {
        canvas.width = Math.round(dims.width * pixelRatio);
        canvas.height = Math.round(dims.height * pixelRatio);
        canvas.style.width = `${dims.width}px`;
        canvas.style.height = `${dims.height}px`;
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        previewSurfaceRef.current = {
          logicalWidth: dims.width,
          logicalHeight: dims.height,
          pixelRatio,
        };
      }

      let backgroundLayer: HTMLCanvasElement | null = null;
      if (activeBackgroundTheme && bgPad > 0) {
        const backgroundLayerKey = createBackgroundLayerCacheKey({
          themeId: activeBackgroundTheme.id,
          width: cfg.canvasWidth + bgPad * 2,
          height: cfg.canvasHeight + bgPad * 2,
          cardX: bgPad,
          cardY: bgPad,
          cardWidth: cfg.canvasWidth,
          cardHeight: cfg.canvasHeight,
          cornerRadius: 16,
        });
        if (backgroundLayerRef.current?.key !== backgroundLayerKey) {
          const cachedLayer = buildBackgroundLayer({
            theme: activeBackgroundTheme,
            config: cfg,
          });
          if (cachedLayer) {
            backgroundLayerRef.current = cachedLayer;
          }
        }
        backgroundLayer = backgroundLayerRef.current?.canvas ?? null;
      } else {
        backgroundLayerRef.current = null;
      }

      renderTimeline({
        ctx,
        config: cfg,
        layouts: effectiveStepLayouts,
        codes: effectiveStepCodes,
        timeline,
        ms,
        themeVariant,
        charWidth: previewCharWidthRef.current,
        isTyping: animationType === "typing",
        transitionMs,
        typingDurations: typingTransitionDurations,
        naturalFlow,
        backgroundTheme: activeBackgroundTheme,
        backgroundLayer,
        tokenFlowPlans,
        tokenFlowStyle,
        scaleSnapThreshold: hasBackground ? 0.01 : 0.001,
      });
    },
    [effectiveStepLayouts, effectiveStepCodes, animationType, themeVariant, timeline, transitionMs, typingTransitionDurations, previewCanvasDimensions, naturalFlow, activeBackgroundTheme, backgroundPaddingPx, tokenFlowPlans, tokenFlowStyle],
  );

  useEffect(() => {
    if (!isPlaying) {
      previewPlayheadRef.current = Math.max(0, Math.min(timeline.totalMs, playheadMs));
    }
  }, [isPlaying, playheadMs, timeline.totalMs]);

  useEffect(() => {
    if (isPlaying || !effectiveStepLayouts || effectiveStepLayouts.length === 0) return;
    renderAt(playheadMs);
  }, [playheadMs, renderAt, effectiveStepLayouts, isPlaying]);

  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastFrameRef.current = null;
      lastUiSyncRef.current = null;
      return;
    }

    const tick = (now: number) => {
      const last = lastFrameRef.current ?? now;
      lastFrameRef.current = now;
      const dt = now - last;
      const next = previewPlayheadRef.current + dt;
      const wrapped = next >= timeline.totalMs;
      const nextPlayhead = wrapped ? 0 : next;
      const shouldSyncEachFrame = animationType === "typing" || soundEnabled;

      previewPlayheadRef.current = nextPlayhead;
      renderAt(nextPlayhead);

      if (
        shouldSyncEachFrame ||
        wrapped ||
        lastUiSyncRef.current === null ||
        now - lastUiSyncRef.current >= 66
      ) {
        lastUiSyncRef.current = now;
        setPlayheadMs(nextPlayhead);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastFrameRef.current = null;
      return;
    };
  }, [isPlaying, timeline.totalMs, renderAt, animationType, soundEnabled]);

  useTypingSound({
    enabled: soundEnabled,
    isPlaying,
    playheadMs,
    timeline,
    effectiveStepCount,
    transitionMs,
    typingDurations: typingTransitionDurations,
    animationType,
    effectiveStepCodes,
    naturalFlow,
  });

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

  const handleSeek = useCallback((ms: number) => {
    previewPlayheadRef.current = ms;
    setPlayheadMs(ms);
    renderAt(ms);
  }, [renderAt]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    previewPlayheadRef.current = 0;
    setPlayheadMs(0);
    lastUiSyncRef.current = null;
    lastFrameRef.current = null;
    renderAt(0);
  }, [renderAt]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      setPlayheadMs(previewPlayheadRef.current);
      return;
    }

    previewPlayheadRef.current = playheadMs;
    lastUiSyncRef.current = null;
    lastFrameRef.current = null;
    setIsPlaying(true);
  }, [isPlaying, playheadMs]);

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

  const clearSimpleSteps = () => {
    setIsPlaying(false);
    previewPlayheadRef.current = 0;
    setPlayheadMs(0);
    lastUiSyncRef.current = null;
    lastFrameRef.current = null;
    setSimpleSteps([{ id: nanoid(), code: "" }]);
  };

  const onExport = async (format: ExportFormat) => {
    if (!stepLayouts || stepLayouts.length === 0) return;

    setIsExporting(true);
    setExportPhase("rendering");
    setExportProgress(0);
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null);
    setDownloadFormat(null);

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
      ...stepLayouts.map((data) => {
        const lineCount = data.tokenLines.length;
        const lastLineNumber = data.startLine + Math.max(0, lineCount - 1);
        return String(lastLineNumber).length;
      }),
    );
    const maxGutterWidth = simpleShowLineNumbers
      ? Math.ceil(maxDigits * charWidth + GUTTER_PADDING * 2)
      : 0;

    // Calculate dimensions for each step using export config
    const stepDimensions = stepLayouts.map((data) => {
      const requiredWidth = calculateCanvasWidth({
        tokenLines: data.tokenLines,
        charWidth,
        paddingX: exportCfg.paddingX,
        gutterWidth: maxGutterWidth, // Use max gutter width for consistent positioning
        minWidth: 0,
      });

      const requiredHeight = calculateCanvasHeight({
        lineCount: data.tokenLines.length,
        lineHeight: exportCfg.lineHeight,
        paddingY: exportCfg.paddingY,
        titleBarHeight: exportCfg.titleBarHeight,
        minHeight: 0,
      });

      return { width: requiredWidth, height: requiredHeight };
    });

    // Get max dimensions across all steps
    const rawCardWidth = Math.max(...stepDimensions.map((d) => d.width));
    const rawCardHeight = Math.max(...stepDimensions.map((d) => d.height));
    const exportBgPad = activeBackgroundTheme ? exportBgPaddingPx : 0;
    const rawWidth = rawCardWidth + exportBgPad * 2;
    const rawHeight = rawCardHeight + exportBgPad * 2;
    // H.264 with yuv420p requires even dimensions
    const exportWidth = rawWidth + (rawWidth % 2);
    const exportHeight = rawHeight + (rawHeight % 2);
    // Card dimensions inside the export canvas
    const cardWidth = exportWidth - exportBgPad * 2;
    const cardHeight = exportHeight - exportBgPad * 2;

    // Compute export layouts with content-sized dimensions (card size, not total)
    const exportLayouts: StepLayout[] = [];
    for (const data of stepLayouts) {
      const cfg = makeDefaultLayoutConfig();
      cfg.canvasWidth = cardWidth;
      cfg.canvasHeight = cardHeight;
      cfg.showLineNumbers = data.showLineNumbers;
      cfg.startLine = data.startLine;

      const layout = layoutTokenLinesToCanvas({
        ctx,
        tokenLines: data.tokenLines,
        bg: data.layout.bg,
        theme: themeVariant,
        config: cfg,
        gutterWidthOverride: maxGutterWidth,
      });

      exportLayouts.push({
        code: data.code,
        layout,
        tokenLineCount: data.tokenLines.length,
        tokenLines: data.tokenLines,
        startLine: cfg.startLine,
        showLineNumbers: cfg.showLineNumbers,
      });
    }

    // Set export canvas to export dimensions (1x, no pixel ratio for video)
    exportCanvas.width = exportWidth;
    exportCanvas.height = exportHeight;

    const finalExportCfg = makeDefaultLayoutConfig();
    finalExportCfg.canvasWidth = cardWidth;
    finalExportCfg.canvasHeight = cardHeight;
    finalExportCfg.backgroundPadding = exportBgPad;
    const exportBackgroundLayer = buildBackgroundLayer({
      theme: activeBackgroundTheme,
      config: finalExportCfg,
    })?.canvas ?? null;

    // For typing mode, prepend a virtual empty layout
    const effectiveExportLayouts = animationType === "typing"
      ? [createEmptyLayout(exportLayouts[0]!), ...exportLayouts]
      : exportLayouts;

    const exportStepCodes = animationType === "typing"
      ? ["", ...steps.map((s) => s.code)]
      : exportLayouts.map((layout) => layout.code);

    const exportTokenFlowPlans = animationType === "token-flow"
      ? exportLayouts.slice(0, -1).map((from, index) => (
        buildTokenFlowTransitionPlan({
          from,
          to: exportLayouts[index + 1]!,
        })
      ))
      : null;

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
        themeVariant,
        charWidth,
        isTyping: animationType === "typing",
        transitionMs,
        typingDurations: exportTypingDurations,
        title: filename,
        naturalFlow,
        backgroundTheme: activeBackgroundTheme,
        backgroundLayer: exportBackgroundLayer,
        tokenFlowPlans: exportTokenFlowPlans,
        tokenFlowStyle,
      });
    };

    const durationMs = timeline.totalMs;
    const effectiveExportFps = getEffectiveExportFps(format, fps);

    try {
      const renderedSequence = await renderCanvasFrameSequence({
        canvas: exportCanvas,
        fps: effectiveExportFps,
        durationMs,
        renderFrame: renderExportFrame,
        onProgress: (completedFrames, totalFrames) => {
          setExportProgress(totalFrames <= 0 ? 0 : completedFrames / totalFrames);
        },
      });

      if (renderedSequence.timestamps[renderedSequence.timestamps.length - 1] !== durationMs) {
        throw new Error("Export did not render the final logical frame");
      }

      setExportPhase("saving");
      setExportProgress(0);

      let audioBlob: Blob | undefined;
      if (format === "mp4" && soundEnabled && animationType === "typing") {
        audioBlob = await generateTypingAudioTrack({
          timeline,
          stepCount: effectiveStepCount,
          transitionMs,
          typingDurations: exportTypingDurations,
        });
      }

      let finalBlob: Blob;
      if (format === "mp4") {
        finalBlob = await encodeFrameSequenceToMp4({
          frames: renderedSequence.frames,
          fps: effectiveExportFps,
          durationMs,
          audioBlob,
          onProgress: setExportProgress,
        });
      } else if (format === "gif") {
        finalBlob = await encodeFrameSequenceToGif({
          frames: renderedSequence.frames,
          fps: effectiveExportFps,
          durationMs,
          onProgress: setExportProgress,
        });
      } else {
        finalBlob = await encodeFrameSequenceToWebm({
          frames: renderedSequence.frames,
          fps: effectiveExportFps,
          durationMs,
          onProgress: setExportProgress,
        });
      }

      const url = URL.createObjectURL(finalBlob);
      setDownloadUrl(url);
      setDownloadFormat(format);
    } catch (e) {
      setLayoutError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setIsExporting(false);
      setExportPhase(null);
      setExportProgress(0);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background text-foreground overflow-hidden">
      <ResizablePanelGroup
        direction={isMobileLayout ? "vertical" : "horizontal"}
        className="flex-1 w-full max-w-full min-h-0"
      >
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
          onClearSteps={clearSimpleSteps}
          onInsertStep={(index) => insertSimpleStep(index)}
          onRemoveStep={removeSimpleStep}
          onUpdateStep={updateSimpleStep}
          scrollToEndTrigger={scrollToEndTrigger}
          defaultSize={isMobileLayout ? 48 : 60}
          minSize={isMobileLayout ? 30 : 35}
        />

        <ResizableHandle />

        <PreviewPanel
          canvasRef={canvasRef}
          layoutError={layoutError}
          onDismissError={() => setLayoutError(null)}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          playheadMs={playheadMs}
          totalMs={timeline.totalMs}
          onSeek={handleSeek}
          onReset={handleReset}
          stepLayouts={stepLayouts}
          transitionMs={transitionMs}
          onTransitionMsChange={setTransitionMs}
          downloadUrl={downloadUrl}
          downloadFormat={downloadFormat}
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
          tokenFlowPreset={tokenFlowPreset}
          onTokenFlowPresetChange={setTokenFlowPreset}
          typingWpm={typingWpm}
          onTypingWpmChange={setTypingWpm}
          naturalFlow={naturalFlow}
          onNaturalFlowChange={setNaturalFlow}
          themeVariant={themeVariant}
          soundEnabled={soundEnabled}
          onSoundToggle={() => setSoundEnabled((v) => !v)}
          backgroundPadding={activeBackgroundTheme ? backgroundPaddingPx : 0}
          backgroundThemeId={backgroundThemeId}
          onBackgroundThemeIdChange={setBackgroundThemeId}
          backgroundPaddingPx={backgroundPaddingPx}
          onBackgroundPaddingPxChange={setBackgroundPaddingPx}
          defaultSize={isMobileLayout ? 52 : 40}
          minSize={isMobileLayout ? 32 : 30}
        />
      </ResizablePanelGroup>
    </div>
  );
}
