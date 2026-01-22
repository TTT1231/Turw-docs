<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { codeToHtml } from 'shiki';
import type { ThemeMode } from './types';
import { getShikiTheme } from './types';

interface Props {
   code: string;
   lang: string;
   theme?: ThemeMode;
}

const props = withDefaults(defineProps<Props>(), {
   theme: 'light'
});

const highlightedHtml = ref<string>('');
const isLoading = ref(true);

const shikiTheme = computed(() => getShikiTheme(props.theme));

function escapeHtml(text: string): string {
   const div = document.createElement('div');
   div.textContent = text;
   return div.innerHTML;
}

function generateLineNumbersHtml(code: string): string {
   const lines = code.split('\n');
   const padding = lines.length.toString().length;

   const linesHtml = lines
      .map((line, index) => {
         const lineNum = (index + 1).toString().padStart(padding, ' ');
         const escapedLine = escapeHtml(line) || ' ';
         return `<div class="code-line">
        <span class="line-number">${lineNum}</span>
        <span class="line-content">${escapedLine}</span>
      </div>`;
      })
      .join('');

   return `<pre class="code-display"><code>${linesHtml}</code></pre>`;
}

async function highlight() {
   isLoading.value = true;

   const html = await codeToHtml(props.code, {
      lang: props.lang,
      theme: shikiTheme.value
   }).catch(() => generateLineNumbersHtml(props.code));

   highlightedHtml.value = html;
   isLoading.value = false;
}

watch(() => [props.code, props.lang, props.theme], highlight, { flush: 'post' });
onMounted(highlight);
</script>

<template>
   <div class="code-highlighter">
      <div v-if="isLoading" class="loading">
         <span>加载中...</span>
      </div>
      <div v-else class="shiki-wrapper with-line-numbers" v-html="highlightedHtml" />
   </div>
</template>

<style lang="scss" scoped>
@use './theme.scss';

.code-highlighter {
   --font-code: 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace;

   width: 100%;
   height: 100%;
   overflow: auto;
   font-family: var(--font-code);
   font-size: 14px;
   line-height: 1.6;

   // 滚动条样式
   &::-webkit-scrollbar {
      width: 10px;
      height: 10px;
   }

   &::-webkit-scrollbar-track {
      background: transparent;
   }

   &::-webkit-scrollbar-thumb {
      background: var(--cv-gray-2);
      border-radius: 5px;

      &:hover {
         background: var(--cv-gray-1);
      }
   }

   // Firefox 支持
   scrollbar-width: thin;
   scrollbar-color: var(--cv-gray-2) transparent;
}

.loading {
   display: flex;
   align-items: center;
   justify-content: center;
   padding: 40px;
   color: var(--cv-text-2);
   font-size: 13px;
}

.shiki-wrapper {
   width: 100%;
   min-height: 100%;
}

.shiki-wrapper :deep(pre.shiki) {
   margin: 0 !important;
   padding: 16px !important;
   background: transparent !important;
   width: 100%;
}

.shiki-wrapper :deep(code) {
   font-family: inherit;
   font-size: inherit;
   line-height: inherit;
}

.code-display {
   margin: 0;
   padding: 16px;
   font-family: var(--font-code);
   font-size: 14px;
   line-height: 1.6;
   background: var(--cv-bg-soft);
   overflow-x: auto;
}

.code-line {
   display: flex;
   gap: 16px;
}

.line-number {
   color: var(--cv-text-2);
   text-align: right;
   min-width: 40px;
   user-select: none;
   flex-shrink: 0;
}

.line-content {
   flex: 1;
   white-space: pre;
}
</style>
