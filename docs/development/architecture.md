# System Architecture Overview

## High-Level Architecture

OX Board is built as a modern, gesture-controlled stem player with a microservices-inspired frontend architecture. The system leverages Web APIs, advanced optimization techniques, and modular design patterns to deliver professional-grade audio processing with ultra-low latency gesture recognition.

### Core Architecture Principles

1. **Modular State Management**: Zustand slices for isolated state concerns
2. **Performance-First Design**: Buffer pooling, SIMD operations, Web Workers
3. **Progressive Enhancement**: PWA capabilities with offline-first approach
4. **Type Safety**: Comprehensive TypeScript coverage with strict mode
5. **Accessibility-First**: WCAG 2.1 AA compliance throughout

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface Layer                     │
├─────────────────────────────────────────────────────────────────┤
│  React Components (Next.js 15)                                 │
│  ├── Professional DJ Interface                                 │
│  ├── Stem Player Dashboard                                     │
│  ├── Gesture Control Panel                                     │
│  ├── AI Assistant Widgets                                      │
│  └── Performance Monitoring                                    │
├─────────────────────────────────────────────────────────────────┤
│                     State Management Layer                      │
├─────────────────────────────────────────────────────────────────┤
│  Zustand Store with Slices                                     │
│  ├── AudioStateSlice     - Stem control, playback, effects     │
│  ├── GestureStateSlice   - Recognition, mappings, calibration  │
│  ├── UIStateSlice        - Panels, themes, preferences         │
│  ├── PerformanceSlice    - Metrics, vitals, alerts             │
│  ├── PWAStateSlice       - Offline, caching, installation      │
│  └── SyncStateSlice      - Cross-tab, real-time sync           │
├─────────────────────────────────────────────────────────────────┤
│                    Processing Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  Core Processing Engines                                       │
│  ├── Gesture Recognition  - MediaPipe + optimization           │
│  ├── Audio Processing     - Web Audio API + Tone.js            │
│  ├── Stem Separation      - AI-powered processing               │
│  ├── Effects Engine       - Real-time audio effects            │
│  └── Performance Monitor  - Real-time metrics                  │
├─────────────────────────────────────────────────────────────────┤
│                    Platform Layer                               │
├─────────────────────────────────────────────────────────────────┤
│  Web Platform APIs                                             │
│  ├── Web Audio API        - High-performance audio             │
│  ├── MediaPipe           - Hand tracking and gestures          │
│  ├── Web Workers         - Background processing               │
│  ├── Service Workers     - PWA and offline support            │
│  ├── Cache API           - Advanced caching strategies         │
│  └── WebRTC              - Real-time communication             │
└─────────────────────────────────────────────────────────────────┘
```

## Detailed Component Architecture

### Frontend Architecture

#### Next.js 15 Application Structure

```
app/
├── 🎵 api/                    # API routes (App Router)
│   ├── generate/             # AI music generation
│   ├── recommendations/      # Smart suggestions
│   ├── stemify/             # Audio stem separation
│   └── silent-audio/        # Web Audio unlock
├── 🎛️ components/            # React component library
│   ├── DJ/                  # Professional DJ interface
│   │   ├── ProfessionalDeck/    # Advanced deck controls
│   │   ├── EnhancedMixer/       # Multi-stem mixer
│   │   └── WaveformDisplay/     # Visual waveform
│   ├── stem-player/         # Core stem functionality
│   ├── AI/                  # AI assistance widgets
│   ├── accessibility/       # A11y enhancements
│   └── offline/             # PWA offline features
├── 🎣 hooks/                # Custom React hooks
│   ├── useEnhancedStemPlayer/   # Main player hook
│   ├── useGestures/            # Gesture recognition
│   └── useStemPerformance/     # Performance monitoring
├── 🔧 lib/                  # Core libraries and utilities
│   ├── audio/              # Audio processing
│   │   ├── optimizedStemProcessor/  # High-performance processing
│   │   ├── enhancedMixer/         # Advanced mixing
│   │   └── musicAnalyzer/         # Audio analysis
│   ├── gesture/            # Gesture recognition
│   │   ├── optimizedRecognition/  # Performance-optimized
│   │   └── gestureStemMapper/     # Gesture-to-audio mapping
│   ├── optimization/       # Performance optimization
│   │   ├── bufferPool/           # Memory management
│   │   ├── performanceMonitor/    # Real-time monitoring
│   │   └── webVitalsMonitor/      # Web performance
│   └── workers/            # Web Workers for heavy tasks
├── 🗂️ stores/               # State management
│   ├── enhancedStemPlayerStore/  # Main Zustand store
│   └── slices/                  # Modular state slices
└── 🎨 types/                # TypeScript definitions
```

### State Management Architecture

#### Zustand Store Design

The application uses a modular Zustand store architecture with isolated slices:

```typescript
// Store composition pattern
const useEnhancedStemPlayerStore = create<EnhancedStemPlayerState>()(
  devtools(
    subscribeWithSelector(
      persist(
        combine({
          audio: audioSlice,
          gesture: gestureSlice,
          ui: uiSlice,
          performance: performanceSlice,
          pwa: pwaSlice,
          sync: syncSlice,
        }),
        {
          name: "ox-board-storage",
          partialize: (state) => ({
            // Selective persistence
            audio: { stems: state.audio.stems },
            ui: { theme: state.ui.theme },
            gesture: { mappings: state.gesture.mappings },
          }),
        },
      ),
    ),
    { name: "OX Board Store" },
  ),
);
```

#### State Slice Architecture

Each slice follows a consistent pattern:

```typescript
// Example slice architecture
export const audioSlice = (set, get) => ({
  // State
  stems: {
    drums: 1.0,
    bass: 1.0,
    melody: 1.0,
    vocals: 1.0,
    original: 1.0,
  },

  // Actions
  setStemVolume: (stemId, volume) =>
    set(
      produce((state) => {
        state.audio.stems[stemId] = Math.max(0, Math.min(1, volume));
      }),
      false, // Don't replace state
      `audio/setStemVolume/${stemId}`, // Action name for debugging
    ),

  // Computed values
  get totalVolume() {
    const stems = get().audio.stems;
    return Object.values(stems).reduce((sum, vol) => sum + vol, 0) / 5;
  },

  // Async actions
  loadStems: async (audioFile) => {
    const processor = new EnhancedStemProcessor();
    const stems = await processor.processAudioFile(audioFile);

    set(
      produce((state) => {
        state.audio.buffers = stems;
        state.audio.loading = false;
      }),
      false,
      "audio/loadStems",
    );
  },
});
```

### Processing Engine Architecture

#### Gesture Recognition Pipeline

```
Input (Camera) → MediaPipe → Landmark Detection → Gesture Recognition → State Update → UI Feedback
     ↓              ↓            ↓                    ↓              ↓            ↓
   60fps        21 points   Distance/Angle       PINCH/SPREAD   Store        Visual
   Video        per hand    Calculations         Classification  Update       Feedback
