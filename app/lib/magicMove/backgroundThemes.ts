/**
 * Background gradient themes for wrapping the code card in a visually
 * appealing gradient (similar to ray.so).  Definitions are canvas-native
 * so they work identically in preview and video export.
 */

// ---------- types ----------

export type GradientStop = { offset: number; color: string };

export type LinearLayer = {
  /** Normalised coordinates (0-1) resolved against the full canvas size. */
  type: "linear";
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  stops: GradientStop[];
};

export type RadialLayer = {
  type: "radial";
  /** Centre x (0-1, normalised against canvas width). */
  cx: number;
  /** Centre y (0-1, normalised against canvas height). */
  cy: number;
  /** Inner radius (0-1, normalised against Math.min(width, height)). */
  r0: number;
  /** Outer radius (0-1, normalised against Math.min(width, height)). */
  r1: number;
  stops: GradientStop[];
};

export type GradientLayer = LinearLayer | RadialLayer;

export type BackgroundTheme = {
  id: string;
  name: string;
  /** Colour shown in the Combobox swatch (first dominant colour). */
  previewColor: string;
  /** Optional grouping key for the combobox (e.g. "org"). Defaults to "gradient". */
  group?: string;
  layers: GradientLayer[];
};

// ---------- presets ----------

const THEMES: BackgroundTheme[] = [
  {
    id: "sunset",
    name: "Sunset",
    previewColor: "#f97316",
    layers: [
      {
        type: "linear",
        x0: 0, y0: 0, x1: 1, y1: 1,
        stops: [
          { offset: 0, color: "#f97316" },
          { offset: 0.5, color: "#ec4899" },
          { offset: 1, color: "#8b5cf6" },
        ],
      },
    ],
  },
  {
    id: "midnight",
    name: "Midnight",
    previewColor: "#1e3a5f",
    layers: [
      {
        type: "linear",
        x0: 0, y0: 0, x1: 1, y1: 1,
        stops: [
          { offset: 0, color: "#0f172a" },
          { offset: 0.5, color: "#1e3a5f" },
          { offset: 1, color: "#312e81" },
        ],
      },
    ],
  },
  {
    id: "forest",
    name: "Forest",
    previewColor: "#16a34a",
    layers: [
      {
        type: "linear",
        x0: 0, y0: 0, x1: 1, y1: 1,
        stops: [
          { offset: 0, color: "#064e3b" },
          { offset: 0.5, color: "#16a34a" },
          { offset: 1, color: "#a3e635" },
        ],
      },
    ],
  },
  {
    id: "sand",
    name: "Sand",
    previewColor: "#d4a574",
    layers: [
      {
        type: "linear",
        x0: 0, y0: 0, x1: 1, y1: 1,
        stops: [
          { offset: 0, color: "#fef3c7" },
          { offset: 0.5, color: "#d4a574" },
          { offset: 1, color: "#92400e" },
        ],
      },
    ],
  },
  {
    id: "mono",
    name: "Mono",
    previewColor: "#6b7280",
    layers: [
      {
        type: "linear",
        x0: 0, y0: 0, x1: 0, y1: 1,
        stops: [
          { offset: 0, color: "#374151" },
          { offset: 1, color: "#111827" },
        ],
      },
    ],
  },
  {
    id: "breeze",
    name: "Breeze",
    previewColor: "#38bdf8",
    layers: [
      {
        type: "linear",
        x0: 0, y0: 0, x1: 1, y1: 1,
        stops: [
          { offset: 0, color: "#e0f2fe" },
          { offset: 0.5, color: "#38bdf8" },
          { offset: 1, color: "#0284c7" },
        ],
      },
    ],
  },
  {
    id: "candy",
    name: "Candy",
    previewColor: "#f472b6",
    layers: [
      {
        type: "linear",
        x0: 0, y0: 0, x1: 1, y1: 1,
        stops: [
          { offset: 0, color: "#f472b6" },
          { offset: 0.5, color: "#c084fc" },
          { offset: 1, color: "#60a5fa" },
        ],
      },
    ],
  },
  {
    id: "crimson",
    name: "Crimson",
    previewColor: "#dc2626",
    layers: [
      {
        type: "linear",
        x0: 0, y0: 0, x1: 1, y1: 1,
        stops: [
          { offset: 0, color: "#7f1d1d" },
          { offset: 0.5, color: "#dc2626" },
          { offset: 1, color: "#f97316" },
        ],
      },
    ],
  },
  {
    id: "falcon",
    name: "Falcon",
    previewColor: "#6366f1",
    layers: [
      {
        type: "linear",
        x0: 0, y0: 0, x1: 1, y1: 1,
        stops: [
          { offset: 0, color: "#1e1b4b" },
          { offset: 0.5, color: "#6366f1" },
          { offset: 1, color: "#a78bfa" },
        ],
      },
    ],
  },
  {
    id: "meadow",
    name: "Meadow",
    previewColor: "#34d399",
    layers: [
      {
        type: "linear",
        x0: 0, y0: 0, x1: 1, y1: 1,
        stops: [
          { offset: 0, color: "#fde68a" },
          { offset: 0.5, color: "#34d399" },
          { offset: 1, color: "#06b6d4" },
        ],
      },
    ],
  },
  {
    id: "raindrop",
    name: "Raindrop",
    previewColor: "#818cf8",
    layers: [
      {
        type: "linear",
        x0: 0, y0: 0, x1: 1, y1: 1,
        stops: [
          { offset: 0, color: "#e0e7ff" },
          { offset: 0.5, color: "#818cf8" },
          { offset: 1, color: "#4338ca" },
        ],
      },
    ],
  },
  // ── Org themes ───────────────────────────────────────────────────
  {
    id: "openai-1",
    name: "OpenAI - 1",
    previewColor: "#e8b84c",
    group: "org",
    layers: [
      // Base: warm gold to sky blue horizontal sweep
      {
        type: "linear",
        x0: 0, y0: 0.5, x1: 1, y1: 0.5,
        stops: [
          { offset: 0, color: "#d9a030" },
          { offset: 0.35, color: "#e8c86c" },
          { offset: 0.5, color: "#f0c0d0" },
          { offset: 0.75, color: "#a8c8e8" },
          { offset: 1, color: "#8cb8e0" },
        ],
      },
      // Yellow-gold radial blob top-left
      {
        type: "radial",
        cx: 0.2, cy: 0.3, r0: 0, r1: 0.7,
        stops: [
          { offset: 0, color: "rgba(230, 170, 40, 0.55)" },
          { offset: 0.5, color: "rgba(230, 180, 60, 0.2)" },
          { offset: 1, color: "rgba(230, 180, 60, 0)" },
        ],
      },
      // Pink radial blob in center-bottom
      {
        type: "radial",
        cx: 0.45, cy: 0.65, r0: 0, r1: 0.6,
        stops: [
          { offset: 0, color: "rgba(245, 160, 190, 0.45)" },
          { offset: 0.4, color: "rgba(240, 170, 200, 0.25)" },
          { offset: 1, color: "rgba(240, 170, 200, 0)" },
        ],
      },
      // Pink linear wash from bottom
      {
        type: "linear",
        x0: 0.3, y0: 1, x1: 0.6, y1: 0.3,
        stops: [
          { offset: 0, color: "rgba(240, 150, 180, 0.3)" },
          { offset: 0.5, color: "rgba(230, 170, 200, 0.15)" },
          { offset: 1, color: "rgba(230, 170, 200, 0)" },
        ],
      },
      // Light blue wash from right
      {
        type: "linear",
        x0: 1, y0: 0, x1: 0.4, y1: 0.8,
        stops: [
          { offset: 0, color: "rgba(140, 190, 240, 0.35)" },
          { offset: 1, color: "rgba(140, 190, 240, 0)" },
        ],
      },
    ],
  },
  {
    id: "openai-2",
    name: "OpenAI - 2",
    previewColor: "#c4b8e8",
    group: "org",
    layers: [
      // Base: light lavender/periwinkle
      {
        type: "linear",
        x0: 0, y0: 0, x1: 1, y1: 1,
        stops: [
          { offset: 0, color: "#d0c8f0" },
          { offset: 0.5, color: "#c8c0e8" },
          { offset: 1, color: "#d8d0f0" },
        ],
      },
      // Large orange-peach radial blob bottom-left
      {
        type: "radial",
        cx: 0.2, cy: 0.75, r0: 0, r1: 0.9,
        stops: [
          { offset: 0, color: "rgba(255, 140, 50, 0.85)" },
          { offset: 0.25, color: "rgba(252, 130, 60, 0.7)" },
          { offset: 0.5, color: "rgba(248, 140, 90, 0.45)" },
          { offset: 0.75, color: "rgba(240, 150, 130, 0.15)" },
          { offset: 1, color: "rgba(240, 150, 130, 0)" },
        ],
      },
      // Large orange-salmon radial blob bottom-right
      {
        type: "radial",
        cx: 0.8, cy: 0.8, r0: 0, r1: 0.85,
        stops: [
          { offset: 0, color: "rgba(255, 150, 60, 0.8)" },
          { offset: 0.3, color: "rgba(250, 140, 80, 0.6)" },
          { offset: 0.6, color: "rgba(245, 140, 100, 0.25)" },
          { offset: 1, color: "rgba(245, 140, 100, 0)" },
        ],
      },
      // Warm peach wash across lower half
      {
        type: "radial",
        cx: 0.5, cy: 0.7, r0: 0, r1: 0.8,
        stops: [
          { offset: 0, color: "rgba(250, 160, 120, 0.5)" },
          { offset: 0.5, color: "rgba(245, 170, 150, 0.2)" },
          { offset: 1, color: "rgba(245, 170, 160, 0)" },
        ],
      },
    ],
  },
  {
    id: "openai-3",
    name: "OpenAI - 3",
    previewColor: "#3020c0",
    group: "org",
    layers: [
      // Base: deep blue-indigo (shifted away from red-purple)
      {
        type: "linear",
        x0: 0, y0: 0, x1: 1, y1: 1,
        stops: [
          { offset: 0, color: "#1a1090" },
          { offset: 0.4, color: "#2218a8" },
          { offset: 0.7, color: "#2a20b8" },
          { offset: 1, color: "#1810a0" },
        ],
      },
      // Large radial light source from top-left (bright near-white)
      {
        type: "radial",
        cx: 0.15, cy: 0.1, r0: 0, r1: 1.0,
        stops: [
          { offset: 0, color: "rgba(220, 230, 255, 0.7)" },
          { offset: 0.2, color: "rgba(200, 215, 255, 0.5)" },
          { offset: 0.45, color: "rgba(160, 180, 255, 0.25)" },
          { offset: 0.7, color: "rgba(120, 140, 240, 0.08)" },
          { offset: 1, color: "rgba(120, 140, 240, 0)" },
        ],
      },
      // Strong diagonal light sweep from top-left to center
      {
        type: "linear",
        x0: 0, y0: 0, x1: 0.65, y1: 0.6,
        stops: [
          { offset: 0, color: "rgba(210, 220, 255, 0.6)" },
          { offset: 0.3, color: "rgba(180, 200, 255, 0.4)" },
          { offset: 0.6, color: "rgba(140, 160, 250, 0.15)" },
          { offset: 1, color: "rgba(140, 160, 250, 0)" },
        ],
      },
      // Secondary light ray — slightly offset for width
      {
        type: "linear",
        x0: 0.05, y0: 0, x1: 0.75, y1: 0.55,
        stops: [
          { offset: 0, color: "rgba(200, 215, 255, 0.45)" },
          { offset: 0.35, color: "rgba(170, 190, 255, 0.25)" },
          { offset: 0.7, color: "rgba(130, 150, 240, 0.08)" },
          { offset: 1, color: "rgba(130, 150, 240, 0)" },
        ],
      },
      // Dark bottom-right for contrast
      {
        type: "linear",
        x0: 1, y0: 1, x1: 0.3, y1: 0.3,
        stops: [
          { offset: 0, color: "rgba(10, 5, 60, 0.5)" },
          { offset: 0.5, color: "rgba(15, 10, 70, 0.2)" },
          { offset: 1, color: "rgba(15, 10, 70, 0)" },
        ],
      },
    ],
  },
  {
    id: "openai-4",
    name: "OpenAI - 4",
    previewColor: "#e89030",
    group: "org",
    layers: [
      // Base: warm amber to orange diagonal
      {
        type: "linear",
        x0: 0, y0: 0, x1: 1, y1: 1,
        stops: [
          { offset: 0, color: "#d88828" },
          { offset: 0.3, color: "#e09030" },
          { offset: 0.6, color: "#d88040" },
          { offset: 1, color: "#c87838" },
        ],
      },
      // Golden highlight from top-left
      {
        type: "linear",
        x0: 0, y0: 0, x1: 0.7, y1: 0.8,
        stops: [
          { offset: 0, color: "rgba(240, 180, 80, 0.35)" },
          { offset: 0.5, color: "rgba(230, 160, 60, 0.15)" },
          { offset: 1, color: "rgba(230, 160, 60, 0)" },
        ],
      },
      // Subtle warm-light patch from right
      {
        type: "linear",
        x0: 1, y0: 0.3, x1: 0.3, y1: 0.7,
        stops: [
          { offset: 0, color: "rgba(250, 200, 120, 0.25)" },
          { offset: 1, color: "rgba(250, 200, 120, 0)" },
        ],
      },
    ],
  },
];

