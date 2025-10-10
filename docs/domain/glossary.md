# Domain Glossary

## Overview

Comprehensive glossary of domain-specific terminology, acronyms, and concepts used in the OX Board system.

---

## Audio Engine Terms

### Audio Context

The primary interface to Web Audio API. Represents audio processing graph and controls audio destination (speakers/headphones).

**Technical**: `AudioContext` or wrapped as `Tone.Context`

### Audio Node

Individual processing unit in Web Audio API graph. Examples: Gain, EQ, Filter, Compressor.

**Chain Example**: `Player → EQ3 → Gain → Destination`

### Audio Worklet

Modern API for custom audio processing in separate thread. Replaces deprecated ScriptProcessor.

**Performance**: Lower latency than ScriptProcessor, doesn't block main thread

### Base Latency

Inherent delay between audio processing and output, determined by buffer size and sample rate.

**Typical Range**: 5-15ms

### Buffer Size

Number of samples processed per callback. Smaller = lower latency, higher CPU usage.

**Common Values**: 128, 256, 512, 1024 samples

### Destination

Final output node in Web Audio graph, typically system audio output.

**Access**: `Tone.getDestination()`

### Look-Ahead

Time window for scheduling future audio events, enables precise timing.

**Default**: 0.1s (100ms)

### Sample Rate

Number of audio samples per second.

**Standard Rates**: 44.1kHz (CD quality), 48kHz (professional), 96kHz (hi-res)

### Tone.js

High-level Web Audio framework simplifying audio node creation and routing.

**Benefits**: Cleaner API, better abstractions, musical timing

---

## DJ & Mixing Terms

### Beat Grid

Visual/logical grid aligned to musical beats, used for quantization and sync.

**Precision**: Typically aligned to 1/16th or 1/32nd notes

### Beat Matching / Beat Sync

Aligning tempo (BPM) of two tracks so they play in sync.

**Method**: Adjust pitch/playback rate of slave deck to match master

### BPM (Beats Per Minute)

Tempo of music, measured in beats per minute.

**Range**: 60-200 BPM covers most music genres

### Camelot Wheel

System for harmonic mixing using alphanumeric key notation (1A-12B).

**Example**: 8A (A minor) is compatible with 7A, 9A, and 8B (C major)

### Crossfader

Control for transitioning audio between two sources (typically decks A and B).

**Range**: 0 (full A) to 1 (full B), 0.5 = center (both equal)

### Crossfader Curve

Shape of volume transition during crossfade.

- **Linear**: Straight line fade
- **Constant Power**: Maintains perceived loudness
- **Exponential**: Aggressive fade for scratching

### Cue Point

Marked position in track for quick navigation, typically used to restart from specific point.

**Use Case**: Jump to drop, chorus, or breakdown

### Cut Lag

Intentional delay/smoothing when moving crossfader, prevents clicks.

**Range**: 0-50ms typical

### Deck

Individual playback channel in DJ setup, analogous to physical turntable.

**OX Board**: Supports 2 decks (A/B) or 4 channels

### EQ (Equalizer)

Frequency-based volume control.

**3-Band EQ**: Low (~100Hz), Mid (~1kHz), High (~10kHz)

### Hamster Mode

Reverses crossfader direction (A becomes B, B becomes A).

**Origin**: Named after DJ hamster style (crossfader inverted)

### Harmonic Mixing

Mixing tracks in compatible musical keys to avoid dissonance.

**Tool**: Camelot wheel shows compatible keys

### Key / Musical Key

Tonal center of music (e.g., "C Major", "A Minor").

**Notation**: Standard (C, D, E...) or Camelot (1A-12B)

### Limiter

Prevents audio from exceeding threshold, protects against clipping.

**Typical Threshold**: -1dB to -3dB

### Loop

Repeated section of track between loop start and end points.

**Use Case**: Extend break, create transitions

### Master Volume

Final output volume control for entire mix.

**Range**: 0 to 1 (0% to 100%)

### Pitch

Adjustment of playback speed affecting both tempo and tone.

**Range**: ±100% (±1 octave)
**DJ Use**: ±8% typical for beat matching

