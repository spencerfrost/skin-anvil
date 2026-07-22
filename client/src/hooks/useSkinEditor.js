import { useCallback, useRef, useState } from 'react';
import { LAYERS, layerAtPixel, partAtPixel } from '../constants/skinLayers';
import { skinTextureRegions } from '../constants/skinParts';
import {
  bresenhamLine,
  floodFill,
  getPixel,
  hexToRgba,
  rgbaToHex,
  TEXTURE_SIZE,
} from '../lib/paintTools';

export const TOOLS = {
  PENCIL: 'pencil',
  ERASER: 'eraser',
  BUCKET: 'bucket',
  EYEDROPPER: 'eyedropper',
};

const HISTORY_LIMIT = 64;

// Owns the offscreen 64x64 "document canvas" that is the single source of
// truth for the skin editor. Both the 2D grid view and the 3D viewport render
// from it; `version` increments on every visible mutation so they know to
// refresh. History snapshots are full-frame ImageData (64x64 = 16 KB each).
export const useSkinEditor = () => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const strokeSnapshotRef = useRef(null);
  const pastRef = useRef([]);
  const futureRef = useRef([]);

  const [tool, setTool] = useState(TOOLS.PENCIL);
  const [colorHex, setColorHex] = useState('#3b82f6');
  const [activeLayer, setActiveLayer] = useState(LAYERS.INNER);
  const [version, setVersion] = useState(0);

  const getCanvas = useCallback(() => {
    if (!canvasRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = TEXTURE_SIZE;
      canvas.height = TEXTURE_SIZE;
      canvasRef.current = canvas;
      ctxRef.current = canvas.getContext('2d', { willReadFrequently: true });
      ctxRef.current.imageSmoothingEnabled = false;
    }
    return canvasRef.current;
  }, []);

  const getCtx = useCallback(() => {
    getCanvas();
    return ctxRef.current;
  }, [getCanvas]);

  const bumpVersion = useCallback(() => setVersion((v) => v + 1), []);

  const initFromUrl = useCallback(
    (dataUrl) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          if (
            img.width !== TEXTURE_SIZE ||
            (img.height !== TEXTURE_SIZE && img.height !== TEXTURE_SIZE / 2)
          ) {
            console.warn(
              `Skin editor expected a 64x64 skin, got ${img.width}x${img.height}`
            );
          }
          const ctx = getCtx();
          ctx.clearRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
          ctx.drawImage(img, 0, 0);
          pastRef.current = [];
          futureRef.current = [];
          strokeSnapshotRef.current = null;
          bumpVersion();
          resolve();
        };
        img.onerror = () =>
          reject(new Error('Failed to load skin into the editor'));
        img.src = dataUrl;
      }),
    [getCtx, bumpVersion]
  );

  // Applies the current pencil/eraser to a single texel, respecting the
  // active-layer mask. Returns true if the texel was editable.
  const paintPixel = useCallback(
    (x, y) => {
      if (layerAtPixel(x, y) !== activeLayer) return false;
      const ctx = getCtx();
      if (tool === TOOLS.ERASER) {
        ctx.clearRect(x, y, 1, 1);
      } else {
        ctx.fillStyle = colorHex;
        ctx.clearRect(x, y, 1, 1); // avoid alpha blending onto old pixel
        ctx.fillRect(x, y, 1, 1);
      }
      return true;
    },
    [activeLayer, tool, colorHex, getCtx]
  );

  const paintLine = useCallback(
    (x0, y0, x1, y1) => {
      for (const { x, y } of bresenhamLine(x0, y0, x1, y1)) {
        paintPixel(x, y);
      }
      bumpVersion();
    },
    [paintPixel, bumpVersion]
  );

  const fillAt = useCallback(
    (x, y) => {
      const part = partAtPixel(x, y);
      if (!part || layerAtPixel(x, y) !== activeLayer) return;
      const ctx = getCtx();
      const imageData = ctx.getImageData(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
      const changed = floodFill(
        imageData,
        x,
        y,
        hexToRgba(colorHex),
        skinTextureRegions[part]
      );
      if (changed) {
        ctx.putImageData(imageData, 0, 0);
        bumpVersion();
      }
    },
    [activeLayer, colorHex, getCtx, bumpVersion]
  );

  // Reads the pixel under (x, y); on an opaque pixel adopts its color and
  // switches back to the pencil. Transparent pixels are a no-op.
  const pickColorAt = useCallback(
    (x, y) => {
      const ctx = getCtx();
      const imageData = ctx.getImageData(x, y, 1, 1);
      const [r, g, b, a] = getPixel(imageData, 0, 0);
      if (a === 0) return null;
      const hex = rgbaToHex([r, g, b]);
      setColorHex(hex);
      setTool(TOOLS.PENCIL);
      return hex;
    },
    [getCtx]
  );

  const beginStroke = useCallback(() => {
    strokeSnapshotRef.current = getCtx().getImageData(
      0,
      0,
      TEXTURE_SIZE,
      TEXTURE_SIZE
    );
  }, [getCtx]);

  const commitStroke = useCallback(() => {
    const snapshot = strokeSnapshotRef.current;
    strokeSnapshotRef.current = null;
    if (!snapshot) return;
    const current = getCtx().getImageData(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
    let changed = false;
    for (let i = 0; i < current.data.length; i++) {
      if (current.data[i] !== snapshot.data[i]) {
        changed = true;
        break;
      }
    }
    if (!changed) return;
    pastRef.current.push(snapshot);
    if (pastRef.current.length > HISTORY_LIMIT) pastRef.current.shift();
    futureRef.current = [];
    bumpVersion();
  }, [getCtx, bumpVersion]);

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;
    const ctx = getCtx();
    futureRef.current.push(ctx.getImageData(0, 0, TEXTURE_SIZE, TEXTURE_SIZE));
    ctx.putImageData(pastRef.current.pop(), 0, 0);
    bumpVersion();
  }, [getCtx, bumpVersion]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const ctx = getCtx();
    pastRef.current.push(ctx.getImageData(0, 0, TEXTURE_SIZE, TEXTURE_SIZE));
    ctx.putImageData(futureRef.current.pop(), 0, 0);
    bumpVersion();
  }, [getCtx, bumpVersion]);

  const toDataURL = useCallback(
    () => getCanvas().toDataURL('image/png'),
    [getCanvas]
  );

  return {
    // document
    getDocumentCanvas: getCanvas,
    initFromUrl,
    toDataURL,
    version,
    // tool state
    tool,
    setTool,
    colorHex,
    setColorHex,
    activeLayer,
    setActiveLayer,
    // painting
    paintPixel,
    paintLine,
    fillAt,
    pickColorAt,
    beginStroke,
    commitStroke,
    // history
    undo,
    redo,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
    isDirty: pastRef.current.length > 0 || futureRef.current.length > 0,
  };
};
