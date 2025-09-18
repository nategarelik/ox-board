/**
 * Screen Reader Announcer Service
 *
 * Provides methods to announce state changes and events to screen readers
 * using ARIA live regions.
 */

export enum AnnouncementPriority {
  POLITE = 'polite',
  ASSERTIVE = 'assertive'
}

class ScreenReaderAnnouncer {
  private static instance: ScreenReaderAnnouncer | null = null;
  private politeRegion: HTMLDivElement | null = null;
  private assertiveRegion: HTMLDivElement | null = null;
  private announcementQueue: Array<{ message: string; priority: AnnouncementPriority }> = [];
  private isProcessing = false;

  private constructor() {
    this.initializeRegions();
  }

  public static getInstance(): ScreenReaderAnnouncer {
    if (!ScreenReaderAnnouncer.instance) {
      ScreenReaderAnnouncer.instance = new ScreenReaderAnnouncer();
    }
    return ScreenReaderAnnouncer.instance;
  }

  private initializeRegions(): void {
    if (typeof document === 'undefined') return;

    // Create polite region
    this.politeRegion = document.createElement('div');
    this.politeRegion.setAttribute('aria-live', 'polite');
    this.politeRegion.setAttribute('aria-atomic', 'true');
    this.politeRegion.className = 'sr-only';
    this.politeRegion.id = 'sr-announcer-polite';

    // Create assertive region
    this.assertiveRegion = document.createElement('div');
    this.assertiveRegion.setAttribute('aria-live', 'assertive');
    this.assertiveRegion.setAttribute('aria-atomic', 'true');
    this.assertiveRegion.className = 'sr-only';
    this.assertiveRegion.id = 'sr-announcer-assertive';

    // Append to body when DOM is ready
    if (document.body) {
      document.body.appendChild(this.politeRegion);
      document.body.appendChild(this.assertiveRegion);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        if (this.politeRegion && this.assertiveRegion) {
          document.body.appendChild(this.politeRegion);
          document.body.appendChild(this.assertiveRegion);
        }
      });
    }
  }

  /**
   * Announce a message to screen readers
   */
  public announce(message: string, priority: AnnouncementPriority = AnnouncementPriority.POLITE): void {
    this.announcementQueue.push({ message, priority });
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.announcementQueue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const { message, priority } = this.announcementQueue.shift()!;

    const region = priority === AnnouncementPriority.ASSERTIVE
      ? this.assertiveRegion
      : this.politeRegion;

    if (region) {
      // Clear the region first
      region.textContent = '';

      // Wait a tick for the clear to be recognized
      await new Promise(resolve => setTimeout(resolve, 100));

      // Set the new message
      region.textContent = message;

      // Clear after announcement
      await new Promise(resolve => setTimeout(resolve, 1000));
      region.textContent = '';
    }

    // Process next in queue
    setTimeout(() => this.processQueue(), 100);
  }

  /**
   * Announce deck state changes
   */
  public announceDeckState(deck: string, state: 'playing' | 'paused' | 'stopped'): void {
    const message = `Deck ${deck} ${state}`;
    this.announce(message, AnnouncementPriority.POLITE);
  }

  /**
   * Announce track loaded
   */
  public announceTrackLoaded(deck: string, title: string, artist: string): void {
    const message = `Loaded ${title} by ${artist} on Deck ${deck}`;
    this.announce(message, AnnouncementPriority.POLITE);
  }

  /**
   * Announce BPM detection
   */
  public announceBPM(deck: string, bpm: number, confidence: number): void {
    const confidenceText = confidence > 0.8 ? 'high' : confidence > 0.5 ? 'medium' : 'low';
    const message = `Deck ${deck} BPM detected: ${bpm.toFixed(1)} with ${confidenceText} confidence`;
    this.announce(message, AnnouncementPriority.POLITE);
  }

  /**
   * Announce effect state change
   */
  public announceEffectToggle(deck: string, effect: string, enabled: boolean): void {
    const message = `Deck ${deck} ${effect} ${enabled ? 'enabled' : 'disabled'}`;
    this.announce(message, AnnouncementPriority.POLITE);
  }

  /**
   * Announce crossfader position
   */
  public announceCrossfaderPosition(position: number): void {
    let positionText: string;
    if (position < -0.3) {
      positionText = 'left (Deck A)';
    } else if (position > 0.3) {
      positionText = 'right (Deck B)';
    } else {
      positionText = 'center';
    }
    const message = `Crossfader ${positionText}`;
    this.announce(message, AnnouncementPriority.POLITE);
  }

  /**
   * Announce sync state
   */
  public announceSyncState(enabled: boolean, master?: string): void {
    const message = enabled
      ? `Sync enabled with Deck ${master} as master`
      : 'Sync disabled';
    this.announce(message, AnnouncementPriority.POLITE);
  }

  /**
   * Announce recording state
   */
  public announceRecordingState(recording: boolean): void {
    const message = recording ? 'Recording started' : 'Recording stopped';
    this.announce(message, AnnouncementPriority.ASSERTIVE);
  }

  /**
   * Announce error
   */
  public announceError(error: string): void {
    const message = `Error: ${error}`;
    this.announce(message, AnnouncementPriority.ASSERTIVE);
  }

  /**
   * Announce gesture recognition
   */
  public announceGesture(gesture: string, action: string): void {
    const message = `${gesture} gesture recognized: ${action}`;
    this.announce(message, AnnouncementPriority.POLITE);
  }

  /**
   * Announce mix recommendation
   */
  public announceMixRecommendation(fromTrack: string, toTrack: string, compatibility: number): void {
    const compatText = compatibility > 0.8 ? 'excellent' : compatibility > 0.6 ? 'good' : 'fair';
    const message = `Mix recommendation: ${toTrack} has ${compatText} compatibility with ${fromTrack}`;
    this.announce(message, AnnouncementPriority.POLITE);
  }

  /**
   * Announce loop state
   */
  public announceLoopState(deck: string, enabled: boolean, bars?: number): void {
    const message = enabled
      ? `Deck ${deck} ${bars}-bar loop enabled`
      : `Deck ${deck} loop disabled`;
    this.announce(message, AnnouncementPriority.POLITE);
  }

  /**
   * Announce cue point
   */
  public announceCuePoint(deck: string, cueNumber?: number): void {
    const message = cueNumber
      ? `Deck ${deck} cue point ${cueNumber} set`
      : `Deck ${deck} cue point set`;
    this.announce(message, AnnouncementPriority.POLITE);
  }

  /**
   * Announce volume change
   */
  public announceVolumeChange(target: 'master' | 'deckA' | 'deckB', volume: number): void {
    const volumePercent = Math.round(volume * 100);
    const targetName = target === 'master' ? 'Master' : `Deck ${target.replace('deck', '')}`;
    const message = `${targetName} volume ${volumePercent}%`;
    this.announce(message, AnnouncementPriority.POLITE);
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    if (this.politeRegion?.parentNode) {
      this.politeRegion.parentNode.removeChild(this.politeRegion);
    }
    if (this.assertiveRegion?.parentNode) {
      this.assertiveRegion.parentNode.removeChild(this.assertiveRegion);
    }
    this.politeRegion = null;
    this.assertiveRegion = null;
    this.announcementQueue = [];
    ScreenReaderAnnouncer.instance = null;
  }
}

// Export singleton getter
export const getScreenReaderAnnouncer = (): ScreenReaderAnnouncer => {
  return ScreenReaderAnnouncer.getInstance();
};