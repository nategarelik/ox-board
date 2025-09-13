---
created: 2025-09-13T21:07:43Z
last_updated: 2025-09-13T21:07:43Z
version: 1.0
author: Claude Code PM System
---

# Product Context

## Product Definition

**OX Board** is a revolutionary gesture-controlled DJ platform that enables music mixing through hand movements captured via webcam, eliminating the need for expensive physical DJ equipment.

## Target Users

### Primary Persona: College Student DJ
**Name**: Jake, 20, Theta Chi member at UW-Madison
- **Context**: Wants to DJ at fraternity parties
- **Pain Points**: Can't afford $3,000 DJ controller, limited space in dorm
- **Goals**: Impress at parties, learn DJ skills, collaborate with friends
- **Tech Savvy**: High - comfortable with web apps and technology

### Secondary Persona: Aspiring Bedroom DJ
**Name**: Maria, 25, music enthusiast
- **Context**: Learning to DJ from YouTube tutorials
- **Pain Points**: Overwhelming equipment options, high cost barrier
- **Goals**: Practice mixing, record sets, share online
- **Tech Savvy**: Medium - uses music software casually

### Tertiary Persona: Event Host
**Name**: Tom, 30, social event organizer
- **Context**: Hosts house parties and small events
- **Pain Points**: Hiring DJs is expensive, equipment takes space
- **Goals**: Provide interactive entertainment, let guests participate
- **Tech Savvy**: Low-medium - needs simple setup

## Core Use Cases

### 1. Solo Practice Session
```
Actor: Aspiring DJ
Trigger: Opens app to practice mixing
Flow:
1. Grant camera permissions
2. Complete gesture calibration (30 seconds)
3. Load two tracks into decks
4. Use hand gestures to:
   - Play/pause tracks
   - Adjust crossfader
   - Control volume
   - Apply effects
5. Record session for review
Outcome: Improved mixing skills without equipment
```

### 2. Live Party Performance
```
Actor: Student DJ
Trigger: Setting up for fraternity party
Flow:
1. Connect laptop to speakers
2. Project app on TV/wall
3. Load party playlist
4. Perform 2-hour set using gestures
5. Crowd sees gestures and visuals
6. Save successful transitions
Outcome: Memorable party experience
```

### 3. Collaborative Session
```
Actor: Multiple users
Trigger: Friends want to DJ together
Flow:
1. Host creates session
2. Friends join via link
3. Take turns controlling decks
4. Vote on next tracks
5. Record collaborative mix
Outcome: Social music experience
```

### 4. Learning Mode
```
Actor: Beginner
Trigger: First time using the app
Flow:
1. Start tutorial mode
2. Learn basic gestures one by one
3. Practice with guided exercises
4. Unlock advanced features gradually
5. Track progress and achievements
Outcome: Confident basic user in 10 minutes
```

## Feature Requirements

### Must Have (MVP)
1. **Gesture Detection**
   - 5 basic gestures (play, pause, crossfade, volume up/down)
   - Visual feedback for recognized gestures
   - Calibration for different hand sizes

2. **Audio Mixing**
   - Dual-deck playback
   - Crossfader control
   - Volume control per deck
   - BPM display

3. **User Interface**
   - Virtual DJ decks
   - Waveform visualization
   - Gesture indicator overlay
   - Tutorial mode

### Should Have (Phase 2)
1. **Effects**
   - Filter (high/low pass)
   - Echo/delay
   - Reverb
   - Loop/beat repeat

2. **Advanced Gestures**
   - Two-handed controls
   - Custom gesture mapping
   - Gesture recording

3. **Music Library**
   - Local file upload
   - Demo tracks included
   - BPM detection
   - Key detection

### Could Have (Phase 3)
1. **Social Features**
   - Collaborative sessions
   - Mix sharing
   - User profiles
   - Community presets

2. **Recording**
   - Session recording
   - Export to MP3
   - Video capture with gestures

