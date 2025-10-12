# Frontend-Backend Integration Guide

## Overview

This guide walks through integrating the OX Board frontend with the deployed Stemify backend for real stem separation functionality.

**Prerequisites:**

- Backend deployed to Railway/Render (see `backend/DEPLOYMENT.md`)
- Backend URL obtained (e.g., `https://ox-board-backend.railway.app`)
- Backend health check passing

---

## Integration Steps

### Step 1: Update Environment Variables

#### Development (.env.local)

```bash
# Add to .env.local (create if it doesn't exist)
NEXT_PUBLIC_STEMIFY_API_URL=https://your-backend-url.railway.app

# Example:
NEXT_PUBLIC_STEMIFY_API_URL=https://ox-board-backend-production.up.railway.app
```

**Important:**

- The URL should NOT have a trailing slash
- Must start with `https://` for production
- For local backend testing: `http://localhost:8000`

#### Production (Vercel/Deployment Platform)

Add environment variable in your deployment platform:

- **Variable Name**: `NEXT_PUBLIC_STEMIFY_API_URL`
- **Value**: Your production backend URL
- **Scope**: Production (and Preview if desired)

---

### Step 2: Test Backend Connection

Use the provided test script to verify connectivity:

```bash
# Test with backend URL
npx ts-node scripts/test-backend-connection.ts https://your-backend.railway.app

# Or test with environment variable
export NEXT_PUBLIC_STEMIFY_API_URL=https://your-backend.railway.app
npx ts-node scripts/test-backend-connection.ts
```

**Expected Output:**

```
==========================================================
  OX Board Backend Connection Test
==========================================================

📡 Testing backend: https://ox-board-backend.railway.app

🔍 Testing root endpoint: https://ox-board-backend.railway.app/
✅ Root endpoint accessible!
   Name: OX Board Demucs Backend
   Version: 1.0.0
   Environment: production

🔍 Testing health endpoint: https://ox-board-backend.railway.app/api/v1/health
✅ Health check passed!
   Status: healthy
   Timestamp: 2025-10-12T...
   Version: 1.0.0

🔍 Testing CORS configuration
✅ CORS is configured
   Allow-Origin: *
   Allow-Methods: GET, POST, DELETE, OPTIONS
```

---

### Step 3: Restart Development Server

```bash
# Stop current dev server (Ctrl+C)

# Restart to load new environment variables
npm run dev
```

**Verify Environment Variable Loaded:**

```bash
# In browser console or terminal
console.log(process.env.NEXT_PUBLIC_STEMIFY_API_URL)
# Should print your backend URL
```

---

### Step 4: Test File Upload with Stem Separation

#### A. Access Terminal UI

1. Open browser: http://localhost:3000
2. Navigate to Terminal UI (bottom-right toggle button)
3. Go to "Music Library" tab

#### B. Initialize Audio System

Click "INITIALIZE_AUDIO_SYSTEM" button (required for browser audio policy)

#### C. Upload Test File

1. Drag and drop an MP3/WAV file into the upload area
2. Or click to browse and select a file

**What Should Happen:**

```
🔧 Uploading to backend for stem separation: test-song.mp3
✅ Job created: job_abc123def456
   Progress: Separating stems: 10%
   Progress: Separating stems: 35%
   Progress: Separating stems: 65%
   Progress: Separating stems: 100%
✅ Stem separation complete: test-song.mp3
   Stems ready!
```

**Processing Time:**

- Typical: 2-4 minutes for a 3-minute track (CPU backend)
- Depends on: Track length, backend CPU resources, queue size

#### D. Verify Stems Available

Separated stems will be:

- Cached in IndexedDB (browser storage)
- Available for loading into decks
- Displayed in the music library

---

## How It Works

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  FileUploader.tsx                                       │
│  ├─ User drops audio file                              │
│  ├─ Calls stemifyClient.uploadForSeparation()          │
│  └─ Polls job status every 2 seconds                   │
│                                                          │
│  StemifyClient (app/lib/api/stemifyClient.ts)         │
│  ├─ POST /api/v1/stemify (upload)                     │
│  ├─ GET /api/v1/jobs/{id} (status polling)            │
│  └─ Downloads stems when complete                      │
│                                                          │
└─────────────────┬───────────────────────────────────────┘
                  │ HTTPS
                  │
