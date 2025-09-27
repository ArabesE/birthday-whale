# Birthday Whale

A tiny Vite-based interactive 3D birthday page featuring a friendly whale, musical bubbles, and a short celebration sequence.

## Quick start

- Install deps: `pnpm install`
- Start dev server: `pnpm dev`
- Build: `pnpm build`
- Preview build: `pnpm preview`

This project loads three.js, anime.js, and canvas-confetti via CDN in `index.html`, so there are no runtime npm deps beyond Vite.

## Notes

- Cleanup adds editor/lint/format configs only; functionality is unchanged.
- If you want formatting and linting, install Prettier and ESLint dev deps and run the scripts in `package.json` (see below).
