---
created: 2025-09-13T21:07:43Z
last_updated: 2025-09-14T06:12:50Z
version: 1.1
author: Claude Code PM System
---

# System Patterns & Architecture

## Current Architecture

### Application Type
- **Single Page Application (SPA)** with Next.js app router
- **Client-side heavy** processing with MediaPipe and Tone.js
- **Static generation** with dynamic imports for code splitting
- **Progressive enhancement** with error boundaries

### Architectural Style
- **Component-based** UI architecture with React 19
- **Event-driven** gesture detection and audio processing
- **Reactive** state management with Zustand
- **Modular** code organization with clear separation of concerns

## Design Patterns (Implemented)

### Creational Patterns

#### Singleton Pattern
```typescript
// AudioMixer - single instance per session
export class AudioMixer {
  private channels: Channel[] = [];
  private isInitialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    await Tone.start();
    this.isInitialized = true;
  }
}
```
**Implemented In**: AudioMixer, MediaPipe Hands instance

#### Factory Pattern
```typescript
// Error Boundary Factory for different levels
export function DJErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary level="section" ... />
}

export function CameraErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary level="section" fallback={...} ... />
}
```
**Implemented In**: Error boundaries, Kalman filters

### Behavioral Patterns

#### Observer Pattern
```typescript
// Zustand store with subscriptions
const useDJStore = create<DJState>()(
  devtools(
    (set, get) => ({
      updateGestureControls: (controls) => {
        set({ gestureControls: controls });
        // Automatically updates all subscribed components
      }
    })
  )
)
```
**Implemented In**: Zustand stores, gesture detection callbacks

#### Command Pattern
```typescript
// Gesture controls as commands
interface GestureControl {
  type: 'volume' | 'crossfader' | 'eq' | 'effect';
  value: number;
  hand: 'left' | 'right';
  gesture: string;
}
```
**Implemented In**: Gesture control system

### Structural Patterns

#### Composite Pattern
```typescript
// Error boundary hierarchy
<ErrorBoundary level="page">
  <ErrorBoundary level="section">
    <ErrorBoundary level="component">
      <Component />
    </ErrorBoundary>
  </ErrorBoundary>
</ErrorBoundary>
```
**Implemented In**: Error boundary system, component hierarchy

#### Adapter Pattern
```typescript
// MediaPipe to gesture control adapter
const processHandLandmarks = (landmarks: any[], hand: 'left' | 'right'): Point2D[] => {
  return landmarks.map(landmark => ({
    x: landmark.x,
    y: landmark.y
  }));
};
```
**Implemented In**: MediaPipe integration, Tone.js wrapper

## State Management Architecture

### Zustand Store Pattern
```typescript
interface DJState {
  // State
  mixer: AudioMixer | null;
  gestureControls: GestureControl[];

  // Actions
  initializeMixer: () => Promise<void>;
  updateGestureControls: (controls: GestureControl[]) => void;
}
```

### State Flow
1. **User Input** → Gestures/UI controls
2. **Processing** → Kalman filter smoothing
3. **State Update** → Zustand store
4. **Side Effects** → Audio mixer updates
5. **UI Update** → React re-render

## Component Architecture

### Smart/Dumb Component Pattern
- **Smart Components**: page.tsx (connected to store)
- **Dumb Components**: Deck, Mixer (receive props)
- **Hook Components**: useGestures (encapsulate logic)

### Error Handling Strategy
```typescript
// Three-tier error handling
Level 1: Page-level → Full page error UI
Level 2: Section-level → Section replacement
Level 3: Component-level → Inline error message
```

## Data Flow Patterns

### Unidirectional Data Flow
```
User Action → Store Action → State Change → UI Update
     ↑                            ↓
     └──── Side Effects ←─────────┘
```

### Event Processing Pipeline
```
Camera → MediaPipe → Landmarks → Kalman Filter → Gestures → Controls → Audio
```

## Performance Patterns

### Code Splitting
```typescript
const CameraFeed = dynamic(() => import('./components/Camera/CameraFeed'), {
  ssr: false
});
```

### Memoization
```typescript
const processHandLandmarks = useCallback((landmarks, hand) => {
  // Processing logic
}, []);
```

### Throttling
```typescript
if (now - lastUpdateTime.current < updateInterval) {
  return; // Throttle updates to 60 FPS
}
```

## Testing Patterns (Planned)

### Arrange-Act-Assert
```typescript
// Future test structure
it('should process gestures correctly', () => {
  // Arrange
  const mockLandmarks = createMockLandmarks();

  // Act
  const result = processGestures(mockLandmarks);

  // Assert
  expect(result.controls).toHaveLength(3);
});
```

## Security Patterns

### Input Validation
```typescript
const value = Math.max(0, Math.min(1, gain)); // Clamp values
if (channel < 0 || channel >= 4) return; // Boundary checks
```

### Resource Cleanup
```typescript
useEffect(() => {
  return () => {
    if (cameraRef.current) cameraRef.current.stop();
    if (handsRef.current) handsRef.current.close();
  };
}, []);
```

## Async Patterns

### Promise-based Initialization
```typescript
async initialize(): Promise<void> {
  if (this.isInitialized) return;
  await Tone.start();
  this.isInitialized = true;
}
```

### Effect Cleanup
```typescript
useEffect(() => {
  initializeMediaPipe();
  return () => cleanup();
}, []);
```

## Configuration Patterns

### Environment-agnostic Config
```typescript
const handsConfig = {
  locateFile: (file: string) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  }
}
```

## Recent Pattern Implementations
- Implemented Zustand for state management (Observer pattern)
- Added three-tier error boundaries (Composite pattern)
- Created Kalman filter for smoothing (Strategy pattern)
- Implemented AudioMixer with channel abstraction (Bridge pattern)
- Added dynamic imports for code splitting (Lazy Loading pattern)

## Update History
- 2025-09-14: Updated with actually implemented patterns from epic completion