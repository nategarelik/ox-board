# OX Board Deployment Guide

Complete deployment guide for the OX Board Demucs backend and Next.js frontend.

## Architecture

```
┌─────────────────────┐
│  Vercel (Frontend)  │
│  Next.js + React    │
└──────────┬──────────┘
           │ HTTPS
           ▼
┌─────────────────────┐      ┌─────────────────────┐
│  Railway/Render     │─────▶│  Redis              │
│  Python Backend     │      │  Job Queue          │
│  FastAPI + Demucs   │      └─────────────────────┘
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│  Background Worker  │
│  Process Audio      │
└─────────────────────┘
```

## Prerequisites

- GitHub account
- Vercel account (free tier OK)
- Railway.app OR Render.com account
- Redis instance (provided by Railway/Render)

---

## Option 1: Deploy to Railway (Recommended)

Railway provides the best experience with GPU support and easy Redis integration.

### Step 1: Deploy Backend to Railway

1. **Install Railway CLI**:

```bash
npm install -g @railway/cli
railway login
```

2. **Create new project**:

```bash
railway init
```

3. **Add Redis**:

```bash
railway add redis
```

4. **Deploy backend**:

```bash
railway up
```

5. **Set environment variables** in Railway dashboard:

```
ENVIRONMENT=production
LOG_LEVEL=INFO
DEMUCS_MODELS_PATH=/app/models
DEMUCS_GPU_ENABLED=false
API_CORS_ORIGINS=["https://oxboard.vercel.app","http://localhost:3000"]
```

6. **Get backend URL**:

```bash
railway status
# Copy the backend URL (e.g., https://oxboard-backend.up.railway.app)
```

### Step 2: Deploy Frontend to Vercel

1. **Push code to GitHub**:

```bash
git add .
git commit -m "feat: add Demucs backend integration"
git push origin main
```

2. **Import project to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Framework: Next.js (auto-detected)

3. **Set environment variable** in Vercel:

```
NEXT_PUBLIC_BACKEND_URL=https://oxboard-backend.up.railway.app
```

4. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete

5. **Get frontend URL**:
   - Your app will be live at `https://your-project.vercel.app`

---

## Option 2: Deploy to Render.com

Render provides persistent disk storage ideal for Demucs models.

### Step 1: Deploy Backend to Render

1. **Push code to GitHub**:

```bash
git add .
git commit -m "feat: add Demucs backend integration"
git push origin main
```

2. **Create Render account** at [render.com](https://render.com)

3. **Create Redis instance**:
   - Dashboard → New → Redis
   - Name: `oxboard-redis`
   - Plan: Starter (free)
   - Create

4. **Create Web Service**:
   - Dashboard → New → Web Service
   - Connect GitHub repository
   - Name: `oxboard-backend`
   - Environment: Docker
   - Region: Oregon (US West)
   - Plan: Starter
   - Dockerfile Path: `backend/Dockerfile`

5. **Set environment variables**:

```
ENVIRONMENT=production
LOG_LEVEL=INFO
DEMUCS_MODELS_PATH=/data/models
REDIS_URL=<Redis connection string from Render>
API_CORS_ORIGINS=["https://oxboard.vercel.app","http://localhost:3000"]
```

6. **Add persistent disk**:
   - Name: `demucs-models`
   - Mount Path: `/data/models`
   - Size: 10 GB

7. **Deploy**:
   - Click "Create Web Service"
   - Wait for initial deployment

8. **Create Worker Service**:
   - Dashboard → New → Background Worker
   - Same repository
   - Name: `oxboard-worker`
   - Docker Command: `python -m backend.worker`
   - Same environment variables
   - Same persistent disk

### Step 2: Deploy Frontend to Vercel

Same as Railway Option 1, Step 2.

---

## Option 3: Deploy to Fly.io

Fly.io provides good performance and global distribution.

### Step 1: Deploy Backend to Fly.io

1. **Install Fly CLI**:

```bash
curl -L https://fly.io/install.sh | sh
fly auth login
```

2. **Launch app**:

```bash
fly launch --config fly.toml --no-deploy
```

3. **Create Redis**:

```bash
fly redis create
```

4. **Create persistent volume**:

```bash
fly volumes create demucs_models --size 10 --region sjc
```

5. **Set secrets**:

```bash
fly secrets set REDIS_URL=<Redis URL from step 3>
fly secrets set API_CORS_ORIGINS='["https://oxboard.vercel.app"]'
```

6. **Deploy**:

```bash
fly deploy
```

### Step 2: Deploy Frontend to Vercel

Same as Railway Option 1, Step 2.

---

## Post-Deployment Configuration

### 1. Update Frontend Environment

In Vercel dashboard:

```
NEXT_PUBLIC_BACKEND_URL=<Your backend URL>
```

Redeploy frontend after setting this variable.

### 2. Test Backend Health

```bash
curl https://your-backend-url.railway.app/health
```

Expected response:

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "queue_status": {
    "pending": 0,
    "active": 0
  }
}
```

### 3. Download Demucs Models

Models will be downloaded automatically on first request, but you can pre-download:

```bash
# SSH into your backend instance
railway run bash  # or render ssh, fly ssh console