```

**Key Components**:

- **MediaPipe Integration**: Hand landmark detection
- **Optimized Recognition**: SIMD operations and buffer pooling
- **Performance Monitoring**: Real-time latency and accuracy tracking
- **State Integration**: Seamless integration with Zustand store

#### Audio Processing Pipeline

```
Audio File → Stem Separation → Buffer Creation → Real-time Processing → Output
    ↓             ↓                ↓                ↓              ↓
  Upload    AI Processing    AudioBuffer       Web Audio API   Speakers
  Validation  (Demucs)       Objects          Effects Chain   & Recording
```

**Key Components**:

- **Stem Separation**: AI-powered audio source separation
- **Web Audio Integration**: Ultra-low latency audio processing
- **Effects Engine**: Professional-grade audio effects
- **Performance Optimization**: Buffer pooling and memory management

### Performance Optimization Architecture

#### Buffer Pool Management

```typescript
class BufferPoolManager {
  private pools = {
    float32: new Pool<Float32Array>(),
    audioBuffers: new Pool<AudioBuffer>(),
    arrayBuffers: new Pool<ArrayBuffer>(),
  };

  acquireFloat32Array(size: number): Float32Array {
    return this.pools.float32.acquire(() => new Float32Array(size));
  }

  releaseFloat32Array(buffer: Float32Array): void {
    this.pools.float32.release(buffer);
  }
}
```

#### Memory Optimization Strategies

1. **Object Pooling**: Reuse objects to reduce garbage collection
2. **Buffer Sharing**: Share audio buffers between components
3. **Lazy Loading**: Load resources only when needed
4. **Streaming**: Process large files in chunks

#### CPU Optimization Strategies

1. **Web Workers**: Move heavy processing to background threads
2. **SIMD Operations**: Use Single Instruction Multiple Data operations
3. **Frame Skipping**: Skip processing when performance is poor
4. **Adaptive Quality**: Reduce quality when CPU usage is high

### Web Workers Architecture

#### Worker Distribution Strategy

```typescript
// Main thread coordination
class WorkerManager {
  private workers = {
    audioAnalyzer: new AudioAnalyzerWorker(),
    musicAnalyzer: new MusicAnalyzerWorker(),
    stemProcessor: new StemProcessorWorker(),
    gestureProcessor: new GestureProcessorWorker(),
  };

