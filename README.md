# 🪔 Treasures of Agrabah — QR Scavenger Hunt

Players scan hidden QR codes to collect treasures. Each counts once. The Genie Power bar fills, and at the goal a win popup appears.

## Files
```
index.html, game.js, style.css   ← the game
items.json                        ← ALL game data: treasures, points, QR codes, win score
icons/                            ← custom item images (e.g. the lantern)
qrcodes.html                      ← printable QR cards
server.js                         ← `npm start` local preview
scripts/build.js                  ← `npm run build`: checks items.json, makes QR PNGs in qr/
.github/workflows/deploy.yml      ← auto-publish to GitHub Pages
```

## Publish / update on GitHub Pages
Upload **the contents of this zip to the top level of the repo** (not inside a subfolder), replacing the old files, then commit.

Either Pages setting works:
- **Settings → Pages → Source: GitHub Actions** → the workflow builds and publishes (watch the Actions tab go green).
- **Source: Deploy from a branch → main → / (root)** → GitHub serves the files directly, no build needed.

**Check it updated:** the small "version …" text at the bottom of the game page shows which version is live. If it's the old number, wait a couple of minutes and reload.

> Uploading through the GitHub website can skip the hidden `.github` folder. That's fine with "Deploy from a branch". With "GitHub Actions" you need that file, so if it's missing, create `.github/workflows/deploy.yml` with **Add file → Create new file** and paste its contents.

## Run locally (Node 18+)
```bash
npm install
npm run dev     # http://localhost:3000
```

## Edit the game
Change `items.json`:
- `winPoints` — points needed to win; `winMessage` — popup text
- `items` — each has a unique `code` (what the QR contains), `name`, `points`, `desc`, and an `emoji` or `icon` (image path)

After editing, bump the `?v=` numbers in `index.html` so phones load the fresh files.

## QR codes
Print from `https://<you>.github.io/<repo>/qrcodes.html`. Reprint whenever you change a `code`.

## Notes
- The camera needs https (Pages is) — open the link in Safari/Chrome, not inside Instagram/WhatsApp.
- Progress is saved per phone. **Reset game** clears it.
- Test without a camera: `…/?code=AGRABAH-CAVE-4127`
