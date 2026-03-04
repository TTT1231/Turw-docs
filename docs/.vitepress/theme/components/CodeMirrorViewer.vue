<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, shallowRef } from 'vue'
import {
   EditorView,
   lineNumbers,
   highlightActiveLine,
   highlightActiveLineGutter,
   drawSelection,
   highlightSpecialChars,
   rectangularSelection,
   crosshairCursor
} from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import {
   defaultHighlightStyle,
   syntaxHighlighting,
   indentOnInput,
   bracketMatching,
   foldGutter
} from '@codemirror/language'
import { highlightSelectionMatches } from '@codemirror/search'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'

// ===== 类型定义 =====
type ThemeMode = 'light' | 'dark'
type SupportedLang = 'json' | 'js' | 'ts' | 'mjs' | 'cjs'

interface Props {
   /** 代码内容 */
   code: string
   /** 语言类型 */
   lang?: SupportedLang
   /** 主题模式 */
   theme?: ThemeMode
   /** 组件高度 */
   height?: string
   /** 是否显示行号 */
   lineNumbers?: boolean
   /** 是否启用代码折叠 */
   enableFolding?: boolean
   /** 是否高亮当前行 */
   highlightActiveLine?: boolean
}

const props = withDefaults(defineProps<Props>(), {
   lang: 'js',
   theme: 'dark',
   height: '500px',
   lineNumbers: true,
   enableFolding: true,
   highlightActiveLine: true
})

// ===== Refs =====
const editorContainer = ref<HTMLElement | null>(null)
const editorView = shallowRef<EditorView | null>(null)

// ===== 文件类型颜色映射 =====
const LANGUAGE_COLORS: Record<SupportedLang, { bg: string; color: string; label: string }> = {
   json: { bg: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', label: 'JSON' },
   js: { bg: 'rgba(250, 204, 21, 0.15)', color: '#facc15', label: 'JS' },
   ts: { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', label: 'TS' },
   mjs: { bg: 'rgba(250, 204, 21, 0.15)', color: '#facc15', label: 'MJS' },
   cjs: { bg: 'rgba(250, 204, 21, 0.15)', color: '#facc15', label: 'CJS' }
}

// ===== 主题色板 =====
const editorColors = computed(() => {
   const dark = props.theme === 'dark'
   return {
      // 编辑器本体
      editorBg: dark ? '#1e1e2e' : '#ffffff',
      editorText: dark ? '#cdd6f4' : '#1f1f1f',
      cursor: dark ? '#aeafad' : '#000000',
      // Gutter（行号区）
      gutterBg: dark ? '#181825' : '#f8f8f8',
      gutterBorder: dark ? '#313244' : '#e8e8e8',
      lineNum: dark ? '#45475a' : '#6f6f6f',
      activeLineNum: dark ? '#cdd6f4' : '#1f1f1f',
      // 当前行
      activeLine: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.022)',
      // 选区
      selection: dark ? 'rgba(99,102,241,0.30)' : 'rgba(173,214,255,0.60)',
      selectionFocused: dark ? 'rgba(99,102,241,0.38)' : 'rgba(173,214,255,0.85)',
      // 括号匹配
      bracketBg: dark ? 'rgba(100,255,130,0.15)' : 'rgba(0,180,80,0.12)',
      bracketBorder: dark ? 'rgba(100,255,130,0.45)' : 'rgba(0,140,60,0.40)',
      // 折叠占位
      foldBg: dark ? '#313244' : '#ebebeb',
      foldBorder: dark ? '#45475a' : '#c8c8c8',
      foldColor: dark ? '#7f849c' : '#6f6f6f',
      foldHoverBg: dark ? '#45475a' : '#d4d4d4',
      // 折叠箭头
      foldArrow: dark ? '#7f849c' : '#9e9e9e',
      // 搜索高亮
      searchMatch: dark ? 'rgba(234,179,8,0.30)' : 'rgba(234,179,8,0.35)',
      searchMatchSel: dark ? 'rgba(234,179,8,0.55)' : 'rgba(234,179,8,0.65)',
      // 滚动条
      scrollThumb: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.20)',
      scrollThumbHover: dark ? 'rgba(255,255,255,0.24)' : 'rgba(0,0,0,0.38)',
      // Header / 卡片边框
      headerBg: dark ? '#181825' : '#f3f3f3',
      headerBorder: dark ? '#313244' : '#e8e8e8',
      cardBorder: dark ? '#313244' : '#e0e0e0',
      cardShadow: dark ? '0 4px 24px rgba(0,0,0,0.35)' : '0 2px 12px rgba(0,0,0,0.10)'
   }
})

