/**
 * Background gradient themes for wrapping the code card in a visually
 * appealing gradient (similar to ray.so).  Definitions are canvas-native
 * so they work identically in preview and video export.
 */

// ---------- types ----------

export type GradientStop = { offset: number; color: string };

export type GradientLayer = {
  /** Normalised coordinates (0-1) resolved against the full canvas size. */
  type: "linear";
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  stops: GradientStop[];
};

export type BackgroundTheme = {
  id: string;
  name: string;
  /** Colour shown in the Combobox swatch (first dominant colour). */
  previewColor: string;
  layers: GradientLayer[];
};

// ---------- presets ----------

const THEMES: BackgroundTheme[] = [
  // ── Dark / neutral themes ──────────────────────────────────────────
  {
    id: "charcoal",
    name: "Charcoal",
    previewColor: "#1c1c1e",
    layers: [
      // Base: dark diagonal
      {
        type: "linear",
        x0: 0, y0: 0, x1: 1, y1: 1,
        stops: [
          { offset: 0, color: "#111113" },
          { offset: 0.5, color: "#1c1c1e" },
          { offset: 1, color: "#111113" },
        ],
      },
      // Cool blue accent from top-left
      {
        type: "linear",
        x0: 0, y0: 0, x1: 0.6, y1: 0.8,
        stops: [
          { offset: 0, color: "rgba(99, 102, 241, 0.15)" },
          { offset: 1, color: "rgba(99, 102, 241, 0)" },
        ],
      },
      // Warm highlight from bottom-right
      {
        type: "linear",
        x0: 1, y0: 1, x1: 0.3, y1: 0.2,
        stops: [
          { offset: 0, color: "rgba(251, 146, 60, 0.08)" },
          { offset: 1, color: "rgba(251, 146, 60, 0)" },
        ],
      },
    ],
  },
  {
    id: "espresso",
    name: "Espresso",
    previewColor: "#2c1810",
    layers: [
      // Base: rich brown diagonal
      {
        type: "linear",
        x0: 0, y0: 0, x1: 1, y1: 1,
        stops: [
          { offset: 0, color: "#1a0a04" },
          { offset: 0.4, color: "#3d1e0e" },
          { offset: 1, color: "#1a0e08" },
        ],
      },
      // Warm amber glow from top
      {
        type: "linear",
        x0: 0.3, y0: 0, x1: 0.7, y1: 0.8,
        stops: [
          { offset: 0, color: "rgba(217, 119, 6, 0.2)" },
          { offset: 0.6, color: "rgba(180, 83, 9, 0.08)" },
          { offset: 1, color: "rgba(180, 83, 9, 0)" },
        ],
      },
      // Deep crimson from bottom-left
      {
        type: "linear",
        x0: 0, y0: 1, x1: 0.8, y1: 0,
        stops: [
          { offset: 0, color: "rgba(153, 27, 27, 0.15)" },
          { offset: 1, color: "rgba(153, 27, 27, 0)" },
        ],
      },
    ],
  },
  {
    id: "obsidian",
    name: "Obsidian",
    previewColor: "#0b0b0f",
    layers: [
      // Base: near-black with subtle blue
      {
        type: "linear",
        x0: 0, y0: 0, x1: 1, y1: 1,
        stops: [
          { offset: 0, color: "#05050a" },
          { offset: 0.5, color: "#0e0e18" },
          { offset: 1, color: "#050508" },
        ],
      },
      // Violet sheen from top-right
      {
        type: "linear",
        x0: 1, y0: 0, x1: 0.1, y1: 0.9,
        stops: [
          { offset: 0, color: "rgba(139, 92, 246, 0.12)" },
          { offset: 0.5, color: "rgba(99, 102, 241, 0.06)" },
          { offset: 1, color: "rgba(99, 102, 241, 0)" },
        ],
      },
      // Teal edge from bottom-left
      {
        type: "linear",
        x0: 0, y0: 1, x1: 0.7, y1: 0.2,
        stops: [
          { offset: 0, color: "rgba(20, 184, 166, 0.08)" },
          { offset: 1, color: "rgba(20, 184, 166, 0)" },
        ],
      },
    ],
  },
  {
    id: "walnut",
    name: "Walnut",
    previewColor: "#3b2a1a",
    layers: [
      // Base: warm brown
      {
        type: "linear",
        x0: 0, y0: 0, x1: 0.8, y1: 1,
        stops: [
          { offset: 0, color: "#1a0f06" },
          { offset: 0.5, color: "#3b2a1a" },
          { offset: 1, color: "#1e1408" },
        ],
      },
      // Golden highlight from top-right
      {
        type: "linear",
        x0: 1, y0: 0, x1: 0.2, y1: 0.7,
        stops: [
          { offset: 0, color: "rgba(234, 179, 8, 0.15)" },
          { offset: 0.5, color: "rgba(202, 138, 4, 0.06)" },
          { offset: 1, color: "rgba(202, 138, 4, 0)" },
        ],
      },
      // Deep red warmth from bottom
      {
        type: "linear",
        x0: 0.5, y0: 1, x1: 0.5, y1: 0.2,
        stops: [
          { offset: 0, color: "rgba(127, 29, 29, 0.12)" },
          { offset: 1, color: "rgba(127, 29, 29, 0)" },
        ],
      },
    ],
  },
  {
    id: "graphite",
    name: "Graphite",
    previewColor: "#2d2d30",
    layers: [
      // Base: vertical dark grey
      {
        type: "linear",
        x0: 0, y0: 0, x1: 0, y1: 1,
        stops: [
          { offset: 0, color: "#3a3a3d" },
          { offset: 0.5, color: "#28282b" },
          { offset: 1, color: "#161618" },
        ],
      },
      // Steel blue sheen from left
      {
        type: "linear",
        x0: 0, y0: 0.3, x1: 0.8, y1: 0.7,
        stops: [
          { offset: 0, color: "rgba(148, 163, 184, 0.1)" },
          { offset: 1, color: "rgba(148, 163, 184, 0)" },
        ],
      },
      // Subtle warm corner from bottom-right
      {
        type: "linear",
        x0: 1, y0: 1, x1: 0.3, y1: 0.3,
        stops: [
          { offset: 0, color: "rgba(217, 119, 6, 0.06)" },
          { offset: 1, color: "rgba(217, 119, 6, 0)" },
        ],
      },
    ],
  },
  {
    id: "ash",
    name: "Ash",
    previewColor: "#3c3836",
    layers: [
      // Base: warm grey
      {
        type: "linear",
        x0: 0, y0: 0, x1: 1, y1: 1,
        stops: [
          { offset: 0, color: "#2a2725" },
          { offset: 0.4, color: "#3c3836" },
          { offset: 1, color: "#201e1c" },
        ],
      },
      // Rose tint from top
      {
        type: "linear",
        x0: 0.5, y0: 0, x1: 0.5, y1: 0.7,
        stops: [
          { offset: 0, color: "rgba(244, 114, 182, 0.08)" },
          { offset: 1, color: "rgba(244, 114, 182, 0)" },
        ],
      },
      // Sage green from bottom-left
      {
        type: "linear",
        x0: 0, y0: 1, x1: 0.7, y1: 0.3,
        stops: [
          { offset: 0, color: "rgba(163, 230, 53, 0.06)" },
          { offset: 1, color: "rgba(163, 230, 53, 0)" },
        ],
      },
    ],
  },
  {
    id: "mono",
    name: "Mono",
    previewColor: "#6b7280",
    layers: [
      // Base: vertical grey
      {
        type: "linear",
        x0: 0, y0: 0, x1: 0, y1: 1,
        stops: [
          { offset: 0, color: "#404450" },
          { offset: 1, color: "#0c0e14" },
        ],
      },
      // Cool blue wash from top-right
      {
        type: "linear",
        x0: 1, y0: 0, x1: 0, y1: 1,
        stops: [
          { offset: 0, color: "rgba(96, 165, 250, 0.08)" },
          { offset: 1, color: "rgba(96, 165, 250, 0)" },
        ],
      },
    ],
  },
  // ── Vibrant themes ─────────────────────────────────────────────────
  {
    id: "sunset",
    name: "Sunset",
    previewColor: "#f97316",
    layers: [
      // Base: warm to cool diagonal
      {
        type: "linear",
        x0: 0, y0: 0, x1: 1, y1: 1,
        stops: [
          { offset: 0, color: "#f97316" },
          { offset: 0.35, color: "#ef4444" },
          { offset: 0.65, color: "#ec4899" },
          { offset: 1, color: "#8b5cf6" },
        ],
      },
      // Bright highlight from top-left
      {
        type: "linear",
        x0: 0, y0: 0, x1: 0.5, y1: 0.5,
        stops: [
          { offset: 0, color: "rgba(253, 224, 71, 0.3)" },
          { offset: 1, color: "rgba(253, 224, 71, 0)" },
        ],
      },
    ],
  },
  {
    id: "midnight",
    name: "Midnight",
    previewColor: "#1e3a5f",
    layers: [
      // Base: deep navy
      {
        type: "linear",
        x0: 0, y0: 0, x1: 1, y1: 1,
        stops: [
          { offset: 0, color: "#0c1222" },
          { offset: 0.4, color: "#1e3a5f" },
          { offset: 1, color: "#1e1b4b" },
        ],
      },
      // Aurora teal from top
      {
        type: "linear",
        x0: 0.3, y0: 0, x1: 0.7, y1: 0.6,
        stops: [
          { offset: 0, color: "rgba(56, 189, 248, 0.15)" },
          { offset: 1, color: "rgba(56, 189, 248, 0)" },
        ],
      },
      // Purple glow from bottom-right
      {
        type: "linear",
        x0: 1, y0: 1, x1: 0.2, y1: 0.4,
        stops: [
          { offset: 0, color: "rgba(139, 92, 246, 0.2)" },
          { offset: 1, color: "rgba(139, 92, 246, 0)" },
        ],
      },
    ],
  },
  {
    id: "forest",
    name: "Forest",
    previewColor: "#16a34a",
    layers: [
      // Base: deep green to lime
      {
        type: "linear",
        x0: 0, y0: 0, x1: 1, y1: 1,
        stops: [
          { offset: 0, color: "#052e16" },
          { offset: 0.4, color: "#15803d" },
          { offset: 0.7, color: "#16a34a" },
          { offset: 1, color: "#65a30d" },
        ],
      },
      // Lime highlight from top-right
      {
        type: "linear",
        x0: 1, y0: 0, x1: 0.2, y1: 0.7,
        stops: [
          { offset: 0, color: "rgba(163, 230, 53, 0.25)" },
          { offset: 1, color: "rgba(163, 230, 53, 0)" },
        ],
      },
      // Teal depth from bottom-left
      {
        type: "linear",
        x0: 0, y0: 1, x1: 0.6, y1: 0.2,
        stops: [
          { offset: 0, color: "rgba(13, 148, 136, 0.2)" },
          { offset: 1, color: "rgba(13, 148, 136, 0)" },
        ],
      },
    ],
  },
  {
    id: "sand",
    name: "Sand",
    previewColor: "#d4a574",
    layers: [
      // Base: warm sand
      {
        type: "linear",
        x0: 0, y0: 0, x1: 1, y1: 1,
        stops: [
          { offset: 0, color: "#fef3c7" },
          { offset: 0.35, color: "#e8c088" },
          { offset: 0.65, color: "#d4a574" },
          { offset: 1, color: "#78350f" },
        ],
      },
      // Peach warmth from top-right
      {
        type: "linear",
        x0: 1, y0: 0, x1: 0, y1: 1,
        stops: [
          { offset: 0, color: "rgba(251, 146, 60, 0.2)" },
          { offset: 1, color: "rgba(251, 146, 60, 0)" },
        ],
      },
    ],
  },
  {
    id: "breeze",
    name: "Breeze",
    previewColor: "#38bdf8",
    layers: [
      // Base: sky blue sweep
      {
        type: "linear",
        x0: 0, y0: 0, x1: 1, y1: 1,
        stops: [
          { offset: 0, color: "#e0f2fe" },
          { offset: 0.35, color: "#7dd3fc" },
          { offset: 0.65, color: "#38bdf8" },
          { offset: 1, color: "#0369a1" },
        ],
      },
      // Cyan accent from top
      {
        type: "linear",
        x0: 0.5, y0: 0, x1: 0.5, y1: 0.6,
        stops: [
          { offset: 0, color: "rgba(34, 211, 238, 0.2)" },
          { offset: 1, color: "rgba(34, 211, 238, 0)" },
        ],
      },
    ],
  },
  {
    id: "candy",
    name: "Candy",
    previewColor: "#f472b6",
    layers: [
      // Base: pink → purple → blue
      {
        type: "linear",
        x0: 0, y0: 0, x1: 1, y1: 1,
        stops: [
          { offset: 0, color: "#fb7185" },
          { offset: 0.3, color: "#f472b6" },
          { offset: 0.6, color: "#c084fc" },
          { offset: 1, color: "#60a5fa" },
        ],
      },
      // White highlight from top-left
      {
        type: "linear",
        x0: 0, y0: 0, x1: 0.5, y1: 0.5,
        stops: [
          { offset: 0, color: "rgba(255, 255, 255, 0.2)" },
          { offset: 1, color: "rgba(255, 255, 255, 0)" },
        ],
      },
    ],
  },
  {
    id: "crimson",
    name: "Crimson",
    previewColor: "#dc2626",
    layers: [
      // Base: dark red to orange
      {
        type: "linear",
        x0: 0, y0: 0, x1: 1, y1: 1,
        stops: [
          { offset: 0, color: "#450a0a" },
          { offset: 0.3, color: "#991b1b" },
          { offset: 0.6, color: "#dc2626" },
          { offset: 1, color: "#ea580c" },
        ],
      },
      // Hot white-orange from top-right
      {
        type: "linear",
        x0: 1, y0: 0, x1: 0.3, y1: 0.7,
        stops: [
          { offset: 0, color: "rgba(251, 146, 60, 0.3)" },
          { offset: 1, color: "rgba(251, 146, 60, 0)" },
        ],
      },
      // Deep purple from bottom-left
      {
        type: "linear",
        x0: 0, y0: 1, x1: 0.6, y1: 0.2,
        stops: [
          { offset: 0, color: "rgba(88, 28, 135, 0.2)" },
          { offset: 1, color: "rgba(88, 28, 135, 0)" },
        ],
      },
    ],
  },
  {
    id: "falcon",
    name: "Falcon",
    previewColor: "#6366f1",
    layers: [
      // Base: deep indigo to violet
      {
        type: "linear",
        x0: 0, y0: 0, x1: 1, y1: 1,
        stops: [
          { offset: 0, color: "#1e1b4b" },
          { offset: 0.35, color: "#4338ca" },
          { offset: 0.65, color: "#6366f1" },
          { offset: 1, color: "#a78bfa" },
        ],
      },
      // Pink glow from bottom
      {
        type: "linear",
        x0: 0.5, y0: 1, x1: 0.5, y1: 0.3,
        stops: [
          { offset: 0, color: "rgba(236, 72, 153, 0.2)" },
          { offset: 1, color: "rgba(236, 72, 153, 0)" },
        ],
      },
      // Cyan shimmer from top-right
      {
        type: "linear",
        x0: 1, y0: 0, x1: 0.2, y1: 0.6,
        stops: [
          { offset: 0, color: "rgba(34, 211, 238, 0.12)" },
          { offset: 1, color: "rgba(34, 211, 238, 0)" },
        ],
      },
    ],
  },
  {
    id: "meadow",
    name: "Meadow",
    previewColor: "#34d399",
    layers: [
      // Base: yellow → green → cyan
      {
        type: "linear",
        x0: 0, y0: 0, x1: 1, y1: 1,
        stops: [
          { offset: 0, color: "#fde68a" },
          { offset: 0.3, color: "#6ee7b7" },
          { offset: 0.6, color: "#34d399" },
          { offset: 1, color: "#0891b2" },
        ],
      },
      // Warm highlight from top-left
      {
        type: "linear",
        x0: 0, y0: 0, x1: 0.6, y1: 0.6,
        stops: [
          { offset: 0, color: "rgba(253, 224, 71, 0.25)" },
          { offset: 1, color: "rgba(253, 224, 71, 0)" },
        ],
      },
    ],
  },
  {
    id: "raindrop",
    name: "Raindrop",
    previewColor: "#818cf8",
    layers: [
      // Base: soft indigo
      {
        type: "linear",
        x0: 0, y0: 0, x1: 1, y1: 1,
        stops: [
          { offset: 0, color: "#e0e7ff" },
          { offset: 0.35, color: "#a5b4fc" },
          { offset: 0.65, color: "#818cf8" },
          { offset: 1, color: "#3730a3" },
        ],
      },
      // Lavender bloom from top
      {
        type: "linear",
        x0: 0.5, y0: 0, x1: 0.5, y1: 0.5,
        stops: [
          { offset: 0, color: "rgba(196, 181, 253, 0.3)" },
          { offset: 1, color: "rgba(196, 181, 253, 0)" },
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
    const grad = ctx.createLinearGradient(
      layer.x0 * width,
      layer.y0 * height,
      layer.x1 * width,
      layer.y1 * height,
    );
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
