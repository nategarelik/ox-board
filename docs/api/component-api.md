# Component API Documentation

## Overview

The OX Board Component API provides a comprehensive set of React components for building gesture-controlled stem player interfaces. All components are built with TypeScript, accessibility in mind, and optimized for performance with advanced React patterns.

## Core Components

### StemPlayer Components

#### StemMixerPanel

Main stem mixing interface with individual stem controls.

```typescript
interface StemMixerPanelProps {
  stems: StemId[];
  showEffects?: boolean;
  showEQ?: boolean;
  showAdvanced?: boolean;
  layout?: 'horizontal' | 'vertical' | 'grid';
  size?: 'compact' | 'normal' | 'large';
  className?: string;
}

<StemMixerPanel
  stems={['drums', 'bass', 'melody', 'vocals']}
  showEffects={true}
  showEQ={true}
  layout="horizontal"
  size="normal"
/>
```

**Features**:

- Individual volume, mute, solo controls per stem
- Real-time EQ adjustment (low, mid, high bands)
- Stereo panning control
- Visual feedback and animations
- Keyboard accessibility

#### StemControls

Individual stem control component.

```typescript
interface StemControlsProps {
  stemId: StemId;
  showVolume?: boolean;
  showMute?: boolean;
  showSolo?: boolean;
  showEQ?: boolean;
  showPan?: boolean;
  showEffects?: boolean;
  compact?: boolean;
  disabled?: boolean;
}

<StemControls
  stemId="vocals"
  showVolume={true}
  showMute={true}
  showSolo={true}
  showEQ={true}
  showPan={true}
  compact={false}
/>
```

#### StemVisualizerPanel

Advanced visualization component for stems.

```typescript
interface StemVisualizerPanelProps {
  stems: StemId[];
  visualizationType?: 'waveform' | 'frequency' | 'spectrogram' | 'combined';
  showLabels?: boolean;
  interactive?: boolean;
  height?: number;
  smoothing?: number;
}

<StemVisualizerPanel
  stems={['drums', 'bass', 'melody', 'vocals']}
  visualizationType="combined"
  showLabels={true}
  interactive={true}
  height={300}
  smoothing={0.8}
/>
```

### Gesture Components

#### GestureControlPanel

Main gesture control interface with calibration and settings.

```typescript
interface GestureControlPanelProps {
  showCalibration?: boolean;
  showMappings?: boolean;
  showPerformance?: boolean;
  showRecording?: boolean;
  compact?: boolean;
  autoHide?: boolean;
}

<GestureControlPanel
  showCalibration={true}
  showMappings={true}
  showPerformance={true}
  showRecording={true}
  autoHide={false}
/>
```

#### GestureVisualization

Real-time gesture feedback and visualization.

```typescript
interface GestureVisualizationProps {
  handData: HandResult[];
  showLandmarks?: boolean;
  showSkeleton?: boolean;
  showGestures?: boolean;
  smoothing?: number;
  mirror?: boolean;
  className?: string;
}

<GestureVisualization
  handData={[leftHand, rightHand]}
  showLandmarks={true}
  showSkeleton={true}
  showGestures={true}
  smoothing={0.5}
  mirror={true}
/>
```

#### GestureFeedback

Gesture recognition feedback with confidence indicators.

```typescript
interface GestureFeedbackProps {
  gesture: string;
  confidence: number;
  handSide: 'Left' | 'Right';
  showProgress?: boolean;
  animate?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

<GestureFeedback
  gesture="PINCH"
  confidence={0.85}
  handSide="Left"
  showProgress={true}
  animate={true}
  position="top"
/>
```

### Audio Components

#### AudioMixer

Professional audio mixing interface.

```typescript
interface AudioMixerProps {
  stems: StemId[];
  showMasterControls?: boolean;
  showInputOutput?: boolean;
  showRouting?: boolean;
  layout?: 'standard' | 'advanced' | 'compact';
  theme?: 'light' | 'dark' | 'auto';
}

<AudioMixer
  stems={['drums', 'bass', 'melody', 'vocals']}
  showMasterControls={true}
  showInputOutput={true}
  layout="advanced"
  theme="dark"
/>
```

#### WaveformDisplay

High-performance waveform visualization.