### Sync / Tempo Sync

Automatic beat matching by adjusting slave deck to match master.

**Methods**: Pitch adjustment, time-stretching

---

## Stem Separation Terms

### Demucs

State-of-the-art deep learning model for music source separation.

**Output**: Drums, Bass, Melody (Other), Vocals

### Stem

Individual audio source separated from mixed track (e.g., drums, vocals).

**Types in OX Board**: drums, bass, melody, vocals, original

### Stem Mix

Crossfade control between separated stems and original audio.

**Range**: 0 (100% stems) to 1 (100% original)

### Stem Player

Multi-track player with independent control per stem.

**Capabilities**: Individual volume, pan, EQ, mute, solo per stem

### Solo (Stem)

Mute all stems except the soloed one(s).

**Behavior**: Multiple stems can be soloed simultaneously

### Source Separation

Process of extracting individual instruments/voices from mixed audio.

**Technology**: Deep learning (Demucs, Spleeter) or signal processing

---

## Gesture Recognition Terms

### Confidence Score

Probability (0-1) that detected gesture is correct.

**Threshold**: 0.6 minimum for gesture acceptance

### Deadzone

Input range where changes are ignored to prevent jitter.

**Typical**: 0.05-0.15 (5-15% of range)

### Edge Penalty

Reduction in confidence when hand landmarks are near screen edges.

**Penalty**: 20% confidence reduction within 5% edge threshold

### Gesture Classification

Categorized type of detected hand movement.

**Count**: 27 types (pinch, swipe, rotate, fist, etc.)

### Gesture Mapping

Association between gesture and audio control action.

**Components**: Gesture type, hand side, target, control type, mode

### Hand Landmark

One of 21 tracked points on hand (wrist, finger joints, tips).

**Standard**: MediaPipe hand tracking model

### Handedness

Classification of hand as Left or Right.

**Confidence**: Separate confidence score from gesture detection

### Kalman Filter

Mathematical filter for smoothing noisy sensor data.

**Use**: Reduce jitter in hand landmark positions

### Latency (Gesture)

Time delay from hand movement to audio response.

**Target**: <50ms end-to-end

### MediaPipe

Google's framework for real-time perceptual pipelines (hand tracking, pose, etc.).

**Model**: BlazePalm + BlazePose for hand detection

### Pinch Gesture

Thumb and index finger touching/near each other.

**Detection**: Distance < 8% of screen diagonal

### Sensitivity

Multiplier for gesture input, controls how much movement affects parameter.

**Range**: 0.1 (very insensitive) to 10.0 (very sensitive)

### Temporal Stability

Consistency of gesture detection over time window.

**Calculation**: Variance of gesture type and confidence over 500ms-1s

### Two-Hand Gesture

Gesture requiring both hands (e.g., spread, rotate, two-hand pinch).

**Optimal Distance**: ~30% of screen width between hands

---

## State Management Terms

### Action (Store)

Function that modifies state in Zustand store.

**Pattern**: `setDeckVolume(deckId, volume)`

### Channel Config

Configuration object for single mixer channel.

**Properties**: gain, EQ, filter, pan, stem player enabled

### Devtools

Zustand middleware for Redux DevTools integration.

**Benefit**: Time-travel debugging, action logging

### Immutability

State updates create new objects rather than mutating existing.

**Enforcement**: Spread operator, structural sharing

### Selector

Function to extract slice of state from store.

**Benefit**: Components only re-render when selected slice changes

### State Slice

Portion of global state, typically feature-specific.

**Example**: Gesture state, deck state, mixer state

### Store

Central state container (Zustand in OX Board).

**Pattern**: Single global store with actions and state

### Subscriber

Function/component that receives state updates.

**React**: `useEnhancedDJStore()` hook

### Zustand

Minimalist state management library for React.

**Benefits**: Simple API, no boilerplate, TypeScript support

---

## Performance Terms

### Audio Dropout

Gap in audio playback due to buffer underrun.

**Cause**: CPU overload, insufficient buffer size

### CPU Usage

Percentage of processor capacity used by audio processing.

