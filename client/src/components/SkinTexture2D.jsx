import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const SkinTexture2D = ({ skinUrl, onDownload }) => {
  const [imageError, setImageError] = useState(null);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const response = await fetch(skinUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        await response.blob(); // Check response but no need to store the blob
      } catch (e) {
        setImageError(`Fetch error: ${e.message}`);
      }
    };
    fetchImage();
  }, [skinUrl]);

  if (imageError) {
    return (
      <div className="border gray-300 p-2 bg-white text-red-500">
        Error loading skin texture: {imageError}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>2D Skin Texture</CardTitle>
        {onDownload && (
          <Button size="sm" className="w-auto" onClick={onDownload}>
            Download
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-2 bg-white">
        <img
          src={skinUrl}
          alt="Skin Texture"
          className={`w-full h-auto`}
          crossOrigin="anonymous"
          style={{ imageRendering: 'pixelated' }}
        />
      </CardContent>
    </Card>
  );
};

SkinTexture2D.propTypes = {
  skinUrl: PropTypes.string.isRequired,
  onDownload: PropTypes.func,
};

export default SkinTexture2D;
