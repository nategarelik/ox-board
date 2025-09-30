/**
 * Kalman Filter implementation for gesture smoothing
 * Reduces jitter in hand landmark tracking while maintaining responsiveness
 */

export interface KalmanState {
  /** Current position estimate */
  x: number;
  /** Current velocity estimate */
  v: number;
  /** Position uncertainty */
  P_x: number;
  /** Velocity uncertainty */
  P_v: number;
  /** Cross-correlation between position and velocity */
  P_xv: number;
}

export interface KalmanConfig {
  /** Process noise in position (how much position can change) */
  processNoisePosition: number;
  /** Process noise in velocity (how much velocity can change) */
  processNoiseVelocity: number;
  /** Measurement noise (uncertainty in observations) */
  measurementNoise: number;
  /** Time step between measurements (in seconds) */
  dt: number;
}

/**
 * 1D Kalman Filter for smoothing coordinate values
 */
export class KalmanFilter1D {
  private state: KalmanState;
  private config: KalmanConfig;

  constructor(initialValue: number = 0, config: Partial<KalmanConfig> = {}) {
    this.config = {
      processNoisePosition: 0.01,
      processNoiseVelocity: 0.1,
      measurementNoise: 0.1,
      dt: 1 / 60, // 60 FPS
      ...config,
    };

    this.state = {
      x: initialValue,
      v: 0,
      P_x: 1.0,
      P_v: 1.0,
      P_xv: 0.0,
    };
  }

  /**
   * Update filter with new measurement
   */
  update(measurement: number): number {
    const { dt, processNoisePosition, processNoiseVelocity, measurementNoise } =
      this.config;
    const { x, v, P_x, P_v, P_xv } = this.state;

    // Prediction step
    const x_pred = x + v * dt;
    const v_pred = v;

    // Predict covariance matrix
    const P_x_pred = P_x + 2 * P_xv * dt + P_v * dt * dt + processNoisePosition;
    const P_v_pred = P_v + processNoiseVelocity;
    const P_xv_pred = P_xv + P_v * dt;

    // Innovation (measurement residual)
    const innovation = measurement - x_pred;

    // Innovation covariance
    const S = P_x_pred + measurementNoise;

    // Kalman gain
    const K_x = P_x_pred / S;
    const K_v = P_xv_pred / S;

    // Update state
    this.state.x = x_pred + K_x * innovation;
    this.state.v = v_pred + K_v * innovation;

    // Update covariance matrix
    this.state.P_x = P_x_pred - K_x * P_x_pred;
    this.state.P_v = P_v_pred - K_v * P_xv_pred;
    this.state.P_xv = P_xv_pred - K_x * P_xv_pred;

    return this.state.x;
  }

  getCurrentValue(): number {
    return this.state.x;
  }

  getCurrentVelocity(): number {
    return this.state.v;
  }

  reset(value: number = 0): void {
    this.state = {
      x: value,
      v: 0,
      P_x: 1.0,
      P_v: 1.0,
      P_xv: 0.0,
    };
  }
}

/**
 * 2D Point for gesture coordinates
 */
export interface Point2D {
  x: number;
  y: number;
}

/**
 * 2D Kalman Filter for smoothing hand landmark positions
 */
export class KalmanFilter2D {
  private xFilter: KalmanFilter1D;
  private yFilter: KalmanFilter1D;

  constructor(
    initialPoint: Point2D = { x: 0, y: 0 },
    config: Partial<KalmanConfig> = {},
  ) {
    this.xFilter = new KalmanFilter1D(initialPoint.x, config);
    this.yFilter = new KalmanFilter1D(initialPoint.y, config);
  }

  update(measurement: Point2D): Point2D {
    return {
      x: this.xFilter.update(measurement.x),
      y: this.yFilter.update(measurement.y),
    };
  }

  getCurrentPosition(): Point2D {
    return {
      x: this.xFilter.getCurrentValue(),
      y: this.yFilter.getCurrentValue(),
    };
  }

