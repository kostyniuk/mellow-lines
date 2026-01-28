import type { TokenLine } from "./shikiHighlighter";

export type RenderTheme = "light" | "dark";

export type CanvasLayoutConfig = {
  canvasWidth: number;
  canvasHeight: number;
  paddingX: number;
  paddingY: number;
  lineHeight: number;
  fontSize: number;
  fontFamily: string;
  showLineNumbers: boolean;
  startLine: number;
};

/** Padding on each side of the gutter (left and right of line numbers) */
export const GUTTER_PADDING = 16;

export type LaidToken = {
  key: string;
  content: string;
  color: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type LayoutResult = {
  tokens: LaidToken[];
  bg: string;
  fg: string;
  gutter: {
    enabled: boolean;
    width: number;
    color: string;
    dividerColor: string;
    textColor: string;
  };
  tokenLineCount: number;
};

export function makeDefaultLayoutConfig(): CanvasLayoutConfig {
  return {
    canvasWidth: 1920,
    canvasHeight: 1080,
    paddingX: 64,
    paddingY: 64,
    lineHeight: 40,
    fontSize: 26,
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    showLineNumbers: false,
    startLine: 1,
  };
}

export function makePreviewLayoutConfig(): CanvasLayoutConfig {
  return {
    canvasWidth: 800,
    canvasHeight: 600,
    paddingX: 40,
    paddingY: 40,
    lineHeight: 24,
    fontSize: 16,
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    showLineNumbers: false,
    startLine: 1,
  };
}

/**
 * Calculate the minimum canvas height needed to display all lines.
 * Ensures all content is visible without clipping.
 */
export function calculateCanvasHeight(opts: {
  lineCount: number;
  lineHeight: number;
  paddingY: number;
  minHeight?: number;
}): number {
  const { lineCount, lineHeight, paddingY, minHeight = 0 } = opts;
  const contentHeight = lineCount * lineHeight;
  // Add extra padding at bottom for visual balance
  const bottomBuffer = Math.ceil(lineHeight / 2);
  const totalHeight = contentHeight + paddingY * 2 + bottomBuffer;
  return Math.ceil(Math.max(minHeight, totalHeight));
}

/**
 * Calculate the minimum canvas width needed to display the longest line.
 * Ensures all content is visible without clipping.
 */
export function calculateCanvasWidth(opts: {
  tokenLines: TokenLine[];
  charWidth: number;
  paddingX: number;
  gutterWidth: number;
  minWidth?: number;
}): number {
  const { tokenLines, charWidth, paddingX, gutterWidth, minWidth = 0 } = opts;

  let maxLineLength = 0;
  for (const line of tokenLines) {
    let lineLength = 0;
    for (const token of line.tokens) {
      lineLength += token.content.replace(/\t/g, "  ").length;
    }
    maxLineLength = Math.max(maxLineLength, lineLength);
  }

  const contentWidth = Math.ceil(maxLineLength * charWidth);
  const gutterGap = gutterWidth > 0 ? 12 : 0;
  const totalWidth = paddingX * 2 + gutterWidth + gutterGap + contentWidth;

  return Math.ceil(Math.max(minWidth, totalWidth));
}

/**
 * Wrap token lines that exceed maxContentWidth for export.
 * Splits lines at token boundaries, or within tokens if a single token is too long.
 */
export function wrapTokenLines(opts: {
  tokenLines: TokenLine[];
  maxContentWidth: number;
  charWidth: number;
}): TokenLine[] {
  const { tokenLines, maxContentWidth, charWidth } = opts;
  const maxChars = Math.floor(maxContentWidth / charWidth);

  if (maxChars <= 0) return tokenLines;

  const result: TokenLine[] = [];

  for (const line of tokenLines) {
    let currentLine: { content: string; color: string }[] = [];
    let currentLength = 0;

    for (const token of line.tokens) {
      const content = token.content.replace(/\t/g, "  ");
      let remaining = content;

      while (remaining.length > 0) {
        const spaceLeft = maxChars - currentLength;

        if (spaceLeft <= 0) {
          // Current line is full, start a new line
          result.push({ tokens: currentLine });
          currentLine = [];
          currentLength = 0;
          continue;
        }

        if (remaining.length <= spaceLeft) {
          // Token fits on current line
          currentLine.push({ content: remaining, color: token.color });
          currentLength += remaining.length;
          remaining = "";
        } else {
          // Token needs to be split
          const chunk = remaining.slice(0, spaceLeft);
          remaining = remaining.slice(spaceLeft);
          currentLine.push({ content: chunk, color: token.color });
          result.push({ tokens: currentLine });
          currentLine = [];
          currentLength = 0;
        }
      }
    }

    // Push remaining tokens from this original line
    if (currentLine.length > 0) {
      result.push({ tokens: currentLine });
    } else if (line.tokens.length === 0) {
      // Preserve empty lines
      result.push({ tokens: [] });
    }
  }

  return result;
}

function measureCharWidth(ctx: CanvasRenderingContext2D): number {
  // For monospace fonts, a single representative glyph is enough.
  return ctx.measureText("M").width;
}

//Layouts the token lines to the canvas.
//Paints the tokens to the canvas.
export function layoutTokenLinesToCanvas(opts: {
  ctx: CanvasRenderingContext2D;
  tokenLines: TokenLine[];
  bg: string;
  theme: RenderTheme;
  config: CanvasLayoutConfig;
  gutterWidthOverride?: number; // Use this width instead of calculating from line count
}): LayoutResult {
  const { ctx, tokenLines, config, theme } = opts;

  ctx.font = `${config.fontSize}px ${config.fontFamily}`;
  ctx.textBaseline = "top";

  const charW = measureCharWidth(ctx);
  const gutterEnabled = config.showLineNumbers;

  // Use override if provided, otherwise calculate from line count
  let gutterWidth: number;
  if (opts.gutterWidthOverride !== undefined) {
    gutterWidth = opts.gutterWidthOverride;
  } else if (gutterEnabled) {
    const lineCount = tokenLines.length;
    const lastLineNumber = config.startLine + Math.max(0, lineCount - 1);
    const digits = String(lastLineNumber).length;
    gutterWidth = Math.ceil(digits * charW + GUTTER_PADDING * 2);
  } else {
    gutterWidth = 0;
  }

  const fg = theme === "dark" ? "#e5e7eb" : "#111827";
  const lineNoColor = theme === "dark" ? "#94a3b8" : "#6b7280";
  const dividerColor = theme === "dark" ? "rgba(148,163,184,0.35)" : "rgba(107,114,128,0.35)";

  const tokens: LaidToken[] = [];
  let globalIndex = 0;

  for (let i = 0; i < tokenLines.length; i++) {
    const line = tokenLines[i]!;
    let col = 0;

    const y = config.paddingY + i * config.lineHeight;
    const x0 = config.paddingX + gutterWidth + (gutterEnabled ? 12 : 0);

    for (const t of line.tokens) {
      const content = t.content.replace(/\t/g, "  ");
      const w = content.length * charW;
      tokens.push({
        key: `${content}#${globalIndex++}`,
        content,
        color: t.color,
        x: x0 + col * charW,
        y,
        w,
        h: config.lineHeight,
      });
      col += content.length;
    }
  }

  return {
    tokens,
    bg: opts.bg,
    fg,
    gutter: {
      enabled: gutterEnabled,
      width: gutterWidth,
      color: "transparent",
      dividerColor,
      textColor: lineNoColor,
    },
    tokenLineCount: tokenLines.length,
  };
}
