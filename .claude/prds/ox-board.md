---
name: ox-board
description: MVP requirements for gesture-controlled DJ platform with streaming integration
status: backlog
created: 2025-09-14T19:06:54Z
---

# PRD: ox-board

## Executive Summary

OX Board MVP is a browser-based gesture-controlled DJ platform that enables music mixing through webcam-captured hand movements. The MVP focuses on delivering core DJ functionality with YouTube and SoundCloud integration, allowing users to mix tracks without physical equipment. Target completion is immediate (same day) with emphasis on functionality over visual polish.

## Problem Statement

### What problem are we solving?
DJ equipment costs $500-5000, creating a significant barrier to entry for aspiring DJs and casual users who want to mix music at parties or events. Additionally, learning traditional DJ equipment is intimidating and time-consuming for beginners.

### Why is this important now?
- The existing codebase has gesture detection working but lacks actual DJ functionality
- Theta Chi fraternity needs a working solution for upcoming events
- No competitors exist in the gesture-controlled DJ space
- Browser technology (MediaPipe, Web Audio API) has matured to enable this

## User Stories

### Primary Persona: College DJ (Nate)
**Context:** Theta Chi member who DJs at fraternity parties
**Pain Points:** Can't afford equipment, limited space in dorm
**User Journey:**
1. Opens OX Board on laptop connected to party speakers
2. Searches and loads tracks from YouTube/SoundCloud
3. Uses hand gestures to mix between two songs
4. Applies effects during transitions
5. Keeps the party going for 2+ hours

**Acceptance Criteria:**
- Can load tracks within 10 seconds
- Gesture latency < 50ms
- No audio dropouts during 2-hour set

### Secondary Persona: Beginner DJ (Maria)
**Context:** Complete beginner wanting to learn DJ skills
**Pain Points:** Overwhelmed by traditional equipment
**User Journey:**
1. Opens tutorial on first visit
2. Learns basic gestures in 5 minutes
3. Practices with demo tracks
4. Successfully mixes first two songs
5. Shares mix with friends

**Acceptance Criteria:**
- Tutorial completion in < 10 minutes
- Successfully mix 2 songs on first session
- Clear visual feedback for gestures

## Requirements

### Functional Requirements

#### Core Audio System
- **Track Loading:**
  - YouTube URL input and streaming
  - SoundCloud URL input and streaming
  - Local file upload (MP3, WAV, OGG)
  - Demo tracks pre-loaded

- **Dual Deck Players:**
  - Independent play/pause/cue per deck
  - Pitch control (±8% range)
  - Loop controls (1, 2, 4, 8 bars)
  - Waveform display with beat grid

- **Mixer Controls:**
  - Crossfader with adjustable curve
  - Channel volume faders
  - 3-band EQ per channel (high/mid/low)
  - Master gain control
  - VU meters per channel

#### Gesture Mapping
- **Basic Controls:**
  - Open palm: Stop/pause current deck
  - Closed fist: Play current deck
  - Index finger height: Volume control
  - Wrist rotation: EQ adjustment

- **Advanced Controls:**
  - Two-hand spread: Crossfade
  - Pinch gesture: Apply effect
  - Swipe: Track navigation
  - Circle motion: Jog wheel control

#### Effects Processing
- **Essential Effects:**
  - Low/High pass filter
  - Reverb (hall, room, plate)
  - Delay (1/4, 1/2, 3/4 beat)
  - Beat repeat/roll

- **Effect Controls:**
  - Wet/dry mix knob
  - Parameter adjustment via gesture
  - Effect on/off toggle
  - Send levels per channel

#### Beat Matching System
- **BPM Detection:**
  - Automatic BPM analysis on load
  - Manual BPM tap function
  - BPM display for each deck

- **Sync Features:**
  - One-click beat sync
  - Tempo match assistance
  - Beat grid alignment
  - Phase adjustment

#### Tutorial System
- **Onboarding Flow:**
  - Welcome screen with gesture camera check
  - Basic gesture training (5 gestures)
  - First mix walkthrough
  - Tips overlay during use

- **Help System:**
  - Gesture reference card
  - Keyboard shortcuts as backup
  - Common mixing techniques guide

### Non-Functional Requirements

#### Performance
- **Latency:** < 20ms audio processing
- **Gesture Response:** < 50ms from movement to action
- **Frame Rate:** Maintain 60fps during gesture tracking
- **Load Time:** < 3 seconds to interactive
- **CPU Usage:** < 60% on modern processors

