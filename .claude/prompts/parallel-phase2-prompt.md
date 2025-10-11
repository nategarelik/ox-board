# Parallel Phase 2 Backend Integration Prompt

## Context

OX Board v0.9.0-pre-mvp has completed Phase 1 core tracks:

- **Track A** (commit `583b76b`): Audio integration with DeckManager
- **Track B** (commit `e39ab7a`): File loading with drag-and-drop
- **Track C** (commit `54edf7e`): EQ-based frequency controls

**Current State**:

- Terminal UI fully functional with real audio
- Users can load local audio files with BPM detection
- EQ controls working (Bass/Mids/Treble)
- Backend exists but NOT integrated: FastAPI + Demucs + Celery + Redis

**Parallel Execution**:

- **Another agent** is handling Phase 1 cleanup (test fixes + mock removal)
- **You** are handling Phase 2 backend integration

---

## Your Mission: Phase 2 Backend Integration

Execute backend deployment and frontend integration to enable real stem separation.

---

## Task 3.1: Deploy Backend to Railway/Render (Week 3)

### Subtask 3.1a: Prepare Deployment Configuration

**Location**: `backend/` directory

**Required Files**:

1. **`backend/Dockerfile`** (if not exists)

   ```dockerfile
   FROM python:3.11-slim

   WORKDIR /app

   # Install system dependencies
   RUN apt-get update && apt-get install -y \
       ffmpeg \
       && rm -rf /var/lib/apt/lists/*

   # Install Python dependencies
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt

   # Copy application
   COPY . .

   # Expose port
   EXPOSE 8000

   # Run uvicorn
   CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
   ```

2. **`backend/railway.json`** (for Railway deployment)

   ```json
   {
     "$schema": "https://railway.app/railway.schema.json",
     "build": {
       "builder": "DOCKERFILE",
       "dockerfilePath": "Dockerfile"
     },
     "deploy": {
       "startCommand": "uvicorn main:app --host 0.0.0.0 --port $PORT",
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10
     }
   }
   ```

3. **Environment Variables** (document in `backend/.env.example`)

   ```env
   # Redis
   REDIS_URL=redis://localhost:6379/0

   # Celery
   CELERY_BROKER_URL=redis://localhost:6379/0
   CELERY_RESULT_BACKEND=redis://localhost:6379/1

   # Demucs
   DEMUCS_MODEL=htdemucs
   DEMUCS_DEVICE=cpu

   # Storage
   UPLOAD_DIR=/tmp/uploads
   OUTPUT_DIR=/tmp/outputs

   # API
   MAX_UPLOAD_SIZE_MB=100
   JOB_RETENTION_HOURS=24
   ```

**Action Items**:

- [ ] Read existing backend files to understand structure
- [ ] Create Dockerfile if not exists
- [ ] Create railway.json for Railway deployment
- [ ] Document environment variables
- [ ] Test locally: `docker build -t oxboard-backend backend/`

---

### Subtask 3.1b: Deploy to Railway

**Steps**:

1. **Install Railway CLI** (if not already)

   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**

   ```bash
   railway login
   ```

3. **Initialize Project**

   ```bash
   cd backend/
   railway init
   ```

4. **Add Redis Plugin**
   - Via Railway dashboard: Add Redis plugin
   - Copy Redis URL to environment variables

5. **Set Environment Variables**

   ```bash
   railway variables set REDIS_URL=<redis-url-from-plugin>
   railway variables set CELERY_BROKER_URL=<redis-url>
   railway variables set DEMUCS_MODEL=htdemucs
   railway variables set DEMUCS_DEVICE=cpu
   ```

6. **Deploy**

   ```bash
   railway up
   ```

7. **Verify Deployment**
   - Check health endpoint: `https://<your-app>.railway.app/health`
   - Test API docs: `https://<your-app>.railway.app/docs`

**Alternative: Render Deployment**

If Railway doesn't work, use Render:

1. Create `render.yaml`:

   ```yaml
   services:
     - type: web
       name: oxboard-api
       env: docker
       dockerfilePath: ./Dockerfile
       envVars:
         - key: REDIS_URL
           fromDatabase:
             name: oxboard-redis
             property: connectionString

     - type: redis
       name: oxboard-redis
       ipAllowList: []
   ```

2. Push to GitHub and connect to Render dashboard

**Success Criteria**:

- ✅ Backend deployed and accessible
- ✅ Health check endpoint responding
- ✅ Redis connected
- ✅ Celery worker running
- ✅ Can upload file via API

---

## Task 3.2: Create Frontend API Client (Week 3)

### Subtask 3.2a: Define API Types

**Create**: `app/types/api.ts`

