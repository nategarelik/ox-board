/**
 * High-performance Canvas-based stem visualization with 60 FPS rendering
 * GPU-accelerated effects and responsive design
 */

export interface VisualizationConfig {
  /** Target FPS for rendering */
  targetFPS: number;
  /** Enable GPU acceleration where available */
  useGPUAcceleration: boolean;
  /** Canvas buffer size for smooth rendering */
  bufferSize: number;
  /** Enable adaptive quality based on performance */
  adaptiveQuality: boolean;
  /** Maximum render time budget per frame (ms) */
  maxFrameTime: number;
}

export interface StemVisualizationData {
  /** Frequency spectrum data (0-1) */
  spectrum: Float32Array;
  /** Waveform data (normalized -1 to 1) */
  waveform: Float32Array;
  /** RMS level (0-1) */
  level: number;
  /** Peak level (0-1) */
  peak: number;
  /** Current playback time */
  currentTime: number;
  /** Is currently playing */
  isPlaying: boolean;
}

export interface VisualizationStyle {
  /** Primary color for the stem */
  color: string;
  /** Secondary color for gradients */
  secondaryColor?: string;
  /** Background color */
  backgroundColor: string;
  /** Line width for drawing */
  lineWidth: number;
  /** Opacity (0-1) */
  opacity: number;
  /** Enable glow effects */
  enableGlow: boolean;
  /** Enable particle effects */
  enableParticles: boolean;
}

export interface CanvasMetrics {
  /** Frame rate (FPS) */
  fps: number;
  /** Frame render time (ms) */
  frameTime: number;
  /** Total rendered frames */
  frameCount: number;
  /** Dropped frames */
  droppedFrames: number;
  /** Canvas size */
  width: number;
  height: number;
  /** DPI scaling factor */
  dpr: number;
}

const defaultConfig: VisualizationConfig = {
  targetFPS: 60,
  useGPUAcceleration: true,
  bufferSize: 2048,
  adaptiveQuality: true,
  maxFrameTime: 16.67 // 60 FPS target
};

