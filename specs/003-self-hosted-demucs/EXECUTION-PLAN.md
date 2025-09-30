# Self-Hosted Demucs: Parallel Execution Plan

**Status**: Ready for Execution | **Mode**: Production (No Mocks) | **Config**: The Agentic Startup v2.0.0

## Execution Philosophy

**Zero Mocks. Zero Shortcuts. Production-Ready Code.**

This execution plan leverages:

- **Activity-Based Agent System** (11 role archetypes + 5 specialized subagents)
- **Parallel Execution** across 5 independent tracks
- **TDD-First Development** with contract validation
- **Comprehensive Logging** (structlog + OpenTelemetry)
- **Checkpoint/Resume System** for long-running tasks
- **80%+ Test Coverage** enforced at every phase gate

---

## Phase 0: Parallel Agent Activation

### Execution Strategy: 5 Concurrent Tracks

We run **5 specialized agents simultaneously**, each working on independent tracks with their own repositories and environments.

```
┌─────────────────────────────────────────────────────────────┐
│                    Chief Agent (Orchestrator)                │
│         Complexity Assessment + Work Routing + Sync          │
└─────────────────────────────────────────────────────────────┘
         │
         ├─────────────┬─────────────┬─────────────┬─────────────┐
         ▼             ▼             ▼             ▼             ▼
    ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐
    │Track A │   │Track B │   │Track C │   │Track D │   │Track E │
    │Backend │   │Frontend│   │  API   │   │Testing │   │ DevOps │
    │ Agent  │   │ Agent  │   │ Agent  │   │ Agent  │   │ Agent  │
    └────────┘   └────────┘   └────────┘   └────────┘   └────────┘
         │             │             │             │             │
         ▼             ▼             ▼             ▼             ▼
    [Python]     [React/TS]    [FastAPI]    [pytest]     [Docker]
    Services     Components    Endpoints     Coverage    Infrastructure
```

---

## Track Configuration

### Track A: Backend Infrastructure Agent

**Primary Agent**: Software Engineer + Platform Engineer
**Secondary Agent**: ML Engineer (for Demucs integration)
**Working Directory**: `/backend`
**Branch**: `track-a/backend-infrastructure`

**Phase 0 Tasks (Week 1)** - All Parallel:

1. ✅ Task 1: Create Python project structure
2. ✅ Task 2: Implement configuration management (Pydantic)
3. ✅ Task 3: Implement structured logging (structlog)
4. ✅ Task 4: Implement custom exceptions
5. ✅ Task 6: Install Demucs models (htdemucs, htdemucs_ft, mdx_extra, mdx_extra_q)

**Agent Responsibilities**:

- TDD implementation for all services
- Comprehensive error handling (no try/except without logging)
- Performance optimization with profiling
- Integration with Track E for deployment

**Logging Strategy**:

```python
# Every service uses structlog
import structlog

logger = structlog.get_logger(__name__)

# All operations logged with context
logger.info(
    "demucs_processing_started",
    job_id=job.id,
    model=model,
    input_size_mb=input_size / 1024 / 1024,
    estimated_duration_sec=estimated_duration
)
```

**Code Quality Rules**:

- No mocks in production code (mocks only in tests)
- 80%+ coverage enforced by pytest-cov
- Type hints for all functions
- Docstrings for all public methods

---

### Track B: Frontend Integration Agent

**Primary Agent**: Software Engineer (Frontend) + Designer
**Secondary Agent**: QA Engineer (for component testing)
**Working Directory**: `/app`
**Branch**: `track-b/frontend-integration`

**Phase 0 Preparation**:

- Analyze existing mock implementations
- Document all mocked services
- Plan replacement strategy

**Phase 4 Tasks (Week 4-5)** - Parallel after Track A Phase 2:

1. ✅ Task 25: Update TypeScript interfaces
2. ✅ Task 26: Replace mock API calls with real backend
3. ✅ Task 27: Implement progress polling hook
4. ✅ Task 28: Update upload components
5. ✅ Task 29: Add YouTube URL interface
6. ✅ Task 30: Real-time progress indicators
7. ✅ Task 31: Enhanced error handling UI

**Agent Responsibilities**:

- Remove ALL mock implementations from codebase
- Real-time WebSocket or polling integration
- Comprehensive error handling with user-friendly messages
- Accessibility compliance (WCAG 2.1 AA)

**Testing Strategy**:

```typescript
// React Testing Library with real API mocks
import { rest } from "msw";
import { setupServer } from "msw/node";

// Mock backend responses (not mock implementations)
const server = setupServer(
  rest.post("/api/stemify", (req, res, ctx) => {
    return res(ctx.json({ jobId: "test-job-123", status: "pending" }));
  }),
);

// All components tested with real interaction flows
```

**No Mocks Validation**:

- Grep codebase: `grep -r "mock" app/` should only find test files
- No silent audio generation in production
- No fake progress simulation

---

### Track C: API Migration Agent

**Primary Agent**: Software Engineer (Full-Stack) + Architect
**Secondary Agent**: Security Engineer (for endpoint validation)
**Working Directory**: `/backend/api` + `/app/api`
**Branch**: `track-c/api-migration`

**Phase 3 Tasks (Week 3-4)** - Sequential after Track A Phase 2:

1. ✅ Task 19: FastAPI application setup
2. ✅ Task 20: Dependency injection
3. ✅ Task 21: Replace `/api/stemify` mock endpoint
4. ✅ Task 22: Implement `/api/jobs/{id}` status endpoint
5. ✅ Task 23: Job cancellation endpoint
6. ✅ Task 24: Health check endpoint

**Agent Responsibilities**:

- Contract-first development (OpenAPI spec drives implementation)
- Security hardening (rate limiting, input validation)
- Real-time progress tracking via WebSocket or SSE
- Comprehensive request/response logging

**Contract Validation**:

```python
# Every endpoint validates against OpenAPI spec
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(
    title="OX Board Stem Separation API",
    version="1.0.0",
    docs_url="/docs",  # Auto-generated OpenAPI docs
)

# Contract tests validate every endpoint
@pytest.mark.contract
def test_stemify_endpoint_contract():
    response = client.post("/api/stemify", files={"file": test_audio})
    assert response.status_code == 200
    assert "jobId" in response.json()
    assert response.json()["status"] == "pending"
```

---

### Track D: Testing Infrastructure Agent

**Primary Agent**: QA Engineer + Software Engineer
**Secondary Agent**: Platform Engineer (for CI/CD integration)
**Working Directory**: `/backend/tests` + `/tests`
**Branch**: `track-d/testing-infrastructure`

**Phase 1-5 Tasks (Week 1-6)** - Continuous parallel execution:

1. ✅ Task 7: Python testing framework setup
2. ✅ Task 11: API contract tests (TDD)
3. ✅ Task 32: Backend unit tests (80%+ coverage)
4. ✅ Task 33: API integration tests
5. ✅ Task 34: Audio quality validation tests
6. ✅ Task 35: Performance benchmarking
7. ✅ Task 36: Frontend component tests
8. ✅ Task 37: End-to-end integration tests

**Agent Responsibilities**:

- Write tests BEFORE implementation (TDD)
- Enforce 80%+ coverage with CI/CD gates
- Performance regression detection
- Audio quality validation framework

**Testing Architecture**:

```python
# tests/conftest.py - Shared fixtures
import pytest
from backend.core.config import Config
from backend.services.stem_separation import DemucsService

@pytest.fixture
def config():
    """Real config loaded from environment"""
    return Config.from_env()

@pytest.fixture
def demucs_service(config):
    """Real DemucsService (not mocked)"""
    service = DemucsService(config)
    yield service
    service.cleanup()

# Real audio test files
@pytest.fixture
def test_audio_file(tmp_path):
    """Generate real audio file for testing"""
    audio_path = tmp_path / "test.wav"
    generate_test_audio(audio_path, duration=3.0, sample_rate=44100)
    return audio_path
```

**Coverage Enforcement**:

```bash
# CI/CD fails if coverage drops below 80%
pytest --cov=backend --cov=app --cov-report=html --cov-fail-under=80
```

---

### Track E: DevOps & Deployment Agent

**Primary Agent**: Platform Engineer + Security Engineer
**Secondary Agent**: Software Engineer (for infrastructure as code)
**Working Directory**: `/infrastructure`, `/docker`, `/.github`
**Branch**: `track-e/devops-deployment`

**Phase 0-7 Tasks (Week 1-8)** - Continuous parallel execution:

1. ✅ Task 5: Development environment (Docker Compose)
2. ✅ Task 38: Security hardening
3. ✅ Task 39: Monitoring and alerting (Prometheus + Grafana)
4. ✅ Task 40: CDN integration (CloudFlare R2)
5. ✅ Task 41: Performance optimization
6. ✅ Task 42: Error recovery and retry
7. ✅ Task 46: CI/CD pipeline (GitHub Actions)
8. ✅ Task 47: Production deployment
9. ✅ Task 48: Cost monitoring

