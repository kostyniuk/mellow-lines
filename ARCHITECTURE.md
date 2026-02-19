# Architecture & Execution Flow

This document details the application's architecture and the exact sequence of file/function calls during the app's lifecycle.

## Architecture Overview

The app is a Next.js application with a marketing landing page and a code animation editor.

### Route Structure

- **`/`** (`app/page.tsx`): Marketing landing page with hero, demo video, and features
- **`/editor`** (`app/editor/page.tsx`): Code animation editor - main application logic
- **`/layout.tsx`**: Root layout with theme provider

### Directory Structure

```
app/
├── page.tsx                 # Marketing landing page
├── editor/
│   └── page.tsx            # Main editor (731 lines) - all business logic
├── lib/
│   ├── magicMove/          # Core animation engine (5 files)
│   │   ├── types.ts
│   │   ├── shikiHighlighter.ts
│   │   ├── codeLayout.ts
│   │   ├── canvasRenderer.ts
│   │   └── animate.ts
│   └── video/              # Video processing (2 files)
│       ├── recordCanvas.ts
│       └── converter.ts    # NEW: FFmpeg WASM MP4 conversion
├── globals.css
└── layout.tsx

components/
├── ui/                     # shadcn/ui components (22 files)
├── header.tsx
├── steps-editor.tsx
├── steps-editor-header.tsx
├── step-editor-item.tsx
├── step-insert-divider.tsx  # NEW: Insert steps between existing ones
├── preview-panel.tsx
├── canvas-preview.tsx
├── player-controls.tsx
├── export-controls.tsx
├── settings-popover.tsx
├── themed-light-rays.tsx    # NEW: Visual effect
├── theme-toggle.tsx
└── theme-provider.tsx
```

---

## Data Flow

The app transforms user input (code steps) into an animated video through several phases:

1. State initialization
2. Data transformation (SimpleStep → MagicMoveStep)
3. Tokenization and layout computation
4. Timeline calculation
5. Frame rendering (static and animated)
6. Playback animation loop
7. Video export (WebM or MP4)
8. Download

---

## Component Structure

### UI Components (`components/`)

The UI follows a component-based architecture with presentational components receiving props and emitting callbacks:

- **`header.tsx`**: Application header with title and theme toggle
- **`steps-editor.tsx`**: Left panel container for step editing
  - **`steps-editor-header.tsx`**: Toolbar with language/theme selectors and settings button
    - **`settings-popover.tsx`**: Settings popover content
      - Line numbers toggle
      - Start line number input
      - FPS slider (10-60)
      - **NEW**: Start hold duration (ms)
      - **NEW**: Between hold duration (ms)
      - **NEW**: End hold duration (ms)
  - **`step-editor-item.tsx`**: Individual step editor with textarea and remove button
  - **`step-insert-divider.tsx`**: **NEW** - Divider between steps to insert new ones
- **`preview-panel.tsx`**: Right panel container for preview and controls
  - **`canvas-preview.tsx`**: Canvas display with error handling overlay
  - **`player-controls.tsx`**: Playback controls (play/pause, progress bar, seek, reset)
  - **`export-controls.tsx`**: Export controls
    - Timeline info display
    - Transition duration slider (100-5000ms)
    - **NEW**: Filename input for export
    - Export format toggle (WebM/MP4)
    - Export/download buttons

**Component Communication Pattern**:

- Components receive state as props
- Components call callback functions (e.g., `onAddStep`, `onPlayPause`, `onExport`) to trigger actions
- All business logic remains in `app/editor/page.tsx`

---

## Core Logic (`app/editor/page.tsx`)

The main editor page component manages:

- **State management**: All React state (steps, playback, export, UI state)
- **Layout computation**: Tokenization and positioning via `useEffect` hooks
- **Frame rendering**: `renderAt()` function that orchestrates canvas drawing
- **Animation loop**: `requestAnimationFrame` loop for playback
- **Export orchestration**: Video recording, format selection, and blob creation
- **Event handlers**: Functions passed as callbacks to components

---

## Execution Flow

### 1. Initial Setup & State Initialization

**File**: `app/editor/page.tsx`

When the component mounts:

1. **State initialization**:
   - `simpleSteps`: initialized with `DEFAULT_STEPS` from `app/lib/constants.ts`
   - `selectedLang`: defaults to `"typescript"`
   - `simpleShowLineNumbers`: defaults to `true`
   - `simpleStartLine`: defaults to `1`
   - `theme`: defaults to `"vitesse-dark"`
   - `fps`, `transitionMs`: playback/export settings
   - **NEW**: `startHoldMs`, `betweenHoldMs`, `endHoldMs`: configurable hold durations (default: 250, 120, 250)
   - **NEW**: `exportFilename`: custom filename for export
   - **NEW**: `exportFormat`: `'webm' | 'mp4'`
   - `stepLayouts`, `isPlaying`, `playheadMs`, etc.: UI state
   - `isExporting`, `exportProgress`, `downloadUrl`, `exportError`: export state

2. **Component rendering**:
   - `<Header />` renders the app title
   - `<StepsEditor />` renders the left panel with step editing UI
   - `<PreviewPanel />` renders the right panel with canvas and controls
   - All components receive state and callbacks as props

---

### 2. Computing MagicMoveSteps (Data Transformation)

**File**: `app/editor/page.tsx`

**Trigger**: Whenever `simpleSteps`, `selectedLang`, `simpleShowLineNumbers`, or `simpleStartLine` changes

**Function**: `useMemo` hook

```typescript
const steps = useMemo<MagicMoveStep[]>(() => {
  return simpleSteps.map((step) => ({
    lang: selectedLang,
    code: step.code,
    meta: {
      lines: simpleShowLineNumbers,
      startLine: simpleStartLine,
    },
  }));
}, [simpleSteps, selectedLang, simpleShowLineNumbers, simpleStartLine]);
```

**Responsibility**: Converts simple user input (`SimpleStep[]`) into the internal format (`MagicMoveStep[]`) used by the rendering pipeline.

---

### 3. Layout Computation (Tokenization & Positioning)

**File**: `app/editor/page.tsx`

**Trigger**: Whenever `steps` or `theme` changes

**Function**: `useEffect` hook (async operation)

#### 3.1. Initialize canvas for measurement

Creates an off-screen canvas for text measurement using `ctx.measureText()`.

#### 3.2. For each step, tokenize with Shiki

**File**: `app/lib/magicMove/shikiHighlighter.ts`

**Function**: `shikiTokenizeToLines({ code, lang, theme })`

**Internal execution**:

- Initializes Shiki highlighter (lazy, first call only)
- Loads languages: JavaScript, TypeScript, TSX, JSX, JSON, SQL, CSS, HTML, Markdown, Bash, Shell
- Loads themes: `github-light`, `github-dark`, `nord`, `one-dark-pro`, `vitesse-dark`, `vitesse-light`
- Tokenizes code using `highlighter.codeToTokensBase()`
- Fallback to `"text"` language if tokenization fails

**Returns**: `{ lines: TokenizedToken[][], bg: string }`

#### 3.3. Create layout configuration

**File**: `app/lib/magicMove/codeLayout.ts`

**Function**: `makeDefaultLayoutConfig()`

Returns default rendering configuration:

```typescript
{
  canvasWidth: 1920,
  canvasHeight: 1080,
  paddingX: 60,
  paddingY: 60,
  lineHeight: 32,
  fontFamily: '"Cascadia Code", "Fira Code", Menlo, Monaco, "Courier New", monospace',
  fontSize: 20,
  showLineNumbers: false,
  startLine: 1,
  gutterMargin: 20,
  lineBg: { start: "rgba(255,255,255,0.08)", end: "rgba(255,255,255,0.00)" },
}
```

#### 3.4. Layout tokens to canvas positions

**File**: `app/lib/magicMove/codeLayout.ts`

**Function**: `layoutTokenLinesToCanvas({ ctx, tokenLines, bg, theme, config })`

**Internal execution**:

1. Measure character width using monospace "M"
2. Calculate gutter width (if line numbers enabled)
3. Calculate text starting X position
4. Position each token with x, y coordinates
5. Determine gutter colors based on theme

**Returns**: `LayoutResult` with positioned tokens and gutter info

#### 3.5. Store layout result

```typescript
setStepLayouts(nextLayouts);
```

**Responsibility**: Stores computed layouts in state, triggering re-render

---

### 4. Timeline Calculation

**File**: `app/editor/page.tsx`

**Trigger**:

- Whenever `steps.length` changes
- Whenever `transitionMs`, `startHoldMs`, `betweenHoldMs`, or `endHoldMs` changes

**Function**: `useMemo` hook

