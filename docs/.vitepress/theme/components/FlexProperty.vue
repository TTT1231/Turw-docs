<script setup lang="ts">
import { ref, computed, inject } from 'vue';
import { messageKey } from '../types/injectionKey';

//注入
const message = inject(messageKey);

// 响应式数据
const justifyContent = ref<
   'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'
>('flex-start');
const alignItems = ref<'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline'>('stretch');
const flexDirection = ref<'row' | 'row-reverse' | 'column' | 'column-reverse'>('row');

const flex = ref<'flex-initial' | 'flex-1' | 'flex-auto' | 'flex-none'>('flex-initial');
const flexWrap = ref<'nowrap' | 'wrap' | 'wrap-reverse'>('nowrap');

// 计算属性：容器样式
const containerStyle = computed(() => ({
   display: 'flex',
   justifyContent: justifyContent.value,
   alignItems: alignItems.value,
   flexDirection: flexDirection.value,
   flexWrap: flexWrap.value,
   minHeight: flexDirection.value.includes('column') ? '300px' : '150px',
   width: '100%',
   border: '2px solid #e5e7eb',
   padding: '16px',
   backgroundColor: '#f9fafb',
   borderRadius: '8px',
   gap: '8px'
}));

// 计算属性：CSS代码
const cssCode = computed(() => {
   const flexMap = {
      'flex-initial': '0 1 auto',
      'flex-1': '1 1 0%',
      'flex-auto': '1 1 auto',
      'flex-none': 'none'
   };

   return `.container {
  display: flex;
  justify-content: ${justifyContent.value};
  align-items: ${alignItems.value};
  flex-direction: ${flexDirection.value};
  flex-wrap: ${flexWrap.value};
}

.flex-item {
  flex: ${flexMap[flex.value]};
}`;
});

// 计算属性：Tailwind CSS代码
const tailwindCode = computed(() => {
   const justifyMap = {
      'flex-start': 'justify-start',
      'flex-end': 'justify-end',
      center: 'justify-center',
      'space-between': 'justify-between',
      'space-around': 'justify-around',
      'space-evenly': 'justify-evenly'
   };

   const alignMap = {
      stretch: 'items-stretch',
      'flex-start': 'items-start',
      'flex-end': 'items-end',
      center: 'items-center',
      baseline: 'items-baseline'
   };

   const directionMap = {
      row: 'flex-row',
      'row-reverse': 'flex-row-reverse',
      column: 'flex-col',
      'column-reverse': 'flex-col-reverse'
   };

   const wrapMap = {
      nowrap: 'flex-nowrap',
      wrap: 'flex-wrap',
      'wrap-reverse': 'flex-wrap-reverse'
   };

   const containerClasses = [
      'flex',
      justifyMap[justifyContent.value],
      alignMap[alignItems.value],
      directionMap[flexDirection.value],
      wrapMap[flexWrap.value]
   ].join(' ');

   return `<div class="${containerClasses}">
  <div class="${flex.value}">Item 1</div>
  <div class="${flex.value}">Item 2</div>
  <div class="${flex.value}">Item 3</div>
</div>`;
});

// 高亮显示Css代码
const highlightCss = (code: string) => {
   return code
      .replace(/(\.[a-zA-Z-]+)/g, '<span class="css-selector">$1</span>')
      .replace(/\{/g, '<span class="css-brace">{</span>')
      .replace(/\}/g, '<span class="css-brace">}</span>')
      .replace(
         /(display|justify-content|align-items|flex-direction|flex-wrap):/g,
         '<span class="css-property">$1</span><span class="css-colon">:</span>'
      )
      .replace(/;/g, '<span class="css-semicolon">;</span>')
      .replace(
         /(flex|flex-start|flex-end|center|space-between|space-around|space-evenly|stretch|row|row-reverse|column|column-reverse|nowrap|wrap|wrap-reverse)(?=;|\s)/g,
         '<span class="css-value">$1</span>'
      );
};

// 高亮显示Tailwind CSS代码
const highlightTailwind = (code: string) => {
   // 首先转义HTML实体
   let result = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');

   // 然后进行高亮处理
   result = result
      // 处理class属性值中的Tailwind类名
      .replace(/class="([^"]*)"/g, (match, classes) => {
         const highlightedClasses = classes.replace(
            /(flex|justify-start|justify-end|justify-center|justify-between|justify-around|justify-evenly|items-stretch|items-start|items-end|items-center|items-baseline|flex-row|flex-row-reverse|flex-col|flex-col-reverse|flex-nowrap|flex-wrap|flex-wrap-reverse)/g,
            '<span class="tailwind-class">$1</span>'
         );
         return `<span class="html-attr">class</span><span class="html-equals">=</span>"<span class="tailwind-classes">${highlightedClasses}</span>"`;
      })
      // 处理HTML标签
      .replace(/&lt;div/g, '<span class="html-tag">&lt;div</span>')
      .replace(/&lt;\/div&gt;/g, '<span class="html-tag">&lt;/div&gt;</span>')
      .replace(/&gt;/g, '<span class="html-tag">&gt;</span>');

   return result;
};

