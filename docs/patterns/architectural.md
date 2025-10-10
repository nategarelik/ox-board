# OX Board Architectural Patterns

## System Architecture Overview

### Layered Architecture

OX Board implements a clean layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  React Components, UI Logic, Error Boundaries, Themes       │
├─────────────────────────────────────────────────────────────┤
│                    Application Layer                         │
│  State Management (Zustand), Business Logic, Workflows      │
├─────────────────────────────────────────────────────────────┤
│                      Domain Layer                           │
│  Core Entities (Deck, Track, Stem), Business Rules         │
├─────────────────────────────────────────────────────────────┤
│                   Infrastructure Layer                      │
│  Services, Workers, External Libraries (Tone.js, MediaPipe) │
└─────────────────────────────────────────────────────────────┘
```

**Benefits**:

- Clear separation of concerns
- Independent layer evolution
- Testability at each layer
- Technology substitution flexibility

**Implementation**:

```typescript
// Presentation Layer
app/components/
├── stem-player/          // Classic UI components
├── terminal/            // Terminal UI components
└── ErrorBoundary.tsx    // Cross-cutting concerns

// Application Layer
app/stores/
└── enhancedDjStoreWithGestures.ts  // Central state management

// Domain Layer
app/lib/
├── audio/              // Domain logic for audio
├── gestures/          // Domain logic for gestures
└── types/            // Domain models

// Infrastructure Layer
app/services/         // External service interfaces
app/workers/         // Background processing
```

---

## Event-Driven Architecture

### Publish-Subscribe Pattern

The system uses events extensively for loose coupling between components:

```typescript
// Event Publishers (DeckManager)
export class DeckManager extends EventEmitter {
  public play(deck: "A" | "B"): void {
    const targetDeck = this.getDeck(deck);
    targetDeck.play();

    // Publish event
    this.emit("deck:play", {
      deck,
      timestamp: Date.now(),
      bpm: targetDeck.getBPM(),
      position: targetDeck.getPosition(),
    });
  }
}

// Event Subscribers
deckManager.on("deck:play", (event) => {
  // Multiple subscribers can react independently
  updateUIState(event);
  startBeatAnimation(event);
  logAnalytics(event);
  checkAutoMixTrigger(event);
});
```

**Event Categories**:

1. **Deck Events**
   - `deck:play`, `deck:pause`, `deck:stop`
   - `deck:loaded`, `deck:error`, `deck:cue`

2. **Mixer Events**
   - `crossfader:change`
   - `eq:change`, `filter:change`
   - `master:volume`

3. **Sync Events**
   - `sync:engaged`, `sync:disengaged`
   - `sync:drift`, `sync:corrected`

4. **Gesture Events**
   - `gesture:detected`, `gesture:lost`
   - `gesture:control`, `gesture:combination`

**Benefits**:

- Loose coupling between components
- Easy to add new event handlers
- Asynchronous communication
- Event replay for debugging

---

## Microkernel Architecture

### Plugin System for Effects and Gestures

```typescript
// Core kernel provides extension points
interface AudioEffect {
  id: string;
  name: string;
  process(input: AudioNode): AudioNode;
  getParameters(): EffectParameter[];
}

class EffectKernel {
  private effects = new Map<string, AudioEffect>();

  public register(effect: AudioEffect): void {
    this.effects.set(effect.id, effect);
  }

  public applyEffect(id: string, input: AudioNode): AudioNode {
    const effect = this.effects.get(id);
    if (!effect) throw new Error(`Effect ${id} not found`);
    return effect.process(input);
  }
}

// Plugins extend the kernel
class ReverbEffect implements AudioEffect {
  id = "reverb";
  name = "Reverb";

  process(input: AudioNode): AudioNode {
    const reverb = new Tone.Reverb(2);
    input.connect(reverb);
    return reverb;
  }

