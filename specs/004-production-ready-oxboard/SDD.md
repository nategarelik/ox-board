# Solution Design Document (SDD)

## OX Board - Production-Ready Implementation

**Version**: 1.0.0
**Date**: 2025-09-30
**Status**: Ready for Implementation
**Methodology**: The Agentic Startup - Spec-Driven Development

---

## Executive Summary

This document defines HOW we will build the production-ready OX Board application by:

1. **Cleaning up** competing implementations and dead code (~10,000 lines removed)
2. **Merging** the best features into a single stable architecture
3. **Integrating** all systems (gesture, audio, PWA, backend) into one cohesive application
4. **Deploying** a production-ready system with validated infrastructure

**Key Principle**: **Best-of-breed integration** - keep only what's proven stable, merge features intelligently, delete everything else.

---

## 1. Current State Analysis

### 1.1 What We Have (Assets)

**Working Systems** ✅:

- Gesture recognition (recognition.ts) - 994 lines, production-tested
- Audio playback engine (stemPlaybackEngine.ts) - 390 lines, AudioWorklet-based
- Demucs backend - Complete Python API, 35 files, validated on 3 platforms
- Offline infrastructure - Complete PWA system, 3,000+ lines
- Two player implementations with complementary features

**Dead Code** 💀:

- optimizedStemProcessor.ts - 974 lines, 0 imports
- optimizedRecognition.ts - 657 lines, 0 imports
- enhancedStemPlayerStore.ts - 1,064 lines, unused
- SimpleStemPlayer.tsx - 209 lines, test artifact
- app/stores/slices/ - 4 files, orphaned
- 13+ optimization library files, mostly unused

**Unclear/Needs Audit** ⚠️:

- 15+ DJ components (~3,500 lines)
- stemProcessor.ts (919 lines, has tests but not integrated)

### 1.2 The Core Problem

We have **competing implementations** from different iteration cycles:

**Player Implementations**:

- StemPlayerDashboard (221 lines) - Business features, stable, production
- EnhancedStemPlayerDashboard (504 lines) - Technical features, no audio connected

**Audio Processors**:

- stemPlaybackEngine.ts (390 lines) - Working, stable
- stemProcessor.ts (919 lines) - Feature-rich but unused
- optimizedStemProcessor.ts (974 lines) - Dead experimental code

**Gesture Systems**:

- recognition.ts (994 lines) - Working, stable
- optimizedRecognition.ts (657 lines) - Dead experimental code

**State Management**:

- stemPlayerStore.ts (260 lines) - Used by current player
- enhancedDjStoreWithGestures.ts (1,159 lines) - Used by DJ features
- enhancedStemPlayerStore.ts (1,064 lines) - Completely unused

---

## 2. Solution Architecture

### 2.1 Unified Architecture Vision

