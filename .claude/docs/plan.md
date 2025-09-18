# 🎯 **OX Board - Complete Context for Claude Code**

## **PROJECT OVERVIEW**

**Product Name:** OX Board  
**Tagline:** "Throw Your Hands Up" - Gesture-Controlled DJ & Music Production Platform  
**Client:** Theta Chi Fraternity, University of Wisconsin-Madison  
**Developer:** You (the fraternity member building this)  
**Timeline:** 4-5 weeks to MVP  
**Budget:** $0 (using free tiers)  

**Core Vision:** Build a mind-blowing gesture-controlled DJ application that works with any laptop camera, allowing users to control music like a professional DJ using only hand gestures. This needs to be the most impressive tech project at UW-Madison, something that makes people say "holy shit" when they see it at parties.

## **TECHNICAL REQUIREMENTS**

### **Absolute Requirements**
- **NO Leap Motion** - Must use standard laptop/webcam cameras only
- **Browser-based** - Must work on any laptop with Chrome/Edge/Safari
- **Zero installation** - Users go to website and start immediately
- **Low latency** - Total system latency must be <50ms (gesture detection + audio processing)
- **Professional features** - Must rival Traktor/Serato DJ Pro in capabilities
- **Collaborative** - Multiple people can DJ together
- **Mobile responsive** - Should work on tablets/phones as secondary controllers

### **Performance Targets**
- Gesture tracking: 60 FPS minimum
- Audio latency: <20ms 
- Hand detection confidence: >90%
- CPU usage: <40% on 2020+ laptops
- Initial load time: <3 seconds
- Memory usage: <500MB

## **COMPLETE TECH STACK**

```yaml
Framework: Next.js 15.0.3 (App Router)
Language: TypeScript 5.6
UI Library: React 19
Styling: Tailwind CSS 3.4
Gesture Recognition: MediaPipe Hands 0.4.1675469404
Audio Engine: Tone.js 15.0.4
3D Graphics: Three.js r170
State Management: Zustand 5.0
Real-time: Socket.io 4.8
Deployment: Vercel (Free Tier)
Domain: oxboard.vercel.app (custom domain later)
Analytics: Vercel Analytics
Database: Vercel KV (Redis) for settings/presets
CDN: Vercel Edge Network
```

## **PROJECT STRUCTURE**

