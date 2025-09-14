# OX Board - Gesture-Controlled DJ Platform 🎵

A revolutionary browser-based DJ platform that replaces expensive physical equipment with gesture controls captured through your webcam. Built for the Theta Chi fraternity at UW-Madison.

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

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/nategarelik/ox-board.git
cd ox-board

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

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
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Run production server
npm run lint     # Run ESLint
```

## 📊 Performance Targets

- **Gesture Latency**: <50ms
- **Audio Latency**: <20ms
- **Frame Rate**: 60fps
- **Load Time**: <3 seconds
- **Gesture Accuracy**: >95%

## 🤝 Contributing

This project is currently in active development. Contributions are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software developed for Theta Chi fraternity at UW-Madison.

## 🙏 Acknowledgments

- MediaPipe team for hand tracking technology
- Tone.js for web audio capabilities
- Next.js team for the framework
- Theta Chi fraternity for project sponsorship

## 📞 Contact

Project maintained by Theta Chi UW-Madison chapter.

---

**Status**: 75% Complete | **Last Updated**: September 2024