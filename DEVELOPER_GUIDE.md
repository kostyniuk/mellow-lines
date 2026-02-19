# Code Animation Studio — Developer Guide

This app lets you create animated videos of code morphing between steps. Simply paste your code snippets for each step, configure the animation settings, and export a video (WebM or MP4).

Inspired by Slidev's "Shiki Magic Move" feature.

## Quick Start

1. Navigate to `/editor` to access the code animation editor
2. Add code steps in the left panel
3. Configure language, theme, and timing settings
4. Preview the animation with play/pause controls
5. Export as WebM or MP4 with custom filename

---

## Dependencies & APIs

### Core Dependencies

- **Shiki** (`shiki`)
  - **Purpose**: Syntax highlighting and code tokenization
  - **Location**: `app/lib/magicMove/shikiHighlighter.ts`
  - **Usage**: Tokenizes code into colored tokens for rendering

- **Canvas 2D API** (Web API)
  - **Purpose**: Renders code frames and animates transitions
  - **Location**: `app/lib/magicMove/canvasRenderer.ts`, `app/lib/magicMove/codeLayout.ts`
  - **Usage**: Draws tokens at interpolated positions during animation

### Video Export

- **MediaStream / `HTMLCanvasElement.captureStream()`** (Web API)
  - **Purpose**: Captures canvas output at specified FPS
  - **Location**: `app/lib/video/recordCanvas.ts`

- **MediaRecorder** (Web API)
  - **Purpose**: Encodes video stream to WebM (VP9/VP8)
  - **Location**: `app/lib/video/recordCanvas.ts`
  - **Quality**: 10 Mbps (VP9) or 8 Mbps (VP8) for crisp text

- **FFmpeg WASM** (`@ffmpeg/ffmpeg`, `@ffmpeg/util`)
  - **Purpose**: Converts WebM to MP4 format
  - **Location**: `app/lib/video/converter.ts`
  - **Usage**: Optional MP4 conversion for broader compatibility

### Build Tools

- **Bun** (`bun`)
  - **Purpose**: Development workflow, dependency management, build scripts
  - **Location**: `package.json` scripts

---

## Features

### Code Editing

- **Multi-step editor**: Add, remove, insert, and edit code steps
- **Syntax highlighting**: 11 languages supported (JS, TS, TSX, JSX, JSON, SQL, CSS, HTML, Markdown, Bash, Shell)
- **Theme selection**: 6 themes (GitHub Light/Dark, Nord, One Dark Pro, Vitesse Dark/Light)
- **Line numbers**: Toggle on/off with configurable start line

### Animation Controls

- **Play/Pause**: Start/stop playback with `requestAnimationFrame`
- **Seek**: Scrub through timeline with progress bar
- **Reset**: Jump back to beginning
- **Real-time preview**: See morphing animation as you edit

### Timing Configuration

All timing parameters are user-configurable:

- **Transition duration**: 100-5000ms (morphing between steps)
- **Start hold**: Pause before first transition (default: 250ms)
- **Between hold**: Pause between transitions (default: 120ms)
- **End hold**: Pause after final step (default: 250ms)

**Timeline Formula**:
```
totalMs = startHold + (transitions × transitionMs) + (transitions × betweenHold) + endHold
```

### Export Options

- **Formats**: WebM (browser-native) or MP4 (via FFmpeg WASM)
- **Resolution**: 1920px width, dynamic height (min 1080px)
- **FPS**: Configurable 10-60 FPS
- **Filename**: Custom name for the exported file
- **Progress tracking**: Visual feedback during recording/conversion

---

## Application Structure

### Routes

| Route | File | Purpose |
|-------|------|---------|
| `/` | `app/page.tsx` | Marketing landing page |
| `/editor` | `app/editor/page.tsx` | Code animation editor (main app) |

### Core Library (`app/lib/`)

#### Magic Move Engine (`app/lib/magicMove/`)

| File | Purpose |
|------|---------|
| `types.ts` | TypeScript interfaces (SimpleStep, MagicMoveStep, LayoutResult, etc.) |
| `shikiHighlighter.ts` | Shiki initialization and code tokenization |
| `codeLayout.ts` | Token positioning, canvas layout calculation |
| `canvasRenderer.ts` | Canvas drawing (background, gutter, tokens) |
| `animate.ts` | Token interpolation for smooth transitions |

#### Video Processing (`app/lib/video/`)

| File | Purpose |
|------|---------|
| `recordCanvas.ts` | MediaRecorder-based WebM capture |
| `converter.ts` | FFmpeg WASM WebM to MP4 conversion |

### Components (`components/`)

