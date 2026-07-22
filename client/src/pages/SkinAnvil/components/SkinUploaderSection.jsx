import React from 'react';
import SkinUploader from '../../../components/SkinUploader';

const SkinUploaderSection = ({
  skins,
  selectedParts,
  handleSkinUpload,
  handleSkinDelete,
  handlePartSelection,
}) => {
  const renderSkinUploaders = (startIndex, endIndex) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-4">
      {skins.slice(startIndex, endIndex).map((skin, index) => (
        <SkinUploader
          key={`skinUploader-${startIndex + index}`}
          index={startIndex + index}
          skin={skin}
          onUpload={handleSkinUpload}
          onDelete={handleSkinDelete}
          selectedParts={selectedParts}
          onPartSelection={handlePartSelection}
        />
      ))}
    </div>
  );

  return (
    <>
      <div className="lg:col-span-1 order-2 lg:order-1">
        {renderSkinUploaders(0, 2)}
      </div>
      <div className="lg:col-span-1 order-3">{renderSkinUploaders(2, 4)}</div>
    </>
  );
};

export default React.memo(SkinUploaderSection);
