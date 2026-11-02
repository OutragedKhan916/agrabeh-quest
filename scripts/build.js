// `npm run build`
// 1. Checks public/items.json for mistakes (duplicate codes, missing fields, unreachable win score)
// 2. Generates a PNG QR code for every item into public/qr/
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");

const PUBLIC = path.join(__dirname, "..", "public");
const JSON_PATH = path.join(PUBLIC, "items.json");
const QR_DIR = path.join(PUBLIC, "qr");

function fail(msg) {
  console.error("❌ " + msg);
  process.exit(1);
}

let config;
try {
  config = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
} catch (e) {
  fail("items.json is not valid JSON: " + e.message);
}

const { items, winPoints } = config;
if (!Array.isArray(items) || items.length === 0) fail("items.json needs an \"items\" list.");
if (typeof winPoints !== "number" || winPoints <= 0) fail("\"winPoints\" must be a positive number.");

const seen = new Set();
items.forEach((item, i) => {
  for (const key of ["code", "name", "emoji", "points"]) {
    if (item[key] === undefined || item[key] === "") fail(`Item #${i + 1} is missing "${key}".`);
  }
  if (typeof item.points !== "number") fail(`"${item.name}" points must be a number.`);
  if (seen.has(item.code)) fail(`Duplicate code "${item.code}". Every item needs its own code.`);
  seen.add(item.code);
});

const total = items.reduce((s, i) => s + i.points, 0);
if (winPoints > total) fail(`winPoints is ${winPoints} but all items together only give ${total}.`);

(async () => {
  fs.rmSync(QR_DIR, { recursive: true, force: true });
  fs.mkdirSync(QR_DIR, { recursive: true });

  for (const item of items) {
    const file = item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".png";
    await QRCode.toFile(path.join(QR_DIR, file), item.code, {
      width: 600,
      margin: 2,
      color: { dark: "#1f1450", light: "#ffffff" },
    });
    console.log(`  ${item.emoji}  ${item.name.padEnd(16)} ${String(item.points).padStart(3)} pts → qr/${file}`);
  }

  console.log(`\n✅ ${items.length} treasures, ${total} total points, ${winPoints} needed to win.`);
})().catch(e => fail(e.message));
