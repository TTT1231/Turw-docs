<script setup lang="ts">
import { ref } from 'vue';

interface Props {
   src: string;
   alt?: string;
}

const props = withDefaults(defineProps<Props>(), {
   alt: 'Image preview'
});

const isLoading = ref(true);
const hasError = ref(false);

function handleLoad() {
   isLoading.value = false;
}

function handleError() {
   isLoading.value = false;
   hasError.value = true;
}
</script>

<template>
   <div class="image-preview">
      <div v-if="isLoading" class="loading">
         <span class="spinner"></span>
         <span>加载图片中...</span>
      </div>
      <div v-else-if="hasError" class="error">
         <span class="error-icon">⚠️</span>
         <span>图片加载失败</span>
      </div>
      <img
         v-else
         :src="src"
         :alt="alt"
         class="preview-image"
         @load="handleLoad"
         @error="handleError"
      />
   </div>
</template>

<style lang="scss" scoped>
@use './theme.scss';

.image-preview {
   width: 100%;
   height: 100%;
   display: flex;
   align-items: center;
   justify-content: center;
   background: var(--cv-bg);
   overflow: auto;
}

.loading {
   display: flex;
   align-items: center;
   gap: 12px;
   color: var(--cv-text-2);
}

.spinner {
   width: 18px;
   height: 18px;
   border: 2px solid var(--cv-divider-2);
   border-top-color: var(--cv-brand);
   border-radius: 50%;
   animation: spin 0.8s linear infinite;
}

@keyframes spin {
   to {
      transform: rotate(360deg);
   }
}

.error {
   display: flex;
   flex-direction: column;
   align-items: center;
   gap: 12px;
   color: var(--cv-danger-1);
}

.error-icon {
   font-size: 32px;
}

.preview-image {
   max-width: 100%;
   max-height: 100%;
   object-fit: contain;
}
</style>
