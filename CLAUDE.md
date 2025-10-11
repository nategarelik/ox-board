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

---

## 🎯 CURRENT PROJECT STATUS & EXECUTION PLAN

**Last Updated**: 2025-10-10 (git commit: 583b76b)
**Version**: v0.9.0-pre-mvp
**Test Status**: 337/465 passing (72.5%)

### ✅ COMPLETED: Track A - Audio Integration

**Git Commit**: `583b76b` - "feat: integrate DeckManager audio with Terminal UI"

**Files Created**:

- `app/hooks/useDeckManager.ts` (607 lines) - Production-ready React hook
- `app/types/deckManager.ts` - TypeScript types
- `docs/AUDIO-INTEGRATION-CODE-GENERATION-SUMMARY.md`
- `docs/TERMINAL-AUDIO-INTEGRATION-EXAMPLE.md`
- `docs/USEDECK MANAGER-QUICK-REFERENCE.md`

**Files Modified**:

- `app/components/terminal/TerminalStudio.tsx` (242 lines changed)

**Features Now Working**:

1. Dual-Deck System: Deck A + Deck B with independent controls
2. Transport Controls: Play/Pause buttons connected to real audio
3. Volume Control: Per-deck volume sliders functional
4. Crossfader: Mix between decks with real audio mixing
5. Master Volume: Global volume control
6. Initialization: User gesture-triggered audio start
7. State Sync: Real-time UI updates from audio engine via events
8. Error Handling: Comprehensive error messages and recovery

**Build Status**: ✅ All checks passing (type-check, lint, build)

---

### ✅ COMPLETED: Track B - File Loading (commit: e39ab7a)

**Git Commit**: `e39ab7a` - "feat: add file loading with drag-and-drop upload"

**Files Created**:

- `app/lib/audio/audioFileLoader.ts` (318 lines) - Complete file loading + BPM
- `app/components/terminal/FileUploader.tsx` (370+ lines) - Drag-drop UI

**Files Modified**:

- `app/components/terminal/TerminalMusicLibrary.tsx` - Upload integration

**Features Implemented**:

1. Drag-and-drop audio file upload (MP3, WAV, FLAC, M4A, OGG)
2. Real-time BPM detection (web-audio-beat-detector)
3. Metadata extraction (music-metadata library)
4. Progress tracking with terminal aesthetic
5. Auto-load into Deck A after upload
6. File validation (size 100MB max, type, format)

**Build Status**: ✅ All checks passing (type-check, build 23s)

---

### 🎯 IN PROGRESS: Track C - EQ-Based Frequency Control

**Current State**: Starting minimal implementation (NO QUALITY GATE STOPS)

**Note**: Full per-stem control requires backend stem separation (Track F/G/H).
For Track C, implementing EQ-based frequency control (Low/Mid/High) as interim solution.

**Files to Modify**:

- `app/hooks/useDeckManager.ts` - Add setDeckEQ() method
- `app/types/deckManager.ts` - Add EQ to ReactDeckState
- `app/components/terminal/TerminalStudio.tsx` - Add EQ sliders

**Implementation**: Use Deck.setEQ() for Bass/Mids/Treble control

**Next**: After Track C, update CLAUDE.md phase status, continue Phase 1

---

### Current State Summary

#### ✅ What's Working NOW

**Infrastructure:**

- Terminal UI with CRT aesthetic (`app/components/terminal/`)
- **NEWLY CONNECTED: Terminal UI → DeckManager audio** (Track A complete)
- Backend exists: FastAPI + Demucs + Celery + Redis (`backend/`)
- Audio playback engine production-ready
- Gesture recognition with MediaPipe
- 87 TypeScript files, comprehensive architecture
- Comprehensive documentation in `docs/` and `specs/`

**Audio Integration** (NEW):

- `useDeckManager` hook for React integration
- Event-driven state synchronization
- Dual-deck mixing with crossfader
- Master volume control
- User gesture initialization handling

#### ❌ Critical Gaps (Remaining)

**BLOCKING ISSUES:**

1. ~~Terminal UI NOT connected to real audio~~ ✅ **FIXED (Track A)**

2. **File loading not implemented** - Users cannot load their own audio
   - No drag-and-drop file upload
   - No Web Audio file parsing
   - No metadata extraction

3. **Backend NOT integrated** - FastAPI backend exists but frontend has no API client
   - No API calls from frontend to backend
   - Upload functionality not connected to backend
   - Stem separation feature completely mocked