  async processAudioAnalysis(audioBuffer: AudioBuffer) {
    // Distribute work across workers
    const results = await Promise.all([
      this.workers.audioAnalyzer.analyze(audioBuffer),
      this.workers.musicAnalyzer.extractFeatures(audioBuffer),
    ]);

    return combineResults(results);
  }
}
```

#### Worker Communication Pattern

```typescript
// Worker side
self.onmessage = async (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case "PROCESS_AUDIO":
      const result = await processAudioInWorker(payload.audioBuffer);
      self.postMessage({ type: "RESULT", result });
      break;
  }
};

// Main thread side
worker.postMessage({ type: "PROCESS_AUDIO", payload: { audioBuffer } });
worker.onmessage = (event) => {
  if (event.data.type === "RESULT") {
    handleWorkerResult(event.data.result);
  }
};
```

### API Architecture

#### Serverless API Design

```typescript
// API route structure
app/api/
├── generate/route.ts         # AI music generation
├── recommendations/route.ts  # Smart recommendations
├── stemify/route.ts         # Audio stem separation
└── silent-audio/route.ts    # Web Audio unlock
```

#### API Response Patterns

```typescript
// Standardized API responses
const APIResponse = {
  success: <T>(data: T, meta?: any) => ({
    success: true,
    data,
    meta,
    timestamp: Date.now(),
  }),

  error: (message: string, code: string, details?: any) => ({
    success: false,
    error: { message, code, details },
    timestamp: Date.now(),
  }),
};
```

### PWA Architecture

#### Service Worker Strategy

```typescript
// Service worker registration and caching
const serviceWorker = {
  register: async () => {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registered:", registration);
    }
  },

  cacheStrategies: {
    // Cache-first for static assets
    staticAssets: "cache-first",

    // Network-first for dynamic content
    apiResponses: "network-first",

    // Stale-while-revalidate for frequently updated content
    userData: "stale-while-revalidate",
  },
};
```

### Security Architecture

#### Content Security Policy

```typescript
// Comprehensive CSP
const csp = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", "cdn.example.com"],
  "style-src": ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
  "img-src": ["'self'", "data:", "blob:", "cdn.example.com"],
  "media-src": ["'self'", "blob:"],
  "connect-src": ["'self'", "api.example.com", "ws.example.com"],
  "worker-src": ["'self'", "blob:"],
};
```

#### Security Headers

```typescript
// Security headers middleware
const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy": csp.toString(),
};
```

## Design Patterns

### Observer Pattern (Gesture Recognition)

```typescript
class GestureObservable {
  private observers: GestureObserver[] = [];

  subscribe(observer: GestureObserver): () => void {
    this.observers.push(observer);
    return () => {
      const index = this.observers.indexOf(observer);
      if (index > -1) this.observers.splice(index, 1);
    };
  }

  notifyGesture(gesture: GestureResult): void {
    this.observers.forEach((observer) => observer.onGesture(gesture));
  }
}
```

### Strategy Pattern (Audio Processing)

```typescript
interface StemSeparationStrategy {
  separate(audioBuffer: AudioBuffer): Promise<StemBuffers>;
}

class DemucsStrategy implements StemSeparationStrategy {
  async separate(audioBuffer: AudioBuffer): Promise<StemBuffers> {
    // Demucs-specific implementation
  }
}

