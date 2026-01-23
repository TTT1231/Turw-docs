<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import FileTree from './FileTree.vue';
import CodeDisplay from './CodeDisplay.vue';
import ImagePreview from './ImagePreview.vue';
import type { FileNode } from './types';
import {
   loadManifest,
   convertManifestToFileNodes,
   loadFileContent,
   findFileByPath,
   findFileByName
} from './utils';
import { getLanguageFromExtension, isImageFile, getFileIconPath } from './types';

interface Props {
   /** 公共路径，如 /Turw-docs/codeview-container */
   publicPath: string;
   /** 默认选中的文件名（相对于 publicPath） */
   defaultFile?: string;
   /** 主题模式 */
   theme?: 'light' | 'dark';
   /** 是否启用代码折叠 */
   enableFolding?: boolean;
   /** 组件高度 */
   height?: string;
}

const props = withDefaults(defineProps<Props>(), {
   theme: 'dark',
   enableFolding: true,
   height: '500px'
});

interface OpenTab {
   fileNode: FileNode;
   content: string;
}

const openTabs = ref<OpenTab[]>([]);
const activeTabPath = ref<string>('');
const fileTree = ref<FileNode[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const isSidebarCollapsed = ref(false);

// 右键菜单状态
const contextMenuVisible = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });
const contextMenuTargetTab = ref<FileNode | null>(null);

const activeTab = computed(() => {
   return openTabs.value.find((t) => t.fileNode.path === activeTabPath.value);
});

const currentLanguage = computed(() => {
   const tab = activeTab.value;
   if (!tab) return 'text';
   return getLanguageFromExtension(tab.fileNode.extension || '');
});

const isImage = computed(() => {
   return activeTab.value && isImageFile(activeTab.value.fileNode.name);
});

const hasOpenFile = computed(() => {
   return activeTab.value !== undefined;
});

function getErrorMessage(err: unknown): string {
   return err instanceof Error ? err.message : String(err);
}

async function initializeFileTree() {
   isLoading.value = true;
   error.value = null;

   try {
      const manifest = await loadManifest(props.publicPath);
      fileTree.value = convertManifestToFileNodes(manifest);

      if (props.defaultFile) {
         // 查找默认文件
         const defaultNode =
            findFileByName(fileTree.value, props.defaultFile) ||
            findFileByPath(fileTree.value, props.defaultFile);
         if (!defaultNode) {
            // 尝试在 publicPath 下查找
            const fullPath = `${props.publicPath}/${props.defaultFile}`;
            const nodeByFullPath = findFileByPath(fileTree.value, fullPath);
            if (nodeByFullPath) {
               await openFile(nodeByFullPath);
            }
         } else {
            await openFile(defaultNode);
         }
      }
   } catch (err) {
      error.value = getErrorMessage(err);
      console.error('Failed to initialize file tree:', err);
   } finally {
      isLoading.value = false;
   }
}

async function openFile(node: FileNode) {
   if (node.type !== 'file') return;

   const existingTab = openTabs.value.find((t) => t.fileNode.path === node.path);
   if (existingTab) {
      activeTabPath.value = node.path;
      return;
   }

   const content = await loadFileContent(node.path).catch((err) => {
      error.value = getErrorMessage(err);
      return '';
   });

   if (content !== '') {
      openTabs.value.push({ fileNode: node, content });
      activeTabPath.value = node.path;
   }
}

function closeTab(node: FileNode) {
   const index = openTabs.value.findIndex((t) => t.fileNode.path === node.path);
   if (index < 0) return;

   openTabs.value.splice(index, 1);

   if (activeTabPath.value === node.path) {
      const newTab = openTabs.value[Math.min(index, openTabs.value.length - 1)];
      activeTabPath.value = newTab?.fileNode.path ?? '';
   }
}

function switchTab(node: FileNode) {
   activeTabPath.value = node.path;
}

function toggleSidebar() {
   isSidebarCollapsed.value = !isSidebarCollapsed.value;
}

// 右键菜单功能
function showContextMenu(event: MouseEvent, tab: OpenTab) {
   event.preventDefault();
   contextMenuTargetTab.value = tab.fileNode;
   contextMenuPosition.value = { x: event.clientX, y: event.clientY };
   contextMenuVisible.value = true;
}

function hideContextMenu() {
   contextMenuVisible.value = false;
}

