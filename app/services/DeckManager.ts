import * as Tone from 'tone'
import { EventEmitter } from 'events'
import { Deck } from '@/app/lib/audio/deck'
import { Crossfader } from '@/app/lib/audio/crossfader'
import { getAudioService } from './AudioService'
import type {
  DeckState,
  DeckControls,
  CrossfaderConfig,
  DeckManagerInterface,
  SyncState,
  PerformanceMetrics
} from './types/audio'
import { AUDIO_CONSTANTS } from './types/audio'

export class DeckManager extends EventEmitter implements DeckManagerInterface {
  private static instance: DeckManager | null = null
  public deckA: Deck
  public deckB: Deck
  private crossfaderInstance: Crossfader
  private masterGain: Tone.Gain
  private limiter: Tone.Limiter
  private compressor: Tone.Compressor
  private syncState: SyncState = {
    master: null,
    slaveOffset: 0,
    isLocked: false,
    beatOffset: 0
  }
  private masterSettings = {
    volume: 0.85,
    limiter: true,
    recording: false
  }
  private recorder: Tone.Recorder | null = null
  private performanceMetrics: PerformanceMetrics = {
    audioLatency: 0,
    renderTime: 0,
    dropouts: 0,
    cpuUsage: 0,
    memoryUsage: 0
  }
  private metricsInterval: NodeJS.Timer | null = null

  private constructor() {
    super()

    // Initialize audio service first
    const audioService = getAudioService()
    if (!audioService.isReady()) {
      throw new Error('AudioService must be initialized before creating DeckManager')
    }

    // Create decks
    this.deckA = new Deck('A')
    this.deckB = new Deck('B')

    // Note: Deck initialization is now async and must be called separately

    // Create crossfader
    this.crossfaderInstance = new Crossfader({
      position: AUDIO_CONSTANTS.CROSSFADER_CENTER,
      curve: 'linear',
      cutLag: 0,
      hamsterMode: false
    })

    // Create master chain
    this.compressor = new Tone.Compressor({
      threshold: -12,
      ratio: 4,
      attack: 0.003,
      release: 0.1
    })

    this.limiter = new Tone.Limiter(-1)
    this.masterGain = new Tone.Gain(this.masterSettings.volume)

    // Connect signal chain
    this.connectAudioChain()

    // Setup event listeners
    this.setupEventListeners()

    // Start performance monitoring
    this.startPerformanceMonitoring()
  }

  public static getInstance(): DeckManager {
    if (!DeckManager.instance) {
      DeckManager.instance = new DeckManager()
    }
    return DeckManager.instance
  }

  public async initializeDecks(): Promise<void> {
    await Promise.all([this.deckA.initialize(), this.deckB.initialize()])
  }

  private connectAudioChain(): void {
    // Connect decks to crossfader
    this.crossfaderInstance.connectDeckA(this.deckA.getOutput())
    this.crossfaderInstance.connectDeckB(this.deckB.getOutput())

    // Connect crossfader to master chain
    const crossfaderOut = this.crossfaderInstance.getOutput()
    crossfaderOut.connect(this.compressor)
    this.compressor.connect(this.limiter)
    this.limiter.connect(this.masterGain)

    // Connect to destination
    this.masterGain.toDestination()
  }

  private setupEventListeners(): void {
    // Forward deck events
    this.deckA.on('play', () => this.emit('deck:play', { deck: 'A' }))
    this.deckA.on('pause', () => this.emit('deck:pause', { deck: 'A' }))
    this.deckA.on('stop', () => this.emit('deck:stop', { deck: 'A' }))
    this.deckA.on('loaded', (data) => this.emit('deck:loaded', { deck: 'A', ...data }))
    this.deckA.on('cue', () => this.emit('deck:cue', { deck: 'A' }))
    this.deckA.on('error', (error) => this.emit('deck:error', { deck: 'A', error }))

    this.deckB.on('play', () => this.emit('deck:play', { deck: 'B' }))
    this.deckB.on('pause', () => this.emit('deck:pause', { deck: 'B' }))
    this.deckB.on('stop', () => this.emit('deck:stop', { deck: 'B' }))
    this.deckB.on('loaded', (data) => this.emit('deck:loaded', { deck: 'B', ...data }))
    this.deckB.on('cue', () => this.emit('deck:cue', { deck: 'B' }))
    this.deckB.on('error', (error) => this.emit('deck:error', { deck: 'B', error }))

    // Position updates for beat matching
    this.deckA.on('positionUpdate', (data) => {
      if (this.syncState.isLocked && this.syncState.master === 'B') {
        this.updateSync('A', data.position)
      }
    })

    this.deckB.on('positionUpdate', (data) => {
      if (this.syncState.isLocked && this.syncState.master === 'A') {
        this.updateSync('B', data.position)
      }
    })
  }

  public get crossfader(): CrossfaderConfig {
    return this.crossfaderInstance.getConfig()
  }

  public get master() {
    return this.masterSettings
  }

  public getDeckState(deck: 'A' | 'B'): DeckState {
    return deck === 'A' ? this.deckA.getState() : this.deckB.getState()
  }

  public setCrossfaderPosition(position: number): void {
    this.crossfaderInstance.setPosition(position)
    this.emit('crossfader:change', { position })
  }

  public setCrossfaderCurve(curve: CrossfaderConfig['curve']): void {
    this.crossfaderInstance.setCurve(curve)
    this.emit('crossfader:curve', { curve })
  }

  public setMasterVolume(volume: number): void {
    volume = Math.max(0, Math.min(1, volume))
    this.masterSettings.volume = volume
    this.masterGain.gain.rampTo(volume, 0.01)
    this.emit('master:volume', { volume })
  }

