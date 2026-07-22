import React, { useCallback, useEffect, useState } from 'react';
import SkinEditorModal from '../../components/SkinEditor/SkinEditorModal';
import { useMergedSkinTexture } from '../../hooks/useMergedSkinTexture';
import { useSkinManagement } from '../../hooks/useSkinManagement';
import ErrorSection from './components/ErrorSection';
import Footer from './components/Footer';
import Header from './components/Header';
import MergedSkinSection from './components/MergedSkinSection';
import SkinPreviewSection from './components/SkinPreviewSection';
import SkinUploaderSection from './components/SkinUploaderSection';

const DISCARD_EDITS_MESSAGE = 'This will discard your painted edits. Continue?';

const SkinAnvilPage = () => {
  const {
    skins,
    selectedParts,
    handleSkinUpload,
    handleSkinDelete,
    handlePartSelection,
  } = useSkinManagement();
  const { mergedSkinUrl, error } = useMergedSkinTexture(skins, selectedParts);

  // Painted edits override the live merge until the merge inputs change.
  const [editedSkinUrl, setEditedSkinUrl] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const displayedSkinUrl = editedSkinUrl ?? mergedSkinUrl;

  useEffect(() => {
    setEditedSkinUrl(null);
  }, [skins, selectedParts]);

  // Changing merge inputs regenerates the skin from scratch, clobbering any
  // painted edits — confirm before letting that happen.
  const guardEdits = useCallback(
    (action) =>
      (...args) => {
        if (editedSkinUrl && !window.confirm(DISCARD_EDITS_MESSAGE)) return;
        action(...args);
      },
    [editedSkinUrl]
  );

  const openEditor = useCallback(() => setIsEditorOpen(true), []);
  const closeEditor = useCallback(() => setIsEditorOpen(false), []);
  const saveEdits = useCallback((dataUrl) => {
    setEditedSkinUrl(dataUrl);
    setIsEditorOpen(false);
  }, []);

  return (
    <div
      className="min-h-screen bg-minecraft bg-cover bg-center bg-fixed p-2 sm:p-4"
      data-testid="skin-anvil"
    >
      <div className="md:container mx-auto">
        <Header />

        <main>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-4">
            <SkinUploaderSection
              skins={skins}
              selectedParts={selectedParts}
              handleSkinUpload={guardEdits(handleSkinUpload)}
              handleSkinDelete={guardEdits(handleSkinDelete)}
              handlePartSelection={guardEdits(handlePartSelection)}
            />
            <SkinPreviewSection
              skinUrl={displayedSkinUrl}
              onEdit={displayedSkinUrl ? openEditor : undefined}
            />
          </div>

          <ErrorSection error={error} />

          <MergedSkinSection skinUrl={displayedSkinUrl} />
        </main>

        <Footer />
      </div>

      {isEditorOpen && displayedSkinUrl && (
        <SkinEditorModal
          skinUrl={displayedSkinUrl}
          onSave={saveEdits}
          onCancel={closeEditor}
        />
      )}
    </div>
  );
};

export default React.memo(SkinAnvilPage);