```typescript
/**
 * Backend API types for stem separation service
 */

export interface StemifyUploadRequest {
  file: File;
  model?: "htdemucs" | "htdemucs_ft" | "htdemucs_6s";
  format?: "wav" | "mp3" | "flac";
}

export interface StemifyJobResponse {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress?: number; // 0-100
  estimatedTimeRemaining?: number; // seconds
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export interface StemifyJobResult {
  jobId: string;
  stems: {
    vocals: string; // URL to stem file
    bass: string;
    drums: string;
    other: string;
  };
  metadata: {
    originalFileName: string;
    duration: number;
    format: string;
    model: string;
  };
}

export interface StemifyErrorResponse {
  error: string;
  details?: string;
  code?: string;
}
```

---

### Subtask 3.2b: Implement API Client

**Create**: `app/lib/api/stemifyClient.ts`

```typescript
/**
 * @fileoverview Stemify Backend API Client
 * @description HTTP client for stem separation service
 */

import type {
  StemifyUploadRequest,
  StemifyJobResponse,
  StemifyJobResult,
  StemifyErrorResponse,
} from "@/types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_STEMIFY_API_URL || "http://localhost:8000";

class StemifyClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Upload audio file for stem separation
   */
  async uploadForSeparation(
    request: StemifyUploadRequest,
  ): Promise<StemifyJobResponse> {
    const formData = new FormData();
    formData.append("file", request.file);
    if (request.model) formData.append("model", request.model);
    if (request.format) formData.append("format", request.format);

    const response = await fetch(`${this.baseUrl}/api/v1/stemify`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error: StemifyErrorResponse = await response.json();
      throw new Error(error.error || "Upload failed");
    }

    return response.json();
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<StemifyJobResponse> {
    const response = await fetch(`${this.baseUrl}/api/jobs/${jobId}`);

    if (!response.ok) {
      const error: StemifyErrorResponse = await response.json();
      throw new Error(error.error || "Failed to get job status");
    }

    return response.json();
  }

  /**
   * Get separated stems (when job complete)
   */
  async getJobResult(jobId: string): Promise<StemifyJobResult> {
    const response = await fetch(`${this.baseUrl}/api/jobs/${jobId}/stems`);

    if (!response.ok) {
      const error: StemifyErrorResponse = await response.json();
      throw new Error(error.error || "Failed to get job result");
    }

    return response.json();
  }

  /**
   * Poll job status until complete
   */
  async pollJobUntilComplete(
    jobId: string,
    onProgress?: (progress: number) => void,
    intervalMs: number = 2000,
  ): Promise<StemifyJobResult> {
    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          const status = await this.getJobStatus(jobId);

          if (status.progress !== undefined) {
            onProgress?.(status.progress);
          }

          if (status.status === "completed") {
            clearInterval(interval);
            const result = await this.getJobResult(jobId);
            resolve(result);
          } else if (status.status === "failed") {
            clearInterval(interval);
            reject(new Error(status.error || "Job failed"));
          }
        } catch (error) {
          clearInterval(interval);
          reject(error);
        }
      }, intervalMs);
    });
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string }> {
    const response = await fetch(`${this.baseUrl}/health`);
    return response.json();
  }
}

export const stemifyClient = new StemifyClient();
export { StemifyClient };
```

**Success Criteria**:

- ✅ API types defined
- ✅ Client methods implemented
- ✅ Error handling comprehensive
- ✅ Polling mechanism working

---

## Task 4.1: Connect Upload to Backend (Week 4)

### Subtask 4.1a: Update FileUploader for Backend

**Modify**: `app/components/terminal/FileUploader.tsx`

Add backend upload option:

```typescript
interface FileUploaderProps {
  // ... existing props
  enableBackendSeparation?: boolean; // NEW
  onStemSeparationComplete?: (jobResult: StemifyJobResult) => void; // NEW
}

// Inside handleFileDrop:
if (enableBackendSeparation) {
  // Upload to backend for separation
  const job = await stemifyClient.uploadForSeparation({
    file,
    model: "htdemucs",
  });

  // Poll for completion
  const result = await stemifyClient.pollJobUntilComplete(
    job.jobId,
    (progress) => {
      onProgress?.(file.name, {
        stage: "processing",
        progress,
        message: `Separating stems: ${progress}%`,
      });
    },
  );

  onStemSeparationComplete?.(result);
} else {
  // Existing local file loading
  const loadedFile = await loadAudioFile(file, audioContext, onProgress);
  const track = createTrackFromFile(loadedFile);
  onFileLoaded(track);
}
```

---

### Subtask 4.1b: Update TerminalMusicLibrary

**Modify**: `app/components/terminal/TerminalMusicLibrary.tsx`

Add toggle for backend separation:

```typescript
const [useBackendSeparation, setUseBackendSeparation] = useState(false);

const handleStemSeparationComplete = async (result: StemifyJobResult) => {
  console.log("✅ Stem separation complete:", result);

  // Store stems in IndexedDB
  await cacheStemFiles(result.jobId, result.stems);

  // Load stems into deck
  await loadStemsIntoDeck("A", result.jobId);
};

<FileUploader
  enableBackendSeparation={useBackendSeparation}
  onStemSeparationComplete={handleStemSeparationComplete}
  // ... other props
/>
```

