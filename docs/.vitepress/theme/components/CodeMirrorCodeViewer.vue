<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, shallowRef } from 'vue';
import { useData } from 'vitepress';
import {
   EditorView,
   lineNumbers,
   highlightActiveLine,
   highlightActiveLineGutter,
   drawSelection,
   highlightSpecialChars,
   rectangularSelection,
   crosshairCursor
} from '@codemirror/view';
import { EditorState, type Extension } from '@codemirror/state';
import {
   defaultHighlightStyle,
   syntaxHighlighting,
   indentOnInput,
   bracketMatching,
   foldGutter
} from '@codemirror/language';
import { highlightSelectionMatches } from '@codemirror/search';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import {
   loadManifest,
   convertManifestToFileNodes,
   loadFileContent,
   findFileByName,
   findFileByPath
} from './CodeViewer/utils';
import { getFileIconPath, getFolderIconPath } from './CodeViewer/iconMaps';
import type { FileNode } from './CodeViewer/types';

// ===== 类型定义 =====
type ThemeMode = 'light' | 'dark';

interface Props {
   /** 公共路径，如 /Turw-docs/codeview-container */
   publicPath: string;
   /** 默认选中的文件名（相对于 publicPath） */
   defaultFile?: string;
   /** 主题模式 (auto = 跟随 VitePress 主题) */
   theme?: ThemeMode | 'auto';
   /** 组件最小高度 */
   minHeight?: string;
   /** 组件最大高度 */
   maxHeight?: string;
   /** 是否启用代码折叠 */
   enableFolding?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
   defaultFile: '',
   theme: 'auto',
   minHeight: '420px',
   maxHeight: '680px',
   enableFolding: true
});

// ===== VitePress 主题检测 =====
const { isDark } = useData();

// 计算实际使用的主题
const actualTheme = computed<ThemeMode>(() => {
   if (props.theme === 'auto') {
      return isDark.value ? 'dark' : 'light';
   }
   return props.theme;
});

// ===== Refs =====
const editorContainer = ref<HTMLElement | null>(null);
const editorView = shallowRef<EditorView | null>(null);
const fileTree = ref<FileNode[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);
const currentFile = ref<FileNode | null>(null);
const currentContent = ref('');
const expandedFolders = ref<Set<string>>(new Set());

// ===== 文件类型颜色映射 =====
const EXT_TO_LANG: Record<
   string,
   { lang: 'json' | 'js' | 'ts' | 'mjs' | 'cjs'; color: string; label: string }
> = {
   '.json': { lang: 'json', color: '#fbbf24', label: 'JSON' },
   '.js': { lang: 'js', color: '#facc15', label: 'JS' },
   '.ts': { lang: 'ts', color: '#3b82f6', label: 'TS' },
   '.mjs': { lang: 'mjs', color: '#facc15', label: 'MJS' },
   '.cjs': { lang: 'cjs', color: '#facc15', label: 'CJS' }
};

// ===== 文件图标获取（使用 iconMaps 模块）=====
function getFileIcon(node: FileNode): string {
   if (node.type === 'directory') {
      return getFolderIconPath(false);
   }
   return getFileIconPath(node.name);
}

// 获取文件夹图标（展开/折叠）
function getFolderIcon(isExpanded: boolean): string {
   return getFolderIconPath(isExpanded);
}

