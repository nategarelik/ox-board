# Design Patterns

## Overview

This document catalogs all design patterns used in the OX Board codebase with specific implementation examples.

---

## Creational Patterns

### 1. Singleton Pattern

**Intent**: Ensure a class has only one instance and provide global access point.

**Implementation**: AudioService, DeckManager

**Example** (`app/services/AudioService.ts`):

```typescript
export class AudioService {
  private static instance: AudioService | null = null;

  private constructor(config?: Partial<AudioServiceConfig>) {
    // Private constructor prevents direct instantiation
  }

  public static getInstance(
    config?: Partial<AudioServiceConfig>,
  ): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService(config);
    }
    return AudioService.instance;
  }
}

// Usage
const audioService = AudioService.getInstance();
```

**Benefits**:

- Single shared audio context (browser limitation)
- Consistent configuration
- Prevents resource conflicts

**Thread Safety**: Not needed (single-threaded JavaScript)

---

### 2. Factory Pattern

**Intent**: Create objects without specifying exact class.

**Implementation**: AudioService node creation

**Example** (`app/services/AudioService.ts`):

```typescript
export class AudioService {
  public createGain(gain: number = 1): Tone.Gain {
    if (!this.isReady()) {
      throw new Error("AudioService not ready");
    }
    return new Tone.Gain(gain);
  }

  public createEQ3(): Tone.EQ3 {
    if (!this.isReady()) {
      throw new Error("AudioService not ready");
    }
    return new Tone.EQ3();
  }

  public createFilter(frequency: number = 1000): Tone.Filter {
    if (!this.isReady()) {
      throw new Error("AudioService not ready");
    }
    return new Tone.Filter(frequency, "lowpass");
  }
}
```

**Benefits**:

- Consistent node configuration
- Centralized validation
- Easy to extend with new node types

---

### 3. Builder Pattern (Implicit)

**Intent**: Construct complex objects step by step.

**Implementation**: GestureMapping construction

**Example** (`app/lib/gestures/gestureStemMapper.ts`):

```typescript
const mapping: GestureMapping = {
  id: "pinch-volume-drums",
  gestureType: GestureClassification.PINCH,
  handSide: "Right",
  targetStem: "drums",
  controlType: "volume",
  mode: "continuous",
  params: {
    sensitivity: 1.5,
    deadzone: 0.05,
    curve: "exponential",
  },
};
```

**Benefits**:

- Flexible configuration
- Optional parameters
- Type-safe construction

---

## Structural Patterns

### 4. Adapter Pattern

**Intent**: Convert interface of class into another interface clients expect.

**Implementation**: Tone.js wrapping Web Audio API

**Example** (`app/services/AudioService.ts`):

```typescript
// Tone.Context adapts native AudioContext
this.context = new Tone.Context({
  latencyHint: this.config.latencyHint,
  lookAhead: this.config.lookAhead,
});

// Provides unified interface
const rawContext = this.context.rawContext; // Native AudioContext
```

**Benefits**:

- Cleaner API than raw Web Audio
- Automatic memory management
- Musical timing abstractions

---

### 5. Facade Pattern

**Intent**: Provide unified interface to set of interfaces in subsystem.

**Implementation**: EnhancedDJStore actions

**Example** (`app/stores/enhancedDjStoreWithGestures.ts`):

```typescript
// Facade hides complexity of mixer, stem player, and gesture mapping
const store = {
  // Simple action hiding complex operations
  playStemPlayer: async (channel: number) => {
    const { mixer } = get();
    if (!mixer) throw new Error("Mixer not initialized");

    // Coordinates multiple subsystems
    await mixer.playStemPlayer(channel);

    const decks = [...get().decks];
    decks[channel] = { ...decks[channel], isPlaying: true };
    set({ decks });

    get().updateStemPlayerState(channel);
  },
};
```

**Benefits**:

- Simplified API for components
- Hides subsystem complexity
- Single entry point for operations

---

### 6. Composite Pattern

**Intent**: Compose objects into tree structures to represent part-whole hierarchies.

**Implementation**: Audio node chains

**Example**:

```typescript
// Composite audio chain
const chain = [
  player, // Leaf
  eq, // Leaf
  filter, // Leaf
  gain, // Leaf
  output, // Leaf
];

// All nodes implement common interface
chain.forEach((node) => node.connect(nextNode));
```

**Benefits**:

- Uniform treatment of nodes
- Easy to extend chains
- Recursive disposal

---

### 7. Decorator Pattern

**Intent**: Attach additional responsibilities to object dynamically.

