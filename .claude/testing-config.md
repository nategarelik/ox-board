---
framework: jest
test_command: npm test
created: 2025-09-16T10:45:00Z
---

# Testing Configuration - ox-board-ai

## Framework
- Type: Jest
- Version: 30.1.2
- Config File: jest.config.js
- Alternative Config: jest.config.simple.js

## Test Structure
- Test Directory: app/**/__tests__
- Test Files: 18 files found
- Naming Pattern: *.test.ts, *.test.tsx
- Test Helpers: jest.setup.js

## Commands
- Run All Tests: `npm test`
- Run Specific Test: `npm test -- {test_file}`
- Run with Coverage: `npm test -- --coverage`
- Run with Watch: `npm test -- --watch`
- Run with Debugging: `npm test -- --verbose --no-coverage --runInBand`

## Environment
- Test Environment: jsdom
- Node Version: As per system
- TypeScript: ts-jest configured
- React Testing Library: @testing-library/react@16.3.0

## Test Files Located
```
./app/components/AI/__tests__/
  - CompatibilityVisualizer.test.tsx
  - MixRecommendationsPanel.test.tsx
./app/components/__tests__/
  - GestureFeedback.test.tsx
  - StemControls.test.tsx
  - StemVisualizerPanel.test.tsx
  - StemWaveform.test.tsx
./app/hooks/__tests__/
  - useGestureStemMapping.test.ts
./app/lib/ai/__tests__/
  - mixAssistant.test.ts
./app/lib/audio/__tests__/
  - demucsProcessor.test.ts
  - enhancedMixer.test.ts
  - stemEffects.test.ts
  - stemPlayer.test.ts
./app/lib/gestures/__tests__/
  - gestureStemMapper.test.ts
./app/lib/visualization/__tests__/
  - stemVisualizer.test.ts
./app/stores/__tests__/
  - enhancedDjStore.test.ts
  - enhancedDjStoreWithGestures.test.ts
```

## Test Runner Agent Configuration
- Use verbose output for debugging
- Run tests sequentially (--runInBand)
- Capture full stack traces
- No mocking - use real implementations where possible
- Wait for each test to complete
- Report detailed failure analysis

## Module Resolution
- Base URL: Project root
- Aliases configured:
  - @/ → Project root
  - @/components → app/components
  - @/lib → app/lib
  - @/stores → app/stores

## Coverage Settings
- Collect from: app/**/*.{ts,tsx}
- Exclude: *.d.ts files, __tests__ directories
- Minimum thresholds: Not configured