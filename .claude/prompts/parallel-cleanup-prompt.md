# Parallel Cleanup Prompt for Agent Instance

## Context

OX Board v0.9.0-pre-mvp has just completed Phase 1 core tracks (A, B, C):

- **Track A** (commit `583b76b`): Audio integration with DeckManager
- **Track B** (commit `e39ab7a`): File loading with drag-and-drop
- **Track C** (commit `54edf7e`): EQ-based frequency controls

**Current State**:

- 337/465 tests passing (72.5%)
- 127 tests failing (mostly mock infrastructure issues)
- Mock data throughout codebase needs removal

## Your Mission

Execute **Phase 1 Cleanup** (Tasks 2.1 + 2.2) in parallel with the main agent working on **Phase 2 Backend Integration**.

### Task 2.1: Fix Test Failures (Priority: P1)

**Target**: Achieve 90%+ test pass rate (420+ tests passing)

**Test Failure Categories** (from `.claude/state/artifacts/test-failure-analysis.md`):

1. **Essentia.js Mock Issues** (100+ failures, P2 priority)
   - Missing algorithm mocks in `tests/__mocks__/essentia.js.ts`
   - Algorithms needed: RhythmExtractor2013, KeyExtractor, BPMHistogram, etc.
   - Fix: Add comprehensive Essentia mock stubs

2. **FeedbackDelay Constructor Missing** (43 failures, P1 priority, 30min fix)
   - Location: `tests/__mocks__/toneMock.ts`
   - Issue: Missing `FeedbackDelay` class export
   - Fix: Add `FeedbackDelay: jest.fn().mockImplementation(() => ({ ... }))`

3. **GestureFeedback Infinite Render Loop** (24 failures, P1 priority)
   - Location: `tests/unit/components/GestureFeedback.test.tsx`
   - Issue: Component re-renders infinitely in test environment
   - Fix: Review useEffect dependencies, add proper mocks for animation frame

4. **Minor Mock Issues** (58 failures, P2 priority)
   - Various missing methods in Tone.js mocks
   - Missing utility function mocks
   - Fix incrementally

**Execution Order**:

1. Start with **FeedbackDelay** (quick win, 30min, 43 tests fixed)
2. Then **GestureFeedback** (24 tests fixed)
3. Then **Essentia.js** (100+ tests, may take 1-2 hours)
4. Finally **Minor issues** (incremental)

**Success Criteria**:

- ✅ 420+ tests passing (90%+ pass rate)
- ✅ No infinite loops in test execution
- ✅ All Tone.js mock methods implemented
- ✅ Essentia.js fully mocked

---

### Task 2.2: Remove Mock Data Phase 1 (Priority: P1)

**Target**: Replace presentational mocks with real implementations

**Mock Files to Address**:

1. **`app/lib/data/defaultTrack.ts`**
   - Issue: `createMockWaveform()` generates fake waveform data
   - Fix: Extract real waveform from AudioBuffer using Web Audio AnalyserNode
   - New utility: `app/lib/audio/waveformExtractor.ts`

2. **`app/lib/audio/stemAnalyzer.ts`**
   - Issue: All analysis functions return mock data
   - Fix: Integrate with `MusicAnalyzerClient` for real analysis
   - Use Essentia.js for spectral features

3. **`app/lib/cache/smartCache.ts`**
   - Issue: `generateMockStemData()` creates fake stem data
   - Fix: Remove mock generator, use real backend stem data (Phase 2)
   - For now: Add TODO comments, don't break existing code

**Implementation Strategy**:

**Step 1**: Create `waveformExtractor.ts`

```typescript
// app/lib/audio/waveformExtractor.ts
import type { WaveformData } from "@/types/stem-player";

export async function extractWaveform(
  audioBuffer: AudioBuffer,
  options?: { samples?: number },
): Promise<WaveformData> {
  const samples = options?.samples || 1000;
  const channelData = audioBuffer.getChannelData(0); // Mono or left channel
  const blockSize = Math.floor(channelData.length / samples);
  const waveform: number[] = [];

  for (let i = 0; i < samples; i++) {
    const start = i * blockSize;
    const end = start + blockSize;
    let sum = 0;

    // Calculate RMS for this block
    for (let j = start; j < end; j++) {
      sum += channelData[j] * channelData[j];
    }

    waveform.push(Math.sqrt(sum / blockSize));
  }

  return { data: waveform, sampleRate: audioBuffer.sampleRate };
}
```

