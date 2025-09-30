# Audio Features Guide

OX Board provides professional-grade audio processing capabilities with multi-stem control, advanced effects, and real-time audio analysis. This guide covers all audio features from basic stem mixing to advanced production techniques.

## Multi-Stem Architecture

### Understanding Stems

OX Board separates audio into distinct stems for independent control:

- **🥁 Drums**: Kick, snare, hi-hats, percussion, and rhythmic elements
- **🎸 Bass**: Bass guitar, synth bass, and low-frequency instruments
- **🎹 Melody**: Lead instruments, synths, and melodic elements
- **🎤 Vocals**: Lead vocals, backing vocals, and vocal effects
- **🎵 Original**: Full mix for reference and fallback

### Stem Processing Pipeline

#### 1. Audio Upload

- **Supported Formats**: MP3, WAV, FLAC, AAC, OGG
- **Quality Requirements**: 44.1kHz minimum, 16-bit recommended
- **File Size**: Up to 100MB per track
- **Processing Time**: 10-30 seconds depending on file size and complexity

#### 2. Automatic Stem Separation

Using advanced audio processing algorithms:

- **AI-Powered Analysis**: Identifies musical elements and their characteristics
- **Spectral Processing**: Separates frequency ranges and harmonic content
- **Temporal Analysis**: Maintains timing relationships between stems
- **Quality Optimization**: Balances separation quality with processing speed

#### 3. Real-Time Processing

- **Ultra-Low Latency**: <10ms processing delay
- **Sample-Accurate Sync**: Perfect synchronization between all stems
- **Dynamic Adjustment**: Real-time parameter changes without artifacts
- **CPU Optimization**: Efficient processing using Web Audio API

## Individual Stem Control

### Volume Control

#### Basic Volume Adjustment

```typescript
// Set individual stem volume (0-1)
setStemVolume("vocals", 0.8); // 80% volume
setStemVolume("drums", 0.9); // 90% volume
setStemVolume("bass", 0.7); // 70% volume
setStemVolume("melody", 0.6); // 60% volume
```

#### Advanced Volume Techniques

- **Relative Adjustment**: Adjust volumes relative to each other
- **Group Control**: Control multiple stems simultaneously
- **Automation**: Record and playback volume changes
- **MIDI Mapping**: Map external controllers to stem volumes

### Mute and Solo System

#### Mute Controls

- **Individual Mute**: Silence specific stems
- **Group Mute**: Mute multiple related stems
- **Smart Mute**: AI-suggested muting for better clarity
- **Emergency Mute**: Instant muting of all audio

#### Solo System

- **Exclusive Solo**: Hear only the soloed stem
- **Multiple Solo**: Hear multiple soloed stems together
- **Solo Safe**: Prevent accidental solo activation
- **Solo Isolate**: Focus on specific elements for editing

### Equalization (EQ)

#### 3-Band EQ per Stem

- **Low (20-250Hz)**: Bass and sub-bass control
- **Mid (250-4000Hz)**: Presence and clarity
- **High (4000-20kHz)**: Air and sparkle

```typescript
// Adjust EQ for individual stems
setStemEQ("vocals", "low", -2); // Reduce muddiness
setStemEQ("vocals", "mid", 3); // Increase presence
setStemEQ("vocals", "high", 1); // Add air

setStemEQ("drums", "low", 2); // Boost kick drum
setStemEQ("drums", "mid", -1); // Reduce boxiness
setStemEQ("drums", "high", 0); // Neutral high end
```

#### EQ Tips for Common Scenarios

- **Vocal Clarity**: Boost mid frequencies (2-4kHz) while cutting low mud
- **Drum Punch**: Boost low frequencies (60-100Hz) for kick impact
- **Bass Definition**: Cut low-mids (200-400Hz) to reduce muddiness
- **Overall Balance**: Use subtle boosts/cuts (±3dB) for natural sound

### Stereo Panning

