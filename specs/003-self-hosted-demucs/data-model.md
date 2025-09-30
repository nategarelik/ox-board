# Self-Hosted Demucs Data Model

## Core Entities

### Job

**Purpose**: Represents a stem separation task with tracking and status management.

**Fields**:

- `id`: string - Unique job identifier (UUID)
- `status`: enum - Job status (pending, processing, completed, failed)
- `created_at`: datetime - Job creation timestamp
- `updated_at`: datetime - Last update timestamp
- `input_type`: enum - Source type (file_upload, youtube_url)
- `input_source`: string - File path or YouTube URL
- `model`: string - Demucs model used (htdemucs, htdemucs_ft, mdx_extra, mdx_extra_q)
- `options`: StemSeparationOptions - Processing configuration
- `progress`: integer - Processing progress (0-100)
- `result`: JobResult | null - Processing results when complete
- `error`: string | null - Error message if failed
- `estimated_duration`: integer - Estimated processing time in seconds
- `actual_duration`: integer | null - Actual processing time when complete

**Relationships**:

- Contains one JobResult when completed
- References one StemSeparationOptions

**Validation Rules**:

- `id`: Must be unique UUID
- `status`: Must be valid enum value
- `model`: Must be supported Demucs model
- `progress`: Must be between 0-100
- `input_source`: Required, must be valid file path or YouTube URL

### JobResult

**Purpose**: Contains the results of a completed stem separation job.

**Fields**:

- `job_id`: string - Reference to parent Job
- `output_dir`: string - Directory containing separated stems
- `stems`: StemFiles - Individual stem file information
- `processing_time`: integer - Actual processing duration
- `model_used`: string - Model that was actually used
- `quality_metrics`: QualityMetrics | null - Separation quality assessment
- `file_size`: integer - Total size of all output files
- `cdn_urls`: string[] - CDN URLs for stem access

**Relationships**:

- Belongs to one Job
- Contains one StemFiles and QualityMetrics

### StemFiles

**Purpose**: Information about individual separated audio stems.

**Fields**:

- `vocals`: StemInfo - Vocal stem information
- `drums`: StemInfo - Drums stem information
- `bass`: StemInfo - Bass stem information
- `other`: StemInfo - Other instruments stem information

**Relationships**:

- Part of JobResult

### StemInfo

**Purpose**: Metadata for an individual audio stem.

**Fields**:

- `filename`: string - Output filename
- `path`: string - Local file path
- `size`: integer - File size in bytes
- `duration`: float - Audio duration in seconds
- `format`: string - Audio format (wav, mp3, flac)
- `sample_rate`: integer - Audio sample rate
- `bitrate`: integer | null - Audio bitrate (for compressed formats)
- `cdn_url`: string | null - CDN URL for streaming

### StemSeparationOptions

**Purpose**: Configuration options for stem separation processing.

**Fields**:

- `model`: string - Demucs model selection
- `quality`: enum - Quality preset (fast, balanced, best)
- `output_format`: string - Output audio format
- `normalize`: boolean - Whether to normalize output
- `remove_vocals`: boolean - Whether to remove vocals (karaoke mode)
- `segment_duration`: float | null - Segment duration for processing
- `overlap_duration`: float | null - Overlap between segments

**Validation Rules**:

- `model`: Must be valid Demucs model name
- `quality`: Must be valid preset
- `output_format`: Must be supported format
- `segment_duration`: Must be positive if provided

### QualityMetrics

**Purpose**: Assessment of stem separation quality.

**Fields**:

- `overall_score`: float - Overall quality score (0-1)
- `vocal_isolation`: float - Vocal isolation accuracy (0-1)
- `drum_separation`: float - Drum separation accuracy (0-1)
- `bass_isolation`: float - Bass isolation accuracy (0-1)
- `artifact_reduction`: float - Artifact reduction score (0-1)
- `method`: string - Quality assessment method used

### ProcessingMetrics

**Purpose**: Performance and resource usage metrics.

**Fields**:

- `processing_time`: integer - Total processing duration
- `cpu_usage`: float - Average CPU utilization
- `memory_usage`: integer - Peak memory usage in MB
- `gpu_usage`: float | null - GPU utilization if used
- `model_load_time`: integer - Time to load model
- `input_file_size`: integer - Input file size
- `output_file_sizes`: integer[] - Sizes of output stems

## State Transitions

### Job Lifecycle

```
pending → processing → completed
   ↓           ↓
   └───────→ failed
```

**Transitions**:

- `pending` → `processing`: When job starts processing
- `processing` → `completed`: When all stems generated successfully
- `processing` → `failed`: When error occurs during processing
- `pending` → `failed`: When job cannot be started

### Status Change Rules

- Jobs can only move forward in the lifecycle
- Failed jobs cannot be restarted (new job must be created)
- Completed jobs are immutable after creation

## Validation Constraints

### File Constraints

- Maximum file size: 50MB
- Maximum duration: 10 minutes
- Supported input formats: mp3, wav, m4a, flac, ogg
- Output formats: wav, mp3, flac

### Processing Constraints

- Concurrent job limit: 100+ jobs
- Rate limiting: 5 jobs per hour per IP
- Model memory requirements: 2-4GB per model
- Temporary storage: ~10x input file size during processing

### Quality Constraints

- Minimum acceptable quality: 75% for production use
- Processing timeout: 5 minutes for short tracks, 10 minutes for long tracks
- Retry limit: 3 attempts for transient failures

## API Data Transfer Objects

### StemifyRequest

```typescript
interface StemifyRequest {
  file?: File; // Audio file upload
  youtubeUrl?: string; // YouTube URL
  options?: StemSeparationOptions;
}
```

### StemifyResponse

```typescript
interface StemifyResponse {
  jobId: string; // Job identifier
  status: "pending"; // Initial status
  estimatedDuration: number;
  message: string; // Success message
}
```

### JobStatusResponse

```typescript
interface JobStatusResponse {
  jobId: string;
  status: JobStatus;
  progress: number;
  result?: JobResult;
  error?: string;
  createdAt: string;
  updatedAt: string;
}
```

## Database Schema Considerations

### Indexing Strategy

- Primary key on `job.id`
- Index on `job.status` for queue processing
- Index on `job.created_at` for cleanup operations
- Composite index on `(status, created_at)` for efficient queue queries

### Retention Policies

- Completed jobs: 30 days retention
- Failed jobs: 7 days retention
- Temporary files: Immediate cleanup after processing
- CDN URLs: 90 days or until manually deleted

### Performance Optimization

- Partition jobs by month for large-scale deployments
- Archive old jobs to cold storage
- Compress large metadata fields
- Use connection pooling for database access
