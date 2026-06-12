import type { TryOnRequest, TryOnJobResponse, TryOnStatusResponse } from '$lib/types/tryon';
import { api } from './client';

/**
 * Creates a try-on job
 * @param influencerId The influencer ID to pass in header
 * @param tryOnData The try-on request data
 * @param fetchFn Optional fetch function for SSR
 * @returns Promise with job ID and initial status
 */
export async function createTryOnJob(
  influencerId: string,
  tryOnData: TryOnRequest,
  fetchFn?: typeof fetch
): Promise<TryOnJobResponse> {
  return api.post<TryOnJobResponse>(
    '/influencers/tryon',
    tryOnData,
    {
      headers: {
        'x-influencer-id': influencerId,
      },
    },
    fetchFn
  );
}

/**
 * Gets the status of a try-on job
 * @param jobId The job ID to check status for
 * @param fetchFn Optional fetch function for SSR
 * @returns Promise with current job status and result if available
 */
export async function getTryOnStatus(
  jobId: string,
  fetchFn?: typeof fetch
): Promise<TryOnStatusResponse> {
  return api.get<TryOnStatusResponse>(`/influencers/tryon/${jobId}/status`, undefined, fetchFn);
}

/**
 * Polls for try-on job completion
 * Polling for 3 minutes with 15 second intervals (12 attempts) to balance user experience and server load
 * @param jobId The job ID to poll
 * @param maxAttempts Maximum number of polling attempts (default: 12)
 * @param intervalMs Polling interval in milliseconds (default: 15000)
 * @param fetchFn Optional fetch function for SSR
 * @param signal Optional AbortSignal for cancellation
 * @returns Promise that resolves when job is complete or fails
 */
export async function pollTryOnStatus(
  jobId: string,
  maxAttempts: number = 12,
  intervalMs: number = 15000,
  fetchFn?: typeof fetch,
  signal?: AbortSignal
): Promise<TryOnStatusResponse> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (signal?.aborted) {
      throw new DOMException('Try-on polling aborted', 'AbortError');
    }

    const status = await getTryOnStatus(jobId, fetchFn);

    if (status.status === 'SUCCESS' || status.status === 'FAILED') {
      return status;
    }

    // Wait before next attempt, but allow cancellation
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        signal?.removeEventListener('abort', onAbort);
        resolve();
      }, intervalMs);
      const onAbort = () => {
        clearTimeout(timer);
        reject(new DOMException('Try-on polling aborted', 'AbortError'));
      };
      signal?.addEventListener('abort', onAbort, { once: true });
    });
  }

  throw new Error(`Try-on job ${jobId} did not complete within ${maxAttempts} attempts`);
}

/**
 * Complete try-on process: create job and poll until completion
 * @param influencerId The influencer ID
 * @param tryOnData The try-on request data
 * @param maxAttempts Maximum polling attempts
 * @param intervalMs Polling interval
 * @param fetchFn Optional fetch function for SSR
 * @param signal Optional AbortSignal for cancellation
 * @returns Promise with final result
 */
export async function createAndPollTryOn(
  influencerId: string,
  tryOnData: TryOnRequest,
  maxAttempts?: number,
  intervalMs?: number,
  fetchFn?: typeof fetch,
  signal?: AbortSignal
): Promise<TryOnStatusResponse> {
  const jobResponse = await createTryOnJob(influencerId, tryOnData, fetchFn);
  return pollTryOnStatus(jobResponse.jobId, maxAttempts, intervalMs, fetchFn, signal);
}