export class StemVisualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: VisualizationConfig;
  private animationId: number | null = null;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private droppedFrames: number = 0;
  private fpsHistory: number[] = [];
  private renderTimeHistory: number[] = [];

  // Rendering state
  private isRendering: boolean = false;
  private needsResize: boolean = false;
  private qualityLevel: number = 1; // 0.5 to 1.0 for adaptive quality

  // Canvas buffers for smooth rendering
  private offscreenCanvas: OffscreenCanvas | null = null;
  private offscreenCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;

  // Particle system for advanced effects
  private particles: Particle[] = [];
  private particlePool: Particle[] = [];

  // Performance monitoring
  private performanceObserver: PerformanceObserver | null = null;

  constructor(canvas: HTMLCanvasElement, config: Partial<VisualizationConfig> = {}) {
    this.canvas = canvas;
    this.config = { ...defaultConfig, ...config };

    const ctx = canvas.getContext('2d', {
      alpha: true,
      desynchronized: true, // Reduce input latency
      willReadFrequently: false
    });

    if (!ctx) {
      throw new Error('Failed to get 2D rendering context');
    }

    this.ctx = ctx;
    this.setupCanvas();
    this.setupPerformanceMonitoring();
    this.setupResizeObserver();

    // Initialize offscreen canvas for double buffering
    if (this.config.useGPUAcceleration && typeof OffscreenCanvas !== 'undefined') {
      this.initializeOffscreenCanvas();
    }
  }

  private setupCanvas(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();

    // Set actual canvas size
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;

    // Scale the canvas back down using CSS
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';

    // Scale the drawing context so everything draws at the correct size
    this.ctx.scale(dpr, dpr);

    // Enable hardware acceleration hints
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  private initializeOffscreenCanvas(): void {
    try {
      this.offscreenCanvas = new OffscreenCanvas(this.canvas.width, this.canvas.height);
      this.offscreenCtx = this.offscreenCanvas.getContext('2d', {
        alpha: true,
        desynchronized: true
      });
    } catch (error) {
      console.warn('OffscreenCanvas not available, using standard canvas');
      this.config.useGPUAcceleration = false;
    }
  }

  private setupPerformanceMonitoring(): void {
    if (typeof PerformanceObserver !== 'undefined') {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'stem-visualizer-frame') {
            this.renderTimeHistory.push(entry.duration);
            if (this.renderTimeHistory.length > 60) {
              this.renderTimeHistory.shift();
            }

            // Adaptive quality adjustment
            if (this.config.adaptiveQuality) {
              this.adjustQuality(entry.duration);
            }
          }
        });
      });

      this.performanceObserver.observe({ entryTypes: ['measure'] });
    }
  }

  private setupResizeObserver(): void {
    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(() => {
        this.needsResize = true;
      });

      resizeObserver.observe(this.canvas);
    }
  }

  private adjustQuality(frameTime: number): void {
    const targetFrameTime = this.config.maxFrameTime;

    if (frameTime > targetFrameTime * 1.5) {
      // Frame took too long, reduce quality
      this.qualityLevel = Math.max(0.5, this.qualityLevel - 0.1);
    } else if (frameTime < targetFrameTime * 0.75) {
      // Frame was fast, can increase quality
      this.qualityLevel = Math.min(1.0, this.qualityLevel + 0.05);
    }
  }

  private handleResize(): void {
    if (!this.needsResize) return;

    this.setupCanvas();

    if (this.offscreenCanvas) {
      this.offscreenCanvas.width = this.canvas.width;
      this.offscreenCanvas.height = this.canvas.height;
    }

    this.needsResize = false;
  }

  private calculateFPS(): number {
    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;

    if (deltaTime > 0) {
      const currentFPS = 1000 / deltaTime;
      this.fpsHistory.push(currentFPS);

      if (this.fpsHistory.length > 60) {
        this.fpsHistory.shift();
      }

      // Return average FPS over last 60 frames
      return this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    }

    return 0;
  }

  private shouldDropFrame(frameTime: number): boolean {
    return frameTime > this.config.maxFrameTime * 2;
  }

  public render(data: StemVisualizationData[], styles: VisualizationStyle[]): void {
    if (!this.isRendering) return;

    const frameStart = performance.now();

    // Handle canvas resize
    this.handleResize();

    // Use offscreen canvas if available
    const renderCtx = this.offscreenCtx || this.ctx;
    const canvas = this.offscreenCanvas || this.canvas;

    // Clear canvas
    renderCtx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply quality scaling for performance
    const quality = this.qualityLevel;
    const skipPixels = quality < 0.8 ? Math.ceil(2 / quality) : 1;

    // Render each stem
    data.forEach((stemData, index) => {
      if (index < styles.length) {
        this.renderStem(renderCtx, stemData, styles[index], index, quality, skipPixels);
      }
    });

    // Copy offscreen canvas to main canvas if using double buffering
    if (this.offscreenCanvas && this.offscreenCtx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(this.offscreenCanvas, 0, 0);
    }

    const frameTime = performance.now() - frameStart;

    // Performance tracking
    if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
      performance.mark('stem-visualizer-frame-end');
      performance.measure('stem-visualizer-frame', 'stem-visualizer-frame-start', 'stem-visualizer-frame-end');
    }

    // Check if frame should be dropped
    if (this.shouldDropFrame(frameTime)) {
      this.droppedFrames++;
    }

    this.frameCount++;
    this.lastFrameTime = frameStart;
  }

  private renderStem(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    data: StemVisualizationData,
    style: VisualizationStyle,
    index: number,
    quality: number,
    skipPixels: number
  ): void {
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);
    const stemHeight = height / 4; // Divide canvas into 4 sections for 4 stems
    const yOffset = index * stemHeight;

    // Set drawing style
    ctx.globalAlpha = style.opacity;
    ctx.strokeStyle = style.color;
    ctx.fillStyle = style.color;
    ctx.lineWidth = style.lineWidth;

    // Enable glow effect if requested
    if (style.enableGlow && quality > 0.7) {
      ctx.shadowColor = style.color;
      ctx.shadowBlur = 10 * quality;
    } else {
      ctx.shadowBlur = 0;
    }

    // Render spectrum analyzer
    this.renderSpectrum(ctx, data.spectrum, width, stemHeight, yOffset, style, skipPixels);

    // Render waveform
    this.renderWaveform(ctx, data.waveform, width, stemHeight, yOffset + stemHeight * 0.7, style, skipPixels);

    // Render level meter
    this.renderLevelMeter(ctx, data.level, data.peak, width - 30, stemHeight, yOffset, style);

    // Render particles if enabled and quality is high enough
    if (style.enableParticles && quality > 0.8 && data.isPlaying) {
      this.renderParticles(ctx, data, width, stemHeight, yOffset, style);
    }

    // Reset shadow
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  private renderSpectrum(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    spectrum: Float32Array,
    width: number,
    height: number,
    yOffset: number,
    style: VisualizationStyle,
    skipPixels: number
  ): void {
    const barWidth = Math.max(1, width / spectrum.length * skipPixels);
    const maxHeight = height * 0.6;

    ctx.beginPath();

    for (let i = 0; i < spectrum.length; i += skipPixels) {
      const barHeight = spectrum[i] * maxHeight;
      const x = (i / spectrum.length) * width;
      const y = yOffset + height * 0.4 - barHeight;

      // Draw spectrum bar
      ctx.fillRect(x, y, barWidth - 1, barHeight);
    }
  }

  private renderWaveform(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    waveform: Float32Array,
    width: number,
    height: number,
    yOffset: number,
    style: VisualizationStyle,
    skipPixels: number
  ): void {
    const centerY = yOffset;
    const amplitude = height * 0.2;

    ctx.beginPath();
    let firstPoint = true;

    for (let i = 0; i < waveform.length; i += skipPixels) {
      const x = (i / waveform.length) * width;
      const y = centerY + waveform[i] * amplitude;

      if (firstPoint) {
        ctx.moveTo(x, y);
        firstPoint = false;
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  }

  private renderLevelMeter(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    level: number,
    peak: number,
    x: number,
    height: number,
    yOffset: number,
    style: VisualizationStyle
  ): void {
    const meterWidth = 20;
    const meterHeight = height * 0.8;

    // Background
    ctx.fillStyle = style.backgroundColor;
    ctx.fillRect(x, yOffset + height * 0.1, meterWidth, meterHeight);

    // Level
    ctx.fillStyle = style.color;
    const levelHeight = level * meterHeight;
    ctx.fillRect(x, yOffset + height * 0.1 + meterHeight - levelHeight, meterWidth, levelHeight);

    // Peak indicator
    if (peak > level) {
      ctx.fillStyle = '#ffffff';
      const peakY = yOffset + height * 0.1 + meterHeight - (peak * meterHeight);
      ctx.fillRect(x, peakY - 1, meterWidth, 2);
    }
  }

  private renderParticles(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    data: StemVisualizationData,
    width: number,
    height: number,
    yOffset: number,
    style: VisualizationStyle
  ): void {
    // Simple particle system for beat visualization
    if (data.level > 0.7 && Math.random() < 0.3) {
      this.createParticle(width * Math.random(), yOffset + height * 0.5, style.color);
    }

    // Update and render particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.update();

      if (particle.life <= 0) {
        this.particles.splice(i, 1);
        this.particlePool.push(particle);
      } else {
        particle.render(ctx);
      }
    }
  }

  private createParticle(x: number, y: number, color: string): void {
    let particle = this.particlePool.pop();

    if (!particle) {
      particle = new Particle();
    }

    particle.init(x, y, color);
    this.particles.push(particle);
  }

  public start(): void {
    if (this.isRendering) return;

    this.isRendering = true;
    this.frameCount = 0;
    this.droppedFrames = 0;
    this.lastFrameTime = performance.now();

    const animate = () => {
      if (!this.isRendering) return;

      const frameStart = performance.now();

      if (typeof performance !== 'undefined' && performance.mark) {
        performance.mark('stem-visualizer-frame-start');
      }

      this.animationId = requestAnimationFrame(animate);
    };

    animate();
  }

  public stop(): void {
    this.isRendering = false;

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public getMetrics(): CanvasMetrics {
    const fps = this.calculateFPS();
    const avgFrameTime = this.renderTimeHistory.length > 0
      ? this.renderTimeHistory.reduce((a, b) => a + b, 0) / this.renderTimeHistory.length
      : 0;

    return {
      fps,
      frameTime: avgFrameTime,
      frameCount: this.frameCount,
      droppedFrames: this.droppedFrames,
      width: this.canvas.width,
      height: this.canvas.height,
      dpr: window.devicePixelRatio || 1
    };
  }

  public setConfig(config: Partial<VisualizationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public dispose(): void {
    this.stop();

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }

    // Clear particles
    this.particles.length = 0;
    this.particlePool.length = 0;
  }
}

// Simple particle class for visual effects
class Particle {
  public x: number = 0;
  public y: number = 0;
  public vx: number = 0;
  public vy: number = 0;
  public life: number = 1;
  public maxLife: number = 1;
  public color: string = '#ffffff';
  public size: number = 2;

  public init(x: number, y: number, color: string): void {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 4;
    this.vy = (Math.random() - 0.5) * 4;
    this.life = this.maxLife = 1;
    this.color = color;
    this.size = 2 + Math.random() * 3;
  }

  public update(): void {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.1; // Gravity
    this.life -= 0.02;
    this.vx *= 0.99; // Air resistance
    this.vy *= 0.99;
  }

  public render(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void {
    const alpha = this.life / this.maxLife;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export default StemVisualizer;