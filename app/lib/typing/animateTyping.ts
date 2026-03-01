import type { LaidToken, LayoutResult } from "../magicMove/codeLayout";
import { computeCharWeights, totalWeight, charsForWeightedProgress } from "./smartWeights";

type AnimatedToken = {
  content: string;
  color: string;
  x: number;
  y: number;
  opacity: number;
};

type TypingResult = {
  tokens: AnimatedToken[];
  cursor: { x: number; y: number } | null;
  visibleLineCount: number;
};

type DiffOp =
  | { type: "keep"; fromLine: number; toLine: number }
  | { type: "delete"; fromLine: number }
  | { type: "insert"; toLine: number };

// ── Line-level LCS diff ──────────────────────────────────────────────

function diffLines(a: string[], b: string[]): DiffOp[] {
  const n = a.length;
  const m = b.length;

  // Build LCS table
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array.from({ length: m + 1 }, () => 0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to produce ops
  const ops: DiffOp[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      ops.push({ type: "keep", fromLine: i - 1, toLine: j - 1 });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.push({ type: "insert", toLine: j - 1 });
      j--;
    } else {
      ops.push({ type: "delete", fromLine: i - 1 });
      i--;
    }
  }

  ops.reverse();
  return ops;
}

// ── Helpers ──────────────────────────────────────────────────────────

function groupTokensByLine(
  tokens: LaidToken[],
  paddingY: number,
  lineHeight: number,
): Map<number, LaidToken[]> {
  const map = new Map<number, LaidToken[]>();
  for (const t of tokens) {
    const line = Math.round((t.y - paddingY) / lineHeight);
    let arr = map.get(line);
    if (!arr) {
      arr = [];
      map.set(line, arr);
    }
    arr.push(t);
  }
  return map;
}

function charsInTokens(tokens: LaidToken[]): number {
  let count = 0;
  for (const t of tokens) count += t.content.length;
  return count;
}

function leadingWhitespaceLength(s: string): number {
  let i = 0;
  while (i < s.length && (s[i] === " " || s[i] === "\t")) i++;
  return i;
}

function revealTokens(
  tokens: LaidToken[],
  revealChars: number,
  charWidth: number,
  atomicLeadingWhitespace: boolean = false,
): { revealed: AnimatedToken[]; cursorX: number; cursorY: number } {
  const revealed: AnimatedToken[] = [];
  let remaining = revealChars;
  let cursorX = tokens.length > 0 ? tokens[0].x : 0;
  let cursorY = tokens.length > 0 ? tokens[0].y : 0;
  let leadingWsDone = !atomicLeadingWhitespace;

  for (const t of tokens) {
    // Detect leading whitespace for atomic reveal
    let wsChars = 0;
    if (!leadingWsDone) {
      wsChars = leadingWhitespaceLength(t.content);
      if (wsChars < t.content.length) leadingWsDone = true;
    }

    // Leading whitespace must be revealed atomically — need full ws budget
    if (wsChars > 0 && remaining < wsChars) {
      break;
    }

    if (remaining <= 0) break;
    cursorY = t.y;
    if (remaining >= t.content.length) {
      revealed.push({ content: t.content, color: t.color, x: t.x, y: t.y, opacity: 1 });
      cursorX = t.x + t.content.length * charWidth;
      remaining -= t.content.length;
    } else {
      const partial = t.content.slice(0, remaining);
      revealed.push({ content: partial, color: t.color, x: t.x, y: t.y, opacity: 1 });
      cursorX = t.x + remaining * charWidth;
      remaining = 0;
    }
  }

  return { revealed, cursorX, cursorY };
}

function hideTokensFromEnd(
  tokens: LaidToken[],
  hideChars: number,
  charWidth: number,
): { visible: AnimatedToken[]; cursorX: number; cursorY: number } {
  // Total chars in these tokens
  const total = charsInTokens(tokens);
  const showChars = Math.max(0, total - hideChars);
  const result = revealTokens(tokens, showChars, charWidth);
  return { visible: result.revealed, cursorX: result.cursorX, cursorY: result.cursorY };
}

