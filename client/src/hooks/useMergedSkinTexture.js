import { useEffect, useState } from 'react';
import { skinTextureRegions } from '../constants/skinParts';

/**
 * Composite the selected body parts from up to 4 source skins into a single
 * 64x64 skin texture, entirely in the browser. Returns a PNG data URL that can
 * be fed directly to the 2D/3D viewers.
 *
 * Source skins are same-origin data URLs (see SkinUploader), so drawing them to
 * a canvas does not taint it and toDataURL() is safe.
 */
export const useMergedSkinTexture = (skins, selectedParts) => {
  const [mergedSkinUrl, setMergedSkinUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const entries = Object.entries(selectedParts).filter(
      ([part, skinIndex]) =>
        skinIndex !== null &&
        skinIndex !== undefined &&
        skins[skinIndex] &&
        skinTextureRegions[part]
    );

    if (entries.length === 0) {
      setMergedSkinUrl(null);
      setError(null);
      return;
    }

    const loadImage = (src) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load skin image'));
        img.src = src;
      });

    // Load only the source skins actually referenced by the selection.
    const neededIndices = [
      ...new Set(entries.map(([, skinIndex]) => skinIndex)),
    ];

    Promise.all(
      neededIndices.map((index) =>
        loadImage(skins[index]).then((img) => [index, img])
      )
    )
      .then((loaded) => {
        if (cancelled) return;

        const images = new Map(loaded);

        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        entries.forEach(([part, skinIndex]) => {
          const img = images.get(skinIndex);
          if (!img) return;
          const { left, top, width, height } = skinTextureRegions[part];
          ctx.drawImage(
            img,
            left,
            top,
            width,
            height,
            left,
            top,
            width,
            height
          );
        });

        setMergedSkinUrl(canvas.toDataURL('image/png'));
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(`Error building merged skin: ${err.message}`);
      });

    return () => {
      cancelled = true;
    };
  }, [skins, selectedParts]);

  return { mergedSkinUrl, error };
};