// 复制代码到剪贴板
const copyToClipboard = async (text: string, type: string) => {
   try {
      await navigator.clipboard.writeText(text);
      // 简单的成功提示 - 可以根据需要替换为更好的通知组件

      message?.success({
         content: '复制成功',
         duration: 0.7,
         //屏幕中心
         style: {
            marginTop: '20vh'
         }
      });
   } catch (err) {
      console.error('复制失败:', err);
   }
};
</script>

<template>
   <div class="flex-property-demo">
      <!-- 属性选择器 -->
      <div class="property-selectors">
         <div class="selector-group">
            <label>justify-content:</label>
            <a-select v-model:value="justifyContent" style="width: 100%">
               <a-select-option value="flex-start">flex-start (左对齐)-默认</a-select-option>
               <a-select-option value="flex-end">flex-end (右对齐)</a-select-option>
               <a-select-option value="center">center (居中)</a-select-option>
               <a-select-option value="space-between">space-between (两端对齐)</a-select-option>
               <a-select-option value="space-around">space-around (环绕对齐)</a-select-option>
               <a-select-option value="space-evenly">space-evenly (平均分布)</a-select-option>
            </a-select>
         </div>

         <div class="selector-group">
            <label>align-items:</label>
            <a-select v-model:value="alignItems" style="width: 100%">
               <a-select-option value="stretch">stretch (拉伸)-默认</a-select-option>
               <a-select-option value="flex-start">flex-start (顶部对齐)</a-select-option>
               <a-select-option value="flex-end">flex-end (底部对齐)</a-select-option>
               <a-select-option value="center">center (垂直居中)</a-select-option>
               <a-select-option value="baseline">baseline (基线对齐)</a-select-option>
            </a-select>
         </div>

         <div class="selector-group">
            <label>flex-direction:</label>
            <a-select v-model:value="flexDirection" style="width: 100%">
               <a-select-option value="row">row (水平)-默认</a-select-option>
               <a-select-option value="row-reverse">row-reverse (水平反向)</a-select-option>
               <a-select-option value="column">column (垂直)</a-select-option>
               <a-select-option value="column-reverse">column-reverse (垂直反向)</a-select-option>
            </a-select>
         </div>

         <div class="selector-group">
            <label>flex-wrap:</label>
            <a-select v-model:value="flexWrap" style="width: 100%">
               <a-select-option value="nowrap">nowrap (不换行)-默认</a-select-option>
               <a-select-option value="wrap">wrap (换行)</a-select-option>
               <a-select-option value="wrap-reverse">wrap-reverse (反向换行)</a-select-option>
            </a-select>
         </div>

         <div class="selector-group">
            <label>flex-grow/shrink/basis:</label>
            <a-select v-model:value="flex" style="width: 100%">
               <a-select-option value="flex-initial"
                  >flex-initial (0 1 auto) - 默认</a-select-option
               >
               <a-select-option value="flex-1">flex-1 (1 1 0) - 平均分配</a-select-option>
               <a-select-option value="flex-auto">flex-auto (1 1 auto) - 基于内容</a-select-option>
               <a-select-option value="flex-none">flex-none (0 0 auto) - 固定大小</a-select-option>
            </a-select>
         </div>
      </div>
      <!-- 效果展示 -->
      <div class="demo-preview">
         <h4>效果展示</h4>
         <div class="flex-container" :style="containerStyle">
            <div class="flex-item item-1" :class="flex">Item 1</div>
            <div class="flex-item item-2" :class="flex">Item 2</div>
            <div class="flex-item item-3" :class="flex">Item 3</div>
            <div class="flex-item item-4" :class="flex" v-if="flexDirection.includes('row')">
               Item 4
            </div>
         </div>
      </div>
      <!-- 代码显示区域 -->
      <div class="code-display">
         <div class="code-section">
            <div class="code-header">
               <h4>
                  <span class="code-icon">🎨</span>
                  CSS 代码
               </h4>
               <button
                  class="copy-button"
                  @click="copyToClipboard(cssCode, 'CSS')"
                  title="复制代码"
               >
                  <svg
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
               </button>
            </div>
            <pre><code class="css-code" v-html="highlightCss(cssCode)"></code></pre>
         </div>

         <div class="code-section">
            <div class="code-header">
               <h4>
                  <span class="code-icon">⚡</span>
                  Tailwind CSS
               </h4>
               <button
                  class="copy-button"
                  @click="copyToClipboard(tailwindCode, 'Tailwind CSS')"
                  title="复制代码"
               >
                  <svg
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
               </button>
            </div>
            <pre><code class="tailwind-code" v-html="highlightTailwind(tailwindCode)"></code></pre>
         </div>
      </div>
   </div>