```
┌─────────────────────────────────────────────────────────────┐
│                     HYBRID PLAYER UI                        │
│  (StemPlayerDashboard + Best Features from Enhanced)       │
│                                                             │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────────┐   │
│  │   Mixer     │ │   Gesture    │ │   3D Visualizer  │   │
│  │   Panel     │ │   Visualizer │ │   (Optional)     │   │
│  └─────────────┘ └──────────────┘ └──────────────────┘   │
│                                                             │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────────┐   │
│  │   Upload    │ │   AI Panel   │ │   Performance    │   │
│  │  Interface  │ │              │ │   Monitor (Debug)│   │
│  └─────────────┘ └──────────────┘ └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    STATE MANAGEMENT                         │
│                                                             │
│  ┌──────────────────────────┐  ┌─────────────────────────┐│
│  │   stemPlayerStore        │  │ enhancedDjStoreWith     ││
│  │   (Basic Playback)       │  │ Gestures (DJ Features)  ││
│  └──────────────────────────┘  └─────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    CORE SYSTEMS                             │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │   Gesture    │  │    Audio     │  │   Offline/PWA    │ │
│  │  Recognition │  │   Playback   │  │    System        │ │
│  │              │  │    Engine    │  │                  │ │
│  │ recognition. │  │ stemPlayback │  │ offlineManager   │ │
│  │    ts        │  │  Engine.ts   │  │ stemCache        │ │
│  └──────────────┘  └──────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API                              │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │   Demucs     │  │   Celery     │  │     Redis        │ │
│  │  Separation  │  │  Job Queue   │  │   Job Store      │ │
│  └──────────────┘  └──────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Core Architectural Decisions

**Decision 1: Player Architecture → HYBRID**

**Rationale**:

- StemPlayerDashboard has working audio + business features
- EnhancedStemPlayerDashboard has advanced UI but no audio
- Solution: Port best UI features to current stable player

**Implementation**:

```
Keep: StemPlayerDashboard.tsx (base)
Port: AudioUploadInterface.tsx (better UX)
Port: GestureVisualization.tsx (visual feedback)
Port: Stem3DVisualizer.tsx (optional feature)
Port: PerformanceMonitorUI.tsx (debug mode)
Delete: EnhancedStemPlayerDashboard.tsx
Delete: SimpleStemPlayer.tsx
```

---

**Decision 2: Audio Processing → KEEP ACTIVE ENGINE ONLY**

**Rationale**:

- stemPlaybackEngine.ts is working, tested, stable
- stemProcessor.ts has features but no integration (analysis, caching)
- optimizedStemProcessor.ts is incomplete dead code
- If we need analysis later, we can integrate it then

**Implementation**:

```
Keep: stemPlaybackEngine.ts (390 lines)
Delete: stemProcessor.ts (919 lines)
Delete: optimizedStemProcessor.ts (974 lines)
Delete: tests/unit/lib/audio/stemProcessor.test.ts
```

**Future Path**: If audio analysis needed, integrate Essentia.js or Web Audio Analyzer API into stemPlaybackEngine

---

**Decision 3: Gesture Recognition → KEEP PRODUCTION VERSION**

**Rationale**:

- recognition.ts is working, tested, integrated
- optimizedRecognition.ts is experimental and unproven

**Implementation**:

```
Keep: recognition.ts (994 lines)
Delete: optimizedRecognition.ts (657 lines)
```

---

**Decision 4: State Management → KEEP BOTH STORES**

**Rationale**:

- stemPlayerStore and enhancedDjStoreWithGestures serve different purposes
- enhancedStemPlayerStore is completely unused

**Implementation**:

```
Keep: stemPlayerStore.ts (basic playback state)
Keep: enhancedDjStoreWithGestures.ts (DJ features)
Delete: enhancedStemPlayerStore.ts (1,064 lines)
Delete: app/stores/slices/ (4 files, orphaned)
```

---

**Decision 5: DJ Components → MINIMAL MODE**

**Rationale**:

- Only WelcomeScreen.tsx actively used
- Most professional components are unreachable
- Need audit to confirm which are truly dead

**Implementation**:

```
Phase 1 (Immediate):
  Keep: WelcomeScreen.tsx
  Delete: ProfessionalDJInterface.tsx
  Delete: ImmersiveGestureInterface.tsx
  Delete: EffectsRack.tsx

Phase 2 (After Audit):
  Audit: Grep all remaining DJ components
  Delete: Confirmed unreachable components
  Keep: Only components with active import paths
```

---

**Decision 6: Offline/PWA → INTEGRATE**

**Rationale**:

- Complete infrastructure already built
- Critical for PWA installability
- User requested to keep

**Implementation**:

```
Keep: All offline infrastructure
Integrate into: StemPlayerDashboard
  - Add offline indicators
  - Register service worker
  - Add PWA install prompt
  - Connect stem caching
