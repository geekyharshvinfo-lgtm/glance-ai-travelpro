/**
 * Reverse search store for managing image-based search functionality
 */

interface ReverseSearchStore {
  inputFile: File | null; // The original image file selected or captured by the user
  gcsUrl: string; // GCS URL of the uploaded image
  imageUrl: string; // Signed URL for displaying the image, set after upload and retrieval of signed URL
}

export const reverseSearchStore = $state<ReverseSearchStore>({
  inputFile: null,
  gcsUrl: '',
  imageUrl: '',
});

export function clearReverseSearchImage() {
  const currentImageUrl = reverseSearchStore.imageUrl;
  if (
    currentImageUrl &&
    currentImageUrl.startsWith('blob:') &&
    typeof URL !== 'undefined' &&
    typeof URL.revokeObjectURL === 'function'
  ) {
    URL.revokeObjectURL(currentImageUrl);
  }

  reverseSearchStore.inputFile = null;
  reverseSearchStore.gcsUrl = '';
  reverseSearchStore.imageUrl = '';
}
