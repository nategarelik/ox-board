# Self-Hosted Demucs Implementation Specification

## Executive Summary

Replace mock stem separation with production-ready self-hosted Demucs backend that provides real AI-powered audio stem separation with YouTube integration and advanced audio processing capabilities.

### Current State

- `/api/stemify` returns silent audio placeholders only
- `DemucsProcessor` has interface but no real implementation
- All stems load silent audio via `/api/silent-audio`
- Mock waveforms and demo tracks throughout

### Target State

- Production-ready Demucs backend with real stem separation
- YouTube URL processing and download capability
- Multiple model options for quality/speed tradeoffs
- Job queue system for scalable processing
- Real-time progress tracking

## Architecture Overview

### Core Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js API   │───▶│   Python API    │───▶│   Demucs        │
│   Endpoints     │    │   Service       │    │   Engine        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   YouTube       │    │   Audio         │    │   File          │
│   Downloader    │    │   Processing    │    │   Management    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Implementation Details

### Backend File Structure

```
/backend/
├── core/
│   ├── __init__.py
│   ├── config.py              # Configuration management
│   ├── exceptions.py          # Custom exceptions
│   └── logging.py             # Structured logging
├── api/
│   ├── __init__.py
│   ├── routes.py              # FastAPI route definitions
│   ├── dependencies.py        # Dependency injection
│   └── middleware.py          # Request/response middleware
├── services/
│   ├── __init__.py
│   ├── stem_separation.py     # Demucs wrapper service
│   ├── youtube_service.py     # YouTube download service
│   ├── audio_processing.py    # Audio file processing
│   └── queue_service.py       # Job queue management
├── models/
│   ├── __init__.py
│   ├── job.py                 # Job model definitions
│   ├── audio.py               # Audio processing models
│   └── response.py            # API response models
├── utils/
│   ├── __init__.py
│   ├── audio_utils.py         # Audio processing utilities
│   ├── file_utils.py          # File system operations
│   └── validation.py          # Input validation
└── tests/
    ├── __init__.py
    ├── test_api.py            # API endpoint tests
    ├── test_services.py       # Service layer tests
    └── test_utils.py          # Utility function tests
```

### Python Dependencies

```txt
fastapi==0.104.1
uvicorn==0.24.0
python-multipart==0.0.6
pydub==0.25.1
yt-dlp==2023.11.16
torch==2.1.0
torchaudio==2.1.0
demucs==4.0.0
librosa==0.10.1
numpy==1.25.2
pillow==10.0.1
aiofiles==23.2.1
celery==5.3.4
redis==5.0.1
pydantic==2.5.0
pydantic-settings==2.1.0
structlog==23.2.0
pytest==7.4.3
pytest-asyncio==0.21.1
httpx==0.25.2
```

## Core Services

### 1. Demucs Integration Service

```python
# /backend/services/stem_separation.py
class DemucsService:
    def __init__(self, model_path: str = "/models/demucs"):
        self.model_path = model_path
        self.models = {
            'htdemucs': 'htdemucs_6s',
            'htdemucs_ft': 'htdemucs_ft_6s',
            'mdx_extra': 'mdx_extra',
            'mdx_extra_q': 'mdx_extra_q'
        }

    async def separate_audio(
        self,
        audio_path: str,
        output_dir: str,
        model: str = 'htdemucs',
        **kwargs
    ) -> Dict[str, str]:
        """Separate audio into stems using Demucs"""
        # Implementation details
```

### 2. YouTube Download Service

```python
# /backend/services/youtube_service.py
class YouTubeService:
    def __init__(self, download_dir: str = "/tmp/downloads"):
        self.download_dir = download_dir
        self.ytdlp_options = {
            'format': 'bestaudio[ext=m4a]/bestaudio[ext=mp3]/best[ext=mp3]',
            'outtmpl': f'{download_dir}/%(id)s.%(ext)s',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
        }
```

### 3. Job Queue System

```python
# /backend/services/queue_service.py
class QueueService:
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_client = redis.from_url(redis_url)
        self.queue_name = "stem_separation"

    async def enqueue_job(
        self,
        job_type: str,
        payload: Dict[str, Any]
    ) -> str:
        """Add job to processing queue"""
        # Implementation details
```

## API Endpoints

### Stem Separation Endpoint

- **POST** `/api/stemify`
- Accepts file upload or YouTube URL
- Returns job ID for tracking
- Supports model selection

### Job Status Endpoint

- **GET** `/api/jobs/{job_id}`
- Returns current job status and progress
- Provides stem URLs when complete

## Frontend Integration

### Updated API Service

```typescript
// /app/services/aiStemService.ts
export async function requestStemSeparation(
  payload: StemifyPayload | { youtubeUrl: string },
): Promise<StemifyResponse> {
  const formData = new FormData();

  if ("youtubeUrl" in payload) {
    formData.append("youtube_url", payload.youtubeUrl);
  } else {
    formData.append("file", payload.file);
  }

  const response = await fetch("/api/stemify", {
    method: "POST",
    body: formData,
  });

  return response.json();
}
```

### Progress Tracking Hook

```typescript
// /app/hooks/useStemSeparation.ts
export function useStemSeparation() {
  const [jobs, setJobs] = useState<Map<string, JobStatus>>(new Map());

  const pollJobStatus = useCallback(async (jobId: string) => {
    const response = await fetch(`/api/jobs/${jobId}`);
    const status = await response.json();
    setJobs((prev) => new Map(prev.set(jobId, status)));
    return status;
  }, []);

  return { jobs, pollJobStatus };
}
```

