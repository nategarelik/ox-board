---
created: 2025-09-13T21:07:43Z
last_updated: 2025-09-13T21:07:43Z
version: 1.0
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
│   │       └── 001-010.md      # Individual task files
│   ├── prds/                   # Product requirement documents
│   ├── rules/                  # Development rules and guidelines
│   └── scripts/                # Utility scripts
│
├── app/                        # Next.js 15 app router directory
│   ├── layout.tsx              # Root layout with metadata
│   ├── page.tsx                # Home page with basic UI
│   └── globals.css             # Global styles and Tailwind
│
├── public/                     # Static assets (currently empty)
│
├── Configuration Files
│   ├── next.config.js          # Next.js configuration with CORS
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
- Utilities: camelCase (e.g., `gestureDetector.ts`, `audioEngine.ts`)
- Types: PascalCase with `.types.ts` (e.g., `Gesture.types.ts`)
- Hooks: camelCase with `use` prefix (e.g., `useGesture.ts`)

### Configuration Files
- Root level with lowercase and hyphens
- Standard naming (package.json, tsconfig.json, etc.)

### Documentation
- Markdown files with kebab-case
- Context files with descriptive names

## Module Organization (Planned)

```
app/
├── components/              # Reusable UI components
│   ├── camera/             # Camera and MediaPipe components
│   │   ├── CameraFeed.tsx
│   │   └── HandOverlay.tsx
│   ├── deck/               # DJ deck components
│   │   ├── DJDeck.tsx
│   │   ├── Waveform.tsx
│   │   └── BPMCounter.tsx
│   ├── mixer/              # Mixer controls
│   │   ├── Crossfader.tsx
│   │   ├── EQKnobs.tsx
│   │   └── VolumeSlider.tsx
│   └── gesture/            # Gesture feedback
│       └── GestureIndicator.tsx
│
├── lib/                     # Core libraries
│   ├── gesture/            # Gesture detection
│   │   ├── detector.ts
│   │   ├── mappings.ts
│   │   └── smoothing.ts
│   ├── audio/              # Audio engine
│   │   ├── engine.ts
│   │   ├── effects.ts
│   │   └── mixer.ts
│   └── store/              # Zustand stores
│       ├── audioStore.ts
│       └── gestureStore.ts
│
├── hooks/                   # Custom React hooks
│   ├── useCamera.ts
│   ├── useGesture.ts
│   └── useAudioEngine.ts
│
├── types/                   # TypeScript type definitions
│   ├── gesture.types.ts
│   ├── audio.types.ts
│   └── deck.types.ts
│
├── api/                     # API routes
│   ├── tracks/             # Track management
│   ├── sessions/           # Session recording
│   └── presets/            # Gesture presets
│
└── styles/                  # Additional styles
    └── animations.css       # Custom animations
```

## Key Directories

### Currently Implemented
- **app/**: Basic Next.js app router setup with minimal pages
- **.claude/**: Comprehensive project management structure

### Not Yet Implemented
- **components/**: No component structure created
- **lib/**: Core functionality not implemented
- **hooks/**: No custom hooks
- **api/**: No API routes
- **public/**: No static assets
- **tests/**: No test directory

## Import Patterns

### Current
```typescript
// Globals
import './globals.css'

// React/Next
import type { Metadata } from 'next'
```

### Planned
```typescript
// Absolute imports (configured in tsconfig)
import { DJDeck } from '@/components/deck/DJDeck'
import { useGesture } from '@/hooks/useGesture'
import { AudioEngine } from '@/lib/audio/engine'

// Relative imports for same module
import { Waveform } from './Waveform'
```

## Build Output

### Development
- `.next/`: Next.js build cache (gitignored)
- `node_modules/`: Dependencies (gitignored)

### Production (not configured)
- `out/`: Static export directory
- `.vercel/`: Vercel build output

## Configuration Files

### Next.js (`next.config.js`)
- Strict mode enabled
- CORS headers configured for MediaPipe
- No custom webpack config yet

### TypeScript (`tsconfig.json`)
- Strict mode enabled
- Target: ES2017
- Module: ESNext
- Path aliases configured (@/*)

### Tailwind (`tailwind.config.js`)
- Custom Theta Chi color scheme
- Inter and Bebas Neue fonts
- Dark mode support ready

## Missing Structure

### Required Directories to Create
1. `app/components/` - UI components
2. `app/lib/` - Core business logic
3. `app/hooks/` - React hooks
4. `app/types/` - TypeScript types
5. `app/api/` - API routes
6. `public/audio/` - Sample tracks
7. `tests/` - Test files

### Required Files to Create
1. `.env.local` - Environment variables
2. `jest.config.js` - Test configuration
3. `docker-compose.yml` - Container setup (optional)

## File Size Concerns

### Large Dependencies
- `three`: 3D graphics library
- `@mediapipe/hands`: ML models
- `tone`: Audio synthesis

### Bundle Optimization Needed
- Code splitting not configured
- No dynamic imports implemented
- No tree shaking optimization