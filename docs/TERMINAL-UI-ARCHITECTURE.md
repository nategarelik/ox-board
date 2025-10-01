# Terminal UI Architecture

> **Created**: 2025-10-01
> **Version**: 1.0.0
> **Status**: Production Ready

## Overview

The Terminal UI is a retro CRT-themed interface for OX Board, providing an alternative user experience with a hacker/terminal aesthetic. It runs alongside the classic UI with a feature flag toggle.

## Architecture

### Component Structure

```
app/components/terminal/
├── TerminalApp.tsx           # Main container with CRT effects
├── TerminalNavigation.tsx    # Top navigation bar
├── TerminalDashboard.tsx     # System metrics and status
├── TerminalStudio.tsx        # DJ mixing controls
├── TerminalMusicLibrary.tsx  # File browser and track management
├── TerminalSettings.tsx      # Configuration panel
├── TerminalCard.tsx          # Reusable card components
└── index.tsx                 # Barrel exports
```

### Feature Flag Integration

The terminal UI is toggled via `ClientApp.tsx` using React state:

```typescript
const [useTerminalUI, setUseTerminalUI] = useState(false);

// User can toggle between UIs with a button
<button onClick={() => setUseTerminalUI(!useTerminalUI)}>
  {useTerminalUI ? 'CLASSIC_MODE' : 'TERMINAL_MODE'}
</button>
```

### Design System

#### Colors

- **Primary Text**: `text-green-400` (#4ade80)
- **Secondary Text**: `text-green-600` (#16a34a)
- **Background**: `bg-black` (#000000)
- **Borders**: `border-green-500`, `border-green-700`
- **Accents**: White corners, green glow effects

#### Typography

- **Font**: `font-mono` (JetBrains Mono)
- **Style**: Uppercase labels, tracking-wider for headers
- **Format**: Monospaced numbers (tabular-nums)

#### Animations

```css
/* Fade in content */
animate-fade-in: 0.3s ease-in

/* CRT flicker effect */
animate-flicker: 0.15s infinite

/* Scanline movement */
animate-scanline: 8s linear infinite
```

### Visual Effects

1. **Corner Decorations**: Fixed white borders at screen corners
2. **Scanline Overlay**: Repeating horizontal lines for CRT effect
3. **Flicker**: Subtle opacity animation for authentic CRT feel
4. **Glow**: `shadow-green-500/50` on active elements

## Integration Points

### Audio Engine

Terminal UI components are presentational and will integrate with existing services:

- `TerminalStudio` → `enhancedDjStoreWithGestures.ts`
- `TerminalDashboard` → `AudioService`, `DeckManager` metrics
- `TerminalMusicLibrary` → Track loading and analysis

### State Management

Uses Zustand store (same as classic UI):

```typescript
// Future integration example
import { useEnhancedDjStore } from "@/stores/enhancedDjStoreWithGestures";

const { decks, playDeck, setVolume } = useEnhancedDjStore();
```

### Gesture Controls

Will integrate with existing gesture recognition:

```typescript
// Future integration
import { useGestures } from "@/hooks/useGestures";

const { gestureState } = useGestures();
```

## Component Details

### TerminalNavigation

- **Purpose**: Top nav bar with tabs and system status
- **State**: Active tab tracking
- **Features**:
  - Logo and version display
  - Status indicators (online/offline)
  - Real-time clock
  - Tab navigation

### TerminalDashboard

- **Purpose**: System overview and health monitoring
- **Displays**:
  - Audio engine status
  - Gesture recognition status
  - Deck states
  - Performance metrics (latency, CPU, FPS)
  - System log
- **Actions**: Quick action buttons

### TerminalStudio

- **Purpose**: Main DJ interface
- **Controls**:
  - Dual deck controls (A/B)
  - Transport controls (play/pause/skip)
  - Volume sliders
  - Stem controls (drums/bass/vocals/other)
  - Crossfader
- **Status**: Track info, BPM, key, time

### TerminalMusicLibrary

- **Purpose**: Track management and file browsing
- **Features**:
  - Search functionality
  - Folder navigation
  - Track list with metadata
  - Upload interface
  - Quick actions (analyze, export stems)

### TerminalSettings

- **Purpose**: System configuration
- **Settings**:
  - Audio latency
  - Buffer size
  - Stem separation toggle
  - Gesture control settings (smoothing, sensitivity, FPS)
  - Terminal mode toggle
- **Actions**: Save config, reset defaults

## Performance Considerations

### Rendering

- Components use React `useState` for local state
- Minimal re-renders through proper state isolation
- CSS animations offloaded to GPU

### Animations

- CRT effects use CSS transforms (hardware accelerated)
- Scanline overlay is static background-image
- Flicker uses opacity only (cheap animation)

### Accessibility

- High contrast green-on-black
- Semantic HTML structure
- Keyboard navigation support (future)
- Screen reader compatibility (future)

## Testing

### Unit Tests

```bash
npm test -- terminal
```

### TypeScript Compilation

```bash
npm run type-check
```

### Visual Testing

1. Toggle to Terminal UI via button
2. Navigate all 4 tabs
3. Verify CRT effects render
4. Test responsive breakpoints

## Future Enhancements

### Phase 2 (Planned)

- [ ] Connect to real audio engine
- [ ] Integrate gesture controls
- [ ] Live deck waveforms
- [ ] Real-time BPM detection
- [ ] Track analysis visualization

### Phase 3 (Planned)

- [ ] Keyboard shortcuts
- [ ] Customizable color schemes
- [ ] Save/load user presets
- [ ] Recording interface
- [ ] Performance optimizations

## Dependencies

### Core

- React 18
- Tailwind CSS
- Lucide React (icons)

### Radix UI Components (unused but available)

- Installed for future expansion
- 64 packages available for complex UI

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Requires CSS Grid and CSS Custom Properties

## Known Limitations

1. **No SSR**: Terminal UI is client-side only (like audio components)
2. **Performance**: CRT effects may impact low-end devices
3. **Mobile**: Optimized for desktop, mobile support future enhancement

## Maintenance

### Code Style

- Use `'use client'` directive
- TypeScript strict mode
- Functional components with hooks
- Props interfaces for all components

### File Organization

- One component per file
- Shared components in `TerminalCard.tsx`
- Barrel exports in `index.tsx`

### CSS

- Tailwind utility classes only
- No inline styles except dynamic values
- Custom animations in `tailwind.config.js`

## Deployment

No special deployment needed. Terminal UI is bundled with main app:

```bash
npm run build
npm start
```

Feature flag controlled at runtime, no environment variables needed.

---

**Status**: ✅ Phase 1 Complete - All components created and integrated
**Next**: Phase 2 - Audio engine integration
**Docs**: Updated 2025-10-01
