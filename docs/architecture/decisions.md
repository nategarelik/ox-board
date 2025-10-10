# Architecture Decision Records (ADRs)

## ADR-001: Browser-First Architecture

**Status**: Accepted
**Date**: 2024-01

### Context

Building a professional DJ platform requires low-latency audio processing and real-time gesture recognition. Traditional approaches would use desktop applications or server-based processing.

### Decision

We will build OX Board as a browser-first application with all processing happening client-side.

### Consequences

**Positive:**

- Zero server costs for audio processing
- No network latency in audio pipeline
- Works offline once loaded
- Easy distribution (just a URL)
- Cross-platform compatibility

**Negative:**

- Limited by browser capabilities
- Requires modern browser support
- Cannot access system audio drivers directly
- Memory constraints of browser environment

### Rationale

Modern browsers provide sufficient capabilities through Web Audio API, MediaPipe, and Web Workers. The trade-offs are acceptable for our target use case.

---

## ADR-002: Singleton Pattern for Audio Services

**Status**: Accepted
**Date**: 2024-01

### Context

Web Audio API requires a single AudioContext per page. Multiple contexts cause resource conflicts and audio glitches.

### Decision

Implement AudioService and DeckManager as singletons to ensure single audio context.

### Implementation

```typescript
class AudioService {
  private static instance: AudioService | null = null;

  public static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }
}
```

### Consequences

**Positive:**

- Prevents multiple audio contexts
- Centralized audio configuration
- Consistent audio routing
- Resource efficiency

**Negative:**

- Global state (harder to test)
- Tight coupling to singleton
- Cleanup complexity

---

## ADR-003: Zustand for State Management

**Status**: Accepted
**Date**: 2024-01

### Context

Need centralized state management for complex DJ application with 4 decks, stems, gestures, and effects.

### Decision

Use Zustand instead of Redux or Context API.

### Rationale

- Simpler than Redux (less boilerplate)
- Better performance than Context API
- Built-in TypeScript support
- DevTools integration
- Small bundle size (8KB)

### Consequences

**Positive:**

- Simple API
- Good TypeScript integration
- Minimal boilerplate
- Fast re-renders with selectors

**Negative:**

- Less ecosystem than Redux
- Fewer middleware options
- Less time-travel debugging

---

## ADR-004: Tone.js for Audio Abstraction

**Status**: Accepted
**Date**: 2024-01

### Context

Web Audio API is powerful but low-level. Need abstraction for complex audio graphs.

### Decision

Use Tone.js as primary audio library, with direct Web Audio API for specific needs.

### Rationale

- High-level abstractions for common audio nodes
- Built-in effects and instruments
- Excellent scheduling capabilities
- Active maintenance
- Good documentation

### Consequences

**Positive:**

- Faster development
- Consistent audio behavior
- Built-in effects
- Transport synchronization

**Negative:**

- Additional dependency (150KB)
- Abstraction overhead
- Some limitations vs raw Web Audio

---

## ADR-005: Web Workers for Heavy Processing

**Status**: Accepted
**Date**: 2024-01

### Context

Music analysis and stem separation are CPU-intensive and block the main thread.

### Decision

Use Web Workers for:

- BPM/key detection (Essentia.js)
- Stem separation processing
- Waveform generation
- Heavy audio analysis

### Implementation

```typescript
// Main thread
const worker = new Worker("./analyzer.worker.js");
worker.postMessage({ cmd: "analyze", buffer });

// Worker thread
self.addEventListener("message", async (e) => {
  const result = await analyze(e.data.buffer);
  self.postMessage(result);
});
```

### Consequences

**Positive:**

- Non-blocking UI
- Parallel processing
- Crash isolation
- Better performance

**Negative:**

- Data serialization overhead
- Complex debugging
- Browser compatibility varies
- Memory duplication

---

## ADR-006: MediaPipe for Gesture Recognition

**Status**: Accepted
**Date**: 2024-02

### Context

Need robust hand tracking without training custom models.

### Decision

Use Google's MediaPipe for hand landmark detection.

### Rationale

- Pre-trained models
- Runs in browser
- Good accuracy
- 21 landmarks per hand
- Active development

### Consequences

**Positive:**

- No model training needed
- Good out-of-box accuracy
- Real-time performance
- Cross-browser support

**Negative:**

- Large model download (10MB)
- Fixed landmark model
- Cannot customize detection
- Google dependency

---

## ADR-007: Event-Driven Architecture

**Status**: Accepted
**Date**: 2024-02

### Context

Need loose coupling between audio services, UI, and state management.

### Decision

Use EventEmitter pattern for service communication.

### Implementation

```typescript
class DeckManager extends EventEmitter {
  play(deck: "A" | "B") {
    // ... play logic
    this.emit("deck:play", { deck });
  }
}

// Subscribers
deckManager.on("deck:play", updateUI);
deckManager.on("deck:play", logAnalytics);
```

### Consequences

**Positive:**

- Loose coupling
- Easy to add listeners
- Async communication
- Clear event flow

**Negative:**

- Potential memory leaks
- Debugging complexity
- Event naming conventions
- Order dependencies

---

## ADR-008: Dual UI Theme Support

**Status**: Accepted
**Date**: 2024-03

### Context

Want to support different aesthetic preferences without duplicating logic.

