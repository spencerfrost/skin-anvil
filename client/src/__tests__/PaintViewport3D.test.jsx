import { fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PaintViewport3D from '../components/SkinEditor/PaintViewport3D';

// ---- skinview3d mock -------------------------------------------------------
const viewers = [];

vi.mock('skinview3d', () => ({
  SkinViewer: class {
    constructor(options) {
      this.options = options;
      this.animation = undefined;
      this.autoRotate = undefined;
      this.zoom = undefined;
      this.background = undefined;
      this.camera = { position: { set: vi.fn() }, lookAt: vi.fn() };
      this.globalLight = { intensity: 0 };
      this.cameraLight = { intensity: 0 };
      this.controls = { mouseButtons: {}, touches: {} };
      this.playerObject = {
        skin: { map: null, setOuterLayerVisible: vi.fn() },
      };
      this.loadSkin = vi.fn();
      this.setSize = vi.fn();
      this.dispose = vi.fn();
      viewers.push(this);
    }
  },
}));

// ---- three mock ------------------------------------------------------------
// Scripted intersections for the next raycasts; tests assign to it.
let mockHits = [];

vi.mock('three', () => ({
  CanvasTexture: class {
    constructor(source) {
      this.source = source;
      this.needsUpdate = false;
      this.dispose = vi.fn();
    }
  },
  Raycaster: class {
    constructor() {
      this.ray = { direction: { x: 0, y: 0, z: -1 } };
    }
    setFromCamera() {}
    intersectObject() {
      return mockHits;
    }
  },
  Vector2: class {
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }
  },
  MOUSE: { ROTATE: 0, DOLLY: 1, PAN: 2 },
  TOUCH: { ROTATE: 0, DOLLY_ROTATE: 5 },
  NearestFilter: 'nearest',
}));

// A raycast hit whose face points toward (-1) or away from (+1) the camera.
const makeHit = (name, texelX, texelY, facing = -1) => ({
  object: { name, uuid: `uuid-${name}`, matrixWorld: {} },
  uv: { x: (texelX + 0.5) / 64, y: 1 - (texelY + 0.5) / 64 },
  face: {
    normal: {
      clone() {
        return this;
      },
      transformDirection() {
        return this;
      },
      dot: () => facing,
    },
  },
});

const makeEditor = () => ({
  getDocumentCanvas: vi.fn(() => document.createElement('canvas')),
  version: 0,
  tool: 'pencil',
  activeLayer: 'inner',
  beginStroke: vi.fn(),
  commitStroke: vi.fn(),
  paintLine: vi.fn(),
  fillAt: vi.fn(),
  pickColorAt: vi.fn(),
});

const getCanvas = (container) =>
  container.querySelector('[data-testid="paint-viewport-canvas"]');

// jsdom has no PointerEvent; dispatch MouseEvents with pointer type names so
// button/clientX/clientY survive (React routes by event type string).
const firePointer = (node, type, init = {}) =>
  fireEvent(node, new MouseEvent(type, { bubbles: true, ...init }));

