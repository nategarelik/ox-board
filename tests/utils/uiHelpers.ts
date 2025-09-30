// UI test helpers and utilities
import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { jest } from "@jest/globals";
import "@testing-library/jest-dom";

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  providers?: React.ComponentType<{ children: React.ReactNode }>[];
}

export const customRender = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {},
) => {
  const { providers = [], ...renderOptions } = options;

  const AllProviders = ({ children }: { children: React.ReactNode }) => {
    return providers.reduce(
      (acc, Provider) => React.createElement(Provider, null, acc),
      children,
    );
  };

  return render(ui, { wrapper: AllProviders, ...renderOptions });
};

// Mock store provider for testing
export const createMockStoreProvider = (initialState: any = {}) => {
  return ({ children }: { children: React.ReactNode }) => {
    // Mock Zustand store
    const mockStore = {
      ...initialState,
      setState: jest.fn(),
      getState: jest.fn(() => mockStore),
      subscribe: jest.fn(),
      destroy: jest.fn(),
    };

    // Add store to React context or use a simple mock
    return React.createElement(
      "div",
      { "data-testid": "mock-store" },
      children,
    );
  };
};

// Mock component wrapper
export const createMockWrapper = (mockProps: Record<string, any> = {}) => {
  return ({ children }: { children: React.ReactNode }) => {
    return React.createElement(
      "div",
      {
        "data-testid": "mock-wrapper",
        ...mockProps,
      },
      children,
    );
  };
};

// User interaction simulation utilities
export const createUserInteractionHelpers = (container: HTMLElement) => {
  return {
    // Mouse interactions
    click: (element: HTMLElement) => {
      const event = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
      });
      element.dispatchEvent(event);
    },

    doubleClick: (element: HTMLElement) => {
      const event = new MouseEvent("dblclick", {
        bubbles: true,
        cancelable: true,
      });
      element.dispatchEvent(event);
    },

    rightClick: (element: HTMLElement) => {
      const event = new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        button: 2,
      });
      element.dispatchEvent(event);
    },

    // Touch interactions
    touch: (
      element: HTMLElement,
      touches: Array<{ x: number; y: number }> = [{ x: 0, y: 0 }],
    ) => {
      const touchEvents = touches.map((touch, index) => ({
        identifier: index,
        target: element,
        clientX: touch.x,
        clientY: touch.y,
        pageX: touch.x,
        pageY: touch.y,
      }));

      const event = new TouchEvent("touchstart", {
        bubbles: true,
        cancelable: true,
        touches: touchEvents as any,
        targetTouches: touchEvents as any,
        changedTouches: touchEvents as any,
      });

      element.dispatchEvent(event);
    },

    // Keyboard interactions
    keyPress: (element: HTMLElement, key: string, modifiers: string[] = []) => {
      const event = new KeyboardEvent("keydown", {
        key,
        bubbles: true,
        cancelable: true,
        ctrlKey: modifiers.includes("ctrl"),
        shiftKey: modifiers.includes("shift"),
        altKey: modifiers.includes("alt"),
        metaKey: modifiers.includes("meta"),
      });

      element.dispatchEvent(event);
    },

    // Drag and drop
    dragStart: (element: HTMLElement, data: any = {}) => {
      const event = new DragEvent("dragstart", {
        bubbles: true,
        cancelable: true,
        dataTransfer: {
          setData: jest.fn(),
          getData: jest.fn(() => JSON.stringify(data)),
          effectAllowed: "move",
          dropEffect: "move",
        } as any,
      });

      element.dispatchEvent(event);
    },

    drop: (element: HTMLElement, data: any = {}) => {
      const event = new DragEvent("drop", {
        bubbles: true,
        cancelable: true,
        dataTransfer: {
          getData: jest.fn(() => JSON.stringify(data)),
          dropEffect: "move",
        } as any,
      });

      element.dispatchEvent(event);
    },
  };
};

// Component state utilities
export const createComponentStateHelpers = () => {
  return {
    // Wait for component to be ready
    waitForComponentReady: async (container: HTMLElement, selector: string) => {
      return new Promise((resolve) => {
        const checkElement = () => {
          const element = container.querySelector(selector);
          if (element) {
            resolve(element);
          } else {
            setTimeout(checkElement, 10);
          }
        };
        checkElement();
      });
    },

    // Wait for loading state
    waitForLoadingComplete: async (container: HTMLElement) => {
      return new Promise((resolve) => {
        const checkLoading = () => {
          const loadingElement = container.querySelector(
            '[data-testid="loading"]',
          );
          if (!loadingElement) {
            resolve(true);
          } else {
            setTimeout(checkLoading, 10);
          }
        };
        checkLoading();
      });
    },

    // Simulate async state changes
    simulateAsyncUpdate: async (callback: () => void, delay: number = 100) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          callback();
          resolve(true);
        }, delay);
      });
    },
  };
};

