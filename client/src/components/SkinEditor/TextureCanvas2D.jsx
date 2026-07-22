import PropTypes from 'prop-types';
import { useCallback, useEffect, useRef } from 'react';
import { layerAtPixel } from '../../constants/skinLayers';
import { skinTextureRegions } from '../../constants/skinParts';
import { TOOLS } from '../../hooks/useSkinEditor';
import { TEXTURE_SIZE } from '../../lib/paintTools';

// Internal resolution of the overlay canvas (8 screen pixels per texel).
const OVERLAY_SIZE = 512;
const CELL = OVERLAY_SIZE / TEXTURE_SIZE;

// Expanded 2D view of the 64x64 document canvas: a pixelated base image, a
// grid overlay that dims regions outside the active layer, and pointer
// painting that mirrors the 3D viewport. `editor` is the useSkinEditor value.
const TextureCanvas2D = ({ editor }) => {
  const baseCanvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastTexelRef = useRef(null);
  const editorRef = useRef(editor);
  editorRef.current = editor;

  // Redraw the base image from the document canvas on every edit.
  useEffect(() => {
    const canvas = baseCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
    ctx.drawImage(editor.getDocumentCanvas(), 0, 0);
  }, [editor, editor.version]);

  // Redraw the grid + inactive-layer dimming when the layer changes.
  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, OVERLAY_SIZE, OVERLAY_SIZE);

    // Dim everything, then punch out the active layer's part rects.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, OVERLAY_SIZE, OVERLAY_SIZE);
    for (const rect of Object.values(skinTextureRegions)) {
      if (layerAtPixel(rect.left, rect.top) === editor.activeLayer) {
        ctx.clearRect(
          rect.left * CELL,
          rect.top * CELL,
          rect.width * CELL,
          rect.height * CELL
        );
      }
    }

    // Pixel grid
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= TEXTURE_SIZE; i++) {
      ctx.moveTo(i * CELL + 0.5, 0);
      ctx.lineTo(i * CELL + 0.5, OVERLAY_SIZE);
      ctx.moveTo(0, i * CELL + 0.5);
      ctx.lineTo(OVERLAY_SIZE, i * CELL + 0.5);
    }
    ctx.stroke();
  }, [editor.activeLayer]);

  const texelFromEvent = useCallback((e) => {
    const rect = overlayCanvasRef.current.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * TEXTURE_SIZE);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * TEXTURE_SIZE);
    if (x < 0 || x >= TEXTURE_SIZE || y < 0 || y >= TEXTURE_SIZE) return null;
    return { x, y };
  }, []);

  const handlePointerDown = useCallback(
    (e) => {
      if (e.button !== 0) return;
      const texel = texelFromEvent(e);
      if (!texel) return;
      const ed = editorRef.current;
      e.currentTarget.setPointerCapture(e.pointerId);

      if (ed.tool === TOOLS.BUCKET) {
        ed.beginStroke();
        ed.fillAt(texel.x, texel.y);
        ed.commitStroke();
        return;
      }
      if (ed.tool === TOOLS.EYEDROPPER) {
        ed.pickColorAt(texel.x, texel.y);
        return;
      }
      drawingRef.current = true;
      lastTexelRef.current = texel;
      ed.beginStroke();
      ed.paintLine(texel.x, texel.y, texel.x, texel.y);
    },
    [texelFromEvent]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (!drawingRef.current) return;
      const texel = texelFromEvent(e);
      if (!texel) {
        lastTexelRef.current = null;
        return;
      }
      const last = lastTexelRef.current;
      if (last) {
        editorRef.current.paintLine(last.x, last.y, texel.x, texel.y);
      } else {
        editorRef.current.paintLine(texel.x, texel.y, texel.x, texel.y);
      }
      lastTexelRef.current = texel;
    },
    [texelFromEvent]
  );

  const endStroke = useCallback(() => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastTexelRef.current = null;
    editorRef.current.commitStroke();
  }, []);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[512px] select-none">
      {/* Checkerboard behind the texture to make transparency readable */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'repeating-conic-gradient(#9a9a9a 0% 25%, #6e6e6e 0% 50%)',
          backgroundSize: '25% 25%',
        }}
      />
      <canvas
        ref={baseCanvasRef}
        width={TEXTURE_SIZE}
        height={TEXTURE_SIZE}
        className="absolute inset-0 h-full w-full"
        style={{ imageRendering: 'pixelated' }}
        data-testid="texture-canvas-base"
      />
      <canvas
        ref={overlayCanvasRef}
        width={OVERLAY_SIZE}
        height={OVERLAY_SIZE}
        className="absolute inset-0 h-full w-full cursor-crosshair"
        style={{ touchAction: 'none' }}
        data-testid="texture-canvas-overlay"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
        onLostPointerCapture={endStroke}
      />
    </div>
  );
};

TextureCanvas2D.propTypes = {
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

export default TextureCanvas2D;
