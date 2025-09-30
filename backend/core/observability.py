"""
OpenTelemetry tracing and Prometheus metrics integration.

Production-ready observability with distributed tracing,
metrics collection, and performance monitoring.
"""

from functools import wraps
from typing import Any, Callable, Dict, Optional

from opentelemetry import metrics, trace
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from prometheus_client import (
    Counter,
    Gauge,
    Histogram,
    start_http_server,
)

from backend.core.logging import get_logger

logger = get_logger(__name__)


# Prometheus Metrics
class Metrics:
    """Centralized metrics collection."""

    # Job metrics
    jobs_total = Counter(
        "demucs_jobs_total",
        "Total jobs processed",
        ["status", "model"]
    )

    jobs_active = Gauge(
        "demucs_jobs_active",
        "Currently processing jobs"
    )

    jobs_queued = Gauge(
        "demucs_jobs_queued",
        "Jobs waiting in queue"
    )

    # Processing metrics
    processing_duration = Histogram(
        "demucs_processing_seconds",
        "Time taken to process stems",
        ["model", "status"],
        buckets=[10, 30, 60, 120, 300, 600]
    )

    model_load_duration = Histogram(
        "demucs_model_load_seconds",
        "Time to load Demucs model",
        ["model"],
        buckets=[1, 5, 10, 30, 60]
    )

    # Audio metrics
    audio_input_size = Histogram(
        "demucs_audio_input_bytes",
        "Input audio file size",
        buckets=[1e6, 10e6, 50e6, 100e6, 500e6]
    )

    audio_duration = Histogram(
        "demucs_audio_duration_seconds",
        "Input audio duration",
        buckets=[30, 60, 180, 300, 600]
    )

    # Quality metrics
    separation_quality = Histogram(
        "demucs_separation_quality_score",
        "Stem separation quality score",
        ["stem_type"],
        buckets=[0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 1.0]
    )

    # API metrics
    api_requests_total = Counter(
        "demucs_api_requests_total",
        "Total API requests",
        ["method", "endpoint", "status_code"]
    )

    api_request_duration = Histogram(
        "demucs_api_request_seconds",
        "API request duration",
        ["method", "endpoint"],
        buckets=[0.01, 0.05, 0.1, 0.5, 1.0, 5.0]
    )

    # Error metrics
    errors_total = Counter(
        "demucs_errors_total",
        "Total errors",
        ["error_type", "component"]
    )

    # Resource metrics
    memory_usage_bytes = Gauge(
        "demucs_memory_usage_bytes",
        "Memory usage in bytes",
        ["component"]
    )

    gpu_utilization = Gauge(
        "demucs_gpu_utilization_percent",
        "GPU utilization percentage"
    )


def setup_prometheus(port: int = 9090) -> None:
    """
    Start Prometheus metrics HTTP server.

    Args:
        port: Port to expose metrics on
    """
    start_http_server(port)
    logger.info("prometheus_started", port=port)


def setup_tracing(
    service_name: str = "demucs-backend",
    otlp_endpoint: Optional[str] = None
) -> None:
    """
    Configure OpenTelemetry distributed tracing.

    Args:
        service_name: Name of the service
        otlp_endpoint: OTLP collector endpoint (e.g., "http://localhost:4317")
    """
    resource = Resource(attributes={"service.name": service_name})

    # Trace provider
    provider = TracerProvider(resource=resource)

    if otlp_endpoint:
        # Export to OTLP collector
        otlp_exporter = OTLPSpanExporter(endpoint=otlp_endpoint)
        processor = BatchSpanProcessor(otlp_exporter)
        provider.add_span_processor(processor)

    trace.set_tracer_provider(provider)
    logger.info("tracing_configured", service=service_name, endpoint=otlp_endpoint)


def setup_metrics_export(
    service_name: str = "demucs-backend",
    otlp_endpoint: Optional[str] = None
) -> None:
    """
    Configure OpenTelemetry metrics export.

    Args:
        service_name: Name of the service
        otlp_endpoint: OTLP collector endpoint
    """
    resource = Resource(attributes={"service.name": service_name})

    if otlp_endpoint:
        exporter = OTLPMetricExporter(endpoint=otlp_endpoint)
        reader = PeriodicExportingMetricReader(exporter)
        provider = MeterProvider(resource=resource, metric_readers=[reader])
        metrics.set_meter_provider(provider)

    logger.info("metrics_export_configured", service=service_name)


# Tracer instance
tracer = trace.get_tracer(__name__)


