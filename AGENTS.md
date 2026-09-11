<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Watchface conventions

Follow the Watchface Studio structure and design language:

- Route files in `src/app` compose components; keep feature UI in `src/components/editor`, shared primitives in `src/components/ui`, and app chrome in `src/components/layout`.
- Keep schema, serialization, render model and Garmin generation in `src/watchface`. Compiler execution stays in `services/watchface`.
- Use the existing `u-*` and spacing utilities for atomic layout, typography, spacing and color. Use shared Button primitives for actions.
- Import styles once through `src/styles/index.scss`. Component-specific global SCSS uses descriptive, prefixed names under `src/styles/components`; page layout belongs in `src/styles/pages`. Do not introduce CSS Modules.
- Use the existing `--app-*` tokens, Inter fonts, theme provider, icons and `cx` helper. Inline styles are reserved for dynamic design values.
- Run lint (including style contracts), typecheck, tests and the production build after structural changes.
- Use Conventional Commit subjects with an appropriate prefix such as `feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`, or `style:`, followed by a concise imperative description.

- Define raw colors, dimensions, shadows and breakpoints in shared style tokens. Use atomics for simple composition; when a dedicated component class is needed, keep its fixed layout and appearance together in its SCSS rule.
