# 🏗️ OX Board Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      TERMINAL UI (Active)                      │
│                   Green CRT-style Interface                    │
└─────────────────┬───────────────────────────┬─────────────────┘
                  │                           │
                  ▼                           ▼
┌─────────────────────────┐     ┌──────────────────────────────┐
│    Gesture Control      │     │      Keyboard Input          │
│    (MediaPipe)          │     │      (React Events)          │
└───────────┬─────────────┘     └──────────┬───────────────────┘
            │                               │
            ▼                               ▼
┌────────────────────────────────────────────────────────────────┐
│                      State Management                           │
│                    (Zustand Store)                             │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────┐
│                     Audio Services                              │
│        ┌──────────────┐  ┌──────────────┐                     │
│        │ AudioService │  │ DeckManager  │                     │
│        └──────────────┘  └──────────────┘                     │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────┐
│                   Audio Processing                              │
│     ┌─────────┐  ┌──────────┐  ┌─────────────┐               │
│     │ Tone.js │  │ Essentia │  │ Web Audio   │               │
│     └─────────┘  └──────────┘  └─────────────┘               │
└────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────┐
│                    Backend Services                             │
│                  (Railway - FastAPI)                            │
│     ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│     │ Stem Sep.    │  │ Audio Analysis│  │ User Data    │     │
│     │ (Demucs)     │  │ (BPM, Key)    │  │ Management   │     │
│     └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────────────────────────────────────────────┘
```

## Layer Architecture

### 1. Presentation Layer - Terminal UI

**Location**: `app/components/terminal/`

- **Responsibility**: User interface and interaction
- **Technology**: React, TypeScript, Custom CSS
- **Pattern**: Component-based architecture

### 2. Control Layer - Gesture & Input

**Location**: `app/hooks/`, `app/lib/gestures/`

- **Responsibility**: Input capture and processing
- **Technology**: MediaPipe, TensorFlow.js
- **Pattern**: Hook-based abstraction

### 3. State Layer - Store Management

**Location**: `app/stores/`

- **Responsibility**: Application state management
- **Technology**: Zustand
- **Pattern**: Flux-inspired unidirectional flow

### 4. Service Layer - Business Logic

**Location**: `app/services/`

- **Responsibility**: Core business operations
- **Technology**: TypeScript classes
- **Pattern**: Singleton services

### 5. Audio Layer - Sound Processing

**Location**: `app/lib/audio/`

- **Responsibility**: Audio manipulation and effects
- **Technology**: Tone.js, Web Audio API
- **Pattern**: Factory and Builder patterns

### 6. Backend Layer - Heavy Processing

**Location**: `backend/`

- **Responsibility**: Stem separation, analysis
- **Technology**: FastAPI, Python, Demucs
- **Pattern**: RESTful API + WebSocket

## Data Flow

### Audio Processing Pipeline

```
Audio File → Upload → Backend Processing → Stem Separation
    ↓                                           ↓
Web Audio ← Audio Service ← Deck Manager ← Separated Stems
    ↓
Audio Output
```

### Gesture Control Flow

```
Camera → MediaPipe → Landmark Detection → Gesture Recognition
                                              ↓
                                        Gesture Mapping
                                              ↓
                                        Store Actions
                                              ↓
                                        UI Updates
```

### State Management Flow

```
User Action → Store Action → State Update → React Re-render
                 ↓                ↑
            Service Call ─────────┘