function fullTokens(tokens: LaidToken[]): AnimatedToken[] {
  return tokens.map((t) => ({
    content: t.content,
    color: t.color,
    x: t.x,
    y: t.y,
    opacity: 1,
  }));
}

// ── Diff memoization cache ───────────────────────────────────────────

let cachedDiffKey = "";
let cachedDiffResult: DiffOp[] = [];

function getCachedDiff(fromCode: string, toCode: string): DiffOp[] {
  const key = fromCode + "\0" + toCode;
  if (key !== cachedDiffKey) {
    cachedDiffKey = key;
    cachedDiffResult = diffLines(fromCode.split("\n"), toCode.split("\n"));
  }
  return cachedDiffResult;
}

// ── Weight memoization cache ─────────────────────────────────────────

let cachedWeightsKey = "";
let cachedWeightsResult: number[] = [];

function getCachedWeights(code: string): number[] {
  if (code !== cachedWeightsKey) {
    cachedWeightsKey = code;
    cachedWeightsResult = computeCharWeights(code);
  }
  return cachedWeightsResult;
}

// ── Constants ─────────────────────────────────────────────────────────

// Deletions are weighted less so they happen faster than insertions.
// A weight of 0.3 means deleting a line takes ~1/3 the time of typing one.
export const DELETE_WEIGHT = 0.3;

// ── Changed character count (for computing per-transition duration) ───

export function computeChangedChars(fromCode: string, toCode: string): number {
  if (fromCode === "") {
    return toCode.split("\n").reduce((sum, line) => sum + (line.trim().length > 0 ? line.length : 0), 0) || 1;
  }
  if (toCode === "") {
    return fromCode.split("\n").reduce((sum, line) => sum + (line.trim().length > 0 ? line.length * DELETE_WEIGHT : 0), 0) || 1;
  }
  const ops = getCachedDiff(fromCode, toCode);
  const fromLines = fromCode.split("\n");
  const toLines = toCode.split("\n");
  let count = 0;
  for (const op of ops) {
    if (op.type === "delete" && fromLines[op.fromLine].trim().length > 0)
      count += fromLines[op.fromLine].length * DELETE_WEIGHT;
    if (op.type === "insert" && toLines[op.toLine].trim().length > 0)
      count += toLines[op.toLine].length;
  }
  return Math.max(1, count);
}

// ── Main animation function ──────────────────────────────────────────

export function animateTyping(opts: {
  from: LayoutResult | null;
  to: LayoutResult;
  fromCode: string;
  toCode: string;
  progress: number;
  charWidth: number;
  lineHeight: number;
  paddingX: number;
  paddingY: number;
  gutterWidth: number;
  naturalFlow?: boolean;
}): TypingResult {
  // Use linear progress for typing — constant typing speed feels more natural
  const p = Math.max(0, Math.min(1, opts.progress));

  if (opts.from === null || opts.fromCode === "") {
    return typeFromScratch(opts.to, opts.toCode, p, opts);
  }

  return typeDiff(opts.from, opts.to, opts.fromCode, opts.toCode, p, opts);
}

// ── Type from scratch ────────────────────────────────────────────────

