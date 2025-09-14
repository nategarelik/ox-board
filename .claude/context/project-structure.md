---
created: 2025-09-13T21:07:43Z
last_updated: 2025-09-14T06:12:50Z
version: 1.1
author: Claude Code PM System
---

# Project Structure

## Directory Organization

```
ox-board/
├── .claude/                    # Project management and documentation
│   ├── agents/                 # AI agent configurations
│   ├── commands/               # Custom command scripts
│   ├── context/                # Project context documentation
│   ├── epics/                  # Epic decomposition and tasks
│   │   └── analyze-the-entire-project.../
│   │       ├── epic.md         # Epic definition
│   │       ├── 001-010.md      # Individual task files
│   │       ├── 9-comprehensive-analysis.md  # Full project analysis
│   │       └── 10-implementation-summary.md # Implementation results
│   ├── prds/                   # Product requirement documents
│   ├── rules/                  # Development rules and guidelines
│   └── scripts/                # Utility scripts
│
├── app/                        # Next.js 15 app router directory
│   ├── components/             # React components (NEW)
│   │   ├── Camera/
│   │   │   └── CameraFeed.tsx # MediaPipe hand tracking
│   │   ├── DJ/
│   │   │   ├── Deck.tsx       # DJ deck component
│   │   │   └── Mixer.tsx      # Mixer interface
│   │   └── ErrorBoundary.tsx  # Error handling component
│   ├── hooks/                  # Custom React hooks (NEW)
│   │   └── useGestures.ts     # Gesture processing hook
│   ├── lib/                    # Utility libraries (NEW)
│   │   ├── audio/
│   │   │   └── mixer.ts       # AudioMixer class implementation
│   │   └── gesture/
│   │       └── smoothing.ts   # Kalman filter implementation
│   ├── stores/                 # State management (NEW)
│   │   └── djStore.ts         # Zustand store for DJ state
│   ├── layout.tsx              # Root layout with error boundary
│   ├── page.tsx                # Main DJ interface page
│   └── globals.css             # Global styles and Tailwind
│
├── public/                     # Static assets (currently empty)
│
├── Configuration Files
│   ├── next.config.js          # Next.js config (CORS relaxed)
│   ├── tailwind.config.js      # Tailwind with Theta Chi theme
│   ├── tsconfig.json           # TypeScript strict configuration
│   ├── postcss.config.js       # PostCSS for Tailwind
│   ├── package.json            # Dependencies and scripts
│   └── .eslintrc.json          # ESLint configuration
│
└── Documentation
    ├── README.md               # Basic project readme
    ├── REQUIREMENTS.md         # OLD: Collaboration board specs
    └── plan.md                 # CURRENT: DJ platform vision
```

## File Naming Patterns

### TypeScript/React Files
- Components: PascalCase (e.g., `DJDeck.tsx`, `GestureIndicator.tsx`)
- Hooks: camelCase with 'use' prefix (e.g., `useGestures.ts`)
- Utilities: camelCase (e.g., `smoothing.ts`, `mixer.ts`)
- Stores: camelCase with 'Store' suffix (e.g., `djStore.ts`)
- Types: PascalCase for interfaces/types

### Documentation
- Markdown files: kebab-case (e.g., `project-structure.md`)
- Epic tasks: numbered format (e.g., `001-gesture-detection.md`)
- Analysis docs: numbered with descriptive name (e.g., `9-comprehensive-analysis.md`)

## Module Organization

### Core Modules

#### `/app/components`
- **Camera/**: MediaPipe integration components
- **DJ/**: DJ interface components (Deck, Mixer, Effects)
- **ErrorBoundary.tsx**: Application-wide error handling

#### `/app/hooks`
- **useGestures**: Hand tracking and gesture processing
- Future: useAudio, useMIDI, useKeyboard

#### `/app/lib`
- **audio/**: Audio processing utilities (mixer, effects)
- **gesture/**: Gesture processing (smoothing, detection)
- Future: visualization/, recording/

#### `/app/stores`
- **djStore**: Central state management for DJ controls
- Future: trackStore, presetStore, sessionStore

## Import Patterns

### Absolute Imports
```typescript
// From any file
import { AudioMixer } from '@/app/lib/audio/mixer'
import useDJStore from '@/app/stores/djStore'
import { useGestures } from '@/app/hooks/useGestures'
```

### Component Imports
```typescript
// Dynamic imports for code splitting
const CameraFeed = dynamic(() => import('./components/Camera/CameraFeed'), { ssr: false })
const Mixer = dynamic(() => import('./components/DJ/Mixer'), { ssr: false })
```

## Key Files

### Entry Points
- `app/page.tsx` - Main application page
- `app/layout.tsx` - Root layout with providers

### Core Logic
- `app/lib/audio/mixer.ts` - 4-channel audio mixer
- `app/hooks/useGestures.ts` - Gesture detection hook
- `app/stores/djStore.ts` - Application state

### Components
- `app/components/Camera/CameraFeed.tsx` - Camera and hand tracking
- `app/components/ErrorBoundary.tsx` - Error handling
- `app/page.tsx` - Main DJ interface

## Build Outputs

### Development
```
.next/
├── cache/              # Build cache
├── server/             # Server-side code
└── static/             # Static assets
```

### Production
```
.next/
├── standalone/         # Standalone server
├── static/             # Static assets
└── BUILD_ID            # Build identifier
```

## Configuration Files

### Essential Configs
- `next.config.js` - Framework configuration
- `tsconfig.json` - TypeScript settings
- `tailwind.config.js` - Styling configuration
- `package.json` - Dependencies and scripts

### Development Configs
- `.eslintrc.json` - Code quality rules
- `postcss.config.js` - CSS processing
- `.gitignore` - Version control exclusions

## Static Assets
Currently empty, will contain:
- Audio samples for testing
- Tutorial videos
- Icon assets
- Font files

## Data Flow

```
User Gestures → MediaPipe → useGestures Hook → DJ Store → Components
                                ↓
                          Kalman Filter
                                ↓
                          Control Values → Audio Mixer → Tone.js → Audio Output
```

## Module Dependencies

```
page.tsx
├── components/CameraFeed
│   └── @mediapipe/hands
├── hooks/useGestures
│   └── lib/gesture/smoothing
├── stores/djStore
│   └── zustand
└── lib/audio/mixer
    └── tone.js
```

## Recent Structural Changes
- Added `/app/components` directory with Camera and DJ subdirectories
- Created `/app/hooks` for custom React hooks
- Added `/app/lib` for utility libraries
- Created `/app/stores` for Zustand state management
- Updated next.config.js to relax CORS headers

## Update History
- 2025-09-14: Added new directories for components, hooks, lib, and stores after epic implementation