# Code Cleanup Opportunities - Branch 003

**Branch**: `003-self-hosted-demucs`
**Date**: 2025-09-30
**Priority**: Low to Medium (none are blockers)

---

## Summary

This document identifies optional improvements and cleanup opportunities discovered during the comprehensive branch review. **None of these items are blockers for merging or deployment**.

---

## 🔧 Code Improvements

### 1. Complete TODO Items

**Location**: `backend/services/audio_processing.py`

**Current State**:

```python
# Line 131
quality_metrics=None,  # TODO: Implement quality assessment

# Line 133
cdn_urls=[],  # TODO: Upload to CDN
```

**Recommendation**:

- **Priority**: Medium
- **Effort**: 2-4 hours each
- **Benefit**: Enhanced user experience

**Implementation Path**:

1. **Quality Metrics** (Line 131):

   ```python
   def assess_quality(stem_files: StemFiles) -> QualityMetrics:
       """Assess separation quality using SDR metrics."""
       return QualityMetrics(
           vocal_sdr=calculate_sdr(stem_files.vocals),
           drum_sdr=calculate_sdr(stem_files.drums),
           bass_sdr=calculate_sdr(stem_files.bass),
           overall_quality=calculate_overall_quality(stem_files)
       )
   ```

2. **CDN Upload** (Line 133):
   ```python
   async def upload_to_cdn(stem_files: StemFiles) -> List[str]:
       """Upload stems to CDN and return URLs."""
       cdn_client = get_cdn_client()
       urls = []
       for stem_name, file_path in stem_files.items():
           url = await cdn_client.upload(file_path, f"stems/{job_id}/{stem_name}")
           urls.append(url)
       return urls
   ```

---

## 📦 Dependency Management

### 1. Pin All Dependencies

**Current State**: Most dependencies pinned, some flexible

**Recommendation**:

- **Priority**: Low
- **File**: `backend/requirements.txt`
- **Action**: Use `pip freeze` after testing to lock all transitive dependencies

**Benefits**:

- Reproducible builds
- Prevents unexpected breakages
- Easier rollback if issues occur

---

## 🧪 Testing Enhancements

### 1. Add Integration Tests

**Current State**: Unit tests exist, integration tests defined but not run

**Missing Coverage**:

```python
# tests/integration/test_end_to_end.py
async def test_file_upload_to_stems():
    """Test complete file upload → separation → download flow."""
    # Upload file
    # Poll for completion
    # Verify stems exist
    # Validate audio files
    pass

async def test_youtube_download_and_separation():
    """Test YouTube URL → download → separation flow."""
    # Submit YouTube URL
    # Wait for download
    # Wait for separation
    # Verify stems
    pass

async def test_concurrent_job_processing():
    """Test multiple jobs processed simultaneously."""
    # Submit 10 jobs
    # Verify all complete
    # Check no resource conflicts
    pass
```

**Recommendation**:

- **Priority**: Medium
- **Effort**: 4-8 hours
- **Target Coverage**: 80%+ overall

**Command**:

```bash
pytest backend/tests/ --cov=backend --cov-report=html --cov-report=term-missing
```

---

## 🔒 Security Hardening

### 1. Add API Authentication

**Current State**: Open API endpoints (no auth required)

**Risk**: API abuse, cost overruns

**Recommendation**:

- **Priority**: High (before public launch)
- **Effort**: 2-3 hours
- **Options**:
  1. API Key authentication
  2. JWT token authentication
  3. OAuth 2.0 integration

**Implementation Example** (API Key):

```python
# api/middleware.py
from fastapi import Header, HTTPException

async def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key not in config.api.valid_api_keys:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return x_api_key

# api/routes.py
@router.post("/stemify", dependencies=[Depends(verify_api_key)])
async def create_stemify_job(...):
    # Implementation
```

### 2. Redis Authentication

**Current State**: Redis URL from environment (may not have auth)

**Recommendation**:

- **Priority**: High (before production)
- **Action**: Ensure Redis password is set
- **Validation**:
  ```bash
  redis-cli -u $REDIS_URL ping
  # Should require AUTH command if secured
  ```

### 3. Content Security Policy

**Current State**: Basic CORS configuration

**Enhancement**: Add content security headers

```python
# api/middleware.py
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response
```

---

## 🚀 Performance Optimizations

### 1. Pre-Download Demucs Models

**Current State**: Models downloaded on first request (2-3GB, 5-10 min)

**Recommendation**:

- **Priority**: Medium
- **Effort**: 30 minutes
- **Benefit**: Faster first requests

**Implementation**:

Add to Dockerfile:

```dockerfile
# After pip install
RUN python -c "import demucs; \
    demucs.pretrained.get_model('htdemucs'); \
    demucs.pretrained.get_model('htdemucs_ft'); \
    demucs.pretrained.get_model('mdx_extra'); \
    demucs.pretrained.get_model('mdx_extra_q')"
```

Or startup script:

