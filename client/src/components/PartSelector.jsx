import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';
import { skinCoords } from '../constants/skinParts';

const isOverlayPart = (part) =>
  [
    'Hat',
    'Jacket',
    'Left Sleeve',
    'Right Sleeve',
    'Left Pant',
    'Right Pant',
  ].includes(part);

const PartSelector = ({
  skinUrl,
  skinIndex,
  selectedParts,
  onPartSelection,
}) => {
  const canvasRef = useRef(null);
  const [hoveredPart, setHoveredPart] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = skinUrl;

    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawMainBody(ctx, img, 32, 0);
      drawOverlay(ctx, img, 160, 0);

      Object.entries(skinCoords).forEach(([part, coords]) => {
        if (selectedParts[part] === skinIndex) {
          const offsetX = isOverlayPart(part) ? 160 : 32;
          drawSelectionGlow(ctx, coords, offsetX);
        }
      });

      if (hoveredPart) {
        const offsetX = isOverlayPart(hoveredPart) ? 160 : 32;
        drawHoverEffect(ctx, skinCoords[hoveredPart], offsetX);
      }
    };
  }, [skinUrl, selectedParts, hoveredPart, skinIndex]);

  const drawMainBody = (ctx, img, offsetX, offsetY) => {
    ctx.drawImage(img, 8, 8, 8, 8, offsetX + 16, offsetY + 0, 32, 32);
    ctx.drawImage(img, 20, 20, 8, 12, offsetX + 16, offsetY + 32, 32, 48);
    ctx.drawImage(img, 36, 52, 4, 12, offsetX + 48, offsetY + 32, 16, 48);
    ctx.drawImage(img, 44, 20, 4, 12, offsetX + 0, offsetY + 32, 16, 48);
    ctx.drawImage(img, 20, 52, 4, 12, offsetX + 32, offsetY + 80, 16, 48);
    ctx.drawImage(img, 4, 20, 4, 12, offsetX + 16, offsetY + 80, 16, 48);
  };

  const drawOverlay = (ctx, img, offsetX, offsetY) => {
    ctx.drawImage(img, 40, 8, 8, 8, offsetX + 16, offsetY + 0, 32, 32);
    ctx.drawImage(img, 20, 36, 8, 12, offsetX + 16, offsetY + 32, 32, 48);
    ctx.drawImage(img, 52, 52, 4, 12, offsetX + 48, offsetY + 32, 16, 48);
    ctx.drawImage(img, 44, 36, 4, 12, offsetX + 0, offsetY + 32, 16, 48);
    ctx.drawImage(img, 4, 52, 4, 12, offsetX + 32, offsetY + 80, 16, 48);
    ctx.drawImage(img, 4, 36, 4, 12, offsetX + 16, offsetY + 80, 16, 48);
  };

  const drawSelectionGlow = (ctx, part, offsetX) => {
    ctx.save();
    ctx.strokeStyle = 'orange';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'orange';
    ctx.shadowBlur = 10;
    ctx.strokeRect(offsetX + part.x, part.y, part.w, part.h);
    ctx.restore();
  };

  const drawHoverEffect = (ctx, part, offsetX) => {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(offsetX + part.x, part.y, part.w, part.h);
    ctx.restore();
  };

  const handleCanvasClick = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    let clickedPart = null;

    for (const [part, coords] of Object.entries(skinCoords)) {
      const offsetX = isOverlayPart(part) ? 160 : 32;
      if (
        x >= coords.x + offsetX &&
        x < coords.x + coords.w + offsetX &&
        y >= coords.y &&
        y < coords.y + coords.h
      ) {
        clickedPart = part;
        break;
      }
    }

    if (clickedPart) {
      onPartSelection(clickedPart, skinIndex);
    }
  };

  const handleCanvasMouseMove = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    let newHoveredPart = null;

    for (const [part, coords] of Object.entries(skinCoords)) {
      const offsetX = isOverlayPart(part) ? 160 : 32;
      if (
        x >= coords.x + offsetX &&
        x < coords.x + coords.w + offsetX &&
        y >= coords.y &&
        y < coords.y + coords.h
      ) {
        newHoveredPart = part;
        break;
      }
    }

    setHoveredPart(newHoveredPart);
  };

  return (
    <canvas
      ref={canvasRef}
      width={256}
      height={128}
      className="cursor-pointer"
      onClick={handleCanvasClick}
      onMouseMove={handleCanvasMouseMove}
      onMouseLeave={() => setHoveredPart(null)}
    />
  );
};

PartSelector.propTypes = {
  skinUrl: PropTypes.string.isRequired,
  skinIndex: PropTypes.number.isRequired,
  selectedParts: PropTypes.object.isRequired,
  onPartSelection: PropTypes.func.isRequired,
};

export default PartSelector;
