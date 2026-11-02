# 🪔 Treasures of Agrabah — QR Scavenger Hunt (Node.js + JSON)

Players scan hidden QR codes to collect treasures. Each treasure counts once. The Genie Power bar fills, and at the goal a win popup appears.

## Project layout
```
public/            ← the website that gets published
  items.json       ← ALL game data: treasures, points, codes, win score
  index.html, game.js, style.css
  qrcodes.html     ← printable QR cards
scripts/build.js   ← checks items.json + makes PNG QR codes in public/qr/
server.js          ← local preview server
.github/workflows/deploy.yml  ← auto-publishes to GitHub Pages on every push
```

## Run it locally
Requires Node.js 18+.
```bash
npm install
npm run dev        # builds, then serves at http://localhost:3000
```

## Publish to GitHub Pages
1. Create a new GitHub repository and upload **everything in this folder** (including the hidden `.github` folder), or push it with git:
   ```bash
   git init && git add . && git commit -m "Agrabah quest"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
2. In the repo go to **Settings → Pages → Build and deployment → Source** and pick **GitHub Actions**.
3. Open the **Actions** tab. When "Publish to GitHub Pages" goes green, the game is live at
   `https://<you>.github.io/<repo>/`

Every time you edit `items.json` and push, it rebuilds and republishes by itself.

> Uploading through the website hides dot-folders on some systems. If the Actions tab shows nothing, make sure `.github/workflows/deploy.yml` made it into the repo.

## Edit the game
Change `public/items.json`:
- `winPoints` — points needed to win
- `winMessage` — text in the win popup
- `items` — each has a unique `code` (what the QR contains), `name`, `emoji`, `points`, `desc`

`npm run build` will stop with a clear message if two items share a code, a field is missing, or the win score is impossible.

## QR codes
- Printable cards: `https://<you>.github.io/<repo>/qrcodes.html`
- Individual PNGs: `public/qr/` after `npm run build` (also published at `/qr/<item-name>.png`)

## Notes
- The camera needs HTTPS or localhost. Opening `index.html` by double-clicking won't work (the JSON can't load either), so use `npm start` or the Pages link.
- Progress is saved on each player's phone. **Reset game** clears it.
- Test without a camera: `http://localhost:3000/?code=AGRABAH-LAMP-7731`
