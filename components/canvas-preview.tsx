"use client";

import { useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AnimationType } from "@/app/lib/magicMove/types";
import type { RenderTheme } from "@/app/lib/magicMove/codeLayout";
import { cn } from "@/lib/utils";

interface CanvasPreviewProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  layoutError: string | null;
  onDismissError: () => void;
  isLoading?: boolean;
  filename: string;
  onFilenameChange: (value: string) => void;
  animationType: AnimationType;
  onAnimationTypeChange: (value: AnimationType) => void;
  naturalFlow: boolean;
  onNaturalFlowChange: (value: boolean) => void;
  themeVariant: RenderTheme;
}

export function CanvasPreview({
  canvasRef,
  layoutError,
  onDismissError,
  isLoading,
  filename,
  onFilenameChange,
  animationType,
  onAnimationTypeChange,
  naturalFlow,
  onNaturalFlowChange,
  themeVariant,
}: CanvasPreviewProps) {
  const hasShownRef = useRef(false);
  const shouldAnimate = !isLoading && !hasShownRef.current;

  if (!isLoading) {
    hasShownRef.current = true;
  }

  return (
    <div className="flex-1 relative min-h-0 flex flex-col">
      {layoutError && (
        <div className="absolute top-4 left-4 right-4 z-50 bg-destructive/10 text-destructive border border-destructive/20 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
          <span>{layoutError}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 hover:bg-destructive/20"
            onClick={onDismissError}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-auto relative flex items-center justify-center p-8 bg-[url('/grid-pattern.svg')] dark:bg-[url('/grid-pattern-dark.svg')] bg-center">
        {!isLoading && (
          <div
            className={`relative shadow-2xl rounded-lg overflow-hidden ring-1 ring-black/5 dark:ring-white/10 bg-zinc-950 ${shouldAnimate ? "opacity-0 animate-[fadeIn_0.3s_ease-in-out_forwards]" : "opacity-100"}`}
          >
            <canvas ref={canvasRef} className="block" />
            {/* Filename input overlay - displays title in preview */}
            <div className="absolute top-0 left-0 right-0 h-10 flex items-center justify-center">
              <input
                type="text"
                value={filename}
                onChange={(e) => onFilenameChange(e.target.value)}
                className={cn(
                  "bg-transparent text-center text-sm border-none outline-none focus:ring-0 focus:outline-none w-48 px-2 py-1 cursor-text",
                  themeVariant === "dark"
                    ? "text-white/80 placeholder:text-white/25"
                    : "text-black/80 placeholder:text-black/25"
                )}
                placeholder="Untitled-1"
              />
            </div>
          </div>
        )}

        {/* Floating animation mode pill */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 rounded-full bg-background/60 backdrop-blur-xl shadow-lg ring-1 ring-black/[0.08] dark:ring-white/[0.08] px-1.5 py-1.5">
          <span className="text-xs text-muted-foreground pl-2 whitespace-nowrap">Animation:</span>
          <Tabs
            value={animationType}
            onValueChange={(v) => onAnimationTypeChange(v as AnimationType)}
            className="w-fit"
          >
            <TabsList variant="transparent">
              <TabsTrigger value="typing">Typing</TabsTrigger>
              <TabsTrigger value="token-flow">Token Flow</TabsTrigger>
            </TabsList>
          </Tabs>

          {animationType === "typing" && (
            <>
              <div className="w-px h-4 bg-border/50" />
              <div className="flex items-center gap-1.5 pr-1">
                <Label htmlFor="natural-flow-pill" className="text-xs whitespace-nowrap text-muted-foreground">
                  Natural flow
                </Label>
                <Switch
                  id="natural-flow-pill"
                  checked={naturalFlow}
                  onCheckedChange={onNaturalFlowChange}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
