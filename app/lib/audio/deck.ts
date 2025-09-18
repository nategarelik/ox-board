import * as Tone from 'tone'
import { EventEmitter } from 'events'
import type {
  Track,
  DeckState,
  DeckConfig,
  DeckControls,
  CuePoint,
  Loop,
  AudioEvent
} from '@/app/services/types/audio'
import { AUDIO_CONSTANTS } from '@/app/services/types/audio'

export class Deck extends EventEmitter implements DeckControls {
  private id: 'A' | 'B'
  private state: DeckState
  private config: DeckConfig
  private player: Tone.Player | null = null
  private eq3: Tone.EQ3 | null = null
  private filter: Tone.Filter | null = null
  private gain: Tone.Gain | null = null
  private output: Tone.Gain | null = null
  private isInitialized: boolean = false
  private playbackRate: number = 1.0
  private beatGridOffset: number = 0
  private updateInterval: ReturnType<typeof setInterval> | null = null

  constructor(id: 'A' | 'B', config?: Partial<DeckConfig>) {
    super()
    this.id = id
    this.config = {
      id,
      channelStrip: {
        gain: 1,
        pan: 0,
        sends: {
          reverb: 0,
          delay: 0
        }
      },
      ...config
    }

    this.state = {
      track: null,
      isPlaying: false,
      isPaused: false,
      isLoading: false,
      position: 0,
      pitch: 0,
      volume: 0.75,
      eq: {
        low: 0,
        mid: 0,
        high: 0
      },
      filter: {
        frequency: AUDIO_CONSTANTS.DEFAULT_FILTER_FREQ,
        resonance: 1,
        type: 'lowpass'
      },
      effects: {
        reverb: 0,
        delay: 0,
        flanger: 0,
        bitcrusher: 0
      },
      cuePoints: [],
      loops: []
    }
  }

  public initialize(): void {
    if (this.isInitialized) return

    // Create audio nodes
    this.gain = new Tone.Gain(this.state.volume)
    this.eq3 = new Tone.EQ3()
    this.filter = new Tone.Filter({
      frequency: this.state.filter.frequency,
      type: this.state.filter.type,
      Q: this.state.filter.resonance
    })
    this.output = new Tone.Gain(1)

    // Connect signal chain
    // player -> gain -> eq3 -> filter -> output
    this.gain.connect(this.eq3)
    this.eq3.connect(this.filter)
    this.filter.connect(this.output)

    this.isInitialized = true
    this.startPositionUpdate()
  }

  public getOutput(): Tone.Gain {
    if (!this.output) {
      throw new Error(`Deck ${this.id} not initialized`)
    }
    return this.output
  }

  public async load(track: Track): Promise<void> {
    this.state.isLoading = true
    this.emit('load', { deck: this.id, track })

    try {
      // Dispose old player if exists
      if (this.player) {
        this.player.stop()
        this.player.dispose()
        this.player = null
      }

      // Create new player
      this.player = new Tone.Player({
        url: track.url,
        autostart: false,
        loop: false,
        playbackRate: this.playbackRate
      })

      // Wait for buffer to load
      await this.player.load(track.url)

      // Connect to signal chain
      if (this.gain) {
        this.player.connect(this.gain)
      }

      // Update state
      this.state.track = track
      this.state.position = 0
      this.state.isLoading = false
      this.state.cuePoints = []
      this.state.loops = []

      // Set default cue point at start
      this.setCuePoint(0)

      this.emit('loaded', { deck: this.id, track })
    } catch (error) {
      this.state.isLoading = false
      this.emit('error', { deck: this.id, error: `Failed to load track: ${error}` })
      throw error
    }
  }

  public play(): void {
    if (!this.player || !this.state.track) return

    if (this.player.state === 'stopped') {
      this.player.start()
    }

    this.state.isPlaying = true
    this.state.isPaused = false
    this.emit('play', { deck: this.id })
  }

  public pause(): void {
    if (!this.player) return

    this.player.stop()
    this.state.isPlaying = false
    this.state.isPaused = true
    this.emit('pause', { deck: this.id })
  }

  public stop(): void {
    if (!this.player) return

    this.player.stop()
    this.state.isPlaying = false
    this.state.isPaused = false
    this.state.position = 0
    this.emit('stop', { deck: this.id })
  }

  public cue(): void {
    if (!this.player) return

    // Jump to first cue point or start
    const firstCue = this.state.cuePoints[0]
    if (firstCue) {
      this.jumpToCue(0)
    } else {
      this.seek(0)
    }

    this.pause()
    this.emit('cue', { deck: this.id })
  }

  public setCuePoint(index: number): void {
    if (index < 0 || index >= AUDIO_CONSTANTS.MAX_CUE_POINTS) return

    const cuePoint: CuePoint = {
      index,
      position: this.state.position,
      color: this.getCueColor(index)
    }

    // Replace or add cue point
    const existingIndex = this.state.cuePoints.findIndex(cp => cp.index === index)
    if (existingIndex >= 0) {
      this.state.cuePoints[existingIndex] = cuePoint
    } else {
      this.state.cuePoints.push(cuePoint)
    }

    this.emit('cueSet', { deck: this.id, cuePoint })
  }

  public jumpToCue(index: number): void {
    const cuePoint = this.state.cuePoints.find(cp => cp.index === index)
    if (!cuePoint) return

    this.seek(cuePoint.position)
    this.emit('cueJump', { deck: this.id, cuePoint })
  }

