"use client";

import { useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import type { AnimationType, TokenFlowPreset } from "@/app/lib/magicMove/types";
import type { RenderTheme } from "@/app/lib/magicMove/codeLayout";
import {
  getAllBackgroundThemes,
  getBackgroundThemeById,
} from "@/app/lib/magicMove/backgroundThemes";
import { cn } from "@/lib/utils";

const PADDING_PRESETS = [48, 64, 128] as const;
const TOKEN_FLOW_PRESET_META: Record<TokenFlowPreset, {
  summary: string;
}> = {
  precise: {
    summary: "Quiet, exact motion for technical walkthroughs where clarity matters most.",
  },
  studio: {
    summary: "Balanced default with smooth, polished motion that feels premium without distraction.",
  },
  cinematic: {
    summary: "Broader, expressive motion with emphasis on demos, showcases, and storytelling.",
  },
};

interface CanvasPreviewProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  layoutError: string | null;
  onDismissError: () => void;
  isLoading?: boolean;
  filename: string;
  onFilenameChange: (value: string) => void;
  animationType: AnimationType;
  onAnimationTypeChange: (value: AnimationType) => void;
  tokenFlowPreset: TokenFlowPreset;
  onTokenFlowPresetChange: (value: TokenFlowPreset) => void;
  naturalFlow: boolean;
  onNaturalFlowChange: (value: boolean) => void;
  typingWpm: number;
  onTypingWpmChange: (value: number) => void;
  transitionMs: number;
  onTransitionMsChange: (value: number) => void;
  themeVariant: RenderTheme;
  backgroundPadding: number;
  backgroundThemeId: string;
  onBackgroundThemeIdChange: (id: string) => void;
  backgroundPaddingPx: number;
  onBackgroundPaddingPxChange: (value: number) => void;
  children?: React.ReactNode;
}

const groupedBackgroundThemes = (() => {
  const themes = getAllBackgroundThemes();
  const orgIds = themes.filter((t) => t.group === "org").map((t) => t.id);
  const gradientIds = themes.filter((t) => t.group !== "org").map((t) => t.id);
  return [
    { label: "Default", items: ["none"] },
    { label: "Orgs", items: orgIds },
    { label: "Gradient", items: gradientIds },
  ];
})();

