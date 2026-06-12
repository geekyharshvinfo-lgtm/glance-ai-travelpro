import type { InfluencerResponse } from '$lib/types/influencer';
import type { ProductGridSection } from '$lib/types/influencer';
import { api } from './client';

export interface InfluencerRequestOptions {
  profileId?: string;
  accountId?: string;
  deviceId?: string;
}

export async function getInfluencerBySlug(
  slug: string,
  fetchFn?: typeof fetch,
  options?: InfluencerRequestOptions
): Promise<InfluencerResponse> {
  const params = new URLSearchParams();
  if (options?.profileId) params.set('profileId', options.profileId);
  if (options?.accountId) params.set('accountId', options.accountId);
  if (options?.deviceId) params.set('deviceId', options.deviceId);

  const query = params.toString();
  const endpoint = query ? `/influencers/${slug}?${query}` : `/influencers/${slug}`;

  return api.get<InfluencerResponse>(endpoint, undefined, fetchFn);
}

export async function getSectionProducts(
  slug: string,
  sectionId: string,
  options?: InfluencerRequestOptions
): Promise<ProductGridSection> {
  const params = new URLSearchParams();
  if (options?.profileId) params.set('profileId', options.profileId);
  if (options?.accountId) params.set('userId', options.accountId);

  const query = params.toString();
  const endpoint = query
    ? `/influencers/${slug}/sections/${sectionId}/products?${query}`
    : `/influencers/${slug}/sections/${sectionId}/products`;

  return api.get<ProductGridSection>(endpoint);
}
