---
created: 2025-09-13T21:07:43Z
last_updated: 2025-09-14T17:18:45Z
version: 1.1
author: Claude Code PM System
---

# Technology Context

## Core Stack

### Framework
- **Next.js**: 15.0.3 (latest version, app router)
- **React**: 19.0.0 (resolved from 18.2.0 conflict)
- **TypeScript**: 5.7.2 (strict mode enabled)

### Styling
- **Tailwind CSS**: 3.4.17
- **PostCSS**: 8.x with autoprefixer
- **CSS Modules**: Supported but not used

### Development Tools
- **ESLint**: 9.x configured
- **Node.js**: Required (version unspecified)
- **npm**: Package manager

## Dependencies Analysis

### Audio & Music
```json
"tone": "^15.0.4"                    // Audio synthesis engine - NOT INTEGRATED
```
**Purpose**: Professional web audio, effects, synthesizers
**Status**: Installed but completely unused
**Integration**: Required for all DJ functionality

### Hand Tracking & Computer Vision
```json
"@mediapipe/hands": "^0.4.0"           // Hand detection ML - INTEGRATED
"@mediapipe/camera_utils": "^0.3.0"    // Camera utilities - INTEGRATED
```
**Purpose**: Real-time hand tracking via webcam
**Status**: Fully integrated and working
**Critical**: Core feature implemented

### 3D Graphics
```json
"three": "^0.170.0"                    // 3D graphics engine
"@react-three/fiber": "^8.18.0"        // React Three.js
"@react-three/drei": "^9.117.3"        // Three.js helpers
```
**Purpose**: 3D visualizations, performance mode
**Status**: Installed but unused
**Priority**: Phase 2 feature

### State Management
```json
"zustand": "^5.0.1"                    // State management
```
**Purpose**: Global state for audio, gestures, preferences
**Status**: Installed but not implemented
**Integration**: Ready to use

### Real-time Communication
```json
"socket.io": "^4.8.1"                  // WebSocket server
"socket.io-client": "^4.8.1"           // WebSocket client
```
**Purpose**: Collaborative DJ sessions
**Status**: Installed but unused
**Priority**: Phase 3 feature

### Database
```json
"@vercel/kv": "^3.0.0"                 // Redis KV store
```
**Purpose**: Session storage, user preferences
**Status**: Installed but not configured
**Requirements**: Vercel deployment

### Animation
```json
"framer-motion": "^11.15.0"            // React animations
```
**Purpose**: UI animations, transitions
**Status**: Installed, minimal use
**Current Use**: Loading animation only

### UI Components
```json
"lucide-react": "^0.468.0"             // Icon library
```
**Purpose**: UI icons
**Status**: Installed and used
**Current Use**: Music note icon in loading

### Utilities
```json
"clsx": "^2.1.1"                       // Class name utility
```
**Purpose**: Conditional CSS classes
**Status**: Installed and used

## Version Conflicts

### Critical Issues
1. **React Version Mismatch**
   - package.json: "^18.2.0"
   - plan.md claims: "19.0.0"
   - Impact: Potential runtime errors

2. **Missing Dependencies**
   - @mediapipe/camera_utils not installed
   - Required for camera functionality

## Development Dependencies

```json
"devDependencies": {
  "@eslint/eslintrc": "^3.2.0",
  "@types/node": "^20",
  "@types/react": "^18",
  "@types/react-dom": "^18",
  "eslint": "^9.17.0",
  "eslint-config-next": "15.0.3",
  "postcss": "^8",
  "tailwindcss": "^3.4.17",
  "typescript": "^5"
}
```

### Missing Dev Dependencies
- **Testing**: No Jest, React Testing Library, Cypress
- **Formatting**: No Prettier
- **Git Hooks**: No Husky, lint-staged
- **Build Tools**: No webpack customization

## Browser Requirements

### Minimum Browser Support
- Chrome 90+ (MediaPipe requirement)
- Firefox 88+ (Web Audio API)
- Safari 14+ (limited MediaPipe support)
- Edge 90+ (Chromium-based)

### Required APIs
- getUserMedia (camera access)
- Web Audio API
- WebGL (for Three.js)
- WebAssembly (for MediaPipe)
- WebRTC (for collaboration)

## Performance Considerations

### Bundle Size Concerns
```
Estimated sizes (uncompressed):
- three: ~1.2MB
- @mediapipe/hands: ~2.5MB
- tone: ~800KB
- Total vendor: ~5MB+
```

### Optimization Opportunities
1. Code splitting not implemented
2. Dynamic imports not used
3. No CDN for large libraries
4. No service worker

## Configuration Files

### next.config.js
```javascript
- Strict mode: enabled
- CORS headers: configured for MediaPipe
- Custom headers for camera access
```

### tsconfig.json
```javascript
- Target: ES2017
- Strict: true
- Path aliases: @/* configured
- JSX: preserve
```

### tailwind.config.js
```javascript
- Custom colors: Theta Chi branding
- Fonts: Inter, Bebas Neue
- Dark mode: class-based
```

## Environment Variables

### Required (not created)
```env
NEXT_PUBLIC_MEDIAPIPE_VERSION=0.4.1675469240
NEXT_PUBLIC_API_URL=http://localhost:3000
VERCEL_KV_URL=<redis-url>
VERCEL_KV_REST_API_URL=<redis-api>
VERCEL_KV_REST_API_TOKEN=<token>
VERCEL_KV_REST_API_READ_ONLY_TOKEN=<token>
```

## Build & Deploy

### Scripts
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint"
}
```

### Deployment Target
- **Platform**: Vercel (implied by @vercel/kv)
- **Build**: Static + API routes
- **CDN**: Vercel Edge Network

## Technical Debt

### High Priority
1. Missing @mediapipe/camera_utils
2. React version conflict
3. No test infrastructure
4. No error boundaries

### Medium Priority
1. Unused dependencies (5+ packages)
2. No code splitting
3. Missing TypeScript types for some deps
4. No CI/CD pipeline

### Low Priority
1. No Docker configuration
2. No Storybook for components
3. No performance monitoring
4. No analytics integration

## Recommended Stack Additions

### Immediate Needs
1. @mediapipe/camera_utils
2. Jest + React Testing Library
3. @types/three

### Future Considerations
1. Sentry (error tracking)
2. Mixpanel (analytics)
3. Workbox (PWA support)
4. Playwright (E2E testing)

## Update History
- 2025-09-14 17:18: Updated dependencies - MediaPipe now fully integrated, React version corrected to 19.0.0