  getParameters(): EffectParameter[] {
    return [
      { name: "roomSize", min: 0, max: 1, default: 0.5 },
      { name: "wet", min: 0, max: 1, default: 0.3 },
    ];
  }
}
```

**Extension Points**:

- Audio effects
- Gesture mappings
- Crossfader curves
- Analysis algorithms
- UI themes

---

## Service-Oriented Architecture (SOA)

### Service Layer Design

```typescript
// Service Interface
interface IAudioService {
  initialize(): Promise<void>;
  getContext(): AudioContext;
  createNode(type: string): AudioNode;
  dispose(): void;
}

// Service Implementation
class AudioService implements IAudioService {
  private static instance: AudioService;

  public async initialize(): Promise<void> {
    // Service initialization
  }

  public getContext(): AudioContext {
    // Provide audio context
  }
}

// Service Registry
class ServiceRegistry {
  private services = new Map<string, any>();

  register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) throw new Error(`Service ${name} not found`);
    return service as T;
  }
}

// Usage
const registry = new ServiceRegistry();
registry.register("audio", AudioService.getInstance());
registry.register("deck", DeckManager.getInstance());
registry.register("analyzer", musicAnalyzerClient);

const audioService = registry.get<IAudioService>("audio");
```

**Core Services**:

1. **AudioService**
   - Audio context management
   - Node factory methods
   - Performance monitoring

2. **DeckManager**
   - Deck coordination
   - Mixing operations
   - Sync management

3. **MusicAnalyzerClient**
   - BPM detection
   - Key analysis
   - Spectral features

4. **GestureMapper**
   - Gesture recognition
   - Control mapping
   - Calibration

---

## Pipeline Architecture

### Audio Processing Pipeline

```typescript
// Audio processing stages
class AudioPipeline {
  private stages: AudioProcessor[] = [];

  addStage(processor: AudioProcessor): this {
    this.stages.push(processor);
    return this;
  }

  process(input: AudioBuffer): AudioBuffer {
    return this.stages.reduce((buffer, stage) => stage.process(buffer), input);
  }
}

// Pipeline configuration
const masterPipeline = new AudioPipeline()
  .addStage(new GainStage(0.8)) // Volume
  .addStage(new EQ3Stage()) // Equalization
  .addStage(new CompressorStage()) // Dynamics
  .addStage(new LimiterStage(-1)) // Peak limiting
  .addStage(new RecorderStage()); // Recording tap
```

### Gesture Processing Pipeline

```typescript
// Gesture processing stages
const gesturePipeline = new Pipeline<HandLandmarks, GestureResult>()
  .pipe(kalmanFilter) // Noise reduction
  .pipe(normalizer) // Coordinate normalization
  .pipe(detector) // Gesture recognition
  .pipe(confidenceFilter) // Confidence threshold
  .pipe(mapper) // Control mapping
  .pipe(smoother) // Value smoothing
  .pipe(output); // Final output

// Process landmarks through pipeline
const result = gesturePipeline.execute(handLandmarks);
```

**Pipeline Characteristics**:

- Sequential processing
- Each stage independent
- Easy to add/remove stages
- Configurable at runtime

---

## Component-Based Architecture

### React Component Composition

```typescript
// Base component interfaces
interface DeckComponentProps {
  deckId: 'A' | 'B';
  isActive: boolean;
}

// Composite component structure
function DeckControl({ deckId }: DeckComponentProps) {
  return (
    <DeckContainer>
      <WaveformDisplay deckId={deckId} />
      <TransportControls deckId={deckId} />
      <PitchControl deckId={deckId} />
      <EQControls deckId={deckId} />
      <EffectsRack deckId={deckId} />
      <CuePoints deckId={deckId} />
    </DeckContainer>
  );
}

// Feature composition
function DJInterface() {
  return (
    <Layout>
      <Header />
      <MainArea>
        <DeckControl deckId="A" />
        <MixerSection />
        <DeckControl deckId="B" />
      </MainArea>
      <GestureVisualizer />
    </Layout>
  );
}
```

**Component Categories**:

1. **Container Components**
   - Handle business logic
   - Connect to store
   - Manage side effects

2. **Presentational Components**
   - Pure rendering logic
   - No direct store access
   - Reusable across features

3. **Control Components**
   - User interaction handling
   - Gesture/mouse/keyboard input
   - Value transformation

---

## Message-Driven Architecture

### Worker Communication Pattern

```typescript
// Message protocol
interface WorkerMessage {
  id: string;
  type: "analyze" | "separate" | "process";
  payload: any;
}

