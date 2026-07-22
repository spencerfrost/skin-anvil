import PropTypes from 'prop-types';
import SkinTexture2D from './SkinTexture2D';

const MergedSkinViewer = ({ skinUrl }) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = skinUrl;
    link.download = `merged-skin-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mt-4">
      <div className="lg:w-1/2 lg:mx-auto">
        <SkinTexture2D skinUrl={skinUrl} onDownload={handleDownload} />
      </div>
    </div>
  );
};

MergedSkinViewer.propTypes = {
  skinUrl: PropTypes.string.isRequired,
};

export default MergedSkinViewer;
