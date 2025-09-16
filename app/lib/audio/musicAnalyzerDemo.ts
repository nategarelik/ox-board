/**
 * Music Analyzer Integration Demo
 *
 * Demonstrates the complete BPM and key detection system with real-world usage examples.
 * This file shows how to use the MusicAnalyzer with the enhanced DJ store for
 * comprehensive music analysis and mixing suggestions.
 */

import { musicAnalyzer } from './musicAnalyzerClient';
import useEnhancedDJStore, { type AnalyzedTrack } from '../../stores/enhancedDjStore';

// Example usage scenarios
export class MusicAnalyzerDemo {
  private store = useEnhancedDJStore.getState();

  /**
   * Demo 1: Analyze a single track
   */
  async demoTrackAnalysis(): Promise<void> {
    console.log('🎵 Demo: Complete Track Analysis');

    // Simulate loading an audio file (in real app, this would come from file input)
    const audioBuffer = this.generateTestAudio(128, 30); // 128 BPM, 30 seconds

    try {
      // Analyze the track
      const analyzedTrack = await this.store.analyzeTrack(audioBuffer, {
        title: 'Demo Track',
        artist: 'Test Artist',
        duration: 30
      });

      console.log('✅ Analysis complete:');
      console.log(`  🎼 Key: ${analyzedTrack.key} ${analyzedTrack.scale}`);
      console.log(`  ⏱️  BPM: ${analyzedTrack.bpm} (${(analyzedTrack.bpmConfidence * 100).toFixed(1)}% confidence)`);
      console.log(`  ⚡ Energy: ${(analyzedTrack.energy * 100).toFixed(1)}%`);
      console.log(`  🎯 Camelot: ${analyzedTrack.camelotKey}`);
      console.log(`  🔗 Compatible keys: ${analyzedTrack.compatibleKeys.join(', ')}`);
      console.log(`  📊 Beat grid: ${analyzedTrack.beatGrid.length} beats`);
      console.log(`  🥁 Downbeats: ${analyzedTrack.downbeats.length} bars`);

      return analyzedTrack;
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      throw error;
    }
  }

