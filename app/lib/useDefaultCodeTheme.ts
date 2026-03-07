import { useTheme } from "next-themes";
import { useState, useEffect, useRef } from "react";
import type { ShikiThemeChoice } from "./magicMove/shikiHighlighter";

const DARK_DEFAULT: ShikiThemeChoice = "github-dark-default";
const LIGHT_DEFAULT: ShikiThemeChoice = "github-light-high-contrast";

export function useDefaultCodeTheme() {
  const { resolvedTheme, setTheme: setSiteTheme } = useTheme();
  const [codeTheme, setCodeTheme] = useState<ShikiThemeChoice>(DARK_DEFAULT);
  const initialized = useRef(false);

  // Set code theme based on site theme only on first hydration
  useEffect(() => {
    if (initialized.current || !resolvedTheme) return;
    initialized.current = true;
    setCodeTheme(resolvedTheme === "light" ? LIGHT_DEFAULT : DARK_DEFAULT);
  }, [resolvedTheme]);

  return { codeTheme, setCodeTheme, setSiteTheme } as const;
}
