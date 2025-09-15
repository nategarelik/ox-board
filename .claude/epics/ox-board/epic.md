---
name: ox-board
status: backlog
created: 2025-09-14T20:14:00Z
progress: 100%
prd: .claude/prds/ox-board.md
github: https://github.com/nategarelik/ox-board/issues/12
---

# Epic: ox-board

## Overview
Implement a functional MVP DJ platform by extending the existing gesture detection system with actual audio playback, mixing capabilities, and streaming integration. Leverages existing MediaPipe/Tone.js infrastructure to minimize new code while maximizing functionality.

## Architecture Decisions

### Simplified Streaming Approach
- **Decision**: Use youtube-dl-exec and soundcloud-downloader libraries instead of complex APIs
- **Rationale**: Avoids API keys, authentication, and rate limits for MVP
- **Alternative**: Fallback to URL input with manual audio file upload

### Leverage Existing Infrastructure
- **Decision**: Extend current AudioMixer class rather than rewriting
- **Rationale**: Already has 4-channel mixing, EQ, and effects structure
- **Approach**: Add Tone.Player instances to existing channels

### Minimal UI Approach
- **Decision**: Create single unified DJ interface component
- **Rationale**: Faster to implement, easier to maintain
- **Components**: Combine decks, mixer, and effects into one view

### Gesture Mapping Strategy
- **Decision**: Map gestures directly in existing useGestures hook
- **Rationale**: Hook already processes and smooths gesture data
- **Enhancement**: Add gesture-to-control conversion functions

## Technical Approach

### Frontend Components
- **Single DJ Interface**: Unified component containing both decks and mixer
- **Track Loader Modal**: Simple URL input with progress indicator
- **Tutorial Overlay**: Transparent overlay with gesture hints
- **Existing Components**: Reuse CameraFeed, ErrorBoundary unchanged

### Audio Implementation
- **Tone.Player Integration**: Add to existing AudioMixer channels
- **Track Loading**: Simple fetch/blob approach for audio files
- **BPM Detection**: Use existing Tone.js analyser nodes
- **Effects Chain**: Wire existing effects to gesture controls

### State Management
- **Extend djStore**: Add track, playback, and tutorial state
- **Gesture Mapping**: Store control mappings in Zustand
- **Settings Persistence**: Use localStorage for user preferences

## Implementation Strategy

### Build Order (Prioritized for Same-Day Completion)
1. Audio playback first (makes it actually work)
2. Basic UI to control playback
3. Wire gestures to controls
4. Add streaming support
5. Tutorial overlay
6. Testing and optimization

### Risk Mitigation
- Start with local file upload (guaranteed to work)
- Add streaming as enhancement (may have CORS issues)
- Keep UI minimal (can enhance later)
- Use keyboard shortcuts as fallback

## Task Breakdown Preview

### Core Tasks (Maximum 8 for MVP)
- [ ] Task 1: Extend AudioMixer with Tone.Player integration
- [ ] Task 2: Create unified DJ interface component
- [ ] Task 3: Implement track loading (local + streaming)
- [ ] Task 4: Wire gesture controls to mixer/effects
- [ ] Task 5: Add BPM detection and beat sync
- [ ] Task 6: Create tutorial overlay system
- [ ] Task 7: Implement keyboard shortcuts
- [ ] Task 8: Performance optimization and testing

## Dependencies

### Already Available
- MediaPipe hand tracking (working)
- Tone.js audio engine (installed)
- Zustand state management (configured)
- Gesture smoothing with Kalman filter (implemented)
- Error boundaries (complete)

### New Requirements
- youtube-dl-exec or ytdl-core for YouTube
- soundcloud-downloader for SoundCloud
- Web Audio API for additional processing
- No external API keys needed for MVP

## Success Criteria (Technical)

### Performance Benchmarks
- Audio latency: < 20ms (Tone.js default)
- Gesture response: < 50ms (already achieved)
- Track load time: < 10 seconds
- Memory usage: < 500MB
- CPU usage: < 60%

### Quality Gates
- No audio dropouts during 30-minute session
- Gesture recognition accuracy > 90%
- All effects processable in real-time
- Tutorial completable in 5 minutes

### Acceptance Criteria
- Mix two tracks simultaneously
- Apply effects via gestures
- Load tracks from YouTube/SoundCloud URLs
- Complete gesture-controlled crossfade
- BPM-matched beat sync

## Estimated Effort

### Timeline (Same Day - 7 Hours Total)
- **Hour 1-2**: Audio playback implementation
- **Hour 3-4**: DJ interface and controls
- **Hour 5**: Gesture mapping
- **Hour 6**: Streaming integration
- **Hour 7**: Tutorial and testing

### Critical Path
1. Audio playback (blocking everything)
2. Basic UI (needed for testing)
3. Gesture mapping (core feature)
4. Streaming (nice-to-have but expected)

### Resource Requirements
- Single developer
- Existing codebase
- No additional infrastructure
- Browser testing only

## Tasks Created
- [ ] #13 - Extend AudioMixer with Tone.Player integration (parallel: false)
- [ ] #14 - Create unified DJ interface component (parallel: false)
- [ ] #15 - Implement track loading (local + streaming) (parallel: false)
- [ ] #16 - Wire gesture controls to mixer/effects (parallel: false)
- [ ] #17 - Add BPM detection and beat sync (parallel: true)
- [ ] #18 - Create tutorial overlay system (parallel: true)
- [ ] #19 - Implement keyboard shortcuts (parallel: true)
- [ ] #20 - Performance optimization and testing (parallel: false)

Total tasks: 8
Parallel tasks: 3
Sequential tasks: 5
Estimated total effort: 9.5 hours