### Decision

Implement two UI modes sharing the same business logic:

1. Classic UI (modern gradient)
2. Terminal UI (retro CRT)

### Implementation

```typescript
const UI = featureFlags.terminalMode ? TerminalUI : ClassicUI;
return <UI {...props} />;
```

### Consequences

**Positive:**

- User choice
- Shared business logic
- A/B testing capability
- Showcase flexibility

**Negative:**

- Maintenance overhead
- Bundle size increase
- Testing complexity
- Style duplication

---

## ADR-009: Client-Side Only Processing

**Status**: Accepted
**Date**: 2024-01

### Context

Could use server-side processing for stems and analysis.

### Decision

All audio processing happens client-side.

### Rationale

- Privacy (no audio leaves device)
- No server costs
- Offline capability
- Lower latency
- Simpler deployment

### Consequences

**Positive:**

- Complete privacy
- No infrastructure costs
- Works offline
- No network latency

**Negative:**

- Limited by client CPU
- Slower processing
- No shared computation
- Repeated processing

---

## ADR-010: Progressive Web App

**Status**: Accepted
**Date**: 2024-03

### Context

Need app-like experience without app store distribution.

### Decision

Implement PWA features:

- Service Worker
- Web App Manifest
- Offline support
- Install prompts

### Consequences

**Positive:**

- Installable
- Offline capable
- App-like experience
- Auto-updates

**Negative:**

- Service Worker complexity
- Cache management
- iOS limitations
- Update strategies

---

## ADR-011: Lazy Loading Strategy

**Status**: Accepted
**Date**: 2024-03

### Context

Initial bundle size affects load time.

### Decision

Use dynamic imports for:

- Heavy components (DJ mode, Terminal UI)
- Audio libraries (Tone.js modules)
- Analysis workers
- Effect processors

### Implementation

```typescript
const DJMode = lazy(() => import("./components/DJMode"));
```

### Consequences

**Positive:**

- Faster initial load
- Code splitting
- Reduced memory usage
- Progressive enhancement

**Negative:**

- Loading states needed
- Network requests
- Complexity
- Testing challenges

---

## ADR-012: TypeScript Strict Mode

**Status**: Accepted
**Date**: 2024-01

### Context

Need type safety for complex audio application.

### Decision

Enable TypeScript strict mode and enforce throughout codebase.

### tsconfig.json

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### Consequences

**Positive:**

- Catch errors at compile time
- Better IDE support
- Self-documenting code
- Refactoring safety

**Negative:**

- More verbose code
- Learning curve
- Third-party type issues
- Migration effort

---

## ADR-013: Multi-Level Error Boundaries

**Status**: Accepted
**Date**: 2024-03

### Context

Audio applications need resilient error handling.

### Decision

Implement three levels of error boundaries:

1. Page level (full recovery)
2. Section level (partial recovery)
3. Component level (inline errors)

### Consequences

**Positive:**

- Graceful degradation
- User-friendly errors
- Partial functionality preserved
- Debugging information

**Negative:**

- Complex error flows
- State recovery challenges
- Testing complexity
- Error boundary overhead

---

## ADR-014: 4-Deck Architecture

**Status**: Accepted
**Date**: 2024-02

### Context

Professional DJs often use 4-deck setups.

### Decision

Support 4 independent decks (0-3) with full functionality each.

### Rationale

- Industry standard
- Creative flexibility
- Future-proof
- Stem mode per deck

### Consequences

**Positive:**

- Professional capability
- Flexible mixing
- Stem layering
- Future expansion

**Negative:**

- UI complexity
- Performance overhead
- State management
- Testing complexity

---

## ADR-015: Gesture Mapping Profiles

**Status**: Accepted
**Date**: 2024-03

### Context

Different DJs prefer different gesture mappings.

### Decision

Implement configurable gesture mapping profiles with:

- Default profiles
- Custom mappings
- Import/export capability
- Per-gesture sensitivity

### Consequences

**Positive:**

- User customization
- Accessibility
- Learning curve options
- Personal preference

**Negative:**

- Configuration UI needed
- Storage requirements
- Validation complexity
- Support burden

---

## ADR-016: Performance-First Design

**Status**: Accepted
**Date**: 2024-01

### Context

DJ software requires real-time performance.

### Decision

Prioritize performance in all decisions:

- Audio latency <20ms
- Gesture latency <50ms
- 60 FPS UI target
- Aggressive optimization

### Implementation

- Object pooling
- Worker offloading
- Throttling/debouncing
- Virtual scrolling
- Code splitting

### Consequences

**Positive:**

- Professional quality
- Smooth experience
- Reliable performance
- User satisfaction

**Negative:**

- Code complexity
- Development time
- Testing difficulty
- Optimization overhead

---

## Future ADRs to Consider

1. **ADR-017**: Cloud Integration Strategy
2. **ADR-018**: MIDI Controller Support
3. **ADR-019**: Streaming Integration
4. **ADR-020**: AI-Powered Mixing
5. **ADR-021**: Collaborative Sessions
6. **ADR-022**: Mobile App Strategy

---

## Decision Review Process

Decisions are reviewed when:

- Technology landscape changes
- Performance requirements change
- User feedback indicates issues
- Better alternatives emerge

Review frequency: Quarterly or as needed
