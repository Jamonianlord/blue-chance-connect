const { writeFileSync } = require("node:fs");
const { deflateSync } = require("node:zlib");
const { createHash } = require("node:crypto");

const WIDTH = 1200;
const HEIGHT = 630;

// Brand gradient colors (approximated from OKLCH values)
// oklch(0.62 0.2 255) ≈ RGB(87, 122, 233) - lighter
// oklch(0.5 0.22 265) ≈ RGB(50, 95, 220) - darker
function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function getGradientColor(y) {
  const t = y / (HEIGHT - 1);
  return {
    r: lerp(87, 50, t),
    g: lerp(122, 95, t),
    b: lerp(233, 220, t),
  };
}

// Simple 5x7 font using pixel patterns
// Each character is 5 wide, 7 tall
const FONT_5x7 = {
  "1": ["01000", "11000", "01000", "01000", "01000", "01000", "11100"],
  "c": ["01110", "10000", "10000", "10000", "10000", "10000", "01110"],
  "h": ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  "a": ["01110", "10001", "10001", "10001", "11111", "10001", "10001"],
  "n": ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  "e": ["01110", "10001", "10001", "11111", "10000", "10001", "01110"],
  "o": ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  "C": ["01110", "10000", "10000", "10000", "10000", "10000", "01110"],
  "l": ["100", "100", "100", "100", "100", "100", "111"],
  "i": ["010", "000", "100", "100", "100", "100", "111"],
  "k": ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["000", "000", "000", "000", "000", "000", "111"],
  "O": ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  "u": ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  "t": ["00100", "00100", "00100", "11111", "00100", "00100", "00100"],
  "w": ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  "m": ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  "s": ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  "c": ["01110", "10000", "10000", "10000", "10000", "10000", "01110"],
  "h": ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  "a": ["01110", "10001", "10001", "10001", "11111", "10001", "10001"],
  "n": ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  "c": ["01110", "10000", "10000", "10000", "10000", "10000", "01110"],
  "e": ["01110", "10001", "10001", "11111", "10000", "10001", "01110"],
  ".": ["000", "000", "000", "000", "000", "000", "111"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  "O": ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  "n": ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  "e": ["01110", "10001", "10001", "11111", "10000", "10001", "01110"],
  ".": ["000", "000", "000", "000", "000", "000", "111"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  "c": ["01110", "10000", "10000", "10000", "10000", "10000", "01110"],
  "h": ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  "a": ["01110", "10001", "10001", "10001", "11111", "10001", "10001"],
  "n": ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  "c": ["01110", "10000", "10000", "10000", "10000", "10000", "01110"],
  "e": ["01110", "10001", "10001", "11111", "10000", "10001", "01110"],
  ".": ["000", "000", "000", "000", "000", "000", "111"],
};

// Create canvas as a flat RGB buffer
const canvas = new Uint8Array(WIDTH * HEIGHT * 3);

function setPixel(x, y, r, g, b) {
  if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return;
  const idx = (y * WIDTH + x) * 3;
  canvas[idx] = r;
  canvas[idx + 1] = g;
  canvas[idx + 2] = b;
}

function fillBackground() {
  for (let y = 0; y < HEIGHT; y++) {
    const color = getGradientColor(y);
    for (let x = 0; x < WIDTH; x++) {
      setPixel(x, y, color.r, color.g, color.b);
    }
  }
}

function drawText(text, startX, startY, color, scale = 4) {
  let x = startX;
  for (const char of text) {
    const glyph = FONT_5x7[char] || FONT_5x7[" "];
    if (!glyph) {
      x += 6 * scale;
      continue;
    }
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if (glyph[row][col] === "1") {
          for (let sy = 0; sy < scale; sy++) {
            for (let sx = 0; sx < scale; sx++) {
              setPixel(x + col * scale + sx, startY + row * scale + sy, color.r, color.g, color.b);
            }
          }
        }
      }
    }
    x += 6 * scale;
  }
}

function makePng() {
  // Convert RGB buffer to PNG with scanlines
  const scanlineLen = 1 + WIDTH * 3; // filter byte + RGB data
  const raw = Buffer.alloc(HEIGHT * scanlineLen);

  for (let y = 0; y < HEIGHT; y++) {
    const offset = y * scanlineLen;
    raw[offset] = 0; // filter: None
    for (let x = 0; x < WIDTH; x++) {
      const canvasIdx = (y * WIDTH + x) * 3;
      raw[offset + 1 + x * 3] = canvas[canvasIdx];
      raw[offset + 2 + x * 3] = canvas[canvasIdx + 1];
      raw[offset + 3 + x * 3] = canvas[canvasIdx + 2];
    }
  }

  const compressed = deflateSync(raw);

  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(WIDTH, 0);
  ihdr.writeUInt32BE(HEIGHT, 4);
  ihdr[8] = 8;
  ihdr[9] = 2; // RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const crc32 = (buf) => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[n] = c;
    }
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
  };

  function chunk(type, data) {
    const typeBuffer = Buffer.from(type, "ascii");
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);
    const crcValue = crc32(Buffer.concat([typeBuffer, data])) >>> 0;
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crcValue, 0);
    return Buffer.concat([length, typeBuffer, data, crc]);
  }

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// Generate the image
fillBackground();

// Draw "1chance" - "1" in accent blue, "chance" in white
// Scale up for better visibility (scale = 8 for ~90px character height)
const SCALE = 8;
const TEXT_HEIGHT = 7 * SCALE; // 56px
const LOGO_Y = Math.floor((HEIGHT / 2) - TEXT_HEIGHT - 30);

// "1" in accent blue
drawText("1", Math.floor(WIDTH / 2 - 100), LOGO_Y, { r: 87, g: 122, b: 233 }, SCALE);

// "chance" in white, starting after "1"
drawText("chance", Math.floor(WIDTH / 2 - 40), LOGO_Y, { r: 255, g: 255, b: 255 }, SCALE);

// Tagline below: "One click. One match. One chance."
const TAGLINE_SCALE = 2;
const TAGLINE_HEIGHT = 7 * TAGLINE_SCALE;
const TAGLINE_Y = LOGO_Y + TEXT_HEIGHT + 40;

drawText("One click. One match. One chance.", Math.floor((WIDTH - 34 * 6 * TAGLINE_SCALE) / 2), TAGLINE_Y, { r: 220, g: 220, b: 230 }, TAGLINE_SCALE);

const png = makePng();
writeFileSync("public/og-image.png", png);
console.log("Wrote public/og-image.png");
