/**
 * Lazy-loaded Components for Performance Optimization
 *
 * Heavy components that are loaded on-demand to improve initial bundle size
 * and time-to-interactive performance.
 */

import React, {
  lazy,
  ComponentType,
  LazyExoticComponent,
  ReactNode,
  ErrorInfo,
} from "react";

// Heavy 3D and visualization components
export const LazyStem3DVisualizer = lazy(() =>
  import("../../components/stem-player/Stem3DVisualizer").then((module) => ({
    default: module.default,
  })),
);

export const LazyCamelotWheelVisualizer = lazy(() =>
  import("../../components/AI/CamelotWheelVisualizer").then((module) => ({
    default: module.default,
  })),
);

export const LazyCompatibilityVisualizer = lazy(() =>
  import("../../components/AI/CompatibilityVisualizer").then((module) => ({
    default: module.default,
  })),
);

export const LazyMixRecommendationsPanel = lazy(() =>
  import("../../components/AI/MixRecommendationsPanel").then((module) => ({
    default: module.default,
  })),
);

// Heavy DJ components
export const LazyProfessionalDJInterface = lazy(() =>
  import("../../components/DJ/ProfessionalDJInterface").then((module) => ({
    default: module.default,
  })),
);

export const LazyImmersiveGestureInterface = lazy(() =>
  import("../../components/DJ/ImmersiveGestureInterface").then((module) => ({
    default: module.default,
  })),
);

export const LazyEffectsRack = lazy(() =>
  import("../../components/DJ/EffectsRack").then((module) => ({
    default: module.default,
  })),
);

// Loading fallbacks
export const createLoadingFallback = (
  text: string = "Loading...",
  className: string = "",
) => (
  <div className={`flex items-center justify-center p-8 ${className}`}>
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  </div>
);

// Error boundary for lazy components

interface LazyComponentErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface LazyComponentErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class LazyComponentErrorBoundary extends React.Component<
  LazyComponentErrorBoundaryProps,
  LazyComponentErrorBoundaryState
> {
  constructor(props: LazyComponentErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(
    error: Error,
  ): LazyComponentErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Lazy component error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center p-8">
            <div className="text-center text-red-400">
              <p className="text-sm">Failed to load component</p>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="mt-2 px-3 py-1 bg-red-600 rounded text-xs hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Higher-order component for lazy loading with error boundary
export function withLazyLoading<T extends ComponentType<any>>(
  LazyComponent: LazyExoticComponent<T>,
  loadingText?: string,
) {
  return function LazyLoadedComponent(props: React.ComponentProps<T>) {
    return (
      <LazyComponentErrorBoundary>
        <React.Suspense fallback={createLoadingFallback(loadingText)}>
          <LazyComponent {...props} />
        </React.Suspense>
      </LazyComponentErrorBoundary>
    );
  };
}
