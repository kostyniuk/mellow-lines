"use client";

import { useState } from "react";
import { CodeEditor } from "./code-editor";
import type { ShikiThemeChoice } from "@/app/lib/magicMove/shikiHighlighter";
import { getThemeBgColor, getThemeVariant } from "@/app/lib/magicMove/shikiHighlighter";

interface StepEditorItemProps {
  index: number;
  code: string;
  onCodeChange: (code: string) => void;
  onRemove: () => void;
  canRemove: boolean;
  language: string;
  theme: ShikiThemeChoice;
}

export function StepEditorItem({
  index,
  code,
  onCodeChange,
  onRemove,
  canRemove,
  language,
  theme,
}: StepEditorItemProps) {
  const [closeHovered, setCloseHovered] = useState(false);
  const bgColor = getThemeBgColor(theme);
  const variant = getThemeVariant(theme);
  const dotColor = variant === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)";

  const lineCount = code.split("\n").length;
  const maxLines = 30;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="group relative shadow-2xl rounded-lg overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
        {/* Title bar */}
        <div
          className="flex items-center h-8 px-3.5"
          style={{ backgroundColor: bgColor }}
        >
          {/* macOS dots */}
          <div className="flex items-center gap-2">
            {canRemove ? (
              <button
                onClick={onRemove}
                onMouseEnter={() => setCloseHovered(true)}
                onMouseLeave={() => setCloseHovered(false)}
                className="relative flex items-center justify-center w-3 h-3 rounded-full"
                style={{ backgroundColor: closeHovered ? "#ff5f57" : dotColor }}
              >
                {closeHovered && (
                  <svg width="7" height="7" viewBox="0 0 7 7" fill="none" className="absolute">
                    <path d="M1 1L6 6M6 1L1 6" stroke="rgba(0,0,0,0.6)" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                )}
              </button>
            ) : (
              <span
                className="block w-3 h-3 rounded-full"
                style={{ backgroundColor: dotColor }}
              />
            )}
            <span
              className="block w-3 h-3 rounded-full"
              style={{ backgroundColor: dotColor }}
            />
            <span
              className="block w-3 h-3 rounded-full"
              style={{ backgroundColor: dotColor }}
            />
          </div>

          {/* Step label */}
          <span
            className="flex-1 text-center text-[11px] font-mono select-none"
            style={{ color: variant === "dark" ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)" }}
          >
            Step {index + 1}
          </span>

          {/* Spacer to balance layout */}
          <div className="w-3" />
        </div>

        {/* Code Editor */}
        <CodeEditor
          language={language}
          theme={theme}
          value={code}
          onChange={onCodeChange}
          placeholder={`// Enter code for step ${index + 1}...`}
          maxLines={maxLines}
        />
      </div>
      <span className="text-[10px] font-mono self-end p-[6px] text-muted-foreground/80">
        {lineCount}/{maxLines} lines
      </span>
    </div>
  );
}
