import type { LaidToken, LayoutResult } from "./codeLayout";
import { AnimationType } from "./types";

type AnimatedToken = {
  content: string;
  color: string;
  x: number;
  y: number;
  opacity: number;
};

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

const STAGGER_WINDOW = 0.5;

function staggeredOpacity(count: number, globalProgress: number, fadeIn: boolean): number[] {
  if (count === 0) return [];
  if (count === 1) return [fadeIn ? globalProgress : 1 - globalProgress];

  const opacities = new Array<number>(count);
  for (let i = 0; i < count; i++) {
    const startFraction = (i / (count - 1)) * (1 - STAGGER_WINDOW);
    const localP = clamp01((globalProgress - startFraction) / STAGGER_WINDOW);
    const easedLocal = easeInOutCubic(localP);
    opacities[i] = fadeIn ? easedLocal : 1 - easedLocal;
  }
  return opacities;
}

function buildOccurrenceKey(tokens: LaidToken[]) {
  const counts = new Map<string, number>();
  const keyed: { occKey: string; t: LaidToken }[] = [];
  for (const t of tokens) {
    const base = t.content;
    const n = (counts.get(base) ?? 0) + 1;
    counts.set(base, n);
    keyed.push({ occKey: `${base}#${n}`, t });
  }
  return keyed;
}

//Animates the layout of the code from the from layout to the to layout.
//Uses a cubic ease in out curve to interpolate the layout.
export function animateLayouts(opts: {
  from: LayoutResult;
  to: LayoutResult;
  progress: number; // 0..1
  type?: AnimationType;
}): { content: string; color: string; x: number; y: number; opacity: number }[] {
  const p = easeInOutCubic(clamp01(opts.progress));

  const animated: AnimatedToken[] = [];

  if (opts.type === "fade") {
    // For fade, tokens stay in their respective positions and cross-fade opacities
    const fadeOutOpacities = staggeredOpacity(opts.from.tokens.length, p, false);
    for (let i = 0; i < opts.from.tokens.length; i++) {
      animated.push({ ...opts.from.tokens[i], opacity: fadeOutOpacities[i] });
    }
    const fadeInOpacities = staggeredOpacity(opts.to.tokens.length, p, true);
    for (let i = 0; i < opts.to.tokens.length; i++) {
      animated.push({ ...opts.to.tokens[i], opacity: fadeInOpacities[i] });
    }
    return animated;
  }

  const fromKeyed = buildOccurrenceKey(opts.from.tokens);
  const toKeyed = buildOccurrenceKey(opts.to.tokens);

  const toMap = new Map<string, LaidToken>();
  for (const { occKey, t } of toKeyed) toMap.set(occKey, t);

  const usedTo = new Set<string>();
  const removedTokens: LaidToken[] = [];

  for (const { occKey, t: a } of fromKeyed) {
    const b = toMap.get(occKey);
    if (b) {
      usedTo.add(occKey);
      animated.push({
        content: b.content,
        color: b.color,
        x: a.x + (b.x - a.x) * p,
        y: a.y + (b.y - a.y) * p,
        opacity: 1,
      });
    } else {
      removedTokens.push(a);
    }
  }

  // Staggered fade out for removed tokens
  const removedOpacities = staggeredOpacity(removedTokens.length, p, false);
  for (let i = 0; i < removedTokens.length; i++) {
    const t = removedTokens[i];
    animated.push({
      content: t.content,
      color: t.color,
      x: t.x,
      y: t.y,
      opacity: removedOpacities[i],
    });
  }

  // Staggered fade in for new tokens
  const newTokens: LaidToken[] = [];
  for (const { occKey, t: b } of toKeyed) {
    if (usedTo.has(occKey)) continue;
    newTokens.push(b);
  }
  const newOpacities = staggeredOpacity(newTokens.length, p, true);
  for (let i = 0; i < newTokens.length; i++) {
    const t = newTokens[i];
    animated.push({
      content: t.content,
      color: t.color,
      x: t.x,
      y: t.y,
      opacity: newOpacities[i],
    });
  }

  return animated;
}
