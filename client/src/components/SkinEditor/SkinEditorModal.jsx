import PropTypes from 'prop-types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSkinEditor } from '../../hooks/useSkinEditor';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import EditorToolbar from './EditorToolbar';
import PaintViewport3D from './PaintViewport3D';
import TextureCanvas2D from './TextureCanvas2D';

const DISCARD_MESSAGE = 'Discard your painted changes?';

// Near-fullscreen paint editor. Initializes its document canvas from
// `skinUrl`, lets the user paint in 3D and 2D, and returns the edited PNG
// data URL via onSave. Everything happens client-side on the document canvas.
const SkinEditorModal = ({ skinUrl, onSave, onCancel }) => {
  const editor = useSkinEditor();
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const containerRef = useRef(null);
  const previousFocusRef = useRef(null);

  const { initFromUrl, isDirty, undo, redo, toDataURL } = editor;

  useEffect(() => {
    let cancelled = false;
    initFromUrl(skinUrl)
      .then(() => !cancelled && setStatus('ready'))
      .catch(() => !cancelled && setStatus('error'));
    return () => {
      cancelled = true;
    };
    // The editor snapshots skinUrl on open; later merges don't re-init it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initFromUrl]);

  const handleCancel = useCallback(() => {
    if (isDirty && !window.confirm(DISCARD_MESSAGE)) return;
    onCancel();
  }, [isDirty, onCancel]);

  const handleSave = useCallback(() => {
    onSave(toDataURL());
  }, [onSave, toDataURL]);

  // Escape to cancel, Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y for history.
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCancel, undo, redo]);

  // Minimal focus management: move focus into the dialog on open, restore on
  // close, and keep Tab cycling within it.
  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    containerRef.current?.focus();
    return () => previousFocusRef.current?.focus?.();
  }, []);

  const handleTabTrap = useCallback((e) => {
    if (e.key !== 'Tab') return;
    const focusable = containerRef.current?.querySelectorAll(
      'button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable || focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-6"
      data-testid="skin-editor-modal"
    >
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- keydown implements the dialog focus trap, a standard modal pattern */}
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Skin paint editor"
        tabIndex={-1}
        className="h-full w-full outline-none"
        onKeyDown={handleTabTrap}
      >
        <Card className="h-full w-full">
          <div className="flex h-full flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Paint / Edit Skin</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="w-auto"
                  onClick={handleSave}
                  disabled={status !== 'ready'}
                >
                  Save Changes
                </Button>
                <Button size="sm" className="w-auto" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </CardHeader>

            {status === 'ready' && (
              <EditorToolbar
                tool={editor.tool}
                onToolChange={editor.setTool}
                colorHex={editor.colorHex}
                onColorChange={editor.setColorHex}
                activeLayer={editor.activeLayer}
                onLayerChange={editor.setActiveLayer}
                canUndo={editor.canUndo}
                canRedo={editor.canRedo}
                onUndo={editor.undo}
                onRedo={editor.redo}
              />
            )}

            <CardContent className="min-h-0 flex-1 p-2">
              {status === 'loading' && (
                <p className="flex h-full items-center justify-center font-minecraft text-white/70">
                  Loading skin…
                </p>
              )}
              {status === 'error' && (
                <p className="flex h-full items-center justify-center font-minecraft text-red-400">
                  Failed to load the skin into the editor.
                </p>
              )}
              {status === 'ready' && (
                <div className="grid h-full min-h-0 grid-cols-1 gap-2 lg:grid-cols-2">
                  <div className="min-h-[300px] lg:min-h-0">
                    <PaintViewport3D editor={editor} />
                  </div>
                  <div className="flex min-h-0 items-center justify-center overflow-auto">
                    <TextureCanvas2D editor={editor} />
                  </div>
                </div>
              )}
            </CardContent>

            <p className="mt-1 hidden font-minecraft text-xs text-text-gray sm:block">
              Left-drag to paint &middot; right-drag or hold Space to rotate
              &middot; scroll to zoom
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

SkinEditorModal.propTypes = {
  skinUrl: PropTypes.string.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default SkinEditorModal;