```
ox-board/
├── app/
│   ├── layout.tsx                    # Root layout with providers
│   ├── page.tsx                      # Main DJ interface
│   ├── globals.css                   # Tailwind + custom styles
│   ├── api/
│   │   ├── gesture/
│   │   │   └── route.ts             # MediaPipe processing endpoint
│   │   ├── audio/
│   │   │   ├── analyze/route.ts     # BPM/key detection
│   │   │   └── process/route.ts     # Audio effects processing
│   │   ├── collaborate/
│   │   │   └── route.ts             # WebRTC signaling server
│   │   └── presets/
│   │       └── route.ts             # Save/load gesture mappings
│   ├── components/
│   │   ├── Camera/
│   │   │   ├── CameraFeed.tsx       # Webcam video element
│   │   │   ├── HandOverlay.tsx      # Skeletal hand visualization
│   │   │   └── GestureIndicator.tsx # Shows active gestures
│   │   ├── DJ/
│   │   │   ├── DeckA.tsx            # Left turntable
│   │   │   ├── DeckB.tsx            # Right turntable
│   │   │   ├── Mixer.tsx            # 4-channel mixer
│   │   │   ├── Crossfader.tsx       # Crossfader component
│   │   │   └── EQ.tsx               # 3-band EQ per channel
│   │   ├── Effects/
│   │   │   ├── EffectsRack.tsx      # Main effects container
│   │   │   ├── Reverb.tsx           # Reverb effect
│   │   │   ├── Delay.tsx            # Delay effect
│   │   │   ├── Filter.tsx           # LP/HP/BP filter
│   │   │   ├── Flanger.tsx          # Flanger effect
│   │   │   └── Bitcrusher.tsx      # Bitcrusher effect
│   │   ├── Sampler/
│   │   │   ├── DrumPads.tsx         # 16-pad sampler
│   │   │   └── SampleBank.tsx       # Sample library
│   │   ├── Visualizer/
│   │   │   ├── Waveform.tsx         # Waveform display
│   │   │   ├── Spectrum.tsx         # Frequency analyzer
│   │   │   └── Particles.tsx        # Beat-reactive particles
│   │   ├── Controls/
│   │   │   ├── BPMDisplay.tsx       # BPM counter
│   │   │   ├── KeyDisplay.tsx       # Key detection
│   │   │   ├── LoopControls.tsx     # Loop in/out points
│   │   │   └── CuePoints.tsx        # Hot cue buttons
│   │   └── UI/
│   │       ├── Header.tsx           # App header with logo
│   │       ├── Footer.tsx           # Credits/links
│   │       ├── Settings.tsx         # Gesture calibration
│   │       └── Tutorial.tsx         # Onboarding overlay
│   ├── lib/
│   │   ├── audio/
│   │   │   ├── engine.ts            # Main audio engine
│   │   │   ├── effects.ts           # Effects processors
│   │   │   ├── analysis.ts          # BPM/key detection
│   │   │   └── mixer.ts             # Mixing algorithms
│   │   ├── gesture/
│   │   │   ├── detector.ts          # MediaPipe wrapper
│   │   │   ├── mappings.ts          # Gesture → control mappings
│   │   │   ├── smoothing.ts         # Kalman filter for jitter
│   │   │   └── recognition.ts       # Custom gesture patterns
│   │   ├── collaboration/
│   │   │   ├── webrtc.ts            # P2P connection manager
│   │   │   ├── sync.ts              # State synchronization
│   │   │   └── rooms.ts             # Session management
│   │   └── utils/
│   │       ├── constants.ts         # App constants
│   │       ├── types.ts             # TypeScript types
│   │       └── helpers.ts           # Utility functions
│   ├── hooks/
│   │   ├── useCamera.ts             # Camera access hook
│   │   ├── useGestures.ts           # Gesture detection hook
│   │   ├── useAudioContext.ts       # Web Audio context
│   │   ├── useKeyboard.ts           # Keyboard shortcuts
│   │   └── useCollaboration.ts      # Multi-user sync
│   ├── store/
│   │   ├── audioStore.ts            # Audio state (Zustand)
│   │   ├── gestureStore.ts          # Gesture settings
│   │   └── uiStore.ts               # UI preferences
│   └── styles/
│       ├── animations.css           # CSS animations
│       └── themes.css               # Theta Chi theme
├── public/
│   ├── samples/                     # Default sound library
│   │   ├── kicks/                   # Kick drums
│   │   ├── snares/                  # Snare drums
│   │   ├── hihats/                  # Hi-hats
│   │   └── fx/                      # Sound effects
│   ├── models/                      # MediaPipe models
│   └── images/                      # UI assets
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
├── next.config.js                   # Next.js config
├── tailwind.config.js               # Tailwind config
├── .env.local                       # Environment variables
└── README.md                        # Documentation
```

## **DETAILED FEATURE SPECIFICATIONS**

### **1. Gesture Recognition System**

```typescript
// Complete gesture mapping system
interface GestureMapping {
  // Two-hand gestures (highest priority)
  twoHands: {
    horizontalDistance: {
      control: 'crossfader',
      range: [0, 1],
      smoothing: 0.8,
      description: 'Move hands apart/together to crossfade'
    },
    verticalOffset: {
      control: 'eqBalance', 
      range: [-1, 1],
      description: 'One hand high, one low for EQ sweep'
    },
    rotation: {
      control: 'filterSweep',
      range: [20, 20000], // Hz
      description: 'Rotate both hands for filter'
    },
    push: {
      control: 'transform',
      description: 'Push forward to transform/build up'
    }
  },
  
  // Single hand gestures
  leftHand: {
    height: {
      control: 'deckA.volume',
      range: [0, 1],
      description: 'Raise/lower for volume'
    },
    tilt: {
      control: 'deckA.pitch',
      range: [-8, 8], // percentage
      description: 'Tilt hand for pitch bend'
    },
    pinch: {
      control: 'deckA.cuePoint',
      trigger: true,
      description: 'Pinch to set cue point'
    },
    fingerCount: {
      1: 'deckA.loop.1beat',
      2: 'deckA.loop.2beat',
      3: 'deckA.loop.4beat',
      4: 'deckA.loop.8beat',
      5: 'deckA.loop.16beat'
    },
    swipeLeft: {
      control: 'deckA.previousTrack',
      velocity: 0.5, // minimum swipe speed
    },
    swipeRight: {
      control: 'deckA.nextTrack',
      velocity: 0.5
    },
    scratch: {
      control: 'deckA.scratch',
      description: 'Back and forth motion for scratching'
    }
  },
  
  rightHand: {
    // Mirror of left hand for Deck B
    height: { control: 'deckB.volume' },
    tilt: { control: 'deckB.pitch' },
    pinch: { control: 'deckB.cuePoint' },
    // ... etc
  },
  
  // Special gestures
  special: {
    peaceSigns: {
      control: 'sync',
      description: 'Double peace signs to beat sync'
    },
    fistPump: {
      control: 'bassDrop',
      description: 'Pump fist for bass drop effect'
    },
    wave: {
      control: 'wobble',
      description: 'Wave motion for wobble bass'
    },
    clap: {
      control: 'airhorn',
      description: 'Clap to trigger airhorn'
    }
  }
}
```

