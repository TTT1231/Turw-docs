<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
   copyValue: string;
}>();

const isCopySuccess = ref(false);
const copyToClipboard = async () => {
   try {
      await navigator.clipboard.writeText(props.copyValue);
      isCopySuccess.value = true;
      setTimeout(() => {
         isCopySuccess.value = false;
      }, 2000);
   } catch (err) {
      console.error('复制失败:', err);
   }
};
</script>

<template>
   <button class="copy-button" @click="copyToClipboard()" title="复制代码">
      <svg
         v-if="!isCopySuccess"
         width="14"
         height="14"
         viewBox="0 0 24 24"
         fill="none"
         stroke="currentColor"
         stroke-width="2"
      >
         <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
         <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>

      <svg
         v-else
         width="14"
         height="14"
         viewBox="0 0 24 24"
         fill="none"
         stroke="currentColor"
         stroke-width="2"
         stroke-linecap="round"
         stroke-linejoin="round"
      >
         <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
   </button>
</template>

<style lang="css" scoped>
.copy-button {
   background: rgba(255, 255, 255, 0.2);
   border: 1px solid rgba(255, 255, 255, 0.3);
   border-radius: 6px;
   padding: 6px;
   color: white;
   cursor: pointer;
   opacity: 0.7;
   transition: all 0.2s ease;
   display: flex;
   align-items: center;
   justify-content: center;
}

.copy-button:hover {
   opacity: 1;
   background: rgba(255, 255, 255, 0.3);
}

.copy-button svg {
   width: 14px;
   height: 14px;
}
</style>
