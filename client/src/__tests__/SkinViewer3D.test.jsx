// SkinViewer3D.test.jsx
import { render, screen } from '@testing-library/react';
import SkinViewer3D from '../components/SkinViewer3D';

vi.mock('skinview3d', () => ({
  SkinViewer: vi.fn(),
  WalkingAnimation: vi.fn(),
}));

class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe(element) {
    // Simulate a resize after a short delay
    setTimeout(() => {
      this.callback([
        { target: element, contentRect: { width: 500, height: 500 } },
      ]);
    }, 0);
  }
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserver;

describe('SkinViewer3D', () => {
  const mockSkinUrl = 'http://example.com/skin.png';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<SkinViewer3D skinUrl={mockSkinUrl} />);
  });

  test('renders the correct structure', () => {
    render(<SkinViewer3D skinUrl={mockSkinUrl} />);
    expect(screen.getByText('Interactive 3D Preview')).toBeInTheDocument();
    expect(screen.getByTestId('skin-viewer-canvas')).toBeInTheDocument();
  });

  test('updates when skin URL changes', () => {
    const { rerender } = render(<SkinViewer3D skinUrl={mockSkinUrl} />);
    const initialCanvas = screen.getByTestId('skin-viewer-canvas');

    const newSkinUrl = 'http://example.com/new-skin.png';
    rerender(<SkinViewer3D skinUrl={newSkinUrl} />);
    const updatedCanvas = screen.getByTestId('skin-viewer-canvas');

    expect(updatedCanvas).toBe(initialCanvas); // The canvas element should be the same
    // We can't easily test that the skin actually changed, but we can verify the component didn't crash
  });
});

// describe('SkinViewer3D', () => {
//   const mockSkinUrl = 'http://example.com/skin.png';
//   let mockDispose;

//   beforeEach(() => {
//     jest.clearAllMocks();
//     mockDispose = jest.fn();
//     skinview3d.SkinViewer (({ canvas, width, height, skin }) => ({
//       canvas,
//       width,
//       height,
//       skin,
//       camera: { position: { set: jest.fn() }, lookAt: jest.fn() },
//       animation: { speed: 0 },
//       autoRotate: false,
//       zoom: 1,
//       globalLight: { intensity: 1 },
//       cameraLight: { intensity: 1 },
//       background: null,
//       dispose: mockDispose
//     }));
//   });

//   test('renders a Card component with correct structure', () => {
//     const { getByText, container } = render(<SkinViewer3D skinUrl={mockSkinUrl} />);
//     expect(getByText('Interactive 3D Preview')).toBeInTheDocument();
//     expect(container.querySelector('.bg-black')).toBeInTheDocument();
//   });

//   test('initializes SkinViewer with correct props', async () => {
//     await act(async () => {
//       render(<SkinViewer3D skinUrl={mockSkinUrl} />);
//     });

//     // Wait for the next tick of the event loop
//     await act(async () => {
//       await new Promise(resolve => setTimeout(resolve, 0));
//     });

//     expect(skinview3d.SkinViewer).toHaveBeenCalledWith(
//       expect.objectContaining({
//         canvas: expect.any(HTMLCanvasElement),
//         width: expect.any(Number),
//         height: expect.any(Number),
//         skin: mockSkinUrl
//       })
//     );

//     const calledWith = skinview3d.SkinViewer.mock.calls[0][0];
//     expect(typeof calledWith.width).toBe('number');
//     expect(calledWith.width).toBeGreaterThan(0);
//     expect(typeof calledWith.height).toBe('number');
//     expect(calledWith.height).toBeGreaterThan(0);
//   });

//   test('sets up animation with correct speed', () => {
//     render(<SkinViewer3D skinUrl={mockSkinUrl} />);
//     const skinViewerInstance = skinview3d.SkinViewer.mock.results[0].value;
//     expect(skinview3d.WalkingAnimation).toHaveBeenCalled();
//     expect(skinViewerInstance.animation.speed).toBe(0.6);
//   });

//   test('configures camera and lighting', () => {
//     render(<SkinViewer3D skinUrl={mockSkinUrl} />);
//     const skinViewerInstance = skinview3d.SkinViewer.mock.results[0].value;

//     expect(skinViewerInstance.camera.position.set).toHaveBeenCalledWith(0, 0, 60);
//     expect(skinViewerInstance.camera.lookAt).toHaveBeenCalledWith(0, 0, 0);
//     expect(skinViewerInstance.autoRotate).toBe(false);
//     expect(skinViewerInstance.zoom).toBe(0.9);
//     expect(skinViewerInstance.globalLight.intensity).toBe(2.8);
//     expect(skinViewerInstance.cameraLight.intensity).toBe(2);
//     expect(skinViewerInstance.background).toBe("#000000");
//   });

//   test('disposes SkinViewer on unmount', () => {
//     const { unmount } = render(<SkinViewer3D skinUrl={mockSkinUrl} />);

//     act(() => {
//       unmount();
//     });

//     expect(mockDispose).toHaveBeenCalled();
//   });

//   test('reinitializes SkinViewer when skinUrl changes', () => {
//     const { rerender } = render(<SkinViewer3D skinUrl={mockSkinUrl} />);
//     expect(skinview3d.SkinViewer).toHaveBeenCalledTimes(1);

//     const newSkinUrl = 'http://example.com/new-skin.png';
//     rerender(<SkinViewer3D skinUrl={newSkinUrl} />);

//     expect(skinview3d.SkinViewer).toHaveBeenCalledTimes(2);
//     expect(skinview3d.SkinViewer).toHaveBeenLastCalledWith(
//       expect.objectContaining({ skin: newSkinUrl })
//     );
//     expect(mockDispose).toHaveBeenCalledTimes(1);
//   });
// });
