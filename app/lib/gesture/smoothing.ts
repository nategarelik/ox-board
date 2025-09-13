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

  constructor(
    initialValue: number = 0,
    config: Partial<KalmanConfig> = {}
  ) {
    this.config = {
      processNoisePosition: 0.01,
      processNoiseVelocity: 0.1,
      measurementNoise: 0.1,
      dt: 1/60, // 60 FPS
      ...config
    };

    this.state = {
      x: initialValue,
      v: 0,
      P_x: 1.0,
      P_v: 1.0,
      P_xv: 0.0
    };
  }

  /**
   * Update filter with new measurement
   */
  update(measurement: number): number {
    const { dt, processNoisePosition, processNoiseVelocity, measurementNoise } = this.config;
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

  /**
   * Get current filtered value without updating
   */
  getCurrentValue(): number {
    return this.state.x;
  }

  /**
   * Get current velocity estimate
   */
  getCurrentVelocity(): number {
    return this.state.v;
  }

  /**
   * Reset filter to initial state
   */
  reset(value: number = 0): void {
    this.state = {
      x: value,
      v: 0,
      P_x: 1.0,
      P_v: 1.0,
      P_xv: 0.0
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
    config: Partial<KalmanConfig> = {}
  ) {
    this.xFilter = new KalmanFilter1D(initialPoint.x, config);
    this.yFilter = new KalmanFilter1D(initialPoint.y, config);
  }

  /**
   * Update filter with new 2D measurement
   */
  update(measurement: Point2D): Point2D {
    return {
      x: this.xFilter.update(measurement.x),
      y: this.yFilter.update(measurement.y)
    };
  }

  /**
   * Get current filtered position
   */
  getCurrentPosition(): Point2D {
    return {
      x: this.xFilter.getCurrentValue(),
      y: this.yFilter.getCurrentValue()
    };
  }

  /**
   * Get current velocity estimate
   */
  getCurrentVelocity(): Point2D {
    return {
      x: this.xFilter.getCurrentVelocity(),
      y: this.yFilter.getCurrentVelocity()
    };
  }

  /**
   * Reset filter to initial state
   */
  reset(point: Point2D = { x: 0, y: 0 }): void {
    this.xFilter.reset(point.x);
    this.yFilter.reset(point.y);
  }
}

/**
 * Gesture smoothing configuration optimized for DJ controls
 */
export const GESTURE_SMOOTHING_CONFIG: KalmanConfig = {
  // Lower process noise for stable DJ controls
  processNoisePosition: 0.005,
  processNoiseVelocity: 0.05,
  // Higher measurement noise to handle hand tracking jitter
  measurementNoise: 0.15,
  // 60 FPS target
  dt: 1/60
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

  /**
   * Smooth an array of hand landmarks
   */
  smoothLandmarks(landmarks: Point2D[], landmarkIds: number[]): Point2D[] {
    return landmarks.map((landmark, index) => {
      const landmarkId = landmarkIds[index];

      // Get or create filter for this landmark
      if (!this.filters.has(landmarkId)) {
        this.filters.set(landmarkId, new KalmanFilter2D(landmark, this.config));
      }

      const filter = this.filters.get(landmarkId)!;
      return filter.update(landmark);
    });
  }

  /**
   * Reset all filters
   */
  reset(): void {
    this.filters.clear();
  }

  /**
   * Get number of active filters
   */
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
    this.alpha = Math.max(0, Math.min(1, alpha)); // Clamp between 0 and 1
    this.value = 0;
  }

  /**
   * Update with new value
   */
  update(newValue: number): number {
    if (!this.initialized) {
      this.value = newValue;
      this.initialized = true;
    } else {
      this.value = this.alpha * newValue + (1 - this.alpha) * this.value;
    }
    return this.value;
  }

  /**
   * Get current smoothed value
   */
  getValue(): number {
    return this.value;
  }

  /**
   * Reset filter
   */
  reset(): void {
    this.initialized = false;
    this.value = 0;
  }
}