**Implementation**: Zustand devtools middleware

**Example** (`app/stores/enhancedDjStoreWithGestures.ts`):

```typescript
const useEnhancedDJStore = create<EnhancedDJState>()(
  devtools(
    // Decorator adds debugging capabilities
    (set, get) => ({
      // Store implementation
    }),
    { name: "enhanced-dj-store" },
  ),
);
```

**Benefits**:

- Non-invasive debugging
- Removable in production
- Time-travel debugging

---

## Behavioral Patterns

### 8. Observer Pattern

**Intent**: Define one-to-many dependency where state change notifies dependents.

**Implementation**: EventEmitter in DeckManager, Zustand subscriptions

**Example** (`app/services/DeckManager.ts`):

```typescript
export class DeckManager extends EventEmitter {
  private setupEventListeners(): void {
    // Observe deck events
    this.deckA.on("play", () => this.emit("deck:play", { deck: "A" }));
    this.deckA.on("loaded", (data) =>
      this.emit("deck:loaded", { deck: "A", ...data }),
    );
  }
}

// Component subscribes
deckManager.on("deck:play", ({ deck }) => {
  console.log(`Deck ${deck} started playing`);
});
```

**Zustand Implementation**:

```typescript
// Components automatically subscribe to state changes
const decks = useEnhancedDJStore((state) => state.decks);
// Re-renders only when decks change
```

**Benefits**:

- Loose coupling
- Multiple subscribers
- Reactive updates

---

### 9. Strategy Pattern

**Intent**: Define family of algorithms, encapsulate each, make them interchangeable.

**Implementation**: Crossfader curves, Control modes

**Example** (`app/lib/audio/crossfader.ts`):

```typescript
type FadeCurve = "linear" | "constant-power" | "exponential";

class Crossfader {
  private curve: FadeCurve = "linear";

  setCurve(curve: FadeCurve): void {
    this.curve = curve;
    // Strategy determines fade behavior
    switch (curve) {
      case "linear":
        this.crossfade.fade.linearRampTo(this.position, 0.01);
        break;
      case "constant-power":
        this.crossfade.fade.exponentialRampTo(Math.sqrt(this.position), 0.01);
        break;
      case "exponential":
        this.crossfade.fade.exponentialRampTo(this.position, 0.001);
        break;
    }
  }
}
```

**Gesture Mapping Strategy**:

```typescript
type ControlMode = "continuous" | "toggle" | "trigger";

// Strategy determines how gesture maps to control
switch (mapping.mode) {
  case "continuous":
    // Update value every frame
    setStemVolume(channel, stemType, value);
    break;
  case "toggle":
    // Binary on/off
    setStemMute(channel, stemType, value > 0.5);
    break;
  case "trigger":
    // One-shot action
    if (value > threshold) {
      setCuePoint(channel);
    }
    break;
}
```

**Benefits**:

- Runtime algorithm selection
- Easy to add new strategies
- Testable in isolation

---

### 10. Command Pattern

**Intent**: Encapsulate request as object, allowing parameterization and queuing.

**Implementation**: Store actions

**Example** (`app/stores/enhancedDjStoreWithGestures.ts`):

```typescript
// Actions are commands
const actions = {
  setDeckVolume: (deckId: number, volume: number) => {
    const decks = [...get().decks];
    decks[deckId] = { ...decks[deckId], volume };
    set({ decks });
  },

  playStemPlayer: async (channel: number) => {
    // Command encapsulates complex operation
    await get().mixer?.playStemPlayer(channel);
    // ... update state
  },
};

// Commands invoked through store
store.getState().setDeckVolume(0, 0.8);
```

**Benefits**:

- Undo/redo potential (with history)
- Action logging via DevTools
- Parameterized requests

---

### 11. State Pattern

**Intent**: Allow object to alter behavior when internal state changes.

**Implementation**: Deck playback states

**Example** (`app/lib/audio/deck.ts`):

```typescript
interface DeckState {
  isPlaying: boolean;
  // ... other state
}

class Deck {
  private state: DeckState;

  play(): void {
    if (!this.state.isPlaying) {
      this.player?.start();
      this.state.isPlaying = true;
      this.emit("play");
    }
  }

  pause(): void {
    if (this.state.isPlaying) {
      this.player?.pause();
      this.state.isPlaying = false;
      this.emit("pause");
    }
  }
}
```

**State Machine** (implicit):

```
Empty → Loading → Loaded → Playing → Paused → Stopped
                     ↓         ↑
                     └─────────┘
```