function typeFromScratch(
  to: LayoutResult,
  toCode: string,
  progress: number,
  opts: { charWidth: number; lineHeight: number; paddingY: number; paddingX: number; gutterWidth: number; naturalFlow?: boolean },
): TypingResult {
  const totalChars = toCode.length;
  let revealCount: number;

  if (opts.naturalFlow) {
    const weights = getCachedWeights(toCode);
    const tw = totalWeight(weights);
    revealCount = charsForWeightedProgress(weights, progress * tw);
  } else {
    revealCount = Math.floor(progress * totalChars);
  }

  // Walk tokens in order, revealing characters
  const tokens: AnimatedToken[] = [];
  let remaining = revealCount;
  // Start cursor at the first token's position (respects indentation)
  let cursorX = to.tokens.length > 0 ? to.tokens[0].x : opts.paddingX + opts.gutterWidth + (opts.gutterWidth > 0 ? 12 : 0);
  let cursorY = opts.paddingY;
  let maxLineIndex = 0;
  let lastLineIndex = -1;
  let leadingWsDone = false;

  for (let ti = 0; ti < to.tokens.length; ti++) {
    const t = to.tokens[ti];

    const lineIndex = Math.round((t.y - opts.paddingY) / opts.lineHeight);

    // Reset leading whitespace tracking on new line
    if (lineIndex !== lastLineIndex) {
      lastLineIndex = lineIndex;
      leadingWsDone = false;
    }

    // Detect leading whitespace for atomic reveal
    let wsChars = 0;
    if (!leadingWsDone) {
      wsChars = leadingWhitespaceLength(t.content);
      if (wsChars < t.content.length) leadingWsDone = true;
    }

    // Leading whitespace must be revealed atomically — need full ws budget
    if (wsChars > 0 && remaining < wsChars) {
      break;
    }

    if (remaining <= 0) break;

    // Only count lines that are actually revealed
    maxLineIndex = Math.max(maxLineIndex, lineIndex);

    if (remaining >= t.content.length) {
      tokens.push({ content: t.content, color: t.color, x: t.x, y: t.y, opacity: 1 });
      cursorX = t.x + t.content.length * opts.charWidth;
      cursorY = t.y;
      remaining -= t.content.length;

      // Account for newline character between lines
      const nextToken = to.tokens[ti + 1];
      if (nextToken) {
        const nextLine = Math.round((nextToken.y - opts.paddingY) / opts.lineHeight);
        if (nextLine > lineIndex && remaining > 0) {
          remaining--; // consume the \n character
        }
      }
    } else {
      const partial = t.content.slice(0, remaining);
      tokens.push({ content: partial, color: t.color, x: t.x, y: t.y, opacity: 1 });
      cursorX = t.x + remaining * opts.charWidth;
      cursorY = t.y;
      remaining = 0;
    }
  }

  return {
    tokens,
    cursor: { x: cursorX, y: cursorY },
    visibleLineCount: maxLineIndex + 1,
  };
}

// ── Diff-based typing ────────────────────────────────────────────────

