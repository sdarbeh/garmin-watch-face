# Watchface Studio

Personal Garmin Forerunner 970 watch-face builder.

Open http://127.0.0.1:3000. Customize → Build → Download .prg → USB transfer. The compiler starts with the app.

See [setup and installation](docs/watchface/README.md) and [validation](docs/watchface/VALIDATION.md).

## Structure

- `src/app` — routes and page composition.
- `src/components/devices` — home device picker.
- `src/components/editor` — editor workspace, toolbar, layers, and editor-only state types.
  - `canvas` — sample watch rendering and canvas presentation.
  - `inspector` — contextual property controls.
  - `export` — project files, compilation UI, and installation instructions.
  - `hooks` — editor build lifecycle.
- `src/components/ui` — shared controls; `src/components/layout` — app chrome.
- `src/watchface` — design schema, validation, persistence, rendering model, and Garmin generation.
- `services/watchface` — server-only SDK execution and build queue.
- `src/styles/components/editor` — editor component styles; `src/styles/pages/editor.scss` — workspace layout.
- `tests/unit/watchface` — design and reliability checks.

Keep editor interaction state separate from the saved design. Route files import the editor through its public `index.ts`; internal components use direct imports. Browser code must not import `services/watchface`. The browser project store and server compiler queue are intentional singletons, shared across navigation and requests respectively.

## Direct editing

Select a layer or click its sample text on the canvas. Drag to position; center and edge guides snap within six screen pixels. Hold Option/Alt to bypass snapping. Arrow keys move one device pixel; Shift + arrow moves ten. Fit and 100% controls change the canvas view only; use Space + drag, middle-button drag, or scrollbars to pan when enlarged. Undo/redo is available through the buttons or Command/Ctrl + Z, Shift + Command/Ctrl + Z, and Ctrl + Y. Typing fields retain native text-editing shortcuts. Escape cancels an active drag. History holds up to 100 design edits for the current editor session; a completed drag or field edit is one step. Preview uses sample values and hides editing overlays.