```

---

### 2.3 Component Integration Strategy

#### Phase 1: UI Component Ports

**Port AudioUploadInterface → Integrate into StemPlayerDashboard**

Current (StemUploadPanel):

- Simple file input
- Basic progress bar
- Limited UX

Enhanced (AudioUploadInterface):

- Drag-and-drop
- YouTube URL support
- Modal with better UX
- Upload progress visualization

**Integration Approach**:

1. Replace `<StemUploadPanel />` with `<AudioUploadInterface />`
2. Connect to Demucs backend API
3. Wire up progress tracking
4. Test upload flow end-to-end

---

**Port GestureVisualization → Add as Optional Panel**

**Integration Approach**:

1. Add toggle button in header: "Show Gesture Viz"
2. Render `<GestureVisualization />` in sidebar when toggled
3. Connect to existing `useGestures()` hook
4. Test gesture feedback loop

---

**Port Stem3DVisualizer → Add as Optional Feature**

**Integration Approach**:

1. Add toggle in settings/header: "3D Visualizer"
2. Lazy load component (performance)
3. Connect to audio analysis data (if available)
4. Make optional due to WebGL performance impact

---

**Port PerformanceMonitorUI → Debug Mode Only**

**Integration Approach**:

1. Add hidden keyboard shortcut (Ctrl+Shift+P)
2. Render at bottom when activated
3. Connect to existing performanceMonitor
4. Show FPS, latency, memory metrics

---

#### Phase 2: Offline Integration

**Integrate Offline System into Main Player**

```tsx
// In StemPlayerDashboard.tsx

import { offlineManager } from "../../lib/offline/offlineManager";
import { OfflineIndicator } from "../offline";

// Add to UI
<Header>
  {/* Existing header content */}
  <OfflineIndicator />
</Header>;

// Use offline manager
const { isOnline, capabilities } = offlineManager.getState();

// Adjust UI based on online state
if (!capabilities.canUploadStems) {
  // Disable upload button or show offline message
}
```

**Register Service Worker**:

```tsx
// In app/layout.tsx
useEffect(() => {
  if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => console.log("SW registered:", reg))
      .catch((err) => console.error("SW registration failed:", err));
  }
}, []);
```

**PWA Install Prompt**:

```tsx
// In StemPlayerDashboard.tsx
const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

useEffect(() => {
  const handler = (e: any) => {
    e.preventDefault();
    setDeferredPrompt(e);
  };
  window.addEventListener("beforeinstallprompt", handler);
  return () => window.removeEventListener("beforeinstallprompt", handler);
}, []);

// Show install button when prompt available
{
  deferredPrompt && (
    <button onClick={() => deferredPrompt.prompt()}>Install App</button>
  );
}
```

---

### 2.4 Data Flow Architecture

#### Gesture → Audio Control Flow

```
User Hand Movement
    ↓
MediaPipe Hands Detection (60 FPS)
    ↓
Kalman Filtering (smoothing.ts)
    ↓
Gesture Recognition (recognition.ts)
    ↓
useGestures Hook
    ↓
Gesture-Stem Mapper (gestureStemMapper.ts)
    ↓
enhancedDjStoreWithGestures (state update)
    ↓
useStemPlayback Hook (observes state)
    ↓
stemPlaybackEngine.ts (AudioWorklet)
    ↓
Audio Output (<50ms total latency)
```

#### Upload → Stem Separation → Playback Flow

```
User Uploads File/URL
    ↓
AudioUploadInterface Component
    ↓
POST /api/v1/stemify (Next.js API route)
    ↓
Backend FastAPI /api/v1/stemify
    ↓
Celery Job Queue (Redis)
    ↓
Demucs Worker (stem separation)
    ↓
Job Status Updates (polling)
    ↓
Stems Available (download URLs)
    ↓
Cache in IndexedDB (stemCache)
    ↓
Load into stemPlaybackEngine
    ↓
Ready for Playback
```

#### Offline Sync Flow

```
User Action (while offline)
    ↓
offlineSync.queueAction()
    ↓
IndexedDB Queue Storage
    ↓
[User goes online]
    ↓
'online' event detected
    ↓
offlineSync.syncPendingActions()
    ↓
Process queued actions
    ↓
