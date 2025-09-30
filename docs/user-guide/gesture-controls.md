# Gesture Controls Reference Guide

This comprehensive guide covers all gesture controls available in OX Board, from basic single-hand gestures to advanced two-hand combinations and gesture recording features.

## Gesture Recognition Basics

### How Gesture Recognition Works

OX Board uses advanced MediaPipe hand tracking to recognize 21 key points on each hand, analyzing their positions and movements to detect specific gestures. The system processes at 60fps for ultra-low latency response.

### Gesture Confidence Levels

Each gesture is assigned a confidence score from 0-1:

- **🔴 0.0-0.3**: Unlikely gesture (ignored)
- **🟡 0.3-0.7**: Possible gesture (with visual feedback)
- **🟢 0.7-1.0**: Confirmed gesture (executes action)

### Visual Feedback

The system provides real-time feedback:

- **Hand skeleton**: See the 21 tracked points on your hand
- **Gesture indicators**: Visual confirmation when gestures are recognized
- **Confidence meters**: Real-time confidence level display
- **Active zones**: Highlighted areas showing gesture effectiveness

## Single Hand Gestures

### Basic Control Gestures

#### 👌 Pinch Gesture (Volume Control)

**Primary Use**: Volume adjustment and parameter control

**How to Perform**:

1. Bring your **thumb and index finger** close together
2. Move them closer to **decrease** values
3. Move them apart to **increase** values

**Applications**:

- **Stem Volume**: Pinch to control individual stem volumes
- **Master Volume**: Pinch with both hands for master volume
- **Effect Parameters**: Control reverb, delay, filter settings
- **EQ Bands**: Adjust low, mid, high frequency bands

**Tips**:

- Keep fingers straight and visible to camera
- Practice consistent pinch distance for precise control
- Use slow, deliberate movements for fine adjustments

#### 🖐️ Spread Gesture (Effect Intensity)

**Primary Use**: Effect intensity and multi-parameter control

**How to Perform**:

1. Spread all **five fingers** wide apart
2. Wider spread = **higher intensity**
3. Narrower spread = **lower intensity**

**Applications**:

- **Effect Wet/Dry**: Control effect mix levels
- **Filter Resonance**: Adjust filter emphasis
- **Distortion Amount**: Control overdrive intensity
- **Multiple Parameters**: Simultaneously control related parameters

**Tips**:

- Keep palm facing camera for best recognition
- Maintain consistent hand angle
- Use full range of motion for maximum control

#### ✊ Fist Gesture (Mute/Toggle)

**Primary Use**: Muting, soloing, and toggle functions

**How to Perform**:

1. Close your hand into a **tight fist**
2. Open hand to **toggle off**
3. Make fist again to **toggle on**

**Applications**:

- **Stem Mute**: Mute/unmute individual stems
- **Effect Bypass**: Enable/disable audio effects
- **Solo Mode**: Isolate stems for focused editing
- **Global Mute**: Mute all audio (emergency stop)

**Tips**:

- Close fist completely for reliable recognition
- Hold fist steady for toggle actions
- Use quick fist motions for tap-like control

### Advanced Single Hand Gestures

#### 👆 Point Gesture (Selection)

**Primary Use**: Selecting stems and interface elements

**How to Perform**:

1. Extend your **index finger**
2. Point directly at target stem or control
3. Keep other fingers relaxed

**Applications**:

- **Stem Selection**: Point at stems to select them for control
- **Interface Navigation**: Point at buttons and controls
- **Parameter Targeting**: Select specific EQ bands or effects

**Tips**:

- Point with confidence and keep finger steady
- Ensure clear line of sight to target
- Use pointing for precise control selection

#### 👍 Thumbs Up (Confirmation)

**Primary Use**: Confirmation and positive actions

**How to Perform**:

1. Close fist with **thumb extended upward**
2. Hold steady for confirmation
3. Return to neutral position to complete

**Applications**:

- **Apply Settings**: Confirm effect or mix changes
- **Save Preset**: Save current gesture mappings
- **Accept AI Suggestion**: Apply recommended mix changes

#### 👎 Thumbs Down (Rejection)

**Primary Use**: Rejection and negative actions

**How to Perform**:

1. Close fist with **thumb extended downward**
2. Hold for rejection
3. Return to neutral to complete

**Applications**:

- **Reject AI Suggestion**: Decline recommended changes
- **Undo Action**: Revert last action
- **Cancel Operation**: Stop current operation

## Two-Hand Gestures

Two-hand gestures provide advanced control capabilities and are essential for professional mixing workflows.

### Basic Two-Hand Gestures

#### 🤏 Two-Hand Pinch (Master Control)

**Primary Use**: Master volume and global parameters

**How to Perform**:

1. Make **pinch gesture** with both hands simultaneously
2. Bring pinches **closer together** to decrease
3. Move pinches **apart** to increase

**Applications**:

- **Master Volume**: Overall mix volume control
- **Global Effects**: Control master bus effects
- **Crossfade**: Transition between different mix states

**Tips**:

- Keep both hands at similar heights
- Mirror the pinch distance between hands
- Use for global changes affecting entire mix

#### 👐 Spread Hands (Crossfade)

**Primary Use**: Crossfading and balance control

**How to Perform**:

1. Hold both hands with **palms facing each other**
2. Spread hands **apart** for one extreme
3. Bring hands **together** for other extreme

**Applications**:

- **Stem Crossfade**: Fade between different stems
- **Effect Morphing**: Transition between effect settings
- **Balance Control**: Left/right stereo balance

**Tips**:

- Keep hands parallel and at same height
- Use smooth, controlled movements
- Perfect for creating build-ups and transitions

#### 🔄 Circular Motion (Filter Sweep)

**Primary Use**: Filter frequency modulation

**How to Perform**:

1. Make **circular motion** with pointed finger
2. Clockwise = **increase frequency**
3. Counter-clockwise = **decrease frequency**

**Applications**:

- **Filter Sweeps**: Create DJ-style filter effects
- **Parameter Automation**: Automate any parameter with circular motion
- **Tempo Control**: Adjust playback speed/tempo

**Tips**:

- Keep circles smooth and consistent
- Larger circles = more dramatic effect
- Use for creating riser and drop effects

### Advanced Two-Hand Gestures

#### 🎯 Mirror Gestures (Dual Control)

**Primary Use**: Simultaneous control of multiple parameters

**How to Perform**:

1. Perform **same gesture** with both hands
2. Left hand controls **one parameter**
3. Right hand controls **another parameter**

**Applications**:

- **Dual EQ**: Control high and low frequencies simultaneously
- **Stereo Effects**: Control left and right channel effects
- **Parallel Processing**: Independent control of related parameters

#### ⚡ Opposing Gestures (Differential Control)

**Primary Use**: Creating contrast and dynamics

**How to Perform**:

1. Perform **opposite gestures** with each hand
2. One hand **increasing**, other **decreasing**
3. Create **dynamic contrast** in mix

**Applications**:

- **Build/Drop**: Create tension and release
- **Frequency Balance**: Adjust frequency spectrum dynamically
- **Effect Contrast**: Opposing effect intensities

## Gesture Recording and Playback

### Recording Gestures

#### Start Recording

1. **Open gesture recording panel**
2. **Click "Start Recording"**
3. **Perform gestures** naturally as you want them recorded
4. **Click "Stop Recording"** when finished

#### Recording Tips

- **Natural Timing**: Record gestures at natural speed
- **Clear Movements**: Make distinct, recognizable gestures
- **Length**: Keep recordings under 30 seconds for best performance
- **Multiple Takes**: Record multiple takes and choose the best

#### Playback Modes

- **🔁 Loop**: Continuously repeat recorded gesture sequence
- **▶️ Once**: Play through sequence one time
- **⏯️ Pause**: Pause playback at any point
- **⏩ Speed**: Adjust playback speed (0.5x to 2x)

### Using Recorded Gestures

#### Automation

```typescript
// Apply recorded gestures to automation
const automation = {
  gestureSequence: recordedGestures,
  targetParameter: "vocalVolume",
  duration: 30, // seconds
  loop: true,
};

// Start automation
startGestureAutomation(automation);
```

#### Live Performance

1. **Load gesture recording** into performance slot
2. **Trigger playback** with fist gesture or key press
3. **Layer with live gestures** for dynamic performances
4. **Sync to beat** for perfectly timed effects

## Gesture Mapping and Customization

### Creating Custom Mappings

#### Step 1: Choose Gesture

1. **Select gesture type** from available gestures
2. **Test recognition** to ensure reliability
3. **Adjust sensitivity** if needed

#### Step 2: Assign Action

