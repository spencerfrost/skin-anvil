// MinecraftSkinMerger.test.js
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import MinecraftSkinMerger from '../pages/MinecraftSkinMerger';
import { useMergedSkinTexture } from '../hooks/useMergedSkinTexture';

// Mock child components
jest.mock('../components/SkinUploader', () => ({ index, onUpload }) => (
  <div data-testid={`skin-uploader-${index}`}>
    <button onClick={() => onUpload(index, `mock-skin-data-${index}`)}>
      Upload Skin
    </button>
  </div>
));

jest.mock('../components/MergedSkinViewer', () => ({ skinUrl }) => (
  <div data-testid="merged-skin-viewer">{skinUrl}</div>
));

// Mock the 3D viewer (jsdom has no ResizeObserver/WebGL); expose the URL as an
// attribute so getByText(mockUrl) still matches only the merged-skin-viewer mock
jest.mock('../components/SkinViewer3D', () => ({ skinUrl }) => (
  <div data-testid="skin-viewer-3d" data-skinurl={skinUrl} />
));

// Mock the live merge hook so we can control its output
jest.mock('../hooks/useMergedSkinTexture', () => ({
  useMergedSkinTexture: jest.fn(),
}));

describe('MinecraftSkinMerger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useMergedSkinTexture.mockReturnValue({ mergedSkinUrl: null, error: null });
  });

  test('renders the component with initial state', () => {
    render(<MinecraftSkinMerger />);

    expect(screen.getByTestId('minecraft-skin-merger')).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(screen.getByAltText('Minecraft Skin Merger')).toBeInTheDocument();

    expect(
      screen.getByText(
        'Add up to 4 skins, select the body parts, and then merge them together to create a new skin.'
      )
    ).toBeInTheDocument();
  });

  test('renders skin uploaders', () => {
    render(<MinecraftSkinMerger />);

    const skinUploaders = screen.getAllByTestId(/skin-uploader-/);
    expect(skinUploaders).toHaveLength(4);
  });

  test('does not render the merged skin viewer without a merged texture', () => {
    render(<MinecraftSkinMerger />);

    expect(screen.queryByTestId('merged-skin-viewer')).not.toBeInTheDocument();
  });

  test('shows the preview placeholder instead of the 3D viewer without a merged texture', () => {
    render(<MinecraftSkinMerger />);

    expect(screen.getByTestId('skin-preview-placeholder')).toBeInTheDocument();
    expect(
      screen.getByText('Select parts to preview your skin')
    ).toBeInTheDocument();
    expect(screen.queryByTestId('skin-viewer-3d')).not.toBeInTheDocument();
  });

  test('renders the merged skin viewer live once a texture exists', () => {
    const mockUrl = 'data:image/png;base64,mock-merged-skin';
    useMergedSkinTexture.mockReturnValue({
      mergedSkinUrl: mockUrl,
      error: null,
    });

    render(<MinecraftSkinMerger />);

    expect(screen.getByTestId('merged-skin-viewer')).toBeInTheDocument();
    expect(screen.getByText(mockUrl)).toBeInTheDocument();

    const viewer3d = screen.getByTestId('skin-viewer-3d');
    expect(viewer3d).toHaveAttribute('data-skinurl', mockUrl);
    expect(
      screen.queryByTestId('skin-preview-placeholder')
    ).not.toBeInTheDocument();
  });

  test('displays error message when the merge hook reports one', () => {
    useMergedSkinTexture.mockReturnValue({
      mergedSkinUrl: null,
      error: 'Error building merged skin: Failed to load skin image',
    });

    render(<MinecraftSkinMerger />);

    expect(screen.getByText(/Error building merged skin/)).toBeInTheDocument();
  });
});
