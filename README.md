# 🎛️ OX Board - Gesture-Controlled DJ Terminal

**A revolutionary DJ platform with terminal aesthetics and gesture control via webcam hand tracking.**

![Version](https://img.shields.io/badge/version-0.9.0--pre--mvp-yellow.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

> **⚠️ Pre-MVP Status**: OX Board is currently in active development (v0.9.0-pre-mvp). Some features are functional prototypes, while others use mock implementations. See [Feature Status](#-feature-status) below.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## 🎨 Terminal UI - The Primary Interface

OX Board uses a **retro terminal UI** as its primary interface, featuring:

- 🖥️ **CRT Aesthetic**: Green-on-black display with scanlines and flicker effects
- 🎹 **Full DJ Functionality**: Dual decks, mixer, effects, stem separation
- 👋 **Gesture Control**: Control everything with hand gestures via webcam
- 🎵 **Professional Audio**: Powered by Tone.js and Web Audio API

## 📁 Project Structure

```
ox-board/
├── app/
│   ├── components/
│   │   ├── terminal/          # 🎮 ACTIVE UI - Terminal interface
│   │   ├── offline/           # PWA & offline support
│   │   └── Camera/            # Gesture recognition
│   ├── lib/
│   │   ├── audio/            # Audio processing libraries
│   │   ├── gestures/         # Gesture detection & mapping
│   │   └── optimization/     # Performance utilities
│   ├── services/             # Core services
│   │   ├── audioService.ts   # Audio context management
│   │   ├── deckManager.ts    # Deck control system
│   │   └── aiStemService.ts  # AI-powered features
│   ├── stores/               # State management (Zustand)
│   └── hooks/                # React hooks
├── backend/                  # Python FastAPI backend (planned - see specs/003)
│   ├── api/                  # API endpoints
│   ├── core/                 # Core backend logic
│   └── Dockerfile            # Container configuration
├── docs/                     # 📚 Comprehensive documentation
│   ├── OPTIMAL-VISION.md     # Product roadmap & feature plan
│   ├── ANALYSIS-SUMMARY.md   # Codebase analysis
│   ├── domain/               # Business domain documentation
│   ├── architecture/         # System architecture
│   ├── patterns/             # Design patterns catalog
│   └── interfaces/           # API reference
├── specs/                    # Feature specifications (001-004)
└── tests/                    # Test suites (113 tests, 85.8% passing)
```

## 🎯 Key Features

### Terminal UI Navigation

- **Dashboard**: System overview and quick stats
- **Studio**: Main DJ interface with decks and mixer
- **Music Library**: Track browser and management
- **Settings**: Configuration and preferences

### Audio Capabilities

- 🎚️ **Dual Deck System**: A/B deck architecture
- 🎛️ **Professional Mixer**: EQ, filters, crossfader
- 🎵 **Stem Separation**: Isolate drums, bass, vocals, other
- 🎹 **Effects Rack**: Reverb, delay, filters, and more
- 📊 **BPM Detection**: Automatic tempo analysis
- 🔊 **Recording**: Capture your mixes

### Gesture Control

- ✋ **Hand Tracking**: MediaPipe-powered detection
- 🎚️ **Volume Control**: Vertical hand movement
- ↔️ **Crossfader**: Horizontal hand position
- 🎛️ **EQ Control**: Pinch gestures for bands
- ⏯️ **Playback**: Open/closed hand for play/pause

## 🛠️ Technology Stack

### Frontend

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI**: Custom Terminal UI with CSS
- **State**: Zustand
- **Audio**: Tone.js, Web Audio API
- **Gestures**: MediaPipe, TensorFlow.js

### Backend

- **Framework**: FastAPI (Python)
- **Deployment**: Railway
- **Audio Processing**: Demucs (stem separation)
- **API**: RESTful + WebSocket

### Infrastructure

- **Hosting**: Vercel (frontend) + Railway (backend)
- **CDN**: Cloudflare
- **Database**: PostgreSQL (planned)
- **Monitoring**: Sentry

## 🎮 Using the Terminal UI

### Keyboard Shortcuts

```
Space       - Play/Pause
← →        - Navigate tabs
↑ ↓        - Adjust values
Enter      - Select/Confirm
Esc        - Cancel/Back
Tab        - Next field
Shift+Tab  - Previous field
```

### Terminal Commands (Coming Soon)

```bash
/play deck:a              # Play deck A
/stop deck:b              # Stop deck B
/crossfade 50             # Set crossfader to center
/effect reverb amount:30  # Apply reverb effect
/bpm sync                 # Sync BPM between decks
```

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Run production server
npm test            # Run test suite
npm run lint        # Lint code
npm run type-check  # Check TypeScript types
```

### Environment Variables

Create a `.env.local` file:

```env
# Backend API
NEXT_PUBLIC_API_URL=https://your-railway-backend.railway.app
NEXT_PUBLIC_WEBSOCKET_URL=wss://your-railway-backend.railway.app

# Optional Services
SENTRY_DSN=your-sentry-dsn
GOOGLE_ANALYTICS_ID=your-ga-id
```

## ✅ Feature Status

### Working Features (Production-Ready)

- ✅ Terminal UI with CRT aesthetic
- ✅ Gesture recognition via MediaPipe
- ✅ Audio playback with Tone.js
- ✅ Dual deck system
- ✅ Basic mixer controls
- ✅ PWA support (offline capability)
- ✅ Feature flag system (Terminal/Classic UI toggle)

### Prototype Features (Functional but Limited)

- 🟡 BPM detection (client-side only)
- 🟡 Key detection (basic implementation)
- 🟡 Effects rack (limited effects)
- 🟡 Recording (browser-based)

### Mock Implementations (UI Only)

- 🔴 Stem separation (requires Demucs backend - see `specs/003-self-hosted-demucs/`)
- 🔴 AI mixing suggestions (placeholder logic)
- 🔴 Harmonic compatibility (basic algorithm)
- 🔴 Music library management (local only)

### Planned Features

- 📋 Self-hosted Demucs backend ([specs/003](specs/003-self-hosted-demucs/START-HERE.md))
- 📋 Real-time collaboration
- 📋 Cloud sync for mixes
- 📋 Mobile app (React Native)

> **📖 For complete roadmap**, see [docs/OPTIMAL-VISION.md](docs/OPTIMAL-VISION.md)

## 🏗️ Architecture Decisions

### Why Terminal UI?

1. **Unique Identity**: Stand out with retro aesthetics
2. **Performance**: Lightweight, fast rendering
3. **Accessibility**: Keyboard-first navigation
4. **Focus**: Minimal distractions, maximum functionality

### Archived UI Implementations

Previous UI implementations are preserved in `ui-archive/` for:

- Reference and learning
- Future feature extraction
- Design inspiration
- Component reuse

### Audio Architecture

```
User Input → Gesture/Keyboard → Store → Services → Audio Output
               ↑                    ↓
            State ←──────────────────┘
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- path/to/test.spec.ts

# Run in watch mode
npm run test:watch
```

## 📦 Deployment

### Frontend (Vercel)

```bash
# Automatic deployment on push to main
git push origin main
```

### Backend (Railway)

```bash
# Deploy backend
cd backend/
railway up
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Tone.js** - Web Audio framework
- **MediaPipe** - Hand tracking technology
- **Demucs** - Stem separation engine
- **Next.js** - React framework
- **Railway** - Backend hosting

## 📫 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/ox-board/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/ox-board/discussions)
- **Email**: support@ox-board.app

---

**Built with 💚 by the OX Board Team**

_Making DJing accessible through gesture control and terminal aesthetics_