```typescript
interface WaveformDisplayProps {
  audioBuffer: AudioBuffer;
  stemId?: StemId;
  height?: number;
  color?: string;
  progressColor?: string;
  backgroundColor?: string;
  showGrid?: boolean;
  showCursor?: boolean;
  interactive?: boolean;
  onSeek?: (position: number) => void;
  onZoom?: (zoom: number) => void;
}

<WaveformDisplay
  audioBuffer={audioBuffer}
  height={200}
  color="#ff6b6b"
  progressColor="#4ecdc4"
  showGrid={true}
  showCursor={true}
  interactive={true}
  onSeek={handleSeek}
  onZoom={handleZoom}
/>
```

#### StemWaveform

Multi-stem waveform display.

```typescript
interface StemWaveformProps {
  stems: AudioBuffer[];
  stemLabels: StemId[];
  colors?: string[];
  height?: number;
  showIndividual?: boolean;
  showCombined?: boolean;
  interactive?: boolean;
  sync?: boolean;
}

<StemWaveform
  stems={[drumsBuffer, bassBuffer, melodyBuffer, vocalsBuffer]}
  stemLabels={['drums', 'bass', 'melody', 'vocals']}
  colors={['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4']}
  height={300}
  showIndividual={true}
  showCombined={true}
  interactive={true}
  sync={true}
/>
```

### Effects Components

#### EffectVisualizer

Real-time effects visualization.

```typescript
interface EffectVisualizerProps {
  effectType: EffectType;
  parameters: EffectParameters;
  showValues?: boolean;
  animated?: boolean;
  size?: 'small' | 'medium' | 'large';
  theme?: 'minimal' | 'detailed' | 'artistic';
}

<EffectVisualizer
  effectType="reverb"
  parameters={{ roomSize: 0.8, dampening: 0.3, wet: 0.4 }}
  showValues={true}
  animated={true}
  size="medium"
  theme="detailed"
/>
```

#### EffectsRack

Professional effects rack interface.

```typescript
interface EffectsRackProps {
  effects: EffectType[];
  layout?: 'horizontal' | 'vertical' | 'grid';
  showPresets?: boolean;
  showAutomation?: boolean;
  compact?: boolean;
  disabled?: boolean;
}

<EffectsRack
  effects={['reverb', 'delay', 'filter', 'distortion', 'compressor']}
  layout="vertical"
  showPresets={true}
  showAutomation={true}
  compact={false}
/>
```

### AI Components

#### MixRecommendationsPanel

AI-powered mix suggestions.

```typescript
interface MixRecommendationsPanelProps {
  currentMix: StemVolumes;
  audioAnalysis: AudioAnalysisResults;
  showConfidence?: boolean;
  showExplanation?: boolean;
  autoApply?: boolean;
  maxRecommendations?: number;
}

<MixRecommendationsPanel
  currentMix={{ drums: 0.8, bass: 0.7, melody: 0.6, vocals: 0.9 }}
  audioAnalysis={analysis}
  showConfidence={true}
  showExplanation={true}
  autoApply={false}
  maxRecommendations={5}
/>
```

#### CompatibilityVisualizer

Harmonic compatibility visualization with Camelot wheel.

```typescript
interface CompatibilityVisualizerProps {
  currentKey: string;
  compatibleKeys: string[];
  showWheel?: boolean;
  showList?: boolean;
  interactive?: boolean;
  size?: number;
}

<CompatibilityVisualizer
  currentKey="8A"
  compatibleKeys={['7A', '9A', '8B', '7B', '9B']}
  showWheel={true}
  showList={true}
  interactive={true}
  size={300}
/>
```

### DJ Components

#### ProfessionalDeck

Advanced DJ deck with professional features.

```typescript
interface ProfessionalDeckProps {
  trackId: string;
  showWaveform?: boolean;
  showControls?: boolean;
  showInfo?: boolean;
  showSync?: boolean;
  showLoop?: boolean;
  compact?: boolean;
  skin?: 'default' | 'minimal' | 'classic';
}

<ProfessionalDeck
  trackId="track_001"
  showWaveform={true}
  showControls={true}
  showInfo={true}
  showSync={true}
  showLoop={true}
  skin="default"
/>
```

#### EnhancedMixer

Professional mixing console.

```typescript
interface EnhancedMixerProps {
  deckCount: number;
  showCrossfader?: boolean;
  showEQ?: boolean;
  showGains?: boolean;
  showMeters?: boolean;
  showHeadphones?: boolean;
  layout?: 'horizontal' | 'vertical' | 'split';
}

<EnhancedMixer
  deckCount={2}
  showCrossfader={true}
  showEQ={true}
  showGains={true}
  showMeters={true}
  showHeadphones={true}
  layout="horizontal"
/>
```

