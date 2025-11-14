<script setup lang="ts">
import Base from './Base.vue';

interface Props {
   title?: string;
}

withDefaults(defineProps<Props>(), {
   title: '警告'
});
</script>

<template>
   <Base
      :title="title"
      container-class="warning-container"
      title-class="warning-title"
      content-class="warning-content"
   >
      <slot />
   </Base>
</template>

<style>
.warning-container {
   background-color: #fff9e7;
   border: 1px solid #ffe9a6;
   border-left: 4px solid #907b3f;
   border-radius: 8px;
   padding: 16px;
   margin: 16px 0;
}

.warning-title {
   color: #89653e;
   font-weight: 600;
   font-size: 14px;
}

.warning-content {
   color: #6b5d42;
   font-size: 14px;
   line-height: 1.6;
}

.warning-content code {
   background-color: #fdf0d2 !important;
   padding: 2px 6px;
   border-radius: 4px;
   font-family:
      'Fira Code', 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Courier New', monospace;
   font-size: 12px;
   color: #8c7738 !important;
   box-shadow: 0 1px 2px 0 rgba(144, 123, 63, 0.04);
   transition: background 0.2s;
}

.warning-content pre {
   background-color: #fffaf0 !important;
   border: 1px solid #f5e6d3 !important;
   border-radius: 6px;
   padding: 16px !important;
   overflow-x: auto;
   margin: 12px 0;
   font-family:
      'Fira Code', 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Courier New', monospace;
}

.warning-content pre code {
   background-color: transparent !important;
   padding: 0 !important;
   color: inherit !important;
   box-shadow: none !important;
}

.warning-content a {
   color: #907b3f;
   text-decoration: underline;
   transition: opacity 0.2s ease;
}

.warning-content a:hover {
   opacity: 0.8;
}

.warning-content strong {
   color: #333;
   font-weight: 700;
   font-size: 1.002rem;
}

.warning-content em {
   color: #907b3f;
   font-style: italic;
}

.warning-content em strong,
.warning-content strong em {
   color: #907b3f;
   font-weight: 700;
   font-style: italic;
}

.warning-content blockquote {
   border-left: 3px solid #907b3f;
   color: #7a8487;
}

.warning-content hr {
   border-top: 1px solid rgba(144, 123, 63, 0.2);
}
</style>