**Step 2**: Replace mock in `defaultTrack.ts`

- Remove `createMockWaveform()`
- Update imports to use `extractWaveform()`
- Update usage sites to extract waveform from loaded audio

**Step 3**: Update `stemAnalyzer.ts`

- Remove mock functions: `analyzeStemQuality`, `detectStemIssues`, etc.
- Replace with calls to `MusicAnalyzerClient`
- Use real Essentia.js analysis

**Step 4**: Document `smartCache.ts` for Phase 2

- Add TODO comments explaining backend dependency
- Don't break existing code
- Will be replaced when backend integration complete

**Success Criteria**:

- ✅ Real waveform extraction working
- ✅ No `createMockWaveform()` calls remaining
- ✅ `stemAnalyzer.ts` uses real analysis
- ✅ No visual regressions in UI

---

## Execution Guidelines

### Working in Parallel

- **DO NOT** modify files the main agent is working on
- **Safe to modify**: Test files, mock files, `defaultTrack.ts`, `stemAnalyzer.ts`
- **Coordinate**: If you need to touch shared files, use git stash/branch

### Quality Standards

- All tests MUST pass before marking Task 2.1 complete
- No breaking changes to existing functionality
- Add comprehensive JSDoc comments
- Use TypeScript strict mode

### Git Workflow

1. Create branch: `git checkout -b cleanup/phase1-test-mock-removal`
2. Commit incrementally:
   - `fix: add FeedbackDelay to Tone.js mock`
   - `fix: resolve GestureFeedback infinite render loop`
   - `feat: add real waveform extraction utility`
   - `refactor: remove mock waveform generation`
3. Final commit: `chore: Phase 1 cleanup complete - 90%+ tests passing`

### Communication

- After each major milestone (FeedbackDelay, GestureFeedback, Essentia), provide status
- Report any blockers immediately
- Estimate: 2-4 hours total for both tasks

---

## Files Reference

### Test Files

- `tests/__mocks__/toneMock.ts` - Tone.js mock (needs FeedbackDelay)
- `tests/__mocks__/essentia.js.ts` - Essentia mock (needs algorithms)
- `tests/unit/components/GestureFeedback.test.tsx` - Infinite loop issue

### Mock Data Files

- `app/lib/data/defaultTrack.ts` - Mock waveform generator
- `app/lib/audio/stemAnalyzer.ts` - Mock analysis functions
- `app/lib/cache/smartCache.ts` - Mock stem data generator

### Analysis Research

- `.claude/state/artifacts/test-failure-analysis.md` - Complete failure breakdown

---

## Expected Output

### Task 2.1 Complete

```
✅ Test Suite Status:
- Total: 465 tests
- Passing: 425 (91.4%)
- Failing: 40 (8.6%)
- FeedbackDelay: FIXED (43 tests)
- GestureFeedback: FIXED (24 tests)
- Essentia.js: FIXED (100+ tests)
- Minor issues: FIXED (58 tests)
```

### Task 2.2 Complete

```
✅ Mock Removal Status:
- createMockWaveform(): REMOVED
- Real waveform extraction: IMPLEMENTED
- stemAnalyzer.ts: USING REAL ANALYSIS
- smartCache.ts: DOCUMENTED FOR PHASE 2
- No visual regressions
- All existing features working
```

---

## Important Notes

- **NO QUALITY GATE STOPS**: Execute continuously without waiting for approval
- **Use tools extensively**: Read, Grep, Glob, Edit, Bash for efficiency
- **Test frequently**: Run `npm test` after each fix to verify
- **Build check**: Run `npm run type-check && npm run build` before final commit
- **Document changes**: Update relevant docs if needed

---

## Start Command

When you receive this prompt, start immediately with:

1. Read test failure analysis: `.claude/state/artifacts/test-failure-analysis.md`
2. Fix FeedbackDelay mock: `tests/__mocks__/toneMock.ts`
3. Run tests: `npm test -- --testNamePattern="FeedbackDelay"`
4. Continue with GestureFeedback fix
5. Proceed through remaining tasks

**GO!** 🚀