### Camera Components

#### CameraFeed

Optimized camera feed for gesture recognition.

```typescript
interface CameraFeedProps {
  width?: number;
  height?: number;
  mirrored?: boolean;
  showControls?: boolean;
  showOverlay?: boolean;
  onHandUpdate?: (hands: HandResult[]) => void;
  onError?: (error: Error) => void;
}

<CameraFeed
  width={640}
  height={480}
  mirrored={true}
  showControls={true}
  showOverlay={true}
  onHandUpdate={handleHandUpdate}
  onError={handleCameraError}
/>
```

#### GestureCameraWidget

Complete gesture camera interface.

```typescript
interface GestureCameraWidgetProps {
  showSettings?: boolean;
  showCalibration?: boolean;
  showDebug?: boolean;
  autoStart?: boolean;
  constraints?: MediaStreamConstraints;
}

<GestureCameraWidget
  showSettings={true}
  showCalibration={true}
  showDebug={false}
  autoStart={true}
  constraints={{
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 60 }
    }
  }}
/>
```

## Layout Components

### ImmersiveGestureInterface

Full-screen immersive gesture interface.

```typescript
interface ImmersiveGestureInterfaceProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  showSidebar?: boolean;
  background?: string;
  overlay?: boolean;
}

<ImmersiveGestureInterface
  showHeader={true}
  showFooter={true}
  showSidebar={false}
  background="transparent"
  overlay={true}
>
  <StemMixerPanel />
  <GestureVisualization />
</ImmersiveGestureInterface>
```

### FloatingPanel

Floating panel system for modular layouts.

```typescript
interface FloatingPanelProps {
  title: string;
  children: React.ReactNode;
  position: { x: number; y: number };
  size: { width: number; height: number };
  minimizable?: boolean;
  closable?: boolean;
  draggable?: boolean;
  resizable?: boolean;
  onPositionChange?: (position: { x: number; y: number }) => void;
}

<FloatingPanel
  title="Stem Mixer"
  position={{ x: 100, y: 100 }}
  size={{ width: 400, height: 300 }}
  minimizable={true}
  closable={true}
  draggable={true}
  resizable={true}
  onPositionChange={handlePositionChange}
>
  <StemMixerPanel />
</FloatingPanel>
```

## Accessibility Components

### KeyboardShortcutsProvider

Global keyboard shortcuts management.

```typescript
interface KeyboardShortcutsProviderProps {
  children: React.ReactNode;
  shortcuts: Record<string, () => void>;
  enabled?: boolean;
}

<KeyboardShortcutsProvider
  shortcuts={{
    ' ': () => togglePlayback(),
    'm': () => toggleMute(),
    's': () => toggleSolo(),
    'ArrowUp': () => increaseVolume(),
    'ArrowDown': () => decreaseVolume(),
    'f': () => toggleFullscreen(),
  }}
  enabled={true}
>
  <App />
</KeyboardShortcutsProvider>
```

## Utility Components

### PerformanceMonitorUI

Real-time performance monitoring display.

```typescript
interface PerformanceMonitorUIProps {
  metrics: PerformanceMetrics[];
  showGraphs?: boolean;
  showAlerts?: boolean;
  showHistory?: boolean;
  compact?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

<PerformanceMonitorUI
  metrics={performanceMetrics}
  showGraphs={true}
  showAlerts={true}
  showHistory={true}
  compact={false}
  position="top-right"
/>
```

### LoadingScreen

Advanced loading screen with progress indication.

```typescript
interface LoadingScreenProps {
  progress: number;
  message?: string;
  showProgress?: boolean;
  showTips?: boolean;
  animated?: boolean;
  onCancel?: () => void;
}

<LoadingScreen
  progress={0.75}
  message="Loading stems..."
  showProgress={true}
  showTips={true}
  animated={true}
  onCancel={handleCancel}
/>
```

## Component Patterns

### Higher-Order Components

#### withGestureControl