#### Compatibility
- **Browsers:** Chrome 90+, Firefox 88+, Edge 90+
- **Platform:** Desktop only (Windows, Mac, Linux)
- **Screen Resolution:** Minimum 1280x720
- **Camera:** Any webcam with 30fps+ capability

#### Reliability
- **Uptime:** No crashes during 2-hour sessions
- **Error Recovery:** Graceful degradation if camera fails
- **Audio Stability:** No dropouts or glitches
- **State Persistence:** Remember settings between sessions

## Success Criteria

### Day 1 (MVP Launch)
- [ ] Load and play tracks from YouTube/SoundCloud
- [ ] Mix between two tracks using gestures
- [ ] Apply at least 3 effects
- [ ] Complete tutorial in < 10 minutes
- [ ] Achieve < 50ms gesture latency

### Week 1
- [ ] 100 successful mixing sessions
- [ ] 80% tutorial completion rate
- [ ] Average session length > 20 minutes
- [ ] Zero critical bugs reported

### Month 1
- [ ] 1,000 registered users
- [ ] 50% week-over-week retention
- [ ] 500+ tracks mixed
- [ ] 4.0+ user satisfaction rating

## Constraints & Assumptions

### Technical Constraints
- Browser security requires HTTPS for camera access
- CORS limitations for some streaming services
- Web Audio API processing limits
- MediaPipe requires good lighting conditions

### Resource Constraints
- Single developer for implementation
- Must complete MVP today
- No budget for external APIs
- Limited to free tier of any services

### Assumptions
- Users have stable internet for streaming
- Webcam quality is sufficient for hand tracking
- Room lighting is adequate
- Users have speakers/headphones connected

## Out of Scope

### Not in MVP
- Mobile browser support
- Native mobile apps
- Video mixing capabilities
- Recording/export functionality
- Social features (sharing, profiles)
- Multi-user collaborative sessions
- Spotify integration (licensing issues)
- MIDI controller support
- Custom gesture mapping UI
- Advanced visualizations (3D, particles)
- Offline mode
- Cloud storage for tracks
- User accounts/authentication

### Future Phases
- Phase 2: Recording, social features, mobile support
- Phase 3: Collaborative sessions, MIDI support
- Phase 4: AI-assisted mixing, advanced visualizations

## Dependencies

### External Dependencies
- **MediaPipe Hands:** Gesture detection (already integrated)
- **Tone.js:** Audio engine (already installed)
- **YouTube API:** For track streaming
- **SoundCloud API:** For track streaming
- **CDN:** For MediaPipe model delivery

### Internal Dependencies
- Existing gesture detection system
- Audio mixer class implementation
- Zustand state management
- Error boundary system

### API Requirements
- YouTube Data API v3 (or alternative streaming method)
- SoundCloud API (or web scraping fallback)
- No authentication required for MVP

## Risk Mitigation

### Critical Risks
1. **Streaming API Limitations**
   - Mitigation: Implement multiple fallback methods
   - Backup: Focus on local file upload if streaming fails

2. **Audio Latency Issues**
   - Mitigation: Optimize buffer sizes, use Web Audio directly
   - Backup: Provide latency adjustment settings

3. **Gesture Detection Accuracy**
   - Mitigation: Provide keyboard shortcuts as backup
   - Backup: Simplify gesture set if needed

## Implementation Priority

### Phase 1: Core Audio (2 hours)
1. YouTube/SoundCloud track loader
2. Dual deck players with Tone.js
3. Basic playback controls

### Phase 2: Mixer & Effects (2 hours)
1. Crossfader and EQ implementation
2. Effects processing chain
3. Gesture-to-control mapping

### Phase 3: UI & Tutorial (2 hours)
1. Deck UI components
2. Mixer interface
3. Tutorial overlay system

### Phase 4: Testing & Optimization (1 hour)
1. Latency optimization
2. Bug fixes
3. Performance tuning

## Acceptance Criteria Checklist

### Must Have for MVP
- [ ] Load tracks from YouTube URL
- [ ] Load tracks from SoundCloud URL
- [ ] Two independent deck players
- [ ] Crossfader control via gesture
- [ ] Volume control via gesture
- [ ] At least 3 working effects
- [ ] BPM detection and display
- [ ] Beat sync functionality
- [ ] Tutorial system
- [ ] < 50ms gesture latency
- [ ] No crashes during mixing

### Nice to Have
- [ ] Waveform visualization
- [ ] Loop controls
- [ ] EQ visualization
- [ ] Recording capability
- [ ] Keyboard shortcuts