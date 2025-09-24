<!--
Sync Impact Report
Version Change: 0.0.0 → 1.0.0 (Initial ratification)
Modified Principles: N/A (first version)
Added Sections: All sections (initial creation)
Removed Sections: N/A
Templates Requiring Updates:
  ✅ plan-template.md (Constitution Check aligns)
  ✅ spec-template.md (Requirements structure aligns)
  ✅ tasks-template.md (Task categorization reflects principles)
Follow-up TODOs:
  - Confirm ratification date with team
-->

# OX Board Constitution

## Core Principles

### I. Complete Implementation

Every feature MUST be fully implemented before proceeding. No partial implementations, no placeholder code, no "simplified for now" comments. If a feature cannot be completed, it should not be started.

### II. Test-First Development (NON-NEGOTIABLE)

TDD is mandatory for all code changes:

- Tests MUST be written before implementation
- Tests MUST fail initially (Red phase)
- Implementation follows to make tests pass (Green phase)
- Tests MUST be verbose for debugging purposes
- Tests MUST reflect real usage scenarios, not artificial passing conditions
- Every function requires corresponding test coverage

### III. Zero Code Duplication

Before creating any new function or component:

- MUST search existing codebase for similar functionality
- MUST reuse existing functions and constants
- MUST follow established naming patterns
- Dead code MUST be removed immediately upon discovery

### IV. Separation of Concerns

Each layer of the architecture MUST maintain clear boundaries:

- UI components handle only presentation logic
- State management remains in dedicated stores (Zustand)
- Business logic lives in services and libraries
- Audio processing stays isolated in dedicated modules
- Gesture recognition maintains its own processing pipeline
- No mixing of validation, data fetching, or business logic across layers

### V. Resource Management

All resources MUST be properly managed:

- Audio contexts must be initialized only on user interaction
- Event listeners MUST be removed when no longer needed
- Timeouts and intervals MUST be cleared
- Memory leaks from audio nodes MUST be prevented
- Worker threads MUST be properly terminated
- Camera streams MUST be released when not in use

### VI. Context Optimization

Development efficiency through intelligent agent usage:

- File-analyzer agent MUST be used for reading large files
- Code-analyzer agent MUST be used for code searches and bug tracing
- Test-runner agent MUST be used for all test execution
- Context usage MUST be minimized through proper agent delegation

### VII. Simplicity First

Start simple and evolve only when necessary:

- No over-engineering or unnecessary abstractions
- No enterprise patterns when simple functions suffice
- YAGNI (You Aren't Gonna Need It) principles apply
- Complexity MUST be justified and documented

## Performance Standards

### Audio Performance

- Audio latency MUST remain under 20ms
- Gesture-to-audio response MUST be under 50ms total
- No audio dropouts or glitches during normal operation

### Visual Performance

- UI MUST maintain 60fps during gesture tracking
- Gesture recognition pipeline MUST not block main thread
- Kalman filtering MUST smooth gesture inputs effectively

### Test Coverage

- Minimum 80% code coverage for branches, functions, lines, and statements
- Integration tests required for all inter-service communication
- Performance regression tests for critical paths

## Development Workflow

### Code Quality Gates

- ESLint MUST pass with no errors
- TypeScript strict mode MUST be enabled
- Prettier formatting MUST be applied
- All tests MUST pass before merge

### Error Handling Strategy

- Fail fast for critical configuration errors
- Log and continue for optional features
- Graceful degradation when services unavailable
- User-friendly error messages through error boundaries

### Documentation Requirements

- Public APIs MUST be documented
- Complex algorithms MUST include explanatory comments
- Architecture decisions MUST be recorded
- Breaking changes MUST be clearly communicated

## Governance

This constitution supersedes all other development practices and guidelines.

### Amendment Process

1. Proposed amendments MUST be documented with clear rationale
2. Breaking changes to principles require MAJOR version bump
3. New principles or sections require MINOR version bump
4. Clarifications and fixes require PATCH version bump
5. All amendments MUST include migration plan if applicable

### Compliance Verification

- All PRs MUST verify constitutional compliance
- Code reviews MUST check against these principles
- Violations MUST be justified or corrected before merge
- Use CLAUDE.md for runtime development guidance

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): Pending team confirmation | **Last Amended**: 2025-09-23
