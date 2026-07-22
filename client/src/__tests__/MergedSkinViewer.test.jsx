import { render, screen } from '@testing-library/react';
import MergedSkinViewer from '../components/MergedSkinViewer';

// Mock the child components
const skinTexture2DProps = vi.fn();
vi.mock('../components/SkinTexture2D', () => ({
  default: function MockedSkinTexture2D(props) {
    skinTexture2DProps(props);
    return <div data-testid="mocked-2d-viewer" />;
  },
}));

describe('MergedSkinViewer', () => {
  const mockSkinUrl = 'data:image/png;base64,mock-skin-data';

  beforeEach(() => {
    skinTexture2DProps.mockClear();
  });

  it('renders SkinTexture2D', () => {
    render(<MergedSkinViewer skinUrl={mockSkinUrl} />);

    expect(screen.getByTestId('mocked-2d-viewer')).toBeInTheDocument();
  });

  it('passes the skin data URL and a download handler to the 2D viewer', () => {
    render(<MergedSkinViewer skinUrl={mockSkinUrl} />);

    expect(skinTexture2DProps).toHaveBeenCalledWith(
      expect.objectContaining({
        skinUrl: mockSkinUrl,
        onDownload: expect.any(Function),
      })
    );
  });
});
