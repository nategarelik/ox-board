'use client'

import { useEffect } from 'react'
import { useKeyboardShortcuts } from '@/app/hooks/useKeyboardShortcuts'
import { getScreenReaderAnnouncer } from '@/app/lib/accessibility/screenReaderAnnouncer'
import useEnhancedDJStore from '@/app/stores/enhancedDjStoreWithGestures'

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode
}

export default function KeyboardShortcutsProvider({ children }: KeyboardShortcutsProviderProps) {
  const {
    playDeck,
    pauseDeck,
    setDeckVolume,
    setCrossfaderPosition,
    decks,
    crossfaderConfig,
    masterConfig,
    setMasterGain
  } = useEnhancedDJStore()

  const announcer = getScreenReaderAnnouncer()

  // Define DJ-specific keyboard shortcuts
  const shortcuts = [
    {
      key: ' ',
      action: () => {
        // Toggle play/pause for active deck
        const activeDeck = decks[0]?.isPlaying ? 0 : decks[1]?.isPlaying ? 1 : 0
        if (decks[activeDeck]?.isPlaying) {
          pauseDeck(activeDeck)
          announcer.announceDeckState(activeDeck === 0 ? 'A' : 'B', 'paused')
        } else {
          playDeck(activeDeck)
          announcer.announceDeckState(activeDeck === 0 ? 'A' : 'B', 'playing')
        }
      },
      description: 'Play/Pause active deck'
    },
    {
      key: 'q',
      action: () => {
        // Cue point functionality would be implemented here
        announcer.announceCuePoint('A')
      },
      description: 'Set cue point on Deck A'
    },
    {
      key: 'p',
      action: () => {
        // Cue point functionality would be implemented here
        announcer.announceCuePoint('B')
      },
      description: 'Set cue point on Deck B'
    },
    {
      key: 'ArrowLeft',
      action: () => {
        const currentPosition = crossfaderConfig?.position || 0
        const newPosition = Math.max(-1, currentPosition - 0.1)
        setCrossfaderPosition(newPosition)
        announcer.announceCrossfaderPosition(newPosition)
      },
      description: 'Move crossfader left'
    },
    {
      key: 'ArrowRight',
      action: () => {
        const currentPosition = crossfaderConfig?.position || 0
        const newPosition = Math.min(1, currentPosition + 0.1)
        setCrossfaderPosition(newPosition)
        announcer.announceCrossfaderPosition(newPosition)
      },
      description: 'Move crossfader right'
    },
    {
      key: 'ArrowUp',
      action: () => {
        const currentGain = masterConfig?.gain || 0.85
        const newGain = Math.min(1, currentGain + 0.05)
        setMasterGain(newGain)
        announcer.announceVolumeChange('master', newGain)
      },
      description: 'Master volume up'
    },
    {
      key: 'ArrowDown',
      action: () => {
        const currentGain = masterConfig?.gain || 0.85
        const newGain = Math.max(0, currentGain - 0.05)
        setMasterGain(newGain)
        announcer.announceVolumeChange('master', newGain)
      },
      description: 'Master volume down'
    },
    {
      key: 's',
      action: () => {
        if (decks[0]?.isPlaying && decks[1]?.isPlaying) {
          // Sync functionality would be implemented here
          announcer.announceSyncState(true, 'A')
        }
      },
      description: 'Sync decks'
    },
    {
      key: 'l',
      action: () => {
        const activeDeck = decks[0]?.isPlaying ? 0 : decks[1]?.isPlaying ? 1 : 0
        // Loop functionality would be implemented here
        announcer.announceLoopState(activeDeck === 0 ? 'A' : 'B', true, 4)
      },
      description: 'Toggle loop'
    },
    {
      key: 'r',
      action: () => {
        // Recording functionality would be implemented here
        announcer.announceRecordingState(true)
      },
      description: 'Toggle recording'
    },
    {
      key: '1',
      action: () => {
        playDeck(0)
        announcer.announceDeckState('A', 'playing')
      },
      description: 'Select and play Deck A'
    },
    {
      key: '2',
      action: () => {
        playDeck(1)
        announcer.announceDeckState('B', 'playing')
      },
      description: 'Select and play Deck B'
    },
    {
      key: 'Tab',
      action: () => {
        // Switch focus between decks
        const focusedDeck = document.activeElement?.closest('[role="region"]')
        const deckA = document.querySelector('[aria-label*="Deck A"]')
        const deckB = document.querySelector('[aria-label*="Deck B"]')

        if (focusedDeck === deckA && deckB) {
          (deckB.querySelector('button') as HTMLElement)?.focus()
        } else if (deckA) {
          (deckA.querySelector('button') as HTMLElement)?.focus()
        }
      },
      description: 'Switch focus between decks'
    },
    {
      key: 'Escape',
      action: () => {
        pauseDeck(0)
        pauseDeck(1)
        setCrossfaderPosition(0)
        setMasterGain(0.85)
        announcer.announce('All playback stopped')
      },
      description: 'Stop all playback'
    },
    {
      key: 'h',
      ctrl: true,
      action: () => {
        // Show keyboard shortcuts help
        const helpModal = document.getElementById('keyboard-shortcuts-help')
        if (helpModal) {
          helpModal.classList.toggle('hidden')
        }
      },
      description: 'Show keyboard shortcuts help'
    }
  ]

  useKeyboardShortcuts(shortcuts)

  // Track keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Add keyboard navigation class for focus styles
      document.body.classList.add('keyboard-nav')
    }

    const handleMouseDown = () => {
      // Remove keyboard navigation class when using mouse
      document.body.classList.remove('keyboard-nav')
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('mousedown', handleMouseDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  return (
    <>
      {children}
      {/* Keyboard shortcuts help modal (hidden by default) */}
      <div
        id="keyboard-shortcuts-help"
        className="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        role="dialog"
        aria-label="Keyboard shortcuts help"
      >
        <div className="bg-gray-900 p-6 rounded-lg max-w-2xl max-h-[80vh] overflow-y-auto">
          <h2 className="text-2xl font-bold mb-4 text-ox-accent">Keyboard Shortcuts</h2>
          <div className="space-y-2">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-400">{shortcut.description}:</span>
                <kbd className="px-2 py-1 bg-gray-800 rounded text-white">
                  {shortcut.ctrl ? 'Ctrl + ' : ''}{shortcut.key === ' ' ? 'Space' : shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
          <button
            className="mt-6 px-4 py-2 bg-ox-primary text-white rounded hover:bg-ox-primary/80 focus:outline-none focus:ring-2 focus:ring-ox-accent"
            onClick={() => document.getElementById('keyboard-shortcuts-help')?.classList.add('hidden')}
            aria-label="Close help"
          >
            Close
          </button>
        </div>
      </div>
    </>
  )
}