# Download models
python -c "import demucs; demucs.pretrained.get_model('htdemucs')"
python -c "import demucs; demucs.pretrained.get_model('htdemucs_ft')"
python -c "import demucs; demucs.pretrained.get_model('mdx_extra')"
python -c "import demucs; demucs.pretrained.get_model('mdx_extra_q')"
```

### 4. Test End-to-End

1. Open your Vercel URL
2. Upload a short audio file (< 1 minute)
3. Wait for processing
4. Verify stems are generated

---

## Monitoring

### View Logs

**Railway**:

```bash
railway logs
```

**Render**:

- Dashboard → Service → Logs

**Fly.io**:

```bash
fly logs
```

### Metrics

Backend exposes Prometheus metrics at `/metrics`:

```bash
curl https://your-backend-url/metrics
```

Key metrics:

- `demucs_jobs_total` - Total jobs processed
- `demucs_processing_seconds` - Processing time
- `demucs_jobs_active` - Currently processing
- `demucs_api_requests_total` - API request count

### Health Checks

All platforms automatically monitor `/health` endpoint.

---

## Scaling

### Railway

- Dashboard → Settings → Scale
- Increase replicas for API and worker

### Render

- Dashboard → Service → Scaling
- Increase instance count

### Fly.io

```bash
fly scale count 2
fly scale vm shared-cpu-2x  # More CPU
```

---

## Cost Estimates

### Free Tier (Development)

**Railway**: $5/month free credit

- Backend: ~$3/month
- Redis: ~$1/month
- Worker: ~$1/month

**Render**: Free tier available

- Web Service: Free (750 hours/month)
- Redis: Free (25MB)
- Worker: Free

**Vercel**: Free tier

- Frontend: Unlimited
- Bandwidth: 100GB/month

**Total**: $0-5/month for light usage

### Production (100 jobs/day)

**Railway**: ~$20-30/month

- Backend (512MB): $5
- Worker (1GB): $10
- Redis (256MB): $5
- Storage (10GB): $2

**Render**: ~$25-35/month

- Web Service (Starter): $7
- Worker (Starter): $7
- Redis (Starter): $10
- Disk (10GB): $1

**Vercel**: Free (within limits)

**Total**: $20-35/month

---

## Troubleshooting

### Backend not responding

1. Check logs for errors
2. Verify Redis connection: `REDIS_URL` environment variable
3. Check disk space for models (need ~6GB)

### Models not loading

1. Check `DEMUCS_MODELS_PATH` is writable
2. Manually download models (see Post-Deployment)
3. Check logs for download progress

### Slow processing

1. Enable GPU if available: `DEMUCS_GPU_ENABLED=true`
2. Use faster model: `DEMUCS_DEFAULT_MODEL=mdx_extra_q`
3. Scale up worker instances

### CORS errors

1. Verify `API_CORS_ORIGINS` includes your Vercel URL
2. Check frontend `NEXT_PUBLIC_BACKEND_URL` is correct
3. Ensure HTTPS (not HTTP) in production

---

## Security Checklist

- [ ] HTTPS enabled on all endpoints
- [ ] CORS origins restricted to your domains
- [ ] Rate limiting enabled (5 jobs/hour default)
- [ ] File size limits enforced (50MB default)
- [ ] Redis authentication enabled
- [ ] Environment variables not committed to git
- [ ] Logs don't contain sensitive data

---

## Maintenance

### Update Demucs Models

```bash
# SSH to backend
railway run bash

# Update models
pip install --upgrade demucs
python -c "import demucs; demucs.pretrained.get_model('htdemucs', force_update=True)"
```

### Clear Old Jobs

Jobs are automatically cleaned up after 30 days (completed) or 7 days (failed).

Manual cleanup:

```bash
railway run python -c "from backend.services.queue_service import QueueService; qs = QueueService(); qs.cleanup_old_jobs()"
```

### Backup Redis

**Railway**: Automatic daily backups
**Render**: Automatic backups on paid plans
**Fly.io**: Manual backups via `fly redis backup`

---

## Next Steps

1. Deploy backend to Railway/Render
2. Deploy frontend to Vercel
3. Test with sample audio
4. Monitor metrics and logs
5. Scale as needed

**Questions?** Check logs first, then review troubleshooting section.