#### Pan Control

- **Left-Right Positioning**: Place stems anywhere in stereo field
- **Mono Compatibility**: Ensure mix translates to mono systems
- **Spatial Imaging**: Create depth and width in mix
- **Automation**: Dynamic panning for movement effects

```typescript
// Pan stems for spatial interest
setStemPan("vocals", 0); // Center (default)
setStemPan("drums", -0.1); // Slightly left
setStemPan("melody", 0.3); // Right side
setStemPan("bass", 0); // Center for foundation
```

### Playback Rate Control

#### Tempo and Pitch Adjustment

- **Independent Control**: Change speed without affecting pitch
- **Pitch Shifting**: Adjust pitch while maintaining tempo
- **Formant Preservation**: Maintain natural sound quality
- **Sync Options**: Keep stems synchronized when adjusting rate

```typescript
// Adjust playback rate per stem
setStemPlaybackRate("vocals", 1.0); // Normal speed
setStemPlaybackRate("drums", 0.95); // Slightly slower
setStemPlaybackRate("melody", 1.05); // Slightly faster
```

## Professional Effects Rack

### Reverb Effects

#### Types of Reverb

- **Room**: Small to medium room simulation
- **Hall**: Large concert hall reverb
- **Plate**: Classic plate reverb sound
- **Spring**: Vintage spring reverb
- **Chamber**: Natural chamber acoustics

```typescript
// Configure reverb parameters
setEffectParam("reverb", "enabled", true);
setEffectParam("reverb", "roomSize", 0.7); // 0-1 (small to large)
setEffectParam("reverb", "dampening", 0.3); // 0-1 (bright to dark)
setEffectParam("reverb", "wet", 0.25); // 0-1 (dry to wet)
```

#### Reverb Techniques

- **Vocal Space**: Add subtle reverb to vocals for depth
- **Drum Ambience**: Add space to drums without washing out
- **Special Effects**: Use extreme settings for creative effects
- **Predelay**: Adjust early reflections for clarity

### Delay Effects

#### Delay Types

- **Digital Delay**: Clean, modern delay
- **Tape Delay**: Warm, saturated delay with pitch modulation
- **Analog Delay**: Classic analog delay characteristics
- **Ping-Pong**: Delay bounces between left and right channels

```typescript
// Configure delay parameters
setEffectParam("delay", "enabled", true);
setEffectParam("delay", "delayTime", 0.25); // Delay time in seconds
setEffectParam("delay", "feedback", 0.4); // 0-0.9 feedback amount
setEffectParam("delay", "wet", 0.3); // 0-1 wet/dry mix
```

#### Tempo-Synced Delay

```typescript
// Sync delay to BPM
const bpm = 120;
const noteDivisions = {
  "1/4": 60 / bpm, // Quarter note
  "1/8": 60 / bpm / 2, // Eighth note
  "1/16": 60 / bpm / 4, // Sixteenth note
  "1/32": 60 / bpm / 8, // Thirty-second note
};

setEffectParam("delay", "delayTime", noteDivisions["1/8"]);
```

### Filter Effects

#### Filter Types

- **Low-Pass**: Removes high frequencies
- **High-Pass**: Removes low frequencies
- **Band-Pass**: Allows only middle frequencies
- **Notch**: Removes specific frequency range

```typescript
// Configure filter effects
setEffectParam("filter", "enabled", true);
setEffectParam("filter", "type", "lowpass");
setEffectParam("filter", "frequency", 1000); // Cutoff frequency (Hz)
setEffectParam("filter", "resonance", 5); // 0-20 dB resonance
```

#### Filter Sweep Techniques

- **DJ Filter Sweeps**: Classic riser and drop effects
- **Vocal Filtering**: Add movement to vocal phrases
- **Special Effects**: Create telephone or radio effects
- **Automation**: Record filter movements for complex effects

### Distortion Effects

#### Distortion Types

