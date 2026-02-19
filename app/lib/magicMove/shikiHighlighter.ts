import type {
  BundledLanguage,
  Highlighter,
  SpecialLanguage,
  ThemedToken,
} from "shiki";

export type ShikiThemeChoice =
  | "github-light"
  | "github-dark"
  | "nord"
  | "one-dark-pro"
  | "vitesse-dark"
  | "vitesse-light"
  | "vesper"
  | "kanagawa-dragon"
  | "kanagawa-lotus"
  | "dracula"
  | "catppuccin-mocha"
  | "catppuccin-latte"
  | "tokyo-night"
  | "solarized-dark"
  | "solarized-light"
  | "rose-pine"
  | "rose-pine-dawn"
  | "monokai"
  | "night-owl"
  | "one-light"
  | "synthwave-84"
  | "ayu-dark"
  | "andromeeda"
  | "aurora-x"
  | "catppuccin-frappe"
  | "catppuccin-macchiato"
  | "dark-plus"
  | "dracula-soft"
  | "everforest-dark"
  | "everforest-light"
  | "github-dark-default"
  | "github-dark-dimmed"
  | "github-dark-high-contrast"
  | "github-light-default"
  | "github-light-high-contrast"
  | "gruvbox-dark-hard"
  | "gruvbox-dark-medium"
  | "gruvbox-dark-soft"
  | "gruvbox-light-hard"
  | "gruvbox-light-medium"
  | "gruvbox-light-soft"
  | "houston"
  | "kanagawa-wave"
  | "laserwave"
  | "light-plus"
  | "material-theme"
  | "material-theme-darker"
  | "material-theme-lighter"
  | "material-theme-ocean"
  | "material-theme-palenight"
  | "min-dark"
  | "min-light"
  | "plastic"
  | "poimandres"
  | "red"
  | "rose-pine-moon"
  | "slack-dark"
  | "slack-ochin"
  | "snazzy-light"
  | "vitesse-black";

export const AVAILABLE_THEMES: readonly ShikiThemeChoice[] = [
  "github-light",
  "github-dark",
  "nord",
  "one-dark-pro",
  "vitesse-dark",
  "vitesse-light",
  "vesper",
  "kanagawa-dragon",
  "kanagawa-lotus",
  "dracula",
  "catppuccin-mocha",
  "catppuccin-latte",
  "tokyo-night",
  "solarized-dark",
  "solarized-light",
  "rose-pine",
  "rose-pine-dawn",
  "monokai",
  "night-owl",
  "one-light",
  "synthwave-84",
  "ayu-dark",
  "andromeeda",
  "aurora-x",
  "catppuccin-frappe",
  "catppuccin-macchiato",
  "dark-plus",
  "dracula-soft",
  "everforest-dark",
  "everforest-light",
  "github-dark-default",
  "github-dark-dimmed",
  "github-dark-high-contrast",
  "github-light-default",
  "github-light-high-contrast",
  "gruvbox-dark-hard",
  "gruvbox-dark-medium",
  "gruvbox-dark-soft",
  "gruvbox-light-hard",
  "gruvbox-light-medium",
  "gruvbox-light-soft",
  "houston",
  "kanagawa-wave",
  "laserwave",
  "light-plus",
  "material-theme",
  "material-theme-darker",
  "material-theme-lighter",
  "material-theme-ocean",
  "material-theme-palenight",
  "min-dark",
  "min-light",
  "plastic",
  "poimandres",
  "red",
  "rose-pine-moon",
  "slack-dark",
  "slack-ochin",
  "snazzy-light",
  "vitesse-black",
] as const;

export function getGroupedThemes() {
  const dark = AVAILABLE_THEMES.filter((t) => getThemeVariant(t) === "dark");
  const light = AVAILABLE_THEMES.filter((t) => getThemeVariant(t) === "light");
  return [
    { label: "Dark", items: dark },
    { label: "Light", items: light },
  ];
}

