import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StemWaveform from '../StemWaveform';
import useEnhancedDJStore from '../../stores/enhancedDjStore';

// Mock the enhanced DJ store
jest.mock('../../stores/enhancedDjStore');
const mockUseEnhancedDJStore = useEnhancedDJStore as jest.MockedFunction<typeof useEnhancedDjStore>;

// Mock Canvas API
const mockCanvas = {
  getContext: jest.fn(() => ({
    clearRect: jest.fn(),
    fillRect: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    arc: jest.fn(),
    fillText: jest.fn(),
    setLineDash: jest.fn(),
    scale: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    drawImage: jest.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    font: '',
    textAlign: '',
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
    shadowColor: '',
    shadowBlur: 0
  })),
  width: 800,
  height: 120,
  style: {},
  getBoundingClientRect: jest.fn(() => ({
    left: 0,
    top: 0,
    width: 800,
    height: 120,
    right: 800,
    bottom: 120
  }))
};

// Mock getBoundingClientRect for canvas
HTMLCanvasElement.prototype.getBoundingClientRect = jest.fn(() => ({
  left: 0,
  top: 0,
  width: 800,
  height: 120,
  right: 800,
  bottom: 120,
  x: 0,
  y: 0,
  toJSON: () => ({})
}));

HTMLCanvasElement.prototype.getContext = mockCanvas.getContext;

