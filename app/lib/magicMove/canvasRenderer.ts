import type { CanvasLayoutConfig, LayoutResult, RenderTheme } from "./codeLayout";
import {
  type BackgroundTheme,
  drawBackgroundGradient,
  drawCardShadow,
} from "./backgroundThemes";

function drawTitleBar(opts: {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  w: number;
  h: number;
  theme: RenderTheme;
  title?: string;
}) {
  const { ctx, x, y, w, h, theme, title } = opts;
  const dotColor = theme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.13)";
  const dotRadius = Math.round(h * 0.18);
  const dotGap = Math.round(dotRadius * 3.4);
  const dotsY = y + h / 2;
  const dotsX0 = x + Math.round(h * 0.6);

  // Subtle separator line at the bottom of the title bar
  const sepColor = theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  ctx.strokeStyle = sepColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.stroke();

  // Draw three muted dots
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(dotsX0 + i * dotGap, dotsY, dotRadius, 0, Math.PI * 2);
    ctx.fillStyle = dotColor;
    ctx.fill();
  }

  // Draw title centered in title bar
  if (title) {
    const titleColor = theme === "dark" ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)";
    ctx.fillStyle = titleColor;
    ctx.font = `${Math.round(h * 0.35)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(title, x + w / 2, y + h / 2);
    ctx.textAlign = "left"; // Reset to default
  }
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

//Draws a code frame to the canvas.
//Paints the background, card background, gutter, and tokens.
export function drawCodeFrame(opts: {
  ctx: CanvasRenderingContext2D;
  config: CanvasLayoutConfig;
  layout: LayoutResult;
  theme: RenderTheme;
  // Optional override tokens list (for animation)
  tokens?: { content: string; color: string; x: number; y: number; opacity: number }[];
  // Optional gutter override (for animation)
  showLineNumbers?: boolean;
  startLine?: number;
  lineCount?: number;
  prevLineCount?: number;
  targetLineCount?: number;
  transitionProgress?: number;
  // Optional title for the title bar
  title?: string;
  // Optional cursor for typing animation
  cursor?: { x: number; y: number; color: string } | null;
  // Optional background theme (gradient behind the code card)
  backgroundTheme?: BackgroundTheme | null;
}) {
  const { ctx, config, layout } = opts;
  const bgPad = config.backgroundPadding;
  const hasBackground = bgPad > 0 && opts.backgroundTheme;

  // Total canvas size = card + background padding on each side
  const totalW = config.canvasWidth + bgPad * 2;
  const totalH = config.canvasHeight + bgPad * 2;

  // 1. Clear the full canvas
  ctx.clearRect(0, 0, totalW, totalH);

  // 2. If background theme present: draw gradient on full canvas
  if (hasBackground) {
    drawBackgroundGradient({
      ctx,
      theme: opts.backgroundTheme!,
      width: totalW,
      height: totalH,
      cornerRadius: 16,
    });

    // Draw a subtle shadow behind the code card
    drawCardShadow({
      ctx,
      x: bgPad,
      y: bgPad,
      width: config.canvasWidth,
      height: config.canvasHeight,
      cornerRadius: 16,
    });
  }

  // 3. Offset into the card area
  ctx.save();
  if (hasBackground) {
    ctx.translate(bgPad, bgPad);
  }

  // 4. Fill code card background
  if (hasBackground) {
    // Rounded card so corners are visible against the gradient
    roundedRectPath(ctx, 0, 0, config.canvasWidth, config.canvasHeight, 16);
    ctx.fillStyle = layout.bg;
    ctx.fill();
  } else {
    ctx.fillStyle = layout.bg;
    ctx.fillRect(0, 0, config.canvasWidth, config.canvasHeight);
  }

  // 5. Clip to card rounded rect
  ctx.save();
  roundedRectPath(ctx, 0, 0, config.canvasWidth, config.canvasHeight, 16);
  ctx.clip();

  // Title bar with macOS dots
  const titleBarH = config.titleBarHeight;
  if (titleBarH > 0) {
    drawTitleBar({
      ctx,
      x: 0,
      y: 0,
      w: config.canvasWidth,
      h: titleBarH,
      theme: opts.theme,
      title: opts.title,
    });
    ctx.translate(0, titleBarH);
  }

  // Gutter (line numbers)
  const gutterEnabled = opts.showLineNumbers ?? layout.gutter.enabled;
  const gutterWidth = gutterEnabled ? layout.gutter.width : 0;

  if (gutterEnabled && gutterWidth > 0) {
    const startLine = opts.startLine ?? config.startLine;
    const lineCount =
      opts.lineCount ?? Math.round((config.canvasHeight - config.paddingY * 2) / config.lineHeight);

    ctx.font = `${config.fontSize}px ${config.fontFamily}`;
    ctx.textBaseline = "top";
    ctx.fillStyle = layout.gutter.textColor;

    // Transition logic for line numbers
    const prevCount = opts.prevLineCount ?? lineCount;
    const targetCount = opts.targetLineCount ?? lineCount;
    const progress = opts.transitionProgress ?? 1;

    for (let i = 0; i < lineCount; i++) {
      let alpha = 0.9;

      // If we are in a transition
      if (opts.transitionProgress !== undefined) {
        const inPrev = i < prevCount;
        const inTarget = i < targetCount;

        if (inPrev && inTarget) {
          // Line exists in both source and target
          alpha = 0.9;
        } else if (!inPrev && inTarget) {
          // Line is appearing (fade in)
          // Use cubic easing for smoother appearance: t^3
          const t = Math.max(0, Math.min(1, progress));
          alpha = 0.9 * (t * t * t);
        } else if (inPrev && !inTarget) {
          // Line is disappearing (fade out)
          const t = Math.max(0, Math.min(1, 1 - progress));
          alpha = 0.9 * (t * t * t);
        } else {
          // Should not happen if loop bound is correct, but safe fallback
          alpha = 0;
        }
      }

      if (alpha < 0.01) continue;

      const n = startLine + i;
      const label = String(n);
      const y = config.paddingY + i * config.lineHeight;
      const w = ctx.measureText(label).width;
      ctx.globalAlpha = alpha;
      ctx.fillText(label, config.paddingX + gutterWidth - 16 - w, y);
    }
  }

  ctx.font = `${config.fontSize}px ${config.fontFamily}`;
  ctx.textBaseline = "top";

  const tokensToDraw =
    opts.tokens ??
    layout.tokens.map((t) => ({
      content: t.content,
      color: t.color,
      x: t.x,
      y: t.y,
      opacity: 1,
    }));

  for (const t of tokensToDraw) {
    if (!t.content) continue;
    ctx.globalAlpha = Math.max(0, Math.min(1, t.opacity));
    ctx.fillStyle = t.color;
    ctx.fillText(t.content, t.x, t.y);
  }

  // Draw cursor if provided (typing animation)
  // Text uses textBaseline="top", so text starts at y and extends down by fontSize.
  // Place cursor at the same y, matching the text height exactly.
  if (opts.cursor) {
    const { x, y, color } = opts.cursor;
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 2, config.fontSize);
  }

  // Restore clip
  ctx.restore();
  // Restore translate (background offset)
  ctx.restore();
  ctx.globalAlpha = 1;
}