function closeTabsToLeft() {
   const index = openTabs.value.findIndex(
      (t) => t.fileNode.path === contextMenuTargetTab.value?.path
   );
   if (index <= 0) return;
   const toRemove = openTabs.value.slice(0, index);
   toRemove.forEach((t) => closeTab(t.fileNode));
   hideContextMenu();
}

function closeTabsToRight() {
   const index = openTabs.value.findIndex(
      (t) => t.fileNode.path === contextMenuTargetTab.value?.path
   );
   if (index === -1 || index === openTabs.value.length - 1) return;
   const toRemove = openTabs.value.slice(index + 1);
   toRemove.forEach((t) => closeTab(t.fileNode));
   hideContextMenu();
}

function closeAllTabs() {
   // 从后往前关闭，避免 closeTab 中的索引问题
   [...openTabs.value].forEach((t) => closeTab(t.fileNode));
   hideContextMenu();
}

// 点击其他地方关闭菜单
watch(contextMenuVisible, (visible, _, onCleanup) => {
   if (visible) {
      const handler = () => hideContextMenu();
      document.addEventListener('click', handler);
      onCleanup(() => document.removeEventListener('click', handler));
   }
});

// 只在客户端初始化，避免 SSR 时 fetch 错误
const isMounted = ref(false);
onMounted(() => {
   isMounted.value = true;
   initializeFileTree();
});

watch(
   () => props.publicPath,
   () => {
      if (isMounted.value) {
         initializeFileTree();
      }
   }
);
</script>

<template>
   <div class="code-viewer" :class="`theme-${theme}`" :style="{ height: height }">
      <!-- 右键菜单 -->
      <div
         v-if="contextMenuVisible"
         class="context-menu"
         :style="{
            left: contextMenuPosition.x + 'px',
            top: contextMenuPosition.y + 'px'
         }"
      >
         <div class="context-menu-item" @click="closeTabsToRight">
            <span>关闭右侧</span>
         </div>
         <div class="context-menu-item" @click="closeTabsToLeft">
            <span>关闭左侧</span>
         </div>
         <div class="context-menu-divider"></div>
         <div class="context-menu-item" @click="closeAllTabs">
            <span>关闭全部</span>
         </div>
      </div>

      <aside
         class="file-container"
         :class="{ collapsed: isSidebarCollapsed }"
         @dblclick="isSidebarCollapsed && toggleSidebar()"
      >
         <FileTree
            :nodes="fileTree"
            :selected-path="activeTabPath"
            :theme="theme"
            :is-sidebar-collapsed="isSidebarCollapsed"
            @select="openFile"
            @toggle-sidebar="toggleSidebar"
         />

         <!-- 折叠状态下的展开按钮 -->
         <button
            v-if="isSidebarCollapsed"
            class="expand-button"
            @click="toggleSidebar"
            title="展开侧边栏"
            aria-label="展开侧边栏"
         >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
               <path d="M6 3L10 8L6 13V3Z M3 2H4V14H3V2Z" />
            </svg>
         </button>
      </aside>

      <main class="code-container">
         <div class="select-file-container" v-if="openTabs.length > 0">
            <div
               v-for="tab in openTabs"
               :key="tab.fileNode.path"
               class="file-tab"
               :class="{ active: tab.fileNode.path === activeTabPath }"
               @click="switchTab(tab.fileNode)"
               @contextmenu="showContextMenu($event, tab)"
            >
               <img
                  :src="getFileIconPath(tab.fileNode.name)"
                  :alt="tab.fileNode.name"
                  class="tab-icon"
                  width="14"
                  height="14"
               />
               <span class="tab-name">{{ tab.fileNode.name }}</span>
               <button class="tab-close" @click.stop="closeTab(tab.fileNode)" title="关闭">
                  ×
               </button>
            </div>
         </div>

         <div class="code-display-container">
            <div v-if="isLoading" class="empty-state">
               <span class="empty-text">加载中...</span>
            </div>

            <div v-else-if="error" class="empty-state error">
               <span class="empty-text">{{ error }}</span>
            </div>

            <div v-else-if="!hasOpenFile" class="empty-state">
               <span class="empty-text">请选择一个文件查看内容</span>
            </div>

            <template v-else-if="activeTab">
               <ImagePreview
                  v-if="isImage"
                  :src="activeTab.fileNode.path"
                  :alt="activeTab.fileNode.name"
               />
               <CodeDisplay
                  v-else
                  :code="activeTab.content"
                  :lang="currentLanguage"
                  :theme="theme"
                  :enable-folding="enableFolding"
               />
            </template>
         </div>
      </main>
   </div>
