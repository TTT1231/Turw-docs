<!--
   ImgPreview 图片预览组件

   Props 说明：

   | Prop        | 类型                | 默认值                                | 说明              |
   |-------------|--------------------|--------------------------------------|-------------------|
   | showImgPath | string             | 必填                                  | 图片路径          |
   | defaultPath | string             | /Turw-docs/assets/images/com-icon/   | 基础路径          |
   | width       | string \| number    | auto                                 | 宽度              |
   | height      | string \| number    | auto                                 | 高度              |
   | alt         | string             | ''                                   | 图片描述          |
   | shadow      | boolean            | true                                 | 显示阴影          |
   | border      | boolean            | false                                | 显示边框          |
   | rounded     | boolean            | true                                 | 圆角              |
   | preview     | boolean            | true                                 | 点击放大预览      |
   | align       | left \| center \| right | center                         | 对齐方式          |

   使用示例：
   <ImgPreview showImgPath="example.jpg" width="300px" :border="true" alt="示例图片" />

   预览功能：
   - 滚轮缩放：鼠标滚轮放大/缩小
   - 拖拽平移：放大后可拖拽图片
   - 双击缩放：双击快速放大/还原
   - 键盘操作：ESC关闭，+/-缩放，方向键平移
   - 工具栏：放大/缩小/旋转/重置按钮
-->
<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';

const props = withDefaults(
   defineProps<{
      showImgPath: string;
      defaultPath?: string;
      width?: string | number;
      height?: string | number;
      alt?: string;
      shadow?: boolean;
      border?: boolean;
      rounded?: boolean;
      preview?: boolean;
      align?: 'left' | 'center' | 'right';
   }>(),
   {
      defaultPath: '/Turw-docs/assets/images/com-icon/',
      width: 'auto',
      height: 'auto',
      alt: '',
      shadow: true,
      border: false,
      rounded: true,
      preview: true,
      align: 'center'
   }
);

const isOpen = ref(false);
const scale = ref(1);
const rotation = ref(0);
const position = ref({ x: 0, y: 0 });
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const imageRef = ref<HTMLElement | null>(null);

const MIN_SCALE = 0.5;
const MAX_SCALE = 5;
const SCALE_STEP = 0.25;

const fullImagePath = computed(() =>
   props.showImgPath.startsWith('/')
      ? props.showImgPath
      : `${props.defaultPath}${props.showImgPath}`
);

const formatSize = (size: string | number): string | undefined => {
   if (size === 'auto') return undefined;
   return typeof size === 'number' ? `${size}px` : size;
};

const imageStyle = computed(() => ({
   width: formatSize(props.width),
   height: formatSize(props.height)
}));

const lightboxImageStyle = computed(() => ({
   transform: `translate(${position.value.x}px, ${position.value.y}px) scale(${scale.value}) rotate(${rotation.value}deg)`,
   transition: isDragging.value ? 'none' : 'transform 0.2s ease-out'
}));

const scalePercent = computed(() => Math.round(scale.value * 100));

const open = () => {
   if (!props.preview) return;
   isOpen.value = true;
   resetTransform();
   document.body.style.overflow = 'hidden';
};

const close = () => {
   isOpen.value = false;
   resetTransform();
   document.body.style.overflow = '';
};

const resetTransform = () => {
   scale.value = 1;
   rotation.value = 0;
   position.value = { x: 0, y: 0 };
};

const zoomIn = () => {
   scale.value = Math.min(scale.value + SCALE_STEP, MAX_SCALE);
};

const zoomOut = () => {
   scale.value = Math.max(scale.value - SCALE_STEP, MIN_SCALE);
};

const rotate = () => {
   rotation.value = (rotation.value + 90) % 360;
};

const handleWheel = (e: WheelEvent) => {
   e.preventDefault();
   const delta = e.deltaY > 0 ? -SCALE_STEP : SCALE_STEP;
   scale.value = Math.min(Math.max(scale.value + delta, MIN_SCALE), MAX_SCALE);
};

const handleDoubleClick = () => {
   if (scale.value === 1) {
      scale.value = 2;
   } else {
      scale.value = 1;
      position.value = { x: 0, y: 0 };
   }
};

const handleMouseDown = (e: MouseEvent) => {
   if (scale.value <= 1) return;
   isDragging.value = true;
   dragStart.value = { x: e.clientX - position.value.x, y: e.clientY - position.value.y };
};

const handleMouseMove = (e: MouseEvent) => {
   if (!isDragging.value) return;
   position.value = {
      x: e.clientX - dragStart.value.x,
      y: e.clientY - dragStart.value.y
   };
};

const handleMouseUp = () => {
   isDragging.value = false;
};