Update UI with sync status
```

---

## 3. Technical Design

### 3.1 File Structure (After Cleanup)

```
ox-board/
├── app/
│   ├── components/
│   │   ├── ClientApp.tsx                          # Main entry point
│   │   ├── DJ/
│   │   │   └── WelcomeScreen.tsx                 # Landing screen (KEEP)
│   │   ├── stem-player/
│   │   │   ├── StemPlayerDashboard.tsx           # MAIN PLAYER (enhanced)
│   │   │   ├── StemMixerPanel.tsx                # Mixer controls
│   │   │   ├── AudioUploadInterface.tsx          # Upload UI (ported)
│   │   │   ├── Stem3DVisualizer.tsx              # 3D viz (optional)
│   │   │   ├── AIGenerationPanel.tsx             # AI features
│   │   │   ├── RecommendationPanel.tsx           # Recommendations
│   │   │   ├── SubscriptionPlans.tsx             # Monetization
│   │   │   └── UsageMetrics.tsx                  # Analytics
│   │   ├── GestureVisualization.tsx              # Gesture viz (ported)
│   │   ├── PerformanceMonitorUI.tsx              # Debug mode (ported)
│   │   └── offline/
│   │       ├── OfflineIndicator.tsx              # Online/offline badge
│   │       ├── OfflineModeWarning.tsx            # Warning banner
│   │       ├── SyncStatus.tsx                    # Sync progress
│   │       └── CacheManager.tsx                  # Cache UI
│   ├── hooks/
│   │   ├── usePlayer.ts                          # Player state hook
│   │   ├── useStemPlayback.ts                    # Audio playback hook
│   │   └── useGestures.ts                        # Gesture recognition hook
│   ├── lib/
│   │   ├── audio/
│   │   │   ├── stemPlaybackEngine.ts             # KEEP (audio engine)
│   │   │   ├── stemEffects.ts                    # Effects library
│   │   │   └── enhancedMixer.ts                  # Mixing utilities
│   │   ├── gesture/
│   │   │   ├── recognition.ts                    # KEEP (gesture system)
│   │   │   └── smoothing.ts                      # Kalman filtering
│   │   ├── gestures/
│   │   │   └── gestureStemMapper.ts              # Gesture → audio mapping
│   │   ├── offline/
│   │   │   └── offlineManager.ts                 # Offline state
│   │   ├── sync/
│   │   │   └── offlineSync.ts                    # Sync queue
│   │   ├── cache/
│   │   │   └── smartCache.ts                     # Predictive caching
│   │   ├── storage/
│   │   │   ├── stemCache.ts                      # IndexedDB cache
│   │   │   └── enhancedStorage.ts                # Storage utilities
│   │   └── optimization/
│   │       ├── performanceMonitor.ts             # KEEP (used)
│   │       └── memoryOptimizer.ts                # KEEP (used)
│   ├── stores/
│   │   ├── stemPlayerStore.ts                    # KEEP (basic state)
│   │   └── enhancedDjStoreWithGestures.ts        # KEEP (DJ state)
│   ├── services/
│   │   ├── AudioService.ts                       # Audio utilities
│   │   ├── aiStemService.ts                      # AI features
│   │   └── recommendationService.ts              # Recommendations
│   └── api/
│       ├── stemify/route.ts                      # Proxy to backend
│       └── jobs/[id]/route.ts                    # Job status
├── backend/                                       # KEEP ALL (working)
│   ├── api/
│   ├── core/
│   ├── models/
│   ├── services/
│   ├── utils/
│   ├── main.py
│   ├── worker.py
│   └── requirements.txt
├── public/
│   ├── manifest.json                              # PWA manifest
│   ├── sw.js                                      # Service worker
│   └── worklets/
│       └── stem-processor.js                      # AudioWorklet code
└── tests/
    └── unit/
        ├── lib/
        │   ├── audio/
        │   ├── gesture/
        │   └── gestures/
        └── components/
```

### 3.2 Deleted Files (After Cleanup)

```
DELETE:
├── app/components/
│   ├── SimpleStemPlayer.tsx                      # 209 lines
│   ├── stem-player/
│   │   └── EnhancedStemPlayerDashboard.tsx       # 504 lines
│   └── DJ/
│       ├── ProfessionalDJInterface.tsx           # ~400 lines
│       ├── ImmersiveGestureInterface.tsx         # ~400 lines
│       └── EffectsRack.tsx                       # ~300 lines
├── app/lib/
│   ├── audio/
│   │   ├── stemProcessor.ts                      # 919 lines
│   │   └── optimizedStemProcessor.ts             # 974 lines
│   ├── gesture/
│   │   └── optimizedRecognition.ts               # 657 lines
│   └── optimization/
│       ├── bufferPool.ts                         # ~400 lines
│       ├── lruCache.ts                           # ~400 lines
│       └── (10+ more unused files)               # ~5,000 lines
├── app/stores/
│   ├── enhancedStemPlayerStore.ts                # 1,064 lines
│   └── slices/                                   # 4 files, ~2,000 lines
├── tests/unit/lib/audio/
│   └── stemProcessor.test.ts                     # 586 lines
└── CLEANUP-SUMMARY.md                            # Old doc
    CLEANUP-OPPORTUNITIES.md                       # Old doc
    SESSION_LOG.md                                 # Old session notes