</template>

<style scoped>
.flex-property-demo {
   margin: 24px 0;
   padding: 20px;
   border: 1px solid #e5e7eb;
   border-radius: 12px;
   background: #fefefe;
}

.property-selectors {
   display: grid;
   grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
   gap: 16px;
   margin-bottom: 24px;
}

.selector-group {
   display: flex;
   flex-direction: column;
   gap: 6px;
}

.selector-group label {
   font-weight: 600;
   color: #374151;
   font-size: 14px;
}

.demo-preview {
   margin-bottom: 32px;
   padding: 20px;
   background: #f8fafc;
   border-radius: 8px;
   border: 1px solid #e5e7eb;
}

.code-display {
   display: grid;
   grid-template-columns: 1fr 1fr;
   gap: 16px;
   margin-bottom: 24px;
}

@media (max-width: 768px) {
   .code-display {
      grid-template-columns: 1fr;
   }
}

.code-section {
   border-radius: 8px;
   overflow: hidden;
   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
   position: relative;
}

.code-section:first-child {
   background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.code-section:last-child {
   background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
}

.code-header {
   display: flex;
   justify-content: space-between;
   align-items: center;
   padding: 12px 16px;
   position: relative;
}

.code-section h4 {
   margin: 0;
   font-size: 14px;
   font-weight: 600;
   color: white;
   display: flex;
   align-items: center;
   gap: 8px;
}

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
   transform: scale(1.05);
}

.copy-button:active {
   transform: scale(0.95);
}

.copy-button svg {
   width: 14px;
   height: 14px;
}

.code-icon {
   font-size: 16px;
}

.code-section pre {
   margin: 0;
   padding: 16px;
   overflow-x: auto;
   background: rgba(255, 255, 255, 0.95);
   backdrop-filter: blur(10px);
}

.code-section code {
   font-family:
      'Fira Code', 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Courier New', monospace;
   font-size: 13px;
   line-height: 1.6;
   color: #24292f;
}

/* CSS 语法高亮 */
.code-section :deep(.css-selector) {
   color: #d73a49;
   font-weight: 600;
}

.code-section :deep(.css-property) {
   color: #005cc5;
   font-weight: 500;
}

.code-section :deep(.css-value) {
   color: #032f62;
   background: rgba(3, 47, 98, 0.1);
   padding: 1px 3px;
   border-radius: 3px;
}

.code-section :deep(.css-brace) {
   color: #e36209;
   font-weight: bold;
}

.code-section :deep(.css-colon) {
   color: #24292f;
}

.code-section :deep(.css-semicolon) {
   color: #6a737d;
}

/* Tailwind 语法高亮 */
.tailwind-code :deep(.html-tag) {
   color: #22863a;
   font-weight: 600;
}

.tailwind-code :deep(.html-attr) {
   color: #6f42c1;
}

.tailwind-code :deep(.html-equals) {
   color: #24292f;
}

.tailwind-code :deep(.tailwind-classes) {
   color: #032f62;
   background: rgba(3, 47, 98, 0.1);
   padding: 2px 4px;
   border-radius: 3px;
}

.tailwind-code :deep(.tailwind-class) {
   color: #e36209;
   font-weight: 500;
   background: rgba(227, 98, 9, 0.1);
   padding: 1px 2px;
   border-radius: 2px;
   margin: 0 1px;
}

.tailwind-code :deep(.html-comment) {
   color: #6a737d;
   font-style: italic;
}

.demo-preview h4 {
   margin: 0 0 12px 0;
   color: #1f2937;
   font-size: 16px;
   font-weight: 600;
}

.flex-container {
   transition: all 0.3s ease;
}

.flex-item {
   padding: 16px 20px;
   border-radius: 6px;
   font-weight: 500;
   text-align: center;
   color: white;
   min-width: 80px;
   transition: all 0.3s ease;
}

.item-1 {
   background: linear-gradient(135deg, #ef4444, #dc2626);
}

.item-2 {
   background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.item-3 {
   background: linear-gradient(135deg, #10b981, #059669);
}

.item-4 {
   background: linear-gradient(135deg, #f59e0b, #d97706);
}

.flex-item:hover {
   transform: scale(1.05);
   box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Flex 属性样式 */
.flex-initial {
   flex: 0 1 auto;
}

.flex-1 {
   flex: 1 1 0%;
}

.flex-auto {
   flex: 1 1 auto;
}

.flex-none {
   flex: none;
}
</style>
