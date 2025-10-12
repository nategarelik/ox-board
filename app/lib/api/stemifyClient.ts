/**
 * @fileoverview Stemify Backend API Client
 * @description HTTP client for stem separation service
 */

import type {
  StemifyUploadRequest,
  StemifyJobResponse,
  JobStatusResponse,
  JobResult,
  StemifyErrorResponse,
  HealthResponse,
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
    if (request.format) formData.append("output_format", request.format);
    if (request.normalize !== undefined) {
      formData.append("normalize", String(request.normalize));
    }

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
  async getJobStatus(jobId: string): Promise<JobStatusResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/jobs/${jobId}`);

    if (!response.ok) {
      const error: StemifyErrorResponse = await response.json();
      throw new Error(error.error || "Failed to get job status");
    }

    return response.json();
  }

  /**
   * Delete a job
   */
  async deleteJob(jobId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/v1/jobs/${jobId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error: StemifyErrorResponse = await response.json();
      throw new Error(error.error || "Failed to delete job");
    }
  }

  /**
   * Poll job status until complete
   */
  async pollJobUntilComplete(
    jobId: string,
    onProgress?: (progress: number) => void,
    intervalMs: number = 2000,
    timeoutMs: number = 300000, // 5 minutes
  ): Promise<JobResult> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const interval = setInterval(async () => {
        try {
          // Check timeout
          if (Date.now() - startTime > timeoutMs) {
            clearInterval(interval);
            reject(new Error("Job polling timeout"));
            return;
          }

          const status = await this.getJobStatus(jobId);

          if (status.progress !== undefined) {
            onProgress?.(status.progress);
          }

          if (status.status === "completed") {
            clearInterval(interval);
            if (status.result) {
              resolve(status.result);
            } else {
              reject(new Error("Job completed but no result found"));
            }
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
  async healthCheck(): Promise<HealthResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/health`);
    if (!response.ok) {
      throw new Error("Health check failed");
    }
    return response.json();
  }

  /**
   * Test connection to backend
   */
  async testConnection(): Promise<boolean> {
    try {
      const health = await this.healthCheck();
      return health.status === "healthy" || health.status === "degraded";
    } catch {
      return false;
    }
  }
}

export const stemifyClient = new StemifyClient();
export { StemifyClient };
