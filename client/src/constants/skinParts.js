export const skinRegions = {
  Head: { x: 8, y: 8, w: 8, h: 8, dx: 48, dy: 0, dw: 96, dh: 96 },
  Body: { x: 20, y: 20, w: 8, h: 12, dx: 48, dy: 96, dw: 96, dh: 144 },
  Hat: { x: 40, y: 8, w: 8, h: 8, dx: 48, dy: 0, dw: 96, dh: 96 },
  Jacket: { x: 20, y: 36, w: 8, h: 12, dx: 48, dy: 96, dw: 96, dh: 144 },
  'Left Arm': { x: 36, y: 52, w: 4, h: 12, dx: 144, dy: 96, dw: 48, dh: 144 },
  'Right Arm': { x: 44, y: 20, w: 4, h: 12, dx: 0, dy: 96, dw: 48, dh: 144 },
  'Left Leg': { x: 20, y: 52, w: 4, h: 12, dx: 96, dy: 240, dw: 48, dh: 144 },
  'Right Leg': { x: 4, y: 20, w: 4, h: 12, dx: 48, dy: 240, dw: 48, dh: 144 },
  'Left Sleeve': {
    x: 52,
    y: 52,
    w: 4,
    h: 12,
    dx: 144,
    dy: 96,
    dw: 48,
    dh: 144,
  },
  'Right Sleeve': { x: 44, y: 36, w: 4, h: 12, dx: 0, dy: 96, dw: 48, dh: 144 },
  'Left Pant': { x: 4, y: 52, w: 4, h: 12, dx: 96, dy: 240, dw: 48, dh: 144 },
  'Right Pant': { x: 4, y: 36, w: 4, h: 12, dx: 48, dy: 240, dw: 48, dh: 144 },
};

// Full-texture rectangles within the 64x64 skin PNG, one per part.
// Used to composite the merged skin client-side: each part is copied from its
// source skin into the same rectangle on the destination canvas (identity copy).
// This is the single source of truth for these regions.
export const skinTextureRegions = {
  Head: { left: 0, top: 0, width: 32, height: 16 },
  Hat: { left: 32, top: 0, width: 32, height: 16 },
  Body: { left: 16, top: 16, width: 24, height: 16 },
  Jacket: { left: 16, top: 32, width: 24, height: 16 },
  'Left Arm': { left: 32, top: 48, width: 16, height: 16 },
  'Left Sleeve': { left: 48, top: 48, width: 16, height: 16 },
  'Right Arm': { left: 40, top: 16, width: 16, height: 16 },
  'Right Sleeve': { left: 40, top: 32, width: 16, height: 16 },
  'Left Leg': { left: 16, top: 48, width: 16, height: 16 },
  'Left Pant': { left: 0, top: 48, width: 16, height: 16 },
  'Right Leg': { left: 0, top: 16, width: 16, height: 16 },
  'Right Pant': { left: 0, top: 32, width: 16, height: 16 },
};

export const skinCoords = {
  Head: { x: 16, y: 0, w: 32, h: 32 },
  Body: { x: 16, y: 32, w: 32, h: 48 },
  Hat: { x: 16, y: 0, w: 32, h: 32 },
  Jacket: { x: 16, y: 32, w: 32, h: 48 },
  'Left Arm': { x: 48, y: 32, w: 16, h: 48 },
  'Right Arm': { x: 0, y: 32, w: 16, h: 48 },
  'Left Leg': { x: 32, y: 80, w: 16, h: 48 },
  'Right Leg': { x: 16, y: 80, w: 16, h: 48 },
  'Left Sleeve': { x: 48, y: 32, w: 16, h: 48 },
  'Right Sleeve': { x: 0, y: 32, w: 16, h: 48 },
  'Left Pant': { x: 32, y: 80, w: 16, h: 48 },
  'Right Pant': { x: 16, y: 80, w: 16, h: 48 },
};

export const skinParts = [
  'Head',
  'Hat',
  'Body',
  'Jacket',
  'Left Arm',
  'Left Sleeve',
  'Right Arm',
  'Right Sleeve',
  'Left Leg',
  'Left Pant',
  'Right Leg',
  'Right Pant',
];
