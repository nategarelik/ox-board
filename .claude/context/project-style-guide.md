---
created: 2025-09-13T21:07:43Z
last_updated: 2025-09-13T21:07:43Z
version: 1.0
author: Claude Code PM System
---

# Project Style Guide

## Code Style Standards

### TypeScript Configuration
```typescript
// Strict mode is ENABLED
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "strictFunctionTypes": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitReturns": true
}
```

### File Naming Conventions

#### Components
```
✅ DJDeck.tsx          // PascalCase for components
✅ GestureIndicator.tsx
❌ dj-deck.tsx         // Don't use kebab-case
❌ djDeck.tsx          // Don't use camelCase
```

#### Utilities & Hooks
```
✅ useGesture.ts        // camelCase with 'use' prefix for hooks
✅ gestureDetector.ts  // camelCase for utilities
✅ audioEngine.ts
❌ GestureDetector.ts  // Don't use PascalCase for utilities
```

#### Types & Interfaces
```
✅ Gesture.types.ts    // PascalCase with .types.ts
✅ IAudioEngine.ts     // Interface with 'I' prefix
✅ TDeckState.ts       // Type with 'T' prefix
❌ gesture-types.ts    // Don't use kebab-case
```

#### Constants
```
✅ constants.ts
✅ config.ts

// Inside files:
const MAX_VOLUME = 100;        // UPPER_SNAKE_CASE
const DEFAULT_BPM = 120;
```

### Directory Structure
```
app/
├── components/       // Grouped by feature
│   ├── deck/        // Feature folder
│   │   ├── DJDeck.tsx
│   │   ├── DJDeck.module.css  // Co-located styles
│   │   └── DJDeck.test.tsx     // Co-located tests
│   └── shared/      // Shared components
├── lib/             // Business logic
├── hooks/           // Custom React hooks
├── types/           // TypeScript definitions
└── styles/          // Global styles only
```

## React/Next.js Patterns

### Component Structure
```typescript
// 1. Imports (organized)
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { DeckProps } from '@/types/deck.types';
import { DJDeck } from '@/components/deck/DJDeck';
import styles from './Component.module.css';

// 2. Type definitions
interface ComponentProps {
  title: string;
  onAction: (value: number) => void;
}

// 3. Component definition
export const Component: React.FC<ComponentProps> = ({
  title,
  onAction
}) => {
  // 4. Hooks first
  const router = useRouter();
  const [state, setState] = useState(0);

  // 5. Effects
  useEffect(() => {
    // Effect logic
  }, []);

  // 6. Handlers
  const handleClick = () => {
    onAction(state);
  };

  // 7. Render
  return (
    <div className={styles.container}>
      {title}
    </div>
  );
};

// 8. Default export if needed
export default Component;
```

### Hook Patterns
```typescript
// Custom hook with proper typing
export const useGesture = (callback: (gesture: Gesture) => void) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Hook logic
  }, [callback]);

  return { isReady, error };
};
```

### State Management (Zustand)
```typescript
// Store definition
interface AudioStore {
  // State
  volume: number;
  isPlaying: boolean;

  // Actions (always prefixed with set/update/toggle)
  setVolume: (volume: number) => void;
  togglePlayback: () => void;
  updateBPM: (bpm: number) => void;
}

// Store implementation
export const useAudioStore = create<AudioStore>((set) => ({
  volume: 50,
  isPlaying: false,

  setVolume: (volume) => set({ volume }),
  togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),
  updateBPM: (bpm) => set({ bpm }),
}));
```

## CSS/Styling Guidelines

### Tailwind Classes Order
```tsx
// Order: Layout → Spacing → Typography → Colors → Effects
<div className="
  flex flex-col items-center justify-center
  p-4 m-2
  text-lg font-bold
  text-white bg-theta-red
  rounded-lg shadow-lg hover:shadow-xl
  transition-all duration-200
">
```

### Theme Colors (Theta Chi)
```css
/* Always use theme colors from config */
.primary { @apply bg-theta-red; }      /* #CE1126 */
.secondary { @apply bg-theta-gold; }   /* #FFD700 */
.accent { @apply bg-theta-dark; }      /* #1a1a1a */

/* Never hardcode colors */
❌ background-color: #CE1126;
✅ @apply bg-theta-red;
```

### Component Styling Priority
1. Tailwind utility classes (preferred)
2. CSS Modules for complex styles
3. Inline styles only for dynamic values

```tsx
// Good: Tailwind for static styles
<div className="flex p-4 bg-theta-dark">

// Good: Inline for dynamic values
<div style={{ transform: `translateX(${position}px)` }}>

// Bad: Inline for static styles
<div style={{ display: 'flex', padding: '1rem' }}>
```

## TypeScript Best Practices

### Type vs Interface
```typescript
// Use interface for objects that can be extended
interface User {
  id: string;
  name: string;
}

// Use type for unions, tuples, and aliases
type GestureType = 'swipe' | 'pinch' | 'rotate';
type Coordinate = [number, number];
type ID = string | number;
```

