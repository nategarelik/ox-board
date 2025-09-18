'use client'

import { useEffect, useCallback } from 'react'

interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  action: () => void
  description: string
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in input fields
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return
    }

    shortcuts.forEach((shortcut) => {
      const matchesKey = event.key.toLowerCase() === shortcut.key.toLowerCase()
      const matchesCtrl = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey
      const matchesShift = shortcut.shift ? event.shiftKey : !event.shiftKey
      const matchesAlt = shortcut.alt ? event.altKey : !event.altKey

      if (matchesKey && matchesCtrl && matchesShift && matchesAlt) {
        event.preventDefault()
        shortcut.action()
      }
    })
  }, [shortcuts])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  return shortcuts
}

// Default DJ keyboard shortcuts
export const defaultDJShortcuts: KeyboardShortcut[] = [
  {
    key: ' ',
    action: () => console.log('Play/Pause'),
    description: 'Play/Pause active deck'
  },
  {
    key: 'q',
    action: () => console.log('Cue Deck A'),
    description: 'Cue point Deck A'
  },
  {
    key: 'p',
    action: () => console.log('Cue Deck B'),
    description: 'Cue point Deck B'
  },
  {
    key: 'ArrowLeft',
    action: () => console.log('Move crossfader left'),
    description: 'Move crossfader left'
  },
  {
    key: 'ArrowRight',
    action: () => console.log('Move crossfader right'),
    description: 'Move crossfader right'
  },
  {
    key: 'ArrowUp',
    action: () => console.log('Increase master volume'),
    description: 'Master volume up'
  },
  {
    key: 'ArrowDown',
    action: () => console.log('Decrease master volume'),
    description: 'Master volume down'
  },
  {
    key: 's',
    action: () => console.log('Sync decks'),
    description: 'Sync decks'
  },
  {
    key: 'l',
    action: () => console.log('Toggle loop'),
    description: 'Toggle loop'
  },
  {
    key: 'r',
    action: () => console.log('Toggle recording'),
    description: 'Toggle recording'
  },
  {
    key: '1',
    action: () => console.log('Select Deck A'),
    description: 'Select Deck A'
  },
  {
    key: '2',
    action: () => console.log('Select Deck B'),
    description: 'Select Deck B'
  },
  {
    key: 'Tab',
    action: () => console.log('Switch focus'),
    description: 'Switch focus between decks'
  },
  {
    key: 'Escape',
    action: () => console.log('Stop all'),
    description: 'Stop all playback'
  },
  {
    key: 'h',
    ctrl: true,
    action: () => console.log('Show help'),
    description: 'Show keyboard shortcuts help'
  }
]