function typeDiff(
  from: LayoutResult,
  to: LayoutResult,
  fromCode: string,
  toCode: string,
  progress: number,
  opts: { charWidth: number; lineHeight: number; paddingY: number; paddingX: number; gutterWidth: number; naturalFlow?: boolean },
): TypingResult {
  const ops = getCachedDiff(fromCode, toCode);
  const fromLines = fromCode.split("\n");
  const toLines = toCode.split("\n");

  const fromTokensByLine = groupTokensByLine(from.tokens, opts.paddingY, opts.lineHeight);
  const toTokensByLine = groupTokensByLine(to.tokens, opts.paddingY, opts.lineHeight);

  // Pre-compute per-line weights for inserts when naturalFlow is enabled
  const lineWeightsMap = new Map<number, number[]>();
  if (opts.naturalFlow) {
    for (const op of ops) {
      if (op.type === "insert") {
        lineWeightsMap.set(op.toLine, computeCharWeights(toLines[op.toLine]));
      }
    }
  }

  // Count weighted total across all ops in document order
  let totalWeighted = 0;
  for (const op of ops) {
    if (op.type === "delete") totalWeighted += fromLines[op.fromLine].length * DELETE_WEIGHT;
    if (op.type === "insert") {
      if (opts.naturalFlow) {
        totalWeighted += totalWeight(lineWeightsMap.get(op.toLine)!);
      } else {
        totalWeighted += toLines[op.toLine].length;
      }
    }
  }

  // If no changes, just show the "to" state
  if (totalWeighted === 0) {
    return {
      tokens: fullTokens(to.tokens),
      cursor: null,
      visibleLineCount: to.tokenLineCount,
    };
  }

  // Single weighted progress counter — process ops in document order
  const processedWeighted = progress * totalWeighted;

  const allTokens: AnimatedToken[] = [];
  const firstToken = from.tokens[0] ?? to.tokens[0];
  let cursorX = firstToken ? firstToken.x : opts.paddingX + opts.gutterWidth + (opts.gutterWidth > 0 ? 12 : 0);
  let cursorY = opts.paddingY;

  type VisibleLine = {
    tokens: LaidToken[];
    source: "from" | "to";
    partialReveal?: number;
    partialHide?: number;
  };

  const visibleLines: VisibleLine[] = [];
  let weightedSoFar = 0;

  for (const op of ops) {
    if (op.type === "keep") {
      const tokens = toTokensByLine.get(op.toLine) ?? [];
      visibleLines.push({ tokens, source: "to" });
    } else if (op.type === "delete") {
      const lineChars = fromLines[op.fromLine].length;
      const lineCost = lineChars * DELETE_WEIGHT;
      const lineTokens = fromTokensByLine.get(op.fromLine) ?? [];

      if (weightedSoFar + lineCost <= processedWeighted) {
        // Fully deleted — skip this line
        weightedSoFar += lineCost;
      } else if (weightedSoFar >= processedWeighted) {
        // Not reached yet — show full line
        visibleLines.push({ tokens: lineTokens, source: "from" });
      } else {
        // Partially deleted — map weighted progress back to char count
        const weightRemaining = processedWeighted - weightedSoFar;
        const charsDeleted = Math.floor(weightRemaining / DELETE_WEIGHT);
        visibleLines.push({ tokens: lineTokens, source: "from", partialHide: charsDeleted });
        weightedSoFar = processedWeighted;
      }
    } else if (op.type === "insert") {
      const lineTokens = toTokensByLine.get(op.toLine) ?? [];
      const lw = opts.naturalFlow ? lineWeightsMap.get(op.toLine) : undefined;
      const lineCost = lw ? totalWeight(lw) : toLines[op.toLine].length;

      if (weightedSoFar + lineCost <= processedWeighted) {
        // Fully inserted — show full line
        visibleLines.push({ tokens: lineTokens, source: "to" });
        weightedSoFar += lineCost;
      } else if (weightedSoFar >= processedWeighted) {
        // Not reached yet — don't show
      } else {
        // Partially inserted
        const weightRemaining = processedWeighted - weightedSoFar;
        const charsInserted = lw
          ? charsForWeightedProgress(lw, weightRemaining)
          : Math.floor(weightRemaining);
        visibleLines.push({ tokens: lineTokens, source: "to", partialReveal: charsInserted });
        weightedSoFar = processedWeighted;
      }
    }
  }

  // Position visible lines and build animated tokens
  for (let i = 0; i < visibleLines.length; i++) {
    const vl = visibleLines[i];
    const targetY = opts.paddingY + i * opts.lineHeight;

    if (vl.partialHide != null) {
      const result = hideTokensFromEnd(vl.tokens, vl.partialHide, opts.charWidth);
      for (const t of result.visible) {
        allTokens.push({ ...t, y: targetY });
      }
      cursorX = result.cursorX;
      cursorY = targetY;
    } else if (vl.partialReveal != null) {
      const result = revealTokens(vl.tokens, vl.partialReveal, opts.charWidth, true);
      for (const t of result.revealed) {
        allTokens.push({ ...t, y: targetY });
      }
      cursorX = result.cursorX;
      cursorY = targetY;
    } else {
      for (const t of vl.tokens) {
        allTokens.push({
          content: t.content,
          color: t.color,
          x: t.x,
          y: targetY,
          opacity: 1,
        });
      }
    }
  }

  return {
    tokens: allTokens,
    cursor: { x: cursorX, y: cursorY },
    visibleLineCount: visibleLines.length,
  };
}
