# Self-Hosted Demucs Implementation Tasks

**Branch**: `003-self-hosted-demucs` | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Task Execution Strategy

This task breakdown follows a **TDD-first, dependency-aware, parallel execution strategy** designed to replace mock stem separation with production-ready self-hosted Demucs backend.

### Key Principles

- **[P]** markers indicate tasks that can run in parallel
- **Contract-first development**: Tests and contracts before implementation
- **Library-first architecture**: Standalone services with clear interfaces
- **80%+ test coverage** required for all components
- **Phase gates** ensure quality at integration points

### Execution Tracks

- **Track A**: Backend Infrastructure (Python/FastAPI/Demucs)
- **Track B**: Frontend Integration (React/TypeScript)
- **Track C**: API Migration (Replace Mock Endpoints)
- **Track D**: Testing Infrastructure (Quality Assurance)
- **Track E**: DevOps & Deployment (Infrastructure)

---

## Phase 0: Foundation & Setup (Week 1)

### Track A: Backend Infrastructure Setup

#### Task 1: Create Python Backend Project Structure [P]

**Complexity**: Low | **Priority**: P0 | **Duration**: 4 hours

Create comprehensive backend directory structure following spec architecture.

**Actions**:

- Create `/backend` root directory
- Set up core/, api/, services/, models/, utils/, tests/ subdirectories
- Initialize `__init__.py` files for all packages
- Create `requirements.txt` with all dependencies from spec lines 77-98
- Create `setup.py` for package installation
- Add `.gitignore` for Python-specific files

**Acceptance Criteria**:

- All directories match spec structure (lines 41-73)
- requirements.txt contains all 18+ dependencies
- Python package structure is importable
- Git ignores **pycache**, \*.pyc, venv/

**Dependencies**: None

**Testing**: Run `python -c "import backend.core"` successfully

---

#### Task 2: Implement Configuration Management [P]

**Complexity**: Medium | **Priority**: P0 | **Duration**: 6 hours

Create centralized configuration using Pydantic settings.

**Actions**:

- Implement `/backend/core/config.py` with Pydantic BaseSettings
- Support environment variables and config.yaml loading
- Define configuration classes: DemucsConfig, RedisConfig, APIConfig, YouTubeConfig
- Add validation for all config parameters
- Implement config loading from environment and YAML
- Create default config.yaml template in spec appendix format (lines 402-419)

**Acceptance Criteria**:

- All config from spec lines 402-431 supported
- Environment variables override config.yaml
- Invalid config raises clear validation errors
- Config is immutable after initialization
- Type hints for all config fields

**Dependencies**: Task 1

**Testing**: Unit tests for config validation, environment override, YAML loading

**Contract**: [data-model.md](./data-model.md) configuration requirements

---

#### Task 3: Implement Structured Logging System [P]

**Complexity**: Medium | **Priority**: P0 | **Duration**: 4 hours

Set up structured logging using structlog for observability.

**Actions**:

- Implement `/backend/core/logging.py` with structlog configuration
- Configure JSON output for production, pretty printing for development
- Add context processors for request IDs, timestamps, log levels
- Implement performance tracking helpers
- Add log filtering by level and component
- Create logging decorators for function timing

**Acceptance Criteria**:

- JSON structured logs in production mode
- Human-readable logs in development mode
- Request ID tracking across all operations
- Performance metrics integration
- Log level filtering works correctly

**Dependencies**: Task 2

**Testing**: Unit tests for log formatting, context injection, filtering

---

#### Task 4: Implement Custom Exception Hierarchy [P]

**Complexity**: Low | **Priority**: P0 | **Duration**: 3 hours

Create domain-specific exceptions for clear error handling.

**Actions**:

- Implement `/backend/core/exceptions.py` with base exception classes
- Define exceptions: DemucsProcessingError, YouTubeDownloadError, JobQueueError, ValidationError, AudioProcessingError
- Add error codes and HTTP status mappings
- Include detailed error context for debugging
- Create exception serialization for API responses

**Acceptance Criteria**:

- All exceptions inherit from base exception
- Error codes uniquely identify error types
- HTTP status codes properly mapped
- Error context includes helpful debugging info
- Serialization produces consistent JSON format

**Dependencies**: None

**Testing**: Unit tests for exception creation, serialization, HTTP mapping

---

### Track E: DevOps Infrastructure Setup

#### Task 5: Set Up Development Environment [P]

**Complexity**: Medium | **Priority**: P0 | **Duration**: 8 hours

Configure Docker containers and development infrastructure.

**Actions**:

- Create Dockerfile for Python backend (multi-stage build)
- Create docker-compose.yml with services: backend, redis, nginx
- Configure Redis for job queue (persistent storage)
- Set up shared volumes for models and temporary files
- Add health checks for all services
- Create development environment scripts (start.sh, stop.sh, logs.sh)
- Document GPU support configuration

**Acceptance Criteria**:

- `docker-compose up` starts all services successfully
- Redis persists data across restarts
- Shared volumes accessible from containers
- Health checks report service status correctly
- GPU passthrough documented and working (optional)
- Development scripts work on Linux/macOS/WSL

**Dependencies**: None

**Testing**: Integration test that services communicate, Redis stores data

**Reference**: Spec lines 271-294 deployment strategy

---

#### Task 6: Install Demucs Models [P]

**Complexity**: High | **Priority**: P0 | **Duration**: 6 hours

Download and configure Demucs models for production use.

**Actions**:

- Create `/models` directory structure
- Download htdemucs, htdemucs_ft, mdx_extra, mdx_extra_q models
- Verify model checksums and integrity
- Create model registry configuration
- Implement lazy model loading (load on first use)
- Add model validation on startup
- Document model storage requirements (2-3GB per model)

**Acceptance Criteria**:

- All 4 models downloaded and validated
- Model registry tracks available models
- Lazy loading reduces startup time
- Model validation detects corrupted files
- Storage requirements documented
- Models accessible from Docker container

**Dependencies**: Task 5

**Testing**: Unit test model loading, validation, registry lookup

**Reference**: Spec lines 109-114 model options

---

### Track D: Testing Infrastructure Setup

#### Task 7: Set Up Python Testing Framework [P]

