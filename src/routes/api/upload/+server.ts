import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as Sentry from '@sentry/sveltekit';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json(
        {
          success: false,
          error: 'Missing or invalid authorization header',
        },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    const userId = formData.get('userId') as string;

    if (!file || !type || !userId) {
      return json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    // For now, we'll create a local object URL
    // In production, this would upload to cloud storage (Cloudinary, S3, etc.)

    // Create a unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop();
    const filename = `${type}_${userId}_${timestamp}_${randomString}.${extension}`;

    // In a real implementation, you would:
    // 1. Upload to cloud storage service
    // 2. Get the public URL
    // 3. Store metadata in database

    // For now, return a mock URL
    const mockUrl = `https://storage.glance-cdn.com/uploads/${filename}`;

    return json({
      success: true,
      data: {
        url: mockUrl,
        publicId: filename,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    Sentry.captureException(error, { tags: { operation: 'server_upload' } });
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
};
