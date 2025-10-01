# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Think carefully and implement the most concise solution that changes as little code as possible.

## Project Context

OX Board is a gesture-controlled DJ platform using webcam hand tracking. It combines:

- Real-time gesture recognition via MediaPipe
- Professional audio mixing with Web Audio API (Tone.js)
- Stem separation and AI-powered music analysis
- Progressive Web App capabilities

### UI Modes

OX Board has two UI modes accessible via feature flag toggle:

1. **Classic UI** (`app/components/stem-player/StemPlayerDashboard.tsx`)
   - Modern gradient design
   - Full-featured DJ interface
   - Default mode

2. **Terminal UI** (`app/components/terminal/TerminalApp.tsx`)
   - Retro CRT/terminal aesthetic
   - Green-on-black color scheme
   - Scanline and flicker effects
   - Same functionality, different presentation
   - Documentation: `docs/TERMINAL-UI-ARCHITECTURE.md`

Toggle between modes using the button in bottom-right corner.

## USE SUB-AGENTS FOR CONTEXT OPTIMIZATION

### 1. Always use the file-analyzer sub-agent when asked to read files.

The file-analyzer agent is an expert in extracting and summarizing critical information from files, particularly log files and verbose outputs. It provides concise, actionable summaries that preserve essential information while dramatically reducing context usage.

### 2. Always use the code-analyzer sub-agent when asked to search code, analyze code, research bugs, or trace logic flow.

The code-analyzer agent is an expert in code analysis, logic tracing, and vulnerability detection. It provides concise, actionable summaries that preserve essential information while dramatically reducing context usage.

### 3. Always use the test-runner sub-agent to run tests and analyze the test results.

Using the test-runner agent ensures:

- Full test output is captured for debugging
- Main conversation stays clean and focused
- Context usage is optimized
- All issues are properly surfaced
- No approval dialogs interrupt the workflow

## Philosophy

### Error Handling

- **Fail fast** for critical configuration (missing text model)
- **Log and continue** for optional features (extraction model)
- **Graceful degradation** when external services unavailable
- **User-friendly messages** through resilience layer

### Testing

- Always use the test-runner agent to execute tests.
- Do not use mock services for anything ever.
- Do not move on to the next test until the current test is complete.
- If the test fails, consider checking if the test is structured correctly before deciding we need to refactor the codebase.
- Tests to be verbose so we can use them for debugging.

## Tone and Behavior

- Criticism is welcome. Please tell me when I am wrong or mistaken, or even when you think I might be wrong or mistaken.
- Please tell me if there is a better approach than the one I am taking.
- Please tell me if there is a relevant standard or convention that I appear to be unaware of.
- Be skeptical.
- Be concise.
- Short summaries are OK, but don't give an extended breakdown unless we are working through the details of a plan.
- Do not flatter, and do not give compliments unless I am specifically asking for your judgement.
- Occasional pleasantries are fine.
- Feel free to ask many questions. If you are in doubt of my intent, don't guess. Ask.

## ABSOLUTE RULES:

- NO PARTIAL IMPLEMENTATION
- NO SIMPLIFICATION : no "//This is simplified stuff for now, complete implementation would blablabla"
- NO CODE DUPLICATION : check existing codebase to reuse functions and constants Read files before writing new functions. Use common sense function name to find them easily.
- NO DEAD CODE : either use or delete from codebase completely
- IMPLEMENT TEST FOR EVERY FUNCTIONS
- NO CHEATER TESTS : test must be accurate, reflect real usage and be designed to reveal flaws. No useless tests! Design tests to be verbose so we can use them for debuging.
- NO INCONSISTENT NAMING - read existing codebase naming patterns.
- NO OVER-ENGINEERING - Don't add unnecessary abstractions, factory patterns, or middleware when simple functions would work. Don't think "enterprise" when you need "working"
- NO MIXED CONCERNS - Don't put validation logic inside API handlers, database queries inside UI components, etc. instead of proper separation
- NO RESOURCE LEAKS - Don't forget to close database connections, clear timeouts, remove event listeners, or clean up file handles

## OX Board Development Commands

### Build & Development

```bash
npm run dev          # Start development server on localhost:3000
npm run build        # Build production bundle
npm start            # Run production server
```

### Testing

```bash
npm test                                    # Run all tests
npm run test:watch                          # Run tests in watch mode
npm run test:coverage                       # Generate coverage report
npm test -- --testNamePattern="test name"   # Run specific test by name
npm test -- path/to/test.spec.tsx           # Run specific test file
```

### Code Quality

```bash
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting issues
npm run type-check   # TypeScript type checking
npm run format       # Format code with Prettier
npm run format:check # Check formatting
```

## Project Architecture

### Core Architecture Layers

```
┌─────────────────────────────────────────┐
│          UI Components Layer            │
│  (React Components + Error Boundaries)  │
├─────────────────────────────────────────┤
│         State Management Layer          │
│    (Zustand Store with DJ Actions)     │
├─────────────────────────────────────────┤
│          Services Layer                 │
│  (AudioService, DeckManager, Workers)   │
├─────────────────────────────────────────┤
│      Audio Processing Libraries         │
│   (Tone.js, Essentia, Custom DSP)      │
├─────────────────────────────────────────┤
│      Gesture Recognition Layer          │
│    (MediaPipe + Kalman Filtering)      │
└─────────────────────────────────────────┘
```

### Key Design Patterns