**Agent Responsibilities**:

- Infrastructure as code (Docker, Kubernetes)
- Observability stack (Prometheus, Grafana, OpenTelemetry)
- Security scanning (OWASP ZAP, Trivy)
- Automated deployment with rollback

**Infrastructure Architecture**:

```yaml
# docker-compose.yml (development)
version: "3.9"
services:
  backend:
    build: ./backend
    environment:
      - DEMUCS_MODEL_PATH=/models
      - REDIS_URL=redis://redis:6379
      - LOG_LEVEL=INFO
    volumes:
      - ./models:/models
      - ./temp:/tmp/demucs
    ports:
      - "8000:8000"
    depends_on:
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 10s
      timeout: 5s
      retries: 3

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - backend

volumes:
  redis_data:
```

**Monitoring Stack**:

```python
# backend/core/observability.py
from opentelemetry import trace, metrics
from opentelemetry.exporter.prometheus import PrometheusMetricReader
from prometheus_client import start_http_server
import structlog

# Prometheus metrics
processing_duration = metrics.Histogram(
    "demucs_processing_duration_seconds",
    "Time taken to process stems",
    ["model", "status"]
)

# OpenTelemetry tracing
tracer = trace.get_tracer(__name__)

@tracer.start_as_current_span("separate_stems")
def separate_stems(audio_path: str, model: str):
    span = trace.get_current_span()
    span.set_attribute("audio.path", audio_path)
    span.set_attribute("model", model)

    logger = structlog.get_logger(__name__)
    logger.info("stem_separation_started", model=model)

    # ... processing ...

    processing_duration.labels(model=model, status="success").observe(duration)
```

---

## Parallel Execution Protocol

### Week 1: Foundation (All Tracks Parallel)

**Day 1-2: Setup & Infrastructure**

```bash
# Chief Agent orchestrates 5 parallel agents

# Track A: Backend setup
./scripts/execute-track.sh track-a "Tasks 1-4: Core infrastructure"

# Track B: Analysis phase
./scripts/execute-track.sh track-b "Analyze mock implementations"

# Track D: Testing framework
./scripts/execute-track.sh track-d "Task 7: pytest setup"

# Track E: Docker environment
./scripts/execute-track.sh track-e "Task 5: Docker Compose"

# All execute simultaneously
```

**Checkpoint 1 (Day 2 EOD)**:

- Track A: Python structure + config + logging complete
- Track B: Mock analysis documented
- Track D: pytest running with fixtures
- Track E: Docker environment operational
- **Validation**: `docker-compose up` starts all services

**Day 3-5: Core Models & Demucs**

```bash
# Track A: Models + Demucs installation
./scripts/execute-track.sh track-a "Tasks 6, 8-10: Models + Demucs"

# Track D: Contract tests (TDD)
./scripts/execute-track.sh track-d "Task 11: Contract tests"

# Track E: Model storage + GPU config
./scripts/execute-track.sh track-e "GPU setup + model storage"

# Parallel execution continues
```

**Checkpoint 2 (Day 5 EOD)**:

- Track A: All models downloaded, data models implemented
- Track D: Contract tests written (failing)
- Track E: GPU acceleration configured
- **Validation**: `python -m backend.services.stem_separation --test` loads models

---

### Week 2-3: Core Services (Track A Primary, Others Support)

**Track A: TDD Service Implementation**

```bash
# Sequential within track (dependencies), but parallel internal tasks

# Day 1-2: Utilities (parallel)
./scripts/execute-track.sh track-a "Tasks 12-14: Utils" --parallel

# Day 3-4: Queue service (TDD)
./scripts/execute-track.sh track-a "Task 15: Queue service" --tdd

# Day 5-7: Demucs service (TDD)
./scripts/execute-track.sh track-a "Task 16: Demucs service" --tdd

# Day 8-10: YouTube + Audio processing
./scripts/execute-track.sh track-a "Tasks 17-18: YouTube + Audio" --parallel
```

**Track D: Continuous Testing**

```bash
# Runs in parallel with Track A implementation
./scripts/execute-track.sh track-d "Task 32: Unit tests" --continuous

# Coverage gates at every checkpoint
pytest --cov=backend --cov-fail-under=80
```

**Checkpoint 3 (Week 2 EOD)**:

- Track A: Queue + Demucs services complete, tests passing
- Track D: 80%+ backend coverage achieved
- **Validation**: Process real audio file end-to-end

**Checkpoint 4 (Week 3 EOD)**:

- Track A: All services complete, YouTube integration working
- Track C: API contracts finalized
- **Validation**: Full pipeline working (upload → stems)

