# Build stage
FROM python:3.11-slim as builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    libsndfile1-dev \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements from backend directory
COPY backend/requirements.txt .

# Install CPU-only PyTorch first (much smaller)
RUN pip install --no-cache-dir --user \
    torch==2.1.0+cpu \
    torchaudio==2.1.0+cpu \
    -f https://download.pytorch.org/whl/torch_stable.html

# Install remaining dependencies
RUN pip install --no-cache-dir --user -r requirements.txt

# Runtime stage
FROM python:3.11-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN useradd -m -u 1000 appuser

# Set working directory
WORKDIR /app

# Copy Python packages from builder
COPY --from=builder /root/.local /home/appuser/.local

# Copy application code to /app/backend
COPY backend ./backend

# Set ownership
RUN chown -R appuser:appuser /app

# Switch to app user
USER appuser

# Add .local/bin to PATH and set PYTHONPATH
ENV PATH=/home/appuser/.local/bin:$PATH
ENV PYTHONPATH=/app

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/api/v1/health')"

# Default command (Railway startCommand will override this)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]