// ===== 自定义折叠 Gutter：VS Code 风格 SVG 三角箭头 =====
function createFoldMarkerSVG(open: boolean): SVGSVGElement {
   const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
   svg.setAttribute('width', '10')
   svg.setAttribute('height', '10')
   svg.setAttribute('viewBox', '0 0 10 10')
   svg.setAttribute('fill', 'currentColor')

   const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
   if (open) {
      path.setAttribute('d', 'M2 3.5 L5 6.5 L8 3.5')
   } else {
      path.setAttribute('d', 'M3.5 2 L6.5 5 L3.5 8')
   }
   path.setAttribute('stroke', 'currentColor')
   path.setAttribute('stroke-width', '1.4')
   path.setAttribute('stroke-linecap', 'round')
   path.setAttribute('stroke-linejoin', 'round')
   path.setAttribute('fill', 'none')

   svg.appendChild(path)
   return svg
}

function makeFoldMarker(open: boolean): HTMLElement {
   const el = document.createElement('span')
   el.className = open ? 'cm-fold-open' : 'cm-fold-closed'
   el.title = open ? 'Collapse' : 'Expand'
   el.appendChild(createFoldMarkerSVG(open))
   return el
}

// ===== 获取语言扩展 =====
function getLanguageExtension(lang: SupportedLang) {
   const config: Record<SupportedLang, { jsx?: boolean; typescript?: boolean }> = {
      json: { jsx: false, typescript: false },
      js: { jsx: true, typescript: false },
      ts: { jsx: true, typescript: true },
      mjs: { jsx: true, typescript: false },
      cjs: { jsx: true, typescript: false }
   }

   return javascript({ ...config[lang] })
}

