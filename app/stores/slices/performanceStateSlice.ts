import type { StateCreator } from "zustand";
import type {
  PerformanceState,
  EnhancedStemPlayerState,
} from "../../types/enhanced-state";

export interface PerformanceStateSlice extends PerformanceState {
  // Web Vitals actions
  updateWebVitals: (vitals: Partial<PerformanceState["vitals"]>) => void;
  setFCP: (value: number) => void;
  setLCP: (value: number) => void;
  setCLS: (value: number) => void;
  setFID: (value: number) => void;
  setTTFB: (value: number) => void;

  // Audio performance actions
  updateAudioMetrics: (metrics: Partial<PerformanceState["audio"]>) => void;
  setAudioLatency: (latency: number) => void;
  incrementBufferUnderruns: () => void;
  incrementDroppedFrames: () => void;
  setProcessingLoad: (load: number) => void;
  setMemoryUsage: (usage: number) => void;

  // Gesture performance actions
  updateGestureMetrics: (metrics: Partial<PerformanceState["gesture"]>) => void;
  setGestureLatency: (latency: number) => void;
  setGestureFrameRate: (fps: number) => void;
  setGestureAccuracy: (accuracy: number) => void;
  setGestureConfidence: (confidence: number) => void;

  // System performance actions
  updateSystemMetrics: (metrics: Partial<PerformanceState["system"]>) => void;
  setCPUUsage: (usage: number) => void;
  setNetworkLatency: (latency: number) => void;
  setBatteryLevel: (level: number) => void;

  // Alert actions
  addAlert: (
    alert: Omit<PerformanceState["alerts"][0], "id" | "timestamp">,
  ) => void;
  acknowledgeAlert: (alertId: string) => void;
  removeAlert: (alertId: string) => void;
  clearAlerts: () => void;

  // Threshold actions
  setAlertThreshold: (
    metric: string,
    threshold: number,
    operator: "gt" | "lt" | "eq",
  ) => void;
  checkPerformanceThresholds: () => void;

  // Utility actions
  resetMetrics: () => void;
  exportMetrics: () => PerformanceState;
  startPerformanceMonitoring: () => void;
  stopPerformanceMonitoring: () => void;
}

const initialVitalsState = {
  fcp: 0,
  lcp: 0,
  cls: 0,
  fid: 0,
  ttfb: 0,
};

const initialAudioMetricsState = {
  latency: 0,
  bufferUnderruns: 0,
  droppedFrames: 0,
  processingLoad: 0,
  memoryUsage: 0,
};

const initialGestureMetricsState = {
  processingLatency: 0,
  frameRate: 0,
  accuracy: 0,
  confidence: 0,
};

const initialSystemMetricsState = {
  cpuUsage: 0,
  memoryUsage: 0,
  networkLatency: 0,
  isOnline: navigator.onLine,
};

const initialAlertsState: PerformanceState["alerts"] = [];

export const createPerformanceStateSlice: StateCreator<
  EnhancedStemPlayerState,
  [],
  [],
  PerformanceStateSlice