  reset(point: Point2D = { x: 0, y: 0 }): void {
    this.xFilter.reset(point.x);
    this.yFilter.reset(point.y);
  }
}

/**
 * Gesture smoothing configuration optimized for DJ controls
 */
export const GESTURE_SMOOTHING_CONFIG: KalmanConfig = {
  processNoisePosition: 0.005,
  processNoiseVelocity: 0.05,
  measurementNoise: 0.15,
  dt: 1 / 60,
};

/**
 * Multi-point gesture smoother for hand landmarks
 */
export class HandLandmarkSmoother {
  private filters: Map<number, KalmanFilter2D> = new Map();
  private config: KalmanConfig;

  constructor(config: Partial<KalmanConfig> = {}) {
    this.config = { ...GESTURE_SMOOTHING_CONFIG, ...config };
  }

  smoothLandmarks(landmarks: Point2D[], landmarkIds: number[]): Point2D[] {
    return landmarks.map((landmark, index) => {
      const landmarkId = landmarkIds[index];

      if (!this.filters.has(landmarkId)) {
        this.filters.set(landmarkId, new KalmanFilter2D(landmark, this.config));
      }

      const filter = this.filters.get(landmarkId)!;
      return filter.update(landmark);
    });
  }

  reset(): void {
    this.filters.clear();
  }

  getActiveFilterCount(): number {
    return this.filters.size;
  }
}

/**
 * Exponential moving average for simple smoothing
 */
export class ExponentialMovingAverage {
  private value: number;
  private alpha: number;
  private initialized: boolean = false;

  constructor(alpha: number = 0.1) {
    this.alpha = Math.max(0, Math.min(1, alpha));
    this.value = 0;
  }

  update(newValue: number): number {
    if (!this.initialized) {
      this.value = newValue;
      this.initialized = true;
    } else {
      this.value = this.alpha * newValue + (1 - this.alpha) * this.value;
    }
    return this.value;
  }

  getValue(): number {
    return this.value;
  }

  reset(): void {
    this.initialized = false;
    this.value = 0;
  }
}

/**
 * Adaptive smoothing based on gesture velocity and acceleration
 */
export interface AdaptiveSmoothingConfig {
  baseAlpha: number;
  velocityScale: number;
  accelerationScale: number;
  minAlpha: number;
  maxAlpha: number;
  velocityThreshold: number;
  accelerationThreshold: number;
}

export class AdaptiveGestureSmoother {
  private ema: ExponentialMovingAverage;
  private previousValue: number = 0;
  private previousVelocity: number = 0;
  private config: AdaptiveSmoothingConfig;

  constructor(config: Partial<AdaptiveSmoothingConfig> = {}) {
    this.config = {
      baseAlpha: 0.1,
      velocityScale: 0.05,
      accelerationScale: 0.02,
      minAlpha: 0.02,
      maxAlpha: 0.5,
      velocityThreshold: 0.1,
      accelerationThreshold: 0.05,
      ...config,
    };

    this.ema = new ExponentialMovingAverage(this.config.baseAlpha);
  }

  update(newValue: number, deltaTime: number = 1 / 60): number {
    // Calculate velocity
    const velocity = Math.abs(newValue - this.previousValue) / deltaTime;
    const normalizedVelocity = Math.min(
      1,
      velocity / this.config.velocityThreshold,
    );

    // Calculate acceleration
    const acceleration = Math.abs(velocity - this.previousVelocity) / deltaTime;
    const normalizedAcceleration = Math.min(
      1,
      acceleration / this.config.accelerationThreshold,
    );

    // Adapt smoothing factor based on motion characteristics
    let adaptiveAlpha = this.config.baseAlpha;

    // Reduce smoothing (increase alpha) for fast movements
    adaptiveAlpha += normalizedVelocity * this.config.velocityScale;
    adaptiveAlpha += normalizedAcceleration * this.config.accelerationScale;

    // Clamp alpha to valid range
    adaptiveAlpha = Math.max(
      this.config.minAlpha,
      Math.min(this.config.maxAlpha, adaptiveAlpha),
    );

    // Update EMA with adaptive alpha
    this.ema = new ExponentialMovingAverage(adaptiveAlpha);
    const smoothedValue = this.ema.update(newValue);

    // Update history for next iteration
    this.previousVelocity = velocity;
    this.previousValue = smoothedValue;

    return smoothedValue;
  }

