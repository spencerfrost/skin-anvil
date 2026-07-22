import React from 'react';
import { useSkinManagement } from '../../hooks/useSkinManagement';
import { useMergedSkinTexture } from '../../hooks/useMergedSkinTexture';
import ErrorSection from './components/ErrorSection';
import Footer from './components/Footer';
import Header from './components/Header';
import MergedSkinSection from './components/MergedSkinSection';
import SkinPreviewSection from './components/SkinPreviewSection';
import SkinUploaderSection from './components/SkinUploaderSection';

const MinecraftSkinMergerPage = () => {
  const {
    skins,
    selectedParts,
    handleSkinUpload,
    handleSkinDelete,
    handlePartSelection,
  } = useSkinManagement();
  const { mergedSkinUrl, error } = useMergedSkinTexture(skins, selectedParts);

  return (
    <div
      className="min-h-screen bg-minecraft bg-cover bg-center p-2 sm:p-4"
      data-testid="minecraft-skin-merger"
    >
      <div className="md:container mx-auto">
        <Header />

        <main>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-4">
            <SkinUploaderSection
              skins={skins}
              selectedParts={selectedParts}
              handleSkinUpload={handleSkinUpload}
              handleSkinDelete={handleSkinDelete}
              handlePartSelection={handlePartSelection}
            />
            <SkinPreviewSection skinUrl={mergedSkinUrl} />
          </div>

          <ErrorSection error={error} />

          <MergedSkinSection skinUrl={mergedSkinUrl} />
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default React.memo(MinecraftSkinMergerPage);
