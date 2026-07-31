const { writeFileSync } = require("node:fs");
const { deflateSync } = require("node:zlib");
const { createHash } = require("node:crypto");

const WIDTH = 1200;
const HEIGHT = 630;
const RGB_R = 24;
const RGB_G = 90;
const RGB_B = 220;

function makePng(width, height, r, g, b) {
  const scanline = Buffer.alloc(1 + width * 3);
  scanline[0] = 0;
  for (let x = 0; x < width; x++) {
    scanline[1 + x * 3] = r;
    scanline[2 + x * 3] = g;
    scanline[3 + x * 3] = b;
  }

  const raw = Buffer.alloc(height * scanline.length);
  for (let y = 0; y < height; y++) {
    scanline.copy(raw, y * scanline.length);
  }

  const compressed = deflateSync(raw);

  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const png = Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);

  return png;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = createHash("crc32").update(typeBuffer).update(data).digest();
  return Buffer.concat([length, typeBuffer, data, crc]);
}

const png = makePng(WIDTH, HEIGHT, RGB_R, RGB_G, RGB_B);
writeFileSync("public/og-image.png", png);
console.log("Wrote public/og-image.png");
