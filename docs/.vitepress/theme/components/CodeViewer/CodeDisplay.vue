<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { codeToHtml } from 'shiki';
import type { ThemeMode } from './types';
import { getShikiTheme } from './types';
import { countLines } from './utils';

interface Props {
   code: string;
   lang: string;
   theme?: ThemeMode;
   enableFolding?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
   theme: 'dark',
   enableFolding: true
});

// Refs
const codeLinesHtml = ref<string[]>([]);
const codeLinesPlain = ref<string[]>([]);
const isLoading = ref(true);
// 使用 Map 存储折叠状态，key 为起始行号，value 为结束行号
const foldedRegions = ref<Map<number, number>>(new Map());
const foldableRegions = ref<Map<number, number>>(new Map());

// Computed
const lineCount = computed(() => countLines(props.code));

// ========== 常量 ==========
const SELF_CLOSING_TAGS = new Set([
   'img',
   'br',
   'hr',
   'input',
   'meta',
   'link',
   'area',
   'base',
   'col',
   'embed',
   'source',
   'track',
   'wbr',
   '!DOCTYPE',
   '!--'
]);

const CLOSE_TO_OPEN: Record<string, string> = { '}': '{', ')': '(', ']': '[' };
const BRACKET_OPEN_CHARS = ['{', '(', '['] as const;
const BRACKET_CLOSE_CHARS = ['}', ')', ']'] as const;

// ========== 辅助函数 ==========
function isMarkdown(): boolean {
   return props.lang === 'markdown' || props.lang === 'md';
}

function isHtmlLike(): boolean {
   return ['html', 'vue', 'svelte'].includes(props.lang);
}

function shouldSkipCommentLine(trimmed: string): boolean {
   if (isMarkdown()) return false;
   if (trimmed.startsWith('#')) return true;
   return ['//', '*', '/*'].some((prefix) => trimmed.startsWith(prefix));
}

function isBeforeComment(index: number, line: string): boolean {
   const commentIndex = line.indexOf('//');
   return commentIndex === -1 || index < commentIndex;
}

function isIncompleteTag(line: string): boolean {
   return line.match(/<[^>]*$/) !== null;
}

function isMultiLineRegion(startLine: number, endLine: number): boolean {
   return endLine > startLine;
}

// 查找栈中匹配元素的索引（从后往前查找）
function findMatchingIndex<T>(
   stack: Array<{ line: number } & T>,
   predicate: (item: T) => boolean
): number {
   for (let i = stack.length - 1; i >= 0; i--) {
      if (predicate(stack[i] as T)) return i;
   }
   return -1;
}

// 设置多行折叠区域
function setRegionIfMultiLine(
   regions: Map<number, number>,
   startLine: number,
   endLine: number
): void {
   if (isMultiLineRegion(startLine, endLine)) {
      regions.set(startLine, endLine);
   }
}

// ========== 折叠状态判断 ==========
function isLineHidden(lineNumber: number): boolean {
   return Array.from(foldedRegions.value.entries()).some(
      ([start, end]) => lineNumber > start && lineNumber < end
   );
}

function isFoldedStart(lineNumber: number): boolean {
   return foldedRegions.value.has(lineNumber);
}

function shouldShowLine(lineNumber: number): boolean {
   return !isLineHidden(lineNumber);
}

function toggleFold(startLine: number): void {
   const regions = foldedRegions.value;
   if (regions.has(startLine)) {
      regions.delete(startLine);
      return;
   }
   const endLine = foldableRegions.value.get(startLine);
   if (endLine) regions.set(startLine, endLine);
}