interface WorkerResponse {
  id: string;
  type: "success" | "error" | "progress";
  result?: any;
  error?: string;
  progress?: number;
}

// Client side
class WorkerClient {
  private worker: Worker;
  private pending = new Map<string, (result: any) => void>();

  async request(type: string, payload: any): Promise<any> {
    const id = crypto.randomUUID();

    return new Promise((resolve) => {
      this.pending.set(id, resolve);
      this.worker.postMessage({ id, type, payload });
    });
  }

  private handleMessage(event: MessageEvent<WorkerResponse>) {
    const { id, result } = event.data;
    const resolver = this.pending.get(id);
    if (resolver) {
      resolver(result);
      this.pending.delete(id);
    }
  }
}

// Worker side
self.addEventListener("message", async (event: MessageEvent<WorkerMessage>) => {
  const { id, type, payload } = event.data;

  try {
    let result;
    switch (type) {
      case "analyze":
        result = await analyzeAudio(payload);
        break;
      case "separate":
        result = await separateStems(payload);
        break;
    }

    self.postMessage({ id, type: "success", result });
  } catch (error) {
    self.postMessage({ id, type: "error", error: error.message });
  }
});
```

**Benefits**:

- Non-blocking UI
- Parallel processing
- Crash isolation
- Resource management

---

## Hexagonal Architecture (Ports and Adapters)

### Core Domain Isolation

```typescript
// Core domain (hexagon center)
namespace Domain {
  export interface Track {
    id: string;
    bpm: number;
    key: string;
  }

  export interface DeckPort {
    load(track: Track): Promise<void>;
    play(): void;
    pause(): void;
  }

  export interface StoragePort {
    save(track: Track): Promise<void>;
    load(id: string): Promise<Track>;
  }
}

// Adapters (hexagon edges)
class ToneJSDeckAdapter implements Domain.DeckPort {
  async load(track: Domain.Track): Promise<void> {
    // Adapt domain model to Tone.js
    const player = new Tone.Player(track.url);
    // ... implementation
  }
}

class LocalStorageAdapter implements Domain.StoragePort {
  async save(track: Domain.Track): Promise<void> {
    localStorage.setItem(`track-${track.id}`, JSON.stringify(track));
  }
}

// Application uses ports, not concrete implementations
class DJApplication {
  constructor(
    private deck: Domain.DeckPort,
    private storage: Domain.StoragePort,
  ) {}

  async loadTrack(id: string): Promise<void> {
    const track = await this.storage.load(id);
    await this.deck.load(track);
  }
}
```

**Ports (Interfaces)**:

- DeckPort
- StoragePort
- AnalyzerPort
- GesturePort

**Adapters (Implementations)**:

- ToneJSAdapter
- WebAudioAdapter
- MediaPipeAdapter
- LocalStorageAdapter

---

## CQRS Pattern (Command Query Responsibility Segregation)

### Separated Read and Write Models

```typescript
// Commands (write operations)
interface Command {
  execute(): Promise<void>;
}

class LoadTrackCommand implements Command {
  constructor(
    private deckId: string,
    private trackId: string,
  ) {}

  async execute(): Promise<void> {
    // Modify state
    const track = await fetchTrack(this.trackId);
    await loadToDeck(this.deckId, track);
    emit("track:loaded", { deckId: this.deckId });
  }
}

// Queries (read operations)
interface Query<T> {
  execute(): Promise<T>;
}

class GetDeckStateQuery implements Query<DeckState> {
  constructor(private deckId: string) {}