**Complexity**: Medium | **Priority**: P0 | **Duration**: 6 hours

Configure pytest with fixtures and utilities for backend testing.

**Actions**:

- Configure pytest in `/backend/tests/`
- Create conftest.py with shared fixtures
- Implement test fixtures: mock Redis, mock Demucs, test audio files
- Set up pytest-asyncio for async test support
- Configure code coverage reporting (pytest-cov)
- Create test utilities in `/backend/tests/utils/`
- Add test audio file generators (silent, tones, noise)

**Acceptance Criteria**:

- pytest runs all tests successfully
- Async tests work with pytest-asyncio
- Coverage reports show 80%+ threshold
- Test fixtures provide isolated test environments
- Mock services don't require external dependencies
- Test audio files generated programmatically

**Dependencies**: Task 1

**Testing**: Run `pytest --cov=backend --cov-report=html` successfully

---

---

## Phase 1: Core Data Models & Contracts (Week 1-2)

### Track A: Backend Models

#### Task 8: Implement Job Model [P]

**Complexity**: Medium | **Priority**: P0 | **Duration**: 5 hours

Create Pydantic models for job lifecycle management.

**Actions**:

- Implement `/backend/models/job.py` with Job, JobResult, JobStatus
- Define all fields from data-model.md lines 8-21
- Add validation rules from data-model.md lines 27-33
- Implement state transition validation (lines 119-135)
- Create JobStatus enum (pending, processing, completed, failed)
- Add computed properties for progress tracking
- Implement serialization/deserialization methods

**Acceptance Criteria**:

- All fields from data model implemented
- Validation rules enforced
- State transitions validated (forward-only)
- UUID generation for job IDs
- Timestamps auto-managed
- JSON serialization works correctly

**Dependencies**: Task 2, Task 4

**Testing**: Unit tests for validation, state transitions, serialization

**Contract**: [data-model.md](./data-model.md) Job entity (lines 5-33)

---

#### Task 9: Implement Audio Processing Models [P]

**Complexity**: Medium | **Priority**: P0 | **Duration**: 5 hours

Create models for audio metadata and stem information.

**Actions**:

- Implement `/backend/models/audio.py` with StemFiles, StemInfo, QualityMetrics
- Define fields from data-model.md lines 52-104
- Add validation for audio formats and constraints
- Implement ProcessingMetrics model (lines 106-116)
- Create StemSeparationOptions with quality presets
- Add computed properties for human-readable sizes/durations
- Support CDN URL generation

**Acceptance Criteria**:

- All audio metadata fields present
- Format validation (wav, mp3, flac)
- Quality metrics scoring (0-1 range)
- Options validation per spec lines 82-93
- Size/duration human-readable formatting
- CDN URL placeholder support

**Dependencies**: Task 2, Task 4

**Testing**: Unit tests for validation, serialization, computed properties

**Contract**: [data-model.md](./data-model.md) Audio models (lines 34-116)

---

#### Task 10: Implement API Response Models [P]

**Complexity**: Low | **Priority**: P0 | **Duration**: 3 hours

Create standardized API response DTOs.

**Actions**:

- Implement `/backend/models/response.py` with StemifyResponse, JobStatusResponse, ErrorResponse
- Match API DTOs from data-model.md lines 158-188
- Add success/error response wrappers
- Implement pagination models for batch operations
- Create response serialization helpers
- Add OpenAPI schema annotations

**Acceptance Criteria**:

- All API responses have consistent structure
- Success/error responses clearly differentiated
- Pagination models support offset and cursor
- OpenAPI schemas auto-generated
- Response serialization uses ISO timestamps

**Dependencies**: Task 8, Task 9

**Testing**: Unit tests for response serialization, schema generation

**Contract**: [data-model.md](./data-model.md) API DTOs (lines 156-188)

---

### Track D: Contract Tests

#### Task 11: Create API Contract Tests (TDD) [P]

**Complexity**: Medium | **Priority**: P0 | **Duration**: 6 hours

Write failing contract tests for all API endpoints (TDD approach).

**Actions**:

- Create `/backend/tests/test_contracts.py`
- Write contract test for POST /api/stemify (file upload)
- Write contract test for POST /api/stemify (YouTube URL)
- Write contract test for GET /api/jobs/{id}
- Write contract test for DELETE /api/jobs/{id} (cancellation)
- Validate request/response schemas against OpenAPI spec
- Test error response formats (400, 404, 500)
- Add authentication header validation (future-proof)

**Acceptance Criteria**:

- All contract tests initially fail (no implementation yet)
- Request schema validation implemented
- Response schema validation implemented
- HTTP status codes tested
- Error response formats validated
- Tests document expected API behavior

**Dependencies**: Task 10

**Testing**: All tests fail with clear "Not Implemented" messages

**Contract**: Spec lines 163-175 API endpoints

---

---

## Phase 2: Core Services Implementation (Week 2-3)

### Track A: Backend Services (TDD Order)

#### Task 12: Implement File Utilities [P]

**Complexity**: Low | **Priority**: P0 | **Duration**: 4 hours

Create file system helpers with validation and cleanup.

**Actions**:

- Implement `/backend/utils/file_utils.py`
- Add file validation (size, format, existence)
- Create temporary directory management
- Implement safe file cleanup with retries
- Add file size formatting utilities
- Create secure filename sanitization
- Implement atomic file operations

**Acceptance Criteria**:

- File validation enforces 50MB limit
- Supported formats: mp3, wav, m4a, flac, ogg
- Temp directories auto-cleanup on exit
- Filename sanitization prevents directory traversal
- Atomic operations prevent partial writes
- All functions have comprehensive error handling

**Dependencies**: Task 3, Task 4

**Testing**: Unit tests for validation, cleanup, sanitization, edge cases

**Reference**: Spec lines 137-151, data-model.md lines 139-143

---

#### Task 13: Implement Audio Utilities [P]

**Complexity**: Medium | **Priority**: P0 | **Duration**: 6 hours

Create audio processing helpers using pydub and librosa.

**Actions**:

- Implement `/backend/utils/audio_utils.py`
- Add audio format conversion (to wav for Demucs)
- Implement duration validation (10-minute limit)
- Create audio normalization functions
- Add sample rate detection and conversion
- Implement audio metadata extraction
- Create waveform generation for visualization

