# AGENTS.md - OX Board AI Assistant Guidance

## CRITICAL NON-OBVIOUS PATTERNS

### Audio Context Management

- **Two-stage initialization required**: AudioService.getInstance() → initializeOnUserGesture() (browser autoplay policy)
- **Singleton enforcement critical**: Multiple Web Audio contexts break everything - always use getAudioService()
- **Tone.js version locked**: DO NOT upgrade Tone.js - version pinned for audio stability

### Testing Audio Code

- **Use toneMock.ts**: 434-line mock required - don't create simple mocks for Tone.js
- **Jest transform pattern**: `"^tone$": "<rootDir>/tests/__mocks__/toneMock.ts"` handles Tone.js imports
- **80% coverage enforced**: Branches, functions, lines, statements all require 80%+

### MediaPipe Security

- **SRI hashes required**: MediaPipe CDN uses Subresource Integrity - update hashes when upgrading
- **Version pinned**: `0.4.1675469619` specifically - don't use "latest"
- **CORS headers relaxed**: COEP/COOP removed in next.config.js for MediaPipe compatibility

### Performance Gotchas

- **Volume change throttling**: setStemVolume ignores changes < 0.01 to prevent update storms
- **Gesture processing**: 60fps throttled (16ms intervals) with 50ms latency target
- **Web Workers mandatory**: Music analysis (BPM, key) must run in workers or blocks main thread

### State Management

- **Zustand with devtools**: Always use devtools middleware - no plain Zustand
- **Gesture latency tracking**: Real-time monitoring built into store - use existing infrastructure

### Build Configuration

- **Next.js 15 optimizations**: Don't add custom webpack splitChunks - use built-in optimizations
- **Dynamic imports for audio**: Heavy audio/WebGL components need `ssr: false` and dynamic loading

## ESSENTIAL COMMANDS

```bash
npm test -- --testNamePattern="name"   # Run specific test
npm run test:coverage                  # Generate coverage report
npm run type-check                     # TypeScript validation
```

## INCORPORATE ALL CLAUDE.MD RULES

See CLAUDE.md for complete guidance - all rules apply.