export const AVAILABLE_LANGUAGES = [
  // Web fundamentals
  "javascript",
  "typescript",
  "tsx",
  "jsx",
  "html",
  "css",
  "json",
  "markdown",
  // Shell
  "bash",
  "shell",
  // Systems
  "c",
  "cpp",
  "rust",
  "go",
  // JVM / .NET
  "java",
  "kotlin",
  "scala",
  "csharp",
  // Scripting
  "python",
  "ruby",
  "php",
  "lua",
  // Mobile
  "swift",
  "dart",
  // Functional
  "elixir",
  // Frontend frameworks
  "svelte",
  "vue",
  // Data / Config
  "sql",
  "yaml",
  "toml",
  "graphql",
  // DevOps
  "dockerfile",
  "terraform",
] as const;

/**
 * Determine if a Shiki theme is light or dark for rendering purposes.
 */
export function getThemeVariant(theme: ShikiThemeChoice): "light" | "dark" {
  const lightThemes: ShikiThemeChoice[] = [
    "github-light",
    "vitesse-light",
    "kanagawa-lotus",
    "catppuccin-latte",
    "solarized-light",
    "rose-pine-dawn",
    "one-light",
    "everforest-light",
    "github-light-default",
    "github-light-high-contrast",
    "gruvbox-light-hard",
    "gruvbox-light-medium",
    "gruvbox-light-soft",
    "light-plus",
    "material-theme-lighter",
    "min-light",
    "slack-ochin",
    "snazzy-light",
  ];
  return lightThemes.includes(theme) ? "light" : "dark";
}

const THEME_BG_COLORS: Record<ShikiThemeChoice, string> = {
  "github-light": "#ffffff",
  "github-dark": "#24292e",
  "nord": "#2e3440",
  "one-dark-pro": "#282c34",
  "vitesse-dark": "#121212",
  "vitesse-light": "#ffffff",
  "vesper": "#101010",
  "kanagawa-dragon": "#181616",
  "kanagawa-lotus": "#f2ecbc",
  "dracula": "#282a36",
  "catppuccin-mocha": "#1e1e2e",
  "catppuccin-latte": "#eff1f5",
  "tokyo-night": "#1a1b26",
  "solarized-dark": "#002b36",
  "solarized-light": "#fdf6e3",
  "rose-pine": "#191724",
  "rose-pine-dawn": "#faf4ed",
  "monokai": "#272822",
  "night-owl": "#011627",
  "one-light": "#fafafa",
  "synthwave-84": "#262335",
  "ayu-dark": "#0b0e14",
  "andromeeda": "#23262E",
  "aurora-x": "#07090F",
  "catppuccin-frappe": "#303446",
  "catppuccin-macchiato": "#24273a",
  "dark-plus": "#1E1E1E",
  "dracula-soft": "#282A36",
  "everforest-dark": "#2d353b",
  "everforest-light": "#fdf6e3",
  "github-dark-default": "#0d1117",
  "github-dark-dimmed": "#22272e",
  "github-dark-high-contrast": "#0a0c10",
  "github-light-default": "#ffffff",
  "github-light-high-contrast": "#ffffff",
  "gruvbox-dark-hard": "#1d2021",
  "gruvbox-dark-medium": "#282828",
  "gruvbox-dark-soft": "#32302f",
  "gruvbox-light-hard": "#f9f5d7",
  "gruvbox-light-medium": "#fbf1c7",
  "gruvbox-light-soft": "#f2e5bc",
  "houston": "#17191e",
  "kanagawa-wave": "#1F1F28",
  "laserwave": "#27212e",
  "light-plus": "#FFFFFF",
  "material-theme": "#263238",
  "material-theme-darker": "#212121",
  "material-theme-lighter": "#FAFAFA",
  "material-theme-ocean": "#0F111A",
  "material-theme-palenight": "#292D3E",
  "min-dark": "#1f1f1f",
  "min-light": "#ffffff",
  "plastic": "#21252B",
  "poimandres": "#1b1e28",
  "red": "#390000",
  "rose-pine-moon": "#232136",
  "slack-dark": "#222222",
  "slack-ochin": "#ffffff",
  "snazzy-light": "#FAFBFC",
  "vitesse-black": "#000000",
};

