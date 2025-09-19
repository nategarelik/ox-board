import { DeckManager } from '../../app/services/DeckManager';
import { AudioService } from '../../app/services/AudioService';

describe('DeckManager', () => {
  let deckManager: DeckManager;
  let audioService: AudioService;

  beforeEach(async () => {
    // Reset singleton instances
    (AudioService as any).instance = undefined;
    (DeckManager as any).instance = undefined;

    audioService = AudioService.getInstance();
    await audioService.initialize();
    deckManager = DeckManager.getInstance();
  });

  afterEach(() => {
    audioService.cleanup();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = DeckManager.getInstance();
      const instance2 = DeckManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should create instance when AudioService is initialized', () => {
      expect(deckManager).toBeDefined();
      expect(deckManager).toBeInstanceOf(DeckManager);
    });
  });

  describe('deck operations', () => {
    it('should have two decks initialized', () => {
      const decks = deckManager.getDecks();
      expect(decks).toHaveLength(2);
      expect(decks[0].id).toBe(1);
      expect(decks[1].id).toBe(2);
    });

    it('should get deck by id', () => {
      const deck1 = deckManager.getDeck(1);
      const deck2 = deckManager.getDeck(2);

      expect(deck1).toBeDefined();
      expect(deck2).toBeDefined();
      expect(deck1?.id).toBe(1);
      expect(deck2?.id).toBe(2);
    });

    it('should return undefined for invalid deck id', () => {
      const deck = deckManager.getDeck(99);
      expect(deck).toBeUndefined();
    });

    it('should set deck volume', () => {
      deckManager.setDeckVolume(1, 0.7);
      const deck = deckManager.getDeck(1);
      expect(deck?.volume).toBe(0.7);
    });

    it('should clamp deck volume between 0 and 1', () => {
      deckManager.setDeckVolume(1, -0.5);
      const deck1 = deckManager.getDeck(1);
      expect(deck1?.volume).toBe(0);

      deckManager.setDeckVolume(2, 1.5);
      const deck2 = deckManager.getDeck(2);
      expect(deck2?.volume).toBe(1);
    });

    it('should toggle play state', () => {
      const deck = deckManager.getDeck(1);
      const initialState = deck?.isPlaying || false;

      deckManager.togglePlay(1);
      expect(deck?.isPlaying).toBe(!initialState);

      deckManager.togglePlay(1);
      expect(deck?.isPlaying).toBe(initialState);
    });
  });

  describe('cue points', () => {
    it('should add cue point to deck', () => {
      deckManager.addCuePoint(1, 10.5);
      const deck = deckManager.getDeck(1);
      expect(deck?.cuePoints).toContain(10.5);
    });

    it('should handle multiple cue points', () => {
      deckManager.addCuePoint(1, 10);
      deckManager.addCuePoint(1, 20);
      deckManager.addCuePoint(1, 30);

      const deck = deckManager.getDeck(1);
      expect(deck?.cuePoints).toEqual([10, 20, 30]);
    });
  });

  describe('loop controls', () => {
    it('should set loop start and end', () => {
      deckManager.setLoop(1, 5, 10);
      const deck = deckManager.getDeck(1);

      expect(deck?.loopStart).toBe(5);
      expect(deck?.loopEnd).toBe(10);
    });

    it('should clear loop', () => {
      deckManager.setLoop(1, 5, 10);
      deckManager.clearLoop(1);

      const deck = deckManager.getDeck(1);
      expect(deck?.loopStart).toBeNull();
      expect(deck?.loopEnd).toBeNull();
    });
  });

  describe('playback rate', () => {
    it('should set playback rate', () => {
      deckManager.setPlaybackRate(1, 1.2);
      const deck = deckManager.getDeck(1);
      expect(deck?.playbackRate).toBe(1.2);
    });

    it('should clamp playback rate between 0.5 and 2', () => {
      deckManager.setPlaybackRate(1, 0.3);
      const deck1 = deckManager.getDeck(1);
      expect(deck1?.playbackRate).toBe(0.5);

      deckManager.setPlaybackRate(2, 2.5);
      const deck2 = deckManager.getDeck(2);
      expect(deck2?.playbackRate).toBe(2);
    });
  });
});