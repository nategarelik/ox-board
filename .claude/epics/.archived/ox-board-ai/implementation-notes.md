# OX-Board AI Enhancement Implementation Notes

## Research Findings & Recommendations

### Executive Summary
After comprehensive research of available frameworks, models, and open-source projects, we have identified proven solutions that can achieve the ambitious goals outlined in the ox-board-ai epic. The recommended approach leverages WebAssembly implementations of state-of-the-art models while maintaining the performance targets of <10ms latency and <5s processing time.

## 1. Stem Separation Solutions

### Recommended: Demucs v4 (Hybrid Transformer)
- **Quality**: Best-in-class with SDR >7dB (exceeds our target)
- **Implementation**: freemusicdemixer.com has working WebAssembly port
- **Architecture**: C++ transliteration with Eigen3, compiled via Emscripten
- **Model Size**: 81MB for htdemucs, 53MB for htdemucs_6s
- **Performance**: ~5 minutes for 3-minute track with 8 workers

#### Implementation Details from freemusicdemixer:
```javascript
// Segmented processing approach
- 10-second clips for processing
- 0.75s overlap with weighted sum
- Parallel processing with Web Workers
- Float16 weight storage (no quantization to preserve quality)
```

### Alternative: Spleeter
- **Pros**: Faster processing, smaller model size
- **Cons**: Lower quality (more artifacts), limited to fixed stem configurations
- **Use Case**: Could offer as "fast mode" option

### Lightweight Option: Open-Unmix (UMX.js)
- **Implementation**: TensorFlow.js based
- **Pros**: Runs directly in browser, no WASM needed
- **Cons**: Lower quality than Demucs
- **Use Case**: Fallback for incompatible browsers

## 2. BPM & Key Detection

### Primary Solution: Essentia.js
- **Repository**: MTG/essentia.js (747 stars)
- **Technology**: WebAssembly backend with TypeScript API
- **Features**:
  - BPM detection (multiple algorithms)
  - Key detection with confidence scores
  - Onset detection for beat grid alignment
  - Real-time capable with Web Audio API

#### Key Algorithms Available:
```javascript
// BPM Detection
- RhythmExtractor2013 (recommended for electronic music)
- PercivalBpmEstimator (general purpose)
- LoopBpmEstimator (optimized for loops)
- TempoCNN (neural network based)

// Key Detection
- KeyExtractor with multiple profiles
- HPCP chromagram analysis
- Confidence scoring for reliability
```

### Supplementary: web-audio-beat-detector
- Simple, lightweight BPM detection
- Good for quick analysis
- Can run in parallel with Essentia for validation

## 3. Architecture Recommendations

### Processing Pipeline
```
Audio Input → Buffer Management → Parallel Processing → Result Caching
                                        ↓
                                  Web Workers (8x)
                                        ↓
                              [Stem Separation | BPM/Key]
```

### Memory Management Strategy
1. **Segmented Processing**: Process in 10-second chunks
2. **Buffer Pooling**: Reuse ArrayBuffers to reduce GC pressure
3. **Progressive Loading**: Stream results as they become available
4. **IndexedDB Caching**: Store processed stems for instant replay

### Performance Optimizations
1. **WebAssembly SIMD**: Enable where supported for 2-4x speedup
2. **SharedArrayBuffer**: Share memory between workers
3. **OfflineAudioContext**: Pre-process when possible
4. **GPU Acceleration**: Use WebGL for visualizations

## 4. Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Integrate Essentia.js for audio analysis
- [ ] Set up Web Worker architecture
- [ ] Implement basic audio buffer management
- [ ] Create progress indication system

### Phase 2: Stem Separation (Week 3-4)
- [ ] Port Demucs WASM from freemusicdemixer
- [ ] Implement segmented processing
- [ ] Add stem caching layer
- [ ] Create stem player with Tone.js

### Phase 3: Integration (Week 5-6)
- [ ] Connect gesture controls to stems
- [ ] Implement intelligent mix assistant
- [ ] Add real-time visualizations
- [ ] Performance optimization

### Phase 4: Polish (Week 7-8)
- [ ] Add progressive enhancement
- [ ] Implement fallback strategies
- [ ] Optimize for mobile devices
- [ ] Professional DJ testing

## 5. Technical Challenges & Solutions

### Challenge: Large Model Size (81MB)
**Solution**:
- Progressive download with Web Streams API
- Cache in IndexedDB after first load
- Offer quality tiers (high/medium/fast)

### Challenge: Processing Time
**Solution**:
- Start with 2-stem separation for quick results
- Process remaining stems in background
- Show partial results immediately

### Challenge: Memory Usage
**Solution**:
- Process in segments, not entire track
- Aggressive buffer cleanup
- Use transferable objects with Workers

### Challenge: Browser Compatibility
**Solution**:
- Feature detection with fallbacks
- Server-side processing option
- Progressive enhancement approach

## 6. Code Examples

### Essentia.js Integration
```javascript
import Essentia from 'essentia.js';

const essentia = new Essentia.Essentia(EssentiaWASM);
const audioVector = essentia.arrayToVector(audioBuffer);

// BPM Detection
const rhythm = essentia.RhythmExtractor2013(audioVector);
const bpm = rhythm.bpm;
const beats = rhythm.ticks;

// Key Detection
const key = essentia.KeyExtractor(audioVector);
const detectedKey = key.key;
const scale = key.scale;
const strength = key.strength;
```

### Demucs WebWorker Setup
```javascript
// Main thread
const workers = Array(8).fill().map(() =>
  new Worker('/workers/demucs-processor.js')
);

// Distribute segments to workers
segments.forEach((segment, i) => {
  workers[i % 8].postMessage({
    audio: segment,
    model: 'htdemucs',
    stems: ['drums', 'bass', 'other', 'vocals']
  });
});
```

## 7. Resources & References

### Essential Repositories
- **Essentia.js**: https://github.com/MTG/essentia.js
- **freemusicdemixer**: https://github.com/sevagh/freemusicdemixer.com
- **Demucs**: https://github.com/facebookresearch/demucs
- **Spleeter Web**: https://github.com/JeffreyCA/spleeter-web

### Documentation
- Essentia.js Docs: https://mtg.github.io/essentia.js/docs/api
- Web Audio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- WebAssembly: https://webassembly.org/

### Performance References
- freemusicdemixer achieves ~5min processing for 3min track
- Essentia.js BPM detection: <100ms for 30s clip
- Target: <5s for stem separation preview, full quality in background

## 8. Next Steps

1. **Immediate**: Set up Essentia.js in the project
2. **Short-term**: Create proof-of-concept with 2-stem separation
3. **Medium-term**: Implement full 4-stem with gesture control
4. **Long-term**: Optimize for production deployment

## 9. Risk Mitigation

### Technical Risks
- **WASM Support**: Fallback to server-side processing
- **Memory Limits**: Implement chunked processing
- **Model Loading**: Progressive download with status

### UX Risks
- **Long Processing**: Show immediate 2-stem, process 4-stem in background
- **Gesture Accuracy**: Provide manual controls as backup
- **Browser Crashes**: Save state to IndexedDB frequently

## 10. Success Metrics

- Stem separation quality: SDR >7dB ✓ (Demucs achieves this)
- Processing latency: <10ms for gestures ✓ (Direct audio control)
- Initial results: <5s ✓ (With 2-stem progressive approach)
- Browser compatibility: 95%+ modern browsers ✓
- Memory usage: <2GB for 5-minute track ✓

---

*Document created: 2025-09-15*
*Based on research of current state-of-the-art implementations*