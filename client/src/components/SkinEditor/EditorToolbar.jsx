import {
  Eraser,
  PaintBucket,
  Pencil,
  Pipette,
  Redo2,
  Undo2,
} from 'lucide-react';
import PropTypes from 'prop-types';
import { LAYERS } from '../../constants/skinLayers';
import { TOOLS } from '../../hooks/useSkinEditor';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

const TOOL_BUTTONS = [
  { tool: TOOLS.PENCIL, label: 'Pencil', Icon: Pencil },
  { tool: TOOLS.ERASER, label: 'Eraser', Icon: Eraser },
  { tool: TOOLS.BUCKET, label: 'Bucket Fill', Icon: PaintBucket },
  { tool: TOOLS.EYEDROPPER, label: 'Eyedropper', Icon: Pipette },
];

const EditorToolbar = ({
  tool,
  onToolChange,
  colorHex,
  onColorChange,
  activeLayer,
  onLayerChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}) => (
  <div
    className="flex flex-wrap items-center gap-2 py-1"
    data-testid="editor-toolbar"
  >
    <div className="flex items-center gap-1" role="group" aria-label="Tools">
      {TOOL_BUTTONS.map(({ tool: value, label, Icon }) => (
        <Button
          key={value}
          size="icon-lg"
          title={label}
          aria-label={label}
          aria-pressed={tool === value}
          className={cn(tool === value && 'ring-2 ring-yellow-300')}
          onClick={() => onToolChange(value)}
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}
    </div>

    <label
      className="flex items-center gap-1 font-minecraft text-sm text-text-gray"
      title="Paint color"
    >
      <span className="sr-only">Paint color</span>
      <input
        type="color"
        value={colorHex}
        onChange={(e) => onColorChange(e.target.value)}
        className="h-[36px] w-[36px] cursor-pointer border-2 border-black bg-transparent p-0"
        data-testid="color-input"
      />
    </label>

    <div
      className="flex items-center gap-1"
      role="group"
      aria-label="Layer target"
    >
      <Button
        size="sm"
        aria-pressed={activeLayer === LAYERS.INNER}
        className={cn(
          'w-auto',
          activeLayer === LAYERS.INNER && 'ring-2 ring-yellow-300'
        )}
        onClick={() => onLayerChange(LAYERS.INNER)}
      >
        Base Layer
      </Button>
      <Button
        size="sm"
        aria-pressed={activeLayer === LAYERS.OUTER}
        className={cn(
          'w-auto',
          activeLayer === LAYERS.OUTER && 'ring-2 ring-yellow-300'
        )}
        onClick={() => onLayerChange(LAYERS.OUTER)}
      >
        Overlay Layer
      </Button>
    </div>

    <div className="flex items-center gap-1" role="group" aria-label="History">
      <Button
        size="icon-lg"
        title="Undo (Ctrl+Z)"
        aria-label="Undo"
        disabled={!canUndo}
        onClick={onUndo}
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        size="icon-lg"
        title="Redo (Ctrl+Shift+Z)"
        aria-label="Redo"
        disabled={!canRedo}
        onClick={onRedo}
      >
        <Redo2 className="h-4 w-4" />
      </Button>
    </div>
  </div>
);

EditorToolbar.propTypes = {
  tool: PropTypes.oneOf(Object.values(TOOLS)).isRequired,
  onToolChange: PropTypes.func.isRequired,
  colorHex: PropTypes.string.isRequired,
  onColorChange: PropTypes.func.isRequired,
  activeLayer: PropTypes.oneOf(Object.values(LAYERS)).isRequired,
  onLayerChange: PropTypes.func.isRequired,
  canUndo: PropTypes.bool.isRequired,
  canRedo: PropTypes.bool.isRequired,
  onUndo: PropTypes.func.isRequired,
  onRedo: PropTypes.func.isRequired,
};

export default EditorToolbar;
