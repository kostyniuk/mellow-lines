import type { TimelineInfo } from "../magicMove/types";

export type TypingPhase =
  | { isTyping: false }
  | { isTyping: true; transitionIndex: number; progress: number };

/**
 * Determines whether the playhead is currently inside a typing transition
 * (as opposed to a hold period). Mirrors the phase-walking logic in
 * renderTimeline (page.tsx). Returns the transition index and progress
 * when inside a transition.
 */
export function getTypingPhase(opts: {
  playheadMs: number;
  timeline: TimelineInfo;
  stepCount: number;
  transitionMs: number;
  typingDurations: number[] | null;
}): TypingPhase {
  const { playheadMs, timeline, stepCount, transitionMs, typingDurations } = opts;

  if (stepCount <= 1) return { isTyping: false };

  const clampMs = Math.max(0, Math.min(timeline.totalMs, playheadMs));
  let t = clampMs;

  if (t < timeline.startHold) return { isTyping: false };
  t -= timeline.startHold;

  const transitions = stepCount - 1;
  for (let i = 0; i < transitions; i++) {
    const tDur = typingDurations ? typingDurations[i] : transitionMs;

    if (t <= tDur) {
      const progress = tDur <= 0 ? 1 : t / tDur;
      return { isTyping: true, transitionIndex: i, progress };
    }
    t -= tDur;

    if (t <= timeline.betweenHold) return { isTyping: false };
    t -= timeline.betweenHold;
  }

  return { isTyping: false };
}
