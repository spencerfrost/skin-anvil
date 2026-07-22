import PropTypes from 'prop-types';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as skinview3d from 'skinview3d';
import {
  CanvasTexture,
  MOUSE,
  NearestFilter,
  Raycaster,
  TOUCH,
  Vector2,
} from 'three';
import { TOOLS } from '../../hooks/useSkinEditor';
import { uvToTexel } from '../../lib/paintTools';

// Strokes crossing more than this many texels between samples are treated as
// jumps across UV islands (e.g. dragging off one face onto another) and the
// Bresenham anchor resets instead of smearing a line between them.
const MAX_STROKE_JUMP = 10;

// Interactive 3D viewport for the skin editor. Owns its own skinview3d
// viewer (static pose, no walking animation) whose texture is a live
// CanvasTexture of the editor's document canvas. Left-drag paints via UV
// raycasting; right-drag (or Space + left-drag) orbits; wheel zooms.
const PaintViewport3D = ({ editor }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const textureRef = useRef(null);
  const raycasterRef = useRef(null);
  const paintingRef = useRef(false);
  const lastHitRef = useRef(null);
  const spaceHeldRef = useRef(false);
  const editorRef = useRef(editor);
  editorRef.current = editor;
  const [ready, setReady] = useState(false);

  // Raycasts a pointer event against the player model and returns the hit
  // texel on the active layer, or null.
  const raycastEvent = useCallback((e) => {
    const viewer = viewerRef.current;
    if (!viewer) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const ndc = new Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = raycasterRef.current;
    raycaster.setFromCamera(ndc, viewer.camera);
    const hits = raycaster.intersectObject(viewer.playerObject.skin, true);
    // The overlay material is DoubleSide, so the ray also reports the
    // interior back walls of the overlay boxes (raycasting ignores alpha).
    // Only accept faces pointing toward the camera so paint always lands on
    // the surface the user is looking at.
    const hit = hits.find((h) => {
      if (h.object.name !== editorRef.current.activeLayer || !h.uv || !h.face) {
        return false;
      }
      const worldNormal = h.face.normal
        .clone()
        .transformDirection(h.object.matrixWorld);
      return worldNormal.dot(raycaster.ray.direction) < 0;
    });
    if (!hit) return null;
    return { texel: uvToTexel(hit.uv), objectId: hit.object.uuid };
  }, []);

  // Create the viewer once for the lifetime of the modal.
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return undefined;

    const size = Math.max(
      Math.min(container.offsetWidth, container.offsetHeight),
      1
    );
    const viewer = new skinview3d.SkinViewer({
      canvas,
      width: size,
      height: size,
    });
    viewerRef.current = viewer;
    raycasterRef.current = new Raycaster();

    viewer.animation = null;
    viewer.autoRotate = false;
    viewer.camera.position.set(0, 0, 60);
    viewer.camera.lookAt(0, 0, 0);
    viewer.zoom = 0.9;
    viewer.globalLight.intensity = 2.8;
    viewer.cameraLight.intensity = 2;
    viewer.background = '#000000';

    // Synchronous when given a canvas; also auto-detects slim models.
    viewer.loadSkin(editorRef.current.getDocumentCanvas());

    // Replace the viewer's internal texture copy with a live view of the
    // document canvas, mirroring skinview3d's own texture settings.
    const texture = new CanvasTexture(editorRef.current.getDocumentCanvas());
    texture.magFilter = NearestFilter;
    texture.minFilter = NearestFilter;
    viewer.playerObject.skin.map = texture;
    textureRef.current = texture;

    // Left button is reserved for painting; right-drag orbits, wheel zooms.
    viewer.controls.mouseButtons = {
      LEFT: -1,
      MIDDLE: MOUSE.DOLLY,
      RIGHT: MOUSE.ROTATE,
    };
    // One finger paints, two fingers orbit/zoom.
    viewer.controls.touches = { ONE: -1, TWO: TOUCH.DOLLY_ROTATE };

    const resizeObserver = new ResizeObserver(() => {
      const s = Math.max(
        Math.min(container.offsetWidth, container.offsetHeight),
        1
      );
      viewer.setSize(s, s);
    });
    resizeObserver.observe(container);

    const handleKeyDown = (e) => {
      if (e.code !== 'Space' || e.repeat) return;
      // Don't hijack Space when typing in a form control
      if (['INPUT', 'TEXTAREA', 'BUTTON'].includes(e.target.tagName)) return;
      e.preventDefault();
      spaceHeldRef.current = true;
      viewer.controls.mouseButtons.LEFT = MOUSE.ROTATE;
    };
    const handleKeyUp = (e) => {
      if (e.code !== 'Space') return;
      spaceHeldRef.current = false;
      viewer.controls.mouseButtons.LEFT = -1;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    setReady(true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      resizeObserver.disconnect();
      texture.dispose();
      viewer.dispose();
      viewerRef.current = null;
      textureRef.current = null;
      setReady(false);
    };
  }, []);

  // Refresh the GPU texture whenever the document canvas changes (edits from
  // either view, undo/redo, init).
  useEffect(() => {
    if (textureRef.current) {
      textureRef.current.needsUpdate = true;
    }
  }, [editor.version]);

  // Hide the overlay while painting the base layer so the brush lands on
  // what the user sees.
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !ready) return;
    viewer.playerObject.skin.setOuterLayerVisible(
      editor.activeLayer === 'outer'
    );
  }, [editor.activeLayer, ready]);

  const handlePointerDown = useCallback(
    (e) => {
      if (e.button !== 0 || spaceHeldRef.current) return;
      const hit = raycastEvent(e);
      if (!hit) return;
      const ed = editorRef.current;
      e.currentTarget.setPointerCapture(e.pointerId);

      if (ed.tool === TOOLS.BUCKET) {
        ed.beginStroke();
        ed.fillAt(hit.texel.x, hit.texel.y);
        ed.commitStroke();
        return;
      }
      if (ed.tool === TOOLS.EYEDROPPER) {
        ed.pickColorAt(hit.texel.x, hit.texel.y);
        return;
      }
      paintingRef.current = true;
      lastHitRef.current = hit;
      ed.beginStroke();
      ed.paintLine(hit.texel.x, hit.texel.y, hit.texel.x, hit.texel.y);
    },
    [raycastEvent]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (!paintingRef.current) return;
      const hit = raycastEvent(e);
      if (!hit) {
        lastHitRef.current = null;
        return;
      }
      const last = lastHitRef.current;
      const contiguous =
        last &&
        last.objectId === hit.objectId &&
        Math.abs(last.texel.x - hit.texel.x) <= MAX_STROKE_JUMP &&
        Math.abs(last.texel.y - hit.texel.y) <= MAX_STROKE_JUMP;
      if (contiguous) {
        editorRef.current.paintLine(
          last.texel.x,
          last.texel.y,
          hit.texel.x,
          hit.texel.y
        );
      } else {
        editorRef.current.paintLine(
          hit.texel.x,
          hit.texel.y,
          hit.texel.x,
          hit.texel.y
        );
      }
      lastHitRef.current = hit;
    },
    [raycastEvent]
  );

  const endStroke = useCallback(() => {
    if (!paintingRef.current) return;
    paintingRef.current = false;
    lastHitRef.current = null;
    editorRef.current.commitStroke();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full items-center justify-center bg-black"
    >
      <canvas
        ref={canvasRef}
        data-testid="paint-viewport-canvas"
        className="max-h-full max-w-full cursor-crosshair"
        style={{ touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
        onLostPointerCapture={endStroke}
        onContextMenu={(e) => e.preventDefault()}
      />
      <p className="pointer-events-none absolute bottom-2 left-2 hidden font-minecraft text-[10px] text-white/60 sm:block">
        <div>Left-drag to paint</div>
        <div>Right-drag to rotate</div>
        <div>Scroll to zoom</div>
      </p>
    </div>
  );
};

PaintViewport3D.propTypes = {
  editor: PropTypes.shape({
    getDocumentCanvas: PropTypes.func.isRequired,
    version: PropTypes.number.isRequired,
    activeLayer: PropTypes.string.isRequired,
    tool: PropTypes.string.isRequired,
    beginStroke: PropTypes.func.isRequired,
    commitStroke: PropTypes.func.isRequired,
    paintLine: PropTypes.func.isRequired,
    fillAt: PropTypes.func.isRequired,
    pickColorAt: PropTypes.func.isRequired,
  }).isRequired,
};

export default PaintViewport3D;