### Avoid 'any'
```typescript
❌ const processData = (data: any) => { }
✅ const processData = (data: unknown) => { }
✅ const processData = <T>(data: T) => { }
✅ const processData = (data: AudioData) => { }
```

### Proper Typing
```typescript
// Props with children
interface Props {
  children: React.ReactNode;
  title?: string;  // Optional props marked clearly
}

// Event handlers
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => { }
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { }

// Async functions
const fetchData = async (): Promise<Data[]> => { }
```

## Import Organization

### Import Order
```typescript
// 1. React/Next
import React from 'react';
import { useRouter } from 'next/navigation';

// 2. Third-party libraries
import { Hands } from '@mediapipe/hands';
import * as Tone from 'tone';

// 3. Internal absolute imports
import { DJDeck } from '@/components/deck/DJDeck';
import { useGesture } from '@/hooks/useGesture';

// 4. Relative imports
import { LocalComponent } from './LocalComponent';

// 5. Style imports
import styles from './Component.module.css';

// 6. Type imports (always last)
import type { DeckProps } from '@/types/deck.types';
```

### Path Aliases
```typescript
// Always use path aliases for non-relative imports
✅ import { Component } from '@/components/Component';
❌ import { Component } from '../../../components/Component';

// Relative imports only for same directory
✅ import { helper } from './helper';
```

## Git Commit Conventions

### Commit Message Format
```
type(scope): subject

body (optional)

footer (optional)
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

### Examples
```bash
feat(gesture): add swipe left/right detection
fix(audio): resolve latency issue in Chrome
docs(readme): update installation instructions
refactor(deck): optimize waveform rendering
```

## Comments & Documentation

### Comment Style
```typescript
// Single line comments for brief explanations
const volume = 50; // Default volume at 50%

/**
 * Multi-line comments for functions
 * @param gesture - The detected gesture object
 * @returns Mapped audio command
 */
function mapGesture(gesture: Gesture): AudioCommand {
  // Implementation
}

/* Avoid block comments for code */
```

### JSDoc for Public APIs
```typescript
/**
 * Initializes the audio engine with configuration
 * @param {EngineConfig} config - Engine configuration
 * @throws {Error} If audio context cannot be created
 * @returns {Promise<AudioEngine>} Initialized engine
 * @example
 * const engine = await initAudioEngine({ sampleRate: 48000 });
 */
export async function initAudioEngine(config: EngineConfig): Promise<AudioEngine> {
  // Implementation
}
```

## Error Handling

### Error Patterns
```typescript
// Use Error Boundaries for React components
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Component error:', error, errorInfo);
  }
}

// Use try-catch for async operations
try {
  const result = await riskyOperation();
} catch (error) {
  if (error instanceof SpecificError) {
    // Handle specific error
  } else {
    // Handle generic error
    console.error('Unexpected error:', error);
  }
}

// Always type errors
const handleError = (error: Error | unknown) => {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error('Unknown error:', error);
  }
};
```

## Performance Guidelines

### React Optimization
```typescript
// Use React.memo for expensive components
export const ExpensiveComponent = React.memo(({ data }) => {
  // Component logic
});

// Use useMemo for expensive calculations
const processedData = useMemo(() => {
  return expensiveProcessing(data);
}, [data]);

// Use useCallback for stable function references
const handleGesture = useCallback((gesture: Gesture) => {
  // Handler logic
}, [dependency]);
```

### Code Splitting
```typescript
// Dynamic imports for large libraries
const MediaPipe = dynamic(() => import('@mediapipe/hands'), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});
```

## Testing Standards

### Test File Naming
```
Component.tsx → Component.test.tsx
useHook.ts → useHook.test.ts
utility.ts → utility.test.ts
```

### Test Structure
```typescript
describe('Component', () => {
  beforeEach(() => {
    // Setup
  });

  it('should render correctly', () => {
    // Test
  });

  it('should handle user interaction', () => {
    // Test
  });

  afterEach(() => {
    // Cleanup
  });
});
```

## Accessibility Standards

### ARIA Labels
```tsx
<button
  aria-label="Play track"
  aria-pressed={isPlaying}
  onClick={handlePlay}
>
  <PlayIcon />
</button>
```

### Keyboard Navigation
```tsx
// Always provide keyboard alternatives
<div
  role="slider"
  tabIndex={0}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuenow={volume}
  onKeyDown={handleKeyDown}
/>
```

## Do's and Don'ts

### Do's
- ✅ Use TypeScript strict mode
- ✅ Write self-documenting code
- ✅ Keep components small and focused
- ✅ Use proper error boundaries
- ✅ Test edge cases
- ✅ Optimize for performance
- ✅ Follow accessibility guidelines

### Don'ts
- ❌ Use `any` type
- ❌ Ignore TypeScript errors
- ❌ Write large monolithic components
- ❌ Hardcode values
- ❌ Skip error handling
- ❌ Ignore console warnings
- ❌ Use inline styles for static values