```typescript
interface WithGestureControlProps {
  gestureType: GestureType;
  onGesture: (gesture: GestureResult) => void;
  sensitivity?: number;
  enabled?: boolean;
}

function withGestureControl<P extends object>(
  Component: React.ComponentType<P>
) {
  return React.forwardRef<any, P & WithGestureControlProps>(
    ({ gestureType, onGesture, sensitivity = 1.0, enabled = true, ...props }, ref) => {
      const gestureData = useGestures();

      useEffect(() => {
        if (enabled && gestureData) {
          const gesture = gestureData.find(g => g.type === gestureType);
          if (gesture && gesture.confidence * sensitivity > 0.5) {
            onGesture(gesture);
          }
        }
      }, [gestureData, gestureType, onGesture, sensitivity, enabled]);

      return <Component ref={ref} {...(props as P)} />;
    }
  );
}

// Usage
const GestureControlledSlider = withGestureControl(Slider);
```

### Render Props Pattern

#### GestureRenderer

```typescript
interface GestureRendererProps {
  children: (renderProps: {
    gestures: GestureResult[];
    handData: HandResult[];
    isProcessing: boolean;
    error?: Error;
  }) => React.ReactNode;
  gestureTypes?: GestureType[];
  confidenceThreshold?: number;
}

<GestureRenderer
  gestureTypes={['PINCH', 'SPREAD', 'FIST']}
  confidenceThreshold={0.7}
>
  {({ gestures, handData, isProcessing, error }) => (
    <div>
      {isProcessing && <LoadingSpinner />}
      {error && <ErrorMessage error={error} />}
      {gestures.map(gesture => (
        <GestureIndicator key={gesture.type} gesture={gesture} />
      ))}
    </div>
  )}
</GestureRenderer>
```

### Compound Components

#### StemPlayer

```typescript
interface StemPlayerProps {
  children: React.ReactNode;
  audioContext: AudioContext;
  stems: StemBuffers;
}

// Compound component pattern
const StemPlayer = ({ children, audioContext, stems }: StemPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <StemPlayerContext.Provider value={{ audioContext, stems, isPlaying, setIsPlaying }}>
      {children}
    </StemPlayerContext.Provider>
  );
};

// Sub-components
StemPlayer.Controls = StemControls;
StemPlayer.Visualizer = StemVisualizer;
StemPlayer.Mixer = StemMixer;

// Usage
<StemPlayer audioContext={audioContext} stems={stems}>
  <StemPlayer.Mixer />
  <StemPlayer.Visualizer />
  <StemPlayer.Controls />
</StemPlayer>
```

## Styling and Theming

### CSS Custom Properties

```typescript
// Theme variables
const theme = {
  "--stem-primary": "#ff6b6b",
  "--stem-secondary": "#4ecdc4",
  "--stem-tertiary": "#45b7d1",
  "--stem-background": "#1a1a1a",
  "--stem-surface": "#2d2d2d",
  "--stem-text": "#ffffff",
  "--stem-text-secondary": "#b3b3b3",
  "--stem-border": "#404040",
  "--stem-hover": "#3a3a3a",
  "--stem-active": "#ff6b6b",
  "--stem-disabled": "#666666",
};
```

### Responsive Design

```typescript
// Mobile-first responsive props
interface ResponsiveStemControlsProps {
  mobileLayout?: 'stack' | 'tabs' | 'drawer';
  tabletLayout?: 'grid' | 'horizontal' | 'vertical';
  desktopLayout?: 'horizontal' | 'vertical' | 'advanced';
  breakpoint?: 'sm' | 'md' | 'lg' | 'xl';
}

<StemControls
  mobileLayout="stack"
  tabletLayout="grid"
  desktopLayout="horizontal"
  breakpoint="md"
/>
```

## Performance Optimization

### Memoization

```typescript
// Memoized components
const MemoizedStemMixer = React.memo(StemMixerPanel, (prevProps, nextProps) => {
  // Custom comparison logic
  return (
    prevProps.stems === nextProps.stems &&
    shallowEqual(prevProps.volumes, nextProps.volumes)
  );
});

// Optimized with useMemo
const StemMixerContainer = ({ stems, volumes }) => {
  const memoizedStems = useMemo(() => stems, [stems]);
  const memoizedVolumes = useMemo(() => volumes, [volumes]);

  return (
    <MemoizedStemMixer
      stems={memoizedStems}
      volumes={memoizedVolumes}
    />
  );
};
```

### Virtualization

```typescript
// Virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window';

const VirtualizedTrackList = ({ tracks, height = 400 }) => (
  <List
    height={height}
    itemCount={tracks.length}
    itemSize={60}
    itemData={tracks}
  >
    {({ index, data }) => (
      <TrackItem track={data[index]} />
    )}
  </List>
);
```