1. **Choose target**: Stem, effect, or global parameter
2. **Set control type**: Volume, mute, EQ, pan, etc.
3. **Configure range**: Minimum and maximum values

#### Step 3: Fine-tune

1. **Deadzone**: Set area where gesture has no effect
2. **Smoothing**: Adjust response curve and filtering
3. **Scaling**: Customize sensitivity and range

### Preset Gesture Mappings

#### 🎵 DJ Performance Preset

```typescript
const djPreset = {
  PINCH_LEFT: { action: "volume", target: "vocals", range: [0, 1] },
  SPREAD_LEFT: { action: "eq_high", target: "melody", range: [-12, 12] },
  FIST_LEFT: { action: "mute", target: "drums" },
  PINCH_RIGHT: { action: "volume", target: "bass", range: [0, 1] },
  SPREAD_RIGHT: { action: "reverb_wet", target: "master", range: [0, 0.5] },
  FIST_RIGHT: { action: "solo", target: "vocals" },
};
```

#### 🎚️ Studio Production Preset

```typescript
const studioPreset = {
  PINCH_LEFT: { action: "volume", target: "all_stems", range: [0, 1] },
  SPREAD_LEFT: { action: "eq_mid", target: "melody", range: [-6, 6] },
  FIST_LEFT: { action: "record_automation" },
  CIRCLE_LEFT: { action: "filter_freq", target: "master", range: [100, 8000] },
  PINCH_BOTH: { action: "master_volume", range: [0, 1] },
  SPREAD_BOTH: { action: "crossfade_stems", range: [0, 1] },
};
```

## Gesture Performance Optimization

### Calibration Process

#### Automatic Calibration

1. **Open calibration panel**
2. **Follow on-screen instructions**
3. **Perform each gesture 3-5 times**
4. **System learns your gesture patterns**
5. **Save calibration profile**

#### Manual Calibration

1. **Adjust individual gesture sensitivity**
2. **Set custom deadzones**
3. **Configure gesture-specific smoothing**
4. **Test and refine each gesture**

### Performance Settings

#### Sensitivity Adjustment

```typescript
const gestureSettings = {
  globalSensitivity: 0.8, // Overall gesture sensitivity
  deadzoneSize: 0.1, // Area with no response
  smoothingAmount: 0.3, // Response smoothing (0-1)
  hysteresis: 0.05, // Prevent gesture oscillation
  confidenceThreshold: 0.7, // Minimum confidence to trigger
};
```

#### Frame Rate Optimization

- **High Performance**: 60fps, low latency, higher CPU usage
- **Balanced**: 30fps, moderate latency, normal CPU usage
- **Battery Saver**: 15fps, higher latency, low CPU usage

### Troubleshooting Recognition Issues

#### Common Problems

**Problem**: Gestures not recognized consistently
**Solutions**:

1. **Improve lighting**: Ensure even, bright lighting
2. **Check camera position**: Adjust angle and distance
3. **Recalibrate**: Run calibration again
4. **Clean background**: Remove distracting elements
5. **Hand positioning**: Keep hands clearly visible

**Problem**: Gestures too sensitive or not sensitive enough
**Solutions**:

1. **Adjust sensitivity**: Lower for too sensitive, raise for not sensitive enough
2. **Set deadzones**: Prevent unwanted activation
3. **Check confidence threshold**: Ensure minimum confidence is appropriate
4. **Smoothing**: Increase smoothing to reduce jitter

**Problem**: Delayed response or lag
**Solutions**:

1. **Lower frame rate**: Reduce to 30fps if needed
2. **Close other applications**: Free up system resources
3. **Update browser**: Ensure latest version
4. **Check hardware**: Verify camera and system performance

## Advanced Gesture Techniques

### Gesture Chaining

Combine multiple gestures for complex control:

#### Example: Build-Drop Sequence

1. **Setup**: Both hands in neutral position
2. **Build**: Gradually spread hands apart (increasing intensity)
3. **Transition**: Two-hand pinch to control filter sweep
4. **Drop**: Fist gestures to mute/unmute stems
5. **Release**: Return hands to neutral position

#### Example: Frequency Balancing

1. **Left hand pinch**: Control low frequency EQ
2. **Right hand pinch**: Control high frequency EQ
3. **Both hands spread**: Balance mid frequencies
4. **Result**: Real-time 3-band EQ control

### Gesture Layering

