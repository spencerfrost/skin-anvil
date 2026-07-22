import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LAYERS } from '../constants/skinLayers';
import { TOOLS, useSkinEditor } from '../hooks/useSkinEditor';

// In-memory 2D context mock backed by a real pixel buffer, so the hook's
// canvas operations (fillRect/clearRect/getImageData/putImageData) behave
// like a genuine 64x64 canvas.
const SIZE = 64;

const parseHex = (hex) => {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff, 255];
};

const createMockContext = (canvas) => {
  const data = new Uint8ClampedArray(SIZE * SIZE * 4);
  const ctx = {
    canvas,
    imageSmoothingEnabled: false,
    fillStyle: '#000000',
    fillRect(x, y, w, h) {
      const [r, g, b, a] = parseHex(this.fillStyle);
      for (let py = y; py < y + h; py++) {
        for (let px = x; px < x + w; px++) {
          const i = (py * SIZE + px) * 4;
          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
          data[i + 3] = a;
        }
      }
    },
    clearRect(x, y, w, h) {
      for (let py = y; py < y + h; py++) {
        for (let px = x; px < x + w; px++) {
          data.fill(0, (py * SIZE + px) * 4, (py * SIZE + px) * 4 + 4);
        }
      }
    },
    getImageData(x, y, w, h) {
      const out = new Uint8ClampedArray(w * h * 4);
      for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
          const src = ((y + py) * SIZE + (x + px)) * 4;
          out.set(data.subarray(src, src + 4), (py * w + px) * 4);
        }
      }
      return { width: w, height: h, data: out };
    },
    putImageData(imageData, dx, dy) {
      for (let py = 0; py < imageData.height; py++) {
        for (let px = 0; px < imageData.width; px++) {
          const src = (py * imageData.width + px) * 4;
          const dst = ((dy + py) * SIZE + (dx + px)) * 4;
          data.set(imageData.data.subarray(src, src + 4), dst);
        }
      }
    },
    drawImage: vi.fn(),
    _data: data,
  };
  return ctx;
};

const pixelAt = (ctx, x, y) => {
  const i = (y * SIZE + x) * 4;
  return Array.from(ctx._data.subarray(i, i + 4));
};

let lastCtx;
let originalGetContext;
let originalToDataURL;
let originalImage;

beforeEach(() => {
  originalGetContext = HTMLCanvasElement.prototype.getContext;
  originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
  originalImage = global.Image;
  HTMLCanvasElement.prototype.getContext = function () {
    if (!this._mockCtx) this._mockCtx = createMockContext(this);
    lastCtx = this._mockCtx;
    return this._mockCtx;
  };
  HTMLCanvasElement.prototype.toDataURL = vi.fn(
    () => 'data:image/png;base64,edited'
  );
  global.Image = class {
    constructor() {
      this.width = 64;
      this.height = 64;
      setTimeout(() => this.onload && this.onload(), 0);
    }
  };
});

afterEach(() => {
  HTMLCanvasElement.prototype.getContext = originalGetContext;
  HTMLCanvasElement.prototype.toDataURL = originalToDataURL;
  global.Image = originalImage;
  lastCtx = undefined;
});