┌─────────────────▼───────────────────────────────────────┐
│              Backend (FastAPI + Celery)                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  FastAPI Server                                         │
│  ├─ Receives file upload                               │
│  ├─ Creates Celery job                                 │
│  ├─ Returns job_id                                     │
│  └─ Provides status updates                            │
│                                                          │
│  Celery Worker                                          │
│  ├─ Processes stem separation (Demucs)                 │
│  ├─ Updates job progress in Redis                      │
│  └─ Stores output stems                                │
│                                                          │
│  Redis (Job Queue + Status)                            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### File Flow

1. **Upload Phase**
   - User selects file in `FileUploader.tsx`
   - `stemifyClient.uploadForSeparation()` sends file to backend
   - Backend creates Celery job and returns `job_id`

2. **Processing Phase**
   - Celery worker processes file with Demucs
   - Job status stored in Redis
   - Frontend polls `GET /api/v1/jobs/{id}` every 2 seconds
   - Progress updates shown in UI (0-100%)

3. **Completion Phase**
   - Backend marks job as "completed"
   - Frontend receives stem URLs
   - Stems downloaded and cached in IndexedDB
   - Track available for deck loading

### Code References

**Frontend API Client** (`app/lib/api/stemifyClient.ts`):

```typescript
// Upload file for separation
const job = await stemifyClient.uploadForSeparation({
  file: audioFile,
  model: "htdemucs",
});

// Poll until complete with progress callback
const result = await stemifyClient.pollJobUntilComplete(
  job.job_id,
  (progress) => console.log(`Progress: ${progress}%`),
);

// Result contains stem URLs
console.log(result.stems); // { vocals, drums, bass, other }
```

**FileUploader Integration** (`app/components/terminal/FileUploader.tsx`):

```typescript
<FileUploader
  audioContext={audioContext}
  enableBackendSeparation={true}  // Enable backend mode
  onStemSeparationComplete={(result) => {
    console.log('Stems ready!', result);
    // Cache stems, update UI, etc.
  }}
  onFileLoaded={(track) => {
    // Called after successful separation
    loadTrack('A', track);
  }}
/>
```

---

## Configuration Options

### Backend Model Selection

Available Demucs models (configured in backend):

- `htdemucs` (default): High quality, slower
- `htdemucs_ft`: Fine-tuned, good quality, faster
- `htdemucs_6s`: 6-stem separation (vocals, drums, bass, other, piano, guitar)

```typescript
// Change model in FileUploader.tsx
const job = await stemifyClient.uploadForSeparation({
  file,
  model: "htdemucs_ft", // Faster processing
});
```

### Output Format

Supported formats: `wav`, `mp3`, `flac`

```typescript
const job = await stemifyClient.uploadForSeparation({
  file,
  model: "htdemucs",
  format: "mp3", // Smaller file size
});
```

### Polling Configuration

```typescript
// Adjust polling interval and timeout
const result = await stemifyClient.pollJobUntilComplete(
  job.job_id,
  onProgress,
  2000, // Poll every 2 seconds (default)
  600000, // Timeout after 10 minutes (default: 5 min)
);
```

---

## Troubleshooting

### Issue: "Connection failed" Error

**Symptoms:**

- Test script shows `❌ Connection failed`
- File upload never starts

**Solutions:**

1. **Check Backend is Running**

   ```bash
   curl https://your-backend.railway.app/api/v1/health
   ```

   Should return `{"status": "healthy", ...}`

2. **Verify Environment Variable**

   ```bash
   # In browser console
   console.log(process.env.NEXT_PUBLIC_STEMIFY_API_URL)
   ```

   Should match your backend URL

3. **Check CORS Configuration**
   - Backend `API_CORS_ORIGINS` must include frontend URL
   - Default: `["http://localhost:3000", "https://oxboard.vercel.app"]`
   - Add your production frontend URL if deployed elsewhere