- **Overdrive**: Gentle tube-like distortion
- **Distortion**: Classic guitar distortion
- **Fuzz**: Extreme, wooly distortion
- **Bit Crusher**: Digital artifact distortion

```typescript
// Configure distortion
setEffectParam("distortion", "enabled", true);
setEffectParam("distortion", "amount", 0.3); // 0-1 distortion intensity
setEffectParam("distortion", "tone", 0.7); // 0-1 tone control
```

### Compression

#### Compression Parameters

- **Threshold**: Level at which compression begins (-60 to 0 dB)
- **Ratio**: Amount of compression (1:1 to 20:1)
- **Attack**: How quickly compression engages (0-1000ms)
- **Release**: How quickly compression disengages (0-1000ms)

```typescript
// Configure compression
setEffectParam("compressor", "enabled", true);
setEffectParam("compressor", "threshold", -20); // Compression starts at -20dB
setEffectParam("compressor", "ratio", 4); // 4:1 compression ratio
setEffectParam("compressor", "attack", 5); // Fast attack for punch
setEffectParam("compressor", "release", 50); // Smooth release
```

## Advanced Audio Features

### Crossfader

#### Basic Crossfading

- **A/B Crossfade**: Fade between two different mixes
- **Stem Crossfade**: Fade between different stem configurations
- **Effect Crossfade**: Transition between effect settings

```typescript
// Control crossfader position (-1 to 1)
setCrossfader(-1); // Full A
setCrossfader(0); // Center (50/50 mix)
setCrossfader(1); // Full B
```

### Sidechain Ducking

#### Automatic Ducking

- **Vocal Ducking**: Automatically lower music during vocals
- **Kick Ducking**: Create pumping bass effect with kick drum
- **Custom Ducking**: Configure any trigger and target combination

```typescript
// Setup sidechain ducking
const duckingConfig = {
  trigger: "vocals", // Audio that triggers ducking
  target: "melody", // Audio that gets ducked
  amount: 0.7, // How much to duck (0-1)
  attack: 10, // Attack time (ms)
  release: 100, // Release time (ms)
  threshold: -30, // Trigger threshold (dB)
};
```

### Harmonic Mixing

#### Key Detection and Compatibility

- **Automatic Key Detection**: Analyzes audio to determine musical key
- **Camelot Wheel**: Visual representation of key relationships
- **Compatibility Matching**: Find harmonically compatible tracks
- **Energy Matching**: Match energy levels for smooth transitions

```typescript
// Get audio analysis
const analysis = await getAudioAnalysis();
console.log(
  `Key: ${analysis.key}, BPM: ${analysis.bpm}, Energy: ${analysis.energy}`,
);

// Find compatible tracks
const compatibleTracks = findCompatibleTracks(analysis, trackLibrary);
```

### Audio Analysis Features

#### Real-Time Analysis

- **Spectral Analysis**: Frequency content visualization
- **RMS Detection**: Volume and dynamics monitoring
- **Beat Detection**: Tempo and rhythm analysis
- **Key Detection**: Musical key identification

```typescript
// Monitor real-time audio features
const realtimeData = getRealtimeAnalysis();
const {
  rms, // Current volume level
  spectralCentroid, // Brightness of sound
  spectralRolloff, // High frequency content
  zeroCrossingRate, // Noisiness of sound
  beats, // Detected beat positions
} = realtimeData;
```

## Professional Workflow Features

### Recording and Automation

#### Mix Recording

1. **Start Recording**: Begin capturing all mix changes
2. **Gesture Recording**: Record gesture movements for playback
3. **Parameter Recording**: Capture all stem and effect changes
4. **Export Mix**: Save recording as automation data or audio file

#### Automation Playback

- **Gesture Playback**: Replay recorded gesture sequences
- **Parameter Automation**: Apply recorded parameter changes
- **Loop Automation**: Loop sections for consistent performance
- **Speed Control**: Adjust playback speed of automation