// ---------- lookup ----------

export function getBackgroundThemeById(id: string): BackgroundTheme | undefined {
  return THEMES.find((t) => t.id === id);
}

export function getAllBackgroundThemes(): BackgroundTheme[] {
  return THEMES;
}

// ---------- canvas drawing ----------

/**
 * Draws a background gradient onto the full canvas area.
 * Call this before drawing the code card.
 */
export function drawBackgroundGradient(opts: {
  ctx: CanvasRenderingContext2D;
  theme: BackgroundTheme;
  width: number;
  height: number;
  cornerRadius?: number;
}) {
  const { ctx, theme, width, height, cornerRadius } = opts;

  if (cornerRadius && cornerRadius > 0) {
    ctx.save();
    const r = Math.min(cornerRadius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.arcTo(width, 0, width, height, r);
    ctx.arcTo(width, height, 0, height, r);
    ctx.arcTo(0, height, 0, 0, r);
    ctx.arcTo(0, 0, width, 0, r);
    ctx.closePath();
    ctx.clip();
  }

  for (const layer of theme.layers) {
    let grad: CanvasGradient;
    if (layer.type === "linear") {
      grad = ctx.createLinearGradient(
        layer.x0 * width,
        layer.y0 * height,
        layer.x1 * width,
        layer.y1 * height,
      );
    } else {
      const ref = Math.min(width, height);
      grad = ctx.createRadialGradient(
        layer.cx * width,
        layer.cy * height,
        layer.r0 * ref,
        layer.cx * width,
        layer.cy * height,
        layer.r1 * ref,
      );
    }
    for (const stop of layer.stops) {
      grad.addColorStop(stop.offset, stop.color);
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  if (cornerRadius && cornerRadius > 0) {
    ctx.restore();
  }
}

/**
 * Draws a subtle shadow behind the code card when background is visible.
 */
export function drawCardShadow(opts: {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  width: number;
  height: number;
  cornerRadius: number;
}) {
  const { ctx, x, y, width, height, cornerRadius } = opts;

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 8;

  ctx.fillStyle = "rgba(0, 0, 0, 0)";
  const r = Math.min(cornerRadius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
  // Fill with an opaque colour so the shadow actually renders;
  // the shape itself will be covered by the card background.
  ctx.fillStyle = "#000";
  ctx.fill();
  ctx.restore();
}