// ===== 主题色板 =====
const editorColors = computed(() => {
   const dark = actualTheme.value === 'dark';
   return {
      editorBg: dark ? '#1e1e2e' : '#ffffff',
      editorText: dark ? '#cdd6f4' : '#1f1f1f',
      gutterBg: dark ? '#181825' : '#f8f8f8',
      gutterBorder: dark ? '#313244' : '#e8e8e8',
      lineNum: dark ? '#45475a' : '#6f6f6f',
      activeLineNum: dark ? '#cdd6f4' : '#1f1f1f',
      activeLine: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.022)',
      selection: dark ? 'rgba(99,102,241,0.30)' : 'rgba(173,214,255,0.60)',
      selectionFocused: dark ? 'rgba(99,102,241,0.38)' : 'rgba(173,214,255,0.85)',
      bracketBg: dark ? 'rgba(100,255,130,0.15)' : 'rgba(0,180,80,0.12)',
      bracketBorder: dark ? 'rgba(100,255,130,0.45)' : 'rgba(0,140,60,0.40)',
      foldBg: dark ? '#313244' : '#ebebeb',
      foldBorder: dark ? '#45475a' : '#c8c8c8',
      foldColor: dark ? '#7f849c' : '#6f6f6f',
      foldHoverBg: dark ? '#45475a' : '#d4d4d4',
      foldArrow: dark ? '#7f849c' : '#9e9e9e',
      searchMatch: dark ? 'rgba(234,179,8,0.30)' : 'rgba(234,179,8,0.35)',
      searchMatchSel: dark ? 'rgba(234,179,8,0.55)' : 'rgba(234,179,8,0.65)',
      scrollThumb: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.20)',
      scrollThumbHover: dark ? 'rgba(255,255,255,0.24)' : 'rgba(0,0,0,0.38)',
      headerBg: dark ? '#181825' : '#f3f3f3',
      headerBorder: dark ? '#313244' : '#e8e8e8',
      cardBorder: dark ? '#313244' : '#e0e0e0',
      cardShadow: dark ? '0 4px 24px rgba(0,0,0,0.35)' : '0 2px 12px rgba(0,0,0,0.10)',
      sidebarBg: dark ? '#11111b' : '#f8f8f8',
      sidebarBorder: dark ? '#1e1e2e' : '#e0e0e0',
      sidebarHoverBg: dark ? '#1e1e2e' : '#ebebeb',
      sidebarActiveBg: dark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.12)',
      sidebarActiveBorder: dark ? '#6366f1' : '#4f46e5'
   };
});

// ===== 扩展名标准化工具 =====
function normalizeExtension(extension: string | undefined): string {
   if (!extension) return '';
   const ext = extension.toLowerCase();
   return ext.startsWith('.') ? ext : `.${ext}`;
}

// ===== 计算当前文件信息 =====
const currentLang = computed(() => {
   if (!currentFile.value) return 'js';
   const extWithDot = normalizeExtension(currentFile.value.extension);
   return EXT_TO_LANG[extWithDot]?.lang || 'js';
});

const currentBadge = computed(() => {
   if (!currentFile.value) return { color: '#facc15', label: 'JS' };
   const extWithDot = normalizeExtension(currentFile.value.extension);
   const langInfo = EXT_TO_LANG[extWithDot];
   return {
      color: langInfo?.color || '#facc15',
      label: langInfo?.label || 'JS'
   };
});

// ===== 扁平化文件树用于显示 =====
const flatNodes = computed(() => {
   const result: Array<FileNode & { level: number }> = [];
   function traverse(nodes: FileNode[], depth = 0) {
      for (const node of nodes) {
         result.push({ ...node, level: depth });
         if (
            node.type === 'directory' &&
            node.children?.length &&
            expandedFolders.value.has(node.path)
         ) {
            traverse(node.children, depth + 1);
         }
      }
   }
   traverse(fileTree.value);
   return result;
});

// ===== 折叠 Gutter SVG 箭头 =====
function createFoldMarkerSVG(open: boolean): SVGSVGElement {
   const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
   svg.setAttribute('width', '10');
   svg.setAttribute('height', '10');
   svg.setAttribute('viewBox', '0 0 10 10');
   svg.setAttribute('fill', 'currentColor');

   const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
   if (open) {
      path.setAttribute('d', 'M2 3.5 L5 6.5 L8 3.5');
   } else {
      path.setAttribute('d', 'M3.5 2 L6.5 5 L3.5 8');
   }
   path.setAttribute('stroke', 'currentColor');
   path.setAttribute('stroke-width', '1.4');
   path.setAttribute('stroke-linecap', 'round');
   path.setAttribute('stroke-linejoin', 'round');
   path.setAttribute('fill', 'none');

   svg.appendChild(path);
   return svg;
}

function makeFoldMarker(open: boolean): HTMLElement {
   const el = document.createElement('span');
   el.className = open ? 'cm-fold-open' : 'cm-fold-closed';
   el.title = open ? 'Collapse' : 'Expand';
   el.appendChild(createFoldMarkerSVG(open));
   return el;
}

