// Pure pixel-editing helpers for the skin editor. Everything operates on
// plain data (ImageData, {x, y} texels) so it is unit-testable without a DOM
// canvas context.

export const TEXTURE_SIZE = 64;

const clampTexel = (value, size) => Math.min(Math.max(value, 0), size - 1);

// Maps a three.js UV coordinate (bottom-left origin) to a discrete texture
// pixel (top-left origin). Matches skinview3d's setUVs convention:
// u = px / size, v = 1 - py / size.
export const uvToTexel = (uv, size = TEXTURE_SIZE) => ({
  x: clampTexel(Math.floor(uv.x * size), size),
  y: clampTexel(Math.floor((1 - uv.y) * size), size),
});

// Integer Bresenham line, inclusive of both endpoints.
export const bresenhamLine = (x0, y0, x1, y1) => {
  const points = [];
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;

  for (;;) {
    points.push({ x, y });
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
  return points;
};

export const getPixel = (imageData, x, y) => {
  const i = (y * imageData.width + x) * 4;
  const { data } = imageData;
  return [data[i], data[i + 1], data[i + 2], data[i + 3]];
};

export const setPixel = (imageData, x, y, [r, g, b, a]) => {
  const i = (y * imageData.width + x) * 4;
  const { data } = imageData;
  data[i] = r;
  data[i + 1] = g;
  data[i + 2] = b;
  data[i + 3] = a;
};

const pixelEquals = (imageData, x, y, [r, g, b, a]) => {
  const i = (y * imageData.width + x) * 4;
  const { data } = imageData;
  return (
    data[i] === r && data[i + 1] === g && data[i + 2] === b && data[i + 3] === a
  );
};

// 4-connected flood fill with exact RGBA matching, bounded to `bounds`
// ({left, top, width, height} — typically the seed pixel's part rect so fills
// stay within one unwrapped box). Mutates imageData in place. Returns true if
// any pixel changed.
export const floodFill = (imageData, x, y, fillRgba, bounds) => {
  const target = getPixel(imageData, x, y);
  if (
    target[0] === fillRgba[0] &&
    target[1] === fillRgba[1] &&
    target[2] === fillRgba[2] &&
    target[3] === fillRgba[3]
  ) {
    return false;
  }

  const { left, top, width, height } = bounds;
  const inBounds = (px, py) =>
    px >= left && px < left + width && py >= top && py < top + height;
  if (!inBounds(x, y)) return false;

  const stack = [[x, y]];
  while (stack.length > 0) {
    const [px, py] = stack.pop();
    if (!inBounds(px, py) || !pixelEquals(imageData, px, py, target)) continue;
    setPixel(imageData, px, py, fillRgba);
    stack.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
  }
  return true;
};

// '#rrggbb' -> [r, g, b, 255]
export const hexToRgba = (hex) => {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff, 255];
};

// [r, g, b, ...] -> '#rrggbb'
export const rgbaToHex = ([r, g, b]) =>
  `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