4. **Mock implementations everywhere**:
   - `app/lib/audio/stemAnalyzer.ts` - All analysis functions return mock data
   - `app/lib/data/defaultTrack.ts` - createMockWaveform() used everywhere
   - `app/lib/cache/smartCache.ts` - generateMockStemData()
   - Real audio analysis not implemented

5. **Test failures**: 127 tests failing (72.5% pass rate)
   - 100+ Essentia.js mock issues (P2 priority)
   - 43 FeedbackDelay constructor missing (P1, 30min fix)
   - 24 GestureFeedback infinite render loop (P1)
   - Core audio tests pass 100%

### 📋 Optimal Execution Plan

## Phase 1: Connect Terminal UI to Real Audio (2-3 weeks)

**Priority: P0 - CRITICAL**

### Week 1: Wire Terminal UI to Audio Engine

**Task 1.1: TerminalStudio Audio Integration**

- Location: `app/components/terminal/TerminalStudio.tsx`
- Connect deck controls to `stemPlaybackEngine`
- Wire transport buttons (play/pause/skip) to `DeckManager`
- Connect volume sliders to real audio volume control
- Connect crossfader to audio mixing
- **Output**: Working dual-deck DJ interface with real audio

**Task 1.2: Real Track Loading**

- Replace `defaultTrack` mock with actual audio file loading
- Implement drag-and-drop file upload in Terminal Music Library
- Add audio metadata extraction (duration, BPM, key)
- Use Web Audio API for file parsing
- **Output**: Users can load their own audio files

**Task 1.3: Stem Control Integration**

- Connect stem volume sliders to `stemPlaybackEngine`
- Wire mute/solo buttons per stem
- Add real-time audio response to gestures
- Test latency (<20ms target)
- **Output**: Individual stem control working

**Files to modify:**

- `app/components/terminal/TerminalStudio.tsx` - Add audio integration
- `app/components/terminal/TerminalMusicLibrary.tsx` - Add file upload
- `app/hooks/useStemPlayback.ts` - May need updates
- `app/services/AudioService.ts` - Verify integration points

### Week 2: Fix Test Suite & Core Issues

**Task 2.1: Fix Test Failures**

- Fix `tests/unit/components/GestureFeedback.test.tsx` infinite render loop
- Fix 10 other failing tests
- Review test structure for all failures
- Achieve 90%+ test pass rate (45+ tests passing)
- **Output**: Stable test suite

**Task 2.2: Remove Mock Data Phase 1**

- Replace mock waveforms with real Web Audio Analyzer data
- Remove mock track data, use real audio analysis
- Implement real-time waveform extraction
- **Output**: Visual feedback matches actual audio

**Files to modify:**

- `app/lib/data/defaultTrack.ts` - Remove createMockWaveform
- `app/lib/audio/stemAnalyzer.ts` - Remove mock implementations
- Add real waveform analyzer utility
- All test files with failures

---

## Phase 2: Backend Integration (2-3 weeks)

**Priority: P0 - CRITICAL**

### Week 3: Deploy Backend

**Task 3.1: Railway/Render Deployment**

- Deploy FastAPI backend to Railway (GPU-enabled) or Render
- Configure Celery workers + Redis
- Test Demucs stem separation end-to-end
- Set up health checks and monitoring
- Configure environment variables
- **Output**: Working backend API at production URL

**Task 3.2: Frontend API Client**

- Create API client module: `app/lib/api/stemifyClient.ts`
- Implement endpoints:
  - `POST /api/v1/stemify` - Upload and process
  - `GET /api/jobs/{jobId}` - Poll job status
  - `GET /api/jobs/{jobId}/stems` - Download results
- Add error handling and retry logic
- Add request/response TypeScript types
- **Output**: Frontend can communicate with backend

**Backend files** (existing):

- `backend/main.py` - FastAPI app
- `backend/worker.py` - Celery worker
- `backend/api/routes/` - API endpoints
- `backend/services/demucs_service.py` - Stem separation

**New frontend files**:

- `app/lib/api/stemifyClient.ts` - API client
- `app/types/api.ts` - API types

### Week 4: Stem Separation Integration

**Task 4.1: Connect Upload to Backend**

- Add upload UI in `TerminalMusicLibrary.tsx`
- Implement file upload with progress tracking
- Add job status polling (every 2s)
- Show processing progress in UI
- Cache separated stems in IndexedDB
- **Output**: Users can upload tracks and get real stem separation

**Task 4.2: Playback Integration**

- Load separated stems from backend into `stemPlaybackEngine`
- Handle stem download and caching
- Test full flow: upload → separate → playback
- Error handling for failed jobs
- **Output**: End-to-end stem separation working

**Files to modify:**

