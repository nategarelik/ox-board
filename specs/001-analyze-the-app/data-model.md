# Data Model: App Analysis and Deployment Readiness

**Generated**: 2025-09-24
**Feature**: 001-analyze-the-app

## Entity Definitions

### BugReport

Represents a detected issue in the codebase that needs resolution.

**Fields**:

- `id`: string (unique identifier)
- `severity`: enum ['critical', 'high', 'medium', 'low']
- `category`: enum ['type-error', 'lint-violation', 'console-log', 'runtime-error', 'performance']
- `file`: string (absolute file path)
- `line`: number (line number in file)
- `column`: number (optional, column position)
- `message`: string (error description)
- `rule`: string (optional, ESLint rule or TypeScript error code)
- `fixAvailable`: boolean (can be auto-fixed)
- `status`: enum ['detected', 'in-progress', 'fixed', 'verified']
- `detectedAt`: timestamp
- `fixedAt`: timestamp (optional)

**Validation Rules**:

- File must exist in codebase
- Line number must be positive integer
- Message must be non-empty
- Status transitions: detected → in-progress → fixed → verified

### TestResult

Outcome of automated or manual test execution.

**Fields**:

- `id`: string (unique identifier)
- `testName`: string (test description)
- `testType`: enum ['unit', 'integration', 'e2e', 'performance', 'manual']
- `status`: enum ['pending', 'running', 'passed', 'failed', 'skipped']
- `duration`: number (milliseconds)
- `errorMessage`: string (optional, if failed)
- `stackTrace`: string (optional, if failed)
- `coverage`: object (optional, coverage data)
  - `branches`: number (percentage)
  - `functions`: number (percentage)
  - `lines`: number (percentage)
  - `statements`: number (percentage)
- `executedAt`: timestamp

**Validation Rules**:

- Test name must be non-empty
- Duration must be non-negative
- Coverage percentages must be 0-100
- Error message required if status is 'failed'

### PerformanceMetric

Measured performance values from application testing.

**Fields**:

- `id`: string (unique identifier)
- `metricType`: enum ['fps', 'latency', 'memory', 'cpu', 'network']
- `component`: string (component or feature being measured)
- `value`: number (measured value)
- `unit`: string (measurement unit: 'ms', 'fps', 'MB', '%')
- `threshold`: number (acceptable threshold)
- `status`: enum ['pass', 'warning', 'fail']
- `measuredAt`: timestamp
- `conditions`: object (test conditions)
  - `browserType`: string
  - `deviceType`: string
  - `networkSpeed`: string

**Validation Rules**:

- Value must be non-negative
- Status determined by comparing value to threshold
- Component must reference existing application feature

### DeploymentCheck

Verification item for deployment readiness.

**Fields**:

- `id`: string (unique identifier)
- `checkName`: string (verification item name)
- `category`: enum ['build', 'test', 'lint', 'type-check', 'performance', 'security']
- `required`: boolean (blocking for deployment)
- `status`: enum ['pending', 'checking', 'passed', 'failed']
- `message`: string (check result message)
- `command`: string (optional, command to run)
- `expectedOutput`: string (optional, expected result)
- `actualOutput`: string (optional, actual result)
- `checkedAt`: timestamp

**Validation Rules**:

- Required checks must pass for deployment
- Command must be valid npm script or shell command
- Status transitions: pending → checking → passed/failed

### ChromeDevToolsSession

Browser testing session using Chrome DevTools.

**Fields**:

- `id`: string (unique identifier)
- `sessionType`: enum ['console', 'network', 'performance', 'interaction']
- `url`: string (page URL being tested)
- `startTime`: timestamp
- `endTime`: timestamp (optional)
- `findings`: array of objects
  - `type`: enum ['error', 'warning', 'info']
  - `message`: string
  - `source`: string (file/line reference)
  - `timestamp`: timestamp
- `screenshots`: array of strings (file paths)
- `status`: enum ['active', 'completed', 'failed']

**Validation Rules**:

- URL must be valid HTTP/HTTPS
- End time must be after start time
- At least one finding or screenshot required for completed session

## Relationships

### BugReport → TestResult

- One bug can have multiple test results (verification tests)
- Test failure can generate bug reports

### PerformanceMetric → DeploymentCheck

- Performance metrics feed into deployment checks
- Failed metrics block deployment if check is required

### ChromeDevToolsSession → BugReport

- DevTools findings generate bug reports
- Console errors map to runtime-error bugs

### DeploymentCheck → TestResult

- Deployment checks aggregate test results
- All required tests must pass for check to pass

## State Transitions

### Bug Lifecycle

```
detected → in-progress → fixed → verified
         ↓
    (reopened if verification fails)
```

### Test Execution

```
pending → running → passed/failed/skipped
                 ↓
           (can be re-run)
```

### Deployment Readiness

```
pending → checking → passed → deployed
                  ↓
              failed → fixing → checking
```

## Aggregations

### Overall Health Score

```typescript
interface HealthScore {
  bugCount: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  testCoverage: {
    overall: number;
    passing: number;
    failing: number;
  };
  performance: {
    fps: number;
    audioLatency: number;
    gestureLatency: number;
  };
  deploymentReady: boolean;
}
```

### Bug Fix Progress

```typescript
interface BugFixProgress {
  total: number;
  fixed: number;
  verified: number;
  remaining: number;
  percentComplete: number;
}
```

## Data Storage

All entities are ephemeral during the analysis and fix process:

- Stored in memory during execution
- Exported to JSON for reporting
- Not persisted to database
- Results saved to `specs/001-analyze-the-app/results/`

## Access Patterns

1. **Bug Detection**: Scan codebase → Create BugReports
2. **Test Execution**: Run tests → Create TestResults → Update BugReports
3. **Performance Testing**: Measure metrics → Create PerformanceMetrics
4. **Deployment Validation**: Check all entities → Create DeploymentChecks
5. **Progress Tracking**: Aggregate all entities → Generate reports