**Acceptance Criteria**:

- Format conversion maintains audio quality
- Duration extraction accurate to milliseconds
- Normalization prevents clipping
- Metadata extraction works for all supported formats
- Waveform generation matches frontend expectations
- All operations handle corrupted files gracefully

**Dependencies**: Task 12

**Testing**: Unit tests with test audio files, integration test with real audio

**Reference**: Spec lines 129-143, data-model.md lines 66-75

---

#### Task 14: Implement Validation Utilities [P]

**Complexity**: Low | **Priority**: P0 | **Duration**: 3 hours

Create input validation helpers for requests.

**Actions**:

- Implement `/backend/utils/validation.py`
- Add YouTube URL validation (regex + yt-dlp check)
- Create file upload validation
- Implement rate limiting validation helpers
- Add IP address validation and sanitization
- Create request size validation
- Implement content type validation

**Acceptance Criteria**:

- YouTube URLs validated for correct format
- Invalid URLs rejected with helpful messages
- File uploads checked for malicious content
- Rate limit validation uses Redis counters
- IP validation handles IPv4 and IPv6
- All validators return clear error messages

**Dependencies**: Task 4

**Testing**: Unit tests with valid/invalid inputs, edge cases

**Reference**: Spec lines 239-244 security measures

---

#### Task 15: Implement Queue Service (Tests First) [P]

**Complexity**: High | **Priority**: P0 | **Duration**: 8 hours

Create Redis-based job queue with Celery integration.

**Actions**:

- **Write tests first**: `/backend/tests/test_services/test_queue.py`
- Test job enqueue/dequeue operations
- Test priority queue behavior
- Test job status updates
- Test concurrent job processing
- **Then implement**: `/backend/services/queue_service.py`
- Integrate with Celery for distributed processing
- Implement job priority handling
- Add job cancellation support
- Create job status update mechanisms
- Implement retry logic with exponential backoff

**Acceptance Criteria**:

- All tests pass after implementation
- Jobs queued in priority order
- Status updates propagate to Redis
- Concurrent processing handles 100+ jobs
- Cancellation stops in-progress jobs gracefully
- Failed jobs retry up to 3 times

**Dependencies**: Task 5, Task 8, Task 14

**Testing**: Unit tests (TDD), integration tests with Redis, load tests

**Contract**: Spec lines 147-161 job queue system

---

#### Task 16: Implement Demucs Service (Tests First)

**Complexity**: High | **Priority**: P0 | **Duration**: 12 hours

Core stem separation service with model management.

**Actions**:

- **Write tests first**: `/backend/tests/test_services/test_stem_separation.py`
- Test model loading and initialization
- Test stem separation with mock Demucs
- Test model selection logic
- Test error handling for corrupted audio
- Test progress tracking during separation
- **Then implement**: `/backend/services/stem_separation.py`
- Implement model lazy loading from Task 6
- Create stem separation wrapper for Demucs
- Add GPU/CPU fallback logic
- Implement progress callbacks for job updates
- Create output normalization and format conversion
- Add quality assessment integration

**Acceptance Criteria**:

- All tests pass after implementation
- Models load on-demand, not at startup
- Stem separation completes in <2 minutes for 4-minute tracks
- GPU acceleration works when available
- Progress updates every 5 seconds
- Output quality meets 80%+ threshold

**Dependencies**: Task 6, Task 13, Task 15

**Testing**: Unit tests (TDD), integration tests with real audio, performance benchmarks

**Contract**: Spec lines 102-125 Demucs integration

---

#### Task 17: Implement YouTube Download Service (Tests First)

**Complexity**: High | **Priority**: P0 | **Duration**: 10 hours

YouTube URL processing with yt-dlp integration.

**Actions**:

- **Write tests first**: `/backend/tests/test_services/test_youtube.py`
- Test URL validation
- Test download with mock yt-dlp
- Test format conversion after download
- Test duration validation (10-minute limit)
- Test error handling for unavailable videos
- **Then implement**: `/backend/services/youtube_service.py`
- Integrate yt-dlp with options from spec lines 134-142
- Add content validation and copyright checks
- Implement download progress tracking
- Create automatic format conversion to supported audio
- Add cleanup for temporary download files

**Acceptance Criteria**:

- All tests pass after implementation
- YouTube downloads complete successfully
- Downloaded audio converted to mp3 format
- Duration validation rejects videos >10 minutes
- Copyright protection checks prevent illegal downloads
- Temp files cleaned up after processing

**Dependencies**: Task 12, Task 13, Task 14

**Testing**: Unit tests (TDD), integration tests with yt-dlp mocks, real YouTube tests (optional)

**Contract**: Spec lines 127-143 YouTube integration

---

#### Task 18: Implement Audio Processing Service [P]

**Complexity**: Medium | **Priority**: P0 | **Duration**: 6 hours

Coordinate audio processing pipeline from input to stems.

**Actions**:

- Implement `/backend/services/audio_processing.py`
- Orchestrate file upload → validation → Demucs → output
- Integrate with DemucsService and YouTubeService
- Implement CDN URL generation for output stems
- Add file cleanup after successful processing
- Create processing metrics collection
- Implement error recovery and rollback

**Acceptance Criteria**:

- Full pipeline works end-to-end
- File uploads processed successfully
- YouTube URLs downloaded and processed
- Output stems uploaded to CDN
- Temp files cleaned up automatically
- Processing metrics logged per spec lines 256-268

**Dependencies**: Task 13, Task 16, Task 17

**Testing**: Integration tests for full pipeline, error scenario tests

**Reference**: Spec lines 100-161 service integration

---

---

## Phase 3: API Endpoints & Middleware (Week 3-4)

### Track C: API Implementation

#### Task 19: Implement FastAPI Application Setup

**Complexity**: Medium | **Priority**: P0 | **Duration**: 5 hours

Create FastAPI application with middleware and configuration.

**Actions**:

- Implement `/backend/api/__init__.py` with FastAPI app creation
- Configure CORS middleware for frontend origin
- Add request logging middleware
- Implement error handling middleware
- Create request ID injection middleware
- Add response time tracking
- Configure OpenAPI documentation
- Set up dependency injection for services

