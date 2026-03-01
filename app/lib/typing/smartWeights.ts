// ── Per-character weight model for natural typing pauses ─────────────
//
// Instead of each character costing 1 unit of progress, structural
// characters (newlines, semicolons, braces, etc.) get higher weights.
// This redistributes time within the existing duration — no total
// duration change — making the animation feel like real typing.

/** Weight rules (see plan for rationale) */
const W_NEWLINE = 3.5;
const W_SEMICOLON = 2.5;
const W_BRACE = 3.0;
const W_COLON = 2.0;
const W_COMMA = 1.8;
const W_PAREN = 1.3;
const W_COMMENT_SLASH = 2.0;
const W_BEFORE_ASSIGN = 1.5;
const W_DEFAULT = 1.0;

/**
 * Assign a weight to every character in `code`.
 * Higher weight → longer visible pause at that character.
 */
export function computeCharWeights(code: string): number[] {
  const len = code.length;
  const weights = new Array<number>(len);

  for (let i = 0; i < len; i++) {
    const ch = code[i];

    if (ch === "\n") {
      weights[i] = W_NEWLINE;
      continue;
    }
    if (ch === ";") {
      weights[i] = W_SEMICOLON;
      continue;
    }
    if (ch === "{" || ch === "}") {
      weights[i] = W_BRACE;
      continue;
    }
    if (ch === ":") {
      weights[i] = W_COLON;
      continue;
    }
    if (ch === ",") {
      weights[i] = W_COMMA;
      continue;
    }
    if (ch === "(" || ch === ")") {
      weights[i] = W_PAREN;
      continue;
    }

    // First `/` of a `//` comment
    if (ch === "/" && i + 1 < len && code[i + 1] === "/") {
      weights[i] = W_COMMENT_SLASH;
      continue;
    }

    // Character immediately before a single `=` (assignment, not ==, !=, <=, >=)
    if (
      i + 1 < len &&
      code[i + 1] === "=" &&
      (i + 2 >= len || code[i + 2] !== "=") && // not ==
      ch !== "!" && ch !== "<" && ch !== ">" && ch !== "=" // not !=, <=, >=, ==
    ) {
      weights[i] = W_BEFORE_ASSIGN;
      continue;
    }

    weights[i] = W_DEFAULT;
  }

  return weights;
}

/** Sum all weights. */
export function totalWeight(weights: number[]): number {
  let sum = 0;
  for (let i = 0; i < weights.length; i++) sum += weights[i];
  return sum;
}

/**
 * Inverse mapping: given a target cumulative weight, return the number
 * of characters to reveal.
 *
 * When `targetWeight` equals `totalWeight(weights)`, returns `weights.length`.
 */
export function charsForWeightedProgress(
  weights: number[],
  targetWeight: number,
): number {
  let cumulative = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (cumulative >= targetWeight) return i + 1;
  }
  return weights.length;
}