describe('useSkinEditor', () => {
  it('paints pixels on the active (inner) layer with the pencil', () => {
    const { result } = renderHook(() => useSkinEditor());
    act(() => {
      result.current.setColorHex('#ff0000');
    });
    act(() => {
      result.current.paintLine(8, 8, 10, 8); // Head region
    });
    expect(pixelAt(lastCtx, 8, 8)).toEqual([255, 0, 0, 255]);
    expect(pixelAt(lastCtx, 10, 8)).toEqual([255, 0, 0, 255]);
  });

  it('refuses to paint outside the active layer or in dead zones', () => {
    const { result } = renderHook(() => useSkinEditor());
    result.current.getDocumentCanvas(); // force canvas creation
    act(() => {
      result.current.paintLine(40, 8, 40, 8); // Hat region (outer), inner active
      result.current.paintLine(60, 20, 60, 20); // dead zone
    });
    expect(pixelAt(lastCtx, 40, 8)).toEqual([0, 0, 0, 0]);
    expect(pixelAt(lastCtx, 60, 20)).toEqual([0, 0, 0, 0]);
  });

  it('paints the outer layer after switching layers', () => {
    const { result } = renderHook(() => useSkinEditor());
    act(() => {
      result.current.setActiveLayer(LAYERS.OUTER);
      result.current.setColorHex('#00ff00');
    });
    act(() => {
      result.current.paintLine(40, 8, 40, 8); // Hat region
    });
    expect(pixelAt(lastCtx, 40, 8)).toEqual([0, 255, 0, 255]);
  });

  it('erases to transparency', () => {
    const { result } = renderHook(() => useSkinEditor());
    act(() => {
      result.current.setColorHex('#ff0000');
    });
    act(() => {
      result.current.paintLine(8, 8, 8, 8);
    });
    act(() => {
      result.current.setTool(TOOLS.ERASER);
    });
    act(() => {
      result.current.paintLine(8, 8, 8, 8);
    });
    expect(pixelAt(lastCtx, 8, 8)).toEqual([0, 0, 0, 0]);
  });

  it('bucket-fills within the seed part on the active layer only', () => {
    const { result } = renderHook(() => useSkinEditor());
    act(() => {
      result.current.setColorHex('#0000ff');
    });
    act(() => {
      result.current.fillAt(8, 8); // Head rect: 0,0,32,16
    });
    expect(pixelAt(lastCtx, 0, 0)).toEqual([0, 0, 255, 255]);
    expect(pixelAt(lastCtx, 31, 15)).toEqual([0, 0, 255, 255]);
    expect(pixelAt(lastCtx, 32, 0)).toEqual([0, 0, 0, 0]); // Hat rect untouched
    // fillAt on the wrong layer is a no-op
    act(() => {
      result.current.fillAt(40, 8);
    });
    expect(pixelAt(lastCtx, 40, 8)).toEqual([0, 0, 0, 0]);
  });

  it('eyedropper adopts opaque colors and switches to pencil; ignores transparent', () => {
    const { result } = renderHook(() => useSkinEditor());
    act(() => {
      result.current.setColorHex('#ff8000');
    });
    act(() => {
      result.current.paintLine(8, 8, 8, 8);
    });
    act(() => {
      result.current.setTool(TOOLS.EYEDROPPER);
      result.current.setColorHex('#123456');
    });
    let picked;
    act(() => {
      picked = result.current.pickColorAt(8, 8);
    });
    expect(picked).toBe('#ff8000');
    expect(result.current.colorHex).toBe('#ff8000');
    expect(result.current.tool).toBe(TOOLS.PENCIL);

    act(() => {
      result.current.setTool(TOOLS.EYEDROPPER);
    });
    act(() => {
      picked = result.current.pickColorAt(20, 8); // transparent
    });
    expect(picked).toBeNull();
    expect(result.current.tool).toBe(TOOLS.EYEDROPPER);
  });

  it('tracks stroke history with undo/redo', () => {
    const { result } = renderHook(() => useSkinEditor());
    act(() => {
      result.current.setColorHex('#ff0000');
    });
    act(() => {
      result.current.beginStroke();
      result.current.paintLine(8, 8, 8, 8);
      result.current.commitStroke();
    });
    expect(result.current.canUndo).toBe(true);
    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.undo();
    });
    expect(pixelAt(lastCtx, 8, 8)).toEqual([0, 0, 0, 0]);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);

    act(() => {
      result.current.redo();
    });
    expect(pixelAt(lastCtx, 8, 8)).toEqual([255, 0, 0, 255]);
    expect(result.current.canRedo).toBe(false);
  });

  it('does not record history for strokes that change nothing', () => {
    const { result } = renderHook(() => useSkinEditor());
    act(() => {
      result.current.beginStroke();
      result.current.paintLine(60, 20, 60, 20); // dead zone: no pixels change
      result.current.commitStroke();
    });
    expect(result.current.canUndo).toBe(false);
    expect(result.current.isDirty).toBe(false);
  });

  it('clears the redo stack when a new stroke is committed', () => {
    const { result } = renderHook(() => useSkinEditor());
    act(() => {
      result.current.setColorHex('#ff0000');
    });
    act(() => {
      result.current.beginStroke();
      result.current.paintLine(8, 8, 8, 8);
      result.current.commitStroke();
    });
    act(() => {
      result.current.undo();
    });
    expect(result.current.canRedo).toBe(true);
    act(() => {
      result.current.beginStroke();
      result.current.paintLine(9, 8, 9, 8);
      result.current.commitStroke();
    });
    expect(result.current.canRedo).toBe(false);
  });

  it('bumps version on paint operations', () => {
    const { result } = renderHook(() => useSkinEditor());
    const before = result.current.version;
    act(() => {
      result.current.paintLine(8, 8, 9, 8);
    });
    expect(result.current.version).toBeGreaterThan(before);
  });

  it('initFromUrl loads the image and resets history', async () => {
    const { result } = renderHook(() => useSkinEditor());
    act(() => {
      result.current.setColorHex('#ff0000');
    });
    act(() => {
      result.current.beginStroke();
      result.current.paintLine(8, 8, 8, 8);
      result.current.commitStroke();
    });
    expect(result.current.isDirty).toBe(true);
    await act(async () => {
      await result.current.initFromUrl('data:image/png;base64,source');
    });
    expect(lastCtx.drawImage).toHaveBeenCalled();
    expect(result.current.isDirty).toBe(false);
    expect(result.current.canUndo).toBe(false);
  });

  it('exports the document canvas as a PNG data URL', () => {
    const { result } = renderHook(() => useSkinEditor());
    expect(result.current.toDataURL()).toBe('data:image/png;base64,edited');
  });
});