## Accessibility Features

### ARIA Support

```typescript
// Proper ARIA implementation
const AccessibleStemControl = ({ stemId, volume, onVolumeChange }) => (
  <div role="group" aria-labelledby={`${stemId}-label`}>
    <label id={`${stemId}-label`} htmlFor={`${stemId}-slider`}>
      {stemId} Volume
    </label>
    <input
      id={`${stemId}-slider`}
      type="range"
      min="0"
      max="1"
      step="0.01"
      value={volume}
      onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
      aria-describedby={`${stemId}-value`}
    />
    <span id={`${stemId}-value`} aria-live="polite">
      {Math.round(volume * 100)}%
    </span>
  </div>
);
```

### Keyboard Navigation

```typescript
// Keyboard navigation support
const KeyboardAccessibleMixer = ({ stems }) => {
  const [focusedStem, setFocusedStem] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowRight':
          setFocusedStem(prev => Math.min(prev + 1, stems.length - 1));
          break;
        case 'ArrowDown':
        case 'ArrowLeft':
          setFocusedStem(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
        case ' ':
          // Toggle focused stem
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stems]);

  return (
    <div role="application" aria-label="Stem Mixer">
      {stems.map((stem, index) => (
        <StemControl
          key={stem}
          stemId={stem}
          focused={index === focusedStem}
          tabIndex={index === focusedStem ? 0 : -1}
        />
      ))}
    </div>
  );
};
```

## Error Boundaries

### Component Error Handling

```typescript
class StemPlayerErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType },
  { hasError: boolean; error?: Error }
> {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('StemPlayer component error:', error, errorInfo);
    // Report to error tracking service
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} />;
    }

    return this.props.children;
  }
}

// Usage
<StemPlayerErrorBoundary>
  <StemPlayer />
</StemPlayerErrorBoundary>
```

## Testing Components

### Test Utilities

```typescript
// Test helpers
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Custom render function with providers
const renderWithProviders = (ui: React.ReactElement, options = {}) => {
  const AllTheProviders = ({ children }) => (
    <GestureProvider>
      <AudioProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </AudioProvider>
    </GestureProvider>
  );

  return render(ui, { wrapper: AllTheProviders, ...options });
};

// Example test
test('StemControls responds to volume changes', async () => {
  const user = userEvent.setup();
  const mockOnVolumeChange = jest.fn();

  renderWithProviders(
    <StemControls
      stemId="vocals"
      volume={0.5}
      onVolumeChange={mockOnVolumeChange}
    />
  );

  const volumeSlider = screen.getByRole('slider', { name: /vocals volume/i });
  await user.type(volumeSlider, '{arrowup}');

  expect(mockOnVolumeChange).toHaveBeenCalledWith(0.6);
});
```

## Best Practices

### Component Design

1. **Single Responsibility**: Each component should have one clear purpose
2. **Props Interface**: Use clear, well-typed prop interfaces
3. **Default Props**: Provide sensible defaults for optional props
4. **Composition**: Use composition over deep inheritance

### Performance

1. **Memoization**: Memoize expensive computations and components
2. **Lazy Loading**: Use React.lazy for heavy components
3. **Virtualization**: Virtualize large lists and grids
4. **Debouncing**: Debounce rapid prop changes

### Accessibility

1. **Semantic HTML**: Use proper HTML semantics
2. **ARIA Labels**: Provide clear ARIA labels and descriptions
3. **Keyboard Navigation**: Support full keyboard navigation
4. **Screen Readers**: Test with screen readers

### Testing

1. **Unit Tests**: Test individual components in isolation
2. **Integration Tests**: Test component interactions
3. **Accessibility Tests**: Use axe-core for a11y testing
4. **Performance Tests**: Monitor component render performance

## Migration Guide

### From v0.7 to v0.8

```typescript
// Before
<StemMixer stems={stems} layout="horizontal" />

// After
<StemMixerPanel
  stems={stems}
  layout="horizontal"
  showEffects={true}
  showEQ={true}
/>

// Before
<GestureControl showCalibration showMappings />

// After
<GestureControlPanel
  showCalibration={true}
  showMappings={true}
  showPerformance={true}
/>
```

The new component API provides better separation of concerns, improved accessibility, and enhanced performance characteristics while maintaining backward compatibility where possible.
