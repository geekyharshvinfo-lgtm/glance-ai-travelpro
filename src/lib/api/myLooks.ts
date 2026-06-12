import type { MyLooksApiResponse } from '$lib/types/myLooks';
import { api } from './client';

export async function getMyLooks(
  userId: string | null,
  profileId: string | null,
  deviceId: string | null,
  fetchFn?: typeof fetch
): Promise<MyLooksApiResponse> {
  const options = {
    headers: {
      'X-User-Id': userId || '',
      'X-Profile-Id': profileId || deviceId || '',
    },
  };

  return api.get('/influencers/mylooks', options, fetchFn);
}
