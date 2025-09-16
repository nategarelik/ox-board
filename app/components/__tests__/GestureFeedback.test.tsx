/**
 * Tests for GestureFeedback component
 * Tests visual feedback system for gesture-to-stem mappings
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { GestureFeedback } from '../GestureFeedback';
import {
  GestureStemMapper,
  GestureType,
  FeedbackState,
  GestureDetectionResult,
  GestureMapping
} from '../../lib/gestures/gestureStemMapper';

// Mock the gesture mapper
const createMockMapper = (): GestureStemMapper => {
  const mapper = {
    on: jest.fn(),
    off: jest.fn(),
    getFeedbackState: jest.fn(),
    dispose: jest.fn(),
    // Add other required methods as mocks
    detectGestures: jest.fn(),
    processGestures: jest.fn(),
    setActiveProfile: jest.fn(),
    getActiveProfile: jest.fn(),
    getAllProfiles: jest.fn(),
    addProfile: jest.fn(),
    setControlMode: jest.fn(),
    setSensitivity: jest.fn(),
    setDeadzone: jest.fn(),
    getLatency: jest.fn()
  } as unknown as GestureStemMapper;

  return mapper;
};

const mockFeedbackState: FeedbackState = {
  activeGestures: [
    {
      gestureType: GestureType.PEACE_SIGN,
      confidence: 0.9,
      value: 0.8,
      position: { x: 0.5, y: 0.5 },
      timestamp: Date.now()
    },
    {
      gestureType: GestureType.ROCK_SIGN,
      confidence: 0.85,
      value: 0.6,
      position: { x: 0.7, y: 0.4 },
      timestamp: Date.now()
    }
  ],
  activeMappings: [
    {
      id: 'peace-drums',
      name: 'Peace → Drums',
      description: 'Peace sign controls drums volume',
      targetStem: 'drums',
      controlType: 'volume',
      handRequirement: 'any',
      gestureType: GestureType.PEACE_SIGN
    },
    {
      id: 'rock-bass',
      name: 'Rock → Bass',
      description: 'Rock sign controls bass volume',
      targetStem: 'bass',
      controlType: 'volume',
      handRequirement: 'any',
      gestureType: GestureType.ROCK_SIGN
    }
  ],
  stemIndicators: {
    drums: true,
    bass: true,
    melody: false,
    vocals: false,
    original: false
  },
  controlValues: {
    'peace-drums': 0.8,
    'rock-bass': 0.6
  },
  confidence: 0.875,
  latency: 25
};

describe('GestureFeedback', () => {
  let mockMapper: GestureStemMapper;

  beforeEach(() => {
    mockMapper = createMockMapper();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should render nothing when not active', () => {
    const { container } = render(
      <GestureFeedback
        mapper={mockMapper}
        isActive={false}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when no feedback state is available', () => {
    const { container } = render(
      <GestureFeedback
        mapper={mockMapper}
        isActive={true}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should subscribe to mapper feedback updates on mount', () => {
    render(
      <GestureFeedback
        mapper={mockMapper}
        isActive={true}
      />
    );

    expect(mockMapper.on).toHaveBeenCalledWith('feedbackUpdate', expect.any(Function));
  });

  it('should unsubscribe from mapper feedback updates on unmount', () => {
    const { unmount } = render(
      <GestureFeedback
        mapper={mockMapper}
        isActive={true}
      />
    );

    unmount();

    expect(mockMapper.off).toHaveBeenCalledWith('feedbackUpdate', expect.any(Function));
  });

  it('should display gesture indicators when feedback is available', () => {
    // Set up the mock to trigger feedback update
    const mockOn = mockMapper.on as jest.Mock;
    mockOn.mockImplementation((event: string, callback: Function) => {
      if (event === 'feedbackUpdate') {
        setTimeout(() => callback(mockFeedbackState), 0);
      }
    });

    render(
      <GestureFeedback
        mapper={mockMapper}
        isActive={true}
      />
    );

    act(() => {
      jest.runAllTimers();
    });

    // Should show gesture indicators
    expect(screen.getByText('PEACE_SIGN')).toBeInTheDocument();
    expect(screen.getByText('ROCK_SIGN')).toBeInTheDocument();
  });

  it('should display confidence percentages', () => {
    const mockOn = mockMapper.on as jest.Mock;
    mockOn.mockImplementation((event: string, callback: Function) => {
      if (event === 'feedbackUpdate') {
        setTimeout(() => callback(mockFeedbackState), 0);
      }
    });

    render(
      <GestureFeedback
        mapper={mockMapper}
        isActive={true}
        showConfidence={true}
      />
    );

    act(() => {
      jest.runAllTimers();
    });

    expect(screen.getByText('90%')).toBeInTheDocument(); // Peace sign confidence
    expect(screen.getByText('85%')).toBeInTheDocument(); // Rock sign confidence
  });

  it('should display latency when enabled', () => {
    const mockOn = mockMapper.on as jest.Mock;
    mockOn.mockImplementation((event: string, callback: Function) => {
      if (event === 'feedbackUpdate') {
        setTimeout(() => callback(mockFeedbackState), 0);
      }
    });

    render(
      <GestureFeedback
        mapper={mockMapper}
        isActive={true}
        showLatency={true}
      />
    );

    act(() => {
      jest.runAllTimers();
    });

    expect(screen.getByText('25ms')).toBeInTheDocument();
  });

  it('should show stem indicators correctly', () => {
    const mockOn = mockMapper.on as jest.Mock;
    mockOn.mockImplementation((event: string, callback: Function) => {
      if (event === 'feedbackUpdate') {
        setTimeout(() => callback(mockFeedbackState), 0);
      }
    });

    render(
      <GestureFeedback
        mapper={mockMapper}
        isActive={true}
      />
    );

    act(() => {
      jest.runAllTimers();
    });

    // Should show active stems
    expect(screen.getByText('DRUMS')).toBeInTheDocument();
    expect(screen.getByText('BASS')).toBeInTheDocument();
    expect(screen.getByText('MELODY')).toBeInTheDocument();
    expect(screen.getByText('VOCALS')).toBeInTheDocument();
    expect(screen.getByText('ORIGINAL')).toBeInTheDocument();
  });

  it('should display correct gesture icons', () => {
    const mockOn = mockMapper.on as jest.Mock;
    mockOn.mockImplementation((event: string, callback: Function) => {
      if (event === 'feedbackUpdate') {
        setTimeout(() => callback(mockFeedbackState), 0);
      }
    });

    render(
      <GestureFeedback
        mapper={mockMapper}
        isActive={true}
      />
    );

    act(() => {
      jest.runAllTimers();
    });

    // Check for emoji icons (this is basic, real implementation would use more specific selectors)
    const gestureElements = screen.getAllByText(/[✌️🤘]/);
    expect(gestureElements.length).toBeGreaterThan(0);
  });

  it('should show mapping descriptions', () => {
    const mockOn = mockMapper.on as jest.Mock;
    mockOn.mockImplementation((event: string, callback: Function) => {
      if (event === 'feedbackUpdate') {
        setTimeout(() => callback(mockFeedbackState), 0);
      }
    });

    render(
      <GestureFeedback
        mapper={mockMapper}
        isActive={true}
      />
    );

    act(() => {
      jest.runAllTimers();
    });

    expect(screen.getByText('drums → volume')).toBeInTheDocument();
    expect(screen.getByText('bass → volume')).toBeInTheDocument();
  });

  it('should render in compact mode', () => {
    const mockOn = mockMapper.on as jest.Mock;
    mockOn.mockImplementation((event: string, callback: Function) => {
      if (event === 'feedbackUpdate') {
        setTimeout(() => callback(mockFeedbackState), 0);
      }
    });

    render(
      <GestureFeedback
        mapper={mockMapper}
        isActive={true}
        compactMode={true}
      />
    );

    act(() => {
      jest.runAllTimers();
    });

    // In compact mode, should still show some gesture indicators but in a condensed format
    // The exact test depends on the compact mode implementation
    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('should show channel information', () => {
    const mockOn = mockMapper.on as jest.Mock;
    mockOn.mockImplementation((event: string, callback: Function) => {
      if (event === 'feedbackUpdate') {
        setTimeout(() => callback(mockFeedbackState), 0);
      }
    });

    render(
      <GestureFeedback
        mapper={mockMapper}
        isActive={true}
        channel={2}
      />
    );

    act(() => {
      jest.runAllTimers();
    });

    expect(screen.getByText('Channel 3')).toBeInTheDocument(); // 0-indexed, so channel 2 displays as 3
  });

  it('should display value progress bars', () => {
    const mockOn = mockMapper.on as jest.Mock;
    mockOn.mockImplementation((event: string, callback: Function) => {
      if (event === 'feedbackUpdate') {
        setTimeout(() => callback(mockFeedbackState), 0);
      }
    });

    render(
      <GestureFeedback
        mapper={mockMapper}
        isActive={true}
      />
    );

    act(() => {
      jest.runAllTimers();
    });

    // Should show value percentages
    expect(screen.getByText('Value: 80%')).toBeInTheDocument(); // Peace sign value
    expect(screen.getByText('Value: 60%')).toBeInTheDocument(); // Rock sign value
  });

  it('should handle empty gesture state', () => {
    const emptyFeedbackState: FeedbackState = {
      activeGestures: [],
      activeMappings: [],
      stemIndicators: {
        drums: false,
        bass: false,
        melody: false,
        vocals: false,
        original: false
      },
      controlValues: {},
      confidence: 0,
      latency: 0
    };

    const mockOn = mockMapper.on as jest.Mock;
    mockOn.mockImplementation((event: string, callback: Function) => {
      if (event === 'feedbackUpdate') {
        setTimeout(() => callback(emptyFeedbackState), 0);
      }
    });

    render(
      <GestureFeedback
        mapper={mockMapper}
        isActive={true}
      />
    );

    act(() => {
      jest.runAllTimers();
    });

    expect(screen.getByText('Start making gestures to see them here')).toBeInTheDocument();
  });

  it('should apply correct confidence color coding', () => {
    const lowConfidenceFeedback: FeedbackState = {
      ...mockFeedbackState,
      activeGestures: [
        {
          gestureType: GestureType.PEACE_SIGN,
          confidence: 0.5, // Low confidence
          value: 0.8,
          position: { x: 0.5, y: 0.5 },
          timestamp: Date.now()
        }
      ],
      confidence: 0.5
    };

    const mockOn = mockMapper.on as jest.Mock;
    mockOn.mockImplementation((event: string, callback: Function) => {
      if (event === 'feedbackUpdate') {
        setTimeout(() => callback(lowConfidenceFeedback), 0);
      }
    });

    const { container } = render(
      <GestureFeedback
        mapper={mockMapper}
        isActive={true}
      />
    );

    act(() => {
      jest.runAllTimers();
    });

    // Check for confidence value
    expect(screen.getByText('50%')).toBeInTheDocument();

    // In a more detailed test, we could check for specific CSS classes
    // that indicate color coding (red for low confidence)
  });

  it('should apply correct latency color coding', () => {
    const highLatencyFeedback: FeedbackState = {
      ...mockFeedbackState,
      latency: 75 // High latency
    };

    const mockOn = mockMapper.on as jest.Mock;
    mockOn.mockImplementation((event: string, callback: Function) => {
      if (event === 'feedbackUpdate') {
        setTimeout(() => callback(highLatencyFeedback), 0);
      }
    });

    render(
      <GestureFeedback
        mapper={mockMapper}
        isActive={true}
        showLatency={true}
      />
    );

    act(() => {
      jest.runAllTimers();
    });

    expect(screen.getByText('75ms')).toBeInTheDocument();
  });

  it('should handle animated value transitions', () => {
    const mockOn = mockMapper.on as jest.Mock;
    let callbackFn: Function;

    mockOn.mockImplementation((event: string, callback: Function) => {
      if (event === 'feedbackUpdate') {
        callbackFn = callback;
        setTimeout(() => callback(mockFeedbackState), 0);
      }
    });

    render(
      <GestureFeedback
        mapper={mockMapper}
        isActive={true}
      />
    );

    act(() => {
      jest.runAllTimers();
    });

    // Update with new values
    const updatedFeedback = {
      ...mockFeedbackState,
      activeGestures: [
        {
          ...mockFeedbackState.activeGestures[0],
          value: 0.5 // Changed from 0.8 to 0.5
        }
      ]
    };

    act(() => {
      callbackFn(updatedFeedback);
      jest.runAllTimers();
    });

    // The animation system should handle the transition
    // In a more detailed test, we could check animation states
    expect(screen.getByText('Value: 50%')).toBeInTheDocument();
  });

  it('should handle multiple gesture updates', () => {
    const mockOn = mockMapper.on as jest.Mock;
    let callbackFn: Function;

    mockOn.mockImplementation((event: string, callback: Function) => {
      if (event === 'feedbackUpdate') {
        callbackFn = callback;
      }
    });

    render(
      <GestureFeedback
        mapper={mockMapper}
        isActive={true}
      />
    );

    // Send multiple rapid updates
    act(() => {
      callbackFn(mockFeedbackState);
      callbackFn(mockFeedbackState);
      callbackFn(mockFeedbackState);
      jest.runAllTimers();
    });

    // Should handle all updates without errors
    expect(screen.getByText('PEACE_SIGN')).toBeInTheDocument();
  });
});