function backgroundThemeLabel(id: string): string {
  if (id === "none") return "None";
  return getBackgroundThemeById(id)?.name ?? id;
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
  tokenFlowPreset,
  onTokenFlowPresetChange,
  naturalFlow,
  onNaturalFlowChange,
  typingWpm,
  onTypingWpmChange,
  transitionMs,
  onTransitionMsChange,
  themeVariant,
  backgroundPadding,
  backgroundThemeId,
  onBackgroundThemeIdChange,
  backgroundPaddingPx,
  onBackgroundPaddingPxChange,
  children,
}: CanvasPreviewProps) {
  const activeBackgroundTheme = getBackgroundThemeById(backgroundThemeId);
  const activeTokenFlowPreset = TOKEN_FLOW_PRESET_META[tokenFlowPreset];
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

      <div className="flex-1 overflow-auto relative flex items-center justify-center p-4 pb-40 sm:p-8 sm:pb-24 bg-[url('/grid-pattern.svg')] dark:bg-[url('/grid-pattern-dark.svg')] bg-center">
        {!isLoading && (
          <div
            className={cn(
              "relative rounded-lg overflow-hidden",
              backgroundPadding > 0
                ? ""
                : "shadow-2xl ring-1 ring-black/5 dark:ring-white/10 bg-zinc-950",
              shouldAnimate ? "opacity-0 animate-[fadeIn_0.3s_ease-in-out_forwards]" : "opacity-100",
            )}
          >
            <canvas ref={canvasRef} className="block" />
            {/* Filename input overlay - displays title in preview */}
            <div
              className="absolute left-0 right-0 h-10 flex items-center justify-center"
              style={{ top: backgroundPadding }}
            >
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
                placeholder="Title ✨"
              />
            </div>
          </div>
        )}

        <div className="absolute bottom-[6.75rem] left-1/2 -translate-x-1/2 z-10 flex w-[min(calc(100%-1.5rem),56rem)] flex-col items-center gap-2 sm:bottom-25 sm:w-[min(calc(100%-2rem),56rem)]">
          {/* Floating settings pill */}
          <div className="flex max-w-full flex-wrap items-center justify-center gap-2 rounded-2xl bg-background/60 px-2.5 py-2 sm:px-3 sm:py-1.5 shadow-lg ring-1 ring-black/[0.08] backdrop-blur-xl dark:ring-white/[0.08]">
            <span className="pl-1 text-sm whitespace-nowrap text-foreground/70">Animation:</span>
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
                <div className="hidden h-4 w-px bg-border/50 sm:block" />
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="natural-flow-pill" className="text-sm whitespace-nowrap text-foreground/70">
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

            <div className="hidden h-4 w-px bg-border/50 sm:block" />

            {animationType === "typing" ? (
              <div className="flex items-center gap-1.5">
                <Label className="text-sm whitespace-nowrap text-foreground/70">
                  Speed: {typingWpm} WPM
                </Label>
                <Slider
                  value={[typingWpm]}
                  min={30}
                  max={600}
                  step={10}
                  onValueChange={([v]) => onTypingWpmChange(v)}
                  className="w-28"
                />
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Label className="text-sm whitespace-nowrap text-foreground/70">
                  Transition: {(transitionMs / 1000).toFixed(1)}s
                </Label>
                <Slider
                  value={[transitionMs]}
                  min={100}
                  max={5000}
                  step={100}
                  onValueChange={([v]) => onTransitionMsChange(v)}
                  className="w-28"
                />
              </div>
            )}

            <div className="hidden h-4 w-px bg-border/50 sm:block" />

            <span className="text-sm whitespace-nowrap text-foreground/70">Background:</span>
            <Combobox
              items={groupedBackgroundThemes}
              value={backgroundThemeId}
              onValueChange={(v) => v && onBackgroundThemeIdChange(v as string)}
              itemToStringLabel={(value) => backgroundThemeLabel(value as string)}
            >
              <ComboboxTrigger
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-1.5 transition-colors hover:bg-accent/50"
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 shrink-0 rounded-full ring-1",
                    activeBackgroundTheme
                      ? "ring-black/10"
                      : "border border-dashed border-foreground/30 bg-transparent ring-foreground/20",
                  )}
                  style={activeBackgroundTheme ? { backgroundColor: activeBackgroundTheme.previewColor } : undefined}
                />
              </ComboboxTrigger>
              <ComboboxContent className="min-w-48">
                <ComboboxInput
                  placeholder="Search themes..."
                  className="h-7 text-sm"
                  showTrigger={false}
                />
                <ComboboxEmpty>No themes found</ComboboxEmpty>
                <ComboboxList>
                  {(group, index) => (
                    <ComboboxGroup key={group.label} items={group.items}>
                      <ComboboxLabel>{group.label}</ComboboxLabel>
                      <ComboboxCollection>
                        {(item) => {
                          const bgTheme = getBackgroundThemeById(item);
                          return (
                            <ComboboxItem key={item} value={item}>
                              <span className="flex items-center gap-2">
                                {bgTheme ? (
                                  <span
                                    className="inline-block h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10"
                                    style={{ backgroundColor: bgTheme.previewColor }}
                                  />
                                ) : (
                                  <span className="inline-block h-3 w-3 shrink-0 rounded-full bg-transparent ring-1 ring-black/10 dark:ring-white/10" />
                                )}
                                {backgroundThemeLabel(item)}
                              </span>
                            </ComboboxItem>
                          );
                        }}
                      </ComboboxCollection>
                      {index < groupedBackgroundThemes.length - 1 && <ComboboxSeparator />}
                    </ComboboxGroup>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>

            {backgroundThemeId !== "none" && (
              <>
                <div className="hidden h-4 w-px bg-border/50 sm:block" />
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className="text-sm text-foreground/70">Padding:</span>
                  <Tabs
                    value={String(backgroundPaddingPx)}
                    onValueChange={(v) => onBackgroundPaddingPxChange(Number(v))}
                    className="w-fit"
                  >
                    <TabsList variant="transparent">
                      {PADDING_PRESETS.map((px) => (
                        <TabsTrigger key={px} value={String(px)}>
                          {px}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
              </>
            )}
          </div>

          {animationType === "token-flow" && (
            <div className="w-full max-w-full rounded-2xl border border-black/[0.06] bg-background/72 px-3 py-1.5 shadow-lg ring-1 ring-white/30 backdrop-blur-xl dark:border-white/[0.08] dark:ring-white/[0.06] sm:w-auto">
              <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:flex-nowrap sm:items-center sm:gap-5">
                <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                  <span className="text-sm whitespace-nowrap text-foreground/70">
                    Profile:
                  </span>
                  <Tabs
                    value={tokenFlowPreset}
                    onValueChange={(v) => onTokenFlowPresetChange(v as TokenFlowPreset)}
                    className="w-fit"
                  >
                    <TabsList variant="transparent">
                      <TabsTrigger value="precise">
                        <span className="inline-flex items-center gap-1">
                          <span>Precise</span>
                          {tokenFlowPreset === "precise" && (
                            <span className="text-red-500" aria-hidden="true">
                              *
                            </span>
                          )}
                        </span>
                      </TabsTrigger>
                      <TabsTrigger value="studio">
                        <span className="inline-flex items-center gap-1">
                          <span>Studio</span>
                          {tokenFlowPreset === "studio" && (
                            <span className="text-red-500" aria-hidden="true">
                              *
                            </span>
                          )}
                        </span>
                      </TabsTrigger>
                      <TabsTrigger value="cinematic">
                        <span className="inline-flex items-center gap-1">
                          <span>Cinematic</span>
                          {tokenFlowPreset === "cinematic" && (
                            <span className="text-red-500" aria-hidden="true">
                              *
                            </span>
                          )}
                        </span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="hidden h-4 w-px shrink-0 bg-border/50 sm:block" />

                <p className="min-w-0 text-sm leading-6 text-foreground/70 sm:flex-1">
                  <span className="font-semibold text-red-500" aria-hidden="true">
                    *
                  </span>{" "}
                  {activeTokenFlowPreset.summary}
                </p>
              </div>
            </div>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}