3. **Streaming Integration**
   - Spotify API (if possible)
   - SoundCloud integration
   - YouTube music

### Won't Have (Out of Scope)
- Native mobile apps (web-first)
- Professional streaming (Twitch/YouTube)
- Hardware manufacturing
- Music production features
- Video mixing

## User Journey

### First-Time User Flow
```
1. Land on homepage → See demo video
2. Click "Start DJing" → Camera permission prompt
3. Grant permission → Calibration screen
4. Calibrate gestures → Tutorial starts
5. Complete tutorial → Main DJ interface
6. Load demo tracks → Start mixing
7. Success moment → Share or save
```

### Returning User Flow
```
1. Visit app → Auto-loads last session
2. New tracks available → Browse library
3. Start mixing → Resume where left off
4. Try new effect → Gesture reminder shown
5. Record good mix → Save to profile
```

## Success Metrics

### User Engagement
- **Activation**: 60% complete tutorial
- **Retention**: 40% return within 7 days
- **Session Length**: Average 20+ minutes
- **Feature Adoption**: 50% use effects within first week

### Quality Metrics
- **Gesture Accuracy**: >90% recognition rate
- **Audio Latency**: <20ms processing
- **Load Time**: <3 seconds to interactive
- **Crash Rate**: <0.1% of sessions

### Growth Metrics
- **Viral Coefficient**: 0.3 (users invite friends)
- **Social Shares**: 20% share mixes
- **Collaborative Sessions**: 10% try multiplayer

## Competitive Landscape

### Direct Competitors
1. **None**: No mainstream gesture-controlled DJ apps exist

### Indirect Competitors
1. **Physical DJ Controllers**: Pioneer, Denon ($500-5000)
2. **DJ Software**: Serato, Traktor, VirtualDJ ($100-300)
3. **Mobile DJ Apps**: djay, edjing Mix ($5-20)
4. **Browser DJ Tools**: Transitions DJ, YouDJ (Free-$10/mo)

### Competitive Advantages
1. **Zero Equipment Cost**: No hardware needed
2. **Instant Access**: Works in browser
3. **Novel Interface**: Gesture control is unique
4. **Social Features**: Collaborative DJing
5. **Learning Curve**: More intuitive than traditional

## Product Constraints

### Technical Constraints
- Requires webcam access
- Needs modern browser (Chrome 90+)
- Minimum 4GB RAM
- Stable lighting for gesture detection

### User Constraints
- Clear space in front of camera
- Good lighting conditions
- Speakers/headphones required
- Internet for collaboration features

### Business Constraints
- Music licensing limitations
- Cannot use copyrighted tracks
- Free tier limitations
- No monetization initially

## Product Risks

### High Risk
1. **Gesture Accuracy**: Poor detection ruins experience
2. **Audio Latency**: Delays make mixing impossible
3. **Browser Compatibility**: Limited browser support

### Medium Risk
1. **User Adoption**: Novel interface may confuse
2. **Lighting Dependency**: Dark environments problematic
3. **Performance**: Low-end devices struggle

### Low Risk
1. **Competition**: No direct competitors
2. **Technology**: All tech is proven
3. **Market**: Clear target audience exists

## Product Roadmap

### Phase 1: MVP (Current)
- Basic gesture control
- Dual-deck mixing
- Tutorial system
- Core UI

### Phase 2: Enhancement
- Effects library
- Advanced gestures
- Music library
- Recording

### Phase 3: Social
- Collaborative sessions
- User profiles
- Mix sharing
- Community features

### Phase 4: Professional
- 4-deck mixing
- MIDI support
- Streaming integration
- Mobile apps

## Value Proposition

**For aspiring DJs and music enthusiasts**
**Who want to mix music without expensive equipment**
**OX Board is a gesture-controlled DJ platform**
**That enables professional mixing using just a webcam**
**Unlike traditional DJ controllers**
**Our product requires no equipment and works instantly in your browser**