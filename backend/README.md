# OX Board Demucs Backend

Self-hosted stem separation backend using Demucs for high-quality audio source separation.

## Features

- **Multiple Demucs Models**: htdemucs, htdemucs_ft, mdx_extra, mdx_extra_q
- **YouTube Integration**: Direct audio extraction from YouTube URLs
- **Job Queue System**: Redis-based queue with Celery for distributed processing
- **Real-time Progress**: WebSocket-compatible progress tracking
- **Observability**: Prometheus metrics, OpenTelemetry tracing, structured logging
- **Production Ready**: Error handling, rate limiting, health checks

## Architecture

```
┌─────────────┐
│  FastAPI    │  HTTP API for job management
│  Routes     │
└──────┬──────┘
       │
┌──────▼──────────────────────────────────┐
│  Audio Processing Service                │
│  (Orchestrates pipeline)                 │
└──────┬──────────────────────────────────┘
       │
       ├──► Queue Service (Redis)
       ├──► Stem Separation Service (Demucs)
       └──► YouTube Service (yt-dlp)
```

## Installation

### Prerequisites

- Python 3.9+
- Redis server
- FFmpeg
- GPU (optional but recommended for performance)

### Setup

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Install system dependencies:

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y ffmpeg redis-server

# macOS
brew install ffmpeg redis
```

3. Download Demucs models:

```bash
python -m demucs --model htdemucs
python -m demucs --model htdemucs_ft
```

4. Configure environment:

```bash
cp .env.example .env
# Edit .env with your configuration
```

## Configuration

Environment variables (see `.env.example`):

```bash
# Application
ENVIRONMENT=production
LOG_LEVEL=INFO
DEBUG=false

# Server
HOST=0.0.0.0
PORT=8000

# Demucs
DEMUCS_MODELS_PATH=/models/demucs
DEMUCS_DEFAULT_MODEL=htdemucs
DEMUCS_GPU_ENABLED=true
DEMUCS_MAX_FILE_SIZE=52428800  # 50MB
DEMUCS_MAX_DURATION=600  # 10 minutes

# Redis
REDIS_URL=redis://localhost:6379
REDIS_DB=0

# YouTube
YOUTUBE_DOWNLOAD_DIR=/tmp/downloads
YOUTUBE_MAX_DURATION=600

# API
API_RATE_LIMIT=5
API_RATE_LIMIT_PERIOD=3600
API_CORS_ORIGINS=["*"]

# Observability
OBSERVABILITY_PROMETHEUS_PORT=9090
OBSERVABILITY_ENABLE_TRACING=true
```

## Running

### Development

Start API server:

```bash
python -m backend.main
```

Start worker:

```bash
python -m backend.worker
```

### Production

Use Gunicorn with Uvicorn workers:

```bash
gunicorn backend.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000
```

Start multiple workers:

```bash
# Terminal 1
python -m backend.worker

# Terminal 2
python -m backend.worker

# Terminal 3
python -m backend.worker
```

### Docker

```bash
docker build -t oxboard-demucs-backend .
docker run -p 8000:8000 oxboard-demucs-backend
```

## API Endpoints

### POST /api/v1/stemify

Create stem separation job from file upload or YouTube URL.

**Request (File Upload):**

```bash
curl -X POST http://localhost:8000/api/v1/stemify \
  -F "file=@audio.mp3" \
  -F "model=htdemucs" \
  -F "output_format=wav"
```

**Request (YouTube):**

```bash
curl -X POST http://localhost:8000/api/v1/stemify \
  -F "youtube_url=https://youtube.com/watch?v=..." \
  -F "model=htdemucs"
```

**Response:**

```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "estimated_duration": 120,
  "message": "Job created successfully"
}
```

### GET /api/v1/jobs/{job_id}

Get job status and results.

**Response:**

```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "progress": 100,
  "result": {
    "stems": {
      "vocals": {...},
      "drums": {...},
      "bass": {...},
      "other": {...}
    },
    "processing_time": 95
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:31:35Z"
}
```

### DELETE /api/v1/jobs/{job_id}

Delete job and cleanup results.

### GET /api/v1/health

Health check endpoint.

**Response:**

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "models_available": ["htdemucs", "htdemucs_ft", "mdx_extra"],
  "queue_status": {
    "active_jobs": 3,
    "queued_jobs": 12,
    "workers_available": 4
  }
}
```

## Testing

Run tests:

```bash
pytest backend/tests/
```

Run with coverage:

```bash
pytest backend/tests/ --cov=backend --cov-report=html
```

## Monitoring

### Prometheus Metrics

Available at `http://localhost:9090/metrics`:

- `demucs_jobs_total` - Total jobs processed
- `demucs_jobs_active` - Currently processing jobs
- `demucs_processing_seconds` - Processing duration histogram
- `demucs_api_requests_total` - API request counter
- `demucs_errors_total` - Error counter

### Logs

Structured JSON logs in production:

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "info",
  "event": "job_processing_completed",
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "duration": 95.3,
  "model": "htdemucs"
}
```

## Performance

### Benchmarks (htdemucs model)

| Duration | CPU (4 cores) | GPU (NVIDIA T4) |
| -------- | ------------- | --------------- |
| 3 min    | ~180s         | ~45s            |
| 5 min    | ~300s         | ~75s            |
| 10 min   | ~600s         | ~150s           |

### Resource Requirements

- **CPU Mode**: 4GB RAM, 4 CPU cores
- **GPU Mode**: 8GB VRAM (NVIDIA GPU), 8GB RAM
- **Storage**: ~10x input file size during processing

## Troubleshooting

### Models not found

```bash
python -m demucs --help
python -m demucs --model htdemucs
```

### GPU not detected

```bash
python -c "import torch; print(torch.cuda.is_available())"
```

### Redis connection failed

```bash
redis-cli ping
# Should return: PONG
```

## License

MIT License - see LICENSE file for details.
