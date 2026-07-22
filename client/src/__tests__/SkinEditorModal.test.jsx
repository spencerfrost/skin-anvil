import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SkinEditorModal from '../components/SkinEditor/SkinEditorModal';

// The 3D viewport pulls in skinview3d/three (WebGL) and the 2D canvas needs
// real canvas contexts — both are exercised by their own tests.
vi.mock('../components/SkinEditor/PaintViewport3D', () => ({
  default: () => <div data-testid="paint-viewport-3d" />,
}));
vi.mock('../components/SkinEditor/TextureCanvas2D', () => ({
  default: () => <div data-testid="texture-canvas-2d" />,
}));

const mockEditor = {
  getDocumentCanvas: vi.fn(),
  initFromUrl: vi.fn(() => Promise.resolve()),
  toDataURL: vi.fn(() => 'data:image/png;base64,edited'),
  version: 0,
  tool: 'pencil',
  setTool: vi.fn(),
  colorHex: '#3b82f6',
  setColorHex: vi.fn(),
  activeLayer: 'inner',
  setActiveLayer: vi.fn(),
  paintPixel: vi.fn(),
  paintLine: vi.fn(),
  fillAt: vi.fn(),
  pickColorAt: vi.fn(),
  beginStroke: vi.fn(),
  commitStroke: vi.fn(),
  undo: vi.fn(),
  redo: vi.fn(),
  canUndo: false,
  canRedo: false,
  isDirty: false,
};

vi.mock('../hooks/useSkinEditor', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    useSkinEditor: () => mockEditor,
  };
});

const renderModal = async (props = {}) => {
  const onSave = vi.fn();
  const onCancel = vi.fn();
  render(
    <SkinEditorModal
      skinUrl="data:image/png;base64,source"
      onSave={onSave}
      onCancel={onCancel}
      {...props}
    />
  );
  await waitFor(() =>
    expect(screen.getByTestId('editor-toolbar')).toBeInTheDocument()
  );
  return { onSave, onCancel };
};

describe('SkinEditorModal', () => {
  beforeEach(() => {
    mockEditor.isDirty = false;
    mockEditor.initFromUrl.mockImplementation(() => Promise.resolve());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('initializes the editor from the skin URL and renders both views', async () => {
    await renderModal();
    expect(mockEditor.initFromUrl).toHaveBeenCalledWith(
      'data:image/png;base64,source'
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('paint-viewport-3d')).toBeInTheDocument();
    expect(screen.getByTestId('texture-canvas-2d')).toBeInTheDocument();
  });

  it('shows an error state when the skin fails to load', async () => {
    mockEditor.initFromUrl.mockImplementation(() =>
      Promise.reject(new Error('bad image'))
    );
    render(
      <SkinEditorModal
        skinUrl="data:broken"
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    await waitFor(() =>
      expect(
        screen.getByText('Failed to load the skin into the editor.')
      ).toBeInTheDocument()
    );
  });

  it('saves the edited PNG data URL', async () => {
    const { onSave } = await renderModal();
    fireEvent.click(screen.getByText('Save Changes'));
    expect(onSave).toHaveBeenCalledWith('data:image/png;base64,edited');
  });

  it('cancels without confirmation when nothing changed', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm');
    const { onCancel } = await renderModal();
    fireEvent.click(screen.getByText('Cancel'));
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('asks for confirmation before discarding dirty edits', async () => {
    mockEditor.isDirty = true;
    const confirmSpy = vi
      .spyOn(window, 'confirm')
      .mockImplementation(() => false);
    const { onCancel } = await renderModal();

    fireEvent.click(screen.getByText('Cancel'));
    expect(confirmSpy).toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();

    confirmSpy.mockImplementation(() => true);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('cancels on Escape', async () => {
    const { onCancel } = await renderModal();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalled();
  });

  it('routes Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y to undo/redo', async () => {
    await renderModal();
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
    expect(mockEditor.undo).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true, shiftKey: true });
    expect(mockEditor.redo).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(window, { key: 'y', ctrlKey: true });
    expect(mockEditor.redo).toHaveBeenCalledTimes(2);
  });
});