TOTAL DELETION: ~10,000-12,000 lines
```

---

## 4. Implementation Phases

### Phase 1: Cleanup & Preparation (1-2 hours)

**Objective**: Remove dead code, establish clean baseline

**Tasks**:

1. Delete confirmed dead code:
   - optimizedStemProcessor.ts
   - optimizedRecognition.ts
   - SimpleStemPlayer.tsx
   - enhancedStemPlayerStore.ts
   - app/stores/slices/
2. Delete old documentation:
   - CLEANUP-SUMMARY.md
   - CLEANUP-OPPORTUNITIES.md
   - SESSION_LOG.md
3. Run tests to confirm nothing broke
4. Commit: "chore: remove dead code and old docs"

---

### Phase 2: UI Component Porting (4-6 hours)

**Objective**: Port best features from Enhanced to main player

**Tasks**:

1. Port AudioUploadInterface:
   - Copy component to stem-player/
   - Integrate into StemPlayerDashboard
   - Connect to backend API
   - Test upload flow
2. Port GestureVisualization:
   - Add toggle button
   - Integrate into sidebar
   - Connect to useGestures
   - Test gesture feedback
3. Port Stem3DVisualizer:
   - Add optional toggle
   - Lazy load component
   - Test performance impact
4. Port PerformanceMonitorUI:
   - Add debug mode toggle
   - Connect to performanceMonitor
   - Test metrics display
5. Delete EnhancedStemPlayerDashboard after porting
6. Test all features integrated
7. Commit: "feat: integrate enhanced UI features into main player"

---

### Phase 3: Offline/PWA Integration (3-4 hours)

**Objective**: Make app installable and offline-capable

**Tasks**:

1. Register service worker in layout.tsx
2. Add OfflineIndicator to StemPlayerDashboard
3. Add PWA install prompt
4. Test offline functionality:
   - Service worker caching
   - IndexedDB stem storage
   - Offline playback
5. Test PWA installation on Chrome/Edge
6. Commit: "feat: integrate offline and PWA features"

---

### Phase 4: DJ Component Audit & Cleanup (2-3 hours)

**Objective**: Determine which DJ components are reachable, delete dead ones

**Tasks**:

1. Grep for imports of each DJ component
2. Test if any UI path reaches them
3. Delete confirmed unreachable components
4. Document which DJ features are active
5. Commit: "chore: cleanup unused DJ components"

---

### Phase 5: Integration Testing (3-4 hours)

**Objective**: Ensure all systems work together

**Tasks**:

1. Test full user journey:
   - Camera permission → gesture recognition
   - Upload file → Demucs processing → playback
   - Gesture control → audio response
   - Offline mode → online sync
2. Test performance:
   - 60 FPS gesture recognition
   - <50ms gesture-to-audio latency
   - No memory leaks in 1-hour session
3. Test PWA:
   - Install prompt appears
   - App installable
   - Works offline after install
4. Cross-browser testing:
   - Chrome (primary)
   - Edge (primary)
   - Safari (secondary)
5. Fix any bugs found
6. Commit: "fix: integration issues"

---

### Phase 6: Production Deployment (2-3 hours)

**Objective**: Deploy to production infrastructure

**Tasks**:

1. Build production bundle:
   - `npm run build`
   - Verify bundle size <500KB initial
2. Test production build locally
3. Deploy backend to Railway/Render:
   - Push Docker image
   - Configure environment variables
   - Test API endpoints
4. Deploy frontend to Vercel/Netlify:
   - Connect GitHub repo
   - Configure build settings
   - Test deployed app
5. Smoke test production:
   - Upload and process a track
   - Test gesture control
   - Test PWA install
6. Monitor for errors (Sentry/LogRocket)
7. Commit: "chore: production deployment configuration"

---

### Phase 7: Documentation & Polish (1-2 hours)

**Objective**: Finalize documentation and cleanup

**Tasks**:

1. Update README.md:
   - New architecture diagram
   - Updated feature list
   - Deployment instructions
2. Create USER_GUIDE.md:
   - Getting started
   - Gesture controls
   - Upload workflow
   - Troubleshooting
3. Update API documentation
4. Create CHANGELOG.md for v1.0
5. Organize specs/ directory
6. Commit: "docs: finalize documentation for v1.0"

---

## 5. Quality Assurance Strategy

### 5.1 Testing Approach

**Unit Tests** (Maintain 80%+ coverage):

- Keep existing tests for core systems
- Remove tests for deleted code (stemProcessor.test.ts)
- Add tests for new integrations

**Integration Tests**:

```typescript
// Test: Gesture → Audio Control Flow
it("should control audio volume with pinch gesture", async () => {
  const { result } = renderHook(() => useGestures());
  const { result: audio } = renderHook(() => useStemPlayback(mockTrack));

  // Simulate pinch gesture
  act(() => {
    result.current.simulateGesture("PINCH", 0.5);
  });

  // Verify audio volume changed
  expect(audio.current.getVolume("vocals")).toBe(0.5);
});
```

**E2E Tests** (Playwright):

```typescript
test("full upload and playback flow", async ({ page }) => {
  await page.goto("http://localhost:3000");

  // Upload file
  await page.setInputFiles('input[type="file"]', "test-track.mp3");

  // Wait for processing
  await page.waitForSelector('[data-testid="stems-ready"]', { timeout: 60000 });

  // Test playback
  await page.click('[data-testid="play-button"]');

  // Verify audio playing
  const state = await page
    .locator('[data-testid="playback-state"]')
    .textContent();
  expect(state).toBe("playing");
});
```

### 5.2 Performance Benchmarks

**Before Integration** (Baseline):

- Gesture recognition: 58-62 FPS
- Audio latency: 6-8ms
- Memory usage: 120-150MB
- Bundle size: 380KB initial

**After Integration** (Target):

- Gesture recognition: 58-62 FPS (maintain)
- Audio latency: 6-8ms (maintain)
- Memory usage: <200MB (allow increase for features)
- Bundle size: <500KB initial (allow increase)

**Performance Testing**:

```bash
# Run performance tests
npm run test:performance