> = (set, get) => ({
  // Initial state
  vitals: { ...initialVitalsState },
  audio: { ...initialAudioMetricsState },
  gesture: { ...initialGestureMetricsState },
  system: { ...initialSystemMetricsState },
  alerts: [...initialAlertsState],

  // Web Vitals actions
  updateWebVitals: (vitals) => {
    set((state) => ({
      performance: {
        ...state.performance,
        vitals: {
          ...state.performance.vitals,
          ...vitals,
        },
      },
    }));
  },

  setFCP: (value) => {
    set((state) => ({
      performance: {
        ...state.performance,
        vitals: {
          ...state.performance.vitals,
          fcp: value,
        },
      },
    }));
  },

  setLCP: (value) => {
    set((state) => ({
      performance: {
        ...state.performance,
        vitals: {
          ...state.performance.vitals,
          lcp: value,
        },
      },
    }));
  },

  setCLS: (value) => {
    set((state) => ({
      performance: {
        ...state.performance,
        vitals: {
          ...state.performance.vitals,
          cls: value,
        },
      },
    }));
  },

  setFID: (value) => {
    set((state) => ({
      performance: {
        ...state.performance,
        vitals: {
          ...state.performance.vitals,
          fid: value,
        },
      },
    }));
  },

  setTTFB: (value) => {
    set((state) => ({
      performance: {
        ...state.performance,
        vitals: {
          ...state.performance.vitals,
          ttfb: value,
        },
      },
    }));
  },

  // Audio performance actions
  updateAudioMetrics: (metrics) => {
    set((state) => ({
      performance: {
        ...state.performance,
        audio: {
          ...state.performance.audio,
          ...metrics,
        },
      },
    }));

    // Check thresholds after updating
    setTimeout(() => {
      const thresholds = getStoredThresholds();
      const state = get();

      Object.entries(thresholds).forEach(([metric, config]) => {
        if (
          !config ||
          typeof config !== "object" ||
          !("threshold" in config) ||
          !("operator" in config)
        ) {
          return;
        }

        const { threshold, operator } = config as {
          threshold: number;
          operator: "gt" | "lt" | "eq";
        };
        const { audio, gesture, system } = state.performance;
        let currentValue: number = 0;

        switch (metric) {
          case "audioLatency":
            currentValue = audio.latency;
            break;
          case "bufferUnderruns":
            currentValue = audio.bufferUnderruns;
            break;
          case "gestureLatency":
            currentValue = gesture.processingLatency;
            break;
          case "frameRate":
            currentValue = gesture.frameRate;
            break;
          case "cpuUsage":
            currentValue = system.cpuUsage;
            break;
          case "memoryUsage":
            currentValue = system.memoryUsage;
            break;
          case "networkLatency":
            currentValue = system.networkLatency;
            break;
        }

        let shouldAlert = false;
        switch (operator) {
          case "gt":
            shouldAlert = currentValue > threshold;
            break;
          case "lt":
            shouldAlert = currentValue < threshold;
            break;
          case "eq":
            shouldAlert = Math.abs(currentValue - threshold) < 0.01;
            break;
        }

        if (shouldAlert) {
          const existingAlert = state.performance.alerts.find(
            (alert) =>
              alert.threshold?.metric === metric && !alert.acknowledged,
          );

          if (!existingAlert) {
            const newAlert = {
              id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              type: "warning" as const,
              message: `${metric} threshold exceeded: ${currentValue.toFixed(2)} ${operator} ${threshold}`,
              timestamp: Date.now(),
              acknowledged: false,
              threshold: { metric, value: threshold, operator },
            };

            set((state) => ({
              performance: {
                ...state.performance,
                alerts: [...state.performance.alerts, newAlert],
              },
            }));
          }
        }
      });
    }, 0);
  },

  setAudioLatency: (latency) => {
    set((state) => ({
      performance: {
        ...state.performance,
        audio: {
          ...state.performance.audio,
          latency,
        },
      },
    }));
  },

  incrementBufferUnderruns: () => {
    set((state) => ({
      performance: {
        ...state.performance,
        audio: {
          ...state.performance.audio,
          bufferUnderruns: state.performance.audio.bufferUnderruns + 1,
        },
      },
    }));
  },

  incrementDroppedFrames: () => {
    set((state) => ({
      performance: {
        ...state.performance,
        audio: {
          ...state.performance.audio,
          droppedFrames: state.performance.audio.droppedFrames + 1,
        },
      },
    }));
  },

  setProcessingLoad: (load) => {
    set((state) => ({
      performance: {
        ...state.performance,
        audio: {
          ...state.performance.audio,
          processingLoad: Math.max(0, Math.min(1, load)),
        },
      },
    }));
  },

  setMemoryUsage: (usage) => {
    set((state) => ({
      performance: {
        ...state.performance,
        audio: {
          ...state.performance.audio,
          memoryUsage: Math.max(0, usage),
        },
      },
    }));
  },

  // Gesture performance actions
  updateGestureMetrics: (metrics) => {
    set((state) => ({
      performance: {
        ...state.performance,
        gesture: {
          ...state.performance.gesture,
          ...metrics,
        },
      },
    }));

    // Check thresholds after updating
    setTimeout(() => {
      const state = get();
      const thresholds = getStoredThresholds();

      // Check if any thresholds are exceeded
      Object.entries(thresholds).forEach(([metric, config]) => {
        if (!config) return;

        const { threshold, operator } = config;
        let currentValue: number = 0;

        switch (metric) {
          case "audioLatency":
            currentValue = state.performance.audio.latency;
            break;
          case "bufferUnderruns":
            currentValue = state.performance.audio.bufferUnderruns;
            break;
          case "gestureLatency":
            currentValue = state.performance.gesture.processingLatency;
            break;
          case "frameRate":
            currentValue = state.performance.gesture.frameRate;
            break;
          case "cpuUsage":
            currentValue = state.performance.system.cpuUsage;
            break;
          case "memoryUsage":
            currentValue = state.performance.system.memoryUsage;
            break;
          case "networkLatency":
            currentValue = state.performance.system.networkLatency;
            break;
        }

        let shouldAlert = false;
        switch (operator) {
          case "gt":
            shouldAlert = currentValue > threshold;
            break;
          case "lt":
            shouldAlert = currentValue < threshold;
            break;
          case "eq":
            shouldAlert = Math.abs(currentValue - threshold) < 0.01;
            break;
        }

        if (shouldAlert) {
          const existingAlert = state.performance.alerts.find(
            (alert) =>
              alert.threshold?.metric === metric && !alert.acknowledged,
          );

          if (!existingAlert) {
            const newAlert = {
              id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              type: "warning" as const,
              message: `${metric} threshold exceeded: ${currentValue.toFixed(2)} ${operator} ${threshold}`,
              timestamp: Date.now(),
              acknowledged: false,
              threshold: { metric, value: threshold, operator },
            };

            set((state) => ({
              performance: {
                ...state.performance,
                alerts: [...state.performance.alerts, newAlert],
              },
            }));
          }
        }
      });
    }, 0);
  },

  setGestureLatency: (latency) => {
    set((state) => ({
      performance: {
        ...state.performance,
        gesture: {
          ...state.performance.gesture,
          processingLatency: latency,
        },
      },
    }));
  },

  setGestureFrameRate: (fps) => {
    set((state) => ({
      performance: {
        ...state.performance,
        gesture: {
          ...state.performance.gesture,
          frameRate: Math.max(0, fps),
        },
      },
    }));
  },

  setGestureAccuracy: (accuracy) => {
    set((state) => ({
      performance: {
        ...state.performance,
        gesture: {
          ...state.performance.gesture,
          accuracy: Math.max(0, Math.min(1, accuracy)),
        },
      },
    }));
  },

  setGestureConfidence: (confidence) => {
    set((state) => ({
      performance: {
        ...state.performance,
        gesture: {
          ...state.performance.gesture,
          confidence: Math.max(0, Math.min(1, confidence)),
        },
      },
    }));
  },

  // System performance actions
  updateSystemMetrics: (metrics) => {
    set((state) => ({
      performance: {
        ...state.performance,
        system: {
          ...state.performance.system,
          ...metrics,
        },
      },
    }));
  },

  setCPUUsage: (usage) => {
    set((state) => ({
      performance: {
        ...state.performance,
        system: {
          ...state.performance.system,
          cpuUsage: Math.max(0, Math.min(1, usage)),
        },
      },
    }));
  },

  setNetworkLatency: (latency) => {
    set((state) => ({
      performance: {
        ...state.performance,
        system: {
          ...state.performance.system,
          networkLatency: Math.max(0, latency),
        },
      },
    }));
  },

  setBatteryLevel: (level) => {
    set((state) => ({
      performance: {
        ...state.performance,
        system: {
          ...state.performance.system,
          batteryLevel: Math.max(0, Math.min(1, level)),
        },
      },
    }));
  },

  // Alert actions
  addAlert: (alert) => {
    const newAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    set((state) => ({
      performance: {
        ...state.performance,
        alerts: [...state.performance.alerts, newAlert],
      },
    }));
  },

  acknowledgeAlert: (alertId) => {
    set((state) => ({
      performance: {
        ...state.performance,
        alerts: state.performance.alerts.map((alert) =>
          alert.id === alertId ? { ...alert, acknowledged: true } : alert,
        ),
      },
    }));
  },

  removeAlert: (alertId) => {
    set((state) => ({
      performance: {
        ...state.performance,
        alerts: state.performance.alerts.filter(
          (alert) => alert.id !== alertId,
        ),
      },
    }));
  },

  clearAlerts: () => {
    set((state) => ({
      performance: {
        ...state.performance,
        alerts: [],
      },
    }));
  },

  // Threshold actions
  setAlertThreshold: (metric, threshold, operator) => {
    const thresholds = getStoredThresholds();
    thresholds[metric] = { threshold, operator };
    localStorage.setItem("performance_thresholds", JSON.stringify(thresholds));
  },

  checkPerformanceThresholds: () => {
    setTimeout(() => {
      const thresholds = getStoredThresholds();
      const state = get();

      Object.entries(thresholds).forEach(([metric, config]) => {
        if (
          !config ||
          typeof config !== "object" ||
          !("threshold" in config) ||
          !("operator" in config)
        ) {
          return;
        }

        const { threshold, operator } = config as {
          threshold: number;
          operator: "gt" | "lt" | "eq";
        };
        const { audio, gesture, system } = state.performance;
        let currentValue: number = 0;

        switch (metric) {
          case "audioLatency":
            currentValue = audio.latency;
            break;
          case "bufferUnderruns":
            currentValue = audio.bufferUnderruns;
            break;
          case "gestureLatency":
            currentValue = gesture.processingLatency;
            break;
          case "frameRate":
            currentValue = gesture.frameRate;
            break;
          case "cpuUsage":
            currentValue = system.cpuUsage;
            break;
          case "memoryUsage":
            currentValue = system.memoryUsage;
            break;
          case "networkLatency":
            currentValue = system.networkLatency;
            break;
        }

        let shouldAlert = false;
        switch (operator) {
          case "gt":
            shouldAlert = currentValue > threshold;
            break;
          case "lt":
            shouldAlert = currentValue < threshold;
            break;
          case "eq":
            shouldAlert = Math.abs(currentValue - threshold) < 0.01;
            break;
        }

        if (shouldAlert) {
          const existingAlert = state.performance.alerts.find(
            (alert) =>
              alert.threshold?.metric === metric && !alert.acknowledged,
          );

          if (!existingAlert) {
            const newAlert = {
              id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              type: "warning" as const,
              message: `${metric} threshold exceeded: ${currentValue.toFixed(2)} ${operator} ${threshold}`,
              timestamp: Date.now(),
              acknowledged: false,
              threshold: { metric, value: threshold, operator },
            };

            set((state) => ({
              performance: {
                ...state.performance,
                alerts: [...state.performance.alerts, newAlert],
              },
            }));
          }
        }
      });
    }, 0);
  },

  // Utility actions
  resetMetrics: () => {
    set((state) => ({
      performance: {
        vitals: { ...initialVitalsState },
        audio: { ...initialAudioMetricsState },
        gesture: { ...initialGestureMetricsState },
        system: { ...initialSystemMetricsState },
        alerts: [],
      },
    }));
  },

  exportMetrics: () => {
    return get().performance;
  },

  startPerformanceMonitoring: () => {
    // Start monitoring performance metrics
    if (typeof window !== "undefined" && "performance" in window) {
      // Monitor Web Vitals
      import("web-vitals").then(
        ({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
          getFCP((metric) => {
            set((state) => ({
              performance: {
                ...state.performance,
                vitals: { ...state.performance.vitals, fcp: metric.value },
              },
            }));
          });
          getLCP((metric) => {
            set((state) => ({
              performance: {
                ...state.performance,
                vitals: { ...state.performance.vitals, lcp: metric.value },
              },
            }));
          });
          getCLS((metric) => {
            set((state) => ({
              performance: {
                ...state.performance,
                vitals: { ...state.performance.vitals, cls: metric.value },
              },
            }));
          });
          getFID((metric) => {
            set((state) => ({
              performance: {
                ...state.performance,
                vitals: { ...state.performance.vitals, fid: metric.value },
              },
            }));
          });
          getTTFB((metric) => {
            set((state) => ({
              performance: {
                ...state.performance,
                vitals: { ...state.performance.vitals, ttfb: metric.value },
              },
            }));
          });
        },
      );

      // Monitor system resources
      if ("navigator" in window && "connection" in navigator) {
        const connection = (navigator as any).connection;
        if (connection) {
          set((state) => ({
            performance: {
              ...state.performance,
              system: {
                ...state.performance.system,
                networkLatency: connection.rtt || 0,
              },
            },
          }));
        }
      }

      // Monitor memory usage (if available)
      if ("memory" in performance) {
        const memory = (performance as any).memory;
        set((state) => ({
          performance: {
            ...state.performance,
            audio: {
              ...state.performance.audio,
              memoryUsage: memory.usedJSHeapSize / memory.jsHeapSizeLimit,
            },
          },
        }));
      }

      // Start periodic monitoring
      const interval = setInterval(() => {
        set((state) => ({
          performance: {
            ...state.performance,
            system: {
              ...state.performance.system,
              isOnline: navigator.onLine,
            },
          },
        }));

        // Monitor CPU usage (approximation)
        const cpuUsage = estimateCPUUsage();
        set((state) => ({
          performance: {
            ...state.performance,
            system: {
              ...state.performance.system,
              cpuUsage: Math.max(0, Math.min(1, cpuUsage)),
            },
          },
        }));
      }, 5000); // Update every 5 seconds

      return interval;
    }

    return null;
  },

  stopPerformanceMonitoring: () => {
    // Stop monitoring (would need to track interval IDs)
    console.log("Performance monitoring stopped");
  },
});

// Helper functions
const estimateCPUUsage = (): number => {
  // Simple CPU usage estimation based on performance.now() timing
  const start = performance.now();

  // Busy wait for a short time to estimate CPU load
  let count = 0;
  const end = start + 10; // 10ms busy wait
  while (performance.now() < end) {
    count++;
  }

  // This is a very rough approximation
  return Math.min(1, count / 10000);
};

// Threshold storage helpers
const getStoredThresholds = (): Record<
  string,
  { threshold: number; operator: "gt" | "lt" | "eq" }
> => {
  try {
    const stored = localStorage.getItem("performance_thresholds");
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};
