<script setup lang="ts">
import { onMounted, ref } from 'vue';

interface Props {
   title?: string;
}

withDefaults(defineProps<Props>(), {
   title: 'TIP'
});

const contentRef = ref<HTMLElement>();

const processMarkdown = (html: string): string => {
   // 处理代码块 ```lang\ncode\n``` -> <div class="code-block-wrapper">...</div>
   html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      const language = lang || 'plaintext';
      const escapedCode = code
         .trim()
         .replace(/&/g, '&amp;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;')
         .replace(/"/g, '&quot;')
         .replace(/'/g, '&#039;');
      return `<div class="code-block-wrapper"><div class="code-block-lang">${language}</div><pre class="language-${language}"><code>${escapedCode}</code></pre></div>`;
   });

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
   <div class="tip-blue-container">
      <div class="tip-blue-header">
         <span class="tip-blue-title">{{ title }}</span>
      </div>
      <div ref="contentRef" class="tip-blue-content">
         <slot />
      </div>
   </div>
</template>

<style scoped>
.tip-blue-container {
   background-color: #f0f9ff;
   border: 1px solid #b3e5fc;
   border-left: 4px solid #0077ff;
   border-radius: 8px;
   padding: 16px;
   margin: 16px 0;
}

.tip-blue-header {
   display: flex;
   align-items: center;
   gap: 8px;
   margin-bottom: 12px;
}

.tip-blue-icon {
   font-size: 18px;
   display: flex;
   align-items: center;
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

.tip-blue-content :deep(p) {
   margin: 0;
}

.tip-blue-content :deep(p + p) {
   margin-top: 12px;
}

.tip-blue-content :deep(code) {
   background-color: #ddf0fe; /* 比#e3f2fd略深，层次分明 */
   padding: 2px 6px;
   border-radius: 4px;
   font-family:
      'Fira Code', 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Courier New', monospace;
   font-size: 12px;
   color: #0d71e4; /* 稍深蓝色，清晰易读 */
   box-shadow: 0 1px 2px 0 rgba(23, 78, 166, 0.04);
   transition: background 0.2s;
}

/* 代码块容器 */
.tip-blue-content :deep(.code-block-wrapper) {
   position: relative;
   margin: 12px 0;
}

/* 语言标签 */
.tip-blue-content :deep(.code-block-lang) {
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

.tip-blue-content :deep(pre) {
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

.tip-blue-content :deep(pre code) {
   background-color: transparent;
   padding: 0;
   color: #24292f;
   font-size: 13px;
   line-height: 1.6;
   box-shadow: none;
   font-family: inherit;
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

.tip-blue-content :deep(ul),
.tip-blue-content :deep(ol) {
   margin: 8px 0;
   padding-left: 24px;
}

.tip-blue-content :deep(li) {
   margin: 4px 0;
}

.tip-blue-content :deep(blockquote) {
   border-left: 3px solid #0077ff;
   margin: 8px 0;
   padding-left: 12px;
   color: #666;
   font-style: italic;
}

.tip-blue-content :deep(hr) {
   border: none;
   border-top: 1px solid rgba(0, 119, 255, 0.2);
   margin: 12px 0;
}
</style>
