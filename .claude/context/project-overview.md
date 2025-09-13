---
created: 2025-09-13T21:07:43Z
last_updated: 2025-09-13T21:07:43Z
version: 1.0
author: Claude Code PM System
---

# Project Overview

## What is OX Board?

OX Board is a browser-based DJ platform that replaces expensive physical DJ equipment with gesture controls captured through your webcam. Users perform DJ techniques like mixing, scratching, and applying effects using hand movements, making professional DJing accessible to anyone with a computer.

## Current State

### Implementation Status: 5% Complete
- ✅ Next.js application scaffolding
- ✅ Basic UI with loading animation
- ✅ Theta Chi branded theme
- ✅ Dependencies installed
- ❌ No gesture detection
- ❌ No audio functionality
- ❌ No DJ features implemented

### Recent Pivot
The project recently pivoted from a collaborative project management board (like Trello) to a gesture-controlled DJ platform specifically for Theta Chi fraternity at UW-Madison.

## Core Features

### Implemented Features
1. **Basic Application Shell**
   - Next.js 15 app with TypeScript
   - Responsive layout structure
   - Loading animation with music note icon
   - Theta Chi color scheme (red/gold)

### Planned Features (MVP)

#### 1. Gesture Control System
- **Camera Integration**: Access webcam via browser
- **Hand Detection**: Track hand positions using MediaPipe
- **Gesture Recognition**: Identify 5 basic gestures
  - Open palm (stop)
  - Closed fist (play)
  - Swipe left/right (crossfade)
  - Move up/down (volume)
  - Pinch (effects)
- **Visual Feedback**: Show hand skeleton overlay
- **Calibration**: Adapt to different hand sizes

#### 2. DJ Mixing Interface
- **Dual Decks**: Two virtual turntables
- **Waveform Display**: Visual representation of tracks
- **BPM Counter**: Automatic tempo detection
- **Crossfader**: Blend between decks
- **EQ Controls**: Bass, mid, treble adjustment
- **Volume Faders**: Independent deck volumes

#### 3. Audio Engine
- **Playback**: Load and play audio files
- **Beat Matching**: Sync tempo between tracks
- **Cueing**: Preview tracks in headphones
- **Looping**: Create seamless loops
- **Effects**: Filters, reverb, delay, echo

#### 4. Tutorial System
- **Onboarding**: First-time user guidance
- **Gesture Training**: Practice each gesture
- **Progressive Unlock**: Gradual feature introduction
- **Tips**: Context-sensitive help

### Advanced Features (Future Phases)

#### Phase 2: Enhanced DJ Tools
- Advanced effects (gate, flanger, phaser)
- Beat grid editing
- Key detection and harmonic mixing
- Sample triggers
- Recording capabilities

#### Phase 3: Social & Collaboration
- Multi-user sessions
- Live streaming capability
- Mix sharing platform
- User profiles and follows
- Collaborative playlists

#### Phase 4: Professional Features
- 4-deck mixing
- MIDI controller support
- External audio interface support
- Video synchronization
- DMX lighting control

## Technical Capabilities

### Performance Targets
- **Gesture Recognition**: <50ms latency, >95% accuracy
- **Audio Processing**: <20ms latency
- **Frame Rate**: 60fps for smooth visuals
- **Load Time**: <3 seconds to interactive

### Browser Compatibility
- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+ (limited)
- Edge 90+

### Device Requirements
- Webcam (built-in or external)
- 4GB+ RAM
- Modern processor (2015+)
- Speakers or headphones

## Integration Points

### Current Integrations
- None (standalone application)

### Planned Integrations
1. **Music Sources**
   - Local file upload
   - Demo track library
   - Cloud storage (Google Drive, Dropbox)

2. **External Services**
   - Vercel KV for session storage
   - CDN for model/asset delivery
   - Analytics for usage tracking

3. **Future Integrations**
   - Streaming services (licensing required)
   - Social media sharing
   - Cloud recording storage

## User Interface

### Design Philosophy
- **Minimalist**: Focus on essential controls
- **Visual Feedback**: Clear gesture recognition
- **Dark Theme**: Optimized for dim environments
- **Responsive**: Adapt to different screen sizes

### Key UI Components
1. **Camera Feed**: Live video with hand overlay
2. **Deck Section**: Two turntables side by side
3. **Mixer Section**: Central control panel
4. **Effects Rack**: Modular effect controls
5. **Track Browser**: Music library interface
6. **Performance Area**: 3D visualizations

## Development Status

### Completed Milestones
- [x] Project initialization
- [x] Basic Next.js setup
- [x] Dependency installation
- [x] Theme configuration
- [x] Project planning (PRD, Epic, Tasks)

### Current Sprint
- [ ] Task 001: Gesture Detection Setup
- [ ] Task 002: Audio Engine Core
- [ ] Task 003: Testing Infrastructure

### Upcoming Work
- [ ] DJ Deck Components
- [ ] Mixer Interface
- [ ] Gesture Mapping System
- [ ] Tutorial System
- [ ] Performance Optimization

## Architecture Highlights

### Frontend Architecture
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **State**: Zustand (ready to implement)
- **Animation**: Framer Motion

### Processing Pipeline
```
Camera → MediaPipe → Gesture Detection →
Command Mapping → Audio Engine → Output
```

### Component Structure
- Modular, reusable components
- Smart/dumb component pattern
- Custom hooks for logic
- Context providers for global state

## Quality Metrics

### Code Quality
- TypeScript strict mode enabled
- ESLint configuration active
- Component-based architecture
- No test coverage yet (planned)

### Performance Metrics
- Lighthouse score: Not measured
- Bundle size: ~5MB (unoptimized)
- Initial load: ~2 seconds

### User Experience Metrics
- Gesture accuracy: Not implemented
- Audio latency: Not implemented
- Tutorial completion: Not implemented

## Deployment

### Current Setup
- Local development only
- No CI/CD pipeline
- No staging environment
- No production deployment

### Planned Infrastructure
- **Hosting**: Vercel
- **CDN**: Vercel Edge Network
- **Database**: Vercel KV (Redis)
- **Monitoring**: Vercel Analytics

## Team & Resources

### Current Team
- 1-2 developers
- No dedicated designer
- No dedicated QA

### Target Audience
- Primary: Theta Chi fraternity members
- Secondary: College students
- Tertiary: Aspiring DJs

### Project Timeline
- Started: September 2024
- MVP Target: 8-10 weeks
- Phase 1 Complete: 2 months

## Known Issues

### Critical Issues
- Project documentation conflicts (old vs new vision)
- Missing core dependencies (@mediapipe/camera_utils)
- React version mismatch in documentation

### Non-Critical Issues
- No test infrastructure
- Unused dependencies installed
- No error boundaries
- Missing environment variables

## Next Steps

### Immediate Actions
1. Resolve documentation conflicts
2. Fix dependency issues
3. Implement gesture detection
4. Set up audio engine

### Short-term Goals
1. Complete MVP features
2. Add testing infrastructure
3. Optimize performance
4. Deploy to staging

### Long-term Vision
Create the world's first mainstream gesture-controlled DJ platform that democratizes music mixing and enables new forms of creative expression through natural hand movements.