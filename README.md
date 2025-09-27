# Birthday Whale

A tiny Vite-based interactive 3D birthday page featuring a friendly whale, musical bubbles, and a short celebration sequence.

## Quick start

- Install deps: `pnpm install`
- Start dev server: `pnpm dev`
- Build: `pnpm build`
- Preview build: `pnpm preview`

This project loads three.js, anime.js, and canvas-confetti via CDN in `index.html`, so there are no runtime npm deps beyond Vite.

## Sound Effects

- **Birthday Musicbox**: Happy Birthday Music Box Loop by SergeQuadrado -- https://freesound.org/s/469423/ -- License: Attribution NonCommercial 3.0

## Deploy to GitHub Pages

This repo includes a GitHub Actions workflow that builds the site and publishes the `dist/` folder to GitHub Pages.

1. One-time repo settings

- In your GitHub repository, go to Settings → Pages.
- Set Source to "GitHub Actions".

2. Trigger a deploy

- Push to `main`, or
- Manually run the workflow: Actions → "Deploy static site to Pages" → Run workflow.

The site will be available at:

- https://USERNAME.github.io/birthday-whale/

Notes

- The Vite `base` is set to `/birthday-whale/` in `vite.config.js`, which is required for project pages so assets resolve correctly.
- The workflow file lives at `.github/workflows/deploy.yml` and uses `pnpm build` to produce `dist/`.

### Manual alternative (publish only dist/ to gh-pages)

If you prefer a one-off manual publish without Actions, you can push the built `dist/` to a `gh-pages` branch using a git worktree.

PowerShell commands (Windows):

```powershell
# Build the site
pnpm install
pnpm build

# Create a local worktree for the gh-pages branch
git worktree add -B gh-pages .gh-pages

# Copy the built files into the worktree (mirror keeps it in sync)
robocopy dist .gh-pages /MIR /E | Out-Null

# Commit and push the site
pushd .gh-pages
git add -A
git commit -m "Publish site"
git push -u origin gh-pages
popd
```

Then in Settings → Pages, set Source to deploy from the `gh-pages` branch (root). With this method, you do not need to commit `dist/` to `main`.