# Measure bundle size
npm run build:analyze

# Profile memory usage
npm run test:memory-leak
```

---

## 6. Rollback Strategy

### 6.1 Rollback Triggers

**Automatic Rollback If**:

- Error rate >5% for 5 minutes
- Critical feature broken (audio playback, gesture control)
- P0 security vulnerability discovered

**Manual Rollback If**:

- User reports severe usability issues
- Performance degradation >50%
- Data loss incidents

### 6.2 Rollback Procedure

1. **Git Revert**:

   ```bash
   git revert <commit-hash>
   git push origin main --force-with-lease
   ```

2. **Re-deploy Previous Version**:

   ```bash
   # Backend
   cd backend && git checkout <previous-tag> && railway up

   # Frontend
   vercel --prod --force
   ```

3. **Verify Rollback**:
   - Test critical flows
   - Monitor error rates
   - Notify users of temporary rollback

4. **Post-Mortem**:
   - Analyze what went wrong
   - Create fix in separate branch
   - Test thoroughly before re-deploy

---

## 7. Success Metrics

### 7.1 Technical Metrics

**Before Cleanup**:

- Total lines: ~67,000
- Components: 80+
- Stores: 3 (1 unused)
- Audio processors: 3 (2 unused)

**After Cleanup**:

- Total lines: ~55,000 (18% reduction)
- Components: 60-65 (focused)
- Stores: 2 (both used)
- Audio processors: 1 (production-ready)

**Integration Success**:

- [ ] All ported features work
- [ ] No regressions in existing features
- [ ] Performance targets met
- [ ] Test coverage maintained >80%

### 7.2 User Experience Metrics

**Time to Interactive**:

- Target: <3 seconds
- Measure: Lighthouse CI

**Gesture Latency**:

- Target: <50ms (gesture → audio response)
- Measure: Performance monitor

**Upload Success Rate**:

- Target: >95%
- Measure: Backend analytics

**Session Duration**:

- Target: >5 minutes (median)
- Measure: Frontend analytics

---

## 8. Open Technical Questions

### Q1: Audio Analysis Integration

**Question**: Do we need audio analysis (BPM, key detection) in v1.0?

**Options**:

- A. No - Focus on stable playback, add later if needed
- B. Yes - Integrate Essentia.js for lightweight analysis
- C. Maybe - Port from stemProcessor.ts if time allows

**Recommendation**: Option A (defer to v1.1)

---

### Q2: 3D Visualizer Performance

**Question**: Is 3D visualizer performance acceptable on mid-range devices?

**Options**:

- A. Make optional (user toggle)
- B. Progressive enhancement (detect GPU, auto-enable)
- C. Remove if too heavy

**Recommendation**: Option B (smart auto-enable)

---

### Q3: DJ Component Future

**Question**: Do we want full Professional DJ mode in v1.0?

**Options**:

- A. No - Remove all unused DJ components
- B. Maybe - Keep infrastructure, hide UI
- C. Yes - Audit and integrate DJ features

**Recommendation**: Option A (remove unused, keep WelcomeScreen only)

---

## 9. Risk Management

### 9.1 Technical Risks

| Risk                                          | Mitigation                                      |
| --------------------------------------------- | ----------------------------------------------- |
| Feature porting breaks existing functionality | Incremental integration with tests at each step |
| Performance degradation from new features     | Performance benchmarks before/after each phase  |
| Offline sync conflicts                        | Conflict resolution strategy in offlineSync     |
| Memory leaks from 3D visualizer               | Proper cleanup in useEffect, testing            |
| Bundle size bloat                             | Lazy loading, code splitting, tree shaking      |

### 9.2 Schedule Risks

| Risk                                    | Mitigation                                                  |
| --------------------------------------- | ----------------------------------------------------------- |
| Integration takes longer than estimated | Parallel execution where possible, prioritize core features |
| Unexpected bugs in integration          | Buffer time in schedule, staged rollout                     |
| Testing reveals major issues            | Regression testing at each phase, quick fixes               |

---

## 10. Deployment Architecture

### 10.1 Frontend Deployment

**Platform**: Vercel (recommended) or Netlify

**Configuration**:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_BACKEND_URL": "https://api.oxboard.app"
  }
}
```