  public setLimiter(enabled: boolean): void {
    this.masterSettings.limiter = enabled
    if (enabled) {
      this.compressor.connect(this.limiter)
      this.limiter.connect(this.masterGain)
    } else {
      this.compressor.connect(this.masterGain)
    }
    this.emit('master:limiter', { enabled })
  }

  public sync(master: 'A' | 'B'): void {
    const masterDeck = master === 'A' ? this.deckA : this.deckB
    const slaveDeck = master === 'A' ? this.deckB : this.deckA

    const masterBPM = masterDeck.getBPM()
    const slaveBPM = slaveDeck.getBPM()

    if (masterBPM && slaveBPM) {
      // Calculate pitch adjustment needed
      const pitchDiff = ((masterBPM / slaveBPM) - 1) * 100

      // Apply pitch to slave deck
      slaveDeck.setPitch(pitchDiff)

      // Update sync state
      this.syncState = {
        master,
        slaveOffset: pitchDiff,
        isLocked: true,
        beatOffset: 0
      }

      // Emit sync event
      this.emit('sync:engaged', {
        master,
        slave: master === 'A' ? 'B' : 'A',
        masterBPM,
        slaveBPM,
        pitchAdjustment: pitchDiff
      })
    }
  }

  public unsync(): void {
    if (this.syncState.isLocked) {
      // Reset slave deck pitch
      const slaveDeck = this.syncState.master === 'A' ? this.deckB : this.deckA
      slaveDeck.setPitch(0)

      // Clear sync state
      this.syncState = {
        master: null,
        slaveOffset: 0,
        isLocked: false,
        beatOffset: 0
      }

      this.emit('sync:disengaged')
    }
  }

  private updateSync(slaveDeck: 'A' | 'B', position: number): void {
    // This would implement beat-grid alignment
    // For now, it's a placeholder for actual beat matching logic
    const deck = slaveDeck === 'A' ? this.deckA : this.deckB
    const masterDeck = slaveDeck === 'A' ? this.deckB : this.deckA

    // Get positions
    const masterPosition = masterDeck.getPosition()
    const slavePosition = position

    // Calculate drift
    const drift = masterPosition - slavePosition

    // Apply micro pitch adjustment to maintain sync
    if (Math.abs(drift) > 0.001) {
      const currentPitch = deck.getState().pitch
      const adjustment = drift * 0.1 // Gentle correction
      deck.setPitch(currentPitch + adjustment)
    }
  }

  public async startRecording(): Promise<void> {
    if (this.masterSettings.recording) return

    try {
      this.recorder = new Tone.Recorder()
      this.masterGain.connect(this.recorder)

      await this.recorder.start()
      this.masterSettings.recording = true
      this.emit('recording:start')
    } catch (error) {
      this.emit('recording:error', { error })
      throw error
    }
  }

  public async stopRecording(): Promise<Blob | null> {
    if (!this.masterSettings.recording || !this.recorder) return null

    try {
      const recording = await this.recorder.stop()
      this.masterGain.disconnect(this.recorder)
      this.recorder.dispose()
      this.recorder = null
      this.masterSettings.recording = false
      this.emit('recording:stop')
      return recording
    } catch (error) {
      this.emit('recording:error', { error })
      throw error
    }
  }

  public autoDJ(enabled: boolean): void {
    // AutoDJ implementation would handle automatic mixing
    // This is a placeholder for future implementation
    if (enabled) {
      this.emit('autodj:start')
      // Start analyzing tracks, beat matching, and auto-mixing
    } else {
      this.emit('autodj:stop')
      // Stop auto-mixing
    }
  }

  private startPerformanceMonitoring(): void {
    this.metricsInterval = setInterval(() => {
      const audioService = getAudioService()
      const stats = audioService.getStats()

      this.performanceMetrics = {
        audioLatency: stats.latency,
        renderTime: 0, // Would need actual render time measurement
        dropouts: 0, // Would need dropout detection
        cpuUsage: stats.cpuUsage,
        memoryUsage: 0 // Would need memory measurement
      }

      this.emit('performance:update', this.performanceMetrics)
    }, 1000) as any
  }

  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics }
  }

  public dispose(): void {
    // Stop monitoring
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval)
    }

    // Stop recording if active
    if (this.masterSettings.recording) {
      this.stopRecording()
    }

    // Dispose audio nodes
    this.deckA.dispose()
    this.deckB.dispose()
    this.crossfaderInstance.dispose()
    this.compressor.dispose()
    this.limiter.dispose()
    this.masterGain.dispose()

    // Clear instance
    DeckManager.instance = null

    this.removeAllListeners()
  }

  // Utility methods
  public swapDecks(): void {
    // This would swap the audio routing of deck A and B
    // Useful for DJ handoffs
    this.emit('decks:swapped')
  }

  public getCrossfaderPosition(): number {
    return this.crossfaderInstance.getPosition()
  }

  public fadeToNext(duration: number = 2000): void {
    // Automatic fade to the opposite deck
    const currentPosition = this.getCrossfaderPosition()
    const targetDeck = currentPosition < 0 ? 'B' : 'A'
    this.crossfaderInstance.cut(targetDeck, duration)
  }

  public resetAll(): void {
    this.deckA.stop()
    this.deckB.stop()
    this.crossfaderInstance.center()
    this.setMasterVolume(0.85)
    this.unsync()
    this.emit('reset')
  }
}

// Export singleton getter
export const getDeckManager = (): DeckManager => {
  return DeckManager.getInstance()
}