**Acceptance Criteria**:

- FastAPI app starts successfully
- CORS allows frontend requests
- All requests logged with IDs
- Errors return standardized JSON responses
- Response times tracked and logged
- OpenAPI docs accessible at /docs
- Services injected via dependencies

**Dependencies**: Task 2, Task 3, Task 4

**Testing**: Integration test that app starts, middleware functions

**Reference**: Spec lines 163-175 API architecture

---

#### Task 20: Implement Dependency Injection

**Complexity**: Low | **Priority**: P0 | **Duration**: 3 hours

Create FastAPI dependencies for service injection.

**Actions**:

- Implement `/backend/api/dependencies.py`
- Create dependency for configuration injection
- Add dependency for Redis connection
- Create dependency for service instances (DemucsService, YouTubeService, QueueService)
- Implement request validation dependency
- Add rate limiting dependency
- Create authentication dependency (placeholder for future)

**Acceptance Criteria**:

- All services injectable via FastAPI dependencies
- Configuration accessed via dependency injection
- Redis connections pooled and managed
- Rate limiting enforced per dependency
- Dependencies properly cleaned up after request

**Dependencies**: Task 19

**Testing**: Unit tests for dependency creation, cleanup

---

#### Task 21: Implement Stemify Endpoint (Replace Mock)

**Complexity**: High | **Priority**: P0 | **Duration**: 8 hours

Replace `/api/stemify` mock with real backend processing.

**Actions**:

- Implement `/backend/api/routes.py` with POST /api/stemify endpoint
- Handle multipart file uploads
- Handle YouTube URL requests
- Validate inputs per spec lines 239-244
- Create job in queue via QueueService
- Return job ID and estimated duration
- Implement rate limiting (5 jobs/hour/IP)
- Add request logging and metrics

**Acceptance Criteria**:

- File uploads accepted (max 50MB)
- YouTube URLs validated and queued
- Job IDs returned immediately
- Rate limiting enforced correctly
- Contract tests from Task 11 now pass
- Endpoint matches OpenAPI spec
- Error responses standardized

**Dependencies**: Task 11, Task 15, Task 18, Task 20

**Testing**: Contract tests pass, integration tests with real files/URLs

**Contract**: Spec lines 165-169 stemify endpoint

---

#### Task 22: Implement Job Status Endpoint

**Complexity**: Medium | **Priority**: P0 | **Duration**: 4 hours

Create GET /api/jobs/{id} for progress tracking.

**Actions**:

- Add GET /api/jobs/{id} route to `/backend/api/routes.py`
- Query job status from Redis via QueueService
- Return current progress, status, and results
- Include stem URLs when completed
- Add error details when failed
- Implement caching for completed jobs
- Add rate limiting for polling (60 requests/minute)

**Acceptance Criteria**:

- Job status returned accurately
- Progress updates reflect real processing state
- Completed jobs include stem URLs
- Failed jobs include error messages
- Contract tests from Task 11 pass
- Polling rate limited to prevent abuse

**Dependencies**: Task 11, Task 15, Task 20

**Testing**: Contract tests pass, integration tests with mock jobs

**Contract**: Spec lines 171-174 job status endpoint

---

#### Task 23: Implement Job Cancellation Endpoint [P]

**Complexity**: Medium | **Priority**: P1 | **Duration**: 4 hours

Add DELETE /api/jobs/{id} for cancelling in-progress jobs.

**Actions**:

- Add DELETE /api/jobs/{id} route
- Stop Celery task for job
- Clean up temporary files
- Update job status to "cancelled"
- Return confirmation response
- Add audit logging for cancellations

**Acceptance Criteria**:

- In-progress jobs stopped gracefully
- Temp files cleaned up immediately
- Status updated to cancelled
- Audit log records cancellation
- Cannot cancel completed jobs

**Dependencies**: Task 15, Task 20

**Testing**: Integration tests with running jobs, edge case tests

---

#### Task 24: Implement Health Check Endpoint [P]

**Complexity**: Low | **Priority**: P0 | **Duration**: 2 hours

Create GET /health for monitoring.

**Actions**:

- Add GET /health route
- Check Redis connectivity
- Verify Demucs models loaded
- Check disk space for temp files
- Return service status and version
- Add detailed diagnostics at /health/detailed

**Acceptance Criteria**:

- Health check returns 200 when all services healthy
- Returns 503 when dependencies unavailable
- Detailed diagnostics include component status
- Response time <100ms

**Dependencies**: Task 19

**Testing**: Unit tests for health checks, integration tests with services down

---

---

## Phase 4: Frontend Integration (Week 4-5)

### Track B: Frontend Updates

#### Task 25: Update TypeScript Interfaces for Async Processing

**Complexity**: Medium | **Priority**: P0 | **Duration**: 4 hours

Modify existing interfaces to support job-based processing.

**Actions**:

- Update `/app/services/aiStemService.ts` interfaces
- Change StemifyResponse to include jobId and status
- Add JobStatusResponse interface
- Update error handling types
- Add progress tracking types
- Modify existing function signatures for async operations
- Add JSDoc comments for all interfaces

**Acceptance Criteria**:

- All TypeScript errors resolved
- Interfaces match backend API contracts
- Progress tracking types support polling
- Error types include detailed messages
- JSDoc provides clear usage examples

**Dependencies**: Task 10, Task 21

**Testing**: TypeScript compilation succeeds, no type errors

**Contract**: [data-model.md](./data-model.md) API DTOs (lines 156-188)

---

#### Task 26: Update API Service Layer for Job Processing

**Complexity**: Medium | **Priority**: P0 | **Duration**: 6 hours

Replace mock API calls with real backend integration.

**Actions**:

- Update `/app/services/aiStemService.ts` requestStemSeparation function
- Remove silent audio generation
- Implement real multipart file upload to /api/stemify
- Add YouTube URL support
- Implement fetch with proper headers and error handling
- Add request timeout configuration
- Create retry logic for transient failures

**Acceptance Criteria**:

- File uploads send to real backend
- YouTube URLs processed correctly
- Job IDs returned from backend
- Network errors handled gracefully
- Requests timeout after 30 seconds
- Failed requests retry up to 3 times