```typescript
const timeline = useMemo(() => {
  const stepCount = steps.length;
  const startHold = startHoldMs;      // Configurable (default 250ms)
  const betweenHold = betweenHoldMs;  // Configurable (default 120ms)
  const endHold = endHoldMs;          // Configurable (default 250ms)
  if (stepCount <= 1) return { totalMs: startHold + endHold, ... };
  const transitions = stepCount - 1;
  const totalMs = startHold + transitions * transitionMs + transitions * betweenHold + endHold;
  return { totalMs, startHold, betweenHold, endHold };
}, [steps.length, transitionMs, startHoldMs, betweenHoldMs, endHoldMs]);
```

**Responsibility**: Calculates total animation duration based on configurable holds and transitions

---

### 5. Rendering a Frame

**File**: `app/editor/page.tsx`

**Function**: `renderAt(ms: number)`

**Trigger**:

- When `playheadMs` changes (via `useEffect` hook)
- During playback animation loop
- During export

#### 5.1. Setup canvas dimensions

```typescript
canvas.width = cfg.canvasWidth;  // 1920
const maxLineCount = Math.max(...stepLayouts.map(s => s.tokenLineCount));
const calculatedHeight = calculateCanvasHeight({
  lineCount: maxLineCount,
  lineHeight: cfg.lineHeight,
  paddingY: cfg.paddingY,
  minHeight: 1080,
});
canvas.height = calculatedHeight;
```

#### 5.2. Determine which step/transition to render

**Logic flow**:

1. **Single step**: Render the only step statically
2. **Before first transition**: Render first step statically
3. **During transitions**: Calculate progress (0-1) and call animation function
4. **Between transitions**: Render destination step statically
5. **After last transition**: Render final step statically

#### 5.3a. Static rendering (no animation)

**File**: `app/lib/magicMove/canvasRenderer.ts`

**Function**: `drawCodeFrame({ ctx, config, layout, theme, showLineNumbers, startLine, lineCount })`

**Internal execution**:

1. Clear canvas and paint background
2. Draw gutter background (if line numbers enabled)
3. Draw line numbers (if enabled)
4. Draw tokens with syntax highlighting colors

#### 5.3b. Animated rendering (during transitions)

**File**: `app/editor/page.tsx`

```typescript
const progress = transitionMs <= 0 ? 1 : t / transitionMs;
const animated = animateLayouts({ from: a.layout, to: b.layout, progress });
drawCodeFrame({
  ctx,
  config: cfg,
  layout: b.layout,
  theme: getThemeVariant(theme),
  tokens: animated,
  showLineNumbers: a.showLineNumbers || b.showLineNumbers,
  startLine: b.startLine,
  lineCount: b.tokenLineCount,
});
```

**File**: `app/lib/magicMove/animate.ts`

**Function**: `animateLayouts({ from, to, progress })`

**Matching strategy**:

- Keyed by `(tokenText, occurrenceIndex)` to match tokens in order
- Matched tokens: interpolate position
- Unmatched tokens (removed): fade out
- New tokens: fade in at destination position

**Returns**: `AnimatedToken[]` with interpolated positions and opacity

---

### 6. Playback Animation Loop

**File**: `app/editor/page.tsx`

**Trigger**: When `isPlaying` changes

**Function**: `useEffect` hook with `requestAnimationFrame` loop

```typescript
const tick = (now: number) => {
  const last = lastFrameRef.current ?? now;
  lastFrameRef.current = now;
  const dt = now - last;
  setPlayheadMs((t) => {
    const next = t + dt;
    return next >= timeline.totalMs ? 0 : next;
  });
  rafRef.current = requestAnimationFrame(tick);
};
```

**Responsibility**: Smooth playback by updating `playheadMs` on every animation frame

---

### 7. Export to Video

**File**: `app/editor/page.tsx`

**Function**: `onExport()` (async)

**Trigger**: User clicks "Export" button

#### 7.1. Setup

```typescript
setIsExporting(true);
setExportProgress(0);

const canvas = canvasRef.current;
const cfg = makeDefaultLayoutConfig();

// Set fixed dimensions for export
const maxLineCount = Math.max(...stepLayouts.map(s => s.tokenLineCount));
const exportHeight = calculateCanvasHeight({...});
canvas.width = cfg.canvasWidth;
canvas.height = exportHeight;
```

#### 7.2. Create render loop

