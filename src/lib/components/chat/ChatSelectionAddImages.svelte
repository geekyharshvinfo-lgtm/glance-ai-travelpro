<script lang="ts">
  import type { AddImageItem, AddImageType } from '$lib/types';

  interface Props {
    content: AddImageItem[];
    onSelect: (type: AddImageType, id: string) => void;
    disabled?: boolean;
  }

  let { content, onSelect, disabled = false }: Props = $props();

  function handleClick(item: AddImageItem) {
    if (!disabled) {
      onSelect(item.type, item.id);
    }
  }

  function getIcon(type: AddImageType): string {
    switch (type) {
      case 'CAMERA':
        return 'M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z M12 17a4 4 0 100-8 4 4 0 000 8z';
      case 'GALLERY':
        return 'M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z M21 15l-5-5L5 21';
      case 'UPLOAD':
        return 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M17 8l-5-5-5 5 M12 3v12';
      case 'SELECTION':
        return 'M9 11l3 3L22 4 M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11';
      default:
        return '';
    }
  }

  function getLabel(type: AddImageType): string {
    switch (type) {
      case 'CAMERA':
        return 'Take Photo';
      case 'GALLERY':
        return 'Choose from Gallery';
      case 'UPLOAD':
        return 'Upload File';
      case 'SELECTION':
        return 'Select Existing';
      default:
        return type;
    }
  }
</script>

<div class="add-images-container">
  {#each content as item (item.id)}
    <button class="add-image-button" onclick={() => handleClick(item)} {disabled}>
      <span class="add-image-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d={getIcon(item.type)} />
        </svg>
      </span>
      <span class="add-image-label">{getLabel(item.type)}</span>
    </button>
  {/each}
</div>

<style>
  .add-images-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }

  .add-image-button {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border: 1px solid #333;
    border-radius: 0.75rem;
    background: #2a2a2a;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .add-image-button:hover:not(:disabled) {
    border-color: #750bff;
    background: #3a3a3a;
  }

  .add-image-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .add-image-icon {
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #750bff;
  }

  .add-image-icon svg {
    width: 100%;
    height: 100%;
  }

  .add-image-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #fff;
  }
</style>
