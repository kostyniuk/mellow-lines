"use client";

import { Layers, Plus, Settings2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
} from "@/components/ui/combobox";
import {
  AVAILABLE_LANGUAGES,
  getGroupedThemes,
  type ShikiThemeChoice,
} from "@/app/lib/magicMove/shikiHighlighter";
import { SettingsPopover } from "./settings-popover";
import { Badge } from "@/components/ui/badge";
import { FieldLabel } from "./ui/field";

interface StepsEditorHeaderProps {
  stepCount: number;
  selectedLang: string;
  onLangChange: (lang: string) => void;
  theme: ShikiThemeChoice;
  onThemeChange: (theme: ShikiThemeChoice) => void;
  showLineNumbers: boolean;
  onShowLineNumbersChange: (checked: boolean) => void;
  startLine: number;
  onStartLineChange: (value: number) => void;
  fps: number;
  onFpsChange: (value: number) => void;
  startHoldMs: number;
  onStartHoldMsChange: (value: number) => void;
  betweenHoldMs: number;
  onBetweenHoldMsChange: (value: number) => void;
  endHoldMs: number;
  onEndHoldMsChange: (value: number) => void;
  onAddStep: () => void;
  onClearSteps: () => void;
}

function formatName(name: string) {
  return name
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const groupedThemes = getGroupedThemes();

export function StepsEditorHeader({
  stepCount,
  selectedLang,
  onLangChange,
  theme,
  onThemeChange,
  showLineNumbers,
  onShowLineNumbersChange,
  startLine,
  onStartLineChange,
  fps,
  onFpsChange,
  startHoldMs,
  onStartHoldMsChange,
  betweenHoldMs,
  onBetweenHoldMsChange,
  endHoldMs,
  onEndHoldMsChange,
  onAddStep,
  onClearSteps,
}: StepsEditorHeaderProps) {
  return (
    <div className="flex-none border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex flex-col gap-2 px-3 py-2 sm:px-4 sm:py-1.5">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-muted-foreground" />
          <FieldLabel>Steps</FieldLabel>
          <Badge variant="secondary" className="font-mono mt-0.5">
            {stepCount}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <Combobox
          items={AVAILABLE_LANGUAGES}
          value={selectedLang}
          onValueChange={(v) => v && onLangChange(v as string)}
          itemToStringLabel={(value) => formatName(value as string)}
        >
          <ComboboxInput
            placeholder="Select a language..."
            className="h-8 w-[min(100%,12rem)] text-xs sm:w-[140px]"
          />
          <ComboboxContent>
            <ComboboxEmpty>No languages found</ComboboxEmpty>
            <ComboboxList>
              {(item) => (
                <ComboboxItem key={item} value={item}>
                  {formatName(item)}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>

        <Combobox
          items={groupedThemes}
          value={theme}
          onValueChange={(v) => v && onThemeChange(v as ShikiThemeChoice)}
          itemToStringLabel={(value) => formatName(value as string)}
        >
          <ComboboxInput
            placeholder="Select theme..."
            className="h-8 w-[min(100%,13rem)] text-xs sm:w-[180px]"
          />
          <ComboboxContent>
            <ComboboxEmpty>No themes found</ComboboxEmpty>
            <ComboboxList>
              {(group, index) => (
                <ComboboxGroup key={group.label} items={group.items}>
                  <ComboboxLabel>{group.label}</ComboboxLabel>
                  <ComboboxCollection>
                    {(item) => (
                      <ComboboxItem key={item} value={item}>
                        {formatName(item)}
                      </ComboboxItem>
                    )}
                  </ComboboxCollection>
                  {index < groupedThemes.length - 1 && <ComboboxSeparator />}
                </ComboboxGroup>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>

        <Separator orientation="vertical" className="hidden sm:block" />

        <Button
          onClick={onClearSteps}
          size="sm"
          variant="outline"
          className="h-7 gap-1 text-muted-foreground"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings2 className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4 mt-1">
            <SettingsPopover
              showLineNumbers={showLineNumbers}
              onShowLineNumbersChange={onShowLineNumbersChange}
              startLine={startLine}
              onStartLineChange={onStartLineChange}
              fps={fps}
              onFpsChange={onFpsChange}
              startHoldMs={startHoldMs}
              onStartHoldMsChange={onStartHoldMsChange}
              betweenHoldMs={betweenHoldMs}
              onBetweenHoldMsChange={onBetweenHoldMsChange}
              endHoldMs={endHoldMs}
              onEndHoldMsChange={onEndHoldMsChange}
            />
          </PopoverContent>
        </Popover>

        <Button
          onClick={onAddStep}
          size="sm"
          className="h-7 gap-1"
          variant="default"
        >
          <Plus className="w-3.5 h-3.5" /> New Step
        </Button>
        </div>
      </div>
    </div>
  );
}
