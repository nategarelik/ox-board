---
created: 2025-09-13T21:07:43Z
last_updated: 2025-09-13T21:07:43Z
version: 1.0
author: Claude Code PM System
---

# System Patterns & Architecture

## Current Architecture

### Application Type
- **Single Page Application (SPA)** with Next.js app router
- **Client-side heavy** processing planned
- **Static generation** with API routes
- **Progressive enhancement** approach

### Architectural Style
- **Component-based** UI architecture
- **Event-driven** for gesture detection
- **Reactive** state management planned
- **Modular** code organization intended

## Design Patterns (Planned)

### Creational Patterns

#### Singleton Pattern
```typescript
// Audio Engine - single instance
class AudioEngine {
  private static instance: AudioEngine;
  private constructor() {}

  static getInstance(): AudioEngine {
    if (!this.instance) {
      this.instance = new AudioEngine();
    }
    return this.instance;
  }
}
```
**Use Cases**: AudioEngine, CameraManager, GestureDetector

#### Factory Pattern
```typescript
// Gesture recognizer factory
class GestureFactory {
  static createGesture(type: GestureType): IGesture {
    switch(type) {
      case 'swipe': return new SwipeGesture();
      case 'pinch': return new PinchGesture();
      // ...
    }
  }
}
```
**Use Cases**: Creating different gesture types, effect chains

### Behavioral Patterns

#### Observer Pattern
```typescript
// Gesture events
interface GestureObserver {
  onGestureDetected(gesture: Gesture): void;
}

class GestureDetector {
  private observers: GestureObserver[] = [];

  subscribe(observer: GestureObserver) {
    this.observers.push(observer);
  }

  notify(gesture: Gesture) {
    this.observers.forEach(o => o.onGestureDetected(gesture));
  }
}
```
**Use Cases**: Gesture detection, audio events, UI updates

#### Command Pattern
```typescript
// Audio commands
interface AudioCommand {
  execute(): void;
  undo(): void;
}

class PlayCommand implements AudioCommand {
  constructor(private deck: DJDeck) {}
  execute() { this.deck.play(); }
  undo() { this.deck.pause(); }
}
```
**Use Cases**: Mapping gestures to actions, undo/redo

#### Strategy Pattern
```typescript
// Effect processing strategies
interface EffectStrategy {
  process(audio: AudioBuffer): AudioBuffer;
}

class ReverbStrategy implements EffectStrategy {
  process(audio: AudioBuffer): AudioBuffer {
    // Apply reverb
  }
}
```
**Use Cases**: Audio effects, gesture smoothing algorithms

### Structural Patterns

#### Adapter Pattern
```typescript
// MediaPipe to app gesture adapter
class MediaPipeAdapter {
  constructor(private mediaPipe: MediaPipeHands) {}

  toAppGesture(mpGesture: MPGesture): AppGesture {
    // Convert MediaPipe format to app format
  }
}
```
**Use Cases**: Third-party library integration

#### Decorator Pattern
```typescript
// Audio effect chaining
class EffectDecorator {
  constructor(private effect: AudioEffect) {}

  apply(signal: AudioSignal): AudioSignal {
    return this.effect.process(signal);
  }
}
```
**Use Cases**: Chaining audio effects

## Data Flow Architecture

### Current Implementation
```
User → Browser → Next.js Page → Basic UI
```

### Planned Architecture
```
Camera Input
    ↓
MediaPipe Processing
    ↓
Gesture Detection
    ↓
Gesture Mapping
    ↓
Audio Command
    ↓
Tone.js Processing
    ↓
Audio Output

Parallel:
Gesture Data → Three.js → Visual Feedback
             → UI Updates → React Components
```

## State Management Architecture

### Global State (Zustand)
```typescript
interface AppState {
  // Audio state
  audioEngine: {
    isPlaying: boolean;
    bpm: number;
    crossfaderPosition: number;
    deck1: DeckState;
    deck2: DeckState;
  };

  // Gesture state
  gestures: {
    activeGesture: Gesture | null;
    confidence: number;
    calibration: CalibrationData;
  };

  // UI state
  ui: {
    showTutorial: boolean;
    activeView: ViewType;
    theme: 'light' | 'dark';
  };
}
```