**CDN**: Vercel Edge Network (automatic)

**Monitoring**: Vercel Analytics + Sentry

---

### 10.2 Backend Deployment

**Platform**: Railway (recommended) or Render

**Services**:

1. **Web Service** (FastAPI):
   - Port: 8000
   - Health check: /health
   - Auto-deploy: main branch

2. **Worker Service** (Celery):
   - Processes stem separation jobs
   - Connects to Redis

3. **Redis**:
   - Managed Redis instance
   - 256MB minimum

**Configuration**:

```toml
# railway.toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "backend/Dockerfile"

[deploy]
startCommand = "uvicorn main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
```

---

### 10.3 Monitoring & Observability

**Frontend**:

- Vercel Analytics (Core Web Vitals)
- Sentry (error tracking)
- LogRocket (session replay) - optional

**Backend**:

- Railway Metrics (CPU, memory, requests)
- Sentry Python SDK (error tracking)
- Custom metrics (job success rate, processing time)

**Alerts**:

- Error rate >5% for 5 minutes
- P95 latency >1000ms
- Memory usage >80%
- Disk usage >80%

---

## Conclusion

This solution design provides a clear path to:

1. **Clean up** ~10,000 lines of dead code
2. **Merge** best features into stable architecture
3. **Integrate** all systems into cohesive application
4. **Deploy** production-ready system

**Estimated Timeline**: 16-24 hours of focused work across 7 phases

**Next Step**: Create detailed Implementation Plan (PLAN.md) with task breakdown for parallel execution

---

**Document Status**: ✅ Complete and Ready for Implementation Plan

**Next Document**: PLAN.md (Implementation Plan with parallel task breakdown)
