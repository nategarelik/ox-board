/**
 * Application Optimizer
 *
 * Main integration point for all performance optimizations.
 * Provides a wrapper component that initializes and manages
 * the optimization suite for the entire application.
 */

'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { optimizationManager } from './index';

interface AppOptimizerProps {
  children: React.ReactNode;
  enableMonitoring?: boolean;
  enableBenchmarking?: boolean;
  audioContext?: AudioContext;
  onPerformanceAlert?: (alert: any) => void;
}

interface PerformanceStatus {
  initialized: boolean;
  monitoring: boolean;
  status: 'good' | 'fair' | 'poor';
  fps: number;
  memory: number;
  latency: number;
  alerts: number;
}

export const AppOptimizer: React.FC<AppOptimizerProps> = ({
  children,
  enableMonitoring = true,
  enableBenchmarking = false,
  audioContext,
  onPerformanceAlert
}) => {
  const [status, setStatus] = useState<PerformanceStatus>({
    initialized: false,
    monitoring: false,
    status: 'good',
    fps: 0,
    memory: 0,
    latency: 0,
    alerts: 0
  });

  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Initialize optimization suite
  useEffect(() => {
    let mounted = true;

    const initializeOptimizations = async () => {
      if (isInitializing || status.initialized) return;

      setIsInitializing(true);
      setInitError(null);

      try {
        await optimizationManager.initialize({
          enableMonitoring,
          enableBenchmarking,
          audioContext
        });

        if (mounted) {
          setStatus(prev => ({ ...prev, initialized: true, monitoring: enableMonitoring }));
        }
      } catch (error) {
        console.error('Failed to initialize optimization suite:', error);
        if (mounted) {
          setInitError(error instanceof Error ? error.message : 'Unknown error');
        }
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    };

    initializeOptimizations();

    return () => {
      mounted = false;
    };
  }, [enableMonitoring, enableBenchmarking, audioContext]);

  // Performance monitoring
  useEffect(() => {
    if (!status.initialized || !enableMonitoring) return;

    const interval = setInterval(() => {
      const optimizationStatus = optimizationManager.getOptimizationStatus();

      setStatus(prev => ({
        ...prev,
        status: optimizationStatus.performance.overall,
        fps: optimizationStatus.performance.fps.value,
        memory: optimizationStatus.memory.usage,
        latency: optimizationStatus.metrics.latency.gesture || 0,
        alerts: optimizationStatus.performance.recommendations.length
      }));

      // Trigger performance alerts
      if (optimizationStatus.performance.overall === 'poor' && onPerformanceAlert) {
        onPerformanceAlert({
          type: 'performance_degradation',
          status: optimizationStatus.performance.overall,
          recommendations: optimizationStatus.performance.recommendations
        });
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [status.initialized, enableMonitoring, onPerformanceAlert]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (status.initialized) {
        optimizationManager.cleanup().catch(console.error);
      }
    };
  }, [status.initialized]);

  // Performance validation
  const validatePerformance = useCallback(async () => {
    if (!status.initialized) return null;

    try {
      return await optimizationManager.validatePerformance();
    } catch (error) {
      console.error('Performance validation failed:', error);
      return null;
    }
  }, [status.initialized]);

  // Optimization controls
  const optimizeForPerformance = useCallback(async () => {
    if (!status.initialized) return;

    try {
      await optimizationManager.optimizeForPerformance();
    } catch (error) {
      console.error('Performance optimization failed:', error);
    }
  }, [status.initialized]);

  // Context value for child components
  const optimizationContext = useMemo(() => ({
    status,
    validatePerformance,
    optimizeForPerformance,
    initialized: status.initialized,
    error: initError
  }), [status, validatePerformance, optimizeForPerformance, initError]);

  // Error boundary for optimization failures
  if (initError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-red-900 border border-red-700 rounded-lg p-6 max-w-md">
          <h2 className="text-red-400 font-bold text-lg mb-2">
            Optimization Error
          </h2>
          <p className="text-red-300 text-sm mb-4">
            Failed to initialize performance optimizations: {initError}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-700 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-gray-400">
            Initializing Performance Optimizations...
          </div>
        </div>
      </div>
    );
  }

  return (
    <OptimizationContext.Provider value={optimizationContext}>
      <div className="min-h-screen bg-gray-900 relative">
        {/* Performance status indicator (development only) */}
        {process.env.NODE_ENV === 'development' && status.initialized && (
          <PerformanceStatusIndicator status={status} />
        )}

        {/* Main application */}
        {children}
      </div>
    </OptimizationContext.Provider>
  );
};

// Performance status indicator for development
const PerformanceStatusIndicator: React.FC<{ status: PerformanceStatus }> = ({
  status
}) => {
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = () => {
    switch (status.status) {
      case 'good': return 'bg-green-500';
      case 'fair': return 'bg-yellow-500';
      case 'poor': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`rounded-lg border border-gray-600 shadow-lg transition-all duration-200 ${
          expanded ? 'bg-gray-800 p-4' : 'bg-gray-900 p-2'
        }`}
      >
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
          <span className="text-white text-sm font-medium">
            {status.status.toUpperCase()}
          </span>
          {expanded && (
            <svg
              className="w-4 h-4 text-gray-400 transform transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            </svg>
          )}
        </div>

        {expanded && (
          <div className="mt-3 text-xs text-gray-300 space-y-1">
            <div className="flex justify-between">
              <span>FPS:</span>
              <span className="font-mono">{status.fps}</span>
            </div>
            <div className="flex justify-between">
              <span>Memory:</span>
              <span className="font-mono">{status.memory}MB</span>
            </div>
            <div className="flex justify-between">
              <span>Latency:</span>
              <span className="font-mono">{status.latency.toFixed(1)}ms</span>
            </div>
            {status.alerts > 0 && (
              <div className="flex justify-between text-yellow-400">
                <span>Alerts:</span>
                <span className="font-mono">{status.alerts}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Context for accessing optimization features in components
export const OptimizationContext = React.createContext<{
  status: PerformanceStatus;
  validatePerformance: () => Promise<any>;
  optimizeForPerformance: () => Promise<void>;
  initialized: boolean;
  error: string | null;
} | null>(null);

// Hook for using optimization context
export const useOptimizationContext = () => {
  const context = React.useContext(OptimizationContext);
  if (!context) {
    throw new Error('useOptimizationContext must be used within AppOptimizer');
  }
  return context;
};

// HOC for optimizing components
export const withPerformanceOptimization = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    memo?: boolean;
    lazy?: boolean;
    trackRendering?: boolean;
  }
) => {
  const {
    memo: enableMemo = true,
    lazy = false,
    trackRendering = true
  } = options || {};

  const OptimizedComponent = React.forwardRef<any, P>((props, ref) => {
    // Track rendering performance
    useEffect(() => {
      if (trackRendering) {
        optimizationManager.startLatencyMeasurement(`component_${Component.name}_render`);
        return () => {
          optimizationManager.endLatencyMeasurement(`component_${Component.name}_render`);
        };
      }
    });

    return React.createElement(Component as any, { ...props, ref } as any);
  });

  OptimizedComponent.displayName = `Optimized(${Component.displayName || Component.name})`;

  // Apply lazy loading if requested
  if (lazy) {
    // Note: Lazy loading would need actual code splitting to work properly
    // For now, return the component directly to avoid runtime errors
    return enableMemo ? React.memo(OptimizedComponent) : OptimizedComponent;
  }

  return enableMemo ? React.memo(OptimizedComponent) : OptimizedComponent;
};

export default AppOptimizer;