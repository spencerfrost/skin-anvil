import { skinTextureRegions } from './skinParts';

// Layer identifiers match the mesh names used by skinview3d's PlayerObject
// ("inner" base meshes, "outer" overlay meshes), so raycast hits can be
// compared against the active layer directly.
export const LAYERS = {
  INNER: 'inner',
  OUTER: 'outer',
};

export const OUTER_LAYER_PARTS = [
  'Hat',
  'Jacket',
  'Left Sleeve',
  'Right Sleeve',
  'Left Pant',
  'Right Pant',
];

export const INNER_LAYER_PARTS = [
  'Head',
  'Body',
  'Left Arm',
  'Right Arm',
  'Left Leg',
  'Right Leg',
];

export const layerOfPart = (part) =>
  OUTER_LAYER_PARTS.includes(part) ? LAYERS.OUTER : LAYERS.INNER;

// Returns the part name whose skinTextureRegions rect contains (x, y) in the
// 64x64 texture, or null for unused texture areas.
export const partAtPixel = (x, y) => {
  for (const [part, { left, top, width, height }] of Object.entries(
    skinTextureRegions
  )) {
    if (x >= left && x < left + width && y >= top && y < top + height) {
      return part;
    }
  }
  return null;
};

// Returns 'inner' | 'outer' for pixels inside a part rect, null elsewhere.
export const layerAtPixel = (x, y) => {
  const part = partAtPixel(x, y);
  return part ? layerOfPart(part) : null;
};
