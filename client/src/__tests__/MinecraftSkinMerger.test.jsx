// MinecraftSkinMerger.test.jsx
import { fireEvent, render, screen } from '@testing-library/react';
import MinecraftSkinMerger from '../pages/MinecraftSkinMerger';
import { useMergedSkinTexture } from '../hooks/useMergedSkinTexture';

// Mock child components
vi.mock('../components/SkinUploader', () => ({
  default: ({ index, onUpload }) => (
    <div data-testid={`skin-uploader-${index}`}>
      <button onClick={() => onUpload(index, `mock-skin-data-${index}`)}>
        Upload Skin
      </button>
    </div>
  ),
}));

vi.mock('../components/MergedSkinViewer', () => ({
  default: ({ skinUrl }) => (
    <div data-testid="merged-skin-viewer">{skinUrl}</div>
  ),
}));

// Mock the 3D viewer (jsdom has no ResizeObserver/WebGL); expose the URL as an
// attribute so getByText(mockUrl) still matches only the merged-skin-viewer mock
vi.mock('../components/SkinViewer3D', () => ({
  default: ({ skinUrl, onEdit }) => (
    <div data-testid="skin-viewer-3d" data-skinurl={skinUrl}>
      {onEdit && (
        <button data-testid="edit-skin-button" onClick={onEdit}>
          Paint / Edit
        </button>
      )}
    </div>
  ),
}));

// Mock the editor modal (pulls in skinview3d/three); expose save/cancel hooks
vi.mock('../components/SkinEditor/SkinEditorModal', () => ({
  default: ({ skinUrl, onSave, onCancel }) => (
    <div data-testid="skin-editor-modal" data-skinurl={skinUrl}>
      <button
        data-testid="editor-save"
        onClick={() => onSave('data:image/png;base64,edited-skin')}
      >
        Save Changes
      </button>
      <button data-testid="editor-cancel" onClick={onCancel}>
        Cancel
      </button>
    </div>
  ),
}));

// Mock the live merge hook so we can control its output
vi.mock('../hooks/useMergedSkinTexture', () => ({
  useMergedSkinTexture: vi.fn(),
}));

describe('MinecraftSkinMerger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  test('offers the paint/edit button only when a merged skin exists', () => {
    render(<MinecraftSkinMerger />);
    expect(screen.queryByTestId('edit-skin-button')).not.toBeInTheDocument();

    useMergedSkinTexture.mockReturnValue({
      mergedSkinUrl: 'data:image/png;base64,mock-merged-skin',
      error: null,
    });
    render(<MinecraftSkinMerger />);
    expect(screen.getByTestId('edit-skin-button')).toBeInTheDocument();
  });

  test('opens the editor and routes saved edits into both previews', () => {
    const mockUrl = 'data:image/png;base64,mock-merged-skin';
    useMergedSkinTexture.mockReturnValue({
      mergedSkinUrl: mockUrl,
      error: null,
    });

    render(<MinecraftSkinMerger />);
    expect(screen.queryByTestId('skin-editor-modal')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('edit-skin-button'));
    const modal = screen.getByTestId('skin-editor-modal');
    expect(modal).toHaveAttribute('data-skinurl', mockUrl);

    fireEvent.click(screen.getByTestId('editor-save'));
    expect(screen.queryByTestId('skin-editor-modal')).not.toBeInTheDocument();

    const editedUrl = 'data:image/png;base64,edited-skin';
    expect(screen.getByTestId('skin-viewer-3d')).toHaveAttribute(
      'data-skinurl',
      editedUrl
    );
    expect(screen.getByText(editedUrl)).toBeInTheDocument();
  });

  test('cancelling the editor keeps the merged skin untouched', () => {
    const mockUrl = 'data:image/png;base64,mock-merged-skin';
    useMergedSkinTexture.mockReturnValue({
      mergedSkinUrl: mockUrl,
      error: null,
    });

    render(<MinecraftSkinMerger />);
    fireEvent.click(screen.getByTestId('edit-skin-button'));
    fireEvent.click(screen.getByTestId('editor-cancel'));

    expect(screen.queryByTestId('skin-editor-modal')).not.toBeInTheDocument();
    expect(screen.getByTestId('skin-viewer-3d')).toHaveAttribute(
      'data-skinurl',
      mockUrl
    );
  });

  test('changing merge inputs discards saved edits behind a confirm', () => {
    const mockUrl = 'data:image/png;base64,mock-merged-skin';
    useMergedSkinTexture.mockReturnValue({
      mergedSkinUrl: mockUrl,
      error: null,
    });
    const confirmSpy = vi
      .spyOn(window, 'confirm')
      .mockImplementation(() => false);

    render(<MinecraftSkinMerger />);
    fireEvent.click(screen.getByTestId('edit-skin-button'));
    fireEvent.click(screen.getByTestId('editor-save'));

    const editedUrl = 'data:image/png;base64,edited-skin';
    const uploadButton = screen.getAllByText('Upload Skin')[0];

    // Declined confirm: upload is blocked, edits stay
    fireEvent.click(uploadButton);
    expect(confirmSpy).toHaveBeenCalled();
    expect(screen.getByTestId('skin-viewer-3d')).toHaveAttribute(
      'data-skinurl',
      editedUrl
    );

    // Accepted confirm: upload proceeds and the edit override resets
    confirmSpy.mockImplementation(() => true);
    fireEvent.click(uploadButton);
    expect(screen.getByTestId('skin-viewer-3d')).toHaveAttribute(
      'data-skinurl',
      mockUrl
    );

    confirmSpy.mockRestore();
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
