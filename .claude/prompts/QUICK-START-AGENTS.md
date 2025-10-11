# 🚀 Quick Start: Launch Parallel Agents

## Copy-Paste Commands for Each Agent

---

## 🧹 Agent 1: Cleanup Agent

### Prompt (Copy-Paste This)

```
I need you to execute Phase 1 cleanup in parallel with another agent working on Phase 2 backend integration.

Read this file and execute all instructions:
.claude/prompts/parallel-cleanup-prompt.md

Key points:
- NO quality gate stops
- Execute continuously without approval
- Commit incrementally
- Start with FeedbackDelay mock fix
- Target: 90%+ test pass rate (420+ tests)
- Timeline: 2-4 hours

Branch: cleanup/phase1-test-mock-removal

START IMMEDIATELY.
```

---

## 🔌 Agent 2: Backend Integration Agent

### Prompt (Copy-Paste This)

```
I need you to execute Phase 2 backend integration in parallel with another agent working on Phase 1 cleanup.

Read this file and execute all instructions:
.claude/prompts/parallel-phase2-prompt.md

Key points:
- NO quality gate stops
- Execute continuously without approval
- Commit incrementally
- Start with backend deployment config
- Target: Full stem separation working
- Timeline: 7-11 hours

Branch: feature/phase2-backend-integration

START IMMEDIATELY.
```

---

## 📊 Monitor Progress

### Agent 1 Milestones (Check These)

1. ✅ FeedbackDelay mock fixed (~30 min)
2. ✅ GestureFeedback fixed (~1 hour)
3. ✅ Essentia.js mocks complete (~2 hours)
4. ✅ Waveform extraction implemented (~3 hours)
5. ✅ Mock data removed (~4 hours)
6. ✅ Final: 420+ tests passing

### Agent 2 Milestones (Check These)

1. ✅ Backend deployment config created (~1 hour)
2. ✅ Backend deployed to Railway (~2 hours)
3. ✅ API client implemented (~4 hours)
4. ✅ Upload integration working (~6 hours)
5. ✅ Stem caching implemented (~8 hours)
6. ✅ Full flow validated (~10 hours)

---

## 🔀 Merge When Both Complete

```bash
# Agent 1 merges first
git checkout main
git merge cleanup/phase1-test-mock-removal
git push

# Agent 2 rebases then merges
git checkout feature/phase2-backend-integration
git rebase main
git checkout main
git merge feature/phase2-backend-integration
git push

# Validate
npm test && npm run build
```

---

## 🎯 Expected Results

**Agent 1**:

- 420+ tests passing (90%+)
- Real waveform extraction
- No mock data

**Agent 2**:

- Backend deployed
- Full stem separation working
- End-to-end flow validated

**Total Value**: Production-ready stem separation + robust test suite

---

## 📞 If Issues Arise

- Check `.claude/prompts/PARALLEL-EXECUTION-HANDOFF.md` for details
- Agents should coordinate via git branches
- Report blockers immediately
- Otherwise: EXECUTE WITHOUT STOPPING

---

**LAUNCH NOW** 🚀