// Responsive testing helpers
export const createResponsiveHelpers = () => {
  const breakpoints = {
    mobile: 320,
    tablet: 768,
    desktop: 1024,
    wide: 1440,
  };

  return {
    setViewportSize: (width: number, height: number = 800) => {
      // Mock window resize event
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: width,
      });

      Object.defineProperty(window, "innerHeight", {
        writable: true,
        configurable: true,
        value: height,
      });

      window.dispatchEvent(new Event("resize"));
    },

    testAtBreakpoint: async (
      breakpoint: keyof typeof breakpoints,
      testFn: () => void | Promise<void>,
    ) => {
      const width = breakpoints[breakpoint];
      const originalWidth = window.innerWidth;
      const originalHeight = window.innerHeight;

      try {
        Object.defineProperty(window, "innerWidth", {
          value: width,
          writable: true,
        });
        Object.defineProperty(window, "innerHeight", {
          value: 800,
          writable: true,
        });
        window.dispatchEvent(new Event("resize"));
        await testFn();
      } finally {
        Object.defineProperty(window, "innerWidth", {
          value: originalWidth,
          writable: true,
        });
        Object.defineProperty(window, "innerHeight", {
          value: originalHeight,
          writable: true,
        });
        window.dispatchEvent(new Event("resize"));
      }
    },
  };
};

// Mock data generators
export const createMockData = () => {
  return {
    // Mock audio track
    audioTrack: {
      id: "track-1",
      name: "Test Track",
      duration: 180, // 3 minutes
      bpm: 120,
      key: "C",
      stems: ["vocals", "drums", "bass", "other"],
      metadata: {
        artist: "Test Artist",
        album: "Test Album",
        year: 2024,
      },
    },

    // Mock gesture data
    gestureData: {
      type: "pinch",
      confidence: 0.95,
      landmarks: Array(21)
        .fill(null)
        .map(() => [0.5, 0.5, 0]),
      timestamp: Date.now(),
    },

    // Mock performance metrics
    performanceMetrics: {
      fps: 60,
      memoryUsage: 50, // MB
      audioLatency: 10, // ms
      gestureLatency: 16, // ms
      cpuUsage: 25, // %
    },

    // Mock user preferences
    userPreferences: {
      theme: "dark",
      gestureSensitivity: 0.8,
      audioQuality: "high",
      notifications: true,
    },
  };
};

// Animation frame utilities
export const createAnimationHelpers = () => {
  let frameCount = 0;
  const callbacks = new Set<FrameRequestCallback>();

  return {
    mockRequestAnimationFrame: (callback: FrameRequestCallback) => {
      frameCount++;
      callbacks.add(callback);
      return frameCount;
    },

    mockCancelAnimationFrame: (id: number) => {
      // Find and remove callback by id (simplified)
      callbacks.clear();
    },

    triggerAnimationFrame: () => {
      callbacks.forEach((callback) => callback(frameCount));
    },

    getFrameCount: () => frameCount,
    resetFrameCount: () => {
      frameCount = 0;
    },
  };
};

// Error boundary testing
export const createErrorHelpers = () => {
  return {
    throwError: (message: string = "Test error") => {
      throw new Error(message);
    },

    throwAsyncError: async (message: string = "Async test error") => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      throw new Error(message);
    },

    expectErrorBoundary: (container: HTMLElement) => {
      const errorElement = container.querySelector(
        '[data-testid="error-boundary"]',
      );
      expect(errorElement).toBeInTheDocument();
    },
  };
};

// Accessibility testing helpers
export const createAccessibilityHelpers = () => {
  return {
    checkAriaLabel: (element: HTMLElement, expectedLabel: string) => {
      expect(element).toHaveAttribute("aria-label", expectedLabel);
    },

    checkAriaDescribedBy: (element: HTMLElement, descriptionId: string) => {
      expect(element).toHaveAttribute("aria-describedby", descriptionId);
    },

    checkRole: (element: HTMLElement, expectedRole: string) => {
      expect(element).toHaveAttribute("role", expectedRole);
    },

    checkTabIndex: (element: HTMLElement, expectedTabIndex: number) => {
      expect(element).toHaveAttribute("tabindex", expectedTabIndex.toString());
    },

    // Screen reader announcer simulation
    mockScreenReader: () => {
      const announcements: string[] = [];

      return {
        announce: (message: string) => {
          announcements.push(message);
        },

        getAnnouncements: () => [...announcements],

        clearAnnouncements: () => {
          announcements.length = 0;
        },
      };
    },
  };
};

// Performance testing utilities
export const createPerformanceHelpers = () => {
  return {
    measureRenderTime: async (renderFn: () => void): Promise<number> => {
      const start = performance.now();
      await renderFn();
      return performance.now() - start;
    },

    measureInteractionTime: async (
      interactionFn: () => void,
    ): Promise<number> => {
      const start = performance.now();
      await interactionFn();
      return performance.now() - start;
    },

    simulateHeavyLoad: async (duration: number = 100): Promise<void> => {
      return new Promise((resolve) => {
        const start = Date.now();
        const heavyTask = () => {
          if (Date.now() - start < duration) {
            // Simulate heavy computation
            Array.from({ length: 1000 }, () => Math.random()).reduce(
              (a, b) => a + b,
              0,
            );
            setTimeout(heavyTask, 0);
          } else {
            resolve();
          }
        };
        heavyTask();
      });
    },
  };
};

// Export all helpers as a combined utility
export const createTestUtils = () => ({
  render: customRender,
  userInteraction: createUserInteractionHelpers,
  componentState: createComponentStateHelpers,
  responsive: createResponsiveHelpers,
  mockData: createMockData,
  animation: createAnimationHelpers,
  error: createErrorHelpers,
  accessibility: createAccessibilityHelpers,
  performance: createPerformanceHelpers,
});

// Default export for convenience
export default createTestUtils;
