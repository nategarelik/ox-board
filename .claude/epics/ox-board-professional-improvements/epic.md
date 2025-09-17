---
name: ox-board-professional-improvements
status: backlog
created: 2025-09-17T19:52:55Z
progress: 0%
prd: .claude/prds/ox-board-professional-improvements.md
github: https://github.com/nategarelik/ox-board/issues/23
---

# Epic: ox-board Professional Improvements

## Overview
Transform ox-board from prototype to production-ready DJ platform through focused fixes, architectural improvements, and professional standards implementation. This epic consolidates 22 open GitHub issues into 8 high-impact tasks that maximize value while minimizing complexity.

## Architecture Decisions

### Critical Decisions
1. **Deferred Audio Initialization**: Move AudioContext creation to user-triggered event to comply with browser autoplay policies
2. **Component-Based Architecture**: Extract monolithic page.tsx into focused, reusable components without over-engineering
3. **Progressive Enhancement**: Implement keyboard shortcuts as primary control with gestures as enhancement
4. **Minimal Testing Strategy**: Focus on critical path tests rather than exhaustive coverage initially

### Technology Choices
- **Keep Existing**: Tone.js, MediaPipe, Next.js 14 (all working well)
- **Add Minimal**: Error boundaries, Husky for commits, GitHub Actions for CI
- **Defer Complex**: Docker, Sentry, advanced AI features (post-MVP)

### Design Patterns
- **Service Layer**: Lightweight services for audio/gesture management
- **Error Boundaries**: Wrap critical components for graceful failure
- **Lazy Loading**: Fix existing implementation rather than remove

## Technical Approach

### Frontend Components
**Simplified Component Structure** (from 10+ to essential 5):
1. `DJInterface.tsx` - Main container orchestrating all features
2. `AudioMixer.tsx` - Consolidates mixing, effects, and deck controls
3. `GestureControl.tsx` - Gesture detection and mapping
4. `TrackManager.tsx` - Track loading and playlist management
5. `TutorialOverlay.tsx` - Onboarding and help system

**State Management**:
- Use existing React Context for global state
- Local state for component-specific needs
- No additional state libraries needed

### Backend Services
**Lightweight Service Classes**:
- `AudioService.ts` - Wraps Tone.js with deferred initialization
- `GestureService.ts` - MediaPipe integration (already exists)
- `StorageService.ts` - LocalStorage for settings/presets

**API Integration**:
- Leverage existing YouTube/SoundCloud implementations
- Add simple caching layer for API responses

### Infrastructure
**Simplified Deployment**:
- Continue using Vercel (already configured)
- GitHub Actions for basic CI (lint, build, test)
- Defer Docker/complex monitoring to post-MVP

## Implementation Strategy

### Development Phases
1. **Fix Critical Errors** (Day 1) - Unblock basic functionality
2. **Refactor Architecture** (Day 2) - Clean component structure
3. **Complete Core Features** (Days 3-4) - Close P1/P2 issues
4. **Add Professional Standards** (Day 5) - Testing, CI, conventions
5. **Polish & Deploy** (Day 6) - Performance, documentation, production

### Risk Mitigation
- **Browser Compatibility**: Test in Chrome first, expand later
- **Performance**: Measure and optimize only bottlenecks
- **Gesture Accuracy**: Keyboard shortcuts as primary control

### Testing Approach
- Focus on critical user paths (start session, load track, mix)
- Integration tests for audio/gesture systems
- Defer exhaustive unit testing to post-MVP

## Task Breakdown Preview

High-level tasks that address all 22 GitHub issues efficiently:

- [ ] **Task 1: Fix Critical Browser Errors** - AudioContext, lazy loading, SSR (Issues #22)
- [ ] **Task 2: Refactor Page Architecture** - Extract 5 essential components (Issues #5, #6, #14)
- [ ] **Task 3: Complete Audio System** - Fix initialization, add track loading (Issues #3, #13, #15)
- [ ] **Task 4: Wire Gesture Controls** - Connect gestures to mixer, add keyboard shortcuts (Issues #2, #7, #16, #19)
- [ ] **Task 5: Implement Tutorial System** - Onboarding overlay with gesture calibration (Issues #8, #18)
- [ ] **Task 6: Add BPM & Effects** - Beat sync and audio effects (Issue #17)
- [ ] **Task 7: Setup Development Standards** - Testing, CI/CD, commit conventions (Issues #4, #11)
- [ ] **Task 8: Performance & Accessibility** - Optimize bundle, add a11y features (Issues #9, #10, #20)

## Dependencies

### External Service Dependencies
- MediaPipe CDN (gesture recognition)
- YouTube/SoundCloud APIs (track streaming)
- Vercel (hosting platform)
- GitHub Actions (CI/CD)

### Internal Dependencies
- Existing Tone.js audio implementation
- Current MediaPipe integration
- Existing UI components

### Prerequisite Work
- None - can begin immediately with existing codebase

## Success Criteria (Technical)

### Performance Benchmarks
- Initial load: < 3 seconds
- Gesture latency: < 50ms
- Audio latency: < 20ms
- Bundle size: < 500KB initial

### Quality Gates
- Zero console errors in production
- All 22 GitHub issues closed
- Core user flows tested
- Conventional commits enforced

### Acceptance Criteria
- Browser autoplay policies handled correctly
- Gesture controls work with visual feedback
- Keyboard shortcuts for all primary actions
- Tutorial completes without errors

## Estimated Effort

### Overall Timeline
- **Total Duration**: 6 days (simplified from 7)
- **Daily Commitment**: 6-8 hours focused work
- **Total Hours**: ~40 hours

### Resource Requirements
- Single developer with React/TypeScript experience
- Access to testing devices with webcams
- GitHub repository admin access

### Critical Path Items
1. Day 1: Fix browser errors (blocks everything)
2. Day 2: Refactor architecture (enables parallel work)
3. Days 3-4: Complete features (closes most issues)
4. Day 5: Add standards (ensures quality)
5. Day 6: Polish and deploy (production ready)

## Simplification Notes

### What We're NOT Doing
- Over-engineering with 10+ components when 5 will suffice
- Complex state management libraries
- Exhaustive unit testing for every function
- Docker containerization (Vercel is sufficient)
- Advanced AI features (post-MVP)
- Multi-user collaborative features

### What We're Leveraging
- Existing Tone.js implementation (mostly working)
- Current MediaPipe integration (already functional)
- Vercel's built-in CI/CD capabilities
- Browser's native features where possible
- Existing component library patterns

### Quick Wins
- Fix AudioContext with single button click
- Reuse existing error boundary component
- Keyboard shortcuts using native event listeners
- LocalStorage for simple state persistence
- GitHub Actions templates for CI

## Tasks Created
- [ ] 001.md - Fix Critical Browser Errors (parallel: false)
- [ ] 002.md - Refactor Page Architecture (parallel: false)
- [ ] 003.md - Complete Audio System (parallel: false)
- [ ] 004.md - Wire Gesture Controls (parallel: false)
- [ ] 005.md - Implement Tutorial System (parallel: true)
- [ ] 006.md - Add BPM and Effects (parallel: true)
- [ ] 007.md - Setup Development Standards (parallel: true)
- [ ] 008.md - Performance and Accessibility (parallel: false)

Total tasks: 8
Parallel tasks: 3
Sequential tasks: 5
Estimated total effort: 40 hours