**Dependencies**: Task 21, Task 25

**Testing**: Integration tests with backend, mock tests for error scenarios

**Reference**: Spec lines 178-199 frontend integration

---

#### Task 27: Implement Progress Polling Hook

**Complexity**: Medium | **Priority**: P0 | **Duration**: 6 hours

Create React hook for real-time job status updates.

**Actions**:

- Create `/app/hooks/useStemSeparation.ts`
- Implement job status polling with exponential backoff
- Track multiple jobs simultaneously
- Update job map when status changes
- Stop polling when jobs complete or fail
- Add automatic retry for failed poll requests
- Implement cancellation support

**Acceptance Criteria**:

- Polling starts automatically after job submission
- Polls every 2 seconds, backs off to 5 seconds
- Stops polling when job completes
- Handles multiple concurrent jobs
- Cancellation stops polling immediately
- Hook cleanup on unmount

**Dependencies**: Task 22, Task 25

**Testing**: Unit tests with mock fetch, integration tests with backend

**Reference**: Spec lines 201-215 progress tracking hook

---

#### Task 28: Update Upload Components for Real Processing

**Complexity**: Medium | **Priority**: P0 | **Duration**: 6 hours

Modify existing upload UI to show real processing status.

**Actions**:

- Update `/app/components/stem-player/StemUploadPanel.tsx`
- Remove mock progress simulation
- Integrate useStemSeparation hook
- Display real job status and progress
- Show estimated completion time
- Add cancel button for in-progress jobs
- Update waveform visualization with real data

**Acceptance Criteria**:

- Upload triggers real backend processing
- Progress bar shows actual processing percentage
- Status messages reflect real job states
- Cancel button stops backend processing
- Waveforms generated from real stems
- UI responsive during processing

**Dependencies**: Task 27

**Testing**: E2E tests with real uploads, visual regression tests

---

#### Task 29: Add YouTube URL Processing Interface [P]

**Complexity**: Low | **Priority**: P1 | **Duration**: 4 hours

Create UI for YouTube URL input and processing.

**Actions**:

- Add YouTube URL input field to StemUploadPanel
- Implement URL validation with visual feedback
- Show thumbnail preview from YouTube API
- Display video duration and title
- Integrate with backend YouTube processing
- Add error handling for invalid URLs

**Acceptance Criteria**:

- URL input validates YouTube format
- Thumbnail and metadata displayed before processing
- Duration validation (10-minute limit) shown
- Processing starts after confirmation
- Errors show helpful messages (e.g., "Video too long")

**Dependencies**: Task 26, Task 27

**Testing**: Unit tests for validation, integration tests with backend

**Reference**: Spec lines 278-282 YouTube integration

---

#### Task 30: Implement Real-Time Progress Indicators [P]

**Complexity**: Low | **Priority**: P1 | **Duration**: 4 hours

Add visual feedback for processing stages.

**Actions**:

- Create progress component with stage indicators
- Show stages: Uploading → Processing → Separating → Complete
- Display current progress percentage
- Show estimated time remaining
- Add visual feedback for errors
- Implement animated transitions between stages

**Acceptance Criteria**:

- Progress stages clearly labeled
- Percentage accurately reflects backend progress
- Time remaining estimates reasonable
- Errors highlighted in red with messages
- Smooth transitions between stages

**Dependencies**: Task 27

**Testing**: Visual tests, integration tests with various job states

---

#### Task 31: Update Error Handling UI [P]

**Complexity**: Medium | **Priority**: P0 | **Duration**: 5 hours

Enhance error messages and recovery options.

**Actions**:

- Update error handling in all upload/playback components
- Display specific error messages from backend
- Add retry buttons for recoverable errors
- Show suggestions for common errors (file too large, unsupported format)
- Implement error reporting mechanism
- Add error analytics tracking

**Acceptance Criteria**:

- Backend error messages displayed clearly
- Retry buttons trigger new processing attempts
- Helpful suggestions shown for common issues
- Error analytics captured for monitoring
- UI gracefully degrades on errors

**Dependencies**: Task 26, Task 28

**Testing**: Unit tests for error rendering, integration tests with error scenarios

---

---

## Phase 5: Testing & Quality Assurance (Week 5-6)

### Track D: Comprehensive Testing

#### Task 32: Implement Backend Unit Tests (80% Coverage)

**Complexity**: High | **Priority**: P0 | **Duration**: 12 hours

Comprehensive unit test coverage for all backend services.

**Actions**:

- Write unit tests for all utils modules
- Test all service methods with mocks
- Test model validation and serialization
- Test configuration loading and validation
- Test exception handling paths
- Achieve 80%+ coverage for all modules

**Acceptance Criteria**:

- All utils have 90%+ coverage
- All services have 80%+ coverage
- All models have 95%+ coverage
- All exception paths tested
- Coverage report shows 80%+ overall
- No critical paths untested

**Dependencies**: Tasks 12-18

**Testing**: Run `pytest --cov=backend --cov-report=html` shows 80%+

---

#### Task 33: Implement API Integration Tests

**Complexity**: High | **Priority**: P0 | **Duration**: 10 hours

End-to-end API testing with real backend services.

**Actions**:

- Create `/backend/tests/test_integration.py`
- Test full file upload → processing → results flow
- Test YouTube URL → download → processing flow
- Test job status polling and progress updates
- Test error scenarios (invalid file, timeout, cancellation)
- Test rate limiting enforcement
- Test concurrent job processing

**Acceptance Criteria**:

- Full upload flow tested end-to-end
- YouTube flow tested with yt-dlp
- All error paths validated
- Rate limiting tested with multiple requests
- Concurrent processing tested with 10+ jobs
- All tests run against dockerized backend

**Dependencies**: Tasks 19-24

**Testing**: Integration test suite passes consistently

**Reference**: Spec lines 359-377 testing strategy

---

#### Task 34: Implement Audio Quality Validation Tests [P]

**Complexity**: High | **Priority**: P0 | **Duration**: 8 hours

Validate stem separation quality meets standards.

**Actions**:

- Create audio quality assessment framework
- Test vocal isolation accuracy (target 85-95%)
- Test drum separation accuracy (target 80-90%)
- Test bass isolation accuracy (target 75-85%)
- Test artifact reduction effectiveness
- Compare output quality across models
- Generate quality reports per test run

**Acceptance Criteria**:

- Quality metrics automatically calculated
- All models meet minimum 80% accuracy
- Artifact detection identifies issues
- Quality reports generated per test
- Automated regression detection for quality

**Dependencies**: Task 16

**Testing**: Quality tests run on standard test tracks, benchmarks compared

**Reference**: Spec lines 317-321 quality metrics

---

#### Task 35: Implement Performance Benchmarking [P]

**Complexity**: Medium | **Priority**: P0 | **Duration**: 6 hours

Measure and validate performance targets.

**Actions**:

- Create performance test suite
- Benchmark processing times for different track lengths
- Test concurrent job processing (100+ jobs)
- Measure memory usage under load
- Test GPU vs CPU performance
- Generate performance reports
- Compare against targets from spec

**Acceptance Criteria**:

- 3-minute tracks process in <60 seconds
- 7-minute tracks process in <2 minutes
- System handles 100+ concurrent jobs
- Memory usage stays below 8GB per job
- GPU processing 3-5x faster than CPU
- Performance reports show all targets met

**Dependencies**: Task 16, Task 33

**Testing**: Automated performance tests, load testing scripts

**Reference**: Spec lines 310-321 performance benchmarks

---

#### Task 36: Implement Frontend Component Tests [P]

**Complexity**: Medium | **Priority**: P0 | **Duration**: 8 hours

Test React components with real backend integration.

**Actions**:

- Write React Testing Library tests for all updated components
- Test upload flow with mock backend
- Test progress polling and display
- Test error handling and display
- Test YouTube URL input and validation
- Test job cancellation
- Achieve 80%+ frontend coverage

**Acceptance Criteria**:

- All components have test coverage
- Upload flow tested end-to-end
- Progress updates tested with mock polling
- Error scenarios tested
- Coverage report shows 80%+
- No regression in existing tests

**Dependencies**: Tasks 25-31

**Testing**: Run `npm test -- --coverage` shows 80%+

---

#### Task 37: Implement End-to-End Integration Tests [P]

**Complexity**: High | **Priority**: P0 | **Duration**: 10 hours

Full stack testing from frontend to backend.

**Actions**:

- Set up E2E testing with Playwright or Cypress
- Test file upload from browser to backend
- Test YouTube URL processing full flow
- Test progress tracking in real-time
- Test error scenarios (network failures, timeouts)
- Test cancellation flow
- Run tests in CI/CD pipeline

**Acceptance Criteria**:

- E2E tests cover all user workflows
- Tests run against dockerized full stack
- All critical paths validated
- Tests run successfully in CI/CD
- Test results archived for debugging
- Tests complete in <10 minutes

**Dependencies**: Tasks 21-31

**Testing**: E2E test suite passes consistently

---

---

## Phase 6: Production Hardening (Week 6-7)

### Track E: Security & Optimization

#### Task 38: Implement Security Hardening [P]

**Complexity**: High | **Priority**: P0 | **Duration**: 8 hours

Apply security best practices across backend.

**Actions**:

- Implement rate limiting per IP with Redis
- Add file validation for malicious content
- Sanitize all user inputs
- Add CSRF protection for API endpoints
- Implement API key authentication (optional)
- Add security headers (CSP, HSTS, X-Frame-Options)
- Conduct security audit with automated tools

**Acceptance Criteria**:

- Rate limiting enforces 5 jobs/hour/IP
- File uploads scanned for malicious content
- All inputs sanitized against injection
- Security headers present in all responses
- API key auth ready for future use
- No critical vulnerabilities in audit

**Dependencies**: Tasks 19-24

**Testing**: Security tests, penetration testing (optional), OWASP checks

**Reference**: Spec lines 239-244 security measures

---

#### Task 39: Implement Monitoring and Alerting [P]

**Complexity**: Medium | **Priority**: P0 | **Duration**: 6 hours

Set up observability for production operations.

**Actions**:

- Integrate Prometheus metrics collection
- Add Grafana dashboards for key metrics
- Implement alerting for failures and performance issues
- Set up log aggregation (ELK or similar)
- Add request tracing with OpenTelemetry
- Create runbooks for common issues
- Configure alert notifications (Slack, email)

**Acceptance Criteria**:

- Metrics collected for all operations
- Dashboards show real-time system health
- Alerts trigger for critical issues
- Logs searchable and aggregated
- Request tracing shows full flow
- Runbooks documented for on-call

**Dependencies**: Task 3, Tasks 19-24

**Testing**: Trigger alerts manually, verify notifications

**Reference**: Spec lines 253-268 monitoring & analytics

---

#### Task 40: Implement CDN Integration [P]

**Complexity**: Medium | **Priority**: P1 | **Duration**: 6 hours

Configure CDN for serving processed stems.

**Actions**:

- Set up CloudFront or similar CDN
- Configure S3/R2 bucket for stem storage
- Implement automatic upload to CDN after processing
- Generate signed URLs for secure access
- Add CDN URL to job results
- Configure cache control headers
- Implement CDN purging for deletions

**Acceptance Criteria**:

- Stems automatically uploaded to CDN
- URLs signed with expiration (90 days)
- CDN serves stems globally with low latency
- Cache headers optimize delivery
- Purging removes deleted stems
- CDN costs monitored

**Dependencies**: Task 18

**Testing**: Upload tests, CDN delivery tests, signed URL validation

**Reference**: Spec lines 250-251 CDN integration

---

#### Task 41: Implement Performance Optimization [P]

**Complexity**: High | **Priority**: P0 | **Duration**: 10 hours

Optimize backend for production performance.

**Actions**:

- Profile bottlenecks with cProfile
- Optimize database queries with indexing
- Implement Redis caching for repeated requests
- Add connection pooling for database and Redis
- Optimize Demucs model loading and inference
- Implement batch processing for multiple jobs
- Tune Celery worker configuration

**Acceptance Criteria**:

- API response times <200ms
- Processing times meet spec targets
- Database queries optimized with indexes
- Cache hit ratio >70% for repeated requests
- Connection pools configured correctly
- Batch processing improves throughput

