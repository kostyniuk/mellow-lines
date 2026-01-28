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
  | "kanagawa-lotus";

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
] as const;

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
  const lightThemes: ShikiThemeChoice[] = ["github-light", "vitesse-light"];
  return lightThemes.includes(theme) ? "light" : "dark";
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