```typescript
const durationMs = timeline.totalMs;
const start = performance.now();

const renderLoop = () => {
  const elapsed = performance.now() - start;
  renderAt(elapsed);
  if (elapsed < durationMs) requestAnimationFrame(renderLoop);
};
requestAnimationFrame(renderLoop);
```

#### 7.3. Record canvas to WebM

**File**: `app/lib/video/recordCanvas.ts`

**Function**: `recordCanvasToWebm({ canvas, fps, durationMs, onProgress })`

**Internal execution**:

1. Create media stream via `canvas.captureStream(fps)`
2. Select best codec: VP9 (10 Mbps) → VP8 (8 Mbps) → fallback
3. Create `MediaRecorder` with selected codec
4. Start recording with 250ms chunk interval
5. Track progress via `onProgress` callback
6. Stop after `durationMs` with buffer for final chunks
7. Create `Blob` from collected chunks

#### 7.4. Convert to MP4 (if selected)

**File**: `app/lib/video/converter.ts` **(NEW)**

**Function**: `convertWebmToMp4({ webmBlob, onProgress })`

**Internal execution**:

1. Load FFmpeg WASM
2. Write WebM blob to FFmpeg filesystem
3. Run conversion: `ffmpeg -i input.webm output.mp4`
4. Read MP4 file from filesystem
5. Create new Blob with MP4 MIME type
6. Cleanup FFmpeg files

**Returns**: MP4 Blob

#### 7.5. Cleanup and download

```typescript
const blob = exportFormat === 'mp4' 
  ? await convertWebmToMp4({ webmBlob, onProgress })
  : webmBlob;

cancelled = true;
const url = URL.createObjectURL(blob);
setDownloadUrl(url);

setIsExporting(false);
setExportProgress(0);
setPlayheadMs(0);
renderAt(0);
```

---

### 8. User Downloads Video

**File**: `components/export-controls.tsx`

**Trigger**: When `downloadUrl` state is set

```typescript
{downloadUrl && (
  <Button variant="outline" size="sm" asChild className="gap-2">
    <a href={downloadUrl} download={exportFilename}>
      <Film className="w-4 h-4" />
      Save Video
    </a>
  </Button>
)}
```

**NEW**: Uses custom `exportFilename` instead of hardcoded "magic-move.webm"

---

## User Interaction Flow

### Adding/Editing Steps

1. **User types in `<StepEditorItem />` textarea**
   - `onCodeChange` callback → `updateSimpleStep()` in `app/editor/page.tsx`
   - Updates `simpleSteps` state
   - Triggers layout recomputation

2. **User clicks "New Step" button**
   - `onAddStep` callback → `addSimpleStep()`
   - Adds new step to `simpleSteps` state

3. **User clicks remove button**
   - `onRemove` callback → `removeSimpleStep()`
   - Removes step from `simpleSteps` state
   - Prevents removal if only one step remains

4. **User clicks "Insert Step" on divider**
   - **NEW**: `onInsertStep` callback → `insertSimpleStep()`
   - Inserts step between existing steps

### Changing Settings

1. **Language/Theme changes**
   - Updates `selectedLang` / `theme` state
   - Triggers re-tokenization and layout recomputation

2. **Line numbers toggle**
   - Updates `simpleShowLineNumbers` state
   - Triggers layout recomputation

3. **FPS adjustment**
   - Updates `fps` state (used during export)

4. **Hold duration adjustments** **(NEW)**
   - Updates `startHoldMs`, `betweenHoldMs`, or `endHoldMs`
   - Triggers timeline recalculation

### Playback Control

1. **Play/Pause**
   - Toggles `isPlaying` state
   - Starts/stops `requestAnimationFrame` loop

2. **Seek via progress bar**
   - Sets `playheadMs` directly
   - Triggers frame rendering at new position

3. **Reset**
   - Stops playback and resets playhead to 0

### Export

1. **Filename input** **(NEW)**
   - Updates `exportFilename` state

2. **Format selection** **(NEW)**
   - Toggles between `'webm'` and `'mp4'`

3. **Transition duration adjustment**
   - Updates `transitionMs` state
   - Triggers timeline recalculation

4. **Export button click**
   - Triggers `onExport()` function
   - Shows progress and disables button during export
   - For MP4: runs FFmpeg WASM conversion after WebM recording

5. **Download button click**
   - Browser downloads the blob URL with custom filename
