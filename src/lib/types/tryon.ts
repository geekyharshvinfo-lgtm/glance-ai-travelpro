export interface TryOnRequest {
  selfieUrl: string | null;
  productImageUrl: string;
  metadata: {
    id: string; // Product ID or Collection ID
    userId: string | null;
    profileId?: string | null;
    gender: 'male' | 'female' | null;
    productTitle: string;
    productType: string;
    influencerPersona?: string;
    brandPersona?: string;
  };
}

export interface TryOnJobResponse {
  jobId: string;
  status: 'PROCESSING' | 'SUCCESS' | 'FAILED';
  message?: string;
}

export interface TryOnStatusResponse {
  jobId: string;
  status: 'PROCESSING' | 'SUCCESS' | 'FAILED';
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  error?: string;
}

export type TryOnStatus = 'PROCESSING' | 'SUCCESS' | 'FAILED';
