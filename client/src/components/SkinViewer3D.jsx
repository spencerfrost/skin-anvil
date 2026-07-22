import PropTypes from 'prop-types';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as skinview3d from 'skinview3d';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const SkinViewer3D = ({ skinUrl, onEdit }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const skinViewer = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const updateContainerSize = useCallback(() => {
    if (containerRef.current) {
      const { offsetWidth, offsetHeight } = containerRef.current;
      setContainerSize({ width: offsetWidth, height: offsetHeight });
    }
  }, []);

  useEffect(() => {
    updateContainerSize(); // Initial size calculation
    const resizeObserver = new ResizeObserver(updateContainerSize);

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [updateContainerSize]);

  useEffect(() => {
    if (
      canvasRef.current &&
      skinUrl &&
      containerSize.width > 0 &&
      containerSize.height > 0
    ) {
      if (skinViewer.current) {
        skinViewer.current.dispose();
      }

      const size = Math.min(containerSize.width, containerSize.height);

      skinViewer.current = new skinview3d.SkinViewer({
        canvas: canvasRef.current,
        width: size,
        height: size,
        skin: skinUrl,
      });

      skinViewer.current.animation = new skinview3d.WalkingAnimation();
      skinViewer.current.animation.speed = 0.6;
      skinViewer.current.camera.position.set(0, 0, 60);
      skinViewer.current.camera.lookAt(0, 0, 0);
      skinViewer.current.autoRotate = false;
      skinViewer.current.zoom = 0.9;
      skinViewer.current.globalLight.intensity = 2.8;
      skinViewer.current.cameraLight.intensity = 2;
      skinViewer.current.background = '#000000';
    }

    return () => {
      if (skinViewer.current) {
        skinViewer.current.dispose();
        skinViewer.current = null;
      }
    };
  }, [skinUrl, containerSize]);

  return (
    <Card className="w-full h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Interactive 3D Preview</CardTitle>
        {onEdit && (
          <Button size="sm" className="w-auto" onClick={onEdit}>
            Paint / Edit
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-1 bg-black h-[calc(100%-2.5rem)]">
        <div
          ref={containerRef}
          className="w-full h-full flex items-center justify-center"
          style={{ aspectRatio: '1 / 1' }}
        >
          <canvas
            ref={canvasRef}
            data-testid="skin-viewer-canvas"
            width={containerSize.width}
            height={containerSize.height}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

SkinViewer3D.propTypes = {
  skinUrl: PropTypes.string.isRequired,
  onEdit: PropTypes.func,
};

export default SkinViewer3D;
