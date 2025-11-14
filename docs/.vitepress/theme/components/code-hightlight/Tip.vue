<script setup lang="ts">
import Base from './Base.vue';

interface Props {
   title?: string;
}

withDefaults(defineProps<Props>(), {
   title: 'TIP'
});
</script>

<template>
   <Base
      :title="title"
      container-class="tip-blue-container"
      title-class="tip-blue-title"
      content-class="tip-blue-content"
   >
      <slot />
   </Base>
</template>

<style>
.tip-blue-container {
   background-color: #f0f9ff;
   border: 1px solid #b3e5fc;
   border-left: 4px solid #0077ff;
   border-radius: 8px;
   padding: 16px;
   margin: 16px 0;
}

.tip-blue-title {
   color: #0077ff;
   font-weight: 600;
   font-size: 14px;
}

.tip-blue-content {
   color: #333;
   font-size: 14px;
   line-height: 1.6;
}

.tip-blue-content code {
   background-color: #ddf0fe !important; /* 比#e3f2fd略深，层次分明 */
   padding: 2px 6px;
   border-radius: 4px;
   font-family:
      'Fira Code', 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Courier New', monospace;
   font-size: 12px;
   color: #0d71e4 !important; /* 稍深蓝色，清晰易读 */
   box-shadow: 0 1px 2px 0 rgba(23, 78, 166, 0.04);
   transition: background 0.2s;
}

.tip-blue-content pre {
   background-color: #f6fbff !important;
   border: 1px solid #d9eeff !important;
   border-radius: 6px;
   padding: 16px !important;
   overflow-x: auto;
   margin: 12px 0;
   font-family:
      'Fira Code', 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Courier New', monospace;
}

.tip-blue-content pre code {
   background-color: transparent !important;
   padding: 0 !important;
   color: inherit !important;
   box-shadow: none !important;
}

.tip-blue-content :deep(a) {
   color: #0077ff;
   text-decoration: underline;
   transition: opacity 0.2s ease;
}

.tip-blue-content :deep(a:hover) {
   opacity: 0.8;
}

.tip-blue-content :deep(strong) {
   color: #333;
   font-weight: 700;
}

.tip-blue-content :deep(em) {
   color: #0077ff;
   font-style: italic;
}

.tip-blue-content :deep(em strong),
.tip-blue-content :deep(strong em) {
   color: #0077ff;
   font-weight: 700;
   font-style: italic;
}

.tip-blue-content :deep(blockquote) {
   border-left: 3px solid #0077ff;
   color: #666;
}

.tip-blue-content :deep(hr) {
   border-top: 1px solid rgba(0, 119, 255, 0.2);
}
</style>
