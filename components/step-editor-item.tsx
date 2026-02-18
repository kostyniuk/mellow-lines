"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
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
  const bgColor = getThemeBgColor(theme);
  const variant = getThemeVariant(theme);
  const dotColor = variant === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)";

  return (
    <div className="group relative shadow-lg shadow-black/10 rounded-xl overflow-hidden ring-1 ring-white/[0.06]">
      {/* Title bar */}
      <div
        className="flex items-center h-9 px-3.5 rounded-t-xl"
        style={{ backgroundColor: bgColor }}
      >
        {/* macOS dots */}
        <div className="flex items-center gap-1">
          <span
            className="block w-3 h-3 rounded-full"
            style={{ backgroundColor: dotColor }}
          />
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

        {/* Delete button */}
        {canRemove ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive! hover:bg-transparent!"
            onClick={onRemove}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        ) : (
          <div className="w-5" />
        )}
      </div>

      {/* Code Editor */}
      <CodeEditor
        language={language}
        theme={theme}
        value={code}
        onChange={onCodeChange}
        placeholder={`// Enter code for step ${index + 1}...`}
        maxLines={30}
      />
    </div>
  );
}
