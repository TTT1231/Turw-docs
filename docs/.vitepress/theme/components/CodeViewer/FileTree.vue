<script setup lang="ts">
import { ref, computed } from 'vue';
import type { FileNode, ThemeMode } from './types';
import { getFileIconPath, getFolderIconPath } from './types';

interface Props {
   nodes: FileNode[];
   selectedPath?: string;
   theme?: ThemeMode;
   isSidebarCollapsed?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
   selectedPath: '',
   theme: 'light',
   isSidebarCollapsed: false
});

const emit = defineEmits<{
   select: [node: FileNode];
   toggleSidebar: [];
}>();

const expandedFolders = ref<Set<string>>(new Set());

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

   traverse(props.nodes);
   return result;
});

function toggleExpand(path: string): void {
   const set = expandedFolders.value;
   if (set.has(path)) {
      set.delete(path);
   } else {
      set.add(path);
   }
}

function selectFile(node: FileNode) {
   if (node.type === 'file') {
      emit('select', node);
   } else {
      toggleExpand(node.path);
   }
}

function isExpanded(node: FileNode): boolean {
   return expandedFolders.value.has(node.path);
}

function getNodeStyle(depth: number) {
   return { paddingLeft: `${depth * 16 + 8}px` };
}

function getNodeIcon(node: FileNode) {
   return node.type === 'directory'
      ? getFolderIconPath(isExpanded(node))
      : getFileIconPath(node.name);
}
</script>

<template>
   <div class="file-tree" :class="{ collapsed: isSidebarCollapsed }">
      <div class="file-tree-header">
         <span class="header-title">资源管理器</span>
         <button
            class="collapse-btn"
            @click="emit('toggleSidebar')"
            :title="'收起侧边栏'"
            :aria-label="'收起侧边栏'"
         >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
               <path d="M10 3L6 8L10 13V3Z M12 2H13V14H12V2Z" />
            </svg>
         </button>
      </div>
      <div class="file-tree-content">
         <div
            v-for="node in flatNodes"
            :key="node.path"
            class="tree-node"
            :class="{
               directory: node.type === 'directory',
               file: node.type === 'file',
               active: props.selectedPath === node.path
            }"
            :style="getNodeStyle(node.level || 0)"
            @click="selectFile(node)"
         >
            <span
               :class="node.type === 'directory' ? 'node-arrow' : 'node-arrow-placeholder'"
               @click.stop="node.type === 'directory' && toggleExpand(node.path)"
            >
               <svg
                  v-if="node.type === 'directory'"
                  width="12"
                  height="12"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  :class="{ rotated: isExpanded(node) }"
               >
                  <path d="M6 4L10 8L6 12V4Z" />
               </svg>
            </span>

            <span class="node-icon">
               <img
                  :src="getNodeIcon(node)"
                  :alt="node.name"
                  class="icon-image"
                  width="16"
                  height="16"
               />
            </span>

            <span class="node-name">{{ node.name }}</span>
         </div>
      </div>
   </div>
</template>

<style lang="scss" scoped>
@use './theme.scss';

.file-tree {
   display: flex;
   flex-direction: column;
   height: 100%;
   background: var(--cv-bg-soft);
   opacity: 1;
   transition: opacity 0.2s ease;
   flex: 1;
}

.file-tree.collapsed {
   display: none;
}

.file-tree-header {
   display: flex;
   align-items: center;
   justify-content: space-between;
   padding: 8px 12px;
   font-size: 11px;
   font-weight: 600;
   text-transform: uppercase;
   letter-spacing: 0.5px;
   color: var(--cv-text-2);
}

.header-title {
   font-size: 11px;
   white-space: nowrap;
   overflow: hidden;
   user-select: none;
}

.collapse-btn {
   width: 24px;
   height: 24px;
   display: flex;
   align-items: center;
   justify-content: center;
   border: none;
   background: transparent;
   color: var(--cv-text-2);
   cursor: pointer;
   border-radius: 4px;
   transition: all 0.2s ease;
   padding: 0;
}

.collapse-btn:hover {
   background: var(--cv-bg-soft);
   color: var(--cv-text-1);
}

.collapse-btn:focus-visible {
   outline: 2px solid var(--cv-brand);
   outline-offset: 2px;
}

.collapse-btn svg {
   transition: transform 0.2s ease;
}

.file-tree-content {
   flex: 1;
   overflow-y: auto;
   overflow-x: hidden;

   // 滚动条样式
   &::-webkit-scrollbar {
      width: 10px;
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

   // Firefox 支持
   scrollbar-width: thin;
   scrollbar-color: var(--cv-gray-2) transparent;
}

.tree-node {
   display: flex;
   align-items: center;
   gap: 6px;
   padding: 4px 8px;
   cursor: pointer;
   user-select: none;
   transition: background-color 0.1s ease;
   white-space: nowrap;
   min-height: 24px;
   position: relative;
}

.tree-node:hover {
   background: var(--cv-bg-soft);
}

.tree-node.file.active {
   background: var(--cv-tree-active-bg);
}

.tree-node.file.active:hover {
   background: var(--cv-tree-active-bg-hover);
}

.tree-node.file.active::before {
   content: '';
   position: absolute;
   left: 0;
   top: 0;
   bottom: 0;
   width: 2px;
   background: var(--cv-brand);
}

.node-arrow {
   display: flex;
   align-items: center;
   justify-content: center;
   width: 16px;
   height: 16px;
   color: var(--cv-text-2);
   flex-shrink: 0;
   cursor: pointer;
}

.node-arrow svg {
   transition: transform 0.15s ease;
}

.node-arrow svg.rotated {
   transform: rotate(90deg);
}

.node-arrow:hover {
   color: var(--cv-text-1);
}

.node-arrow-placeholder {
   width: 16px;
   flex-shrink: 0;
}

.node-icon {
   display: flex;
   align-items: center;
   justify-content: center;
   width: 16px;
   height: 16px;
   flex-shrink: 0;
}

.icon-image {
   width: 16px;
   height: 16px;
   object-fit: contain;
}

.node-name {
   flex: 1;
   font-size: 13px;
   overflow: hidden;
   text-overflow: ellipsis;
   color: var(--cv-text-1);
}

.tree-node.file.active .node-name {
   color: var(--cv-text-1);
}
</style>