describe('PaintViewport3D', () => {
  beforeEach(() => {
    viewers.length = 0;
    mockHits = [];
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    HTMLElement.prototype.setPointerCapture = vi.fn();
    HTMLElement.prototype.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
      right: 100,
      bottom: 100,
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates one viewer configured for painting', () => {
    const { rerender, unmount } = render(
      <PaintViewport3D editor={makeEditor()} />
    );
    expect(viewers).toHaveLength(1);
    const viewer = viewers[0];
    expect(viewer.animation).toBeNull();
    expect(viewer.loadSkin).toHaveBeenCalled();
    // Live texture bound to the document canvas
    expect(viewer.playerObject.skin.map).not.toBeNull();
    // Left mouse reserved for painting; right rotates
    expect(viewer.controls.mouseButtons).toEqual({
      LEFT: -1,
      MIDDLE: 1,
      RIGHT: 0,
    });
    expect(viewer.controls.touches).toEqual({ ONE: -1, TWO: 5 });

    // Re-renders never recreate the viewer
    rerender(<PaintViewport3D editor={makeEditor()} />);
    expect(viewers).toHaveLength(1);

    const texture = viewer.playerObject.skin.map;
    unmount();
    expect(viewer.dispose).toHaveBeenCalled();
    expect(texture.dispose).toHaveBeenCalled();
  });

  it('paints raycast texels on left-drag and commits on release', () => {
    const editor = makeEditor();
    const { container } = render(<PaintViewport3D editor={editor} />);
    const canvas = getCanvas(container);

    mockHits = [makeHit('inner', 8, 8)];
    firePointer(canvas, 'pointerdown', { button: 0, clientX: 50, clientY: 50 });
    expect(editor.beginStroke).toHaveBeenCalled();
    expect(editor.paintLine).toHaveBeenCalledWith(8, 8, 8, 8);

    mockHits = [makeHit('inner', 10, 9)];
    firePointer(canvas, 'pointermove', { clientX: 55, clientY: 52 });
    expect(editor.paintLine).toHaveBeenLastCalledWith(8, 8, 10, 9);

    firePointer(canvas, 'pointerup');
    expect(editor.commitStroke).toHaveBeenCalled();
  });

  it('ignores hits on the inactive layer', () => {
    const editor = makeEditor(); // activeLayer: inner
    const { container } = render(<PaintViewport3D editor={editor} />);

    mockHits = [makeHit('outer', 40, 8)];
    firePointer(getCanvas(container), 'pointerdown', {
      button: 0,
      clientX: 50,
      clientY: 50,
    });
    expect(editor.beginStroke).not.toHaveBeenCalled();
    expect(editor.paintLine).not.toHaveBeenCalled();
  });

  it('ignores back-facing hits and paints the front-facing one behind them', () => {
    const editor = makeEditor();
    const { container } = render(<PaintViewport3D editor={editor} />);

    // Nearest hit faces away from the camera (interior wall of a DoubleSide
    // overlay box); the front-facing hit behind it should win instead.
    mockHits = [makeHit('inner', 30, 30, +1), makeHit('inner', 12, 12, -1)];
    firePointer(getCanvas(container), 'pointerdown', {
      button: 0,
      clientX: 50,
      clientY: 50,
    });
    expect(editor.paintLine).toHaveBeenCalledWith(12, 12, 12, 12);
  });

  it('resets the stroke anchor when the pointer jumps across UV islands', () => {
    const editor = makeEditor();
    const { container } = render(<PaintViewport3D editor={editor} />);
    const canvas = getCanvas(container);

    mockHits = [makeHit('inner', 8, 8)];
    firePointer(canvas, 'pointerdown', { button: 0, clientX: 50, clientY: 50 });

    // Far-away texel on the same mesh: no Bresenham smear between them
    mockHits = [makeHit('inner', 30, 8)];
    firePointer(canvas, 'pointermove', { clientX: 80, clientY: 50 });
    expect(editor.paintLine).toHaveBeenLastCalledWith(30, 8, 30, 8);
  });

  it('uses bucket and eyedropper as single operations', () => {
    const editor = makeEditor();
    editor.tool = 'bucket';
    const { container } = render(<PaintViewport3D editor={editor} />);
    const canvas = getCanvas(container);

    mockHits = [makeHit('inner', 8, 8)];
    firePointer(canvas, 'pointerdown', { button: 0, clientX: 50, clientY: 50 });
    expect(editor.fillAt).toHaveBeenCalledWith(8, 8);
    expect(editor.commitStroke).toHaveBeenCalled();

    editor.tool = 'eyedropper';
    firePointer(canvas, 'pointerdown', { button: 0, clientX: 50, clientY: 50 });
    expect(editor.pickColorAt).toHaveBeenCalledWith(8, 8);
  });

  it('suppresses painting and enables left-orbit while Space is held', () => {
    const editor = makeEditor();
    const { container } = render(<PaintViewport3D editor={editor} />);
    const canvas = getCanvas(container);
    const viewer = viewers[0];

    fireEvent.keyDown(window, { code: 'Space' });
    expect(viewer.controls.mouseButtons.LEFT).toBe(0); // MOUSE.ROTATE

    mockHits = [makeHit('inner', 8, 8)];
    firePointer(canvas, 'pointerdown', { button: 0, clientX: 50, clientY: 50 });
    expect(editor.beginStroke).not.toHaveBeenCalled();

    fireEvent.keyUp(window, { code: 'Space' });
    expect(viewer.controls.mouseButtons.LEFT).toBe(-1);
  });

  it('flags the texture for update when the document version changes', () => {
    const editor = makeEditor();
    const { rerender } = render(<PaintViewport3D editor={editor} />);
    const texture = viewers[0].playerObject.skin.map;
    texture.needsUpdate = false;

    rerender(<PaintViewport3D editor={{ ...editor, version: 1 }} />);
    expect(texture.needsUpdate).toBe(true);
  });

  it('syncs overlay visibility with the active layer', () => {
    const editor = makeEditor();
    const { rerender } = render(<PaintViewport3D editor={editor} />);
    const { setOuterLayerVisible } = viewers[0].playerObject.skin;
    expect(setOuterLayerVisible).toHaveBeenLastCalledWith(false);

    rerender(<PaintViewport3D editor={{ ...editor, activeLayer: 'outer' }} />);
    expect(setOuterLayerVisible).toHaveBeenLastCalledWith(true);
  });
});
