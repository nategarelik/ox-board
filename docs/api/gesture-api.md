# Gesture Recognition API

## Overview

The OX Board Gesture Recognition API provides ultra-low latency hand tracking and gesture recognition using MediaPipe. The system processes 21 hand landmarks at 60fps with advanced performance optimizations including SIMD operations, buffer pooling, and intelligent caching.

## Core Components

### OptimizedGestureRecognizer

Main gesture recognition class with performance optimizations.

```typescript
class OptimizedGestureRecognizer {
  constructor(config?: Partial<OptimizedGestureConfig>);

  recognizeGesturesOptimized(
    leftHand: HandResult | null,
    rightHand: HandResult | null,
    screenWidth: number,
    screenHeight: number,
  ): GestureResult[];

  getPerformanceMetrics(): GestureProcessingMetrics;
  optimizeConfiguration(): void;
  clearCaches(): void;
}
```

#### Configuration Options

```typescript
interface OptimizedGestureConfig {
  enableSIMD: boolean; // Enable SIMD optimizations (default: true)
  enableBufferPooling: boolean; // Enable buffer pooling (default: true)
  enableCaching: boolean; // Enable gesture caching (default: true)
  frameSkipThreshold: number; // Frame skip threshold in ms (default: 16.67)
  confidenceThreshold: number; // Minimum confidence threshold (default: 0.6)
  maxProcessingTime: number; // Maximum processing time per frame (default: 10)
}
```

## Gesture Types

### Single Hand Gestures

#### PINCH Gesture

**GestureType**: `PINCH`
**Hand Side**: Left or Right
**Control**: Volume control, parameter adjustment

```typescript
interface PinchGesture {
  type: "PINCH";
  confidence: number; // 0-1 confidence score
  handSide: "Left" | "Right";
  data: {
    thumbTip: Point2D; // Thumb tip coordinates
    indexTip: Point2D; // Index finger tip coordinates
    pinchStrength: number; // 0-1 pinch strength
    pinchDistance: number; // Distance between thumb and index
  };
  timestamp: number;
}
```

**Usage**:

- **Volume Control**: Closer pinch = quieter, wider pinch = louder
- **Parameter Adjustment**: Pinch distance maps to parameter values

#### SPREAD Gesture

**GestureType**: `SPREAD`
**Hand Side**: Left or Right
**Control**: Effect intensity, multi-parameter control

```typescript
interface SpreadGesture {
  type: "SPREAD";
  confidence: number;
  handSide: "Left" | "Right";
  data: {
    averageSpread: number; // Average distance between finger tips
    spreadRatio: number; // Normalized spread ratio (0-1)
    fingerTips: Point2D[]; // All finger tip coordinates
  };
  timestamp: number;
}
```

**Usage**:

- **Effect Intensity**: Wider spread = stronger effects
- **Multi-Parameter**: Control multiple parameters simultaneously

#### FIST Gesture

**GestureType**: `FIST`
**Hand Side**: Left or Right
**Control**: Mute/Unmute, toggle functions

```typescript
interface FistGesture {
  type: "FIST";
  confidence: number;
  handSide: "Left" | "Right";
  data: {
    averageDistance: number; // Average distance from wrist to finger tips
  };
  timestamp: number;
}
```

**Usage**:

- **Stem Mute**: Fist = mute, open hand = unmute
- **Toggle Functions**: Switch between different modes

### Two-Hand Gestures

#### TWO_HAND_PINCH

**GestureType**: `TWO_HAND_PINCH`
**Control**: Master volume, global parameters

```typescript
interface TwoHandPinchGesture {
  type: "TWO_HAND_PINCH";
  confidence: number;
  data: {
    leftPinch: PinchData; // Left hand pinch data
    rightPinch: PinchData; // Right hand pinch data
    handDistance: number; // Distance between hands
  };
  timestamp: number;
}
```

**Usage**:

- **Master Volume**: Combined pinch strength controls overall volume
- **Global Effects**: Control master effects parameters

#### SPREAD_HANDS

**GestureType**: `SPREAD_HANDS`
**Control**: Crossfade, balance control

```typescript
interface SpreadHandsGesture {
  type: "SPREAD_HANDS";
  confidence: number;
  data: {
    handDistance: number; // Distance between hands
    spreadRatio: number; // Normalized spread ratio
    centerPoint: Point2D; // Center point between hands
  };
  timestamp: number;
}
```

**Usage**:

- **Crossfade**: Spread hands to crossfade between stems
- **Balance**: Control left/right balance

## Gesture Recognition Pipeline

### 1. Landmark Processing

```typescript
// Raw landmark data from MediaPipe
interface HandResult {
  landmarks: Point2D[]; // 21 hand landmarks
  confidence: number; // Hand detection confidence
  handedness: "Left" | "Right";
}
```

### 2. Gesture Detection

The system processes landmarks through multiple detection algorithms:

- **Distance-based detection**: Calculate distances between key points
- **Geometric analysis**: Analyze finger positions and angles
- **Temporal smoothing**: Smooth gesture detection over time
- **Confidence scoring**: Multi-factor confidence calculation

### 3. Performance Optimization

#### Buffer Pooling

```typescript
// Efficient memory management
const tempBuffer = bufferPoolManager.acquireFloat32Array(42); // 21 * 2 coordinates
// ... processing ...
bufferPoolManager.releaseFloat32Array(tempBuffer);
```

