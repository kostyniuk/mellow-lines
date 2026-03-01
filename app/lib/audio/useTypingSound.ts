"use client";

import { useEffect, useRef } from "react";
import { getTypingPhase } from "../typing/isInTypingTransition";
import { computeCharWeights, totalWeight, charsForWeightedProgress } from "../typing/smartWeights";
import type { TimelineInfo } from "../magicMove/types";

type TypingMode = {
  mellow: "/typing-mellow.mp3";
  quiet: "/typing-quiet.mp3";
  standard: "/typing.mp3";
};

type TypingModeFiles = TypingMode[keyof TypingMode];

export const TYPING_SOUND_FILE: TypingModeFiles = "/typing-mellow.mp3";

/** Duration in ms to pause the sound when the cursor moves to a new line. */
const LINE_PAUSE_MS = 600;

/**
 * Returns true when the next character to be typed is a newline,
 * meaning the visible content of the current line is complete.
 * Mirrors the exact reveal logic in animateTyping's typeFromScratch.
 */
function isAtLineEnd(progress: number, code: string, naturalFlow: boolean): boolean {
  const totalChars = code.length;
  if (totalChars === 0) return false;

  let revealed: number;
  if (naturalFlow) {
    const weights = computeCharWeights(code);
    const tw = totalWeight(weights);
    revealed = charsForWeightedProgress(weights, progress * tw);
  } else {
    revealed = Math.floor(progress * totalChars);
  }

  if (revealed >= totalChars) return false;
  return code[revealed] === "\n";
}

export function useTypingSound(opts: {
  enabled: boolean;
  isPlaying: boolean;
  playheadMs: number;
  timeline: TimelineInfo;
  effectiveStepCount: number;
  transitionMs: number;
  typingDurations: number[] | null;
  animationType: string;
  effectiveStepCodes: string[];
  naturalFlow: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isAudioPlayingRef = useRef(false);
  const wasAtLineEndRef = useRef(false);
  const linePauseUntilRef = useRef(0);

  // Create audio element once
  useEffect(() => {
    const audio = new Audio(TYPING_SOUND_FILE);
    audio.loop = true;
    audio.volume = 0.5;
    audio.preload = "auto";
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  // Compute phase and sync audio play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const phase = getTypingPhase({
      playheadMs: opts.playheadMs,
      timeline: opts.timeline,
      stepCount: opts.effectiveStepCount,
      transitionMs: opts.transitionMs,
      typingDurations: opts.typingDurations,
    });

    let inLinePause = false;
    if (phase.isTyping) {
      const toCode = opts.effectiveStepCodes[phase.transitionIndex + 1] ?? "";
      const atLineEnd = isAtLineEnd(phase.progress, toCode, opts.naturalFlow);

      if (atLineEnd && !wasAtLineEndRef.current) {
        linePauseUntilRef.current = performance.now() + LINE_PAUSE_MS;
      }
      wasAtLineEndRef.current = atLineEnd;

      inLinePause = atLineEnd || performance.now() < linePauseUntilRef.current;
    } else {
      wasAtLineEndRef.current = false;
      linePauseUntilRef.current = 0;
    }

    const shouldPlay =
      opts.enabled &&
      opts.isPlaying &&
      opts.animationType === "typing" &&
      phase.isTyping &&
      !inLinePause;

    if (shouldPlay && !isAudioPlayingRef.current) {
      audio.play().catch(() => {});
      isAudioPlayingRef.current = true;
    } else if (!shouldPlay && isAudioPlayingRef.current) {
      audio.pause();
      isAudioPlayingRef.current = false;
    }
  }, [opts.enabled, opts.isPlaying, opts.playheadMs, opts.timeline, opts.effectiveStepCount, opts.transitionMs, opts.typingDurations, opts.animationType, opts.effectiveStepCodes, opts.naturalFlow]);
}