// ========== HTML 标签处理 ==========
function processOpenTags(
   line: string,
   lineIndex: number,
   tagStack: Array<{ line: number; tagName: string }>
): void {
   if (!isHtmlLike()) return;

   const openTagMatches = line.matchAll(/<([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g);
   for (const match of openTagMatches) {
      const tagName = match[1];
      if (!tagName) continue;

      const lowerTag = tagName.toLowerCase();
      if (SELF_CLOSING_TAGS.has(lowerTag)) continue;
      if (match[0]?.includes('/>')) continue;
      if (line.includes(`</${tagName}>`)) continue;

      tagStack.push({ line: lineIndex + 1, tagName });
   }
}

function processCloseTags(
   line: string,
   lineIndex: number,
   tagStack: Array<{ line: number; tagName: string }>,
   regions: Map<number, number>
): void {
   const closeTagMatches = line.matchAll(/<\/([a-zA-Z][a-zA-Z0-9]*)>/g);
   for (const match of closeTagMatches) {
      const tagName = match[1];
      if (!tagName) continue;

      const matchIndex = findMatchingIndex(
         tagStack,
         (tag) => tag.tagName.toLowerCase() === tagName.toLowerCase()
      );
      if (matchIndex === -1) continue;

      const startLine = tagStack[matchIndex]?.line;
      if (startLine !== undefined) {
         setRegionIfMultiLine(regions, startLine, lineIndex + 1);
      }
      tagStack.splice(matchIndex);
   }
}

// ========== 花括号/括号处理 ==========
function processOpenBrackets(
   line: string,
   lineIndex: number,
   braceStack: Array<{ line: number; char: string }>
): void {
   for (const char of BRACKET_OPEN_CHARS) {
      const openIndex = line.indexOf(char);
      if (openIndex === -1) continue;
      if (!isBeforeComment(openIndex, line)) continue;
      if (isIncompleteTag(line)) continue;

      braceStack.push({ line: lineIndex + 1, char });
   }
}

function processCloseBrackets(
   line: string,
   lineIndex: number,
   braceStack: Array<{ line: number; char: string }>,
   regions: Map<number, number>
): void {
   for (const char of BRACKET_CLOSE_CHARS) {
      const closeIndex = line.indexOf(char);
      if (closeIndex === -1) continue;
      if (!isBeforeComment(closeIndex, line)) continue;

      const matchingOpen = CLOSE_TO_OPEN[char];
      const matchIndex = findMatchingIndex(braceStack, (item) => item.char === matchingOpen);
      if (matchIndex === -1) continue;

      const startLine = braceStack[matchIndex]?.line;
      if (startLine !== undefined) {
         setRegionIfMultiLine(regions, startLine, lineIndex + 1);
      }
      braceStack.splice(matchIndex);
   }
}

// ========== Markdown 折叠处理 ==========
function processMarkdownHeadings(
   trimmed: string,
   lineIndex: number,
   lines: string[],
   regions: Map<number, number>
): void {
   if (!trimmed.startsWith('#')) return;

   // 找到下一个标题行
   for (let j = lineIndex + 1; j < lines.length; j++) {
      const nextLine = (lines[j] ?? '').trim();
      if (nextLine.startsWith('#')) {
         // 找到下一个标题，设置折叠区域
         regions.set(lineIndex + 1, j + 1);
         return;
      }
   }

   // 如果后面没有标题了，折叠到文件末尾
   if (lineIndex < lines.length - 1) {
      regions.set(lineIndex + 1, lines.length);
   }
}

function processMarkdownCodeBlocks(
   trimmed: string,
   lineIndex: number,
   lines: string[],
   regions: Map<number, number>
): void {
   if (!trimmed.startsWith('```')) return;

   const endIndex = lines.findIndex((line, j) => j > lineIndex && line.trim().startsWith('```'));
   if (endIndex !== -1 && endIndex > lineIndex) {
      regions.set(lineIndex + 1, endIndex + 1);
   }
}

// ========== 主解析函数 ==========
function findFoldableRegions(lines: string[]): Map<number, number> {
   const regions = new Map<number, number>();
   const braceStack: Array<{ line: number; char: string }> = [];
   const tagStack: Array<{ line: number; tagName: string }> = [];

   for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      const trimmed = line.trim();

      if (shouldSkipCommentLine(trimmed)) continue;

      processOpenTags(line, i, tagStack);
      processCloseTags(line, i, tagStack, regions);
      processOpenBrackets(line, i, braceStack);
      processCloseBrackets(line, i, braceStack, regions);

      if (isMarkdown()) {
         processMarkdownHeadings(trimmed, i, lines, regions);
         processMarkdownCodeBlocks(trimmed, i, lines, regions);
      }
   }

   return regions;
}

const COMMENT_COLORS = {
   light: { from: ['#6A9955', '999999', '858585', '6e6e6e', '6a737d', '999'], to: '#6A9955' },
   dark: { from: ['#6A9955'], to: '#7f848e' }
} as const;

// 明亮模式下颜色映射
const LIGHT_COLOR_MAP: Record<string, string> = {
   // RGB 格式
   'rgb(36, 41, 46)': 'rgb(20, 24, 30)',
   'rgb(111, 66, 193)': 'rgb(85, 45, 160)',
   'rgb(3, 47, 98)': 'rgb(2, 60, 90)',
   'rgb(227, 98, 9)': 'rgb(180, 70, 0)',
   'rgb(0, 92, 197)': 'rgb(0, 65, 150)',
   'rgb(106, 115, 125)': 'rgb(60, 70, 80)',
   'rgb(215, 58, 73)': 'rgb(170, 35, 45)',
   'rgb(34, 134, 58)': 'rgb(20, 100, 40)',
   'rgb(88, 96, 105)': 'rgb(50, 60, 70)',
   // 十六进制格式
   '#24292e': '#14181e',
   '#6f42c1': '#552da0',
   '#032f62': '#023c5a',
   '#e36209': '#b44600',
   '#005cc5': '#004196',
   '#6a737d': '#3c4650',
   '#d73a49': '#ae2330',
   '#22863a': '#146428',
   '#586069': '#323c46'
};

function fixCommentColors(html: string, theme: ThemeMode): string {
   const config = COMMENT_COLORS[theme];
   if (!config) return html;

   let result = html;

   // 统一处理注释颜色
   for (const color of config.from) {
      result = result.replace(
         new RegExp(`style="color:\\s*#${color}"`, 'gi'),
         `style="color: ${config.to}"`
      );
   }

   // 明亮模式下的颜色增强
   if (theme === 'light') {
      // 替换预定义颜色
      for (const [from, to] of Object.entries(LIGHT_COLOR_MAP)) {
         result = result.replace(
            new RegExp(`style="color:\\s*${from}"`, 'g'),
            `style="color: ${to}"`
         );
      }

      // 通用处理：加深浅灰色
      result = result.replace(/style="color:\s*rgb\((\d+),\s*(\d+),\s*(\d+)\)"/g, (_, r, g, b) => {
         const rNum = parseInt(r, 10);
         const gNum = parseInt(g, 10);
         const bNum = parseInt(b, 10);

         if (rNum > 150 && gNum > 150 && bNum > 150) {
            const darker = Math.max(60, rNum - 60);
            return `style="color: rgb(${darker}, ${darker}, ${darker})"`;
         }
         return `style="color: rgb(${rNum}, ${gNum}, ${bNum})"`;
      });
   }

   return result;
}

// ========== 代码高亮 ==========
async function highlightCode(): Promise<void> {
   isLoading.value = true;
   foldedRegions.value.clear();

   try {
      const shikiTheme = getShikiTheme(props.theme);
      const html = await codeToHtml(props.code, {
         lang: props.lang,
         theme: shikiTheme
      });

      const fixedHtml = fixCommentColors(html, props.theme);

      const doc = new DOMParser().parseFromString(fixedHtml, 'text/html');
      const lineElements = doc.querySelectorAll('.line');

      codeLinesHtml.value =
         lineElements.length > 0
            ? Array.from(lineElements, (el) => el.innerHTML)
            : props.code.split('\n').map(escapeHtml);
      codeLinesPlain.value = props.code.split('\n');

      if (props.enableFolding) {
         foldableRegions.value = findFoldableRegions(codeLinesPlain.value);
      }
   } catch {
      const lines = props.code.split('\n');
      codeLinesHtml.value = lines.map(escapeHtml);
      codeLinesPlain.value = lines;

      if (props.enableFolding) {
         foldableRegions.value = findFoldableRegions(codeLinesPlain.value);
      }
   } finally {
      isLoading.value = false;
   }
}

function escapeHtml(text: string): string {
   const div = document.createElement('div');
   div.textContent = text;
   return div.innerHTML;
}

// 监听和初始化
watch(() => [props.code, props.lang, props.theme], highlightCode, { flush: 'post' });
onMounted(highlightCode);
</script>

<template>
   <div class="code-display" :class="`theme-${theme}`">
      <div v-if="isLoading" class="loading">
         <span>加载中...</span>
      </div>
      <div v-else class="code-content-wrapper">
         <div class="code-rows">
            <!-- 每一行代码 -->
            <template v-for="lineIndex in lineCount" :key="lineIndex">
               <!-- 跳过被隐藏的行 -->
               <div
                  v-if="shouldShowLine(lineIndex)"
                  class="code-row"
                  :class="{ 'folded-row': isFoldedStart(lineIndex) }"
               >
                  <!-- 行号和折叠按钮容器 -->
                  <div class="line-number-collapse-container">
                     <!-- 行号区域 -->
                     <span class="line-number">{{ lineIndex }}</span>

                     <!-- 折叠按钮区域 - 只在可折叠的行显示 -->
                     <button
                        v-if="enableFolding && foldableRegions.has(lineIndex)"
                        class="collapse-btn"
                        @click="toggleFold(lineIndex)"
                     >
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                           <path v-if="isFoldedStart(lineIndex)" d="M6 4L10 8L6 12V4Z" />
                           <path v-else d="M4 6L8 10L12 6H4Z" />
                        </svg>
                     </button>
                     <span v-else class="collapse-placeholder"></span>
                  </div>

                  <!-- 代码内容 -->
                  <div class="line-content-wrapper">
                     <pre class="line-content" v-html="codeLinesHtml[lineIndex - 1] || ' '"></pre>
                     <!-- 折叠省略号 - 可点击展开 -->
                     <span
                        v-if="isFoldedStart(lineIndex)"
                        class="fold-ellipsis"
                        @click="toggleFold(lineIndex)"
                        title="点击展开"
                        >...</span
                     >
                  </div>
               </div>
            </template>
         </div>
      </div>
   </div>
</template>

<style lang="scss" scoped>
@use './theme.scss';

.code-display {
   width: 100%;
   height: 100%;
   overflow: auto;
   font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
   font-size: 14px;
   line-height: 1.5;
   background: var(--cv-bg);
   display: flex;
   flex-direction: column;

   // 水平和垂直滚动条样式
   // width 控制垂直滚动条宽度，height 控制水平滚动条高度
   &::-webkit-scrollbar {
      width: 10px; // 垂直滚动条宽度
      height: 10px; // 水平滚动条高度
   }

   &::-webkit-scrollbar-track {
      background: transparent;
   }

   &::-webkit-scrollbar-thumb {
      background: var(--cv-gray-2);
      border-radius: 5px;

      &:hover {
         background: var(--vp-c-gray-1);
      }
   }

   // Firefox 支持 (同时支持水平和垂直)
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
   flex: 1;
}

.code-content-wrapper {
   width: 100%;
   flex: 1;
   min-height: 100%;
}

.code-rows {
   display: flex;
   flex-direction: column;
   min-height: 100%;
}

.code-row {
   display: flex;
   align-items: stretch;
   min-height: 22px;
}

.code-row:hover {
   background: var(--cv-bg-soft);
}

// 折叠行 - VS Code 风格背景
.folded-row {
   background: rgba(79, 126, 200, 0.15) !important;
   border-bottom: 1px solid rgba(79, 126, 200, 0.3);
}

.folded-row:hover {
   background: rgba(79, 126, 200, 0.22) !important;
}

// 行号和折叠按钮容器
.line-number-collapse-container {
   display: flex;
   align-items: center;
   width: 50px;
   flex-shrink: 0;
   background: var(--cv-bg-soft);
   border-right: 1px solid var(--cv-divider-2);
}

// 行号区域
.line-number {
   width: 30px;
   text-align: right;
   padding-right: 4px;
   color: var(--cv-text-2);
   font-size: 13px;
   user-select: none;
   flex-shrink: 0;
}

// 折叠按钮区域 - 无 hover 样式
.collapse-btn {
   width: 16px;
   height: 16px;
   display: flex;
   align-items: center;
   justify-content: center;
   border: none;
   background: transparent;
   color: var(--cv-text-2);
   cursor: pointer;
   border-radius: 2px;
   padding: 0;
   flex-shrink: 0;
}

// 无 hover 样式变化
.collapse-btn:hover {
   background: transparent;
   color: var(--cv-text-2);
}

.collapse-placeholder {
   width: 16px;
   flex-shrink: 0;
}

// 代码内容容器
.line-content-wrapper {
   flex: 1;
   display: flex;
   align-items: center;
   min-height: 22px;
}

// 代码内容
.line-content {
   padding: 0 2px;
   margin: 0;
   font-family: inherit;
   font-size: inherit;
   line-height: 22px;
   color: var(--cv-text-1);
   white-space: pre;
}

// 折叠省略号
.fold-ellipsis {
   color: rgba(152, 195, 255, 0.6);
   font-size: 13px;
   cursor: pointer;
   user-select: none;
   margin-left: 4px;
}

// Shiki 高亮样式 - 确保语法高亮正常工作
.line-content :deep(code) {
   font-family: inherit;
   font-size: inherit;
   background: transparent;
   padding: 0;
}
</style>