class SpleeterStrategy implements StemSeparationStrategy {
  async separate(audioBuffer: AudioBuffer): Promise<StemBuffers> {
    // Spleeter-specific implementation
  }
}
```

### Factory Pattern (Component Creation)

```typescript
class ComponentFactory {
  static createStemControl(type: StemControlType, config: StemControlConfig) {
    switch (type) {
      case "volume":
        return new VolumeStemControl(config);
      case "eq":
        return new EQStemControl(config);
      case "pan":
        return new PanStemControl(config);
      default:
        throw new Error(`Unknown stem control type: ${type}`);
    }
  }
}
```

### Decorator Pattern (Performance Monitoring)

```typescript
function withPerformanceMonitoring<T extends (...args: any[]) => any>(
  fn: T,
  metricName: string,
): T {
  return ((...args: any[]) => {
    const start = performance.now();
    const result = fn(...args);
    const duration = performance.now() - start;

    // Log performance metric
    console.log(`${metricName}: ${duration}ms`);

    return result;
  }) as T;
}
```

## Data Flow Architecture

### Gesture Data Flow

```
Camera Input → MediaPipe → Landmark Detection → Gesture Recognition → State Update → UI Update
     ↓              ↓              ↓                 ↓              ↓           ↓
   WebRTC       21 points      Distance/Angle    PINCH/SPREAD   Zustand    React
   Stream        per frame      Calculations      Detection      Store      Re-render
```

### Audio Data Flow

```
File Upload → Validation → Stem Separation → Buffer Creation → Real-time Processing → Output
     ↓            ↓             ↓               ↓                ↓               ↓
  Drag/Drop   Format Check  AI Processing   AudioBuffer      Web Audio API   Speakers
  or URL      Metadata     (Demucs)        Objects          Effects Chain   & Export
```

### State Management Flow

```
User Action → Action Dispatch → State Update → Selective Re-render → Effect Execution
     ↓              ↓              ↓              ↓                   ↓
  Gesture/Click  setState()    Immer.js      React.useMemo     Side Effects
  or Keyboard    Call           Immutable     Subscription       API Calls
```

## Performance Architecture

### Critical Path Optimization

#### Gesture Recognition Critical Path

1. **Frame Capture**: 16ms (60fps target)
2. **Landmark Detection**: 5ms (MediaPipe optimization)
3. **Gesture Classification**: 2ms (SIMD optimization)
4. **State Update**: 1ms (Efficient store updates)
5. **UI Update**: 2ms (Selective re-rendering)

**Total**: <26ms for complete gesture-to-response cycle

#### Audio Processing Critical Path

1. **Buffer Processing**: 5ms (Buffer pooling)
2. **Effect Chain**: 3ms (Optimized effects)
3. **State Update**: 1ms (Selective updates)
4. **Audio Output**: 2ms (Web Audio scheduling)

**Total**: <11ms for complete audio processing cycle

### Memory Architecture

#### Memory Pool Design

```typescript
class MemoryPool<T> {
  private available: T[] = [];
  private inUse = new Set<T>();
  private factory: () => T;

  constructor(factory: () => T, initialSize = 10) {
    this.factory = factory;
    // Pre-allocate objects
    for (let i = 0; i < initialSize; i++) {
      this.available.push(this.factory());
    }
  }

  acquire(): T {
    const object = this.available.pop() || this.factory();
    this.inUse.add(object);
    return object;
  }

  release(object: T): void {
    if (this.inUse.has(object)) {
      this.inUse.delete(object);
      this.available.push(object);
    }
  }
}
```

### Network Architecture

#### Offline-First Design

```typescript
class OfflineFirstManager {
  private queue: Operation[] = [];
  private syncInProgress = false;

  async execute(operation: Operation): Promise<any> {
    if (navigator.onLine) {
      try {
        return await this.executeOnline(operation);
      } catch (error) {
        // Queue for later if online execution fails
        this.queue.push(operation);
        throw error;
      }
    } else {
      // Queue for when back online
      this.queue.push(operation);
      return this.getCachedResult(operation);
    }
  }

  private async processQueue(): Promise<void> {
    if (this.syncInProgress || this.queue.length === 0) return;

    this.syncInProgress = true;

    while (this.queue.length > 0 && navigator.onLine) {
      const operation = this.queue.shift()!;
      try {
        await this.executeOnline(operation);
      } catch (error) {
        // Put back in queue if failed
        this.queue.unshift(operation);
        break;
      }
    }

    this.syncInProgress = false;
  }
}
```

## Scalability Architecture

### Horizontal Scaling Considerations

#### Component-Based Scaling

- **Stateless Components**: Easy to scale across instances
- **Shared State**: Synchronized via WebSockets or database
- **CDN Distribution**: Static assets served globally
- **Edge Computing**: Processing at CDN edge locations

#### Database Design for Scale

- **Session Storage**: Redis for session data
- **Asset Storage**: Cloud storage for audio files
- **Cache Layer**: Multi-level caching strategy
- **Event Sourcing**: Track state changes for consistency

### Performance Scaling Strategies

#### Adaptive Performance

```typescript
class AdaptivePerformanceManager {
  private metrics = {
    frameTime: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    networkLatency: 0,
  };