**Benefits**:

- Clear state transitions
- Prevents invalid operations
- Easy to visualize

---

### 12. Template Method Pattern

**Intent**: Define skeleton of algorithm, defer steps to subclasses.

**Implementation**: Gesture recognition pipeline

**Example** (`app/lib/gesture/recognition.ts`):

```typescript
class AdvancedGestureRecognizer {
  // Template method
  recognizeGestures(
    leftHand: HandResult | null,
    rightHand: HandResult | null,
    screenWidth: number,
    screenHeight: number
  ): GestureResult[] {
    const results: GestureResult[] = [];

    // Step 1: Single hand gestures
    if (leftHand) {
      results.push(...this.recognizeSingleHandGestures(leftHand, ...));
    }
    if (rightHand) {
      results.push(...this.recognizeSingleHandGestures(rightHand, ...));
    }

    // Step 2: Two hand gestures
    if (leftHand && rightHand) {
      results.push(...this.recognizeTwoHandGestures(leftHand, rightHand, ...));
    }

    // Step 3: Update history
    results.forEach(result => this.updateGestureHistory(result));

    // Step 4: Filter by confidence
    return results.filter(result => /* confidence check */);
  }

  // Hook methods (can be overridden)
  private recognizeSingleHandGestures(...): GestureResult[] {
    // Concrete implementation
  }
}
```

**Benefits**:

- Consistent algorithm structure
- Customizable steps
- Code reuse

---

### 13. Chain of Responsibility Pattern

**Intent**: Pass request along chain of handlers until handled.

**Implementation**: Error boundary hierarchy

**Example** (`app/components/ErrorBoundary.tsx`):

```typescript
// Chain: Specific → General
<RootErrorBoundary>           {/* Catches all */}
  <DJErrorBoundary>           {/* Catches DJ-specific */}
    <AudioErrorBoundary>      {/* Catches audio-specific */}
      <AudioComponents />
    </AudioErrorBoundary>
  </DJErrorBoundary>
</RootErrorBoundary>

// Each boundary decides to handle or propagate
class AudioErrorBoundary extends Component {
  componentDidCatch(error: Error) {
    if (error.message.includes("AudioContext")) {
      // Handle audio errors
      this.setState({ hasError: true });
    } else {
      // Propagate to parent
      throw error;
    }
  }
}
```

**Benefits**:

- Flexible error handling
- Specific to general fallbacks
- Easy to add handlers

---

## Concurrency Patterns

### 14. Producer-Consumer Pattern

**Intent**: Decouple production and consumption of data.

**Implementation**: Web Worker communication

**Example** (`app/lib/audio/musicAnalyzerClient.ts`):

```typescript
class MusicAnalyzerClient {
  private worker: Worker;
  private pendingRequests: Map<
    string,
    {
      resolve: (result: any) => void;
      reject: (error: Error) => void;
    }
  > = new Map();

  // Producer: Send analysis request
  async analyzeBPM(audioBuffer: AudioBuffer): Promise<number> {
    const requestId = crypto.randomUUID();

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });

      // Send to worker (producer)
      this.worker.postMessage(
        {
          type: "ANALYZE_BPM",
          requestId,
          buffer: audioBuffer,
        },
        [audioBuffer.buffer],
      ); // Transfer ownership
    });
  }

  // Consumer: Handle worker response
  private handleWorkerMessage(event: MessageEvent): void {
    const { requestId, result, error } = event.data;
    const pending = this.pendingRequests.get(requestId);

    if (pending) {
      if (error) {
        pending.reject(new Error(error));
      } else {
        pending.resolve(result);
      }
      this.pendingRequests.delete(requestId);
    }
  }
}
```

**Benefits**:

- Non-blocking main thread
- Parallel processing
- Clear separation

---

### 15. Async/Await Pattern

**Intent**: Simplify asynchronous code with synchronous-style syntax.

**Implementation**: Used throughout codebase

**Example** (`app/stores/enhancedDjStoreWithGestures.ts`):

```typescript
const store = {
  loadStemsToChannel: async (channel: number, demucsOutput: DemucsOutput) => {
    try {
      // Sequential async operations
      const results = await mixer.loadStemsToChannel(channel, demucsOutput);

      // Update state after completion
      const decks = [...get().decks];
      decks[channel].track = {
        ...decks[channel].track!,
        hasStems: true,
        stemData: demucsOutput,
      };
      set({ decks });

      return results;
    } catch (error) {
      // Error handling
      throw error;
    }
  },
};
```

**Benefits**:

- Readable async code
- Error propagation
- Sequential or parallel (`Promise.all`)

---

## Functional Patterns

### 16. Higher-Order Function Pattern

**Intent**: Functions that take or return functions.

**Implementation**: Zustand selectors, Array methods

**Example**:

```typescript
// Selector is HOF
const selectDeck = (deckId: number) => (state: EnhancedDJState) =>
  state.decks[deckId];

// Usage
const deck0 = useEnhancedDJStore(selectDeck(0));

// Array HOF
const activeStemControls = Object.entries(stemControls)
  .filter(([_, controls]) => !controls.muted)
  .map(([stem, controls]) => ({ stem, volume: controls.volume }));
```

**Benefits**:

- Composable logic
- Reusable selectors
- Functional composition

---

### 17. Memoization Pattern

**Intent**: Cache function results for repeated calls with same inputs.

**Implementation**: React.useMemo, React.useCallback

**Example** (`app/components/StemControls.tsx`):

```typescript
const StemControls = ({ channel }) => {
  // Memoize expensive calculations
  const stemAnalysis = useMemo(() => {
    return analyzeStemFrequencies(stems);
  }, [stems]); // Recalculate only when stems change

  // Memoize callbacks to prevent re-renders
  const handleVolumeChange = useCallback((stemType: StemType, volume: number) => {
    setStemVolume(channel, stemType, volume);
  }, [channel]); // Recreate only when channel changes

  return (
    <div>
      {/* Use memoized values */}
    </div>
  );
};
```

**Benefits**:

- Performance optimization
- Prevents unnecessary re-renders
- Reduces computation

---

## Anti-Patterns (Avoided)

### ❌ God Object

**Problem**: Single class knows/does too much

**Avoided**: Services have single responsibility

- AudioService: Audio context only
- DeckManager: Deck orchestration only
- Not combined into "MusicApp" class

### ❌ Spaghetti Code

**Problem**: Tangled, unstructured code

**Avoided**:

- Clear layer separation
- Consistent patterns
- Proper abstractions

### ❌ Premature Optimization

**Problem**: Optimize before knowing bottlenecks

**Avoided**:

- Profile first, optimize second
- Simple implementations initially
- Optimize hot paths only (gesture processing, audio)

### ❌ Magic Numbers

**Problem**: Unexplained constants

**Avoided**: Named constants

```typescript
// ❌ Bad
if (volume < 0.01) return;

// ✅ Good
const VOLUME_CHANGE_THRESHOLD = 0.01;
if (Math.abs(currentVolume - volume) < VOLUME_CHANGE_THRESHOLD) return;
```

---

## Pattern Selection Guide

| Use Case                    | Pattern                 | Example                |
| --------------------------- | ----------------------- | ---------------------- |
| Single instance needed      | Singleton               | AudioService           |
| Create objects flexibly     | Factory                 | Audio node creation    |
| Simplify complex subsystem  | Facade                  | Store actions          |
| Multiple algorithms         | Strategy                | Crossfader curves      |
| Notify multiple observers   | Observer                | EventEmitter, Zustand  |
| Wrap incompatible interface | Adapter                 | Tone.js over Web Audio |
| Encapsulate requests        | Command                 | Store actions          |
| Change behavior by state    | State                   | Deck playback          |
| Define algorithm skeleton   | Template Method         | Gesture recognition    |
| Chain of handlers           | Chain of Responsibility | Error boundaries       |
| Decouple async operations   | Producer-Consumer       | Web Workers            |

---

## Pattern Metrics

| Pattern                 | Occurrences | Primary Locations                         |
| ----------------------- | ----------- | ----------------------------------------- |
| Singleton               | 2           | AudioService, DeckManager                 |
| Factory                 | 1           | AudioService                              |
| Observer                | 15+         | DeckManager events, Zustand subscriptions |
| Strategy                | 5           | Crossfader curves, control modes          |
| Facade                  | 1           | EnhancedDJStore                           |
| Adapter                 | 3           | Tone.js, MediaPipe wrappers               |
| Command                 | 50+         | All store actions                         |
| State                   | 10+         | Deck, Player, UI states                   |
| Template Method         | 3           | Gesture recognition, analysis pipelines   |
| Chain of Responsibility | 1           | Error boundaries                          |
| Producer-Consumer       | 2           | Web Workers                               |
| Higher-Order Function   | 100+        | Selectors, callbacks, array methods       |

---

_Last Updated: 2025-10-09_
_Total Patterns: 17_
_Anti-Patterns Avoided: 4_
