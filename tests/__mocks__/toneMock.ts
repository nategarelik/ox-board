const noop = () => undefined;

const createParam = (initial = 0) => {
  const param: any = {
    value: initial,
    rampTo: (next: number) => {
      param.value = next;
    },
    setValueAtTime: (next: number) => {
      param.value = next;
    },
  };
  return param;
};

const attachNodeHelpers = (target: any) => {
  target.connect = (node?: any) => node ?? target;
  target.disconnect = noop;
  target.dispose = noop;
  target.toDestination = noop;
  return target;
};

export class Context {
  public latencyHint: string | number;
  public lookAhead: number;
  public updateInterval: number;
  public sampleRate: number;
  public state: "suspended" | "running" | "closed" | "disposed";
  public rawContext: any;

  constructor(
    options: {
      latencyHint?: string | number;
      lookAhead?: number;
      updateInterval?: number;
      sampleRate?: number;
    } = {},
  ) {
    this.latencyHint = options.latencyHint ?? "interactive";
    this.lookAhead = options.lookAhead ?? 0.1;
    this.updateInterval = options.updateInterval ?? 0.05;
    this.sampleRate = options.sampleRate ?? 44100;
    this.state = "suspended";
    this.rawContext = {
      baseLatency: 0.01,
      sampleRate: this.sampleRate,
      resume: async () => {
        this.state = "running";
      },
      suspend: async () => {
        this.state = "suspended";
      },
    };
  }

  async resume(): Promise<void> {
    this.state = "running";
  }

  async close(): Promise<void> {
    this.state = "closed";
  }

  dispose(): void {
    this.state = "disposed";
  }

  createGain(): Gain {
    return new Gain();
  }

  createStereoPanner(): Panner {
    return new Panner(0);
  }
}

export class Gain {
  public gain = createParam(1);

  constructor(value = 1) {
    this.gain.value = value;
    attachNodeHelpers(this);
  }
}

export class EQ3 {
  public low = createParam(0);
  public mid = createParam(0);
  public high = createParam(0);

  constructor(initial: { low?: number; mid?: number; high?: number } = {}) {
    this.low.value = initial.low ?? 0;
    this.mid.value = initial.mid ?? 0;
    this.high.value = initial.high ?? 0;
    attachNodeHelpers(this);
  }
}

export class Filter {
  public frequency = createParam(1000);
  public Q = createParam(1);
  public type: string;

  constructor(options: any = {}) {
    this.frequency.value =
      typeof options === "number" ? options : (options.frequency ?? 1000);
    this.Q.value = options.Q ?? 1;
    this.type = options.type ?? "lowpass";
    attachNodeHelpers(this);
  }
}

export class Panner {
  public pan = createParam(0);

  constructor(value = 0) {
    this.pan.value = value;
    attachNodeHelpers(this);
  }
}

export class CrossFade {
  public fade = createParam(0.5);
  public a: Gain;
  public b: Gain;

  constructor(value = 0.5) {
    this.fade.value = value;
    this.a = new Gain(1);
    this.b = new Gain(1);
    attachNodeHelpers(this);
  }
}

export class Limiter {
  public threshold = createParam(-1);

  constructor(threshold = -1) {
    this.threshold.value = threshold;
    attachNodeHelpers(this);
  }
}

export class Compressor {
  public ratio = createParam(4);
  public threshold = createParam(-24);
  public attack = createParam(0.003);
  public release = createParam(0.25);

  constructor(options: any = {}) {
    this.ratio.value = options.ratio ?? 4;
    this.threshold.value = options.threshold ?? -24;
    this.attack.value = options.attack ?? 0.003;
    this.release.value = options.release ?? 0.25;
    attachNodeHelpers(this);
  }
}

export class Meter {
  constructor() {
    attachNodeHelpers(this);
  }

  getLevel(): number {
    return -20;
  }
}

export class Player {
  public loaded = true;
  public state: "stopped" | "started" = "stopped";
  public playbackRate = 1;
  public volume = createParam(0);
  public onstop: (() => void) | null = null;
  public onload: (() => void) | null = null;
  public buffer: any = null;
  public fadeIn = 0;
  public fadeOut = 0;
  public loop = false;
  public loopStart = 0;
  public loopEnd = 0;
  public reverse = false;
  public autostart = false;

  constructor(options: any = {}) {
    this.playbackRate = options.playbackRate ?? 1;
    this.volume.value = options.volume ?? 0;
    this.buffer = options.url ?? null;
    this.fadeIn = options.fadeIn ?? 0;
    this.fadeOut = options.fadeOut ?? 0;
    this.loop = options.loop ?? false;
    this.loopStart = options.loopStart ?? 0;
    this.loopEnd = options.loopEnd ?? 0;
    this.reverse = options.reverse ?? false;
    this.autostart = options.autostart ?? false;
    attachNodeHelpers(this);
  }

