import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const outDir = path.join(process.cwd(), "public", "images", "products");
fs.mkdirSync(outDir, { recursive: true });

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  const combined = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(combined), 0);
  return Buffer.concat([len, combined, crcBuf]);
}

function writeProductPng(filename, bgRgb, accentRgb, cardRgb) {
  const width = 1200;
  const height = 675;
  const raw = Buffer.alloc((width * 3 + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 3 + 1);
    raw[rowStart] = 0; // filter none
    for (let x = 0; x < width; x++) {
      const px = rowStart + 1 + x * 3;
      let [r, g, b] = bgRgb;

      // Subtle architectural grid
      if (x % 60 === 0 || y % 60 === 0) {
        r = Math.min(255, r + 10);
        g = Math.min(255, g + 10);
        b = Math.min(255, b + 12);
      }

      // Main editor window frame
      if (x >= 100 && x <= 1100 && y >= 75 && y <= 600) {
        [r, g, b] = cardRgb;
        // Top title bar
        if (y <= 125) {
          r = Math.max(0, r - 12);
          g = Math.max(0, g - 12);
          b = Math.max(0, b - 12);
        }
        // Accent sidebar
        if (x <= 320 && y > 125) {
          r = Math.max(0, r - 6);
          g = Math.max(0, g - 6);
          b = Math.max(0, b - 6);
        }
        // Accent header pill
        if (x >= 360 && x <= 620 && y >= 165 && y <= 205) {
          [r, g, b] = accentRgb;
        }
        // Code / metric blocks
        if (x >= 360 && x <= 700 && y >= 240 && y <= 400) {
          r = Math.min(255, r + 18);
          g = Math.min(255, g + 20);
          b = Math.min(255, b + 24);
        }
        if (x >= 730 && x <= 1060 && y >= 240 && y <= 400) {
          r = Math.min(255, r + 18);
          g = Math.min(255, g + 20);
          b = Math.min(255, b + 24);
        }
        if (x >= 360 && x <= 1060 && y >= 430 && y <= 560) {
          r = Math.min(255, r + 12);
          g = Math.min(255, g + 14);
          b = Math.min(255, b + 18);
        }
      }

      raw[px] = r;
      raw[px + 1] = g;
      raw[px + 2] = b;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = zlib.deflateSync(raw, { level: 6 });
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const png = Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);

  fs.writeFileSync(path.join(outDir, filename), png);
}

const specs = [
  ["saas-launchpad.png", [15, 23, 42], [16, 185, 129], [30, 41, 59]],
  ["commerce-core.png", [24, 24, 27], [245, 158, 11], [39, 39, 42]],
  ["ai-workspace-kit.png", [17, 24, 39], [59, 130, 246], [31, 41, 55]],
  ["cli-release-engine.png", [20, 20, 22], [20, 184, 166], [36, 36, 40]],
  ["docs-portal-pro.png", [15, 23, 42], [99, 102, 241], [30, 41, 59]],
];

for (const [name, bg, accent, card] of specs) {
  writeProductPng(name, bg, accent, card);
}
console.log(`Generated ${specs.length} product PNGs in ${outDir}`);
