# OX Board - Gesture-Controlled DJ Platform 🎵

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15.0.3-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

A revolutionary open-source browser-based DJ platform that replaces expensive physical equipment with gesture controls captured through your webcam. Control your mix with just your hands - no hardware required!

## 🎬 Demo

[Live Demo](#) | [Video Tutorial](#) | [Documentation](#)

![OX Board Demo](https://via.placeholder.com/800x400?text=OX+Board+Demo+GIF)

## 🚀 Features

### Implemented (75% Complete)
- ✅ **MediaPipe Hand Tracking** - Real-time gesture detection via webcam
- ✅ **4-Channel Audio Mixer** - Professional mixing capabilities with Tone.js
- ✅ **Gesture Recognition** - Kalman-filtered smooth control mapping
- ✅ **State Management** - Zustand store for DJ controls
- ✅ **Error Boundaries** - Robust error handling at multiple levels
- ✅ **Dynamic UI** - Responsive interface with Next.js 15

### In Progress (20%)
- 🔄 Track loading and playback
- 🔄 Audio effects (reverb, delay, filters)
- 🔄 3D visualizations with Three.js
- 🔄 Tutorial system

### Planned (5%)
- 📋 Recording capabilities
- 📋 Collaborative sessions
- 📋 Track library with cloud storage
- 📋 MIDI controller support

## 🛠️ Tech Stack

- **Framework**: Next.js 15.0.3 with App Router
- **Language**: TypeScript (strict mode)
- **UI**: React 19.0.0, Tailwind CSS
- **Hand Tracking**: MediaPipe Hands
- **Audio**: Tone.js
- **State**: Zustand
- **3D Graphics**: Three.js (ready to implement)
- **Real-time**: Socket.io (ready to implement)

## ⚡ Quick Start

Try OX Board in under 2 minutes:

```bash
# Clone and setup
git clone https://github.com/your-org/ox-board.git
cd ox-board
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and allow camera access to start mixing!

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm 9+
- Webcam (built-in or external)
- Modern browser (Chrome 90+, Firefox 88+, Safari 15+, Edge 90+)
- 4GB+ RAM recommended

### Setup

```bash
# Clone the repository
git clone https://github.com/your-org/ox-board.git
cd ox-board

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local

# Run development server
npm run dev

# Or build for production
npm run build
npm start
```

## 🎮 Gesture Controls

| Gesture | Control | Description |
|---------|---------|-------------|
| ✋ Open Palm | Stop | Pause playback |
| ✊ Closed Fist | Play | Start playback |
| 👆 Index Finger Height | Volume | Control channel volume |
| ↔️ Wrist Position | Crossfader | Blend between decks |
| 🤏 Pinch | Effects | Apply audio effects |

## 🏗️ Project Structure

```
ox-board/
├── app/                    # Next.js app directory
│   ├── components/         # React components
│   │   ├── Camera/        # MediaPipe integration
│   │   ├── DJ/            # DJ interface components
│   │   └── ErrorBoundary.tsx
│   ├── hooks/             # Custom React hooks
│   │   └── useGestures.ts # Gesture processing
│   ├── lib/               # Utilities
│   │   ├── audio/         # Audio mixer
│   │   └── gesture/       # Gesture recognition
│   ├── stores/            # Zustand state
│   └── page.tsx           # Main DJ interface
├── .claude/               # Project management
│   ├── context/           # Documentation
│   └── epics/             # Development epics
└── public/                # Static assets
```

## 🔧 Development

### Prerequisites
- Node.js 18+
- Webcam
- Modern browser (Chrome 90+ recommended)
- 4GB+ RAM

### Environment Variables
Create a `.env.local` file:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:3000
NEXT_PUBLIC_MEDIAPIPE_VERSION=0.4.0
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Run production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
npm test            # Run tests
npm run test:coverage # Test coverage report
```

## 📊 Performance Targets

- **Gesture Latency**: <50ms
- **Audio Latency**: <20ms
- **Frame Rate**: 60fps
- **Load Time**: <3 seconds
- **Gesture Accuracy**: >95%

## 🤝 Contributing

We welcome contributions from the community! See our [Contributing Guide](CONTRIBUTING.md) for details.

### Ways to Contribute
- 🐛 Report bugs and issues
- 💡 Suggest new features
- 📝 Improve documentation
- 🔧 Submit pull requests
- ⭐ Star the project

### Development Workflow
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes using conventional commits (`feat: add amazing feature`)
4. Push to your branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🛡️ Security

For security concerns, please review our [Security Policy](SECURITY.md).

## 🙏 Acknowledgments

- [MediaPipe](https://mediapipe.dev/) team for hand tracking technology
- [Tone.js](https://tonejs.github.io/) for web audio capabilities
- [Next.js](https://nextjs.org/) team for the framework
- All our [contributors](https://github.com/your-org/ox-board/graphs/contributors)

## 🚧 Roadmap

See our [project board](https://github.com/your-org/ox-board/projects) for upcoming features.

### Version 1.0 Goals
- [ ] Complete audio effects suite
- [ ] Beat matching algorithm
- [ ] Cloud track library
- [ ] Collaborative sessions
- [ ] Mobile gesture support

## 💬 Community

- [GitHub Discussions](https://github.com/your-org/ox-board/discussions)
- [Report Issues](https://github.com/your-org/ox-board/issues)
- [Request Features](https://github.com/your-org/ox-board/issues/new?template=feature_request.md)

## 📊 Project Status

![GitHub last commit](https://img.shields.io/github/last-commit/your-org/ox-board)
![GitHub issues](https://img.shields.io/github/issues/your-org/ox-board)
![GitHub pull requests](https://img.shields.io/github/issues-pr/your-org/ox-board)

---

**Status**: v0.8.0 (Beta) | **Progress**: 75% Complete | Made with ❤️ by the OX Board community