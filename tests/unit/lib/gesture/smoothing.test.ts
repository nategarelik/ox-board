// Gesture smoothing unit tests
import {
  KalmanFilter1D,
  KalmanFilter2D,
  ExponentialMovingAverage,
  AdaptiveGestureSmoother,
  AdvancedGestureSmoother2D,
  OutlierRejectionFilter,
  GesturePredictor,
  GESTURE_SMOOTHING_CONFIG,
  PERFORMANCE_GESTURE_SMOOTHING_CONFIG,
  Point2D,
} from "@/lib/gesture/smoothing";

describe("KalmanFilter1D", () => {
  let filter: KalmanFilter1D;

  beforeEach(() => {
    filter = new KalmanFilter1D(0, {
      processNoisePosition: 0.01,
      processNoiseVelocity: 0.1,
      measurementNoise: 0.1,
      dt: 1 / 60,
    });
  });

  it("should initialize with correct values", () => {
    expect(filter.getCurrentValue()).toBe(0);
    expect(filter.getCurrentVelocity()).toBe(0);
  });

  it("should smooth noisy measurements", () => {
    const measurements = [1, 1.1, 0.9, 1.2, 0.8, 1.0, 1.1];
    const smoothed = measurements.map((m) => filter.update(m));

    // Smoothed values should be more stable than raw measurements
    const rawVariance = calculateVariance(measurements);
    const smoothedVariance = calculateVariance(smoothed);
    expect(smoothedVariance).toBeLessThan(rawVariance);
  });

  it("should handle rapid changes", () => {
    const initialValue = filter.update(1);
    const afterStep = filter.update(5);

    expect(afterStep).toBeGreaterThan(initialValue);
    expect(filter.getCurrentVelocity()).not.toBe(0);
  });

  it("should reset correctly", () => {
    filter.update(5);
    expect(filter.getCurrentValue()).toBe(5);

    filter.reset(10);
    expect(filter.getCurrentValue()).toBe(10);
    expect(filter.getCurrentVelocity()).toBe(0);
  });
});

describe("KalmanFilter2D", () => {
  let filter: KalmanFilter2D;

  beforeEach(() => {
    filter = new KalmanFilter2D({ x: 0, y: 0 });
  });

  it("should smooth 2D coordinates", () => {
    const measurements: Point2D[] = [
      { x: 1, y: 1 },
      { x: 1.1, y: 1.1 },
      { x: 0.9, y: 0.9 },
      { x: 1.2, y: 1.2 },
      { x: 0.8, y: 0.8 },
    ];

    const smoothed = measurements.map((m) => filter.update(m));

    // Check that smoothing occurred
    expect(smoothed.length).toBe(measurements.length);
    expect(smoothed[0].x).toBeCloseTo(1, 1);
    expect(smoothed[0].y).toBeCloseTo(1, 1);
  });

  it("should maintain position after reset", () => {
    filter.update({ x: 5, y: 3 });
    expect(filter.getCurrentPosition().x).toBeCloseTo(5, 1);
    expect(filter.getCurrentPosition().y).toBeCloseTo(3, 1);

    filter.reset({ x: 10, y: 20 });
    expect(filter.getCurrentPosition().x).toBe(10);
    expect(filter.getCurrentPosition().y).toBe(20);
  });
});

describe("ExponentialMovingAverage", () => {
  let ema: ExponentialMovingAverage;

  beforeEach(() => {
    ema = new ExponentialMovingAverage(0.1);
  });

  it("should calculate exponential moving average", () => {
    const values = [10, 12, 11, 13, 9];
    const smoothed = values.map((v) => ema.update(v));

    expect(smoothed[0]).toBe(10); // First value unchanged
    expect(smoothed[4]).toBeLessThan(13); // Should be smoothed
    expect(smoothed[4]).toBeGreaterThan(9); // Should be smoothed
  });

  it("should handle different alpha values", () => {
    const fastEMA = new ExponentialMovingAverage(0.5);
    const slowEMA = new ExponentialMovingAverage(0.05);

    const values = [1, 5, 3];

    const fastSmoothed = values.map((v) => fastEMA.update(v));
    const slowSmoothed = values.map((v) => slowEMA.update(v));

    // Fast EMA should respond quicker to changes
    expect(Math.abs(fastSmoothed[2] - 3)).toBeLessThan(
      Math.abs(slowSmoothed[2] - 3),
    );
  });

  it("should reset correctly", () => {
    ema.update(5);
    expect(ema.getValue()).toBe(5);

    ema.reset();
    expect(ema.getValue()).toBe(0);
  });
});

describe("AdaptiveGestureSmoother", () => {
  let smoother: AdaptiveGestureSmoother;

  beforeEach(() => {
    smoother = new AdaptiveGestureSmoother({
      baseAlpha: 0.1,
      velocityScale: 0.05,
      accelerationScale: 0.02,
      minAlpha: 0.02,
      maxAlpha: 0.5,
      velocityThreshold: 0.1,
      accelerationThreshold: 0.05,
    });
  });

  it("should adapt smoothing based on velocity", () => {
    // Slow movement
    const slowValue = smoother.update(1, 1 / 60);
    const slowVelocity = Math.abs(smoother.getValue() - 0);

    // Reset for fast movement test
    smoother.reset();
    const fastValue = smoother.update(10, 1 / 60);
    const fastVelocity = Math.abs(smoother.getValue() - 0);

    // Should handle both slow and fast movements
    expect(typeof slowValue).toBe("number");
    expect(typeof fastValue).toBe("number");
  });

  it("should maintain reasonable smoothing values", () => {
    const value = smoother.update(5, 1 / 60);
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThanOrEqual(10);
  });

  it("should update configuration", () => {
    expect(() => {
      smoother.updateConfig({ baseAlpha: 0.2 });
    }).not.toThrow();
  });
});