const handleKeydown = (e: KeyboardEvent) => {
   if (!isOpen.value) return;

   switch (e.key) {
      case 'Escape':
         close();
         break;
      case '+':
      case '=':
         zoomIn();
         break;
      case '-':
      case '_':
         zoomOut();
         break;
      case '0':
         resetTransform();
         break;
      case 'ArrowUp':
         e.preventDefault();
         position.value.y += 50;
         break;
      case 'ArrowDown':
         e.preventDefault();
         position.value.y -= 50;
         break;
      case 'ArrowLeft':
         e.preventDefault();
         position.value.x += 50;
         break;
      case 'ArrowRight':
         e.preventDefault();
         position.value.x -= 50;
         break;
      case 'r':
      case 'R':
         rotate();
         break;
   }
};

// 全局鼠标事件监听（用于拖拽）
const handleGlobalMouseMove = (e: MouseEvent) => {
   if (isDragging.value) {
      e.preventDefault();
      position.value = {
         x: e.clientX - dragStart.value.x,
         y: e.clientY - dragStart.value.y
      };
   }
};

const handleGlobalMouseUp = () => {
   isDragging.value = false;
};

onMounted(() => {
   document.addEventListener('mousemove', handleGlobalMouseMove);
   document.addEventListener('mouseup', handleGlobalMouseUp);
});

onUnmounted(() => {
   document.body.style.overflow = '';
   document.removeEventListener('mousemove', handleGlobalMouseMove);
   document.removeEventListener('mouseup', handleGlobalMouseUp);
});
</script>

<template>
   <div
      class="img-preview-wrapper"
      :class="[`align-${align}`, { 'has-border': border, 'has-shadow': shadow, rounded }]"
   >
      <div class="img-container" :class="{ 'cursor-pointer': preview }" @click="open">
         <img
            :src="fullImagePath"
            :alt="alt || showImgPath"
            :title="alt || showImgPath"
            :style="imageStyle"
            class="preview-image"
            loading="lazy"
         />
         <div v-if="preview" class="preview-hint">
            <svg
               width="16"
               height="16"
               viewBox="0 0 24 24"
               fill="none"
               stroke="currentColor"
               stroke-width="2"
            >
               <circle cx="11" cy="11" r="8"></circle>
               <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
               <line x1="11" y1="8" x2="11" y2="14"></line>
               <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
            <span>点击预览</span>
         </div>
      </div>
   </div>

   <!-- Lightbox 预览 -->
   <Teleport to="body">
      <Transition name="lightbox">
         <div
            v-if="isOpen && preview"
            class="lightbox-backdrop"
            @click.self="close"
            @keydown="handleKeydown"
            tabindex="-1"
         >
            <!-- 顶部工具栏 -->
            <div class="lightbox-toolbar">
               <div class="zoom-info">{{ scalePercent }}%</div>
               <div class="toolbar-buttons">
                  <button
                     class="toolbar-btn"
                     @click="zoomOut"
                     :disabled="scale <= MIN_SCALE"
                     title="缩小 (-)"
                  >
                     <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                     >
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="8" y1="11" x2="14" y2="11"></line>
                     </svg>
                  </button>
                  <button
                     class="toolbar-btn"
                     @click="zoomIn"
                     :disabled="scale >= MAX_SCALE"
                     title="放大 (+)"
                  >
                     <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                     >
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="11" y1="8" x2="11" y2="14"></line>
                        <line x1="8" y1="11" x2="14" y2="11"></line>
                     </svg>
                  </button>
                  <button class="toolbar-btn" @click="rotate" title="旋转 (R)">
                     <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                     >
                        <path d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
                        <path d="M21 3v5h-5"></path>
                     </svg>
                  </button>
                  <button class="toolbar-btn" @click="resetTransform" title="重置 (0)">
                     <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                     >
                        <path d="M3 12a9 9 0 0118 0"></path>
                        <path d="M21 12v9h-9"></path>
                     </svg>
                  </button>
               </div>
               <button class="close-btn-top" @click="close" aria-label="关闭预览">
                  <svg
                     width="20"
                     height="20"
                     viewBox="0 0 24 24"
                     fill="none"
                     stroke="currentColor"
                     stroke-width="2"
                  >
                     <line x1="18" y1="6" x2="6" y2="18"></line>
                     <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
               </button>
            </div>

            <!-- 图片容器 -->
            <div class="lightbox-content" @wheel="handleWheel">
               <img
                  ref="imageRef"
                  :src="fullImagePath"
                  :alt="alt || showImgPath"
                  :style="lightboxImageStyle"
                  class="lightbox-image"
                  @mousedown="handleMouseDown"
                  @dblclick="handleDoubleClick"
                  draggable="false"
               />
            </div>

            <!-- 底部提示 -->
            <div class="lightbox-hint">滚轮缩放 · 拖拽平移 · 双击缩放 · ESC关闭</div>
         </div>
      </Transition>
   </Teleport>
</template>

<style scoped lang="scss">
.img-preview-wrapper {
   margin: 16px 0;
   display: flex;

   &.align-left {
      justify-content: flex-start;
   }

   &.align-center {
      justify-content: center;
   }

   &.align-right {
      justify-content: flex-end;
   }
}