**Target**: <30% for stable performance

### Frame Rate

Number of UI frames rendered per second.

**Target**: 60 FPS for smooth gesture controls

### Metrics Monitoring

Continuous collection of performance statistics.

**Interval**: 1 second update rate

### Output Latency

Additional delay from audio processing to speaker output.

**Typical**: 5-20ms depending on audio interface

### Render Time

Time taken to process one audio buffer callback.

**Constraint**: Must be < buffer duration to avoid dropouts

---

## Architecture Patterns

### Event Emitter

Pattern for loose coupling via events.

**Example**: DeckManager emits `deck:play`, UI subscribes

### Factory Pattern

Pattern for creating objects without specifying exact class.

**Example**: AudioService creates audio nodes

### Observer Pattern

Pattern where subjects notify observers of state changes.

**Example**: Zustand store notifies subscribed components

### Singleton Pattern

Pattern ensuring single instance of class.

**Examples**: AudioService, DeckManager

### Strategy Pattern

Pattern for interchangeable algorithms.

**Example**: Crossfader curves (linear, constant-power, exponential)

---

## File & Module Terms

### Dynamic Import

Lazy-loading modules at runtime rather than initial bundle.

**Syntax**: `const mod = await import('./module')`
**Benefit**: Smaller initial bundle, faster load

### SSR (Server-Side Rendering)

Rendering React components on server before sending to client.

**Constraint**: Audio components must be client-only (no SSR)

### Tree Shaking

Removal of unused code during build process.

**Benefit**: Smaller bundle size
**Requirement**: ES6 modules

### Web Worker

JavaScript thread separate from main UI thread.

**Use**: Music analysis, heavy processing
**Communication**: PostMessage API

---

## Browser & Web Standards

### Autoplay Policy

Browser restriction requiring user gesture before playing audio.

**Workaround**: Wait for click/touch before AudioContext initialization

### Progressive Web App (PWA)

Web app with native-like features (offline, installable, etc.).

**Features**: Service Worker, manifest, offline mode

### Service Worker

Background script for caching, offline functionality, push notifications.

**OX Board**: Workbox-based caching strategy

### WASM (WebAssembly)

Binary format for running high-performance code in browser.

**Use**: Essentia.js music analysis library

---

## Data Types & Formats

### AudioBuffer

Container for decoded audio data in Web Audio API.

**Properties**: sampleRate, length, numberOfChannels

### Blob

Binary large object, used for file data (recordings, stems).

**MIME Types**: audio/webm, audio/wav, audio/mp3

### Point2D

2D coordinate pair.

**Structure**: `{ x: number, y: number }`
**Use**: Gesture landmarks, screen positions

### Transferable

Objects that can be transferred (not copied) between workers.

**Examples**: ArrayBuffer, ImageBitmap
**Benefit**: Zero-copy transfer

---

## UI & UX Terms

### CRT Effect

Visual effect simulating old cathode ray tube monitors.

**Features**: Scanlines, flicker, phosphor glow

### Feature Flag

Runtime toggle for enabling/disabling features.

**Use**: Terminal UI vs Classic UI modes

### Terminal UI

Retro-styled interface mimicking command-line terminals.

**Aesthetic**: Green-on-black, monospace font, scanlines

### Toast / Notification

Temporary UI message for feedback.

**Duration**: 2-5 seconds typical

### View Mode

Active UI layout/panel.

**Types**: mixer, decks, stems, effects, library

---

## Acronyms

