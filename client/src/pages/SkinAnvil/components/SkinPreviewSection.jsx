import PropTypes from 'prop-types';
import React from 'react';
import SkinViewer3D from '../../../components/SkinViewer3D';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';

const SkinPreviewSection = ({ skinUrl, onEdit }) => (
  <div className="lg:col-span-1 order-1 lg:order-2">
    {skinUrl ? (
      <SkinViewer3D skinUrl={skinUrl} onEdit={onEdit} />
    ) : (
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle>Interactive 3D Preview</CardTitle>
        </CardHeader>
        <CardContent
          className="p-1 bg-black h-[calc(100%-2.5rem)]"
          data-testid="skin-preview-placeholder"
        >
          <div className="w-full h-full flex items-center justify-center">
            <p className="font-minecraft text-white/70 text-center px-4">
              Select parts to preview your skin
            </p>
          </div>
        </CardContent>
      </Card>
    )}
  </div>
);

SkinPreviewSection.propTypes = {
  skinUrl: PropTypes.string,
  onEdit: PropTypes.func,
};

export default React.memo(SkinPreviewSection);
