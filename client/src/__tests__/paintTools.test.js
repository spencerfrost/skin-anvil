import { describe, expect, it } from 'vitest';
import {
  INNER_LAYER_PARTS,
  LAYERS,
  layerAtPixel,
  layerOfPart,
  OUTER_LAYER_PARTS,
  partAtPixel,
} from '../constants/skinLayers';
import {
  bresenhamLine,
  floodFill,
  getPixel,
  hexToRgba,
  rgbaToHex,
  setPixel,
  uvToTexel,
} from '../lib/paintTools';

// jsdom doesn't expose ImageData globally; the paint helpers only rely on
// { width, height, data }, so a plain object stub is equivalent.
const makeImageData = (width, height) => ({
  width,
  height,
  data: new Uint8ClampedArray(width * height * 4),
});

describe('uvToTexel', () => {
  it('maps UV origin (bottom-left) to the bottom-left texel', () => {
    expect(uvToTexel({ x: 0, y: 0 })).toEqual({ x: 0, y: 63 });
  });

  it('maps UV top-left to texel (0, 0)', () => {
    expect(uvToTexel({ x: 0, y: 1 })).toEqual({ x: 0, y: 0 });
  });

  it('clamps the u=1 and v=0 edges into range', () => {
    expect(uvToTexel({ x: 1, y: 0 })).toEqual({ x: 63, y: 63 });
  });

  it('maps interior UVs with floor', () => {
    // u = 10.9/64 lands in texel 10; v = 1 - 20.2/64 lands in texel 20
    expect(uvToTexel({ x: 10.9 / 64, y: 1 - 20.2 / 64 })).toEqual({
      x: 10,
      y: 20,
    });
  });

  it('clamps out-of-range UVs', () => {
    expect(uvToTexel({ x: -0.5, y: 1.5 })).toEqual({ x: 0, y: 0 });
    expect(uvToTexel({ x: 1.5, y: -0.5 })).toEqual({ x: 63, y: 63 });
  });
});

describe('bresenhamLine', () => {
  it('returns a single point when endpoints match', () => {
    expect(bresenhamLine(5, 5, 5, 5)).toEqual([{ x: 5, y: 5 }]);
  });

  it('draws a horizontal line inclusive of both endpoints', () => {
    expect(bresenhamLine(1, 2, 4, 2)).toEqual([
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
    ]);
  });

  it('draws a perfect diagonal', () => {
    expect(bresenhamLine(0, 0, 3, 3)).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 },
    ]);
  });

  it('handles reversed direction with contiguous steps', () => {
    const points = bresenhamLine(4, 7, 0, 5);
    expect(points[0]).toEqual({ x: 4, y: 7 });
    expect(points[points.length - 1]).toEqual({ x: 0, y: 5 });
    for (let i = 1; i < points.length; i++) {
      expect(Math.abs(points[i].x - points[i - 1].x)).toBeLessThanOrEqual(1);
      expect(Math.abs(points[i].y - points[i - 1].y)).toBeLessThanOrEqual(1);
    }
  });
});

describe('getPixel / setPixel', () => {
  it('round-trips a pixel value', () => {
    const imageData = makeImageData(8, 8);
    setPixel(imageData, 3, 4, [10, 20, 30, 255]);
    expect(getPixel(imageData, 3, 4)).toEqual([10, 20, 30, 255]);
    expect(getPixel(imageData, 4, 3)).toEqual([0, 0, 0, 0]);
  });
});

describe('floodFill', () => {
  const bounds = { left: 0, top: 0, width: 8, height: 8 };
  const red = [255, 0, 0, 255];
  const blue = [0, 0, 255, 255];

  it('fills a transparent region and stays within bounds', () => {
    const imageData = makeImageData(16, 16);
    const changed = floodFill(imageData, 2, 2, red, bounds);
    expect(changed).toBe(true);
    expect(getPixel(imageData, 0, 0)).toEqual(red);
    expect(getPixel(imageData, 7, 7)).toEqual(red);
    // Outside bounds untouched even though it is the same (transparent) color
    expect(getPixel(imageData, 8, 0)).toEqual([0, 0, 0, 0]);
    expect(getPixel(imageData, 0, 8)).toEqual([0, 0, 0, 0]);
  });

  it('only replaces exactly-matching connected pixels', () => {
    const imageData = makeImageData(16, 16);
    // Vertical blue wall at x=4 splits the bounds region
    for (let y = 0; y < 8; y++) setPixel(imageData, 4, y, blue);
    floodFill(imageData, 1, 1, red, bounds);
    expect(getPixel(imageData, 0, 0)).toEqual(red);
    expect(getPixel(imageData, 4, 3)).toEqual(blue); // wall untouched
    expect(getPixel(imageData, 6, 3)).toEqual([0, 0, 0, 0]); // right of wall untouched
  });

  it('is a no-op when the target already matches the fill color', () => {
    const imageData = makeImageData(16, 16);
    setPixel(imageData, 2, 2, red);
    expect(floodFill(imageData, 2, 2, red, bounds)).toBe(false);
  });

  it('is a no-op when the seed lies outside bounds', () => {
    const imageData = makeImageData(16, 16);
    expect(floodFill(imageData, 12, 12, red, bounds)).toBe(false);
    expect(getPixel(imageData, 12, 12)).toEqual([0, 0, 0, 0]);
  });
});

describe('hexToRgba / rgbaToHex', () => {
  it('converts hex to opaque RGBA', () => {
    expect(hexToRgba('#ff8000')).toEqual([255, 128, 0, 255]);
    expect(hexToRgba('#000000')).toEqual([0, 0, 0, 255]);
  });

  it('converts RGBA back to hex with zero padding', () => {
    expect(rgbaToHex([255, 128, 0, 255])).toBe('#ff8000');
    expect(rgbaToHex([0, 0, 15, 255])).toBe('#00000f');
  });
});

describe('skinLayers', () => {
  it('partitions all 12 parts between the two layers', () => {
    expect(INNER_LAYER_PARTS).toHaveLength(6);
    expect(OUTER_LAYER_PARTS).toHaveLength(6);
    expect(
      INNER_LAYER_PARTS.filter((p) => OUTER_LAYER_PARTS.includes(p))
    ).toHaveLength(0);
  });

  it('classifies parts by layer', () => {
    expect(layerOfPart('Head')).toBe(LAYERS.INNER);
    expect(layerOfPart('Hat')).toBe(LAYERS.OUTER);
    expect(layerOfPart('Left Sleeve')).toBe(LAYERS.OUTER);
  });

  it('finds the part containing a pixel', () => {
    expect(partAtPixel(8, 8)).toBe('Head'); // head front face
    expect(partAtPixel(40, 8)).toBe('Hat');
    expect(partAtPixel(20, 20)).toBe('Body');
    expect(partAtPixel(20, 36)).toBe('Jacket');
  });

  it('returns null for unused texture areas', () => {
    // Columns 56-63 of rows 16-31 are dead space in the standard layout
    expect(partAtPixel(60, 20)).toBeNull();
    expect(layerAtPixel(60, 20)).toBeNull();
  });

  it('maps pixels to layers', () => {
    expect(layerAtPixel(8, 8)).toBe(LAYERS.INNER);
    expect(layerAtPixel(40, 8)).toBe(LAYERS.OUTER);
  });
});