### Session Management

#### Saving and Loading

- **Mix Presets**: Save and recall favorite mix settings
- **Session States**: Save entire session configurations
- **Gesture Mappings**: Store custom gesture configurations
- **Effect Chains**: Save complex effect combinations

#### Version Control

- **Mix History**: Track changes and revert if needed
- **A/B Comparison**: Compare different mix versions
- **Collaborative Editing**: Share sessions with other users
- **Backup and Sync**: Automatic cloud backup

### Performance Optimization

#### Latency Management

- **Buffer Optimization**: Minimize audio buffer sizes
- **Processing Priority**: Optimize CPU usage for audio
- **Sample Rate Management**: Balance quality and performance
- **Real-Time Monitoring**: Track and optimize latency

#### Memory Management

- **Buffer Pooling**: Reuse audio buffers to reduce garbage collection
- **Stem Caching**: Cache processed stems for instant loading
- **Memory Monitoring**: Track and optimize memory usage
- **Cleanup Automation**: Automatic cleanup of unused resources

## Audio Routing and Buses

### Master Bus

- **Master Volume**: Overall output level
- **Master Effects**: Effects applied to entire mix
- **Master EQ**: Final tonal shaping
- **Master Compression**: Overall dynamics control

### Submix Buses

- **Drum Bus**: Group all drum stems with shared processing
- **Music Bus**: Combine melody and bass with group effects
- **Vocal Bus**: Process all vocal elements together
- **Effects Buses**: Parallel processing for complex effects

```typescript
// Create custom bus routing
const routing = {
  drums: ["kick", "snare", "hats", "percussion"],
  music: ["bass", "melody", "harmony"],
  vocals: ["lead_vocals", "backing_vocals"],
  effects: ["reverb", "delay", "special_effects"],
};
```

## Integration and External Control

### MIDI Controller Support

#### Mapping Controls

- **Volume Faders**: Map physical faders to stem volumes
- **Mute Buttons**: Assign hardware buttons to mute functions
- **Effect Knobs**: Control effect parameters with rotary encoders
- **Transport Controls**: Start/stop/playback with hardware transport

#### MIDI Learn

1. **Enable MIDI Learn mode**
2. **Move physical control**
3. **Perform on-screen action**
4. **Mapping is automatically created**

### OSC (Open Sound Control)

#### Network Control

- **Remote Control**: Control OX Board from other applications
- **Show Control**: Integrate with lighting and video systems
- **Multi-User**: Share control between multiple devices
- **Custom Messages**: Create custom OSC mappings

### DAW Integration

#### Ableton Live

- **Link Integration**: Sync tempo and transport with Ableton Live
- **Clip Control**: Trigger and control Live clips
- **Parameter Mapping**: Map Live device parameters to gestures
- **Session View**: Navigate and control Live's session view

#### Other DAWs

- **REAPER**: Full OSC integration with REAPER
- **Logic Pro**: MIDI and network control
- **Pro Tools**: HUI protocol support
- **Studio One**: Custom macro control

## Audio Quality and Performance

### Quality Settings

#### Sample Rate Options

- **44.1kHz**: CD quality, standard for music
- **48kHz**: Professional standard, better high-frequency response
- **96kHz**: High-resolution audio, minimal processing artifacts

#### Bit Depth Settings

- **16-bit**: Standard quality, smaller file sizes
- **24-bit**: Professional quality, better dynamic range
- **32-bit float**: Maximum quality, no clipping concerns

#### Buffer Size Optimization

- **128 samples**: Lowest latency, highest CPU usage
- **256 samples**: Balanced latency and performance
- **512 samples**: Lower CPU usage, higher latency
- **1024 samples**: Maximum compatibility, highest latency

### Monitoring and Metering

#### Level Meters

- **Peak Meters**: Show instantaneous peak levels
- **RMS Meters**: Show average volume levels
- **VU Meters**: Classic volume unit meters
- **Spectrum Analyzers**: Visual frequency analysis