### **2. Audio Engine Specifications**

```typescript
// Complete audio system architecture
interface AudioEngine {
  // Core components
  context: AudioContext; // 48kHz, 128 sample buffer
  
  // Dual deck system
  deckA: {
    source: MediaElementSource | BufferSource,
    gain: GainNode, // 0-1.5 (150% headroom)
    eq: {
      low: BiquadFilterNode,  // 20-250Hz, ±26dB
      mid: BiquadFilterNode,  // 250-4kHz, ±26dB
      high: BiquadFilterNode, // 4k-20kHz, ±26dB
    },
    filter: BiquadFilterNode, // Variable LP/HP/BP
    pitch: PlaybackRate, // 0.92x - 1.08x (±8%)
    outputs: {
      main: GainNode,
      cue: GainNode
    }
  },
  
  deckB: {
    // Identical to deckA
  },
  
  // Mixer
  mixer: {
    crossfader: {
      position: number, // -1 (A) to 1 (B)
      curve: 'linear' | 'scratch' | 'smooth',
    },
    channels: [
      { gain: 0-1.5, mute: boolean, solo: boolean },
      { gain: 0-1.5, mute: boolean, solo: boolean },
      { gain: 0-1.5, mute: boolean, solo: boolean },
      { gain: 0-1.5, mute: boolean, solo: boolean }
    ],
    master: {
      gain: GainNode,
      limiter: DynamicsCompressorNode,
      output: AudioDestinationNode
    }
  },
  
  // Effects chain (send/return)
  effects: {
    reverb: ConvolverNode,
    delay: DelayNode + FeedbackGain,
    flanger: DelayNode + LFO,
    phaser: AllPassFilters[4],
    bitcrusher: WaveShaperNode,
    filter: BiquadFilterNode,
    compressor: DynamicsCompressorNode,
    gate: CustomProcessor
  },
  
  // Analysis
  analysis: {
    bpm: OfflineAudioContext, // Onset detection
    key: FFT + ChromaVector,   // Key detection
    spectrum: AnalyserNode,     // Frequency display
    waveform: AnalyserNode,     // Time domain
    peakMeter: CustomWorklet    // Peak detection
  },
  
  // Sampler (16 pads)
  sampler: {
    pads: Array(16).fill({
      buffer: AudioBuffer,
      gain: GainNode,
      pitch: PlaybackRate,
      reverse: boolean,
      loop: boolean,
      choke: number // Choke group
    })
  }
}
```

### **3. UI/UX Specifications**

