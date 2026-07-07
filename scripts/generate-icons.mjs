/**
 * Generates PWA icons and iOS splash screens from an inline SVG mark.
 * Run: npm run icons
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public", "icons");
await mkdir(outDir, { recursive: true });

/**
 * The mark: charcoal rounded square, ascending accent bars —
 * quiet nod to spending trends.
 */
function markSVG(size, { radius = 0.22, padded = false } = {}) {
  const r = Math.round(size * radius);
  const s = size;
  // Bars occupy the middle; padded variant shrinks content for maskable safe zone
  const shrink = padded ? 0.72 : 1;
  const barW = s * 0.13 * shrink;
  const gap = s * 0.075 * shrink;
  const heights = [0.26, 0.4, 0.56].map((h) => s * h * shrink);
  const totalW = barW * 3 + gap * 2;
  const x0 = (s - totalW) / 2;
  const baseline = s / 2 + (heights[2] / 2);
  const bars = heights
    .map((h, i) => {
      const x = x0 + i * (barW + gap);
      const y = baseline - h;
      return `<rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="${barW / 2}" fill="${
        i === 2 ? "#3395ff" : "#3c4148"
      }"/>`;
    })
    .join("");
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}">
      <rect width="${s}" height="${s}" rx="${r}" fill="#101114"/>
      ${bars}
    </svg>`
  );
}

const jobs = [
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
  { file: "apple-touch-icon.png", size: 180, radius: 0 },
  { file: "maskable-512.png", size: 512, radius: 0, padded: true },
];

for (const job of jobs) {
  await sharp(markSVG(job.size, job)).png().toFile(path.join(outDir, job.file));
  console.log("✓", job.file);
}

// iOS splash screens: solid background + centered mark
const splashes = [
  { file: "splash-1170x2532.png", w: 1170, h: 2532 }, // iPhone 12–14
  { file: "splash-1179x2556.png", w: 1179, h: 2556 }, // iPhone 14–16 Pro
  { file: "splash-1290x2796.png", w: 1290, h: 2796 }, // Pro Max
  { file: "splash-750x1334.png", w: 750, h: 1334 }, // iPhone SE
];

for (const { file, w, h } of splashes) {
  const mark = await sharp(markSVG(Math.round(w * 0.28))).png().toBuffer();
  await sharp({
    create: { width: w, height: h, channels: 4, background: "#0a0b0d" },
  })
    .composite([{ input: mark, gravity: "center" }])
    .png()
    .toFile(path.join(outDir, file));
  console.log("✓", file);
}

console.log("Done.");
