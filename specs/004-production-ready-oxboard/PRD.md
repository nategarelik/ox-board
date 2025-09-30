# Product Requirements Document (PRD)

## OX Board - Production-Ready Gesture-Controlled Stem Player

**Version**: 1.0.0
**Date**: 2025-09-30
**Status**: Ready for Implementation
**Methodology**: The Agentic Startup - Spec-Driven Development

---

## Executive Summary

OX Board is a **professional gesture-controlled audio stem player** that combines cutting-edge hand gesture recognition with real-time audio processing to create an immersive, hands-free music production experience. The application integrates self-hosted Demucs stem separation, AI-assisted mixing, and a modern PWA architecture for offline-capable professional audio work.

**Core Value Proposition**: Control professional audio mixing with hand gestures while maintaining sub-50ms latency, powered by AI-assisted workflows and offline-first architecture.

---

## 1. Product Vision & Goals

### Vision Statement

Create the world's most intuitive gesture-controlled audio workstation that professionals and enthusiasts can use for mixing, DJing, and audio production without touching a mouse or keyboard.

### Primary Goals

1. **Seamless Gesture Control**: Hand gestures control all audio parameters with <50ms latency
2. **Professional Audio Quality**: Sub-10ms audio processing latency, studio-grade effects
3. **AI-Assisted Workflow**: Intelligent auto-mix suggestions and personalized recommendations
4. **Self-Hosted Processing**: Complete Demucs stem separation running on user's infrastructure
5. **Offline-First**: Full functionality without internet connection after initial load
6. **Production Ready**: Stable, tested, deployable to multiple platforms

### Success Metrics

- **Performance**: 60 FPS gesture recognition, <50ms gesture-to-audio latency
- **Stability**: <1% error rate in production
- **User Experience**: <3 second time-to-first-audio
- **Deployment**: One-click deploy to Railway/Render/Fly.io
- **Test Coverage**: 80%+ code coverage

---

## 2. User Personas

### Primary Persona: Professional Producer

- **Name**: Alex, Music Producer
- **Age**: 28-35
- **Experience**: 5+ years audio production
- **Needs**: Fast workflow, gesture control for live performances, high-quality stem separation
- **Pain Points**: Mouse/keyboard slows down creative flow, expensive stem separation services

### Secondary Persona: DJ/Performer

- **Name**: Jordan, DJ
- **Age**: 22-30
- **Experience**: 3+ years DJing
- **Needs**: Real-time gesture control during performances, quick stem isolation
- **Pain Points**: Equipment setup time, limited real-time control options

### Tertiary Persona: Enthusiast/Learner

- **Name**: Sam, Music Enthusiast
- **Age**: 18-25
- **Experience**: Beginner to intermediate
- **Needs**: Easy-to-use interface, learning gestures, affordable stem separation
- **Pain Points**: Professional tools too complex, online services expensive

---

## 3. Feature Requirements

### 3.1 Core Features (Must-Have for v1.0)

#### F1: Gesture Recognition System ✅

**Status**: Implemented, needs integration

**Requirements**:

- Recognize 9 gesture types (pinch, fist, palm, peace, swipes, spread, two-hand pinch, finger count)
- 60 FPS processing rate
- <50ms gesture-to-control latency
- Confidence scoring (0.0-1.0)
- Kalman filtering for smoothing
- MediaPipe Hands integration

**Acceptance Criteria**:

- ✅ All 9 gestures recognized with >85% accuracy
- ✅ Latency measured and logged <50ms
- ✅ Smooth gesture transitions (no jitter)
- ✅ Works in varying lighting conditions
- ⚠️ Must be integrated into main player UI

---

#### F2: Real-Time Audio Playback Engine ✅

**Status**: Implemented, production-ready

**Requirements**:

- AudioWorklet-based architecture
- Sub-10ms processing latency
- 4-stem simultaneous playback
- Real-time volume/pan/effects control
- Performance monitoring

**Acceptance Criteria**:

- ✅ Latency <10ms (measured)
- ✅ 4 stems play simultaneously
- ✅ Real-time parameter updates
- ✅ Stable under load
- ✅ No audio glitches or dropouts

---

#### F3: Self-Hosted Stem Separation ✅

**Status**: Backend implemented, needs frontend integration

**Requirements**:

- Demucs 4.0.0 with 4 production models
- YouTube URL support (yt-dlp)
- File upload support (drag-and-drop)
- Job queue system (Celery + Redis)
- Progress tracking
- Rate limiting (5 jobs/hour)

**Acceptance Criteria**:

- ✅ Backend API functional
- ✅ 4 models available (htdemucs, htdemucs_ft, hdemucs_mmi, mdx_extra)
- ✅ Job tracking works
- ⚠️ Frontend upload UI needs integration
- ⚠️ Progress display needs implementation

---

#### F4: Hybrid Player Dashboard

**Status**: Needs implementation

**Requirements**:

- Combine best features from current and enhanced dashboards
- Business features: AI auto-mix, subscriptions, analytics, recommendations
- Technical features: Gesture visualization, 3D visualizer, performance monitoring
- Stable audio playback integration
- Responsive design (desktop primary, mobile secondary)

**Components Needed**:

- Stem mixer panel (volume, mute, solo per stem)
- Upload interface with Demucs integration
- Gesture visualization panel
- 3D stem visualizer (optional, toggleable)
- Performance monitor (debug mode)
- AI generation panel
- Recommendation panel
- Subscription tiers

**Acceptance Criteria**:

- [ ] All components integrated
- [ ] Audio playback works with gestures
- [ ] Upload connects to Demucs backend
- [ ] UI responsive on desktop
- [ ] No console errors
- [ ] Smooth animations

---

#### F5: Offline/PWA Capabilities ✅

**Status**: Infrastructure built, needs integration

**Requirements**:

- Service worker for offline functionality
- IndexedDB caching for stems
- Sync queue for offline actions
- PWA manifest for installability
- Offline indicators and warnings
- Smart caching with predictions

**Acceptance Criteria**:

- ✅ Service worker registered
- ✅ Offline detection working
- ⚠️ Needs integration into main UI
- [ ] PWA install prompt shown
- [ ] Cached stems playable offline
- [ ] Sync queue processes when online

---

### 3.2 Enhanced Features (Nice-to-Have for v1.0)

#### F6: AI Auto-Mix Suggestions ✅ (Partial)

- Analyze stem balance and suggest mix improvements
- One-click apply suggestions
- Learn from user adjustments
- **Status**: Mock service implemented, needs real AI model

#### F7: 3D Stem Visualizer ✅

- WebGL-based 3D visualization of stems
- Gesture-reactive animations
- Real-time audio analysis
- **Status**: Component built, needs integration and audio data

#### F8: Performance Monitoring ✅

- Real-time FPS display
- Latency tracking (gesture, audio, render)
- Memory usage monitoring
- CPU usage estimation
- **Status**: System built, needs UI integration

#### F9: Mobile Gesture Control ✅

- Touch-based gesture input on mobile
- Simplified UI for mobile screens
- Responsive layouts
- **Status**: Component built, needs testing

---

### 3.3 Future Features (Post v1.0)

- Multi-user collaboration (live sessions)
- Cloud stem library sync
- Advanced effects rack (reverb, delay, EQ, compression)
- MIDI controller integration
- VST plugin support
- Export to stems/mixdown
- Social sharing features

---

## 4. Technical Requirements

### 4.1 Performance Requirements

| Metric              | Target         | Measurement          |
| ------------------- | -------------- | -------------------- |
| Gesture Latency     | <50ms          | Performance monitor  |
| Audio Latency       | <10ms          | AudioContext metrics |
| Frame Rate          | 60 FPS         | Performance monitor  |
| Time to Interactive | <3s            | Lighthouse           |
| Bundle Size         | <500KB initial | Webpack analyzer     |
| Memory Usage        | <200MB         | Chrome DevTools      |

### 4.2 Browser Support

**Primary**:

- Chrome 90+ (Desktop & Mobile)
- Edge 90+
- Safari 15+ (Desktop & Mobile)

**Secondary**:

- Firefox 88+ (gesture support limited)

**Minimum Requirements**:

- WebGL 2.0 support
- AudioWorklet support
- MediaPipe Hands compatibility
- IndexedDB support
- Service Worker support

### 4.3 Platform Requirements

**Frontend**:

- Next.js 15 (App Router)
- React 18
- TypeScript (strict mode)
- Tone.js (audio)
- MediaPipe Hands (gestures)
- Three.js (3D visualization)

**Backend**:

- Python 3.11+
- FastAPI
- Celery + Redis
- Demucs 4.0.0
- yt-dlp