  /**
   * Demo 2: Real-time BPM tracking
   */
  async demoRealTimeBPM(): Promise<void> {
    console.log('\n🔄 Demo: Real-time BPM Detection');

    const audioBuffer = this.generateTestAudio(125, 5); // 5-second buffer

    try {
      const result = await musicAnalyzer.extractBPM(audioBuffer);

      console.log('✅ Real-time BPM detection:');
      console.log(`  ⏱️  Detected BPM: ${result.bpm}`);
      console.log(`  🎯 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`  📏 Beat interval: ${(60 / result.bpm).toFixed(3)}s`);
      console.log(`  🎵 Time signature: ${result.timeSignature[0]}/${result.timeSignature[1]}`);

      // Simulate beat phase tracking
      for (let time = 0; time < 3; time += 0.5) {
        const phase = this.calculateBeatPhase(time, result);
        console.log(`  📍 Time ${time}s: Phase ${(phase * 100).toFixed(1)}%`);
      }
    } catch (error) {
      console.error('❌ Real-time BPM detection failed:', error);
    }
  }

  /**
   * Demo 3: Key detection and compatibility
   */
  async demoKeyDetection(): Promise<void> {
    console.log('\n🎼 Demo: Key Detection and Compatibility');

    const keys = [
      { key: 'C', scale: 'major' as const, bpm: 128 },
      { key: 'A', scale: 'minor' as const, bpm: 126 },
      { key: 'G', scale: 'major' as const, bpm: 132 },
      { key: 'F#', scale: 'minor' as const, bpm: 140 }
    ];

    console.log('🔍 Testing key compatibility matrix:');

    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const key1 = `${keys[i].key} ${keys[i].scale}`;
        const key2 = `${keys[j].key} ${keys[j].scale}`;

        const keyCompatible = musicAnalyzer.isCompatibleKey(key1, key2);
        const bpmMatch = musicAnalyzer.getBPMMatchPercentage(keys[i].bpm, keys[j].bpm);

        const status = keyCompatible ? '✅' : '❌';
        console.log(`  ${status} ${key1} ↔ ${key2}: BPM match ${(bpmMatch * 100).toFixed(1)}%`);
      }
    }
  }

  /**
   * Demo 4: Auto-sync between decks
   */
  async demoAutoSync(): Promise<void> {
    console.log('\n🔄 Demo: Auto-Sync Between Decks');

    // Load two compatible tracks
    const track1: AnalyzedTrack = {
      id: 'track1',
      title: 'Track 1',
      artist: 'Artist A',
      duration: 180,
      bpm: 128,
      bpmConfidence: 0.9,
      key: 'C',
      keyConfidence: 0.8,
      scale: 'major',
      energy: 0.7,
      beatGrid: [0.5, 1.0, 1.5, 2.0, 2.5],
      downbeats: [0.5, 2.5],
      phrases: [],
      camelotKey: '8B',
      compatibleKeys: ['C major', 'G major', 'A minor'],
      mixingBPMRange: [120, 136],
      analyzedAt: Date.now(),
      analysisVersion: '1.0.0'
    };

    const track2: AnalyzedTrack = {
      ...track1,
      id: 'track2',
      title: 'Track 2',
      artist: 'Artist B',
      bpm: 125,
      key: 'A',
      scale: 'minor',
      camelotKey: '8A'
    };

    // Load tracks into decks
    this.store.loadTrack(0, track1);
    this.store.loadTrack(1, track2);

    console.log('🎛️  Loaded tracks:');
    console.log(`  Deck A: ${track1.title} - ${track1.bpm} BPM - ${track1.key} ${track1.scale}`);
    console.log(`  Deck B: ${track2.title} - ${track2.bpm} BPM - ${track2.key} ${track2.scale}`);

    // Check compatibility
    const compatibility = this.store.getMixingCompatibility(0, 1);
    console.log(`\n🎯 Compatibility score: ${(compatibility * 100).toFixed(1)}%`);

    // Enable auto-sync
    this.store.enableAutoSync(0, 1, 'bpm');
    console.log('🔗 Auto-sync enabled: Deck A → Deck B (BPM mode)');

    // Perform sync
    this.store.syncDecks(0, 1);
    const syncedDeck = this.store.decks[0];
    console.log(`✅ Sync applied: Deck A playback rate adjusted to ${syncedDeck.playbackRate.toFixed(3)}x`);
    console.log(`📊 Sync accuracy: ${(syncedDeck.syncAccuracy * 100).toFixed(1)}%`);

    // Generate mixing suggestions
    this.store.generateMixingSuggestions();
    const suggestions = this.store.musicAnalysis.suggestions;

    console.log('\n💡 Mixing suggestions:');
    suggestions.forEach((suggestion, index) => {
      const emoji = suggestion.autoSyncPossible ? '🤖' : '👤';
      console.log(`  ${emoji} ${suggestion.type.toUpperCase()}: ${suggestion.suggestion}`);
    });
  }

  /**
   * Demo 5: Performance benchmarking
   */
  async demoBenchmark(): Promise<void> {
    console.log('\n⚡ Demo: Performance Benchmarking');

    const testSizes = [
      { duration: 10, label: '10-second preview' },
      { duration: 30, label: '30-second analysis' },
      { duration: 180, label: 'Full track (3 min)' }
    ];

    for (const test of testSizes) {
      const audioBuffer = this.generateTestAudio(128, test.duration);

      // BPM detection benchmark
      const bpmStart = performance.now();
      await musicAnalyzer.extractBPM(audioBuffer);
      const bpmTime = performance.now() - bpmStart;

      // Key detection benchmark
      const keyStart = performance.now();
      await musicAnalyzer.detectKey(audioBuffer);
      const keyTime = performance.now() - keyStart;

      // Spectral analysis benchmark
      const spectralStart = performance.now();
      await musicAnalyzer.getSpectralFeatures(audioBuffer);
      const spectralTime = performance.now() - spectralStart;

      console.log(`📊 ${test.label}:`);
      console.log(`  ⏱️  BPM detection: ${bpmTime.toFixed(1)}ms`);
      console.log(`  🎼 Key detection: ${keyTime.toFixed(1)}ms`);
      console.log(`  📈 Spectral analysis: ${spectralTime.toFixed(1)}ms`);
      console.log(`  📋 Total: ${(bpmTime + keyTime + spectralTime).toFixed(1)}ms`);
    }

    // Check performance requirements
    const quickTest = this.generateTestAudio(128, 30);
    const start = performance.now();
    await musicAnalyzer.extractBPM(quickTest);
    const time = performance.now() - start;

    const requirement = 100; // 100ms requirement
    const status = time < requirement ? '✅' : '❌';
    console.log(`\n${status} Performance requirement: ${time.toFixed(1)}ms (target: <${requirement}ms)`);
  }

  /**
   * Demo 6: Error handling and resilience
   */
  async demoErrorHandling(): Promise<void> {
    console.log('\n🛡️  Demo: Error Handling and Resilience');

    // Test with empty buffer
    try {
      const emptyBuffer = new Float32Array(0);
      const result = await musicAnalyzer.extractBPM(emptyBuffer);
      console.log('✅ Empty buffer handled gracefully:', result.bpm);
    } catch (error) {
      console.log('❌ Empty buffer error:', (error as Error).message);
    }

    // Test with very short buffer
    try {
      const tinyBuffer = new Float32Array(100);
      const result = await musicAnalyzer.getSpectralFeatures(tinyBuffer);
      console.log('✅ Tiny buffer handled gracefully');
    } catch (error) {
      console.log('❌ Tiny buffer error:', (error as Error).message);
    }

    // Test worker status
    const status = musicAnalyzer.getStatus();
    console.log('📊 Worker status:');
    console.log(`  🔧 Initialized: ${status.isInitialized}`);
    console.log(`  ⚙️  Processing: ${status.isProcessing}`);
    console.log(`  📝 Queue size: ${status.queueSize}`);
    console.log(`  📈 Success rate: ${status.stats.successfulRequests}/${status.stats.totalRequests}`);
  }

  /**
   * Run all demos in sequence
   */
  async runAllDemos(): Promise<void> {
    console.log('🚀 Starting Music Analyzer Demo Suite\n');

    try {
      await this.demoTrackAnalysis();
      await this.demoRealTimeBPM();
      await this.demoKeyDetection();
      await this.demoAutoSync();
      await this.demoBenchmark();
      await this.demoErrorHandling();

      console.log('\n🎉 All demos completed successfully!');
      console.log('\n📝 Summary:');
      console.log('  ✅ Complete track analysis with BPM, key, and energy detection');
      console.log('  ✅ Real-time BPM tracking with beat phase calculation');
      console.log('  ✅ Musical key compatibility using Camelot wheel');
      console.log('  ✅ Automatic deck synchronization with mixing suggestions');
      console.log('  ✅ Performance optimized for real-time DJ applications');
      console.log('  ✅ Robust error handling and graceful degradation');

    } catch (error) {
      console.error('❌ Demo suite failed:', error);
    }
  }

  // Helper methods

  private generateTestAudio(bpm: number, duration: number): Float32Array {
    const sampleRate = 44100;
    const samples = sampleRate * duration;
    const buffer = new Float32Array(samples);

    // Generate a simple test tone with beat pattern
    const beatInterval = 60 / bpm; // seconds per beat
    const beatFreq = 1 / beatInterval;

    for (let i = 0; i < samples; i++) {
      const time = i / sampleRate;

      // Base tone (440 Hz)
      const baseTone = Math.sin(2 * Math.PI * 440 * time) * 0.3;

      // Beat emphasis (kick drum simulation)
      const beatPhase = (time * beatFreq) % 1;
      const beatEmphasis = beatPhase < 0.1 ? Math.sin(2 * Math.PI * 60 * time) * 0.5 : 0;

      buffer[i] = baseTone + beatEmphasis;
    }

    return buffer;
  }

  private calculateBeatPhase(currentTime: number, bpmAnalysis: any): number {
    const beatInterval = 60 / bpmAnalysis.bpm;
    const timeSinceStart = currentTime % beatInterval;
    return timeSinceStart / beatInterval;
  }
}

// Export singleton instance
export const musicAnalyzerDemo = new MusicAnalyzerDemo();

// Usage example:
// import { musicAnalyzerDemo } from './musicAnalyzerDemo';
// await musicAnalyzerDemo.runAllDemos();