/**
 * Builds every app icon from one source: the brain that dots the i in the wordmark.
 * Run with `node scripts/make-icons.mjs`. Uses sharp (installed with Next).
 *
 *  public/brand/noggin-mark.svg   the brain alone, square viewBox, transparent
 *  src/app/icon.svg               favicon for browsers that take SVG
 *  src/app/favicon.ico            16, 32, 48
 *  src/app/apple-icon.png         180, on the ground colour, ~20% padding
 *  public/icons/icon-192.png, icon-512.png (transparent), icon-512-maskable.png (on ground, 60% safe zone)
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import sharp from "sharp";

// The exact shape and colour from public/logo-dark.svg: the tittle group, untouched.
const wordmark = readFileSync("public/logo-dark.svg", "utf8");
const group = wordmark.slice(wordmark.indexOf('<g fill="#4a5bff">'), wordmark.indexOf("</g></g>", wordmark.indexOf('<g fill="#4a5bff">')) + 8);
const colour = /fill="(#[0-9a-f]{6})"/i.exec(group)[1];
const shapes = group.slice(group.indexOf("<ellipse"), group.lastIndexOf("</g></g>"));
const ground = "#1a1b1e"; // docs/03-design-system.md → ground

// Bounds of the shapes in their own coordinates (the inner transform only scales/positions them in the wordmark).
const d = /<path d="([^"]+)"/.exec(shapes)[1];
const nums = d.match(/-?\d+(\.\d+)?/g).map(Number);
let [x0, y0] = [nums[0], nums[1]];
const pts = [[x0, y0]];
for (let i = 2; i + 5 < nums.length; i += 6) {
  const [x1, y1, x2, y2, x3, y3] = nums.slice(i, i + 6);
  for (let s = 1; s <= 24; s++) {
    const t = s / 24, u = 1 - t;
    pts.push([u ** 3 * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t ** 3 * x3, u ** 3 * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t ** 3 * y3]);
  }
  [x0, y0] = [x3, y3];
}
const el = /<ellipse cx="(\d+)" cy="(\d+)" rx="(\d+)" ry="(\d+)"/.exec(shapes).slice(1).map(Number);
pts.push([el[0] - el[2], el[1]], [el[0] + el[2], el[1]], [el[0], el[1] - el[3]], [el[0], el[1] + el[3]]);
const minX = Math.min(...pts.map((p) => p[0])), maxX = Math.max(...pts.map((p) => p[0]));
const minY = Math.min(...pts.map((p) => p[1])), maxY = Math.max(...pts.map((p) => p[1]));
const w = maxX - minX, h = maxY - minY;
const side = Math.max(w, h) * 1.08; // 4% margin each side
const vx = minX - (side - w) / 2, vy = minY - (side - h) / 2;
const r = (n) => Math.round(n * 10) / 10;

const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${r(vx)} ${r(vy)} ${r(side)} ${r(side)}" fill="${colour}" role="img" aria-label="Noggin">${shapes}</svg>\n`;
mkdirSync("public/brand", { recursive: true });
mkdirSync("public/icons", { recursive: true });
writeFileSync("public/brand/noggin-mark.svg", mark);
writeFileSync("src/app/icon.svg", mark);

const markBuf = Buffer.from(mark);
const png = (size) => sharp(markBuf, { density: 400 }).resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();

/** The brain on the ground colour, scaled to `share` of the canvas and centred. */
async function onGround(size, share) {
  const inner = Math.round(size * share);
  const brain = await png(inner);
  return sharp({ create: { width: size, height: size, channels: 4, background: ground } })
    .composite([{ input: brain, left: Math.round((size - inner) / 2), top: Math.round((size - inner) / 2) }])
    .png()
    .toBuffer();
}

writeFileSync("src/app/apple-icon.png", await onGround(180, 0.6));
writeFileSync("public/icons/icon-192.png", await png(192));
writeFileSync("public/icons/icon-512.png", await png(512));
writeFileSync("public/icons/icon-512-maskable.png", await onGround(512, 0.6));

// favicon.ico: an ICO container holding PNG images at 16, 32 and 48.
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map(png));
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(sizes.length, 4);
const dir = [];
let offset = 6 + 16 * sizes.length;
sizes.forEach((size, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(size === 256 ? 0 : size, 0); e.writeUInt8(size === 256 ? 0 : size, 1);
  e.writeUInt8(0, 2); e.writeUInt8(0, 3); e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6);
  e.writeUInt32LE(images[i].length, 8); e.writeUInt32LE(offset, 12);
  offset += images[i].length;
  dir.push(e);
});
writeFileSync("src/app/favicon.ico", Buffer.concat([header, ...dir, ...images]));

// A preview of the 16px favicon on light and dark tab bars, for checking by eye.
const tiny = await png(16);
const bar = async (bg) => sharp({ create: { width: 48, height: 48, channels: 4, background: bg } }).composite([{ input: tiny, left: 16, top: 16 }]).png().toBuffer();
const strip = await sharp({ create: { width: 96, height: 48, channels: 4, background: "#888888" } })
  .composite([{ input: await bar("#f3f3f3"), left: 0, top: 0 }, { input: await bar("#202124"), left: 48, top: 0 }])
  .resize(384, 192, { kernel: "nearest" }).png().toBuffer();
writeFileSync(process.env.PREVIEW_OUT ?? "/tmp/favicon-preview.png", strip);

console.log(`mark colour ${colour}; viewBox ${r(vx)} ${r(vy)} ${r(side)} ${r(side)}; shapes ${w.toFixed(0)}×${h.toFixed(0)}`);
