import React from 'react';
import MergedSkinViewer from '../../../components/MergedSkinViewer';

const MergedSkinSection = ({ skinUrl }) => {
  if (!skinUrl) return null;

  return (
    <section aria-label="Merged Skin Result" className="mt-4 sm:mt-8">
      <h2 className="sr-only">Merged Skin Viewer</h2>
      <MergedSkinViewer skinUrl={skinUrl} data-testid="merged-skin-viewer" />
    </section>
  );
};

export default React.memo(MergedSkinSection);