---

### Week 4-5: API + Frontend (Parallel Integration)

**Track C + Track B: Synchronized Parallel Work**

```bash
# Track C: API endpoints
./scripts/execute-track.sh track-c "Tasks 19-24: API endpoints"

# Track B: Frontend integration (parallel after Track C Task 20)
./scripts/execute-track.sh track-b "Tasks 25-31: Frontend" --after track-c:20

# Track D: Integration tests
./scripts/execute-track.sh track-d "Task 33: Integration tests" --parallel
```

**Daily Sync Points**:

- **9:00 AM**: Track standup (15 min each)
- **12:00 PM**: Cross-track integration sync (30 min)
- **5:00 PM**: Checkpoint validation

**Checkpoint 5 (Week 4 EOD)**:

- Track C: All API endpoints functional
- Track B: Frontend connected to real backend
- **Validation**: Upload file in browser → real stems returned

**Checkpoint 6 (Week 5 EOD)**:

- Track B: All mock implementations removed
- Track D: Frontend + E2E tests passing
- **Validation**: `grep -r "mock" app/src` returns only test files

---

### Week 6-7: Production Hardening (Full Parallel)

**All Tracks: Independent Optimization**

```bash
# Track A: Performance optimization
./scripts/execute-track.sh track-a "Task 41: Optimization"

# Track C: Security hardening
./scripts/execute-track.sh track-c "Task 38: Security"

# Track E: Monitoring + CDN
./scripts/execute-track.sh track-e "Tasks 39-40: Monitoring + CDN"

# Track D: Performance + Security testing
./scripts/execute-track.sh track-d "Tasks 34-35: Quality + Perf"

# All parallel, no dependencies
```

**Checkpoint 7 (Week 6 EOD)**:

- Performance targets met (<2 min processing)
- Security audit passed
- Monitoring operational
- **Validation**: Load test 100+ concurrent jobs

---

### Week 8: Launch (Sequential Validation)

**Final Validation Pipeline**

```bash
# Task 49: Quickstart validation
./scripts/validate-quickstart.sh

# Task 50: Production smoke tests
./scripts/production-smoke-tests.sh

# Task 51: Load testing
./scripts/load-test.sh --concurrent-jobs=100 --duration=1h

# Task 52: Security audit
./scripts/security-audit.sh

# Task 53: Launch readiness review
./scripts/launch-readiness.sh
```

**Launch Checklist**:

- [ ] All 53 tasks completed
- [ ] 80%+ test coverage across all components
- [ ] Zero mocked services in production code
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Documentation complete
- [ ] Monitoring operational
- [ ] Rollback plan tested

---

## Agent Delegation Commands

### Starting Parallel Execution

```bash
# Activate Chief Agent for orchestration
Chief: Assess complexity and route work for self-hosted Demucs implementation

# Delegate to specialized agents
Software Engineer: Implement backend infrastructure (Track A Tasks 1-18)
Software Engineer (Frontend): Implement frontend integration (Track B Tasks 25-31)
Architect: Design and validate API contracts (Track C Tasks 19-24)
QA Engineer: Develop comprehensive test strategy (Track D Tasks 7-37)
Platform Engineer: Set up CI/CD and deployment (Track E Tasks 5-48)
Security Engineer: Audit and secure the system (Tasks 38, 52)
ML Engineer: Deploy and optimize Demucs models (Tasks 6, 16)
```

### Checkpoint Commands

```bash
# Save checkpoint at phase gate
/s:checkpoint phase-2-services-complete

# Resume from checkpoint if needed
/s:resume phase-2-services-complete

# Status across all tracks
Chief: Report status across all parallel tracks
```

---

## Logging & Observability

### Structured Logging (All Tracks)

```python
# backend/core/logging.py
import structlog
from pythonjsonlogger import jsonlogger

def setup_logging():
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer()
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

# Usage in every service
logger = structlog.get_logger(__name__)

logger.info(
    "service_operation",
    operation="stem_separation",
    job_id=job_id,
    model=model,
    duration_ms=duration * 1000,
    input_size_bytes=input_size,
    output_stems=["vocals", "drums", "bass", "other"]
)
```

### OpenTelemetry Tracing

```python
# backend/core/tracing.py
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

def setup_tracing():
    trace.set_tracer_provider(TracerProvider())
    trace.get_tracer_provider().add_span_processor(
        BatchSpanProcessor(OTLPSpanExporter())
    )

# Every operation traced
@tracer.start_as_current_span("process_job")
def process_job(job_id: str):
    span = trace.get_current_span()
    span.set_attribute("job.id", job_id)
    # ... processing ...
```