// ===== 获取语言扩展 =====
function getLanguageExtension(lang: 'json' | 'js' | 'ts' | 'mjs' | 'cjs') {
   const config: Record<string, { jsx?: boolean; typescript?: boolean }> = {
      json: { jsx: false, typescript: false },
      js: { jsx: true, typescript: false },
      ts: { jsx: true, typescript: true },
      mjs: { jsx: true, typescript: false },
      cjs: { jsx: true, typescript: false }
   };
   return javascript({ ...config[lang] });
}

// ===== 构建编辑器扩展 =====
function buildExtensions(): Extension[] {
   const extensions: Extension[] = [
      highlightSpecialChars(),
      drawSelection(),
      EditorState.readOnly.of(true),
      rectangularSelection(),
      crosshairCursor(),
      bracketMatching(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      getLanguageExtension(currentLang.value),
      lineNumbers(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      indentOnInput(),
      highlightSelectionMatches()
   ];

   if (props.enableFolding) {
      extensions.push(foldGutter({ markerDOM: makeFoldMarker }));
   }

   return extensions;
}

// ===== 初始化/更新编辑器 =====
function initEditor() {
   if (editorView.value) {
      editorView.value.destroy();
      editorView.value = null;
   }
   if (!editorContainer.value || !currentContent.value) {
      return;
   }

   try {
      const state = EditorState.create({
         doc: currentContent.value,
         extensions: [...buildExtensions(), actualTheme.value === 'dark' ? oneDark : []]
      });

      editorView.value = new EditorView({
         state,
         parent: editorContainer.value
      });
   } catch (err) {
      console.error('[CodeMirror] Failed to create editor:', err);
   }
}

// 更新编辑器内容（使用事务避免闪烁）
function updateEditorContent(content: string) {
   if (!editorView.value) {
      initEditor();
      return;
   }

   // 使用事务更新内容，而不是重建编辑器
   const currentDoc = editorView.value.state.doc.toString();
   if (currentDoc === content) return;

   editorView.value.dispatch({
      changes: {
         from: 0,
         to: editorView.value.state.doc.length,
         insert: content
      }
   });
}

function updateEditor() {
   if (!editorView.value) {
      initEditor();
      return;
   }

   const newState = EditorState.create({
      doc: currentContent.value,
      extensions: [...buildExtensions(), actualTheme.value === 'dark' ? oneDark : []]
   });
   editorView.value.setState(newState);
}

// ===== 文件操作 =====
async function selectFile(node: FileNode) {
   if (node.type !== 'file') {
      toggleFolder(node.path);
      return;
   }

   // 如果是同一个文件，不做任何操作
   if (currentFile.value?.path === node.path) {
      return;
   }

   currentFile.value = node;
   const content = await loadFileContent(node.path);
   currentContent.value = content || '';
}

function toggleFolder(path: string) {
   if (expandedFolders.value.has(path)) {
      expandedFolders.value.delete(path);
   } else {
      expandedFolders.value.add(path);
   }
}

function isExpanded(path: string) {
   return expandedFolders.value.has(path);
}

// ===== 初始化 =====
async function initialize() {
   isLoading.value = true;
   error.value = null;

   try {
      const manifest = await loadManifest(props.publicPath);
      fileTree.value = convertManifestToFileNodes(manifest);

      if (props.defaultFile) {
         const defaultNode =
            findFileByName(fileTree.value, props.defaultFile) ||
            findFileByPath(fileTree.value, `${props.publicPath}/${props.defaultFile}`);
         if (defaultNode) {
            await selectFile(defaultNode);
         }
      }
   } catch (err) {
      error.value = err instanceof Error ? err.message : String(err);
   } finally {
      isLoading.value = false;
   }
}

// ===== 监听 =====
// 监听 isLoading 初始化编辑器
watch(
   isLoading,
   (loading) => {
      if (!loading && currentContent.value && editorContainer.value && !editorView.value) {
         initEditor();
      }
   },
   { flush: 'post' }
);

// 记录上一次的语言，用于检测语言变化
let previousLang = currentLang.value;

// 监听内容变化，使用事务更新避免闪烁
watch(currentContent, (content) => {
   if (content && editorView.value) {
      // 检测语言是否变化
      const langChanged = previousLang !== currentLang.value;
      previousLang = currentLang.value;

      if (langChanged) {
         // 语言变化时需要更新整个状态（包括语法高亮扩展）
         updateEditor();
      } else {
         // 仅内容变化，使用事务更新避免闪烁
         updateEditorContent(content);
      }
   } else if (content && editorContainer.value && !editorView.value) {
      initEditor();
   }
});

watch(() => props.publicPath, initialize);
watch(actualTheme, updateEditor);

onMounted(initialize);

onUnmounted(() => {
   if (editorView.value) {
      editorView.value.destroy();
      editorView.value = null;
   }
});
</script>

<template>
   <div class="cm-code-viewer" :class="`theme-${actualTheme}`">
      <div v-if="isLoading" class="loading-state">
         <span>加载中...</span>
      </div>

      <div v-else-if="error" class="error-state">
         <span>{{ error }}</span>
      </div>

      <div
         v-else
         class="editor-layout"
         :style="{ minHeight: props.minHeight, maxHeight: props.maxHeight }"
      >
         <!-- 侧边栏 -->
         <aside class="sidebar">
            <div class="sidebar-header">
               <span>资源管理器</span>
            </div>
            <div class="sidebar-content">
               <div
                  v-for="node in flatNodes"
                  :key="node.path"
                  class="tree-node"
                  :class="{
                     directory: node.type === 'directory',
                     file: node.type === 'file',
                     active: currentFile?.path === node.path
                  }"
                  :style="{ paddingLeft: `${(node.level || 0) * 12 + 8}px` }"
                  @click="selectFile(node)"
               >
                  <span
                     v-if="node.type === 'directory'"
                     class="node-arrow"
                     :class="{ rotated: isExpanded(node.path) }"
                     @click.stop="toggleFolder(node.path)"
                  >
                     <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M6 4L10 8L6 12V4Z" />
                     </svg>
                  </span>
                  <span v-else class="node-arrow-placeholder" />

                  <span class="node-icon">
                     <img
                        v-if="node.type === 'directory'"
                        :src="getFolderIcon(isExpanded(node.path))"
                        :alt="node.name"
                        class="file-icon"
                     />
                     <img v-else :src="getFileIcon(node)" :alt="node.name" class="file-icon" />
                  </span>

                  <span class="node-name">{{ node.name }}</span>
               </div>
            </div>
         </aside>

         <!-- 编辑器区域 -->
         <main class="editor-main">
            <div class="editor-card">
               <!-- 标题栏 -->
               <div class="editor-header">
                  <span
                     class="file-badge"
                     :style="{ background: `${currentBadge.color}20`, color: currentBadge.color }"
                  >
                     {{ currentBadge.label }}
                  </span>
                  <span class="file-name">{{ currentFile?.name || '未选择文件' }}</span>
               </div>

               <!-- 编辑器容器 -->
               <div class="editor-wrapper">
                  <div ref="editorContainer" class="editor-container"></div>
                  <div v-if="!currentContent" class="empty-editor">
                     <span>请选择一个文件</span>
                  </div>
               </div>
            </div>
         </main>
      </div>
   </div>
</template>

<style lang="scss" scoped>
.cm-code-viewer {
   width: 100%;
   font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
   transition:
      background-color 0.3s ease,
      color 0.3s ease;
}

.loading-state,
.error-state {
   display: flex;
   align-items: center;
   justify-content: center;
   padding: 40px;
   color: v-bind('editorColors.lineNum');
   background: v-bind('editorColors.editorBg');
   border-radius: 12px;
   border: 1px solid v-bind('editorColors.cardBorder');
}

.error-state {
   color: #ef4444;
}

.editor-layout {
   display: flex;
   border-radius: 12px;
   overflow: hidden;
   border: 1px solid v-bind('editorColors.cardBorder');
   box-shadow: v-bind('editorColors.cardShadow');
   /* 固定高度范围，超出后内部滚动 */
   height: var(--editor-height, v-bind('props.minHeight'));
   min-height: v-bind('props.minHeight');
   max-height: v-bind('props.maxHeight');
}

/* 响应式调整：小屏幕降低最大高度 */
@media (max-height: 800px) {
   .editor-layout {
      max-height: 65vh;
   }
}

// ===== 侧边栏 =====
.sidebar {
   width: 200px;
   flex-shrink: 0;
   background: v-bind('editorColors.sidebarBg');
   border-right: 1px solid v-bind('editorColors.sidebarBorder');
   display: flex;
   flex-direction: column;
   /* 限制侧边栏高度，超出滚动 */
   overflow: hidden;
   max-height: 100%;
}

.sidebar-header {
   padding: 10px 12px;
   font-size: 11px;
   font-weight: 600;
   text-transform: uppercase;
   letter-spacing: 0.5px;
   color: v-bind('editorColors.lineNum');
   border-bottom: 1px solid v-bind('editorColors.sidebarBorder');
}

.sidebar-content {
   flex: 1;
   overflow-y: auto;
   overflow-x: hidden;
   padding: 4px 0;
   /* 滚动条默认隐藏，hover 时显示 */
   scrollbar-width: thin;
   scrollbar-color: transparent transparent;
   transition: scrollbar-color 0.2s;

   &:hover {
      scrollbar-color: v-bind('editorColors.scrollThumb') transparent;
   }

   &::-webkit-scrollbar {
      width: 6px;
   }

   &::-webkit-scrollbar-track {
      background: transparent;
   }

   &::-webkit-scrollbar-thumb {
      background: transparent;
      border-radius: 3px;
      transition: background 0.2s;
   }

   &:hover::-webkit-scrollbar-thumb {
      background: v-bind('editorColors.scrollThumb');
   }

   &:hover::-webkit-scrollbar-thumb:hover {
      background: v-bind('editorColors.scrollThumbHover');
   }
}

.tree-node {
   position: relative;
   display: flex;
   align-items: center;
   gap: 6px;
   padding: 5px 8px;
   cursor: pointer;
   transition: background 0.1s;
   white-space: nowrap;
   min-height: 26px;

   &:hover {
      background: v-bind('editorColors.sidebarHoverBg');
   }

   &.file.active {
      background: v-bind('editorColors.sidebarActiveBg');

      &::before {
         content: '';
         position: absolute;
         left: 0;
         width: 2px;
         height: 100%;
         background: v-bind('editorColors.sidebarActiveBorder');
         pointer-events: none;
      }
   }
}

.node-arrow {
   display: flex;
   align-items: center;
   justify-content: center;
   width: 16px;
   height: 16px;
   color: v-bind('editorColors.lineNum');
   flex-shrink: 0;

   svg {
      transition: transform 0.15s;
   }

   &.rotated svg {
      transform: rotate(90deg);
   }
}

.node-arrow-placeholder {
   width: 16px;
   flex-shrink: 0;
}

.node-icon {
   font-size: 14px;
   flex-shrink: 0;
   display: flex;
   align-items: center;
   justify-content: center;
   width: 18px;
   height: 18px;
}

.file-icon {
   width: 16px;
   height: 16px;
   object-fit: contain;
}

.node-name {
   flex: 1;
   font-size: 13px;
   color: v-bind('editorColors.editorText');
   overflow: hidden;
   text-overflow: ellipsis;
}

// ===== 编辑器主区域 =====
.editor-main {
   flex: 1;
   display: flex;
   flex-direction: column;
   min-width: 0;
   overflow: hidden;
   /* 限制高度，让编辑器内部滚动 */
   min-height: 0;
   max-height: 100%;
}

.editor-card {
   display: flex;
   flex-direction: column;
   flex: 1;
   overflow: hidden;
   min-height: 0;
}

.editor-header {
   display: flex;
   align-items: center;
   padding: 8px 10px 8px 14px;
   background: v-bind('editorColors.headerBg');
   border-bottom: 1px solid v-bind('editorColors.headerBorder');
   gap: 7px;
}

.file-badge {
   flex-shrink: 0;
   padding: 2px 7px;
   border-radius: 4px;
   font-size: 10px;
   font-weight: 700;
   font-family: 'Consolas', 'Monaco', monospace;
   letter-spacing: 0.06em;
}

.file-name {
   font-size: 13px;
   font-weight: 500;
   font-family: 'Consolas', 'Monaco', monospace;
   color: v-bind('editorColors.editorText');
   overflow: hidden;
   text-overflow: ellipsis;
   white-space: nowrap;
}

.empty-editor {
   display: flex;
   align-items: center;
   justify-content: center;
   flex: 1;
   background: v-bind('editorColors.editorBg');
   color: v-bind('editorColors.lineNum');
}

// ===== CodeMirror 编辑器 =====
.editor-wrapper {
   flex: 1;
   display: flex;
   flex-direction: column;
   overflow: hidden;
}

.editor-container {
   flex: 1;
   overflow: hidden;
   display: flex;
   flex-direction: column;

   :deep(.cm-editor) {
      height: 100%;
      flex: 1;
      font-family: 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 13.5px;
      line-height: 1.6;
      background: v-bind('editorColors.editorBg');
      color: v-bind('editorColors.editorText');
      transition:
         background-color 0.3s ease,
         color 0.3s ease;

      &.cm-focused {
         outline: none;
      }
   }

   :deep(.cm-scroller) {
      overflow: auto !important;
      flex: 1;
      font-family: inherit;

      &::-webkit-scrollbar {
         width: 10px;
         height: 10px;
      }

      &::-webkit-scrollbar-track {
         background: transparent;
      }

      &::-webkit-scrollbar-thumb {
         background: v-bind('editorColors.scrollThumb');
         border-radius: 5px;
         border: 2px solid transparent;
         background-clip: padding-box;

         &:hover {
            background: v-bind('editorColors.scrollThumbHover');
            border: 2px solid transparent;
            background-clip: padding-box;
         }
      }

      &::-webkit-scrollbar-corner {
         background: transparent;
      }
   }

   :deep(.cm-content) {
      padding: 6px 0 16px;
      caret-color: transparent;
   }

   :deep(.cm-gutters) {
      background: v-bind('editorColors.gutterBg');
      border-right: 1px solid v-bind('editorColors.gutterBorder');
      color: v-bind('editorColors.lineNum');
      user-select: none;
      padding: 0;
   }

   :deep(.cm-lineNumbers) {
      min-width: 42px;

      .cm-gutterElement {
         padding: 0 10px 0 6px;
         font-size: 12px;
         line-height: inherit;
         color: v-bind('editorColors.lineNum');
      }
   }

   :deep(.cm-activeLineGutter) {
      background: transparent;
      color: v-bind('editorColors.activeLineNum') !important;
   }

   :deep(.cm-activeLine) {
      background: v-bind('editorColors.activeLine');
   }

   :deep(.cm-foldGutter) {
      width: 18px;

      .cm-gutterElement {
         padding: 0;
         display: flex;
         align-items: center;
         justify-content: center;
         cursor: pointer;
         line-height: inherit;
      }
   }

   :deep(.cm-fold-open),
   :deep(.cm-fold-closed) {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      border-radius: 3px;
      color: transparent;
      transition:
         color 0.12s,
         background 0.12s;
   }

   :deep(.cm-gutters:hover .cm-fold-open) {
      color: v-bind('editorColors.foldArrow');
   }

   :deep(.cm-gutterElement:hover .cm-fold-open) {
      background: v-bind('editorColors.activeLine');
   }

   :deep(.cm-fold-closed) {
      color: v-bind('editorColors.foldArrow');
   }

   :deep(.cm-fold-closed:hover) {
      background: v-bind('editorColors.activeLine');
   }

   :deep(.cm-foldPlaceholder) {
      background: v-bind('editorColors.foldBg');
      border: 1px solid v-bind('editorColors.foldBorder');
      border-radius: 3px;
      color: v-bind('editorColors.foldColor');
      padding: 0 6px;
      font-size: 11px;
      cursor: pointer;

      &:hover {
         background: v-bind('editorColors.foldHoverBg');
      }
   }

   :deep(.cm-selectionBackground) {
      background: v-bind('editorColors.selection') !important;
   }

   :deep(.cm-focused .cm-selectionBackground) {
      background: v-bind('editorColors.selectionFocused') !important;
   }

   :deep(.cm-searchMatch) {
      background: v-bind('editorColors.searchMatch');
      border-radius: 2px;
   }

   :deep(.cm-searchMatch-selected) {
      background: v-bind('editorColors.searchMatchSel');
   }

   :deep(.cm-matchingBracket) {
      background: v-bind('editorColors.bracketBg');
      outline: 1px solid v-bind('editorColors.bracketBorder');
      border-radius: 2px;
   }

   :deep(.cm-line) {
      padding-left: 4px;
   }

   :deep(.cm-cursor) {
      display: none !important;
   }
}
</style>