  public setPitch(pitch: number): void {
    // Clamp to range
    pitch = Math.max(-AUDIO_CONSTANTS.DEFAULT_PITCH_RANGE,
                     Math.min(AUDIO_CONSTANTS.DEFAULT_PITCH_RANGE, pitch))

    this.state.pitch = pitch
    this.playbackRate = 1 + (pitch / 100)

    if (this.player) {
      this.player.playbackRate = this.playbackRate
    }

    this.emit('pitchChange', { deck: this.id, pitch })
  }

  public setVolume(volume: number): void {
    volume = Math.max(0, Math.min(1, volume))
    this.state.volume = volume

    if (this.gain) {
      this.gain.gain.rampTo(volume, 0.01)
    }

    this.emit('volumeChange', { deck: this.id, volume })
  }

  public setEQ(band: 'low' | 'mid' | 'high', value: number): void {
    value = Math.max(-AUDIO_CONSTANTS.DEFAULT_EQ_RANGE,
                     Math.min(AUDIO_CONSTANTS.DEFAULT_EQ_RANGE, value))

    this.state.eq[band] = value

    if (this.eq3) {
      switch (band) {
        case 'low':
          this.eq3.low.value = value
          break
        case 'mid':
          this.eq3.mid.value = value
          break
        case 'high':
          this.eq3.high.value = value
          break
      }
    }

    this.emit('eqChange', { deck: this.id, band, value })
  }

  public setFilter(params: Partial<DeckState['filter']>): void {
    this.state.filter = { ...this.state.filter, ...params }

    if (this.filter) {
      if (params.frequency !== undefined) {
        this.filter.frequency.rampTo(params.frequency, 0.01)
      }
      if (params.resonance !== undefined) {
        this.filter.Q.value = params.resonance
      }
      if (params.type !== undefined) {
        this.filter.type = params.type
      }
    }

    this.emit('filterChange', { deck: this.id, filter: this.state.filter })
  }

  public setEffect(effect: keyof DeckState['effects'], value: number): void {
    value = Math.max(0, Math.min(1, value))
    this.state.effects[effect] = value

    // Effect implementation would connect to effect sends
    // This is a placeholder for the actual effect routing
    this.emit('effectChange', { deck: this.id, effect, value })
  }

  public seek(position: number): void {
    position = Math.max(0, Math.min(1, position))
    this.state.position = position

    if (this.player && this.player.buffer) {
      const seconds = position * this.player.buffer.duration
      this.player.seek(seconds)
    }

    this.emit('seek', { deck: this.id, position })
  }

  public sync(): void {
    // Sync implementation would match tempo with master deck
    // This is a placeholder for actual sync logic
    this.emit('sync', { deck: this.id })
  }

  public scratch(speed: number): void {
    // Scratch implementation would manipulate playback speed temporarily
    // This is a placeholder for actual scratch logic
    if (this.player) {
      this.player.playbackRate = speed

      // Return to normal speed after scratch
      setTimeout(() => {
        if (this.player) {
          this.player.playbackRate = this.playbackRate
        }
      }, 100)
    }

    this.emit('scratch', { deck: this.id, speed })
  }

  public setLoop(start: number, end: number): void {
    const loop: Loop = {
      start: Math.max(0, Math.min(1, start)),
      end: Math.max(0, Math.min(1, end)),
      active: true
    }

    this.state.loops.push(loop)

    if (this.player && this.player.buffer) {
      this.player.loopStart = loop.start * this.player.buffer.duration
      this.player.loopEnd = loop.end * this.player.buffer.duration
      this.player.loop = true
    }

    this.emit('loopSet', { deck: this.id, loop })
  }

  public clearLoop(): void {
    this.state.loops = []

    if (this.player) {
      this.player.loop = false
    }

    this.emit('loopClear', { deck: this.id })
  }

  public getState(): DeckState {
    return { ...this.state }
  }

  public getBPM(): number {
    return this.state.track?.bpm || AUDIO_CONSTANTS.DEFAULT_BPM
  }

  public getPosition(): number {
    return this.state.position
  }

  public isActive(): boolean {
    return this.state.isPlaying
  }

  public dispose(): void {
    this.stopPositionUpdate()

    if (this.player) {
      this.player.stop()
      this.player.dispose()
    }

    if (this.gain) this.gain.dispose()
    if (this.eq3) this.eq3.dispose()
    if (this.filter) this.filter.dispose()
    if (this.output) this.output.dispose()

    this.removeAllListeners()
    this.isInitialized = false
  }

  private startPositionUpdate(): void {
    this.updateInterval = setInterval(() => {
      if (this.player && this.state.isPlaying && this.player.buffer) {
        const currentTime = this.player.immediate()
        this.state.position = currentTime / this.player.buffer.duration
        this.emit('positionUpdate', { deck: this.id, position: this.state.position })
      }
    }, 50) as any // Update 20 times per second
  }

  private stopPositionUpdate(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
  }

  private getCueColor(index: number): string {
    const colors = [
      '#FF0000', // Red
      '#FFA500', // Orange
      '#FFFF00', // Yellow
      '#00FF00', // Green
      '#00FFFF', // Cyan
      '#0000FF', // Blue
      '#FF00FF', // Magenta
      '#FFFFFF'  // White
    ]
    return colors[index % colors.length]
  }
}