  adaptToPerformance(): void {
    const avgFrameTime = this.metrics.frameTime;

    if (avgFrameTime > 16) {
      // Performance is degrading
      this.reduceQuality();
    } else if (avgFrameTime < 8) {
      // Performance is good
      this.increaseQuality();
    }
  }

  private reduceQuality(): void {
    // Reduce camera resolution
    // Simplify gesture recognition
    // Disable complex effects
    // Increase frame skipping
  }

  private increaseQuality(): void {
    // Increase camera resolution
    // Enable advanced features
    // Reduce frame skipping
    // Enable complex effects
  }
}
```

## Error Handling Architecture

### Error Boundary Strategy

```typescript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error reporting service
    errorReportingService.captureException(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: "StemPlayerErrorBoundary",
    });

    // Attempt recovery
    this.attemptRecovery(error);
  }

  private attemptRecovery(error: Error): void {
    // Try to recover from specific error types
    if (error.message.includes("Web Audio")) {
      // Reinitialize Web Audio context
      AudioService.getInstance().reinitialize();
    }
  }
}
```

### Graceful Degradation

```typescript
class GracefulDegradationManager {
  private features = {
    gestureRecognition: true,
    audioEffects: true,
    stemSeparation: true,
    realTimeAnalysis: true,
  };

  degrade(feature: keyof typeof this.features): void {
    this.features[feature] = false;

    switch (feature) {
      case "gestureRecognition":
        // Fall back to mouse/keyboard control
        enableFallbackControls();
        break;
      case "audioEffects":
        // Disable complex effects
        disableAdvancedEffects();
        break;
    }
  }

  isFeatureEnabled(feature: keyof typeof this.features): boolean {
    return this.features[feature];
  }
}
```

## Testing Architecture

### Testing Strategy

#### Unit Testing

- **Component Testing**: Test individual React components
- **Utility Testing**: Test pure functions and utilities
- **Hook Testing**: Test custom React hooks
- **Store Testing**: Test Zustand store slices

#### Integration Testing

- **Feature Testing**: Test complete user workflows
- **API Testing**: Test API route handlers
- **Worker Testing**: Test Web Worker functionality
- **PWA Testing**: Test offline and caching functionality

#### Performance Testing

- **Load Testing**: Test with multiple concurrent users
- **Stress Testing**: Test under high CPU/memory conditions
- **Regression Testing**: Ensure performance doesn't degrade
- **Benchmarking**: Compare performance across versions

### Testing Infrastructure

```typescript
// Testing utilities
class TestUtilities {
  static createMockAudioBuffer(): AudioBuffer {
    const context = new AudioContext();
    return context.createBuffer(2, 44100, 44100);
  }

  static createMockGestureResult(): GestureResult {
    return {
      type: "PINCH",
      confidence: 0.8,
      data: { thumbTip: { x: 0.5, y: 0.5 } },
      timestamp: Date.now(),
    };
  }

  static createMockStore(): Partial<EnhancedStemPlayerState> {
    return {
      audio: {
        stems: {
          drums: 1.0,
          bass: 1.0,
          melody: 1.0,
          vocals: 1.0,
          original: 1.0,
        },
        playback: {
          isPlaying: false,
          currentTime: 0,
          duration: 0,
          position: 0,
        },
      },
    };
  }
}
```

## Deployment Architecture

### Multi-Platform Deployment

#### Vercel Deployment (Primary)

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build:prod",
  "installCommand": "npm ci",
  "regions": ["iad1", "sfo1", "sin1"],
  "functions": {
    "app/api/**/*.ts": {
      "runtime": "nodejs18.x"
    }
  }
}
```

#### Docker Deployment (Self-Hosted)

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

#### Netlify Deployment (Alternative)

```toml
[build]
  command = "npm run build:prod"
  publish = ".next"

[functions]
  directory = "app/api"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

This comprehensive architecture ensures OX Board delivers professional-grade performance, scalability, and user experience while maintaining code quality and developer productivity.