Layer multiple gestures for rich control:

#### Example: Vocal Processing Chain

- **Left hand pinch**: Vocal volume
- **Left hand spread**: Reverb intensity
- **Right hand fist**: Vocal mute
- **Right hand point**: De-esser intensity

### Dynamic Gesture Mapping

Change gesture mappings based on context:

```typescript
// Context-aware gesture mapping
const dynamicMappings = {
  // Performance mode
  performance: {
    PINCH: "volume",
    SPREAD: "effects",
    FIST: "mute",
  },
  // Studio mode
  studio: {
    PINCH: "fine_volume",
    SPREAD: "eq_bands",
    FIST: "record",
  },
};

// Switch mappings based on mode
setGestureMappings(dynamicMappings[currentMode]);
```

## Gesture Accessibility

### Alternative Control Methods

#### Voice Control

- **Voice commands**: "Increase vocals", "Mute drums"
- **Keyword activation**: "Hey OX, turn up the bass"
- **Voice feedback**: Audio confirmation of actions

#### Keyboard/Mouse Control

- **Full keyboard support**: All gestures have keyboard equivalents
- **Mouse control**: Click and drag for all parameters
- **Accessibility mode**: Simplified interface for motor impairments

#### Switch Control

- **External switches**: Connect accessibility switches
- **Scanning interface**: Automatic scanning with switch activation
- **Custom timing**: Adjustable scan speed and timing

### Visual Accessibility

#### High Contrast Mode

- **Increased contrast**: Enhanced visibility for low vision
- **Large gesture indicators**: Bigger visual feedback
- **Color customization**: Adjust colors for color blindness

#### Screen Reader Support

- **Gesture announcements**: "Pinch gesture recognized"
- **Parameter feedback**: "Vocal volume 75%"
- **Status updates**: "Stem muted", "Effect enabled"

## Practice Exercises

### Beginner Exercises

#### Exercise 1: Basic Volume Control

1. Load a track with clear vocals
2. Use pinch gesture to control vocal volume
3. Practice smooth volume changes
4. Try muting vocals with fist gesture

#### Exercise 2: Effect Introduction

1. Enable reverb effect
2. Use spread gesture to control reverb intensity
3. Practice bringing reverb in and out smoothly
4. Try the same with other effects

#### Exercise 3: Multi-Stem Mixing

1. Load track with good stem separation
2. Practice controlling multiple stems
3. Use different gestures for different stems
4. Create simple mix transitions

### Intermediate Exercises

#### Exercise 4: Gesture Recording

1. Record a simple gesture sequence
2. Play back the recording
3. Adjust timing and refine gestures
4. Apply to automation

#### Exercise 5: Two-Hand Coordination

1. Practice two-hand pinch for master volume
2. Use spread hands for crossfading
3. Coordinate both hands for complex effects
4. Develop muscle memory for common patterns

#### Exercise 6: Dynamic Mixing

1. Mix a full track using only gestures
2. Practice smooth transitions
3. Use AI suggestions to improve
4. Record and analyze your performance

### Advanced Exercises

#### Exercise 7: Live Performance Simulation

1. Set up dual-deck mixing
2. Practice beat-matched transitions
3. Use gesture recording for complex automation
4. Perform a 5-minute mix set

#### Exercise 8: Custom Mapping Creation

1. Create custom gesture mappings for your workflow
2. Test and refine sensitivity settings
3. Document your mappings for future use
4. Share with the community

## Getting the Most from Gestures

### Daily Practice Tips

- **Start simple**: Master basic gestures before complex combinations
- **Regular use**: Use gestures daily to develop muscle memory
- **Record sessions**: Review your gesture technique
- **Get feedback**: Use the built-in performance monitoring

### Performance Optimization

- **Consistent environment**: Use same lighting and camera position
- **Regular calibration**: Recalibrate every 1-2 weeks
- **System maintenance**: Keep software and drivers updated
- **Hardware optimization**: Use recommended camera and system specs

### Creative Applications

- **Live performance**: Use for dynamic, expressive mixing
- **Studio production**: Integrate into your production workflow
- **Teaching tool**: Demonstrate mixing concepts visually
- **Accessibility**: Enable new forms of musical expression

Remember: Gestures should feel natural and expressive. Take time to develop your personal gesture vocabulary and style. The more comfortable you become with gesture control, the more creative and musical your mixing will become!