  async execute(): Promise<DeckState> {
    // Read without modifying
    return {
      track: getCurrentTrack(this.deckId),
      position: getPosition(this.deckId),
      isPlaying: getPlayState(this.deckId),
      bpm: getBPM(this.deckId),
    };
  }
}

// Command/Query bus
class CQBus {
  async executeCommand(command: Command): Promise<void> {
    // Log, validate, execute
    console.log("Executing command:", command.constructor.name);
    await command.execute();
  }

  async executeQuery<T>(query: Query<T>): Promise<T> {
    // Cache, optimize, execute
    return await query.execute();
  }
}
```

**Benefits**:

- Optimized read models
- Command validation
- Event sourcing ready
- Clear operation intent

---

## Performance Optimization Patterns

### Resource Pooling

```typescript
class AudioNodePool {
  private available: AudioNode[] = [];
  private inUse = new Set<AudioNode>();

  acquire(): AudioNode {
    let node = this.available.pop();
    if (!node) {
      node = this.createNode();
    }
    this.inUse.add(node);
    return node;
  }

  release(node: AudioNode): void {
    if (this.inUse.delete(node)) {
      this.resetNode(node);
      this.available.push(node);
    }
  }
}
```

### Lazy Loading

```typescript
// Dynamic imports for heavy components
const DJMode = lazy(() => import('./components/DJMode'));
const TerminalUI = lazy(() => import('./components/terminal/TerminalApp'));

// Load only when needed
function App() {
  const [mode, setMode] = useState('classic');

  return (
    <Suspense fallback={<Loading />}>
      {mode === 'classic' ? <DJMode /> : <TerminalUI />}
    </Suspense>
  );
}
```

### Caching Strategy

```typescript
class AnalysisCache {
  private cache = new Map<string, AnalysisResult>();
  private maxSize = 100;

  get(trackId: string): AnalysisResult | null {
    const result = this.cache.get(trackId);
    if (result) {
      // Move to end (LRU)
      this.cache.delete(trackId);
      this.cache.set(trackId, result);
    }
    return result || null;
  }

  set(trackId: string, result: AnalysisResult): void {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest (first)
      const first = this.cache.keys().next().value;
      this.cache.delete(first);
    }
    this.cache.set(trackId, result);
  }
}
```

---

## Security Patterns

### Capability-Based Security

```typescript
class AudioCapabilities {
  private permissions = new Set<string>();

  grant(capability: string): void {
    this.permissions.add(capability);
  }

  revoke(capability: string): void {
    this.permissions.delete(capability);
  }

  can(capability: string): boolean {
    return this.permissions.has(capability);
  }

  // Wrap operations with capability checks
  async record(): Promise<void> {
    if (!this.can("record")) {
      throw new Error("Recording permission not granted");
    }
    // Proceed with recording
  }
}
```

### Input Validation

```typescript
class GestureValidator {
  validate(landmarks: any[]): NormalizedLandmark[] {
    // Validate structure
    if (!Array.isArray(landmarks) || landmarks.length !== 21) {
      throw new Error("Invalid landmark array");
    }

    // Validate and sanitize each landmark
    return landmarks.map((landmark) => ({
      x: this.clamp(Number(landmark.x) || 0, 0, 1),
      y: this.clamp(Number(landmark.y) || 0, 0, 1),
      z: this.clamp(Number(landmark.z) || 0, -1, 1),
    }));
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}
```

---

## Architectural Principles

### 1. Separation of Concerns

Each layer/component has a single, well-defined responsibility

### 2. Dependency Inversion

High-level modules don't depend on low-level modules; both depend on abstractions

### 3. Open/Closed Principle

System is open for extension but closed for modification

### 4. Interface Segregation

Many specific interfaces better than one general interface

### 5. Single Source of Truth

State managed centrally in Zustand store

### 6. Fail-Fast

Detect and handle errors as early as possible

### 7. Progressive Enhancement

Core functionality works without optional features

### 8. Performance First

Audio latency and gesture responsiveness prioritized

These architectural patterns work together to create a scalable, maintainable, and performant DJ platform that can evolve with new features while maintaining stability.
