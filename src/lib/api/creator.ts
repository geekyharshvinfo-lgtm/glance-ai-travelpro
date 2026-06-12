/**
 * Creator API service for influencer application and status
 */

import { api } from './client';

export interface CreatorApplyRequest {
  name: string;
  email: string;
  instagramHandle: string;
}

export interface CreatorApplyResponse {
  name: string;
  email: string;
  instagramHandle: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW';
  createdAt: number;
  updatedAt: number;
}

export interface CreatorStatusResponse {
  name: string;
  email: string;
  instagramHandle: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW';
  createdAt: number;
  updatedAt: number;
}

/**
 * Apply to become a creator
 */
export async function addCreator(request: CreatorApplyRequest): Promise<CreatorApplyResponse> {
  try {
    const response = await api.post<CreatorApplyResponse>('/creator/apply', request);
    return response;
  } catch (error) {
    console.error('Error applying as creator:', error);
    throw error;
  }
}

/**
 * Check creator application status by Instagram handle
 */
export async function getCreatorStatus(instagramHandle: string): Promise<CreatorStatusResponse> {
  try {
    const response = await api.get<CreatorStatusResponse>(
      `/creator/status/${encodeURIComponent(instagramHandle)}`
    );
    return response;
  } catch (error) {
    console.error('Error fetching creator status:', error);
    throw error;
  }
}
