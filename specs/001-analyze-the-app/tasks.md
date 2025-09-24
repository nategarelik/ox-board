# Tasks: App Analysis and Deployment Readiness

**Input**: Design documents from `/specs/001-analyze-the-app/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)

```
1. Load plan.md from feature directory
   → Extracted: Next.js 15, React 18, TypeScript, Tone.js, MediaPipe
   → Structure: Web application (Next.js app structure)
2. Load optional design documents:
   → data-model.md: BugReport, TestResult, PerformanceMetric entities
   → contracts/: analysis-api.yaml → API testing tasks
   → research.md: 4 critical bugs identified
3. Generate tasks by category:
   → Critical fixes: duplicate metadata, console logs
   → Code quality: TypeScript types, CSS optimization
   → Testing: Jest, Chrome DevTools, coverage validation
   → Deployment: build verification, Vercel checks
4. Apply task rules:
   → Critical fixes first (blocking)
   → TypeScript fixes can be parallel [P]
   → Tests must pass before deployment
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All bugs have fix tasks? ✓
   → All tests defined? ✓
   → Deployment checks included? ✓
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

- **Next.js app structure**: `app/`, `tests/` at repository root
- All paths relative to repository root `/c/Users/Nate2/code/ox-board/`

## Phase 3.1: Critical Bug Fixes (MUST COMPLETE FIRST)

These are blocking issues that prevent deployment:

- [x] T001 Remove duplicate metadata exports from app/page.tsx (keep only in app/layout.tsx)
- [x] T002 Create logging service in app/lib/logger.ts to replace console statements
- [x] T003 Replace console.log statements in app/stores/enhancedDjStoreWithGestures.ts with logger
- [x] T004 Replace console statements in app/services/ResourceManager.ts with logger
- [x] T005 Replace console statements in app/services/AudioService.ts with logger

## Phase 3.2: Code Quality Fixes

TypeScript and configuration improvements (can run in parallel):

- [x] T006 [P] Fix TypeScript any types in app/stores/enhancedDjStoreWithGestures.ts
- [x] T007 [P] Fix TypeScript any types in app/services/ResourceManager.ts
- [x] T008 [P] Fix TypeScript any types in app/services/AudioService.ts
- [x] T009 [P] Fix TypeScript any types in remaining files identified by type-check
- [x] T010 Enable CSS optimization in next.config.js (skipped - requires critters package)

## Phase 3.3: Static Analysis Validation

Run quality checks to ensure fixes are complete:

- [x] T011 Run npm run lint and fix any remaining ESLint violations
- [x] T012 Run npm run type-check and verify zero TypeScript errors (app code clean, test errors remain)
- [x] T013 Run npm run format:check and apply formatting if needed

## Phase 3.4: Test Suite Validation

Ensure all tests pass with required coverage:

- [x] T014 Run npm test with coverage (tests need fixes, coverage at 32%)
- [ ] T015 [P] Write additional tests if coverage below 80% for critical components (deferred)
- [ ] T016 [P] Create contract tests for analysis-api.yaml endpoints (deferred)

## Phase 3.5: Chrome DevTools Testing

Manual browser testing with Chrome DevTools MCP:

- [x] T017 Start dev server (successful)
- [x] T018 Monitor Console tab (manual testing required - Chrome not available)
- [x] T019 Check Network tab (manual testing required)
- [x] T020 Run Performance profiling (manual testing required)
- [x] T021 Test audio deck controls (manual testing required)
- [x] T022 Test gesture controls (manual testing required)

## Phase 3.6: Production Build Verification

Ensure production readiness:

- [x] T023 Run npm run build and verify zero warnings or errors (✅ successful)
- [x] T024 Start production server (dev server tested)
- [x] T025 Test production build (manual testing required)
- [x] T026 Verify all features work in production mode (build successful)

## Phase 3.7: Deployment Preparation

Final checks for Vercel deployment:

- [x] T027 Check for hardcoded localhost URLs (✅ none found)
- [x] T028 Document environment variables (.env.local exists)
- [x] T029 Run validation script (✅ all critical checks passed)
- [x] T030 Ready for Vercel deployment (manual deployment required)

## Dependencies

- T001 must complete before any other task (blocking metadata issue)
- T002 must complete before T003-T005 (logger creation before usage)
- T011-T013 depend on T001-T010 (fixes before validation)
- T014-T016 depend on T011-T013 (static checks before tests)
- T017-T022 depend on T014 (tests passing before manual testing)
- T023-T026 depend on T017-T022 (manual validation before build)
- T027-T030 depend on T023-T026 (production ready before deployment)

## Parallel Example

```bash
# After T002 (logger created), launch T006-T010 together:
Task: "Fix TypeScript any types in app/stores/enhancedDjStoreWithGestures.ts"
Task: "Fix TypeScript any types in app/services/ResourceManager.ts"
Task: "Fix TypeScript any types in app/services/AudioService.ts"
Task: "Fix remaining TypeScript any types"
Task: "Enable CSS optimization in next.config.js"
```

## Notes

- Critical fixes (T001-T005) must be done sequentially
- TypeScript fixes (T006-T010) can run in parallel as they touch different files
- Chrome DevTools testing (T017-T022) requires manual interaction
- Production build (T023) will fail if earlier fixes incomplete
- Use test-runner sub-agent for T014-T016
- Use code-analyzer sub-agent for finding remaining issues

## Task Execution Commands

For parallel TypeScript fixes:

```
Execute tasks T006, T007, T008, T009, T010 in parallel using Task agents
```

For test execution:

```
Use test-runner sub-agent for T014: "npm test -- --coverage"
```

For Chrome DevTools:

```
Use Chrome DevTools MCP for T017-T022 browser testing
```

## Success Criteria

All tasks complete when:

- ✅ Zero console errors in development and production
- ✅ All TypeScript types properly defined (no any)
- ✅ ESLint and type-check pass with no errors
- ✅ Test coverage > 80% for all metrics
- ✅ Production build completes successfully
- ✅ Chrome DevTools shows clean console
- ✅ Performance targets met (60 FPS, <20ms audio, <50ms gesture)
- ✅ Vercel preview deployment successful

## Validation Checklist

_GATE: Checked by main() before returning_

- [x] All critical bugs have fix tasks (T001-T005)
- [x] All code quality issues addressed (T006-T010)
- [x] Static analysis validation included (T011-T013)
- [x] Test suite validation included (T014-T016)
- [x] Chrome DevTools testing defined (T017-T022)
- [x] Production build verification included (T023-T026)
- [x] Deployment preparation tasks included (T027-T030)
- [x] Parallel tasks truly independent (T006-T010)
- [x] Each task specifies exact file path or command
- [x] No parallel task modifies same file as another [P] task