def traced(operation: str):
    """
    Decorator to add tracing to a function.

    Args:
        operation: Name of the operation for the span

    Usage:
        @traced("separate_stems")
        def separate_stems(audio_path: str, model: str):
            ...
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            with tracer.start_as_current_span(operation) as span:
                # Add function arguments as span attributes
                span.set_attribute("function", func.__name__)

                # Add kwargs as attributes
                for key, value in kwargs.items():
                    if isinstance(value, (str, int, float, bool)):
                        span.set_attribute(f"arg.{key}", value)

                try:
                    result = func(*args, **kwargs)
                    span.set_attribute("status", "success")
                    return result
                except Exception as e:
                    span.set_attribute("status", "error")
                    span.set_attribute("error.type", type(e).__name__)
                    span.set_attribute("error.message", str(e))
                    Metrics.errors_total.labels(
                        error_type=type(e).__name__,
                        component=func.__module__
                    ).inc()
                    raise

        return wrapper
    return decorator


def record_job_metrics(
    job_id: str,
    model: str,
    status: str,
    duration_seconds: float,
    input_size_bytes: int,
    audio_duration_seconds: float
) -> None:
    """
    Record comprehensive job metrics.

    Args:
        job_id: Job identifier
        model: Demucs model used
        status: Job status (success/failed)
        duration_seconds: Processing duration
        input_size_bytes: Input file size
        audio_duration_seconds: Audio duration
    """
    Metrics.jobs_total.labels(status=status, model=model).inc()
    Metrics.processing_duration.labels(model=model, status=status).observe(duration_seconds)
    Metrics.audio_input_size.observe(input_size_bytes)
    Metrics.audio_duration.observe(audio_duration_seconds)

    logger.info(
        "job_metrics_recorded",
        job_id=job_id,
        model=model,
        status=status,
        duration_seconds=duration_seconds,
        input_size_mb=input_size_bytes / 1024 / 1024,
        audio_duration_seconds=audio_duration_seconds
    )


def record_quality_metrics(
    job_id: str,
    quality_scores: Dict[str, float]
) -> None:
    """
    Record stem separation quality metrics.

    Args:
        job_id: Job identifier
        quality_scores: Dictionary of stem types to quality scores
    """
    for stem_type, score in quality_scores.items():
        Metrics.separation_quality.labels(stem_type=stem_type).observe(score)

    logger.info(
        "quality_metrics_recorded",
        job_id=job_id,
        **quality_scores
    )


def record_api_request(
    method: str,
    endpoint: str,
    status_code: int,
    duration_seconds: float
) -> None:
    """
    Record API request metrics.

    Args:
        method: HTTP method
        endpoint: API endpoint
        status_code: HTTP status code
        duration_seconds: Request duration
    """
    Metrics.api_requests_total.labels(
        method=method,
        endpoint=endpoint,
        status_code=str(status_code)
    ).inc()

    Metrics.api_request_duration.labels(
        method=method,
        endpoint=endpoint
    ).observe(duration_seconds)


class TracingContext:
    """
    Context manager for manual span creation.

    Usage:
        with TracingContext("custom_operation", job_id="job-123") as span:
            span.set_attribute("custom_attr", "value")
            # ... do work ...
    """

    def __init__(self, operation: str, **attributes: Any):
        """
        Initialize tracing context.

        Args:
            operation: Operation name for the span
            **attributes: Initial span attributes
        """
        self.operation = operation
        self.attributes = attributes
        self.span = None

    def __enter__(self) -> trace.Span:
        """Start the span."""
        self.span = tracer.start_span(self.operation)
        for key, value in self.attributes.items():
            if isinstance(value, (str, int, float, bool)):
                self.span.set_attribute(key, value)
        return self.span

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        """End the span."""
        if self.span:
            if exc_type is not None:
                self.span.set_attribute("error", True)
                self.span.set_attribute("error.type", exc_type.__name__)
                self.span.set_attribute("error.message", str(exc_val))
            self.span.end()


# Example usage
if __name__ == "__main__":
    from backend.core.logging import setup_logging

    setup_logging(json_logs=False)
    setup_prometheus(port=9090)
    setup_tracing("demucs-backend", otlp_endpoint="http://localhost:4317")

    # Example: Record job metrics
    record_job_metrics(
        job_id="job-123",
        model="htdemucs",
        status="success",
        duration_seconds=95.3,
        input_size_bytes=45 * 1024 * 1024,
        audio_duration_seconds=240
    )

    # Example: Traced function
    @traced("test_operation")
    def test_function(value: int):
        return value * 2

    result = test_function(42)
    logger.info("test_completed", result=result)