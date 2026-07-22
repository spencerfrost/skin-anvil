import { fireEvent, render, waitFor } from '@testing-library/react';
import PartSelector from '../components/PartSelector';

// Mock the skinCoords to ensure we have a valid clickable area
vi.mock('../constants/skinParts', () => ({
  skinCoords: {
    Head: { x: 0, y: 0, w: 32, h: 32 },
  },
}));

describe('PartSelector', () => {
  const mockSkinUrl = 'http://example.com/skin.png';
  const mockSkinIndex = 0;
  const mockSelectedParts = {};
  const mockOnPartSelection = vi.fn();

  beforeEach(() => {
    // Mock the Image object
    global.Image = class {
      constructor() {
        setTimeout(() => {
          this.onload();
        }, 100);
      }
    };

    // Mock canvas and its context
    const mockContext = {
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      strokeRect: vi.fn(),
      fillRect: vi.fn(),
    };

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockImplementation(() => mockContext);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <PartSelector
        skinUrl={mockSkinUrl}
        skinIndex={mockSkinIndex}
        selectedParts={mockSelectedParts}
        onPartSelection={mockOnPartSelection}
      />
    );
  });

  it('renders a canvas element', () => {
    const { container } = render(
      <PartSelector
        skinUrl={mockSkinUrl}
        skinIndex={mockSkinIndex}
        selectedParts={mockSelectedParts}
        onPartSelection={mockOnPartSelection}
      />
    );
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('calls onPartSelection when canvas is clicked on a valid part', async () => {
    const { container } = render(
      <PartSelector
        skinUrl={mockSkinUrl}
        skinIndex={mockSkinIndex}
        selectedParts={mockSelectedParts}
        onPartSelection={mockOnPartSelection}
      />
    );
    const canvas = container.querySelector('canvas');

    // Wait for the component to finish rendering
    await waitFor(() => {
      expect(canvas).toBeInTheDocument();
    });

    // Click on the "Head" part (adjust coordinates as needed)
    fireEvent.click(canvas, { clientX: 40, clientY: 10 });

    expect(mockOnPartSelection).toHaveBeenCalledWith('Head', mockSkinIndex);
  });
});