  async load(url: any): Promise<this> {
    this.buffer = url;
    this.loaded = true;
    if (this.onload) {
      this.onload();
    }
    return this;
  }

  start(time?: number, offset?: number, duration?: number): this {
    this.state = "started";
    return this;
  }

  stop(time?: number): this {
    this.state = "stopped";
    if (this.onstop) {
      this.onstop();
    }
    return this;
  }

  stopAtTime(time: number): this {
    // Schedule stop for later
    setTimeout(() => {
      this.stop(time);
    }, 0);
    return this;
  }

  seek(offset: number): this {
    return this;
  }

  sync(): this {
    return this;
  }

  unsync(): this {
    return this;
  }
}

export class Reverb {
  public wet = createParam(0.5);
  public decay = 1.5;
  public preDelay = 0.01;

  constructor(options: any = {}) {
    this.wet.value = options.wet ?? 0.5;
    this.decay = options.decay ?? 1.5;
    this.preDelay = options.preDelay ?? 0.01;
    attachNodeHelpers(this);
  }
}

export class Delay {
  public delayTime = createParam(0);
  public feedback = createParam(0);
  public wet = createParam(0.5);

  constructor(options: any = {}) {
    this.delayTime.value = options.delayTime ?? 0;
    this.feedback.value = options.feedback ?? 0;
    this.wet.value = options.wet ?? 0.5;
    attachNodeHelpers(this);
  }
}

export class Distortion {
  public distortion = 0.4;
  public wet = createParam(1);

  constructor(options: any = {}) {
    this.distortion = options.distortion ?? 0.4;
    this.wet.value = options.wet ?? 1;
    attachNodeHelpers(this);
  }
}

export class BitCrusher {
  public bits = 4;
  public wet = createParam(1);

  constructor(options: any = {}) {
    this.bits = options.bits ?? 4;
    this.wet.value = options.wet ?? 1;
    attachNodeHelpers(this);
  }
}

export class AutoFilter {
  public frequency = createParam(1);
  public type = "sine";
  public depth = createParam(1);
  public wet = createParam(1);

  constructor(options: any = {}) {
    this.frequency.value = options.frequency ?? 1;
    this.type = options.type ?? "sine";
    this.depth.value = options.depth ?? 1;
    this.wet.value = options.wet ?? 1;
    attachNodeHelpers(this);
  }

  start(): this {
    return this;
  }

  stop(): this {
    return this;
  }
}

export class Volume {
  public volume = createParam(0);

  constructor(value = 0) {
    this.volume.value = value;
    attachNodeHelpers(this);
  }
}

export class Channel {
  public volume = createParam(0);
  public pan = createParam(0);
  public mute = false;
  public solo = false;

  constructor(options: any = {}) {
    this.volume.value = options.volume ?? 0;
    this.pan.value = options.pan ?? 0;
    this.mute = options.mute ?? false;
    this.solo = options.solo ?? false;
    attachNodeHelpers(this);
  }

  receive(name: string): this {
    return this;
  }

  send(name: string, amount?: number): this {
    return this;
  }
}

export class ToneAudioBuffer {
  public duration = 0;
  public length = 0;
  public sampleRate = 44100;
  public numberOfChannels = 2;

  static async loaded(): Promise<void> {
    return Promise.resolve();
  }

  constructor(url?: any) {
    this.duration = 10;
    this.length = 441000;
  }

  get(channel = 0): Float32Array {
    return new Float32Array(this.length);
  }

  toArray(channel?: number): Float32Array {
    return this.get(channel);
  }
}

let currentContext = new Context();
export let context: Context = currentContext;

export const setContext = (ctx: Context) => {
  currentContext = ctx;
  context = ctx;
};

export const getContext = (): Context => currentContext;

export const getDestination = () =>
  attachNodeHelpers({ context: currentContext });

export const start = async () => {
  await currentContext.resume();
};

export const now = () => Date.now() / 1000;

let transportState: "stopped" | "started" = "stopped";
let transportBpm = createParam(120);

export const Transport = {
  get state() {
    return transportState;
  },
  bpm: transportBpm,
  start: async () => {
    transportState = "started";
  },
  stop: () => {
    transportState = "stopped";
  },
  scheduleRepeat: noop,
  clear: noop,
  cancel: noop,
};

export default {
  Context,
  Gain,
  EQ3,
  Filter,
  Panner,
  CrossFade,
  Limiter,
  Compressor,
  Meter,
  Player,
  Reverb,
  Delay,
  Distortion,
  BitCrusher,
  AutoFilter,
  Volume,
  Channel,
  ToneAudioBuffer,
  context,
  setContext,
  getContext,
  getDestination,
  start,
  now,
  Transport,
};