**Success Criteria**:

- ✅ Upload to backend working
- ✅ Job status polling working
- ✅ Progress bar shows stem separation progress
- ✅ Separated stems downloaded

---

## Task 4.2: Stem Caching & Playback (Week 4)

### Subtask 4.2a: Implement Stem Cache

**Create**: `app/lib/storage/stemCache.ts`

```typescript
/**
 * @fileoverview Stem Cache using IndexedDB
 * @description Caches separated stems from backend
 */

import { openDB, DBSchema, IDBPDatabase } from "idb";

interface StemCacheDB extends DBSchema {
  stems: {
    key: string; // jobId
    value: {
      jobId: string;
      stems: {
        vocals: Blob;
        bass: Blob;
        drums: Blob;
        other: Blob;
      };
      metadata: {
        originalFileName: string;
        duration: number;
        cachedAt: number;
      };
    };
  };
}

class StemCache {
  private db: IDBPDatabase<StemCacheDB> | null = null;

  async init() {
    this.db = await openDB<StemCacheDB>("stem-cache", 1, {
      upgrade(db) {
        db.createObjectStore("stems");
      },
    });
  }

  async cacheStemFiles(
    jobId: string,
    stemUrls: { vocals: string; bass: string; drums: string; other: string },
    metadata: { originalFileName: string; duration: number },
  ) {
    if (!this.db) await this.init();

    // Download all stems as blobs
    const [vocals, bass, drums, other] = await Promise.all([
      fetch(stemUrls.vocals).then((r) => r.blob()),
      fetch(stemUrls.bass).then((r) => r.blob()),
      fetch(stemUrls.drums).then((r) => r.blob()),
      fetch(stemUrls.other).then((r) => r.blob()),
    ]);

    await this.db!.put("stems", {
      jobId,
      stems: { vocals, bass, drums, other },
      metadata: { ...metadata, cachedAt: Date.now() },
    });
  }

  async getStems(jobId: string) {
    if (!this.db) await this.init();
    return this.db!.get("stems", jobId);
  }
}

export const stemCache = new StemCache();
```

---

### Subtask 4.2b: Load Stems into Deck

**Integration Point**: Wire cached stems to stemPlaybackEngine

```typescript
async function loadStemsIntoDeck(deck: "A" | "B", jobId: string) {
  const cached = await stemCache.getStems(jobId);
  if (!cached) throw new Error("Stems not cached");

  // Create object URLs for Tone.js
  const stemUrls = {
    vocals: URL.createObjectURL(cached.stems.vocals),
    bass: URL.createObjectURL(cached.stems.bass),
    drums: URL.createObjectURL(cached.stems.drums),
    other: URL.createObjectURL(cached.stems.other),
  };

  // Load into stemPlaybackEngine
  const engine = getStemPlaybackEngine();
  await engine.loadStemsFromUrls(stemUrls);

  console.log(`✅ Loaded stems into Deck ${deck}`);
}
```

**Success Criteria**:

- ✅ Stems cached in IndexedDB
- ✅ Stems loaded into playback engine
- ✅ Full flow working: upload → separate → cache → playback

---

## Execution Guidelines

### Coordinate with Cleanup Agent

- **SAFE to modify**: Backend files, API client, new files
- **AVOID**: Test files, mock files (cleanup agent territory)
- **Shared files**: Coordinate via git branches if needed

### Testing Strategy

1. **Backend Health**: Test `/health` endpoint
2. **Upload**: Test file upload via Postman/curl
3. **Polling**: Test job status polling
4. **Integration**: Test full flow in UI

### Environment Variables

Add to `.env.local`:

```env
NEXT_PUBLIC_STEMIFY_API_URL=https://your-app.railway.app
```

### Git Workflow

1. Branch: `git checkout -b feature/phase2-backend-integration`
2. Commits:
   - `feat: add backend deployment configuration`
   - `feat: implement stemify API client`
   - `feat: integrate backend upload in FileUploader`
   - `feat: add stem caching with IndexedDB`
   - `feat: complete backend integration`
3. Final: Merge to main after validation

---

## Expected Timeline

- **Task 3.1**: Backend deployment (2-3 hours)
- **Task 3.2**: API client (1-2 hours)
- **Task 4.1**: Upload integration (2-3 hours)
- **Task 4.2**: Caching & playback (2-3 hours)

**Total**: 7-11 hours

---

## Success Criteria (Phase 2 Complete)

```
✅ Backend Deployment:
- FastAPI deployed to Railway/Render
- Redis connected
- Celery worker running
- Health check passing

✅ Frontend Integration:
- API client implemented
- Upload to backend working
- Job polling working
- Progress tracking in UI

✅ End-to-End Flow:
- User uploads audio file
- Backend separates stems (Demucs)
- Frontend polls for completion
- Stems downloaded and cached
- Stems loaded into deck for playback
```

---

## Start Command

Begin immediately with Task 3.1a: Prepare deployment configuration for backend.

**GO!** 🚀