**Dependencies**: Tasks 15-18

**Testing**: Performance benchmarks show improvement, profiling validates optimizations

**Reference**: Spec lines 246-251 performance optimization

---

#### Task 42: Implement Error Recovery and Retry [P]

**Complexity**: Medium | **Priority**: P0 | **Duration**: 6 hours

Add robust error handling and automatic recovery.

**Actions**:

- Implement retry logic with exponential backoff
- Add circuit breaker for external services (YouTube)
- Create job recovery mechanism for crashes
- Implement graceful degradation for GPU failures
- Add automatic failover for Redis
- Create dead letter queue for failed jobs
- Implement job timeout and cleanup

**Acceptance Criteria**:

- Transient failures retry automatically
- Circuit breaker prevents cascade failures
- Crashed jobs recovered on worker restart
- GPU failures fall back to CPU
- Redis failover transparent to clients
- Failed jobs moved to dead letter queue
- Timeouts prevent hung jobs

**Dependencies**: Tasks 15-18

**Testing**: Fault injection tests, chaos engineering scenarios

**Reference**: Spec lines 345-356 risk mitigation

---

---

## Phase 7: Documentation & Deployment (Week 7-8)

### Track E: Documentation & Production

#### Task 43: Create API Documentation [P]

**Complexity**: Low | **Priority**: P0 | **Duration**: 4 hours

Generate comprehensive API documentation.

**Actions**:

- Generate OpenAPI specification from FastAPI
- Add detailed endpoint descriptions
- Document all request/response schemas
- Add example requests and responses
- Document error codes and meanings
- Create Postman collection for testing
- Publish docs to documentation site

**Acceptance Criteria**:

- OpenAPI spec auto-generated and accurate
- All endpoints documented with examples
- Error codes clearly explained
- Postman collection importable
- Docs accessible at public URL
- Versioning strategy documented

**Dependencies**: Tasks 19-24

**Testing**: Manual validation of examples, Postman collection tests

**Reference**: Spec lines 380-384 API documentation

---

#### Task 44: Create User Documentation [P]

**Complexity**: Low | **Priority**: P1 | **Duration**: 4 hours

Write user-facing guides and tutorials.

**Actions**:

- Write upload instructions
- Document YouTube URL format and requirements
- Create model selection guide
- Write troubleshooting guide
- Add FAQ section
- Create video tutorials (optional)
- Publish to user documentation site

**Acceptance Criteria**:

- Upload instructions clear and detailed
- YouTube requirements documented
- Model selection guide helps users choose
- Troubleshooting covers common issues
- FAQ answers expected questions
- Docs accessible to non-technical users

**Dependencies**: Tasks 25-31

**Testing**: User testing with documentation, feedback incorporation

**Reference**: Spec lines 386-390 user documentation

---

#### Task 45: Create Developer Documentation [P]

**Complexity**: Medium | **Priority**: P0 | **Duration**: 6 hours

Write technical documentation for developers.

**Actions**:

- Write setup instructions for local development
- Document configuration options
- Create deployment guide
- Write contribution guidelines
- Document architecture and design decisions
- Add API usage examples
- Create troubleshooting guide for developers

**Acceptance Criteria**:

- Setup instructions work on all platforms
- All configuration options documented
- Deployment guide enables production deployment
- Contribution guidelines clear
- Architecture decisions documented
- Code examples work correctly
- Developer troubleshooting guide helpful

**Dependencies**: All implementation tasks

**Testing**: Follow setup guide on clean machine, validate all examples

**Reference**: Spec lines 392-396 developer documentation

---

#### Task 46: Set Up CI/CD Pipeline

**Complexity**: Medium | **Priority**: P0 | **Duration**: 8 hours

Automate testing and deployment.

**Actions**:

- Create GitHub Actions workflow for backend tests
- Add frontend test workflow
- Implement Docker image building and pushing
- Add integration test stage
- Configure staging deployment automation
- Set up production deployment with approval
- Add deployment rollback mechanism

**Acceptance Criteria**:

- All tests run automatically on PR
- Docker images built and pushed to registry
- Staging deploys automatically on merge to main
- Production requires manual approval
- Rollback mechanism tested and working
- CI/CD pipeline completes in <15 minutes

**Dependencies**: Tasks 32-37

**Testing**: Trigger full pipeline, validate each stage

**Reference**: Spec lines 271-294 deployment strategy

---

#### Task 47: Production Deployment [P]

**Complexity**: High | **Priority**: P0 | **Duration**: 12 hours

Deploy to production infrastructure.

**Actions**:

- Set up production GPU-enabled server
- Deploy backend services with Docker Compose or Kubernetes
- Configure production Redis with persistence
- Set up load balancer with health checks
- Deploy frontend to CDN/hosting
- Configure production domain and SSL
- Run smoke tests on production
- Set up backup and disaster recovery

**Acceptance Criteria**:

- All services running in production
- GPU acceleration working
- Redis persisting data correctly
- Load balancer routing traffic
- Frontend accessible at production domain
- SSL certificates valid
- Smoke tests passing
- Backup system operational

**Dependencies**: Tasks 38-42, Task 46

**Testing**: Smoke tests, load tests on production, disaster recovery drill

**Reference**: Spec lines 270-294 deployment requirements

---

#### Task 48: Cost Monitoring and Optimization [P]

**Complexity**: Low | **Priority**: P1 | **Duration**: 4 hours

Track and optimize infrastructure costs.

**Actions**:

- Set up cost monitoring dashboards
- Track GPU usage and costs
- Monitor storage costs
- Track CDN bandwidth costs
- Identify optimization opportunities
- Set up cost alerts for overruns
- Create cost optimization recommendations

**Acceptance Criteria**:

- Cost dashboard shows real-time spending
- GPU usage tracked per job
- Storage costs monitored
- CDN bandwidth tracked
- Alerts trigger at budget thresholds
- Optimization recommendations documented
- Monthly costs within spec budget ($100-150)

**Dependencies**: Task 47

**Testing**: Validate cost calculations, test alert triggers

**Reference**: Spec lines 295-308 cost analysis

---

---

## Phase 8: Validation & Launch (Week 8)

