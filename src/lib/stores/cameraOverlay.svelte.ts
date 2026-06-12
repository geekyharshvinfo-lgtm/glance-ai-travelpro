/**
 * Camera overlay store for managing camera popup state
 */

interface CameraOverlayStore {
  isOpen: boolean;
  isReverseSearch: boolean;
}

export const cameraOverlayStore = $state<CameraOverlayStore>({
  isOpen: false,
  isReverseSearch: false,
});

export function openCameraForReverseSearch() {
  cameraOverlayStore.isOpen = true;
  cameraOverlayStore.isReverseSearch = true;
}

export function closeCameraOverlay() {
  cameraOverlayStore.isOpen = false;
  cameraOverlayStore.isReverseSearch = false;
}
