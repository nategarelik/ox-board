// Simple test to verify Essentia.js is working
const { musicAnalyzer } = require("./app/lib/audio/musicAnalyzerClient");

async function testEssentia() {
  console.log("Testing Essentia.js integration...\n");

  // Test 1: Check if music analyzer is initialized
  const status = musicAnalyzer.getStatus();
  console.log("Music Analyzer Status:");
  console.log("- Initialized:", status.isInitialized);
  console.log("- Processing:", status.isProcessing);
  console.log("- Queue Size:", status.queueSize);

  // Test 2: Check static methods
  console.log("\nTesting static methods:");
  const isCompatible = musicAnalyzer.constructor.isCompatibleKey(
    "C major",
    "G major",
  );
  console.log("- C major → G major compatibility:", isCompatible);

  const bpmMatch = musicAnalyzer.constructor.getBPMMatchPercentage(128, 126);
  console.log("- BPM match (128 vs 126):", (bpmMatch * 100).toFixed(1) + "%");

  // Test 3: Create test audio and analyze
  console.log("\nTesting audio analysis:");
  const sampleRate = 44100;
  const duration = 2; // 2 seconds
  const samples = sampleRate * duration;
  const testAudio = new Float32Array(samples);

  // Generate simple test tone
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    testAudio[i] = Math.sin(2 * Math.PI * 440 * t) * 0.5; // 440 Hz tone
  }

  try {
    // Test BPM extraction
    console.log("- Extracting BPM...");
    const bpmResult = await musicAnalyzer.extractBPM(testAudio);
    console.log("  BPM:", bpmResult.bpm);
    console.log("  Confidence:", (bpmResult.confidence * 100).toFixed(1) + "%");

    // Test key detection
    console.log("- Detecting key...");
    const keyResult = await musicAnalyzer.detectKey(testAudio);
    console.log("  Key:", keyResult.key);
    console.log("  Scale:", keyResult.scale);

    console.log("\n✅ Essentia.js is working properly!");
  } catch (error) {
    console.error("\n❌ Error during analysis:", error.message);
    console.log("\nThis might mean Essentia.js is not fully initialized yet.");
  }
}

testEssentia().catch(console.error);
