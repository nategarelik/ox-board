# 🖥️ Terminal UI - Active Interface

This is the **PRIMARY AND ONLY ACTIVE UI** for OX Board.

## Overview

The Terminal UI provides a retro CRT-style interface for the DJ platform, combining nostalgic aesthetics with modern functionality.

## Features

- **CRT Effects**: Scanlines, flicker, and green phosphor glow
- **Full DJ Controls**: Dual decks, mixer, effects, stem controls
- **Keyboard Navigation**: Fully keyboard accessible
- **Gesture Integration**: Ready for hand tracking integration

## Components

### Core Components

- `TerminalApp.tsx` - Main application container
- `TerminalNavigation.tsx` - Tab-based navigation system
- `TerminalCard.tsx` - Reusable card component

### Views

- `TerminalDashboard.tsx` - System overview and stats
- `TerminalStudio.tsx` - Main DJ interface
- `TerminalMusicLibrary.tsx` - Track browser
- `TerminalSettings.tsx` - Configuration panel

## Usage

The Terminal UI is automatically loaded as the default interface. No configuration needed.

```typescript
import { TerminalApp } from './terminal';

export default function App() {
  return <TerminalApp />;
}
```

## Styling

Uses custom CSS with terminal-specific classes:

- Green-on-black color scheme
- Monospace fonts
- ASCII art and box-drawing characters
- Animated cursor effects

## Keyboard Controls

| Key   | Action         |
| ----- | -------------- |
| Space | Play/Pause     |
| ← →   | Navigate tabs  |
| ↑ ↓   | Adjust values  |
| Enter | Select/Confirm |
| Esc   | Back/Cancel    |
| Tab   | Next field     |

## Future Enhancements

- [ ] Command-line interface
- [ ] Vim-style keybindings
- [ ] ASCII visualizers
- [ ] Terminal multiplexing
- [ ] Custom color themes

## Integration Points

### Audio Services

Connect to `app/services/audioService.ts` and `deckManager.ts`

### Gesture Control

Integrate with `app/hooks/useGestures.ts`

### State Management

Use `app/stores/enhancedDjStoreWithGestures.ts`

### Backend API

Connect to Railway backend via `config/production/api.config.ts`