## Quality & Performance Options

### Model Selection

- **htdemucs**: Best quality, slower processing
- **htdemucs_ft**: Fine-tuned version, balanced quality/speed
- **mdx_extra**: Fast processing, good quality
- **mdx_extra_q**: Quick processing, acceptable quality

### Processing Options

```typescript
interface StemSeparationOptions {
  model: "htdemucs" | "htdemucs_ft" | "mdx_extra" | "mdx_extra_q";
  quality: "fast" | "balanced" | "best";
  outputFormat: "wav" | "mp3" | "flac";
  normalize: boolean;
  removeVocals: boolean; // For karaoke mode
}
```

## Security & Scaling

### Security Measures

- File type validation: Only allow audio formats
- Size limits: Max 50MB per file
- Rate limiting: 5 jobs per hour per IP
- Content scanning: Basic audio content validation
- YouTube safety: Block known copyrighted content

### Performance Optimization

- Redis queue for job distribution
- GPU acceleration with CUDA support
- Batch processing for multiple jobs
- Caching for common model outputs
- CDN integration for serving processed stems

## Monitoring & Analytics

### Metrics Collection

```python
# /backend/core/logging.py
async def track_job_metrics(job_id: str, metrics: Dict[str, Any]):
    """Track processing metrics for analytics"""
    await analytics.track('stem_separation', {
        'job_id': job_id,
        'processing_time': metrics['duration'],
        'model_used': metrics['model'],
        'input_format': metrics['input_format'],
        'output_size': metrics['output_size'],
        'success': metrics['success']
    })
```

## Deployment Strategy

### Phase 1: Core Implementation (Week 1-2)

1. Set up Python backend with FastAPI
2. Install and configure Demucs
3. Implement basic file upload processing
4. Add Redis job queue

### Phase 2: YouTube Integration (Week 3)

1. Add YouTube download capability
2. Implement content validation
3. Add URL processing endpoint

### Phase 3: Advanced Features (Week 4)

1. Add model selection options
2. Implement progress tracking
3. Add batch processing
4. Performance optimization

### Phase 4: Production Hardening (Week 5)

1. Security hardening
2. Monitoring and logging
3. Error handling improvements
4. Documentation

## Cost Analysis

### Infrastructure Costs (Monthly)

- Server: $50-100 (GPU-enabled instance)
- Storage: $20 (50GB for models + temp files)
- Redis: $15 (managed Redis instance)
- CDN: $10 (for serving processed audio)
- **Total**: ~$100-150/month

### Processing Costs

- Demucs models: Free (open source)
- YouTube downloads: Free (yt-dlp)
- Storage per job: ~50MB × job volume
- Network bandwidth: Minimal for API calls

## Performance Benchmarks

### Processing Times

- Simple track (3-4 min): 30-60 seconds
- Complex track (5-7 min): 1-2 minutes
- Long track (10+ min): 2-4 minutes

### Quality Metrics

- Vocal isolation: 85-95% accuracy
- Drum separation: 80-90% accuracy
- Bass isolation: 75-85% accuracy
- Artifact reduction: Significant improvement over mock

## Success Criteria

1. **Functional**: Real stem separation works end-to-end
2. **Quality**: Better than 80% accuracy on test tracks
3. **Performance**: <2 minutes processing time for average tracks
4. **Scalability**: Handle 100+ concurrent jobs
5. **Reliability**: <1% failure rate in production

## Technical Requirements

### System Requirements

- Python 3.9+
- 8GB RAM minimum (16GB recommended)
- GPU with CUDA support (optional but recommended)
- 20GB storage for models and temp files

### Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Risk Assessment

### Technical Risks

- Model download size (2-3GB per model)
- GPU memory requirements for processing
- Network latency for large file uploads

### Mitigation Strategies

- Progressive model loading
- Chunked file upload support
- Client-side file validation
- Graceful degradation to CPU processing

## Testing Strategy

### Unit Tests

- Service layer logic
- File validation
- Queue operations
- API endpoints

### Integration Tests

- End-to-end stem separation
- YouTube download and processing
- Job status tracking
- Error handling

### Performance Tests

- Concurrent job processing
- Large file handling
- Memory usage under load
- Response time benchmarks

## Documentation Requirements

### API Documentation

- OpenAPI/Swagger specification
- Example requests and responses
- Error code reference
- Rate limit documentation

### User Documentation

- Upload instructions
- YouTube URL format guide
- Model selection guide
- Troubleshooting guide

### Developer Documentation

- Setup instructions
- Configuration guide
- Deployment guide
- Contribution guidelines

## Appendix

### Configuration Example

```yaml
# config.yaml
demucs:
  models_path: /models/demucs
  default_model: htdemucs
  max_file_size: 52428800 # 50MB

youtube:
  download_dir: /tmp/downloads
  max_duration: 600 # 10 minutes

redis:
  url: redis://localhost:6379

api:
  rate_limit: 5
  rate_limit_period: 3600 # 1 hour
```

### Environment Variables

```env
DEMUCS_MODEL_PATH=/models/demucs
REDIS_URL=redis://localhost:6379
YOUTUBE_DOWNLOAD_DIR=/tmp/downloads
MAX_FILE_SIZE=52428800
RATE_LIMIT=5
RATE_LIMIT_PERIOD=3600
LOG_LEVEL=INFO
```

This specification provides a complete roadmap for implementing production-ready stem separation with self-hosted Demucs, replacing all mock implementations with real AI-powered audio processing capabilities.
