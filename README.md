# Margin — a little space to think

An interactive vintage typewriter for the web. The whole site *is* the machine: type on your keyboard (or click its keys) and the carriage steps along, the typebar swings up, the ribbon lifts, and ink lands on a sheet of paper that feeds line by line.

Built with Next.js (App Router), React, TypeScript and Tailwind CSS. No images — the typewriter is drawn entirely in CSS and SVG, and every sound is synthesised live with the Web Audio API.

## Features

- **A real typing engine** — 42-column page, word-aware wrapping at the margin, margin bell six characters from the edge, Backspace, Return and Space.
- **Moving carriage** — the paper and platen travel left one character per keystroke, exactly like a real machine, and slide back on Return.
- **Tactile keyboard** — every key presses down and springs back, mirrored for physical and on-screen presses. Shift and Shift Lock work on screen too.
- **Mechanical details** — typebar strike, ribbon vibrator lift, rotating platen knobs, margin scale, carriage-return lever (click it).
- **Roll the platen** — scroll or drag the paper to read back what you've written.
- **Sheets** — feed a fresh sheet, flip between sheets, clear a page (two-step, so nothing is lost by accident).
- **Export** — download every written sheet as a `.txt` file (button or ⌘/Ctrl + S). Pasting text works too.
- **Saved automatically** — writing and sound preference persist in `localStorage`.
- **Sound** — synthesised strikes, space-bar thunk, carriage return and bell, with a mute toggle.
- **Mobile** — a dedicated layout (not a scaled-down desktop): the paper fills the screen, a rail and sliding capsule act as the carriage, and the native keyboard is used for input.
- **Accessible** — real buttons with labels, a screen-reader copy of every line, live announcements, focus styles, and `prefers-reduced-motion` support.

## Run locally

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

Production build:

```bash
npm run build
npm start
```

Type-check only: `npm run lint`.

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Keep the detected defaults (Framework: Next.js, build command `next build`). No environment variables are needed.
4. Deploy.

Fonts are self-hosted from `app/fonts`, so the build needs no network access beyond installing packages.

## Project structure

```
app/
  layout.tsx          Fonts, metadata, viewport
  page.tsx            Renders the typewriter
  globals.css         Design tokens and all machine materials
  fonts/              Courier Prime, Special Elite, Instrument Sans (SIL OFL)
components/typewriter/
  Typewriter.tsx      Root: chooses desktop or mobile layout, corner UI
  Machine.tsx         Desktop machine: carriage, platen, paper, lever, scale
  Body.tsx            SVG body: deck, ribbon spools, typebar basket, nameplate
  Keyboard.tsx        Keys and space bar
  Paper.tsx           Typed lines with per-glyph ink variation
  MobileMachine.tsx   Mobile layout with native keyboard input
  Controls.tsx        Return, clear, new sheet, download, sound, sheet nav
  TypedTitle.tsx      Letter-by-letter intro line
hooks/
  useTypewriter.ts    State, input handling, sound, persistence, export
lib/
  engine.ts           Pure typing engine (wrap, bell, backspace, paste)
  keymap.ts           Keyboard layout keyed by KeyboardEvent.code
  audio.ts            Web Audio sound synthesis
  storage.ts          localStorage load/save with validation
public/textures/      Grain and dust overlays (SVG)
```

## Credits

Fonts: Courier Prime, Special Elite and Instrument Sans, all under the SIL Open Font License.