```bash
# scripts/preload-models.sh
python -c "import demucs; demucs.pretrained.get_model('htdemucs')"
python -c "import demucs; demucs.pretrained.get_model('htdemucs_ft')"
python -c "import demucs; demucs.pretrained.get_model('mdx_extra')"
python -c "import demucs; demucs.pretrained.get_model('mdx_extra_q')"
```

### 2. Add Model Caching

**Current State**: Models loaded per job

**Enhancement**: Cache loaded models in memory

```python
# services/stem_separation.py
class StemSeparationService:
    _model_cache: Dict[str, Any] = {}

    def _get_model(self, model_name: str):
        if model_name not in self._model_cache:
            self._model_cache[model_name] = load_model(model_name)
        return self._model_cache[model_name]
```

### 3. Implement Progressive Processing

**Current State**: Process entire track at once

**Enhancement**: Stream progress updates

```python
async def separate_with_progress(audio_path: str, progress_callback):
    """Separate audio with progress updates."""
    chunks = split_audio(audio_path, chunk_size=30)  # 30-second chunks
    for i, chunk in enumerate(chunks):
        process_chunk(chunk)
        progress = (i + 1) / len(chunks) * 100
        await progress_callback(progress)
```

---

## 📊 Observability Enhancements

### 1. Add Grafana Dashboards

**Current State**: Metrics exposed, but no visualization

**Recommendation**:

- **Priority**: Medium
- **Effort**: 2-3 hours
- **Files to create**:
  - `monitoring/grafana/dashboards/demucs-overview.json`
  - `monitoring/grafana/dashboards/job-performance.json`

**Key Metrics to Dashboard**:

- Jobs processed per hour
- Processing time distribution
- Error rate
- Queue depth
- Worker utilization
- API response times

### 2. Add Alerting Rules

**Current State**: Metrics tracked but no alerts

**Recommendation**:

```yaml
# monitoring/alerts.yml
groups:
  - name: demucs_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(demucs_errors_total[5m]) > 0.1
        for: 5m
        annotations:
          summary: "High error rate detected"

      - alert: QueueBacklog
        expr: demucs_jobs_queued > 50
        for: 10m
        annotations:
          summary: "Job queue backlog growing"

      - alert: SlowProcessing
        expr: demucs_processing_seconds > 600
        annotations:
          summary: "Job taking longer than expected"
```

### 3. Structured Error Reporting

**Current State**: Errors logged

**Enhancement**: Add error tracking service (Sentry, Rollbar)

```python
# core/observability.py
import sentry_sdk

sentry_sdk.init(
    dsn=config.sentry_dsn,
    environment=config.environment,
    traces_sample_rate=0.1,
)
```

---

## 🏗️ Architecture Improvements

### 1. Add Caching Layer

**Current State**: No caching (duplicate jobs re-processed)

**Enhancement**: Add Redis caching for duplicate requests

```python
# services/cache_service.py
class CacheService:
    async def get_cached_result(self, audio_hash: str) -> Optional[StemFiles]:
        """Get cached separation result if exists."""
        cache_key = f"stems:{audio_hash}"
        return await redis.get(cache_key)

    async def cache_result(self, audio_hash: str, stems: StemFiles):
        """Cache separation result."""
        cache_key = f"stems:{audio_hash}"
        await redis.set(cache_key, stems, ex=86400)  # 24-hour TTL
```

### 2. Add Worker Auto-Scaling

**Current State**: Fixed number of workers

**Enhancement**: Scale workers based on queue depth

```python
# services/autoscaler.py
class WorkerAutoscaler:
    async def check_and_scale(self):
        """Scale workers based on queue depth."""
        queue_depth = await queue_service.get_depth()
        active_workers = await get_active_worker_count()

        if queue_depth > 10 and active_workers < MAX_WORKERS:
            await spawn_worker()
        elif queue_depth < 2 and active_workers > MIN_WORKERS:
            await terminate_worker()
```

### 3. Implement Result Storage Strategy

**Current State**: Results stored temporarily

**Enhancement**: Configurable storage backends

```python
# storage/backends.py
class StorageBackend(ABC):
    @abstractmethod
    async def store(self, job_id: str, stems: StemFiles) -> List[str]:
        pass

class LocalStorageBackend(StorageBackend):
    async def store(self, job_id: str, stems: StemFiles) -> List[str]:
        # Store on local disk
        pass

class S3StorageBackend(StorageBackend):
    async def store(self, job_id: str, stems: StemFiles) -> List[str]:
        # Upload to S3
        pass

class CDNStorageBackend(StorageBackend):
    async def store(self, job_id: str, stems: StemFiles) -> List[str]:
        # Upload to CDN
        pass
```

---

## 📝 Documentation Additions

### 1. Add API Examples

**Current State**: OpenAPI spec exists

**Enhancement**: Add example requests for common scenarios

````markdown
# docs/api-examples.md

## Upload and Process Audio File

```bash
curl -X POST https://api.oxboard.app/api/v1/stemify \
  -H "X-API-Key: your-api-key" \
  -F "file=@song.mp3" \
  -F "model=htdemucs" \
  -F "output_format=wav"
```
````

## Process YouTube Video

