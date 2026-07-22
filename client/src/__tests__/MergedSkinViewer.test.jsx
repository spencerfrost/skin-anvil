import { render, screen } from '@testing-library/react';
import MergedSkinViewer from '../components/MergedSkinViewer';

// Mock the child components
vi.mock('../components/SkinTexture2D', () => ({
  default: function MockedSkinTexture2D(props) {
    return <div data-testid="mocked-2d-viewer" {...props} />;
  },
}));

vi.mock('../components/ui/button', () => ({
  Button: function MockedButton(props) {
    return <button data-testid="mocked-button" {...props} />;
  },
}));

describe('MergedSkinViewer', () => {
  const mockSkinUrl = 'data:image/png;base64,mock-skin-data';

  it('renders SkinTexture2D and download button', () => {
    render(<MergedSkinViewer skinUrl={mockSkinUrl} />);

    expect(screen.getByTestId('mocked-2d-viewer')).toBeInTheDocument();
    expect(screen.getByTestId('mocked-button')).toBeInTheDocument();
  });

  it('passes the skin data URL straight to the 2D viewer', () => {
    render(<MergedSkinViewer skinUrl={mockSkinUrl} />);

    expect(screen.getByTestId('mocked-2d-viewer')).toHaveAttribute(
      'skinUrl',
      mockSkinUrl
    );
  });
});