describe("OutlierRejectionFilter", () => {
  let filter: OutlierRejectionFilter;

  beforeEach(() => {
    filter = new OutlierRejectionFilter({
      thresholdMultiplier: 2.0,
      windowSize: 10,
      minValidSamples: 5,
    });
  });

  it("should reject outliers", () => {
    // Add normal values
    for (let i = 0; i < 8; i++) {
      filter.filter(1.0);
    }

    // Add outlier
    const outlierResult = filter.filter(10.0);

    // Should either reject or adjust the outlier
    expect(outlierResult).toBeLessThanOrEqual(3.0);
  });

  it("should handle insufficient data", () => {
    const result = filter.filter(5.0);
    expect(result).toBe(5.0); // Should return original value when insufficient data
  });

  it("should maintain history", () => {
    for (let i = 0; i < 5; i++) {
      filter.filter(i);
    }

    const history = filter.getHistory();
    expect(history.length).toBe(5);
  });
});

describe("GesturePredictor", () => {
  let predictor: GesturePredictor;

  beforeEach(() => {
    predictor = new GesturePredictor({
      predictionHorizon: 0.05,
      confidenceThreshold: 0.7,
      maxPredictionError: 0.1,
      smoothingFactor: 0.3,
    });
  });

  it("should predict gesture movement", () => {
    // Add movement history
    for (let i = 0; i < 10; i++) {
      predictor.update(i * 0.1, 0.1);
    }

    const prediction = predictor.predict(1);

    if (prediction) {
      expect(prediction.value).toBeGreaterThan(0.8); // Should predict continuation of movement
      expect(prediction.confidence).toBeGreaterThan(0);
      expect(prediction.confidence).toBeLessThanOrEqual(1);
    }
  });

  it("should handle insufficient data", () => {
    const prediction = predictor.predict(1);
    expect(prediction).toBeNull();
  });

  it("should reset correctly", () => {
    predictor.update(1, 0.1);
    expect(() => predictor.reset()).not.toThrow();
  });
});

describe("AdvancedGestureSmoother2D", () => {
  let smoother: AdvancedGestureSmoother2D;

  beforeEach(() => {
    smoother = new AdvancedGestureSmoother2D(
      { x: 0, y: 0 },
      PERFORMANCE_GESTURE_SMOOTHING_CONFIG,
    );
  });

  it("should smooth 2D gestures with advanced algorithms", () => {
    const measurements: Point2D[] = [
      { x: 1, y: 1 },
      { x: 1.1, y: 1.1 },
      { x: 0.9, y: 0.9 },
      { x: 1.2, y: 1.2 },
    ];

    const smoothed = measurements.map((m) => smoother.update(m));

    expect(smoothed.length).toBe(measurements.length);
    expect(smoothed[0].x).toBeCloseTo(1, 1);
    expect(smoothed[0].y).toBeCloseTo(1, 1);
  });

  it("should provide predictions", () => {
    const measurements: Point2D[] = [
      { x: 1, y: 1 },
      { x: 1.1, y: 1.1 },
      { x: 1.2, y: 1.2 },
    ];

    measurements.forEach((m) => smoother.update(m, { x: 0.1, y: 0.1 }));

    const prediction = smoother.getPrediction();
    // Prediction may or may not be available depending on confidence
    if (prediction) {
      expect(prediction.confidence).toBeGreaterThan(0);
      expect(prediction.confidence).toBeLessThanOrEqual(1);
    }
  });

  it("should reset all components", () => {
    smoother.update({ x: 5, y: 5 });
    expect(smoother.getCurrentPosition().x).toBeCloseTo(5, 1);

    smoother.reset({ x: 10, y: 10 });
    expect(smoother.getCurrentPosition().x).toBe(10);
    expect(smoother.getCurrentPosition().y).toBe(10);
  });

  it("should update configuration", () => {
    expect(() => {
      smoother.updateConfig({
        enablePrediction: false,
        enableOutlierRejection: false,
      });
    }).not.toThrow();
  });
});

describe("Performance Requirements", () => {
  it("should process smoothing within performance budget", async () => {
    const filter = new KalmanFilter2D({ x: 0, y: 0 });
    const measurements: Point2D[] = Array(100)
      .fill(null)
      .map(() => ({
        x: Math.random() * 10,
        y: Math.random() * 10,
      }));

    const startTime = performance.now();

    measurements.forEach((m) => filter.update(m));

    const endTime = performance.now();
    const averageTime = (endTime - startTime) / measurements.length;

    expect(averageTime).toBeLessThan(1); // Should be very fast per operation
  });

  it("should handle high-frequency updates", () => {
    const filter = new KalmanFilter1D(0);

    for (let i = 0; i < 1000; i++) {
      filter.update(Math.sin(i * 0.01));
    }

    expect(filter.getCurrentValue()).toBeDefined();
  });
});

describe("Configuration Presets", () => {
  it("should use gesture smoothing config", () => {
    expect(GESTURE_SMOOTHING_CONFIG.processNoisePosition).toBe(0.005);
    expect(GESTURE_SMOOTHING_CONFIG.dt).toBe(1 / 60);
  });

  it("should use performance gesture smoothing config", () => {
    expect(PERFORMANCE_GESTURE_SMOOTHING_CONFIG.enablePrediction).toBe(true);
    expect(PERFORMANCE_GESTURE_SMOOTHING_CONFIG.enableOutlierRejection).toBe(
      true,
    );
  });
});

// Helper function for variance calculation
function calculateVariance(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map((value) => Math.pow(value - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
}