### Track D: Final Validation

#### Task 49: Execute Quickstart Validation

**Complexity**: Medium | **Priority**: P0 | **Duration**: 4 hours

Run through quickstart guide to validate all features.

**Actions**:

- Follow quickstart.md step-by-step
- Test file upload flow
- Test YouTube URL flow
- Validate progress tracking
- Test model selection
- Verify stem quality
- Test error scenarios
- Validate documentation accuracy

**Acceptance Criteria**:

- All quickstart steps work correctly
- No errors during happy path
- Documentation matches implementation
- All features accessible and functional
- Performance meets expectations
- Quality meets 80%+ threshold

**Dependencies**: All implementation tasks, Task 45

**Testing**: Manual walkthrough, automated quickstart test script

**Reference**: [quickstart.md](./quickstart.md)

---

#### Task 50: Production Smoke Tests

**Complexity**: Low | **Priority**: P0 | **Duration**: 3 hours

Validate production deployment with smoke tests.

**Actions**:

- Test health check endpoint
- Upload and process test file
- Verify CDN delivery of stems
- Test monitoring and alerting
- Validate security headers
- Test rate limiting
- Verify all integrations working

**Acceptance Criteria**:

- Health checks return 200
- File processing completes successfully
- Stems accessible via CDN
- Monitoring shows correct metrics
- Security headers present
- Rate limiting enforces limits
- No critical errors in logs

**Dependencies**: Task 47

**Testing**: Automated smoke test suite, manual validation

---

#### Task 51: Load Testing and Capacity Planning [P]

**Complexity**: Medium | **Priority**: P1 | **Duration**: 6 hours

Validate system can handle expected load.

**Actions**:

- Run load tests with 100+ concurrent jobs
- Test sustained load over 1 hour
- Identify bottlenecks under load
- Test auto-scaling behavior (if configured)
- Measure resource usage at capacity
- Generate capacity planning report
- Create scaling recommendations

**Acceptance Criteria**:

- System handles 100+ concurrent jobs
- No failures under sustained load
- Bottlenecks identified and documented
- Auto-scaling works correctly (if applicable)
- Resource usage documented
- Capacity planning report complete
- Scaling recommendations clear

**Dependencies**: Task 47

**Testing**: Load testing with Locust or similar, resource monitoring

**Reference**: Spec lines 323-330 success criteria

---

#### Task 52: Security Audit and Penetration Testing [P]

**Complexity**: High | **Priority**: P0 | **Duration**: 8 hours

Final security validation before launch.

**Actions**:

- Run automated security scanning (OWASP ZAP)
- Test for SQL injection, XSS, CSRF
- Validate rate limiting under attack
- Test file upload malicious payloads
- Review authentication and authorization
- Check for sensitive data exposure
- Generate security audit report

**Acceptance Criteria**:

- No critical vulnerabilities found
- All common attacks blocked
- Rate limiting prevents abuse
- Malicious files rejected
- No sensitive data in logs or errors
- Security audit report complete
- Remediation plan for any issues

**Dependencies**: Task 38, Task 47

**Testing**: Automated security tools, manual penetration testing

**Reference**: Spec lines 239-244 security measures

---

#### Task 53: Launch Readiness Review

**Complexity**: Low | **Priority**: P0 | **Duration**: 4 hours

Final checklist before production launch.

**Actions**:

- Review all acceptance criteria met
- Validate all tests passing
- Confirm documentation complete
- Check monitoring and alerting configured
- Verify backup and disaster recovery ready
- Review security audit results
- Confirm rollback plan tested
- Get stakeholder sign-off

**Acceptance Criteria**:

- All acceptance criteria verified
- Test suite passing (backend, frontend, E2E)
- Documentation complete and accurate
- Monitoring operational
- Backups and DR tested
- No critical security issues
- Rollback plan validated
- Stakeholder approval obtained

**Dependencies**: All tasks

**Testing**: Final comprehensive test run, manual review

---

---

## Summary Statistics

### Total Tasks: 53

- **P0 (Critical)**: 39 tasks
- **P1 (Important)**: 14 tasks

### Effort Estimation

- **Track A (Backend)**: ~110 hours
- **Track B (Frontend)**: ~45 hours
- **Track C (API)**: ~35 hours
- **Track D (Testing)**: ~70 hours
- **Track E (DevOps)**: ~65 hours

**Total Estimated Effort**: ~325 developer-hours

### Parallel Execution Opportunities

- **Phase 0**: Tasks 1-7 (all parallel)
- **Phase 1**: Tasks 8-11 (all parallel)
- **Phase 2**: Tasks 12-14 (parallel), 15-18 (sequential with internal parallelism)
- **Phase 3**: Tasks 19-24 (mostly sequential, some parallel)
- **Phase 4**: Tasks 25-31 (mostly parallel after dependencies met)
- **Phase 5**: Tasks 32-37 (all parallel)
- **Phase 6**: Tasks 38-42 (all parallel)
- **Phase 7**: Tasks 43-48 (all parallel)
- **Phase 8**: Tasks 49-53 (mostly sequential)

### Critical Path

1. Backend Infrastructure (Tasks 1-7)
2. Core Services (Tasks 15-18)
3. API Endpoints (Tasks 19-24)
4. Frontend Integration (Tasks 25-31)
5. Testing & Validation (Tasks 32-37, 49-53)

### Success Criteria Validation

- **Functional**: Real stem separation works end-to-end (Tasks 16, 21, 33)
- **Quality**: >80% accuracy on test tracks (Task 34)
- **Performance**: <2 minutes processing time (Task 35)
- **Scalability**: Handle 100+ concurrent jobs (Task 51)
- **Reliability**: <1% failure rate (Tasks 42, 50)

**Reference**: Spec lines 323-330 success criteria

---

## Next Steps

1. **Review this task breakdown** with technical leads for accuracy
2. **Assign tasks to tracks** based on team structure from parallel execution strategy
3. **Set up project tracking** (Jira, Linear, GitHub Projects)
4. **Schedule kickoff meeting** with all track leads
5. **Begin Phase 0 immediately** (all tasks are parallel and independent)

**Ready to implement**: All tasks have clear acceptance criteria, dependencies, and testing strategies.
