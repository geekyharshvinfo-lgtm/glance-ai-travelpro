/**
 * Image upload API service
 */

import { API_ENDPOINTS } from '$lib/config/env';
import { userStore } from '$lib/stores/user.svelte';
import * as Sentry from '@sentry/sveltekit';

interface UploadResponse {
  gcsUrl: string;
  uploadUrl: string;
}

/**
 * Get an upload URL from the server
 */
export async function getImageUploadUrl(): Promise<UploadResponse | null> {
  try {
    const accessToken = userStore.accessToken;
    if (!accessToken) {
      throw new Error('User not authenticated');
    }

    const isGuest = userStore.authType === 'guest';
    const uploadUrlParams = isGuest ? '?type=influencers_anonymous' : '';
    const response = await fetch(`${API_ENDPOINTS.BIFROST}/api/upload/v1/upload-url${uploadUrlParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'image/jpeg',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get upload URL: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to get image upload URL:', error);
    Sentry.captureException(error, { tags: { operation: 'upload_get_url' } });
    return null;
  }
}

/**
 * Upload an image to the obtained URL
 */
export async function uploadImage(uploadUrl: string, imageData: Blob): Promise<boolean> {
  try {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/jpeg',
      },
      body: imageData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Failed to upload image:', error);
    Sentry.captureException(error, { tags: { operation: 'upload_image' } });
    return false;
  }
}

/**
 * Get a signed URL from a GCS URL for temporary public access
 */
export async function getSignedUrl(gcsUrl: string): Promise<{ signedUrl: string } | null> {
  try {
    const accessToken = userStore.accessToken;
    if (!accessToken) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${API_ENDPOINTS.AI_INFLUENCER_BACKEND}/upload/signed-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ gcsPath: gcsUrl }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get signed URL: ${response.status}`);
    }

    const data = await response.json();
    return { signedUrl: data.data?.signedUrl || data.signedUrl };
  } catch (error) {
    console.error('Failed to get signed URL:', error);
    Sentry.captureException(error, { tags: { operation: 'upload_signed_url' } });
    return null;
  }
}

/**
 * Upload user selfie - handles getting upload URL and uploading the image
 */
export async function uploadSelfie(file: Blob | File): Promise<{ url: string } | null> {
  try {
    // Convert file to JPEG blob if needed
    let imageBlob: Blob = file;

    if (file.type !== 'image/jpeg') {
      // Convert to JPEG using canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to create canvas context');

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      try {
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = objectUrl;
        });

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        imageBlob = await new Promise((resolve, reject) => {
          canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('toBlob returned null'))),
            'image/jpeg',
            0.9
          );
        });
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    }

    // Get upload URL
    const uploadData = await getImageUploadUrl();
    if (!uploadData) {
      throw new Error('Failed to get upload URL');
    }

    // Upload image
    const uploadSuccess = await uploadImage(uploadData.uploadUrl, imageBlob);
    if (!uploadSuccess) {
      throw new Error('Failed to upload image');
    }

    return { url: uploadData.gcsUrl };
  } catch (error) {
    console.error('Selfie upload error:', error);
    Sentry.captureException(error, { tags: { operation: 'selfie_upload' } });
    return null;
  }
}