```typescript
// Complete UI component specifications
interface UIComponents {
  // Main layout (1920x1080 optimized, responsive)
  layout: {
    header: {
      height: '60px',
      logo: 'OX Board logo (left)',
      status: 'Camera/audio status (center)',
      settings: 'Settings gear (right)'
    },
    
    mainArea: {
      // Top section - Camera view
      cameraSection: {
        height: '30vh',
        videoFeed: 'Mirrored webcam',
        handOverlay: 'Skeletal hands',
        gestureIndicators: 'Active gesture labels'
      },
      
      // Middle section - Decks
      decksSection: {
        height: '40vh',
        deckA: {
          width: '45%',
          turntable: '3D animated vinyl',
          pitch: 'Pitch fader ±8%',
          waveform: 'Scrolling waveform',
          bpm: 'BPM display',
          key: 'Key display',
          cuePoints: '8 hot cues',
          loopControls: 'In/out/length'
        },
        mixer: {
          width: '10%',
          crossfader: 'Vertical fader',
          upfaders: '2 channel faders',
          eq: '3-band EQ knobs x2',
          gain: 'Gain knobs x2',
          vumeter: 'LED meter'
        },
        deckB: {
          // Mirror of deckA
        }
      },
      
      // Bottom section - Effects & Sampler
      bottomSection: {
        height: '30vh',
        effects: {
          width: '50%',
          slots: '6 effect slots',
          wetDry: 'Mix knobs',
          parameters: '3 params per effect'
        },
        sampler: {
          width: '50%',
          pads: '4x4 grid',
          banks: '4 banks (A-D)',
          volume: 'Per-pad volume'
        }
      }
    }
  },
  
  // Visual theme
  theme: {
    colors: {
      primary: '#FF0000',     // Theta Chi red
      secondary: '#FFFFFF',   // White
      background: '#0A0A0A',  // Near black
      surface: '#1A1A1A',     // Dark gray
      accent: '#FFD700',      // Gold accents
      success: '#00FF00',     // Green (active)
      warning: '#FF8C00',     // Orange (warning)
      error: '#FF0044'        // Red (error)
    },
    fonts: {
      display: 'Orbitron',    // Futuristic
      body: 'Inter',          // Clean
      mono: 'JetBrains Mono' // Code
    },
    animations: {
      gestureTrails: 'Particle trails',
      beatPulse: 'UI pulses on beat',
      scratchWave: 'Vinyl scratch visual',
      dropEffect: 'Bass drop screen shake'
    }
  }
}
```

### **4. MediaPipe Configuration**

```javascript
// Exact MediaPipe setup
const handsConfig = {
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
  }
};

const hands = new Hands(handsConfig);

hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,      // 0=Lite, 1=Full (use 1)
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.5,
  selfieMode: true,        // Mirror image
});

// Camera settings
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: 1280,
  height: 720,
  facingMode: 'user'
});

// Landmark indices for key points
const LANDMARK_INDICES = {
  WRIST: 0,
  THUMB_TIP: 4,
  INDEX_TIP: 8,
  MIDDLE_TIP: 12,
  RING_TIP: 16,
  PINKY_TIP: 20
};
```

### **5. Collaboration Features**

```typescript
// Real-time collaboration system
interface CollaborationSystem {
  // Session management
  session: {
    id: string,          // Unique session ID
    host: string,        // Host user ID
    participants: User[], // Up to 4 DJs
    mode: 'takeTurns' | 'split' | 'battle',
    startTime: Date
  },
  
  // WebRTC configuration
  webrtc: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'turn:relay.metered.ca:80' } // Backup
    ],
    configuration: {
      iceTransportPolicy: 'all',
      bundlePolicy: 'balanced',
      rtcpMuxPolicy: 'require'
    }
  },
  
  // Synchronized state
  sharedState: {
    bpm: number,
    beatGrid: Float32Array,
    crossfaderPosition: number,
    effectsSettings: Object,
    currentTracks: {
      deckA: TrackInfo,
      deckB: TrackInfo
    }
  },
  
  // Roles
  roles: {
    dj1: 'deckA',      // Controls deck A
    dj2: 'deckB',      // Controls deck B
    dj3: 'effects',    // Controls effects
    dj4: 'sampler'     // Controls sampler
  }
}
```

## **DEPLOYMENT CONFIGURATION**

```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['cdn.jsdelivr.net'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
};

// vercel.json
{
  "functions": {
    "app/api/audio/analyze/route.ts": {
      "maxDuration": 10
    }
  },
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ]
}
```

## **ENVIRONMENT VARIABLES**

```bash
# .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:3000
NEXT_PUBLIC_MEDIAPIPE_VERSION=0.4.1675469404

# Vercel KV (Redis)
KV_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=

# Analytics (optional)
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=

# Spotify Integration (future)
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
```

## **PACKAGE.JSON DEPENDENCIES**