// ===== 构建编辑器扩展 =====
function buildExtensions() {
   const extensions = [
      highlightSpecialChars(),
      drawSelection(),
      EditorState.readOnly.of(true),
      rectangularSelection(),
      crosshairCursor(),
      bracketMatching(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      getLanguageExtension(props.lang)
   ]

   if (props.lineNumbers) {
      extensions.push(lineNumbers())
   }

   if (props.highlightActiveLine) {
      extensions.push(highlightActiveLine(), highlightActiveLineGutter())
   }

   if (props.enableFolding) {
      extensions.push(foldGutter({ markerDOM: makeFoldMarker }), indentOnInput())
   }

   extensions.push(highlightSelectionMatches())

   return extensions
}

// ===== 初始化编辑器 =====
function initEditor() {
   if (editorView.value) {
      editorView.value.destroy()
      editorView.value = null
   }

   if (!editorContainer.value) return

   const state = EditorState.create({
      doc: props.code,
      extensions: [
         ...buildExtensions(),
         props.theme === 'dark' ? oneDark : []
      ]
   })

   editorView.value = new EditorView({
      state,
      parent: editorContainer.value
   })
}

// ===== 更新主题 =====
function updateTheme() {
   if (!editorView.value) return

   const newState = EditorState.create({
      doc: props.code,
      extensions: [
         ...buildExtensions(),
         props.theme === 'dark' ? oneDark : []
      ]
   })

   editorView.value.setState(newState)
}

// ===== 更新代码内容 =====
function updateContent() {
   if (!editorView.value) return

   const currentState = editorView.value.state
   if (currentState.doc.toString() !== props.code) {
      editorView.value.dispatch({
         changes: {
            from: 0,
            to: currentState.doc.length,
            insert: props.code
         }
      })
   }
}

// ===== 获取文件类型样式 =====
function getFileBadgeStyle() {
   const style = LANGUAGE_COLORS[props.lang]
   return {
      background: style.bg,
      color: style.color
   }
}

// ===== 获取文件类型标签 =====
function getFileBadgeLabel() {
   return LANGUAGE_COLORS[props.lang].label
}

// ===== 计算行数 =====
const lineCount = computed(() => props.code.split('\n').length)

// ===== 监听变化 =====
watch(() => props.theme, updateTheme)
watch(() => props.code, updateContent)
watch(() => props.lang, () => {
   // 语言改变需要重新初始化编辑器
   initEditor()
})

// ===== 生命周期 =====
onMounted(initEditor)
onUnmounted(() => {
   if (editorView.value) {
      editorView.value.destroy()
      editorView.value = null
   }
})
</script>

<template>
   <div class="code-mirror-viewer" :class="`theme-${theme}`">
      <div class="editor-card">
         <!-- 主标题行 -->
         <div class="editor-header">
            <div class="editor-header__left">
               <span class="file-badge" :style="getFileBadgeStyle()">
                  {{ getFileBadgeLabel() }}
               </span>
               <svg
                  class="code-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
               >
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
               </svg>
               <span class="line-count">{{ lineCount }} lines</span>
            </div>
            <div class="editor-header__right">
               <span class="read-only-badge">Read-only</span>
            </div>
         </div>

         <!-- 代码编辑器 -->
         <div
            ref="editorContainer"
            class="editor-container"
            :style="{ height: height }"
         />
      </div>
   </div>
</template>

<style lang="scss" scoped>
.code-mirror-viewer {
   width: 100%;
   font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

// ===== 编辑器卡片 =====
.editor-card {
   position: relative;
   border-radius: 12px;
   overflow: hidden;
   border: 1px solid v-bind('editorColors.cardBorder');
   box-shadow: v-bind('editorColors.cardShadow');
}

// 主标题行
.editor-header {
   display: flex;
   align-items: center;
   justify-content: space-between;
   padding: 8px 10px 8px 14px;
   background: v-bind('editorColors.headerBg');
   border-bottom: 1px solid v-bind('editorColors.headerBorder');
   gap: 12px;

   &__left {
      display: flex;
      align-items: center;
      gap: 7px;
      min-width: 0;
      flex: 1;
   }

   &__right {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
   }
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

.code-icon {
   color: v-bind('editorColors.foldArrow');
   flex-shrink: 0;
}

.line-count {
   font-size: 12px;
   color: v-bind('editorColors.lineNum');
}

.read-only-badge {
   font-size: 11px;
   color: v-bind('editorColors.lineNum');
   padding: 2px 8px;
   background: v-bind('editorColors.gutterBg');
   border-radius: 4px;
   font-weight: 500;
}

// ===== CodeMirror 编辑器 =====
.editor-container {
   overflow: hidden;

   :deep(.cm-editor) {
      height: 100%;
      font-family: 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 13.5px;
      line-height: 1.6;
      background: v-bind('editorColors.editorBg');
      color: v-bind('editorColors.editorText');
      border-radius: 0;

      &.cm-focused {
         outline: none;
      }
   }

   :deep(.cm-scroller) {
      overflow: auto !important;
      height: 100%;
      font-family: inherit;

      &::-webkit-scrollbar {
         width: 8px;
         height: 8px;
      }

      &::-webkit-scrollbar-track {
         background: transparent;
      }

      &::-webkit-scrollbar-thumb {
         background: v-bind('editorColors.scrollThumb');
         border-radius: 4px;

         &:hover {
            background: v-bind('editorColors.scrollThumbHover');
         }
      }
   }

   :deep(.cm-content) {
      padding: 6px 0 16px;
      caret-color: transparent; // 只读模式隐藏光标
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
         transition: color 0.1s;
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
      transition: color 0.12s, background 0.12s;
      flex-shrink: 0;
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
      transition: background 0.1s;

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

   // 只读模式隐藏光标
   :deep(.cm-cursor) {
      display: none !important;
   }
}
</style>
