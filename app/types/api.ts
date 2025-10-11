/**
 * @fileoverview Backend API types for stem separation service
 * @description TypeScript types for Stemify backend API
 */

export interface StemifyUploadRequest {
  file: File;
  model?: "htdemucs" | "htdemucs_ft" | "htdemucs_6s";
  format?: "wav" | "mp3" | "flac";
  normalize?: boolean;
}

export interface StemifyJobResponse {
  job_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  estimated_duration?: number; // seconds
  message?: string;
}

export interface JobStatusResponse {
  job_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress?: number; // 0-100
  result?: JobResult;
  error?: string;
  created_at: string;
  updated_at: string;
}

export interface JobResult {
  stems: {
    vocals: string; // URL to stem file
    bass: string;
    drums: string;
    other: string;
  };
  metadata: {
    original_filename: string;
    duration: number;
    format: string;
    model: string;
  };
}

export interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  models_available: string[];
  queue_status: {
    active_jobs: number;
    queued_jobs: number;
    workers_available: number;
  };
}

export interface StemifyErrorResponse {
  error: string;
  details?: string;
  code?: string;
}