#### Phase Correlation

- **Phase Scope**: Monitor phase relationships
- **Stereo Image**: Visualize stereo width
- **Correlation Meter**: Ensure mono compatibility

## Troubleshooting Audio Issues

### Common Problems and Solutions

#### Audio Glitches or Dropouts

- **Increase buffer size**: Use larger audio buffers
- **Close other applications**: Free up system resources
- **Update audio drivers**: Ensure latest drivers installed
- **Check sample rate**: Match system sample rate

#### Poor Stem Separation Quality

- **Use high-quality source**: Start with well-recorded audio
- **Check file format**: Use lossless formats when possible
- **Adjust processing settings**: Fine-tune separation parameters
- **Manual correction**: Use manual stem adjustment tools

#### Latency Issues

- **Optimize buffer settings**: Find sweet spot for your system
- **Use ASIO drivers**: On Windows for lowest latency
- **Close background apps**: Minimize system load
- **Update firmware**: Keep audio interface firmware current

#### Phase Cancellation

- **Check phase relationships**: Use phase correlation meters
- **Flip phase**: Invert phase on problematic stems
- **Adjust timing**: Fine-tune stem alignment
- **Use phase correction**: Automatic phase alignment tools

## Best Practices for Audio Quality

### Recording and Production

1. **Start with quality**: Use well-recorded, high-quality source material
2. **Monitor levels**: Keep levels optimal to avoid clipping
3. **Use reference tracks**: Compare your mix to professional recordings
4. **Take breaks**: Fresh ears catch more issues

### Mixing Workflow

1. **Balance first**: Get volume balance right before effects
2. **EQ subtractively**: Cut problematic frequencies before boosting
3. **Use reference levels**: Mix at consistent volume levels
4. **Check in mono**: Ensure mix translates to mono systems

### Effect Usage

1. **Less is more**: Start with subtle effect settings
2. **Chain effects**: Use multiple subtle effects for complex sounds
3. **Automate changes**: Vary effects over time for interest
4. **Save presets**: Document successful effect combinations

### Performance Optimization

1. **Monitor CPU usage**: Keep CPU under 80% for smooth performance
2. **Use efficient effects**: Choose CPU-friendly algorithms
3. **Freeze tracks**: Apply effects permanently when possible
4. **Optimize sample rate**: Use appropriate rate for your needs

## Creative Audio Techniques

### Advanced Mixing Techniques

#### Parallel Processing

- **Parallel Compression**: Blend compressed and uncompressed signals
- **Parallel EQ**: Apply extreme EQ to parallel channel
- **Parallel Reverb**: Add reverb without washing out dry signal
- **Parallel Distortion**: Add grit without losing clarity

#### Frequency Masking

- **Identify conflicts**: Find where instruments mask each other
- **Carve space**: Use EQ to create space for each element
- **Dynamic EQ**: Automatically adjust EQ based on audio content
- **Multiband processing**: Process different frequency ranges separately

#### Temporal Effects

- **Pre-delay**: Adjust reverb pre-delay for clarity
- **Attack/release shaping**: Control effect envelope
- **Transient design**: Enhance or soften attack characteristics
- **Gating and expansion**: Control dynamic range dynamically

### Creative Applications

#### Genre-Specific Techniques

- **Electronic Music**: Heavy use of filters and delays
- **Rock/Pop**: Focus on vocal clarity and drum punch
- **Jazz**: Natural reverb and subtle compression
- **Classical**: Minimal processing, focus on natural sound

#### Special Effects

- **Stutter Effects**: Create rhythmic gating effects
- **Reverse Reverb**: Classic eerie reverb effect
- **Pitch Shifting**: Create harmonies and special effects
- **Granular Processing**: Experimental sound design

This comprehensive audio feature set makes OX Board a powerful tool for both live performance and studio production, providing professional-grade audio processing with intuitive gesture control.
