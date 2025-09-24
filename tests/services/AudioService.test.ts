import { AudioService } from "@/services/AudioService";

describe("AudioService", () => {
  let audioService: AudioService;

  beforeEach(() => {
    // Reset singleton instance before each test
    (AudioService as any).instance = undefined;
    audioService = AudioService.getInstance();
  });

  describe("getInstance", () => {
    it("should return singleton instance", () => {
      const instance1 = AudioService.getInstance();
      const instance2 = AudioService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it("should create instance on first call", () => {
      expect(audioService).toBeDefined();
      expect(audioService).toBeInstanceOf(AudioService);
    });
  });

  describe("initialize", () => {
    it("should initialize audio context and components", async () => {
      const initialized = await audioService.initialize();
      expect(initialized).toBe(true);
    });

    it("should not reinitialize if already initialized", async () => {
      await audioService.initialize();
      const secondInit = await audioService.initialize();
      expect(secondInit).toBe(true);
    });
  });

  describe("audio control methods", () => {
    beforeEach(async () => {
      await audioService.initialize();
    });

    it("should set master volume", () => {
      audioService.setMasterVolume(0.5);
      expect(audioService.getMasterVolume()).toBe(0.5);
    });

    it("should clamp volume between 0 and 1", () => {
      audioService.setMasterVolume(-0.5);
      expect(audioService.getMasterVolume()).toBe(0);

      audioService.setMasterVolume(1.5);
      expect(audioService.getMasterVolume()).toBe(1);
    });

    it("should set crossfader value", () => {
      audioService.setCrossfaderValue(0.7);
      expect(audioService.getCrossfaderValue()).toBe(0.7);
    });

    it("should clamp crossfader between 0 and 1", () => {
      audioService.setCrossfaderValue(-0.2);
      expect(audioService.getCrossfaderValue()).toBe(0);

      audioService.setCrossfaderValue(1.2);
      expect(audioService.getCrossfaderValue()).toBe(1);
    });
  });

  describe("cleanup", () => {
    it("should cleanup resources", async () => {
      await audioService.initialize();
      audioService.cleanup();

      // After cleanup, should be able to reinitialize
      const reinitialized = await audioService.initialize();
      expect(reinitialized).toBe(true);
    });
  });
});