- `app/components/terminal/TerminalMusicLibrary.tsx` - Upload UI
- `app/lib/storage/stemCache.ts` - Store separated stems
- `app/hooks/useStemPlayback.ts` - Load from cache
- `app/lib/api/stemifyClient.ts` - Complete integration

---

## Phase 3: Remove All Mocks & Polish (1-2 weeks)

**Priority: P1 - HIGH**

### Week 5: Real Audio Analysis

**Task 5.1: Implement Real Analysis**

- Integrate Essentia.js for BPM/key detection
- Real-time waveform visualization with Web Audio Analyzer
- Remove all remaining mock implementations
- Add spectral analysis for visualizations
- **Output**: All audio features use real data

**Task 5.2: Gesture-Audio Integration**

- Connect gesture recognition to deck controls
- Test gesture latency (<50ms target)
- Add calibration wizard for personalization
- Fine-tune Kalman filtering parameters
- **Output**: Gesture control fully functional

**Files to modify:**

- `app/lib/audio/musicAnalyzerClient.ts` - Real analysis
- `app/workers/musicAnalyzer.worker.ts` - Essentia integration
- Remove: All `createMockWaveform()` calls
- Remove: All mock data generators

---

## Phase 4: Production Readiness (1 week)

**Priority: P1 - HIGH**

### Week 6: Testing & Deployment

**Task 6.1: Complete Test Coverage**

- Fix all remaining test failures
- Add E2E tests for critical paths:
  - Upload → Separation → Playback
  - Gesture control flow
  - Deck mixing
- Achieve 80%+ coverage
- **Output**: Production-quality test suite

**Task 6.2: Performance & Documentation**

- Performance optimization:
  - Bundle size <500KB initial
  - Time to interactive <3s
  - Gesture latency <50ms
- Update all documentation:
  - README.md - Current state
  - API documentation
  - User guide
- Deployment validation:
  - Test on production URLs
  - Cross-browser testing
  - Performance monitoring
- **Output**: Production-ready application

---

## Success Metrics

### Technical Metrics

- ✅ Terminal UI fully functional with real audio (no mocks)
- ✅ Real stem separation working (Demucs backend)
- ✅ 90%+ test pass rate, 80%+ coverage
- ✅ <50ms gesture latency
- ✅ <20ms audio latency
- ✅ Full upload → separate → playback flow working
- ✅ No mock implementations remaining

### User Experience Metrics

- ✅ Users can load their own audio files
- ✅ Real-time deck mixing with low latency
- ✅ Gesture control responsive and accurate
- ✅ Stem separation completes in <2 min for 3-4 min track
- ✅ Visual feedback (waveforms) matches actual audio

### Performance Targets

- Bundle size: <500KB initial load
- Time to interactive: <3s
- Audio latency: <20ms
- Gesture latency: <50ms
- Frame rate: 60 FPS
- Test coverage: 80%+

---

## Key Files Reference

### Core Audio (Production-Ready)

- `app/lib/audio/stemPlaybackEngine.ts` - Audio engine (390 lines)
- `app/services/AudioService.ts` - Audio context management
- `app/services/DeckManager.ts` - Dual deck system

### Terminal UI (Needs Audio Integration)

- `app/components/terminal/TerminalApp.tsx` - Main app
- `app/components/terminal/TerminalStudio.tsx` - DJ interface (NEEDS WORK)
- `app/components/terminal/TerminalMusicLibrary.tsx` - Track browser (NEEDS UPLOAD)

### Backend (Exists, Not Integrated)

- `backend/main.py` - FastAPI server
- `backend/worker.py` - Celery worker
- `backend/services/demucs_service.py` - Stem separation

### Mock Data (TO BE REMOVED)

- `app/lib/data/defaultTrack.ts` - Mock track data
- `app/lib/audio/stemAnalyzer.ts` - Mock analysis
- `app/lib/cache/smartCache.ts` - Mock stem generation

### Tests (78.4% Passing - Needs Work)

- `tests/unit/components/GestureFeedback.test.tsx` - FAILING (infinite loop)
- 10 other failing tests to investigate

---

## Development Priority Order

1. **[P0] Connect Terminal UI to Audio** (Week 1-2)
   - This unblocks everything else
   - Makes app actually usable for testing

2. **[P0] Deploy & Integrate Backend** (Week 3-4)
   - Real stem separation is the core feature
   - Backend exists, just needs frontend integration

3. **[P1] Remove Mock Data** (Week 5)
   - Replace mocks with real implementations
   - Improves quality significantly

4. **[P1] Fix Tests & Deploy** (Week 6)
   - Production-ready quality
   - Comprehensive testing

---

# important-instruction-reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.