```

## Key Design Patterns

### 1. Singleton Pattern

Used for audio services to ensure single audio context:

```typescript
class AudioService {
  private static instance: AudioService;
  static getInstance() {
    /* ... */
  }
}
```

### 2. Observer Pattern

Event emission for deck updates:

```typescript
class DeckManager extends EventEmitter {
  emit('deck:loaded', data);
}
```

### 3. Factory Pattern

Audio node creation:

```typescript
createFilter(type: 'lowpass' | 'highpass') { /* ... */ }
```

### 4. Command Pattern

Store actions encapsulate operations:

```typescript
const setVolume = (deckId: number, volume: number) => {
  /* ... */
};
```

## File Organization

### Active Code

```
app/
├── components/terminal/     # Active UI
├── lib/                     # Core libraries
├── services/               # Business services
├── stores/                 # State management
├── hooks/                  # React hooks
└── api/                    # API routes
```

### Archived Code

```
app/components/ui-archive/
├── professional-dj/        # Modern DJ interface
├── stem-player/           # Original stem player
└── visualizations/        # Visual components
```

### Backend

```
backend/
├── api/                   # FastAPI endpoints
├── core/                  # Core logic
├── models/               # Data models
└── services/             # Backend services
```

## Technology Decisions

### Why Terminal UI?

1. **Unique Identity** - Stand out in the market
2. **Performance** - Minimal DOM updates
3. **Accessibility** - Keyboard-first design
4. **Developer-friendly** - Clear, simple interface

### Why Zustand?

1. **Simple API** - Less boilerplate than Redux
2. **TypeScript** - Excellent TS support
3. **Performance** - Optimized re-renders
4. **Size** - Tiny bundle size (~8kb)

### Why Tone.js?

1. **Web Audio Abstraction** - Simplifies complex audio
2. **Musical Timing** - Beat-synced operations
3. **Effects Library** - Rich effect presets
4. **Community** - Well-maintained, documented

### Why Railway?

1. **Easy Deployment** - Git push to deploy
2. **Docker Support** - Container-based
3. **Scalability** - Auto-scaling available
4. **Cost-effective** - Good free tier

## Performance Considerations

### Frontend Optimization

- Dynamic imports for code splitting
- React.memo for expensive components
- useCallback/useMemo for optimization
- Virtual scrolling for large lists

### Audio Optimization

- Web Workers for analysis
- Buffer pooling for memory
- Lazy loading of audio files
- Efficient effect chains

### Gesture Optimization

- Kalman filtering for smoothing
- Throttled updates (60 FPS max)
- Predictive gesture recognition
- Hardware acceleration via GPU

## Security Considerations

### Frontend Security

- Input sanitization
- XSS prevention via React
- CORS properly configured
- Secure WebSocket connections

### Backend Security

- Rate limiting on API
- File upload validation
- Authentication ready (JWT)
- Environment variable management

## Scalability Plan

### Phase 1 (Current)

- Single-user local application
- Backend on Railway
- Frontend on Vercel

### Phase 2 (Planned)

- Multi-user support
- Database integration (PostgreSQL)
- User authentication
- Cloud storage for tracks

### Phase 3 (Future)

- Real-time collaboration
- Live streaming capability
- Mobile applications
- Plugin ecosystem

## Monitoring & Observability

### Current

- Console logging
- Performance timing API
- Network tab debugging

### Planned

- Sentry error tracking
- Analytics integration
- Performance monitoring
- User session recording

## Testing Strategy

### Unit Tests

- Components: React Testing Library
- Services: Jest
- Audio: Mock Tone.js

### Integration Tests

- API endpoints
- Audio pipeline
- Gesture recognition

### E2E Tests (Planned)

- User flows
- Audio playback
- Gesture controls

## Deployment Pipeline

### Development

```bash
npm run dev → localhost:3000
```

### Staging (Planned)

```bash
git push staging → Vercel preview
```

### Production

```bash
git push main → Vercel production
railway up → Backend deployment
```

## Contributing Guidelines

### Code Style

- TypeScript strict mode
- ESLint + Prettier
- Conventional commits
- Comprehensive comments

### Review Process

1. Feature branch
2. Pull request
3. Code review
4. Tests pass
5. Merge to main

## Future Enhancements

### Terminal UI

- [ ] Command palette
- [ ] Vim keybindings
- [ ] ASCII visualizers
- [ ] Terminal themes

### Audio Features

- [ ] Advanced effects
- [ ] MIDI support
- [ ] VST integration
- [ ] Multi-track recording

### Platform Support

- [ ] Electron desktop app
- [ ] React Native mobile
- [ ] Browser extensions
- [ ] CLI tools

---

**Last Updated**: October 2024
**Version**: 1.0.0
**Maintained By**: OX Board Team