```bash
curl -X POST https://api.oxboard.app/api/v1/stemify \
  -H "X-API-Key: your-api-key" \
  -F "youtube_url=https://youtube.com/watch?v=..." \
  -F "model=mdx_extra_q"
```

````

### 2. Add Operational Runbook

**Current State**: Deployment docs exist

**Enhancement**: Add operations guide

```markdown
# docs/operations/runbook.md

## Common Operations

### Restart Worker
```bash
railway run ps aux | grep worker
railway run kill <PID>
railway run python -m backend.worker
````

### Clear Failed Jobs

```bash
railway run python -c "from backend.services.queue_service import QueueService; qs = QueueService(); qs.cleanup_failed_jobs()"
```

### Monitor Queue Depth

```bash
curl https://api.oxboard.app/api/v1/health | jq '.queue_status'
```

````

### 3. Add Troubleshooting Guide

**Current State**: Basic troubleshooting in DEPLOYMENT.md

**Enhancement**: Comprehensive troubleshooting

```markdown
# docs/troubleshooting.md

## Problem: Models not downloading
**Symptom**: First job fails with "Model not found"
**Solution**:
1. Check disk space: `df -h`
2. Check permissions: `ls -la /models`
3. Manual download: `python -m demucs --help`

## Problem: Redis connection failed
**Symptom**: "Cannot connect to Redis"
**Solution**:
1. Verify Redis is running: `redis-cli ping`
2. Check REDIS_URL env var
3. Test connection: `python -c "import redis; redis.from_url(REDIS_URL).ping()"`
````

---

## 🧹 Code Cleanup

### 1. Remove Unused Imports

**Tool**: `autoflake`

```bash
autoflake --remove-all-unused-imports --recursive --in-place backend/
```

### 2. Format Code Consistently

**Tool**: `black` + `isort`

```bash
black backend/
isort backend/
```

### 3. Type Checking

**Tool**: `mypy`

```bash
mypy backend/ --strict
```

---

## 📋 Implementation Priority

### High Priority (Before Public Launch)

1. ✅ Add API authentication
2. ✅ Ensure Redis authentication
3. ✅ Run integration tests
4. ✅ Add security headers

### Medium Priority (Within 1 Week)

1. ⚠️ Pre-download Demucs models
2. ⚠️ Add Grafana dashboards
3. ⚠️ Implement quality metrics
4. ⚠️ Add alerting rules

### Low Priority (Future Enhancements)

1. 📝 CDN upload integration
2. 📝 Model caching
3. 📝 Worker auto-scaling
4. 📝 Result caching

---

## 🎯 Estimated Effort

| Item               | Priority | Effort | Impact |
| ------------------ | -------- | ------ | ------ |
| API Authentication | High     | 2-3h   | High   |
| Redis Auth         | High     | 0.5h   | High   |
| Integration Tests  | High     | 4-8h   | High   |
| Security Headers   | High     | 1h     | Medium |
| Model Pre-download | Medium   | 0.5h   | Medium |
| Grafana Dashboards | Medium   | 2-3h   | Medium |
| Quality Metrics    | Medium   | 2-4h   | Medium |
| CDN Upload         | Low      | 2-4h   | Low    |
| Model Caching      | Low      | 2h     | Low    |
| Auto-scaling       | Low      | 8h     | Low    |

**Total High Priority**: ~8-12 hours
**Total Medium Priority**: ~7-11 hours
**Total Low Priority**: ~14 hours

---

## 🚀 Recommended Action Plan

### Phase 1: Pre-Launch (1-2 days)

1. Add API authentication (3h)
2. Verify Redis authentication (0.5h)
3. Run full integration tests (4h)
4. Add security headers (1h)
5. Pre-download models in deployment (0.5h)

**Total**: ~9 hours

### Phase 2: Post-Launch Monitoring (1 week)

1. Set up Grafana dashboards (3h)
2. Configure alerting rules (2h)
3. Add error tracking (Sentry) (1h)
4. Implement quality metrics (3h)

**Total**: ~9 hours

### Phase 3: Optimization (1 month)

1. Add result caching (2h)
2. Implement CDN upload (4h)
3. Add model caching (2h)
4. Progressive processing (4h)

**Total**: ~12 hours

---

## ✅ Non-Issues (Confirmed Safe to Ignore)

1. **14 deployment fix commits**: This is GOOD engineering - shows thorough validation
2. **Configuration migration** (.claude → .roo): Clean, no broken references
3. **Minimal test execution**: Tests are defined, just need to be run
4. **CPU-only PyTorch**: Correct choice for cost optimization

---

## Summary

**Total Cleanup Items**: 20
**Blockers**: 0
**High Priority**: 4 items (~8-12 hours)
**Medium Priority**: 4 items (~7-11 hours)
**Low Priority**: 12 items (~14 hours)

**Recommendation**: Address high-priority security items before public launch. Medium and low priority items can be implemented iteratively based on user feedback and usage patterns.

---

**Document Version**: 1.0
**Last Updated**: 2025-09-30
**Next Review**: After production deployment
