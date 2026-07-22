import { render, waitFor } from '@testing-library/react';
import SkinTexture2D from '../components/SkinTexture2D';

const mockSkinUrl = 'http://example.com/skin.png';

describe('SkinTexture2D', () => {
  beforeEach(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        blob: () => Promise.resolve(new Blob()),
      })
    );
  });

  it('renders without crashing', () => {
    render(<SkinTexture2D skinUrl={mockSkinUrl} />);
  });

  it('renders the image when loaded successfully', async () => {
    const { getByAltText } = render(<SkinTexture2D skinUrl={mockSkinUrl} />);
    await waitFor(() => {
      expect(getByAltText('Skin Texture')).toBeInTheDocument();
    });
  });

  it('renders error message when image fails to load', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Failed to fetch')));
    const { getByText } = render(<SkinTexture2D skinUrl={mockSkinUrl} />);
    await waitFor(() => {
      expect(getByText(/Error loading skin texture/)).toBeInTheDocument();
    });
  });
});