**Deployment**:

- Railway (recommended)
- Render (free tier option)
- Fly.io (global distribution)
- Docker containerized

---

## 5. User Experience Requirements

### 5.1 User Journey: First-Time User

1. **Landing** (0-10s):
   - See welcome screen with demo video
   - Understand gesture controls visually
   - One-click "Start" button

2. **Camera Setup** (10-20s):
   - Request camera permission
   - Show hand detection feedback
   - Calibration tutorial (optional)

3. **First Playback** (20-30s):
   - Default demo track loads
   - Play with gesture (palm open)
   - See visual feedback (gesture viz + 3D viz)

4. **First Mix** (30-60s):
   - Control volume with pinch gesture
   - Mute/solo stems with finger count
   - See real-time audio response

5. **First Upload** (60-120s):
   - Click upload button
   - Drag-and-drop or paste YouTube URL
   - See progress bar
   - Stems appear when ready

### 5.2 User Journey: Returning Professional

1. **Quick Start** (<5s):
   - PWA opens instantly (cached)
   - Recent tracks shown
   - One-click to resume

2. **Load Track** (5-10s):
   - Browse uploaded tracks
   - Or upload new track
   - Stems load from cache (offline)

3. **Mix Session** (10s-1hr):
   - Gesture-controlled mixing
   - AI suggestions on-demand
   - Performance monitoring (if needed)
   - Save mix settings

4. **Export/Share** (1-2 min):
   - Export stems or final mix
   - Download or cloud save
   - Share session link

### 5.3 Accessibility Requirements

- **Keyboard Navigation**: All features accessible via keyboard
- **Screen Reader**: Proper ARIA labels and roles
- **Color Contrast**: WCAG AA compliance minimum
- **Alternative Input**: Mouse/trackpad if gestures fail
- **Error Recovery**: Clear error messages and recovery steps

---

## 6. Business Requirements

### 6.1 Monetization Strategy

**Tier 1: Free** (MVP for v1.0)

- 5 uploads per hour
- Standard quality stem separation (htdemucs)
- Basic AI suggestions
- 1GB stem cache storage

**Tier 2: Pro** ($9.99/month) - Future

- 50 uploads per hour
- High-quality models (htdemucs_ft)
- Advanced AI features
- 10GB stem cache storage
- Priority processing

**Tier 3: Studio** ($29.99/month) - Future

- Unlimited uploads
- Best quality models (all 4 models)
- API access
- 100GB stem cache storage
- Team collaboration
- Priority support

### 6.2 Analytics Requirements

Track:

- User sessions (duration, frequency)
- Gesture usage (which gestures most used)
- Upload volume (files vs YouTube)
- Feature usage (auto-mix, 3D viz, performance monitor)
- Error rates (gesture recognition, audio processing)
- Performance metrics (latency, FPS, memory)

**Privacy**: No PII, anonymized, GDPR compliant

---

## 7. Quality Assurance Requirements

### 7.1 Testing Strategy

**Unit Tests** (80% coverage minimum):

- Gesture recognition logic
- Audio processing utilities
- State management
- Cache/storage operations

**Integration Tests**:

- Gesture → Audio control flow
- Upload → Stem separation → Playback flow
- Offline → Online sync flow

**E2E Tests**:

- Full user journey (first-time user)
- Upload and playback workflow
- Gesture control scenarios

**Performance Tests**:

- Load testing (100+ concurrent users)
- Stress testing (continuous 1-hour sessions)
- Memory leak detection

**Manual QA**:

- Cross-browser testing
- Mobile testing (iOS Safari, Android Chrome)
- Gesture recognition in various lighting
- Audio quality validation

### 7.2 Acceptance Criteria

**Before Production Deployment**:

- ✅ All critical features implemented
- ✅ 80%+ test coverage achieved
- ✅ No critical bugs (P0/P1)
- ✅ Performance targets met
- ✅ Security audit passed
- ✅ Documentation complete
- ✅ Deployment scripts tested

---

## 8. Security & Compliance

### 8.1 Security Requirements

**Authentication** (Post-MVP):

- OAuth2 (Google, GitHub)
- JWT token-based sessions
- Secure cookie storage

**Authorization**:

- Rate limiting (5 uploads/hour free tier)
- IP-based throttling
- CORS properly configured

**Data Protection**:

- No audio data stored permanently (unless user opts in)
- Stems deleted after 24 hours (configurable)
- User data encrypted at rest
- HTTPS only

**API Security**:

- Input validation (file size, duration, format)
- Sanitized error messages
- No stack traces in production
- Security headers (CSP, X-Frame-Options, etc.)

### 8.2 Compliance

**GDPR**:

- Privacy policy
- Cookie consent
- Data deletion on request
- Data export capability

**CCPA**:

- California privacy notice
- Do not sell my data option

**Accessibility**:

- WCAG 2.1 AA compliance
- Accessibility statement

---

## 9. Dependencies & Constraints

### 9.1 External Dependencies

**Critical**:

- MediaPipe Hands (Google) - gesture recognition
- Demucs (Facebook Research) - stem separation
- Tone.js (community) - audio engine

**Important**:

- Next.js (Vercel) - framework
- Railway/Render/Fly.io - hosting

**Nice-to-Have**:

- OpenAI API - AI features (future)
- CDN - asset delivery (future)

### 9.2 Technical Constraints

- Browser must support WebGL 2.0 and AudioWorklet
- Camera required for gesture control
- 2GB+ RAM recommended for audio processing
- Desktop/laptop primary (mobile secondary)

### 9.3 Business Constraints

- Budget: Self-hosted infrastructure (<$50/month)
- Timeline: 2-3 weeks to production-ready v1.0
- Team: AI-assisted development (Claude Code + GitHub Copilot)

---

## 10. Success Criteria & KPIs

### 10.1 Launch Criteria (v1.0)

- [ ] All core features (F1-F5) implemented and tested
- [ ] Performance targets met (60 FPS, <50ms latency)
- [ ] Zero critical bugs
- [ ] Deployment scripts validated on 3 platforms
- [ ] Documentation complete (README, API docs, user guide)

### 10.2 Post-Launch KPIs (First Month)

**Technical**:

- Uptime: >99.5%
- Error rate: <1%
- Average latency: <50ms gesture, <10ms audio

**User Experience**:

- Time to first audio: <3s (median)
- Session duration: >5 min (median)
- Return rate: >30% (week 2)

**Product**:

- 100+ active users
- 1,000+ stem uploads processed
- 10,000+ gestures recognized

---

## 11. Risks & Mitigations

| Risk                             | Impact | Probability | Mitigation                                                 |
| -------------------------------- | ------ | ----------- | ---------------------------------------------------------- |
| Gesture recognition accuracy low | High   | Medium      | Extensive testing, Kalman filtering, confidence thresholds |
| Audio latency too high           | High   | Low         | AudioWorklet architecture, performance monitoring          |
| Browser compatibility issues     | Medium | Medium      | Polyfills, feature detection, graceful degradation         |
| Demucs processing too slow       | Medium | Medium      | Queue system, progress indicators, GPU support             |
| Memory leaks in long sessions    | High   | Medium      | Memory monitoring, periodic cleanup, testing               |
| PWA not installable              | Low    | Low         | Manifest validation, service worker testing                |

---

## 12. Open Questions

1. **AI Model Integration**: Which AI model for auto-mix suggestions? (OpenAI, local ML, rule-based?)
2. **Cloud Storage**: Should we offer cloud stem storage? (S3, R2, user's cloud?)
3. **Export Formats**: Which formats for export? (WAV, MP3, FLAC, stem bundles?)
4. **Social Features**: Should v1.0 have any social/sharing features?
5. **Mobile Strategy**: Native app or PWA only?

**Decision Needed By**: End of specification phase

---

## Appendices

### Appendix A: Glossary

- **Stem**: Individual audio component (vocals, drums, bass, other)
- **Demucs**: Deep learning model for music source separation
- **AudioWorklet**: Web API for low-latency audio processing
- **Gesture Recognition**: ML-based hand tracking and gesture classification
- **PWA**: Progressive Web App - installable web application
- **Kalman Filter**: Algorithm for smoothing noisy measurements

### Appendix B: References

- MediaPipe Hands Documentation: https://google.github.io/mediapipe/solutions/hands
- Demucs GitHub: https://github.com/facebookresearch/demucs
- Web Audio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- PWA Best Practices: https://web.dev/pwa/

---

**Document Status**: ✅ Complete and Ready for Solution Design

**Next Step**: Create Solution Design Document (SDD.md)