| Acronym | Full Form                             | Context                        |
| ------- | ------------------------------------- | ------------------------------ |
| API     | Application Programming Interface     | External service endpoints     |
| BPM     | Beats Per Minute                      | Tempo measurement              |
| CDN     | Content Delivery Network              | MediaPipe loading              |
| CPU     | Central Processing Unit               | Performance metric             |
| CRT     | Cathode Ray Tube                      | Terminal UI aesthetic          |
| DAW     | Digital Audio Workstation             | Professional audio software    |
| DJ      | Disc Jockey                           | Music mixing performer         |
| DSP     | Digital Signal Processing             | Audio manipulation             |
| EQ      | Equalizer                             | Frequency control              |
| FPS     | Frames Per Second                     | Animation rate                 |
| Hz      | Hertz                                 | Frequency unit (cycles/second) |
| LOC     | Lines of Code                         | Codebase metric                |
| MIME    | Multipurpose Internet Mail Extensions | File type identifier           |
| ms      | Milliseconds                          | Time unit (1/1000 second)      |
| PWA     | Progressive Web App                   | Web app standard               |
| SSR     | Server-Side Rendering                 | Pre-rendering technique        |
| UI      | User Interface                        | Visual components              |
| UX      | User Experience                       | User interaction design        |
| WASM    | WebAssembly                           | Binary code format             |

---

## Measurement Units

| Unit | Full Name        | Typical Range | Context                         |
| ---- | ---------------- | ------------- | ------------------------------- |
| dB   | Decibels         | -60 to +6     | Volume/gain measurement         |
| Hz   | Hertz            | 20-20,000     | Frequency (human hearing range) |
| kHz  | Kilohertz        | 44.1, 48, 96  | Sample rate                     |
| ms   | Milliseconds     | 1-100         | Latency measurement             |
| %    | Percent          | 0-100         | Volume, pitch, CPU usage        |
| BPM  | Beats Per Minute | 60-200        | Tempo                           |

---

## Musical Notation

### Intervals

- **Semitone**: Smallest interval (half-step)
- **Whole Tone**: Two semitones (whole-step)
- **Octave**: 12 semitones (frequency doubles)

### Time Signatures

- **4/4**: Four quarter notes per bar (most common)
- **3/4**: Three quarter notes per bar (waltz)
- **6/8**: Six eighth notes per bar (compound meter)

### Note Divisions

- **Whole Note**: 4 beats
- **Half Note**: 2 beats
- **Quarter Note**: 1 beat
- **Eighth Note**: 1/2 beat
- **Sixteenth Note**: 1/4 beat

---

## Industry Standards

### Audio Formats

- **WAV**: Uncompressed, CD quality
- **MP3**: Lossy compression, ~128-320 kbps
- **AAC**: Lossy compression, better than MP3
- **FLAC**: Lossless compression
- **WebM**: Web optimized, used for recording

### Sample Rates

- **44.1 kHz**: CD standard
- **48 kHz**: Professional video/broadcast
- **96 kHz**: Hi-res audio
- **192 kHz**: Ultra hi-res (overkill for most uses)

### Bit Depths

- **16-bit**: CD quality, 96 dB dynamic range
- **24-bit**: Professional, 144 dB dynamic range
- **32-bit float**: Maximum headroom, used internally

---

## OX Board Specific Terms

### Channel

One of 4 mixer inputs, can have stem player or direct audio.

**Numbering**: 0-3

### Classic UI

Modern gradient-based DJ interface (default mode).

**Style**: Colorful, modern, glass-morphism

### Deck (OX Board)

One of 4 deck slots in store, or 2 physical decks (A/B) in DeckManager.

**Confusion**: "Deck" used for both concepts

### Enhanced DJ Store

Main Zustand store for application state.

**Export**: `useEnhancedDJStore` hook

### Gesture Stem Mapper

System mapping gestures to stem controls.

**Profiles**: Customizable mapping configurations

### OX Board

Project name, stands for "Open eXperience Board" (gesture-controlled DJ).

### Terminal UI

Alternative retro-styled interface (feature flagged).

**Toggle**: Bottom-right corner button

---

## Related Technologies

### Essentia.js

JavaScript/WASM port of Essentia audio analysis library.

**Capabilities**: BPM, key, spectral features

### MediaPipe Hands

Google's hand tracking solution.

**Output**: 21 landmarks per hand, handedness, confidence

### Next.js

React framework with SSR, routing, and optimizations.

**Version**: Next.js 15 with App Router

### React

UI library for building component-based interfaces.

**Version**: React 18 with concurrent features

### TypeScript

Typed superset of JavaScript.

**Mode**: Strict mode enabled

---

_Last Updated: 2025-10-09_
_Total Terms: 150+_
_Categories: 15_