### Prometheus Metrics

```python
# backend/core/metrics.py
from prometheus_client import Counter, Histogram, Gauge

# Key metrics
jobs_total = Counter("demucs_jobs_total", "Total jobs processed", ["status"])
processing_duration = Histogram("demucs_processing_seconds", "Processing time", ["model"])
active_jobs = Gauge("demucs_active_jobs", "Currently processing jobs")
model_load_duration = Histogram("demucs_model_load_seconds", "Model loading time", ["model"])

# Usage
with processing_duration.labels(model="htdemucs").time():
    result = separate_stems(audio_path, model)
jobs_total.labels(status="success").inc()
```

---

## Code Quality Enforcement

### Pre-Commit Hooks

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/psf/black
    rev: 23.10.0
    hooks:
      - id: black
        language_version: python3.9

  - repo: https://github.com/PyCQA/flake8
    rev: 6.1.0
    hooks:
      - id: flake8
        args: ["--max-line-length=100", "--extend-ignore=E203"]

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.6.0
    hooks:
      - id: mypy
        additional_dependencies: [types-all]

  - repo: local
    hooks:
      - id: pytest-coverage
        name: pytest with coverage
        entry: pytest --cov=backend --cov-fail-under=80
        language: system
        pass_filenames: false
        always_run: true
```

### CI/CD Gates

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run backend tests
        run: |
          pytest --cov=backend --cov-fail-under=80 --cov-report=xml

      - name: Run frontend tests
        run: |
          npm test -- --coverage --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80,"statements":80}}'

      - name: Security scan
        run: |
          docker run --rm -v $(pwd):/zap/wrk owasp/zap2docker-stable zap-baseline.py -t http://localhost:8000

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage.xml
          fail_ci_if_error: true
```

---

## Success Validation

### Final Verification Script

```bash
#!/bin/bash
# scripts/validate-production-ready.sh

set -e

echo "=== Production Readiness Validation ==="

# 1. No mocks in production code
echo "Checking for mock implementations..."
if grep -r "mock" app/src --exclude-dir=__tests__ | grep -v "test"; then
    echo "❌ Found mock implementations in production code"
    exit 1
fi
echo "✅ No mocks in production code"

# 2. Test coverage
echo "Checking test coverage..."
pytest --cov=backend --cov-fail-under=80
npm test -- --coverage --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80,"statements":80}}'
echo "✅ Test coverage meets 80%+ threshold"

# 3. Performance benchmarks
echo "Running performance tests..."
pytest tests/performance/test_benchmarks.py
echo "✅ Performance targets met"

# 4. Security audit
echo "Running security audit..."
safety check
bandit -r backend/
echo "✅ Security audit passed"

# 5. Integration tests
echo "Running integration tests..."
pytest tests/integration/
npm run test:e2e
echo "✅ All integration tests passed"

# 6. Production smoke test
echo "Testing production deployment..."
docker-compose -f docker-compose.prod.yml up -d
sleep 10
curl -f http://localhost/health || exit 1
echo "✅ Production deployment healthy"

echo "=== ✅ ALL VALIDATION PASSED ==="
```

---

## Execution Commands

### Start Parallel Execution

```bash
# Phase 0: Foundation (Week 1)
/s:implement --phase=0 --tracks=A,B,D,E --parallel

# Phase 1-2: Core Services (Week 2-3)
/s:implement --phase=1-2 --tracks=A,D --parallel

# Phase 3-4: API + Frontend (Week 4-5)
/s:implement --phase=3-4 --tracks=B,C,D --parallel --sync-daily

# Phase 5-6: Testing + Hardening (Week 6-7)
/s:implement --phase=5-6 --tracks=A,B,C,D,E --parallel

# Phase 7-8: Launch (Week 8)
/s:implement --phase=7-8 --sequential --validation
```

### Continuous Monitoring

```bash
# Watch all track progress
watch -n 5 './scripts/track-status.sh'

# View logs from all tracks
tail -f logs/track-*.log | grep -E "ERROR|WARN|INFO"

# Monitor test coverage
watch -n 10 'pytest --cov=backend --cov-report=term-missing | tail -20'
```

---

## Ready for Execution

**All tracks configured. All agents briefed. Zero mocks. Production ready.**

Do you want to:

1. **Start Phase 0 immediately** (Foundation setup - all parallel)
2. **Review specific track details** before starting
3. **Adjust team assignments** or track configuration
4. **Begin with a specific track** as proof of concept