.img-container {
   position: relative;
   display: inline-block;
   overflow: hidden;
   background-color: var(--vp-c-bg-soft, #f8fafc);
   transition: all 0.3s ease;

   &.cursor-pointer {
      cursor: pointer;

      &:hover {
         transform: translateY(-2px);

         .preview-hint {
            opacity: 1;
         }
      }
   }

   &.has-shadow {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
   }

   &.has-border {
      border: 1px solid var(--vp-c-border, #e5e7eb);

      .dark & {
         border-color: var(--vp-c-divider, #30363d);
      }
   }

   &.rounded {
      border-radius: 8px;
   }
}

.preview-image {
   display: block;
   max-width: 100%;
   height: auto;
   object-fit: contain;
}

.preview-hint {
   position: absolute;
   bottom: 0;
   left: 0;
   right: 0;
   display: flex;
   align-items: center;
   justify-content: center;
   gap: 6px;
   padding: 8px 12px;
   background: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.7) 0%,
      rgba(0, 0, 0, 0.5) 50%,
      transparent 100%
   );
   color: white;
   font-size: 12px;
   opacity: 0;
   transition: opacity 0.2s ease;
   pointer-events: none;

   svg {
      flex-shrink: 0;
   }
}

/* Lightbox 样式 */
.lightbox-backdrop {
   position: fixed;
   top: 0;
   left: 0;
   right: 0;
   bottom: 0;
   background-color: rgba(0, 0, 0, 0.9);
   backdrop-filter: blur(8px);
   display: flex;
   flex-direction: column;
   align-items: center;
   justify-content: center;
   z-index: 9999;
   outline: none;
}

/* 工具栏 */
.lightbox-toolbar {
   position: absolute;
   top: 16px;
   left: 50%;
   transform: translateX(-50%);
   display: flex;
   align-items: center;
   gap: 16px;
   padding: 8px 16px;
   background: rgba(255, 255, 255, 0.1);
   border: 1px solid rgba(255, 255, 255, 0.2);
   border-radius: 12px;
   backdrop-filter: blur(10px);
   z-index: 10;
}

.zoom-info {
   min-width: 48px;
   text-align: center;
   color: white;
   font-size: 13px;
   font-weight: 500;
   font-feature-settings: 'tnum';
}

.toolbar-buttons {
   display: flex;
   align-items: center;
   gap: 4px;
}

.toolbar-btn {
   display: flex;
   align-items: center;
   justify-content: center;
   width: 36px;
   height: 36px;
   background: transparent;
   border: none;
   border-radius: 8px;
   color: white;
   cursor: pointer;
   transition: all 0.2s ease;

   &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.2);
   }

   &:active:not(:disabled) {
      transform: scale(0.95);
   }

   &:disabled {
      opacity: 0.3;
      cursor: not-allowed;
   }
}

.close-btn-top {
   display: flex;
   align-items: center;
   justify-content: center;
   width: 36px;
   height: 36px;
   background: rgba(255, 255, 255, 0.1);
   border: 1px solid rgba(255, 255, 255, 0.2);
   border-radius: 8px;
   color: white;
   cursor: pointer;
   transition: all 0.2s ease;

   &:hover {
      background: rgba(255, 255, 255, 0.2);
   }
}

/* 图片容器 */
.lightbox-content {
   flex: 1;
   width: 100%;
   display: flex;
   align-items: center;
   justify-content: center;
   overflow: hidden;
   padding: 80px 24px 60px;
   cursor: grab;

   &:active {
      cursor: grabbing;
   }
}

.lightbox-image {
   max-width: 100%;
   max-height: 100%;
   object-fit: contain;
   user-select: none;
   -webkit-user-drag: none;
   will-change: transform;
}

/* 底部提示 */
.lightbox-hint {
   position: absolute;
   bottom: 16px;
   left: 50%;
   transform: translateX(-50%);
   padding: 8px 16px;
   background: rgba(0, 0, 0, 0.6);
   border-radius: 20px;
   color: rgba(255, 255, 255, 0.8);
   font-size: 12px;
   pointer-events: none;
   white-space: nowrap;
}

/* Lightbox 动画 */
.lightbox-enter-active,
.lightbox-leave-active {
   transition: all 0.25s ease;
}

.lightbox-enter-from,
.lightbox-leave-to {
   opacity: 0;
}

.lightbox-enter-from .lightbox-content,
.lightbox-leave-to .lightbox-content {
   transform: scale(0.95);
}

/* 响应式调整 */
@media (max-width: 640px) {
   .lightbox-content {
      padding: 70px 16px 50px;
   }

   .lightbox-toolbar {
      top: 12px;
      padding: 6px 12px;
      gap: 12px;
   }

   .toolbar-btn {
      width: 32px;
      height: 32px;

      svg {
         width: 18px;
         height: 18px;
      }
   }

   .zoom-info {
      font-size: 12px;
      min-width: 40px;
   }

   .lightbox-hint {
      font-size: 11px;
      padding: 6px 12px;
   }
}
</style>