| Component | Purpose |
|-----------|---------|
| `header.tsx` | App header with title and theme toggle |
| `steps-editor.tsx` | Left panel for step editing |
| `steps-editor-header.tsx` | Toolbar (language, theme, settings) |
| `step-editor-item.tsx` | Individual step textarea |
| `step-insert-divider.tsx` | Insert step between existing ones |
| `preview-panel.tsx` | Right panel (canvas + controls) |
| `canvas-preview.tsx` | Canvas display component |
| `player-controls.tsx` | Play/pause/seek controls |
| `export-controls.tsx` | Export settings and buttons |
| `settings-popover.tsx` | Line numbers, FPS, hold durations |
| `themed-light-rays.tsx` | Visual background effect |
| `theme-toggle.tsx` | Dark/light mode switch |
| `theme-provider.tsx` | Theme context provider |

---

## How It Works

### Runtime Flow

```
┌─────────────────┐
│  User Input     │
│  (Code Steps)   │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Tokenization   │
│  (Shiki)        │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Layout Calc    │
│  (Positions)    │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Animation      │
│  (Interpolation)│
└────────┬────────┘
         ▼
┌─────────────────┐
│  Canvas Render  │
│  (Frame Draw)   │
└────────┬────────┘
         ▼
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────────┐
│ Preview│ │  Export  │
│ Player │ │ (WebM/   │
│        │ │  MP4)    │
└────────┘ └──────────┘
```

### Animation Algorithm

1. **Token Matching**: Tokens are matched by `(text, occurrenceIndex)`
2. **Position Interpolation**: Matched tokens move from source to destination
3. **Fade Effects**: Unmatched tokens fade out, new tokens fade in
4. **Smooth Motion**: Uses `requestAnimationFrame` for 60fps playback

### Export Process

**WebM Export**:
1. Set fixed canvas dimensions
2. Render loop drives through entire timeline
3. `canvas.captureStream(fps)` creates MediaStream
4. MediaRecorder captures at 10 Mbps (VP9) or 8 Mbps (VP8)
5. Blob created from chunks, download URL generated

**MP4 Export** (optional):
1. Record WebM as above
2. Load FFmpeg WASM in browser
3. Convert WebM to MP4 using H.264 codec
4. Return MP4 Blob for download

---

## Configuration Reference

### Where Options Live

| Setting | Location | Default | Range |
|---------|----------|---------|-------|
| Language | `app/editor/page.tsx` | `typescript` | 11 languages |
| Theme | `app/editor/page.tsx` | `vitesse-dark` | 6 themes |
| Line numbers | `app/editor/page.tsx` | `true` | boolean |
| Start line | `app/editor/page.tsx` | `1` | 1+ |
| FPS | `app/editor/page.tsx` | `30` | 10-60 |
| Transition duration | `app/editor/page.tsx` | `800` | 100-5000ms |
| Start hold | `app/editor/page.tsx` | `250` | 0+ ms |
| Between hold | `app/editor/page.tsx` | `120` | 0+ ms |
| End hold | `app/editor/page.tsx` | `250` | 0+ ms |
| Canvas width | `codeLayout.ts` | `1920` | fixed |
| Min canvas height | `codeLayout.ts` | `1080` | dynamic |
| VP9 bitrate | `recordCanvas.ts` | `10 Mbps` | fixed |
| VP8 bitrate | `recordCanvas.ts` | `8 Mbps` | fixed |

---

## File-by-File Reference

### `app/editor/page.tsx`

The main editor component (~731 lines). Contains all business logic:

**State**:
- `simpleSteps`: Code steps array
- `selectedLang`, `theme`: Display settings
- `simpleShowLineNumbers`, `simpleStartLine`: Line number settings
- `fps`, `transitionMs`, `startHoldMs`, `betweenHoldMs`, `endHoldMs`: Timing
- `exportFilename`, `exportFormat`: Export settings
- `stepLayouts`: Computed token layouts
- `isPlaying`, `playheadMs`: Playback state
- `isExporting`, `exportProgress`, `downloadUrl`, `exportError`: Export state

**Key Functions**:
- `renderAt(ms)`: Renders frame at specific timestamp
- `onExport()`: Handles video export (WebM or MP4)
- Callbacks for all component interactions

### `app/lib/magicMove/types.ts`

Core TypeScript definitions:

```typescript
interface SimpleStep { code: string }
interface MagicMoveStep { lang: string; code: string; meta: MagicMoveStepMeta }
interface MagicMoveStepMeta { lines: boolean; startLine: number }
interface TokenizedToken { text: string; color: string; fontStyle?: number }
interface PositionedToken extends TokenizedToken { x: number; y: number }
interface AnimatedToken extends PositionedToken { opacity: number }
interface LayoutResult {
  bg: string;
  gutterWidth: number;
  gutterBg: string;
  gutterTextColor: string;
  tokens: PositionedToken[];
}
interface LayoutConfig {
  canvasWidth: number;
  canvasHeight: number;
  paddingX: number;
  paddingY: number;
  lineHeight: number;
  fontFamily: string;
  fontSize: number;
  showLineNumbers: boolean;
  startLine: number;
  gutterMargin: number;
  lineBg: { start: string; end: string };
}
```

### `app/lib/magicMove/shikiHighlighter.ts`

Tokenizes code using Shiki:

```typescript
async function shikiTokenizeToLines({
  code,
  lang,
  theme,
}: {
  code: string;
  lang: string;
  theme: string;
}): Promise<{ lines: TokenizedToken[][]; bg: string }>
```

**Supported Languages**: JavaScript, TypeScript, TSX, JSX, JSON, SQL, CSS, HTML, Markdown, Bash, Shell

**Supported Themes**: github-light, github-dark, nord, one-dark-pro, vitesse-dark, vitesse-light

### `app/lib/magicMove/codeLayout.ts`

Calculates token positions on canvas:

```typescript
function makeDefaultLayoutConfig(): LayoutConfig
function calculateCanvasHeight({
  lineCount,
  lineHeight,
  paddingY,
  minHeight,
}: {...}): number
function layoutTokenLinesToCanvas({
  ctx,
  tokenLines,
  bg,
  theme,
  config,
}: {...}): LayoutResult
```

Uses monospace font metrics (`ctx.measureText("M")`) for accurate positioning.

### `app/lib/magicMove/canvasRenderer.ts`

Renders a single frame:

```typescript
function clearAndPaintBackground(
  ctx: CanvasRenderingContext2D,
  layout: LayoutResult
): void

function drawCodeFrame({
  ctx,
  config,
  layout,
  theme,
  tokens,
  showLineNumbers,
  startLine,
  lineCount,
}: {...}): void
```

### `app/lib/magicMove/animate.ts`

Interpolates token positions between two layouts:

```typescript
function animateLayouts({
  from,
  to,
  progress,
}: {
  from: LayoutResult;
  to: LayoutResult;
  progress: number;  // 0 to 1
}): AnimatedToken[]
```

**Matching Strategy**: `(tokenText, occurrenceIndex)` pairs ensure tokens are matched in order, even when text repeats.

### `app/lib/video/recordCanvas.ts`

Records canvas to WebM:

```typescript
async function recordCanvasToWebm({
  canvas,
  fps,
  durationMs,
  onProgress,
}: {
  canvas: HTMLCanvasElement;
  fps: number;
  durationMs: number;
  onProgress: (elapsed: number, total: number) => void;
}): Promise<Blob>
```

Codec preference: VP9 → VP8 → generic WebM fallback

### `app/lib/video/converter.ts`

Converts WebM to MP4 using FFmpeg WASM:

```typescript
async function convertWebmToMp4({
  webmBlob,
  onProgress,
}: {
  webmBlob: Blob;
  onProgress?: (progress: number) => void;
}): Promise<Blob>
```

---

## Preview vs Export Behavior

### Preview Mode

- Canvas height grows to fit longest step
- Preview container is scrollable
- Real-time updates as you edit
- Smooth 60fps playback

### Export Mode

- Canvas dimensions fixed at start of recording
- Width: 1920px
- Height: Calculated from max line count (min 1080px)
- All lines included with no clipping
- Consistent frame size throughout video

---

## Known Limitations

1. **Browser Support**: MP4 conversion requires WASM support; Safari has limited codec options
2. **Memory**: Large step counts (50+) may impact performance during export
3. **File Size**: Higher FPS = larger files; MP4 typically smaller than WebM
4. **Token Matching**: Heuristic-based (good for refactors, not perfect for all diffs)
5. **Single Language**: All steps share the same language/theme settings

---

## Troubleshooting

### Animation not showing

- Ensure at least one step has code
- Check browser console for errors
- Verify Shiki loaded correctly

### Video looks blurry

- Default 1920px width should be crisp
- VP9 codec provides best quality
- Try increasing FPS for smoother motion
- Check browser codec support

### Export fails

- Check browser console for errors
- Try WebM format first (more compatible)
- Reduce number of steps or duration
- Ensure sufficient memory for FFmpeg (MP4)
- Some mobile browsers limit MediaRecorder

### Line numbers not showing

- Enable in settings popover
- Set start line to 1 or higher

### MP4 conversion hangs

- FFmpeg WASM loads ~25MB
- Conversion is CPU-intensive
- Large videos may take significant time
- Consider using WebM format instead
