/**
 * Profile dropdown store for managing profile panel state
 */

interface ProfileStore {
  isOpen: boolean;
}

// Create the reactive store
export const profileStore = $state<ProfileStore>({
  isOpen: false,
});

// Helper functions
export function openProfileDropdown() {
  profileStore.isOpen = true;
}

export function closeProfileDropdown() {
  profileStore.isOpen = false;
}

export function toggleProfileDropdown() {
  profileStore.isOpen = !profileStore.isOpen;
}