#### SIMD Operations

```typescript
// Optimized distance calculations using SIMD-like operations
private calculateDistancesSIMD(landmarks: Point2D[], buffer: Float32Array): void {
  // Packed coordinate processing
  for (let i = 0; i < landmarks.length; i++) {
    const base = i * 2;
    buffer[base] = landmarks[i].x;
    buffer[base + 1] = landmarks[i].y;
  }
}
```

#### Intelligent Caching

```typescript
// Gesture result caching
const cacheKey = this.generateLandmarkCacheKey(leftHand, rightHand);
const cachedResult = globalLRUCache.get(cacheKey);
if (cachedResult) {
  return cachedResult;
}
```

## Performance Metrics

### Processing Metrics

```typescript
interface GestureProcessingMetrics {
  averageProcessingTime: number; // Average processing time per frame (ms)
  cacheHitRate: number; // Cache hit rate (0-1)
  bufferPoolEfficiency: number; // Buffer pool efficiency (0-1)
  framesProcessed: number; // Total frames processed
  gesturesDetected: number; // Total gestures detected
}
```

### Performance Targets

- **Processing Time**: <10ms per frame
- **Frame Rate**: 60fps minimum
- **Latency**: <16ms end-to-end
- **Accuracy**: >95% gesture recognition accuracy

## Usage Examples

### Basic Gesture Recognition

```typescript
import { optimizedGestureRecognizer } from "@/lib/gesture/optimizedRecognition";

// Configure for high performance
const recognizer = new OptimizedGestureRecognizer({
  enableSIMD: true,
  enableBufferPooling: true,
  confidenceThreshold: 0.7,
  maxProcessingTime: 8,
});

// Process camera feed
function processVideoFrame(videoElement: HTMLVideoElement) {
  // Get hand landmarks from MediaPipe
  const leftHand = detectLeftHand(videoElement);
  const rightHand = detectRightHand(videoElement);

  // Recognize gestures
  const gestures = recognizer.recognizeGesturesOptimized(
    leftHand,
    rightHand,
    videoElement.videoWidth,
    videoElement.videoHeight,
  );

  // Process gestures
  gestures.forEach((gesture) => {
    console.log(
      `Detected ${gesture.type} with ${gesture.confidence} confidence`,
    );
  });
}
```

### Custom Gesture Mapping

```typescript
// Map gestures to audio controls
const gestureMappings = {
  [GestureType.PINCH]: (gesture: PinchGesture) => {
    // Map pinch strength to volume
    const volume = 1 - gesture.data.pinchStrength;
    setStemVolume("vocals", volume);
  },
  [GestureType.SPREAD]: (gesture: SpreadGesture) => {
    // Map spread to reverb intensity
    const reverb = gesture.data.spreadRatio;
    setEffectParam("reverb", "wet", reverb);
  },
};
```

### Performance Monitoring

```typescript
// Monitor gesture recognition performance
const metrics = recognizer.getPerformanceMetrics();
console.log(`Processing time: ${metrics.averageProcessingTime}ms`);
console.log(`Cache hit rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`);

// Auto-optimize based on performance
if (metrics.averageProcessingTime > 12) {
  recognizer.optimizeConfiguration();
}
```

## Error Handling

### Common Issues

#### Low Confidence Detection

```typescript
// Check confidence thresholds
if (gesture.confidence < 0.5) {
  console.warn("Low confidence gesture detected");
  // Implement fallback or user feedback
}
```

#### Performance Degradation

```typescript
// Monitor for performance issues
recognizer.getPerformanceMetrics().averageProcessingTime > 15;
// Reduce processing quality or increase frame skipping
recognizer.updateConfig({
  confidenceThreshold: 0.8,
  frameSkipThreshold: 25, // Skip more frames
});
```

## Browser Compatibility

| Browser     | MediaPipe Support | WebGL Support | Performance |
| ----------- | ----------------- | ------------- | ----------- |
| Chrome 88+  | ✅ Full           | ✅ Full       | ⭐⭐⭐⭐⭐  |
| Firefox 85+ | ✅ Full           | ✅ Full       | ⭐⭐⭐⭐    |
| Safari 14+  | ✅ Full           | ✅ Full       | ⭐⭐⭐⭐    |
| Edge 88+    | ✅ Full           | ✅ Full       | ⭐⭐⭐⭐    |

## Best Practices

### Performance

1. **Enable all optimizations**: Use SIMD, buffer pooling, and caching
2. **Monitor processing time**: Keep under 10ms for 60fps
3. **Adjust confidence thresholds**: Balance accuracy vs performance
4. **Use frame skipping**: Skip frames when processing is slow

### Accuracy

1. **Calibrate gestures**: Use the built-in calibration system
2. **Filter low confidence**: Ignore gestures below confidence threshold
3. **Smooth results**: Apply temporal smoothing to gesture detection
4. **Handle edge cases**: Account for partial hand visibility

### Integration

1. **Synchronize with audio**: Ensure gesture processing aligns with audio frames
2. **Provide feedback**: Give users clear feedback on gesture recognition
3. **Handle multiple users**: Support multiple people in camera view
4. **Graceful degradation**: Fallback when camera/gestures unavailable