/**
 * Synchronous lookup for a theme's background color.
 * Avoids async tokenization when only the bg color is needed (e.g. for editor styling).
 */
export function getThemeBgColor(theme: ShikiThemeChoice): string {
  return THEME_BG_COLORS[theme];
}

export type TokenLine = {
  tokens: { content: string; color: string }[];
};

let highlighterPromise: Promise<Highlighter> | null = null;

async function getHighlighterOnce() {
  if (!highlighterPromise) {
    highlighterPromise = (async () => {
      const shiki = await import("shiki");
      return await shiki.createHighlighter({
        themes: [
          "github-light",
          "github-dark",
          "nord",
          "one-dark-pro",
          "vitesse-dark",
          "vitesse-light",
          "vesper",
          "kanagawa-dragon",
          "kanagawa-lotus",
          "dracula",
          "catppuccin-mocha",
          "catppuccin-latte",
          "tokyo-night",
          "solarized-dark",
          "solarized-light",
          "rose-pine",
          "rose-pine-dawn",
          "monokai",
          "night-owl",
          "one-light",
          "synthwave-84",
          "ayu-dark",
          "andromeeda",
          "aurora-x",
          "catppuccin-frappe",
          "catppuccin-macchiato",
          "dark-plus",
          "dracula-soft",
          "everforest-dark",
          "everforest-light",
          "github-dark-default",
          "github-dark-dimmed",
          "github-dark-high-contrast",
          "github-light-default",
          "github-light-high-contrast",
          "gruvbox-dark-hard",
          "gruvbox-dark-medium",
          "gruvbox-dark-soft",
          "gruvbox-light-hard",
          "gruvbox-light-medium",
          "gruvbox-light-soft",
          "houston",
          "kanagawa-wave",
          "laserwave",
          "light-plus",
          "material-theme",
          "material-theme-darker",
          "material-theme-lighter",
          "material-theme-ocean",
          "material-theme-palenight",
          "min-dark",
          "min-light",
          "plastic",
          "poimandres",
          "red",
          "rose-pine-moon",
          "slack-dark",
          "slack-ochin",
          "snazzy-light",
          "vitesse-black",
        ],
        langs: [...AVAILABLE_LANGUAGES],
      });
    })();
  }
  return await highlighterPromise;
}

const LANG_ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  sh: "shell",
  md: "markdown",
  rs: "rust",
  py: "python",
  rb: "ruby",
  yml: "yaml",
  cs: "csharp",
  "c++": "cpp",
  tf: "terraform",
  kt: "kotlin",
  ex: "elixir",
};

function normalizeLang(lang: string): string {
  const l = (lang || "").toLowerCase();
  return LANG_ALIASES[l] || l || "text";
}

export async function shikiTokenizeToLines(opts: {
  code: string;
  lang: string;
  theme: ShikiThemeChoice;
}): Promise<{ lines: TokenLine[]; bg: string }> {
  const highlighter = await getHighlighterOnce();

  const themeName = opts.theme;
  const lang = normalizeLang(opts.lang);
  const variant = getThemeVariant(opts.theme);

  const langToken =
    lang === "text" ? ("text" as SpecialLanguage) : (lang as BundledLanguage);

  let themed: ReturnType<typeof highlighter.codeToTokens>;
  try {
    themed = highlighter.codeToTokens(opts.code, {
      lang: langToken,
      theme: themeName,
    });
  } catch {
    themed = highlighter.codeToTokens(opts.code, {
      lang: "text" as SpecialLanguage,
      theme: themeName,
    });
  }
  const lines: TokenLine[] = themed.tokens.map((line: ThemedToken[]) => ({
    tokens: line.map((t) => ({
      content: t.content,
      color: t.color || (variant === "dark" ? "#e5e7eb" : "#111827"),
    })),
  }));

  const bg = themed.bg || (variant === "dark" ? "#0b1021" : "#ffffff");
  return { lines, bg };
}