- **Singleton Services**: AudioService and DeckManager ensure single audio context
- **Event-Driven Architecture**: DeckManager extends EventEmitter for loose coupling
- **Worker-Based Processing**: Music analysis runs in Web Workers to prevent blocking
- **Multi-Level Error Boundaries**: DJErrorBoundary, AudioErrorBoundary, CameraErrorBoundary
- **Dynamic Imports**: Heavy components loaded on-demand, SSR disabled for audio/WebGL

### Data Flow

```
User Input → Gesture/UI → Store Actions → Services → Audio Output
     ↑                          ↓
     └──── State Updates ←──────┘
```

## Technical Considerations

### Audio Initialization

- Must be triggered by user interaction (browser autoplay policy)
- Async deck initialization separate from construction
- Handle permission denials gracefully

### Gesture Processing Pipeline

1. Raw landmarks from MediaPipe
2. Kalman filtering for smoothing
3. Gesture recognition and mapping
4. Throttled updates (60 FPS target)

### Performance Targets

- **Gesture Latency**: <50ms
- **Audio Latency**: <20ms
- **Frame Rate**: 60fps
- **Test Coverage**: 80% minimum

### Path Aliases

Use these TypeScript path aliases:

- `@/components/*` → `app/components/*`
- `@/lib/*` → `app/lib/*`
- `@/stores/*` → `app/stores/*`
- `@/hooks/*` → `app/hooks/*`
- `@/services/*` → `app/services/*`

## Key Services

### AudioService (Singleton)

- Manages Web Audio context lifecycle
- Factory methods for audio nodes
- Performance monitoring
- Master routing graph

### DeckManager (Singleton)

- Dual deck architecture (A/B)
- Crossfading and beat sync
- Recording functionality
- Event emission for UI updates

### MusicAnalyzerClient

- Web Worker interface for analysis
- BPM, key detection, spectral analysis
- Analysis queue management
- Harmonic compatibility checks

### EnhancedDJStore

- Central state management (Zustand)
- 4 decks with analysis data
- Gesture mapping to controls
- AI mixing suggestions

## Extension Points

### Adding New Audio Effects

1. Implement in `app/lib/audio/stemEffects.ts`
2. Register in effect chain config
3. Map to gesture controls in store

### Adding New Gestures

1. Extend recognition in `app/hooks/useGestures.ts`
2. Add smoothing configuration
3. Map to control type in store

### Music Analysis Features

- Use `MusicAnalyzerClient` for async analysis
- Results include BPM, key, energy, spectral features
- Automatic Camelot wheel harmonic suggestions

## Critical Dependencies

- **Tone.js**: Core audio engine (version locked for stability)
- **MediaPipe**: Gesture recognition (CDN loaded)
- **Essentia.js**: Music analysis (WASM-based)
- **Next.js 15**: Framework with App Router
- **TypeScript**: Strict mode enabled
- **React 18**: With concurrent features

## Testing Guidelines

- Jest with React Testing Library
- 80% coverage thresholds (branches, functions, lines, statements)
- Test files in `tests/` directory
- Mock Tone.js with `tests/__mocks__/toneMock.ts`
- Verbose output for debugging

## Important Development Notes

### Browser Environment Requirements

- **Client-side only**: Audio and gesture features require browser APIs
- **SSR Disabled**: Components using Web Audio, MediaPipe, or Three.js must use dynamic imports with `ssr: false`
- **User Gesture Required**: Audio initialization must be triggered by user interaction (browser autoplay policy)

### Async Initialization Pattern

Many services use async initialization separate from construction:

```typescript
// AudioService and DeckManager
const service = getAudioService();
await service.initialize(); // Separate async step

const deckManager = getDeckManager();
await deckManager.initializeDecks(); // Must wait for AudioService first
```

### State Management with Zustand

- `enhancedDjStoreWithGestures.ts` is the main store
- 4 deck architecture (0-3)
- Gesture controls integrated with stem controls
- Mixer state synchronized with audio services

### Web Workers

- `musicAnalyzer.worker.ts`: BPM, key detection, spectral analysis
- `audioAnalyzer.worker.ts`: Heavy audio processing
- Uses Essentia.js (WASM-based) for music analysis
- Fallback implementations when workers fail

### Error Boundaries

Multi-level error handling:

- `DJErrorBoundary`: Top-level DJ mode errors
- `AudioErrorBoundary`: Audio-specific errors
- `CameraErrorBoundary`: Gesture/camera errors

### Performance Considerations

- Gesture processing throttled to 60 FPS
- Buffer pooling for memory efficiency
- Web Audio latency target: <20ms
- Kalman filtering for gesture smoothing

## Common Pitfalls

- **Don't initialize audio in SSR**: Always check `typeof window !== 'undefined'`
- **Don't access audio context before user gesture**: Will fail due to autoplay policy
- **Don't forget to dispose audio nodes**: Memory leaks from undisposed Tone.js nodes
- **Don't skip deck initialization**: DeckManager requires explicit `initializeDecks()` call
- **Don't assume workers load**: Always provide fallback when Web Workers fail

## Development Workflow

1. Start dev server: `npm run dev`
2. For audio features, click UI to trigger audio initialization
3. Grant camera permissions for gesture control
4. Use browser DevTools for Web Audio debugging (chrome://webaudio-internals)
5. Check Service Worker in DevTools → Application → Service Workers

# important-instruction-reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.