</template>

<style lang="scss" scoped>
@use './theme.scss';

.code-viewer {
   display: flex;
   flex-direction: row;
   width: 100%;
   font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
   min-height: 400px;
   overflow: hidden;
}

.file-container {
   width: 200px;
   height: 100%;
   flex-shrink: 0;
   display: flex;
   flex-direction: column;
   transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.file-container.collapsed {
   width: 40px;
   justify-content: center;
   background: var(--cv-bg-soft);
   border-right: 1px solid var(--cv-border);
}

.expand-button {
   width: 40px;
   height: 40px;
   display: flex;
   align-items: center;
   justify-content: center;
   border: none;
   background: transparent;
   color: var(--cv-text-2);
   cursor: pointer;
   transition: all 0.2s ease;
   flex-shrink: 0;
}

.expand-button:hover {
   background: var(--cv-bg-soft);
   color: var(--cv-text-1);
}

.expand-button:focus-visible {
   outline: 2px solid var(--cv-brand);
   outline-offset: -2px;
}

.code-container {
   flex: 1;
   display: flex;
   flex-direction: column;
   overflow: hidden;
}

// Tab 区域水平滚动条样式 (8px 高度，细条状)
.select-file-container {
   height: 40px;
   display: flex;
   align-items: center;
   background: var(--cv-bg-soft);
   border-bottom: 1px solid var(--cv-border);
   overflow-x: auto;
   overflow-y: hidden;

   // 水平滚动条样式
   &::-webkit-scrollbar {
      height: 8px;
   }

   &::-webkit-scrollbar-track {
      background: transparent;
   }

   &::-webkit-scrollbar-thumb {
      background: var(--cv-gray-2);
      border-radius: 4px;

      &:hover {
         background: var(--vp-c-gray-1);
      }
   }

   // Firefox 支持
   scrollbar-width: thin;
   scrollbar-color: var(--cv-gray-2) transparent;
}

.file-tab {
   display: flex;
   align-items: center;
   gap: 8px;
   padding: 0 16px;
   height: 39px;
   cursor: pointer;
   user-select: none;
   border-top: 2px solid transparent;
   border-left: 1px solid var(--cv-border);
   border-right: 1px solid var(--cv-border);
   border-bottom: 1px solid var(--cv-border);
   background: var(--cv-bg);
   color: var(--cv-text-2);
   transition: background-color 0.1s;
   white-space: nowrap;
   position: relative;
   margin-top: 1px;
}

.file-tab:hover {
   background: var(--cv-bg-soft);
}

.file-tab.active {
   background: var(--cv-bg);
   color: var(--cv-text-1);
   border-top-color: var(--cv-brand);
   border-bottom-color: transparent;
   margin-top: 0;
   height: 40px;
   font-weight: 500;
}

.tab-icon {
   width: 14px;
   height: 14px;
   object-fit: contain;
   opacity: 0.9;
}

.tab-name {
   font-size: 13px;
}

.tab-close {
   width: 20px;
   height: 20px;
   display: flex;
   align-items: center;
   justify-content: center;
   border: none;
   background: transparent;
   color: var(--cv-text-2);
   cursor: pointer;
   border-radius: 3px;
   font-size: 18px;
   line-height: 1;
   opacity: 0;
   transition: all 0.15s;
}

.file-tab:hover .tab-close,
.file-tab.active .tab-close {
   opacity: 1;
}

.tab-close:hover {
   background: var(--cv-gray-2);
   color: var(--cv-text-1);
}

.code-display-container {
   flex: 1;
   overflow: hidden;
   background: var(--cv-bg);
}

.empty-state {
   display: flex;
   align-items: center;
   justify-content: center;
   height: 100%;
   color: var(--cv-text-2);
}

.empty-state.error {
   color: var(--vp-c-danger-1);
}

.empty-text {
   font-size: 14px;
}

// 右键菜单样式
.context-menu {
   position: fixed;
   z-index: 1000;
   min-width: 160px;
   background: var(--cv-bg);
   border: 1px solid var(--cv-border);
   border-radius: 6px;
   box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
   padding: 4px 0;

   &-item {
      padding: 8px 16px;
      font-size: 13px;
      color: var(--cv-text-1);
      cursor: pointer;
      transition: background 0.15s;

      &:hover {
         background: var(--cv-bg-soft);
      }
   }

   &-divider {
      height: 1px;
      background: var(--cv-border);
      margin: 4px 0;
   }
}
</style>