  getValue(): number {
    return this.ema.getValue();
  }

  reset(): void {
    this.ema.reset();
    this.previousValue = 0;
    this.previousVelocity = 0;
  }

  updateConfig(newConfig: Partial<AdaptiveSmoothingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * Gesture prediction system for reduced latency
 */
export interface GesturePredictionConfig {
  predictionHorizon: number; // How far ahead to predict (in seconds)
  confidenceThreshold: number;
  maxPredictionError: number;
  smoothingFactor: number;
}

export class GesturePredictor {
  private valueHistory: Array<{
    value: number;
    timestamp: number;
    velocity: number;
  }> = [];
  private maxHistorySize = 30; // ~0.5 seconds at 60fps
  private config: GesturePredictionConfig;

  constructor(config: Partial<GesturePredictionConfig> = {}) {
    this.config = {
      predictionHorizon: 0.05, // 50ms prediction
      confidenceThreshold: 0.7,
      maxPredictionError: 0.1,
      smoothingFactor: 0.3,
      ...config,
    };
  }

  update(currentValue: number, currentVelocity: number = 0): void {
    const now = performance.now();

    // Add current value to history
    this.valueHistory.push({
      value: currentValue,
      timestamp: now,
      velocity: currentVelocity,
    });

    // Remove old values
    const cutoffTime = now - this.maxHistorySize * (1000 / 60);
    this.valueHistory = this.valueHistory.filter(
      (item) => item.timestamp > cutoffTime,
    );

    // Keep only recent values
    if (this.valueHistory.length > this.maxHistorySize) {
      this.valueHistory = this.valueHistory.slice(-this.maxHistorySize);
    }
  }

  predict(
    stepsAhead: number = 1,
  ): { value: number; confidence: number } | null {
    if (this.valueHistory.length < 3) {
      return null;
    }

    // Calculate average velocity from recent history
    const recentHistory = this.valueHistory.slice(-5);
    let totalVelocity = 0;
    let velocityCount = 0;

    for (let i = 1; i < recentHistory.length; i++) {
      const deltaTime =
        (recentHistory[i].timestamp - recentHistory[i - 1].timestamp) / 1000;
      if (deltaTime > 0) {
        const velocity =
          (recentHistory[i].value - recentHistory[i - 1].value) / deltaTime;
        totalVelocity += velocity;
        velocityCount++;
      }
    }

    if (velocityCount === 0) {
      return null;
    }

    const averageVelocity = totalVelocity / velocityCount;
    const predictionTime = this.config.predictionHorizon;

    // Predict future value
    const lastValue = recentHistory[recentHistory.length - 1].value;
    const predictedValue = lastValue + averageVelocity * predictionTime;

    // Calculate confidence based on velocity consistency
    const velocityVariance = this.calculateVelocityVariance(recentHistory);
    const confidence = Math.max(
      0,
      Math.min(1, this.config.confidenceThreshold - velocityVariance * 2),
    );

    if (confidence < this.config.confidenceThreshold) {
      return null;
    }

    return {
      value: predictedValue,
      confidence,
    };
  }

  private calculateVelocityVariance(
    history: Array<{ value: number; timestamp: number; velocity: number }>,
  ): number {
    if (history.length < 2) return 0;

    const velocities = [];
    for (let i = 1; i < history.length; i++) {
      const deltaTime =
        (history[i].timestamp - history[i - 1].timestamp) / 1000;
      if (deltaTime > 0) {
        velocities.push((history[i].value - history[i - 1].value) / deltaTime);
      }
    }

    if (velocities.length < 2) return 0;

    const mean = velocities.reduce((a, b) => a + b, 0) / velocities.length;
    const variance =
      velocities.reduce((acc, vel) => acc + Math.pow(vel - mean, 2), 0) /
      velocities.length;

    return Math.sqrt(variance);
  }

  reset(): void {
    this.valueHistory = [];
  }
}

/**
 * Outlier rejection system for gesture data
 */
export interface OutlierRejectionConfig {
  thresholdMultiplier: number;
  windowSize: number;
  minValidSamples: number;
}

export class OutlierRejectionFilter {
  private valueHistory: number[] = [];
  private config: OutlierRejectionConfig;

  constructor(config: Partial<OutlierRejectionConfig> = {}) {
    this.config = {
      thresholdMultiplier: 2.0,
      windowSize: 10,
      minValidSamples: 5,
      ...config,
    };
  }

  filter(newValue: number): number | null {
    // Add new value to history
    this.valueHistory.push(newValue);

    // Keep only recent values
    if (this.valueHistory.length > this.config.windowSize) {
      this.valueHistory = this.valueHistory.slice(-this.config.windowSize);
    }

    if (this.valueHistory.length < this.config.minValidSamples) {
      return newValue; // Not enough data for filtering
    }

    // Calculate statistics
    const mean =
      this.valueHistory.reduce((a, b) => a + b, 0) / this.valueHistory.length;
    const variance =
      this.valueHistory.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
      this.valueHistory.length;
    const stdDev = Math.sqrt(variance);

    // Check if new value is an outlier
    const threshold = stdDev * this.config.thresholdMultiplier;
    const deviation = Math.abs(newValue - mean);

    if (deviation <= threshold) {
      return newValue; // Value is within acceptable range
    } else {
      // Return smoothed value instead of outlier
      return mean + threshold * Math.sign(newValue - mean) * 0.5;
    }
  }

  reset(): void {
    this.valueHistory = [];
  }

  getHistory(): number[] {
    return [...this.valueHistory];
  }
}

/**
 * Advanced 2D gesture smoother combining multiple techniques
 */
export interface AdvancedSmoothingConfig {
  kalmanConfig: Partial<KalmanConfig>;
  adaptiveConfig: Partial<AdaptiveSmoothingConfig>;
  predictionConfig: Partial<GesturePredictionConfig>;
  outlierConfig: Partial<OutlierRejectionConfig>;
  enablePrediction: boolean;
  enableOutlierRejection: boolean;
}

export class AdvancedGestureSmoother2D {
  private kalmanFilter: KalmanFilter2D;
  private adaptiveSmootherX: AdaptiveGestureSmoother;
  private adaptiveSmootherY: AdaptiveGestureSmoother;
  private predictorX: GesturePredictor;
  private predictorY: GesturePredictor;
  private outlierFilterX: OutlierRejectionFilter;
  private outlierFilterY: OutlierRejectionFilter;
  private config: AdvancedSmoothingConfig;
  private lastTimestamp: number = 0;

  constructor(
    initialPoint: Point2D = { x: 0, y: 0 },
    config: Partial<AdvancedSmoothingConfig> = {},
  ) {
    this.config = {
      kalmanConfig: {},
      adaptiveConfig: {},
      predictionConfig: {},
      outlierConfig: {},
      enablePrediction: true,
      enableOutlierRejection: true,
      ...config,
    };

    // Initialize Kalman filter
    this.kalmanFilter = new KalmanFilter2D(
      initialPoint,
      this.config.kalmanConfig,
    );

    // Initialize adaptive smoothers
    this.adaptiveSmootherX = new AdaptiveGestureSmoother(
      this.config.adaptiveConfig,
    );
    this.adaptiveSmootherY = new AdaptiveGestureSmoother(
      this.config.adaptiveConfig,
    );

    // Initialize predictors
    this.predictorX = new GesturePredictor(this.config.predictionConfig);
    this.predictorY = new GesturePredictor(this.config.predictionConfig);

    // Initialize outlier filters
    this.outlierFilterX = new OutlierRejectionFilter(this.config.outlierConfig);
    this.outlierFilterY = new OutlierRejectionFilter(this.config.outlierConfig);
  }

  update(measurement: Point2D, velocity?: Point2D): Point2D {
    const now = performance.now();
    const deltaTime =
      this.lastTimestamp > 0 ? (now - this.lastTimestamp) / 1000 : 1 / 60;
    this.lastTimestamp = now;

    let filteredX = measurement.x;
    let filteredY = measurement.y;

    // Apply outlier rejection
    if (this.config.enableOutlierRejection) {
      const filteredXValue = this.outlierFilterX.filter(measurement.x);
      const filteredYValue = this.outlierFilterY.filter(measurement.y);

      if (filteredXValue !== null) filteredX = filteredXValue;
      if (filteredYValue !== null) filteredY = filteredYValue;
    }

    // Update predictors
    if (velocity) {
      this.predictorX.update(filteredX, velocity.x);
      this.predictorY.update(filteredY, velocity.y);
    }

    // Get predictions for reduced latency
    let predictedX = filteredX;
    let predictedY = filteredY;

    if (this.config.enablePrediction) {
      const predictionX = this.predictorX.predict(1);
      const predictionY = this.predictorY.predict(1);

      if (predictionX && predictionX.confidence > 0.6) {
        predictedX = predictionX.value;
      }
      if (predictionY && predictionY.confidence > 0.6) {
        predictedY = predictionY.value;
      }
    }

    // Apply adaptive smoothing
    const adaptiveX = this.adaptiveSmootherX.update(predictedX, deltaTime);
    const adaptiveY = this.adaptiveSmootherY.update(predictedY, deltaTime);

    // Apply Kalman filtering for final smoothing
    const kalmanResult = this.kalmanFilter.update({
      x: adaptiveX,
      y: adaptiveY,
    });

    return kalmanResult;
  }

  getCurrentPosition(): Point2D {
    return this.kalmanFilter.getCurrentPosition();
  }

  getPrediction(): { x: number; y: number; confidence: number } | null {
    const predictionX = this.predictorX.predict(1);
    const predictionY = this.predictorY.predict(1);

    if (predictionX && predictionY) {
      return {
        x: predictionX.value,
        y: predictionY.value,
        confidence: (predictionX.confidence + predictionY.confidence) / 2,
      };
    }

    return null;
  }

  reset(point?: Point2D): void {
    const resetPoint = point || { x: 0, y: 0 };

    this.kalmanFilter.reset(resetPoint);
    this.adaptiveSmootherX.reset();
    this.adaptiveSmootherY.reset();
    this.predictorX.reset();
    this.predictorY.reset();
    this.outlierFilterX.reset();
    this.outlierFilterY.reset();
    this.lastTimestamp = 0;
  }

  updateConfig(newConfig: Partial<AdvancedSmoothingConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Update individual component configs
    this.adaptiveSmootherX.updateConfig(this.config.adaptiveConfig);
    this.adaptiveSmootherY.updateConfig(this.config.adaptiveConfig);

    if (this.config.kalmanConfig) {
      this.kalmanFilter = new KalmanFilter2D(
        this.getCurrentPosition(),
        this.config.kalmanConfig,
      );
    }
  }
}

/**
 * Performance-optimized gesture smoother for real-time use
 */
export const PERFORMANCE_GESTURE_SMOOTHING_CONFIG: AdvancedSmoothingConfig = {
  kalmanConfig: {
    processNoisePosition: 0.003,
    processNoiseVelocity: 0.03,
    measurementNoise: 0.1,
    dt: 1 / 60,
  },
  adaptiveConfig: {
    baseAlpha: 0.08,
    velocityScale: 0.04,
    accelerationScale: 0.02,
    minAlpha: 0.01,
    maxAlpha: 0.4,
    velocityThreshold: 0.15,
    accelerationThreshold: 0.08,
  },
  predictionConfig: {
    predictionHorizon: 0.03,
    confidenceThreshold: 0.6,
    maxPredictionError: 0.08,
    smoothingFactor: 0.2,
  },
  outlierConfig: {
    thresholdMultiplier: 1.8,
    windowSize: 8,
    minValidSamples: 4,
  },
  enablePrediction: true,
  enableOutlierRejection: true,
};
