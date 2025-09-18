'use client'

import dynamic from 'next/dynamic'
import { AudioMixerProps } from '@/app/types/dj'

const DeckPlayer = dynamic(() => import('./DeckPlayer'), { ssr: false })
const EnhancedMixer = dynamic(() => import('./EnhancedMixer'), { ssr: false })
const StemMixer = dynamic(() => import('../StemMixer'), { ssr: false })

export default function AudioMixer({ viewMode, decks }: AudioMixerProps) {
  const renderViewContent = () => {
    switch (viewMode) {
      case 'decks':
        return (
          <div className="flex gap-4 items-center justify-center">
            <div className="w-[400px]">
              <DeckPlayer deckId={0} />
            </div>
            <div className="w-[300px]">
              <EnhancedMixer />
            </div>
            <div className="w-[400px]">
              <DeckPlayer deckId={1} />
            </div>
          </div>
        )

      case 'mixer':
        return (
          <div className="flex gap-4 items-center justify-center">
            <div className="w-[350px]">
              <DeckPlayer deckId={0} />
            </div>
            <div className="w-[400px]">
              <EnhancedMixer />
            </div>
            <div className="w-[350px]">
              <DeckPlayer deckId={1} />
            </div>
          </div>
        )

      case 'stems':
        return (
          <div className="flex gap-4 justify-center items-start">
            <div className="flex-1">
              <h3 className="text-white text-xl mb-4">Deck A Stems</h3>
              <StemMixer
                channel={0}
                showAdvancedControls={true}
              />
            </div>
            <div className="flex-1">
              <h3 className="text-white text-xl mb-4">Deck B Stems</h3>
              <StemMixer
                channel={1}
                showAdvancedControls={true}
              />
            </div>
          </div>
        )

      case 'effects':
        return (
          <div className="flex flex-col gap-4 items-center">
            <div className="text-white text-2xl">Effects Rack</div>
            <div className="bg-gray-800 rounded-lg p-8 w-full max-w-4xl">
              <p className="text-gray-400 text-center">
                Advanced effects and visualizer coming soon...
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      {/* Main View Content */}
      <div className="flex-1 flex items-center justify-center">
        {renderViewContent()}
      </div>

      {/* Stem Mixer Controls (only for decks/mixer views) */}
      {(viewMode === 'decks' || viewMode === 'mixer') && (
        <div className="flex gap-4 mt-4" style={{ height: '30vh' }}>
          <div className="flex-1">
            <StemMixer
              channel={0}
              showAdvancedControls={false}
            />
          </div>
          <div className="flex-1">
            <StemMixer
              channel={1}
              showAdvancedControls={false}
            />
          </div>
        </div>
      )}
    </>
  )
}