### Local State
- Component animations
- Form inputs
- Temporary UI states

## Component Architecture

### Smart vs Dumb Components
```typescript
// Smart Component (Container)
const DJDeckContainer = () => {
  const { deck, updateDeck } = useAudioStore();
  return <DJDeck {...deck} onChange={updateDeck} />;
};

// Dumb Component (Presentational)
const DJDeck = ({ bpm, isPlaying, onChange }) => {
  // Pure presentation logic
};
```

### Component Composition
```
<DJApp>
  <GestureProvider>
    <AudioProvider>
      <Layout>
        <CameraFeed />
        <DeckSection>
          <DJDeck side="left" />
          <Mixer />
          <DJDeck side="right" />
        </DeckSection>
        <EffectsPanel />
      </Layout>
    </AudioProvider>
  </GestureProvider>
</DJApp>
```

## API Architecture (Planned)

### RESTful Endpoints
```
GET  /api/tracks          - List available tracks
POST /api/tracks/upload   - Upload new track
GET  /api/presets         - Get gesture presets
POST /api/sessions        - Save mixing session
GET  /api/sessions/:id    - Retrieve session
```

### WebSocket Events
```
connect              - Join collaborative session
disconnect           - Leave session
gesture:detected     - Broadcast gesture
audio:sync          - Sync audio state
user:joined         - User joined session
user:left           - User left session
```

## Performance Patterns

### Optimization Strategies
1. **Debouncing**: Gesture detection updates
2. **Throttling**: Audio parameter changes
3. **Memoization**: Expensive calculations
4. **Virtualization**: Large track lists
5. **Code Splitting**: Route-based splitting

### Caching Strategy
```typescript
// Service Worker caching (planned)
- Cache MediaPipe models
- Cache audio samples
- Cache static assets
- Network-first for API calls
```

## Security Patterns

### Client-Side Security
1. **Input Validation**: Validate all gesture inputs
2. **Rate Limiting**: Limit gesture detection frequency
3. **Sanitization**: Clean user-uploaded content
4. **CORS**: Strict CORS policies

### Privacy Patterns
1. **Local Processing**: Camera data never leaves device
2. **Opt-in Recording**: Explicit consent for session recording
3. **Data Minimization**: Only store necessary data

## Error Handling Patterns

### Error Boundaries
```typescript
class AudioErrorBoundary extends React.Component {
  componentDidCatch(error: Error) {
    // Fallback to keyboard controls
    this.props.onError(error);
  }
}
```

### Graceful Degradation
1. Camera unavailable → Keyboard controls
2. MediaPipe fails → Simple gesture detection
3. WebGL unsupported → 2D visualization
4. Audio API blocked → Visual-only mode

## Testing Patterns (Not Implemented)

### Planned Testing Strategy
```
Unit Tests:
- Gesture detection algorithms
- Audio processing functions
- State management logic

Integration Tests:
- Component interactions
- API endpoints
- WebSocket communication

E2E Tests:
- Full user flows
- Gesture to audio pipeline
- Multi-user sessions
```

## Deployment Patterns

### Environment Strategy
```
Development:
- Local MediaPipe models
- Mock audio tracks
- Debug logging enabled

Staging:
- CDN for models
- Test audio library
- Performance monitoring

Production:
- Optimized builds
- Real audio library
- Error tracking only
```

## Code Organization Patterns

### Module Boundaries
```
/lib/gesture   - Gesture detection logic only
/lib/audio     - Audio processing only
/components    - UI components only
/hooks         - React hooks only
/api           - API routes only
/types         - Type definitions only
```

### Naming Conventions
- **Components**: PascalCase
- **Utilities**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Types**: PascalCase with 'I' or 'T' prefix
- **Hooks**: use* prefix