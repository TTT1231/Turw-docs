<script setup lang="ts">
import { onMounted, ref } from 'vue';

interface Props {
   title?: string;
   containerClass?: string;
   titleClass?: string;
   contentClass?: string;
}

withDefaults(defineProps<Props>(), {
   title: '',
   containerClass: '',
   titleClass: '',
   contentClass: ''
});

const contentRef = ref<HTMLElement>();

const processMarkdown = (html: string): string => {
   // 处理加粗 **text** -> <strong>text</strong>
   html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

   // 处理行内代码 `text` -> <code>text</code>
   html = html.replace(/`([^`]+?)`/g, '<code>$1</code>');

   return html;
};

onMounted(() => {
   if (contentRef.value) {
      const textNodes: Node[] = [];

      // 收集所有文本节点
      const collectTextNodes = (node: Node) => {
         if (node.nodeType === Node.TEXT_NODE) {
            textNodes.push(node);
         } else if (
            node.nodeType === Node.ELEMENT_NODE &&
            !['CODE', 'PRE', 'A', 'STRONG', 'EM'].includes((node as Element).tagName)
         ) {
            for (let child of node.childNodes) {
               collectTextNodes(child);
            }
         }
      };

      collectTextNodes(contentRef.value);

      // 处理每个文本节点
      textNodes.forEach((textNode) => {
         const text = textNode.textContent || '';
         const processedHtml = processMarkdown(text);

         if (processedHtml !== text) {
            const span = document.createElement('span');
            span.innerHTML = processedHtml;

            textNode.parentNode?.replaceChild(span, textNode);
         }
      });
   }
});
</script>

<template>
   <div :class="containerClass">
      <div class="base-header">
         <span :class="titleClass">{{ title }}</span>
      </div>
      <div ref="contentRef" :class="contentClass">
         <slot />
      </div>
   </div>
</template>

<style scoped>
.base-header {
   display: flex;
   align-items: center;
   gap: 8px;
   margin-bottom: 12px;
}

/* 代码块容器 */
:deep(.code-block-wrapper) {
   position: relative;
   margin: 12px 0;
}

/* 语言标签 */
:deep(.code-block-lang) {
   position: absolute;
   top: 8px;
   right: 12px;
   font-size: 11px;
   color: #6b7280;
   font-weight: 500;
   text-transform: uppercase;
   letter-spacing: 0.5px;
   z-index: 1;
   font-family:
      'Fira Code', 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Courier New', monospace;
}

:deep(pre) {
   background-color: #f6f8fa;
   border: 1px solid #d0d7de;
   border-radius: 6px;
   padding: 16px;
   padding-top: 32px; /* 为语言标签留出空间 */
   overflow-x: auto;
   margin: 0;
   font-family:
      'Fira Code', 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Courier New', monospace;
}

:deep(pre code) {
   background-color: transparent;
   padding: 0;
   font-size: 13px;
   line-height: 1.6;
   box-shadow: none;
   font-family: inherit;
}

:deep(p) {
   margin: 0;
}

:deep(p + p) {
   margin-top: 12px;
}

:deep(ul),
:deep(ol) {
   margin: 8px 0;
   padding-left: 24px;
}

:deep(li) {
   margin: 4px 0;
}

:deep(blockquote) {
   margin: 8px 0;
   padding-left: 12px;
   font-style: italic;
}

:deep(hr) {
   border: none;
   margin: 12px 0;
}
</style>