4. **Restart Dev Server**
   - Environment changes require restart
   - `Ctrl+C` then `npm run dev`

---

### Issue: Job Stuck at "Processing"

**Symptoms:**

- Progress stays at 0% or doesn't update
- Job never completes

**Solutions:**

1. **Check Celery Worker Logs** (Railway/Render dashboard)

   ```bash
   railway logs --service worker
   ```

   Look for:
   - `celery@worker ready` (worker started)
   - `Task backend.worker.process_stem_separation` (job received)
   - Errors or exceptions

2. **Verify Redis Connection**
   - Backend logs should show: `Connected to redis`
   - Check `REDIS_URL` environment variable

3. **Check Worker Is Running**
   - Separate worker service must be deployed
   - See `backend/DEPLOYMENT.md` for worker setup

---

### Issue: "CORS Error" in Browser Console

**Symptoms:**

```
Access to fetch at 'https://backend.railway.app/api/v1/stemify'
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solutions:**

1. **Update Backend CORS Settings**
   Add to Railway environment variables:

   ```bash
   API_CORS_ORIGINS=["http://localhost:3000","https://your-frontend.vercel.app"]
   ```

2. **Restart Backend Service**
   - Changes to environment variables require restart
   - Railway: Redeploy service
   - Render: Restart service

---

### Issue: Slow Processing (>5 minutes)

**Causes:**

- Large file (>5 minutes)
- CPU-only backend (no GPU)
- Multiple jobs in queue

**Solutions:**

1. **Use Faster Model**

   ```typescript
   model: "htdemucs_ft"; // ~30% faster
   ```

2. **Upgrade Backend Plan**
   - More CPU cores = faster processing
   - Railway: Developer or Pro plan

3. **Use MP3 Output**
   ```typescript
   format: "mp3"; // Faster than WAV
   ```

---

## Testing Checklist

Use this checklist to verify integration:

- [ ] Backend deployed and health check passing
- [ ] `NEXT_PUBLIC_STEMIFY_API_URL` set in `.env.local`
- [ ] Test script passes all checks
- [ ] Dev server restarted after environment change
- [ ] Can upload file without errors
- [ ] Job progress shows 0% → 100%
- [ ] Job completes successfully
- [ ] Stems available in music library
- [ ] Can load stems into decks
- [ ] Stems play audio correctly

---

## Production Deployment

### Frontend (Vercel)

1. **Set Environment Variable**
   - Vercel Dashboard → Project → Settings → Environment Variables
   - Add `NEXT_PUBLIC_STEMIFY_API_URL` = your backend URL
   - Scope: Production

2. **Deploy**

   ```bash
   vercel --prod
   ```

3. **Update Backend CORS**
   - Add Vercel production URL to `API_CORS_ORIGINS`
   - Example: `["https://ox-board.vercel.app"]`
   - Redeploy backend

### Backend (Railway)

Already deployed! (See `backend/DEPLOYMENT.md`)

Ensure:

- [ ] API service running
- [ ] Worker service running
- [ ] Redis connected
- [ ] CORS includes production frontend URL

---

## Next Steps

After successful integration:

1. **Test with Real Audio**
   - Upload various file types (MP3, WAV, FLAC)
   - Test different track lengths
   - Verify quality of separated stems

2. **Enable Backend Separation by Default**

   ```typescript
   // In TerminalMusicLibrary.tsx
   <FileUploader
     enableBackendSeparation={true}  // Always use backend
   />
   ```

3. **Add Stem Caching**
   - Stems are already cached in IndexedDB
   - Add UI to manage cached stems
   - Show cache size/usage

4. **Monitor Performance**
   - Track job processing times
   - Monitor backend logs
   - Set up alerts for failures

---

## Support

**Issues:**

- Frontend: https://github.com/nategarelik/ox-board/issues
- Backend: Check Railway/Render logs first

**Documentation:**

- Backend Deployment: `backend/DEPLOYMENT.md`
- Stemify Client API: `app/lib/api/stemifyClient.ts`
- File Uploader: `app/components/terminal/FileUploader.tsx`

---

**Happy Mixing! 🎧**