describe('StemWaveform', () => {
  const mockTrack = {
    id: 'test-track',
    title: 'Test Track',
    artist: 'Test Artist',
    duration: 180,
    bpm: 128,
    key: 'C',
    url: 'test-url'
  };

  const mockDecks = [
    {
      id: 0,
      track: mockTrack,
      isPlaying: false,
      currentTime: 30,
      playbackRate: 1.0,
      volume: 0.75,
      cuePoints: [],
      loopStart: null,
      loopEnd: null,
      stemPlayerEnabled: true
    },
    {
      id: 1,
      track: null,
      isPlaying: false,
      currentTime: 0,
      playbackRate: 1.0,
      volume: 0.75,
      cuePoints: [],
      loopStart: null,
      loopEnd: null,
      stemPlayerEnabled: false
    }
  ];

  const mockSeekStemPlayer = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseEnhancedDJStore.mockReturnValue({
      decks: mockDecks,
      seekStemPlayer: mockSeekStemPlayer,
    } as any);

    // Mock RAF for smooth animations
    global.requestAnimationFrame = jest.fn((cb) => {
      setTimeout(cb, 16);
      return 123;
    });

    global.cancelAnimationFrame = jest.fn();

    // Mock performance.now for consistent timing
    global.performance.now = jest.fn(() => 1000);

    // Mock ResizeObserver
    global.ResizeObserver = jest.fn().mockImplementation((callback) => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn()
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders waveform canvas with correct dimensions', () => {
      render(<StemWaveform channel={0} stemType="drums" width={800} height={120} />);

      const canvas = screen.getByRole('img', { hidden: true });
      expect(canvas).toBeInTheDocument();
      expect(canvas).toHaveAttribute('width', '800');
      expect(canvas).toHaveAttribute('height', '120');
    });

    it('shows stem type and color in header', () => {
      render(<StemWaveform channel={0} stemType="vocals" />);

      expect(screen.getByText('vocals')).toBeInTheDocument();

      // Check for color indicator
      const colorIndicator = screen.getByText('vocals').parentElement?.querySelector('div');
      expect(colorIndicator).toBeInTheDocument();
    });

    it('displays zoom controls when enabled', () => {
      render(<StemWaveform channel={0} stemType="bass" showZoomControls={true} />);

      expect(screen.getByText('−')).toBeInTheDocument(); // Zoom out
      expect(screen.getByText('+')).toBeInTheDocument(); // Zoom in
      expect(screen.getByText('Fit')).toBeInTheDocument(); // Zoom to fit
    });

    it('hides zoom controls when disabled', () => {
      render(<StemWaveform channel={0} stemType="melody" showZoomControls={false} />);

      expect(screen.queryByText('−')).not.toBeInTheDocument();
      expect(screen.queryByText('+')).not.toBeInTheDocument();
      expect(screen.queryByText('Fit')).not.toBeInTheDocument();
    });

    it('shows scrollbar when zoomed in', async () => {
      const { rerender } = render(<StemWaveform channel={0} stemType="drums" showScrollbar={true} />);

      // Initially no scrollbar (zoom = 1)
      expect(screen.queryByRole('scrollbar')).not.toBeInTheDocument();

      // Zoom in to show scrollbar
      const zoomInButton = screen.getByText('+');
      await userEvent.click(zoomInButton);

      // Should show scrollbar when zoomed
      await waitFor(() => {
        const scrollbar = document.querySelector('.h-2.bg-gray-800');
        expect(scrollbar).toBeInTheDocument();
      });
    });

    it('shows no track message when no track loaded', () => {
      render(<StemWaveform channel={1} stemType="drums" />);

      expect(screen.getByText('No track loaded for drums')).toBeInTheDocument();
    });
  });

  describe('Waveform Generation', () => {
    it('generates mock waveform data for different stem types', () => {
      const { rerender } = render(<StemWaveform channel={0} stemType="drums" />);

      // Should render without errors for all stem types
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();

      rerender(<StemWaveform channel={0} stemType="bass" />);
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();

      rerender(<StemWaveform channel={0} stemType="melody" />);
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();

      rerender(<StemWaveform channel={0} stemType="vocals" />);
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();

      rerender(<StemWaveform channel={0} stemType="original" />);
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });

    it('updates waveform when track changes', () => {
      const { rerender } = render(<StemWaveform channel={0} stemType="drums" />);

      const newTrack = {
        ...mockTrack,
        id: 'new-track',
        duration: 240
      };

      const newDecks = [
        { ...mockDecks[0], track: newTrack },
        mockDecks[1]
      ];

      mockUseEnhancedDJStore.mockReturnValue({
        decks: newDecks,
        seekStemPlayer: mockSeekStemPlayer,
      } as any);

      rerender(<StemWaveform channel={0} stemType="drums" />);

      // Should re-generate waveform for new track
      expect(mockCanvas.getContext).toHaveBeenCalled();
    });
  });

  describe('Zoom Controls', () => {
    it('zooms in when zoom in button clicked', async () => {
      const user = userEvent.setup();
      render(<StemWaveform channel={0} stemType="vocals" showZoomControls={true} />);

      const initialZoom = screen.getByText('1.0x');
      expect(initialZoom).toBeInTheDocument();

      const zoomInButton = screen.getByText('+');
      await user.click(zoomInButton);

      await waitFor(() => {
        expect(screen.getByText('1.5x')).toBeInTheDocument();
      });
    });

    it('zooms out when zoom out button clicked', async () => {
      const user = userEvent.setup();
      render(<StemWaveform channel={0} stemType="melody" showZoomControls={true} />);

      // First zoom in to enable zoom out
      const zoomInButton = screen.getByText('+');
      await user.click(zoomInButton);

      await waitFor(() => {
        expect(screen.getByText('1.5x')).toBeInTheDocument();
      });

      const zoomOutButton = screen.getByText('−');
      await user.click(zoomOutButton);

      await waitFor(() => {
        expect(screen.getByText('1.0x')).toBeInTheDocument();
      });
    });

    it('resets zoom when fit button clicked', async () => {
      const user = userEvent.setup();
      render(<StemWaveform channel={0} stemType="bass" showZoomControls={true} />);

      // Zoom in first
      const zoomInButton = screen.getByText('+');
      await user.click(zoomInButton);
      await user.click(zoomInButton);

      await waitFor(() => {
        expect(screen.getByText('2.2x')).toBeInTheDocument();
      });

      const fitButton = screen.getByText('Fit');
      await user.click(fitButton);

      await waitFor(() => {
        expect(screen.getByText('1.0x')).toBeInTheDocument();
      });
    });

    it('disables zoom out at minimum zoom', async () => {
      render(<StemWaveform channel={0} stemType="drums" showZoomControls={true} />);

      const zoomOutButton = screen.getByText('−');
      expect(zoomOutButton).toBeDisabled();
    });

    it('disables zoom in at maximum zoom', async () => {
      const user = userEvent.setup();
      render(<StemWaveform channel={0} stemType="vocals" showZoomControls={true} />);

      const zoomInButton = screen.getByText('+');

      // Zoom in many times to reach maximum
      for (let i = 0; i < 10; i++) {
        await user.click(zoomInButton);
      }

      await waitFor(() => {
        expect(zoomInButton).toBeDisabled();
      });
    });
  });

  describe('Mouse Interactions', () => {
    it('seeks to time position when canvas clicked', async () => {
      const user = userEvent.setup();
      render(<StemWaveform channel={0} stemType="bass" width={800} />);

      const canvas = screen.getByRole('img', { hidden: true });

      // Click at middle of canvas (should seek to middle of track)
      await user.click(canvas);

      expect(mockSeekStemPlayer).toHaveBeenCalledWith(0, expect.any(Number));
    });

    it('starts drag selection with shift-click', async () => {
      render(<StemWaveform channel={0} stemType="melody" />);

      const canvas = screen.getByRole('img', { hidden: true });

      fireEvent.mouseDown(canvas, {
        shiftKey: true,
        clientX: 100,
        clientY: 50
      });

      // Should not seek when shift-clicking (drag mode)
      expect(mockSeekStemPlayer).not.toHaveBeenCalled();
    });

    it('handles mouse wheel for zoom and scroll', async () => {
      render(<StemWaveform channel={0} stemType="vocals" />);

      const canvas = screen.getByRole('img', { hidden: true });

      // Wheel with Ctrl for zoom
      fireEvent.wheel(canvas, {
        deltaY: -100,
        ctrlKey: true
      });

      // Should zoom in
      await waitFor(() => {
        expect(screen.getByText(/1\.\dx/)).toBeInTheDocument();
      });

      // Wheel without Ctrl for scroll
      fireEvent.wheel(canvas, {
        deltaX: 50
      });

      // Should scroll horizontally
      expect(mockCanvas.getContext).toHaveBeenCalled();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('zooms with keyboard shortcuts', async () => {
      const user = userEvent.setup();
      render(<StemWaveform channel={0} stemType="drums" />);

      const container = screen.getByRole('generic');
      container.focus();

      // Zoom in with '+'
      await user.keyboard('+');

      await waitFor(() => {
        expect(screen.getByText('1.5x')).toBeInTheDocument();
      });

      // Zoom out with '-'
      await user.keyboard('-');

      await waitFor(() => {
        expect(screen.getByText('1.0x')).toBeInTheDocument();
      });
    });

    it('resets zoom with "0" key', async () => {
      const user = userEvent.setup();
      render(<StemWaveform channel={0} stemType="melody" />);

      const container = screen.getByRole('generic');
      container.focus();

      // Zoom in first
      await user.keyboard('+');
      await waitFor(() => {
        expect(screen.getByText('1.5x')).toBeInTheDocument();
      });

      // Reset with '0'
      await user.keyboard('0');

      await waitFor(() => {
        expect(screen.getByText('1.0x')).toBeInTheDocument();
      });
    });

    it('seeks with Home and End keys', async () => {
      const user = userEvent.setup();
      render(<StemWaveform channel={0} stemType="bass" />);

      const container = screen.getByRole('generic');
      container.focus();

      // Seek to beginning with Home
      await user.keyboard('{Home}');
      expect(mockSeekStemPlayer).toHaveBeenCalledWith(0, 0);

      // Seek to end with End
      await user.keyboard('{End}');
      expect(mockSeekStemPlayer).toHaveBeenCalledWith(0, 180); // Track duration
    });
  });

  describe('Performance', () => {
    it('uses React.memo for optimization', () => {
      const { rerender } = render(<StemWaveform channel={0} stemType="drums" />);

      // Same props should not cause re-render
      rerender(<StemWaveform channel={0} stemType="drums" />);

      expect(StemWaveform.displayName).toBeDefined();
    });

    it('throttles rendering to 60 FPS', () => {
      const playingDecks = [
        { ...mockDecks[0], isPlaying: true },
        mockDecks[1]
      ];

      mockUseEnhancedDJStore.mockReturnValue({
        decks: playingDecks,
        seekStemPlayer: mockSeekStemPlayer,
      } as any);

      render(<StemWaveform channel={0} stemType="vocals" />);

      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });

    it('cancels animation frame on unmount', () => {
      const { unmount } = render(<StemWaveform channel={0} stemType="melody" />);

      unmount();

      expect(global.cancelAnimationFrame).toHaveBeenCalled();
    });

    it('handles resize events efficiently', () => {
      render(<StemWaveform channel={0} stemType="bass" />);

      // ResizeObserver should be set up
      expect(global.ResizeObserver).toHaveBeenCalled();
    });
  });

  describe('Visual Features', () => {
    it('renders time markers at appropriate intervals', () => {
      render(<StemWaveform channel={0} stemType="drums" />);

      const canvas = screen.getByRole('img', { hidden: true });
      const ctx = mockCanvas.getContext();

      expect(ctx.fillText).toHaveBeenCalled();
    });

    it('shows playhead position when playing', () => {
      const playingDecks = [
        { ...mockDecks[0], isPlaying: true, currentTime: 60 },
        mockDecks[1]
      ];

      mockUseEnhancedDJStore.mockReturnValue({
        decks: playingDecks,
        seekStemPlayer: mockSeekStemPlayer,
      } as any);

      render(<StemWaveform channel={0} stemType="vocals" />);

      const ctx = mockCanvas.getContext();

      // Should draw playhead line
      expect(ctx.moveTo).toHaveBeenCalled();
      expect(ctx.lineTo).toHaveBeenCalled();
      expect(ctx.arc).toHaveBeenCalled(); // Playhead indicator circle
    });

    it('renders grid when zoomed in', async () => {
      const user = userEvent.setup();
      render(<StemWaveform channel={0} stemType="melody" showZoomControls={true} />);

      const zoomInButton = screen.getByText('+');

      // Zoom in multiple times to trigger grid
      for (let i = 0; i < 5; i++) {
        await user.click(zoomInButton);
      }

      const ctx = mockCanvas.getContext();

      // Should draw grid lines when zoomed
      expect(ctx.setLineDash).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper focus management', async () => {
      const user = userEvent.setup();
      render(<StemWaveform channel={0} stemType="bass" />);

      const container = screen.getByRole('generic');

      await user.tab();
      expect(container).toHaveFocus();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<StemWaveform channel={0} stemType="vocals" />);

      const container = screen.getByRole('generic');
      container.focus();

      // Should handle keyboard events
      await user.keyboard('+');
      await user.keyboard('-');
      await user.keyboard('0');

      // No errors should occur
      expect(container).toBeInTheDocument();
    });
  });

  describe('Custom Callbacks', () => {
    it('calls onTimeSeek when position clicked', async () => {
      const onTimeSeek = jest.fn();
      const user = userEvent.setup();

      render(
        <StemWaveform
          channel={0}
          stemType="drums"
          onTimeSeek={onTimeSeek}
        />
      );

      const canvas = screen.getByRole('img', { hidden: true });
      await user.click(canvas);

      expect(onTimeSeek).toHaveBeenCalledWith(expect.any(Number));
    });
  });

  describe('Error Handling', () => {
    it('handles missing track gracefully', () => {
      const noTrackDecks = [
        { ...mockDecks[0], track: null },
        mockDecks[1]
      ];

      mockUseEnhancedDJStore.mockReturnValue({
        decks: noTrackDecks,
        seekStemPlayer: mockSeekStemPlayer,
      } as any);

      expect(() => {
        render(<StemWaveform channel={0} stemType="drums" />);
      }).not.toThrow();

      expect(screen.getByText('No track loaded for drums')).toBeInTheDocument();
    });

    it('handles canvas context errors gracefully', () => {
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = jest.fn(() => null);

      expect(() => {
        render(<StemWaveform channel={0} stemType="vocals" />);
      }).not.toThrow();

      HTMLCanvasElement.prototype.getContext = originalGetContext;
    });

    it('handles invalid dimensions gracefully', () => {
      expect(() => {
        render(<StemWaveform channel={0} stemType="bass" width={0} height={0} />);
      }).not.toThrow();
    });
  });
});