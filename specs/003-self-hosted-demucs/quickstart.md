# Self-Hosted Demucs Quickstart Guide

This guide provides step-by-step instructions for testing and validating the self-hosted Demucs implementation, replacing mock stem separation with production-ready AI-powered audio processing.

## Prerequisites

### System Requirements

- Python 3.9+
- 8GB RAM minimum (16GB recommended)
- GPU with CUDA support (optional but recommended for performance)
- 20GB storage for models and temporary files
- Redis server for job queue management

### Installation

1. **Clone and setup the backend**:

   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\\Scripts\\activate
   pip install -r requirements.txt
   ```

2. **Install Demucs models**:

   ```bash
   # Download pre-trained models (2-3GB total)
   python -c "import demucs; demucs.download('htdemucs')"
   python -c "import demucs; demucs.download('htdemucs_ft')"
   python -c "import demucs; demucs.download('mdx_extra')"
   python -c "import demucs; demucs.download('mdx_extra_q')"
   ```

3. **Start Redis server**:

   ```bash
   redis-server
   ```

4. **Launch the API server**:
   ```bash
   uvicorn api.routes:app --host 0.0.0.0 --port 8000 --reload
   ```

## Testing Scenarios

### Scenario 1: Basic File Upload and Stem Separation

**User Story**: As a DJ, I want to upload an audio file and get separated stems for mixing.

**Test Steps**:

1. **Prepare Test Audio**:
   - Use a 30-second audio clip (MP3 or WAV format)
   - File size under 50MB
   - Duration under 10 minutes

2. **Upload via API**:

   ```bash
   curl -X POST "http://localhost:8000/api/stemify" \
     -F "file=@test-audio.mp3" \
     -F "options={\"model\": \"htdemucs\", \"quality\": \"best\"}"
   ```

3. **Expected Response**:

   ```json
   {
     "jobId": "uuid-here",
     "status": "pending",
     "estimatedDuration": 45,
     "message": "Stem separation job created successfully"
   }
   ```

4. **Track Progress**:

   ```bash
   curl "http://localhost:8000/api/jobs/{jobId}"
   ```

5. **Verify Results**:
   - Status should progress: `pending` → `processing` → `completed`
   - Four stem files should be generated: vocals, drums, bass, other
   - Each stem should have correct metadata (duration, format, sample rate)

**Success Criteria**:

- ✅ Job completes within estimated time
- ✅ All four stems are generated
- ✅ Audio quality is acceptable (vocal isolation > 80%)
- ✅ File formats and metadata are correct

### Scenario 2: YouTube URL Processing

**User Story**: As a music producer, I want to process YouTube songs without downloading them manually.

**Test Steps**:

1. **Select Test Video**:
   - Choose a YouTube video under 10 minutes
   - Ensure it's not age-restricted or private
   - Prefer songs with clear vocals and instrumentation

2. **Submit YouTube URL**:

   ```bash
   curl -X POST "http://localhost:8000/api/stemify" \
     -F "youtubeUrl=https://www.youtube.com/watch?v=dQw4w9WgXcQ"
   ```

3. **Monitor Download and Processing**:
   - Job should start with YouTube download
   - Progress should update during download phase
   - Processing phase should begin after download completes

4. **Verify YouTube Integration**:
   - Video should download successfully
   - Audio should extract correctly
   - Processing should work identically to file upload

**Success Criteria**:

- ✅ YouTube video downloads without errors
- ✅ Audio extraction completes successfully
- ✅ Stem separation quality matches file upload results
- ✅ Processing time is reasonable for video length

### Scenario 3: Model Selection and Quality Options

**User Story**: As an audio engineer, I want to choose different models based on quality and speed requirements.

**Test Steps**:

1. **Test Each Model**:

   ```bash
   # Fast processing
   curl -X POST "http://localhost:8000/api/stemify" \
     -F "file=@test-audio.mp3" \
     -F "options={\"model\": \"mdx_extra_q\", \"quality\": \"fast\"}"

   # Balanced quality/speed
   curl -X POST "http://localhost:8000/api/stemify" \
     -F "file=@test-audio.mp3" \
     -F "options={\"model\": \"htdemucs_ft\", \"quality\": \"balanced\"}"

   # Best quality
   curl -X POST "http://localhost:8000/api/stemify" \
     -F "file=@test-audio.mp3" \
     -F "options={\"model\": \"htdemucs\", \"quality\": \"best\"}"
   ```

2. **Compare Results**:
   - Document processing times for each model
   - Compare audio quality between models
   - Verify output format consistency

**Success Criteria**:

- ✅ All models produce valid stem separations
- ✅ Processing speed varies appropriately by model
- ✅ Quality improves with more advanced models
- ✅ Memory usage stays within acceptable limits

### Scenario 4: Error Handling and Edge Cases

**User Story**: As a user, I want clear error messages when something goes wrong.

**Test Steps**:

1. **Test File Size Limits**:

   ```bash
   # Create a file larger than 50MB
   dd if=/dev/zero of=large-file.mp3 bs=1M count=51
   curl -X POST "http://localhost:8000/api/stemify" -F "file=@large-file.mp3"
   # Should return 413 (Payload Too Large)
   ```

2. **Test Unsupported Formats**:

   ```bash
   curl -X POST "http://localhost:8000/api/stemify" -F "file=@document.txt"
   # Should return 415 (Unsupported Media Type)
   ```

3. **Test Invalid YouTube URLs**:

   ```bash
   curl -X POST "http://localhost:8000/api/stemify" \
     -F "youtubeUrl=https://example.com/video"
   # Should return 400 (Bad Request)
   ```

4. **Test Network Failures**:
   - Stop Redis server during processing
   - Verify graceful error handling
   - Check job status shows appropriate error

**Success Criteria**:

- ✅ Clear error messages for all failure cases
- ✅ Appropriate HTTP status codes
- ✅ Jobs transition to "failed" state with error details
- ✅ System recovers gracefully from temporary failures

### Scenario 5: Concurrent Processing and Performance

**User Story**: As a production user, I want to process multiple tracks simultaneously.

**Test Steps**:

1. **Submit Multiple Jobs**:

   ```bash
   # Submit 5 jobs rapidly
   for i in {1..5}; do
     curl -X POST "http://localhost:8000/api/stemify" \
       -F "file=@test-audio-${i}.mp3" &
   done
   ```

2. **Monitor Concurrent Processing**:
   - Check that jobs process simultaneously
   - Monitor system resource usage
   - Verify queue management works correctly

3. **Load Testing**:
   - Submit jobs faster than they can be processed
   - Verify proper queue behavior
   - Check rate limiting (5 jobs per hour per IP)

**Success Criteria**:

- ✅ Multiple jobs process concurrently
- ✅ System resources stay within acceptable limits
- ✅ Queue management handles backlog appropriately
- ✅ Rate limiting prevents abuse

## Quality Validation

### Audio Quality Metrics

- **Vocal Isolation**: Should achieve 85-95% accuracy
- **Drum Separation**: Should achieve 80-90% accuracy
- **Bass Isolation**: Should achieve 75-85% accuracy
- **Artifact Reduction**: Significant improvement over mock implementation

### Performance Benchmarks

- **Simple Track (3-4 min)**: 30-60 seconds processing time
- **Complex Track (5-7 min)**: 1-2 minutes processing time
- **Long Track (10+ min)**: 2-4 minutes processing time
- **Concurrent Jobs**: Should handle 100+ simultaneous requests

### Integration Testing

1. **Frontend Integration**:
   - Update existing `/api/stemify` endpoint
   - Add `/api/jobs/{id}` for progress tracking
   - Verify real-time progress updates

2. **CDN Integration**:
   - Processed stems should be accessible via CDN
   - Temporary URLs should work for download
   - File cleanup should work after expiration

## Troubleshooting

### Common Issues

**Problem**: Models fail to download

```
Solution: Check internet connection and disk space
Run: python -c "import demucs; demucs.download('htdemucs')" manually
```

**Problem**: GPU acceleration not working

```
Solution: Install CUDA toolkit and PyTorch GPU version
Verify: python -c "import torch; print(torch.cuda.is_available())"
```

**Problem**: High memory usage

```
Solution: Reduce concurrent jobs or use CPU-only processing
Monitor: Check system resources during processing
```

**Problem**: YouTube downloads failing

```
Solution: Update yt-dlp and check video availability
Run: yt-dlp --list-formats "URL" to verify video accessibility
```

### Performance Optimization

1. **Enable GPU Acceleration**:

   ```python
   # In stem_separation.py
   device = "cuda" if torch.cuda.is_available() else "cpu"
   ```

2. **Configure Model Caching**:

   ```python
   # Cache models in memory to avoid reloading
   model_cache = {}
   ```

3. **Optimize Concurrent Processing**:
   ```python
   # Limit concurrent jobs based on available resources
   max_workers = min(os.cpu_count(), 4)
   ```

## Success Checklist

- [ ] Backend API starts without errors
- [ ] All Demucs models download successfully
- [ ] Redis server is running and accessible
- [ ] File upload produces valid stem separation
- [ ] YouTube URL processing works end-to-end
- [ ] Multiple models produce different quality/speed results
- [ ] Error handling works for all edge cases
- [ ] Concurrent processing maintains system stability
- [ ] Audio quality meets minimum requirements
- [ ] Processing performance meets benchmarks
- [ ] Frontend integration receives real progress updates
- [ ] CDN integration serves processed stems correctly

## Estimated Timeline

- **Day 1**: Basic setup and single file processing
- **Day 2**: YouTube integration and model selection
- **Day 3**: Error handling and concurrent processing
- **Day 4**: Performance optimization and quality validation
- **Day 5**: Integration testing and production hardening

This quickstart guide ensures comprehensive testing of all self-hosted Demucs features, replacing mock implementations with production-ready AI-powered stem separation.