```json
{
  "name": "ox-board",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "15.0.3",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "@mediapipe/hands": "^0.4.1675469404",
    "@mediapipe/camera_utils": "^0.3.1675466862",
    "tone": "^15.0.4",
    "three": "^0.170.0",
    "@react-three/fiber": "^8.17.10",
    "@react-three/drei": "^9.117.3",
    "zustand": "^5.0.1",
    "socket.io": "^4.8.1",
    "socket.io-client": "^4.8.1",
    "@vercel/kv": "^2.0.0",
    "framer-motion": "^11.11.17",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.5"
  },
  "devDependencies": {
    "@types/node": "^22.10.1",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/three": "^0.170.0",
    "typescript": "^5.6.3",
    "tailwindcss": "^3.4.15",
    "postcss": "^8.4.49",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.17.0",
    "eslint-config-next": "15.0.3"
  }
}
```

## **IMPLEMENTATION PRIORITIES**

### **Phase 1: Core Foundation (Days 1-7)**
1. Next.js project setup with TypeScript
2. MediaPipe hand tracking integration
3. Basic gesture detection (hands distance for crossfader)
4. Tone.js audio engine with two decks
5. Basic UI with Tailwind CSS

### **Phase 2: DJ Features (Days 8-14)**
6. Complete gesture mapping system
7. All DJ controls (EQ, filters, loops, cues)
8. BPM detection and beat matching
9. Effects rack implementation
10. Waveform visualization

### **Phase 3: Polish (Days 15-21)**
11. 3D turntable animations with Three.js
12. Particle effects and visualizers
13. Gesture smoothing and calibration
14. Performance optimization
15. Mobile responsive design

### **Phase 4: Advanced (Days 22-28)**
16. WebRTC collaboration
17. Preset saving/loading
18. Sampler with custom sounds
19. Spotify/SoundCloud integration
20. Tutorial and onboarding

### **Phase 5: Launch (Days 29-35)**
21. Testing with fraternity
22. Bug fixes and optimization
23. Deploy to Vercel
24. Custom domain setup
25. Launch party at Theta Chi

## **CRITICAL SUCCESS FACTORS**

1. **Performance**: Must maintain 60 FPS during gesture tracking
2. **Latency**: Audio response must be <20ms from gesture
3. **Accuracy**: Gesture recognition must be >90% accurate
4. **Reliability**: No crashes during 2-hour DJ sessions
5. **Accessibility**: Must work on any 2020+ laptop with webcam
6. **Impressiveness**: UI must look professional and futuristic

## **TESTING REQUIREMENTS**

```typescript
// Test scenarios that must pass
const testScenarios = [
  'Single user can DJ for 30 minutes without issues',
  'Crossfader responds smoothly to hand distance',
  'BPM detection accurate within ±1 BPM',
  'All effects work without audio glitches',
  'Two users can collaborate in real-time',
  'Works on Windows, Mac, and Linux',
  'Works in Chrome, Edge, Safari, Firefox',
  'Mobile version works as controller',
  'CPU usage stays under 40%',
  'Memory usage stays under 500MB'
];
```

## **BRANDING GUIDELINES**

- **Name**: OX Board (Theta Chi reference)
- **Logo**: Futuristic "OX" with hand gesture incorporated
- **Colors**: Red (#FF0000), White (#FFFFFF), Black (#0A0A0A)
- **Fonts**: Orbitron (headers), Inter (body)
- **Tone**: Professional but fun, impressive but approachable
- **Easter Eggs**: Hidden Theta Chi chants/sounds in sampler

## **COMMANDS FOR CLAUDE CODE**

```bash
# Initial setup
"Create a Next.js 15 app with TypeScript named ox-board with Tailwind CSS, app router, and all the specified folder structure"

# Core implementation
"Implement the complete MediaPipe hand tracking system in app/components/Camera/CameraFeed.tsx with the exact configuration specified"

"Create the dual deck audio system using Tone.js in app/lib/audio/engine.ts with all specifications from the audio engine interface"

"Build the gesture mapping system in app/lib/gesture/mappings.ts that maps hand positions to DJ controls as specified"

"Create the complete DJ interface in app/page.tsx with all components as specified in the UI layout"

# Deployment
"Set up Vercel deployment configuration with all environment variables and deploy to production"
```

## **SUCCESS METRICS**

- Launch party has 100+ people using it
- Goes viral on UW-Madison social media
- Other fraternities ask for the app
- At least one "holy shit this is amazing" per demo
- Becomes the standard DJ tool at Theta Chi parties
- You become known as "the guy who built OX Board"

---
