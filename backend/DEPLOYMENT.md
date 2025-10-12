# OX Board Backend Deployment Guide

## Railway Deployment (Recommended)

Railway is the recommended platform for deploying the OX Board Demucs backend due to its simplicity, built-in Redis support, and containerized deployments.

### Prerequisites

1. Railway account ([railway.app](https://railway.app))
2. Railway CLI installed (optional but recommended)
   ```bash
   npm install -g @railway/cli
   ```
3. GitHub repository connected to Railway

### Deployment Steps

#### Option A: Deploy via Railway Dashboard (Easiest)

1. **Create New Project**
   - Go to [railway.app/new](https://railway.app/new)
   - Click "Deploy from GitHub repo"
   - Select `nategarelik/ox-board` repository
   - Railway will detect the Dockerfile automatically

2. **Configure Root Directory**
   - In Project Settings → Service Settings
   - Set "Root Directory" to `backend`
   - This ensures Railway builds from the correct Dockerfile location

3. **Add Redis Service**
   - Click "New Service" in your project
   - Select "Redis" from the templates
   - Railway will provision a Redis instance
   - Note the `REDIS_URL` environment variable (auto-configured)

4. **Configure Environment Variables**

   Go to Service Settings → Variables and add:

   ```bash
   # Application
   APP_NAME=OX Board Demucs Backend
   VERSION=1.0.0
   ENVIRONMENT=production
   LOG_LEVEL=INFO
   DEBUG=false

   # Server (Railway auto-sets PORT)
   HOST=0.0.0.0
   # PORT is automatically set by Railway

   # Redis (Railway auto-connects)
   REDIS_URL=${{Redis.REDIS_URL}}
   REDIS_DB=0
   REDIS_MAX_CONNECTIONS=50

   # Demucs Configuration
   DEMUCS_MODELS_PATH=/models/demucs
   DEMUCS_DEFAULT_MODEL=htdemucs
   DEMUCS_MAX_FILE_SIZE=52428800
   DEMUCS_MAX_DURATION=600
   DEMUCS_GPU_ENABLED=false
   DEMUCS_NUM_WORKERS=2

   # YouTube (optional)
   YOUTUBE_DOWNLOAD_DIR=/tmp/downloads
   YOUTUBE_MAX_DURATION=600
   YOUTUBE_FORMAT=bestaudio[ext=m4a]

   # API
   API_RATE_LIMIT=5
   API_RATE_LIMIT_PERIOD=3600
   API_CORS_ORIGINS=["http://localhost:3000","https://ox-board.vercel.app"]
   API_REQUEST_TIMEOUT=300

   # Observability
   OBSERVABILITY_PROMETHEUS_PORT=9090
   OBSERVABILITY_OTLP_ENDPOINT=
   OBSERVABILITY_ENABLE_TRACING=true
   ```

5. **Deploy**
   - Click "Deploy"
   - Railway will:
     - Build the Docker image
     - Start the FastAPI server
     - Run health checks
     - Provide a public URL

6. **Get Public URL**
   - Go to Service Settings → Networking
   - Click "Generate Domain"
   - Copy the generated URL (e.g., `https://ox-board-backend-production.up.railway.app`)

#### Option B: Deploy via Railway CLI

```bash
# Login to Railway
railway login

# Link to your project (or create new)
railway link

# Set root directory
railway up --rootDir backend

# Deploy
railway up
```

### Verification

Once deployed, verify the backend is working:

```bash
# Health check
curl https://your-railway-url.railway.app/api/v1/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-10-12T...",
  "version": "1.0.0"
}

# Root endpoint
curl https://your-railway-url.railway.app/

# API docs (if DEBUG=true)
https://your-railway-url.railway.app/docs
```

### Celery Worker Deployment

The Demucs backend uses Celery for asynchronous stem separation jobs. You need to deploy a separate worker service:

1. **Create Worker Service**
   - In Railway project, click "New Service"
   - Select "GitHub Repo" → same `ox-board` repo
   - Name it "worker"

2. **Configure Worker**
   - Root Directory: `backend`
   - Custom Start Command:
     ```bash
     celery -A backend.worker worker --loglevel=info --concurrency=2
     ```

3. **Environment Variables**
   - Copy all environment variables from the API service
   - Ensure `REDIS_URL` points to the same Redis instance

4. **Deploy Worker**
   - Worker will connect to Redis and process jobs
   - Monitor logs for "celery@worker ready"

### Storage Configuration

By default, Railway provides ephemeral storage. For production:

**Option 1: Use Railway Volumes (Recommended)**

1. Go to Service Settings → Volumes
2. Create volume mounted at `/models` (for Demucs models)
3. Create volume mounted at `/tmp/downloads` (for temp files)
4. Update `DEMUCS_MODELS_PATH=/models/demucs`

**Option 2: Use S3-Compatible Storage**

```bash
# Add to environment variables
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=ox-board-stems
AWS_REGION=us-east-1
```

### Scaling & Performance

**Recommended Railway Plan:**

- **Starter Plan** ($5/month): Good for testing, 512MB RAM
- **Developer Plan** ($20/month): Recommended for production, 8GB RAM
- **Pro Plan** ($50/month): High-traffic, 32GB RAM

**CPU-Only Configuration:**

- The Dockerfile uses CPU-only PyTorch to reduce image size
- Stem separation will be slower than GPU but still functional
- Typical processing time: 2-4 minutes for a 3-minute track

**Optimizations:**

```bash
# Increase worker concurrency for more parallel jobs
DEMUCS_NUM_WORKERS=4

# Increase Celery concurrency
celery -A backend.worker worker --concurrency=4

# Use faster Demucs model (lower quality)
DEMUCS_DEFAULT_MODEL=htdemucs_ft
```

### Monitoring

Railway provides built-in monitoring:

- **Metrics**: CPU, Memory, Network usage
- **Logs**: Real-time logs with filtering
- **Health Checks**: Automatic endpoint monitoring

**Custom Monitoring** (if OBSERVABILITY_ENABLE_TRACING=true):

- Prometheus metrics exposed on port 9090
- OpenTelemetry traces (configure OTLP_ENDPOINT)

### Troubleshooting

**Build Failures:**

```bash
# Check Dockerfile path
railway logs --deployment <deployment-id>

# Verify requirements.txt
railway run pip install -r backend/requirements.txt
```

**Health Check Failures:**

```bash
# Check if Redis is connected
railway logs | grep redis

# Test health endpoint locally
railway run curl http://localhost:8000/api/v1/health
```

**Worker Not Processing Jobs:**

```bash
# Check Celery connection
railway logs --service worker | grep "Connected to redis"

# Verify Redis URL
railway variables | grep REDIS_URL
```

**Out of Memory:**

- Upgrade to a larger Railway plan
- Reduce `DEMUCS_NUM_WORKERS`
- Reduce Celery `--concurrency`

### Security Considerations

1. **API Keys** (optional but recommended)

   ```bash
   API_KEY_ENABLED=true
   API_KEY_SECRET=your-secret-key-here
   ```

2. **CORS Origins**
   - Update `API_CORS_ORIGINS` with your frontend URLs only
   - Remove wildcard `["*"]` in production

3. **Rate Limiting**
   - Default: 5 requests per hour per IP
   - Adjust `API_RATE_LIMIT` and `API_RATE_LIMIT_PERIOD` as needed

### Cost Estimates

**Railway Costs** (approximate):

- **Hobby Plan** (Free): Limited usage, good for testing
- **Developer Plan** ($20/mo):
  - API service: ~$10/mo
  - Worker service: ~$10/mo
  - Redis: Included
- **Storage**: Volumes billed separately (~$0.25/GB/month)

**Processing Costs:**

- CPU-only: ~2-4 minutes per track
- With more workers: Can process multiple tracks in parallel

---

## Alternative: Render Deployment

If you prefer Render over Railway:

### Render Setup

1. **Create Web Service**
   - Go to [render.com](https://render.com)
   - New → Web Service
   - Connect GitHub repo
   - Root Directory: `backend`
   - Environment: Docker
   - Instance Type: Standard (minimum 1GB RAM)

2. **Add Redis**
   - New → Redis
   - Name: `oxboard-redis`
   - Copy connection string

3. **Environment Variables**
   - Same as Railway (see above)
   - `REDIS_URL` = Render Redis connection string

4. **Worker Service**
   - New → Background Worker
   - Same repo, root directory `backend`
   - Start Command: `celery -A backend.worker worker --loglevel=info`

**Render Pricing:**

- Web Service: $7/month (Starter)
- Redis: $7/month (Starter)
- Worker: $7/month (Starter)
- **Total**: ~$21/month

---

## Post-Deployment: Frontend Integration

Once backend is deployed, update frontend:

1. **Update Environment Variables**

   ```bash
   # In ox-board/.env.local
   NEXT_PUBLIC_STEMIFY_API_URL=https://your-railway-url.railway.app
   ```

2. **Test Integration**

   ```bash
   npm run dev
   # Upload a test track and verify stem separation works
   ```

3. **Deploy Frontend**

   ```bash
   # Vercel (recommended)
   vercel --prod

   # Set environment variable in Vercel dashboard:
   NEXT_PUBLIC_STEMIFY_API_URL=https://your-railway-url.railway.app
   ```

---

## Success Checklist

- [ ] Backend deployed and accessible
- [ ] Redis connected
- [ ] Worker processing jobs
- [ ] Health endpoint returning 200
- [ ] Can upload test file
- [ ] Stem separation completes successfully
- [ ] Frontend can fetch separated stems
- [ ] CORS configured correctly
- [ ] Monitoring/logging set up
- [ ] Volumes configured (if needed)

---

**Need Help?**

- Railway Docs: https://docs.railway.app
- Render Docs: https://render.com/docs
- Demucs Documentation: https://github.com/facebookresearch/demucs
- OX Board Issues: https://github.com/nategarelik/ox-board/issues
