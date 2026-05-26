<script setup lang="ts">
import {
   computed,
   onMounted,
   onUnmounted,
   shallowRef,
   ref,
   useSlots,
   watch,
   type VNode
} from 'vue';
import { useData } from 'vitepress';
import { EditorView, drawSelection, keymap, lineNumbers } from '@codemirror/view';
import { EditorState, type Extension } from '@codemirror/state';
import {
   bracketMatching,
   defaultHighlightStyle,
   foldGutter,
   foldKeymap,
   foldService,
   syntaxHighlighting
} from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { vue } from '@codemirror/lang-vue';
import { oneDark } from '@codemirror/theme-one-dark';

type SupportedLang = 'ts' | 'tsx' | 'js' | 'jsx' | 'json' | 'jsonc' | 'vue' | 'md' | 'markdown';

interface Props {
   lang?: SupportedLang | string;
   code?: string;
   encodedCode?: string;
   title?: string;
   maxHeight?: string;
   minHeight?: string;
   lineNumbers?: boolean;
   folding?: boolean;
   hideHeader?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
   lang: 'ts',
   code: '',
   encodedCode: '',
   title: '',
   maxHeight: '520px',
   minHeight: '0px',
   lineNumbers: false,
   folding: true,
   hideHeader: false
});

const slots = useSlots();
const { isDark } = useData();
const editorContainer = ref<HTMLElement | null>(null);
const editorView = shallowRef<EditorView | null>(null);
const copied = ref(false);
let copyTimer: number | undefined;

const OPEN_TO_CLOSE = new Map([
   ['{', '}'],
   ['[', ']'],
   ['(', ')']
]);

const SUPPORTED_LANGS = new Set<SupportedLang>([
   'ts',
   'tsx',
   'js',
   'jsx',
   'json',
   'jsonc',
   'vue',
   'md',
   'markdown'
]);

const normalizedLang = computed<SupportedLang>(() => {
   const lang = (props.lang || 'ts').toLowerCase().trim();
   return SUPPORTED_LANGS.has(lang as SupportedLang) ? (lang as SupportedLang) : 'ts';
});

const displayTitle = computed(() => props.title || normalizedLang.value.toUpperCase());

const sourceCode = computed(() => {
   if (props.encodedCode) {
      return normalizeCode(decodeCode(props.encodedCode));
   }
   if (props.code) {
      return normalizeCode(props.code);
   }

   return normalizeCode(slotToCode(slots.default?.() ?? []));
});

function decodeCode(code: string): string {
   try {
      return decodeURIComponent(code);
   } catch {
      return code;
   }
}

function normalizeCode(code: string): string {
   const lines = code.replace(/\r\n?/g, '\n').split('\n');

   while (lines.length && !lines[0].trim()) {
      lines.shift();
   }
   while (lines.length && !lines[lines.length - 1].trim()) {
      lines.pop();
   }

   const indents = lines
      .filter((line) => line.trim())
      .map((line) => line.match(/^[\t ]*/)?.[0].length ?? 0);
   const commonIndent = indents.length ? Math.min(...indents) : 0;

   return lines.map((line) => line.slice(commonIndent)).join('\n');
}

function slotToCode(nodes: VNode[]): string {
   return findCodeLikeText(nodes) ?? vnodeToText(nodes);
}

function findCodeLikeText(value: unknown): string | null {
   if (value === null || value === undefined || typeof value === 'boolean') return null;
   if (typeof value === 'string' || typeof value === 'number') return null;

   if (Array.isArray(value)) {
      for (const child of value) {
         const text = findCodeLikeText(child);
         if (text !== null) return text;
      }
      return null;
   }

   if (typeof value !== 'object') return null;

   const node = value as VNode;
   const tag = typeof node.type === 'string' ? node.type.toLowerCase() : '';

   if (tag === 'textarea' || tag === 'pre' || tag === 'code') {
      return vnodeToText(node.children);
   }

   if (Array.isArray(node.children)) {
      return findCodeLikeText(node.children);
   }

   if (node.children && typeof node.children === 'object') {
      const slotChildren = node.children as { default?: () => unknown };
      if (typeof slotChildren.default === 'function') {
         return findCodeLikeText(slotChildren.default());
      }
   }

   return null;
}

function vnodeToText(value: unknown): string {
   if (value === null || value === undefined || typeof value === 'boolean') return '';
   if (typeof value === 'string' || typeof value === 'number') return String(value);
   if (Array.isArray(value)) return value.map(vnodeToText).join('');

   if (typeof value === 'object') {
      const node = value as { children?: unknown };

      if (typeof node.children === 'string' || typeof node.children === 'number') {
         return String(node.children);
      }
      if (Array.isArray(node.children)) {
         return node.children.map(vnodeToText).join('');
      }
      if (node.children && typeof node.children === 'object') {
         const slotChildren = node.children as { default?: () => unknown };
         if (typeof slotChildren.default === 'function') {
            return vnodeToText(slotChildren.default());
         }
      }
   }

   return '';
}

function getLanguageExtension(): Extension {
   switch (normalizedLang.value) {
      case 'js':
         return javascript({ jsx: false, typescript: false });
      case 'jsx':
         return javascript({ jsx: true, typescript: false });
      case 'ts':
         return javascript({ jsx: false, typescript: true });
      case 'tsx':
         return javascript({ jsx: true, typescript: true });
      case 'json':
      case 'jsonc':
         return json();
      case 'md':
      case 'markdown':
         return markdown();
      case 'vue':
         return vue();
      default:
         return javascript({ typescript: true });
   }
}

function createFoldMarkerSVG(open: boolean): SVGSVGElement {
   const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
   svg.setAttribute('width', '12');
   svg.setAttribute('height', '12');
   svg.setAttribute('viewBox', '0 0 12 12');
   svg.setAttribute('fill', 'none');

   const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
   path.setAttribute('d', open ? 'M3 4.5L6 7.5L9 4.5' : 'M4.5 3L7.5 6L4.5 9');
   path.setAttribute('stroke', 'currentColor');
   path.setAttribute('stroke-width', '1.5');
   path.setAttribute('stroke-linecap', 'round');
   path.setAttribute('stroke-linejoin', 'round');

   svg.appendChild(path);
   return svg;
}

function makeFoldMarker(open: boolean): HTMLElement {
   const marker = document.createElement('span');
   marker.className = open ? 'cm-fold-open' : 'cm-fold-closed';
   marker.title = open ? '折叠代码' : '展开代码';
   marker.appendChild(createFoldMarkerSVG(open));
   return marker;
}

function buildExtensions(): Extension[] {
   const extensions: Extension[] = [
      EditorState.readOnly.of(true),
      EditorView.editable.of(false),
      drawSelection(),
      bracketMatching(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      getLanguageExtension(),
      bracketFoldFallback,
      keymap.of(foldKeymap),
      EditorView.theme({
         '&': {
            backgroundColor: 'var(--fold-code-bg)',
            color: 'var(--fold-code-text)'
         },
         '.cm-content': {
            caretColor: 'transparent'
         }
      })
   ];

   if (props.lineNumbers) {
      extensions.push(lineNumbers());
   }

   if (props.folding) {
      extensions.push(foldGutter({ markerDOM: makeFoldMarker }));
   }

   if (isDark.value) {
      extensions.push(oneDark);
   }

   return extensions;
}

const bracketFoldFallback = foldService.of((state, lineStart, lineEnd) => {
   const doc = state.doc.toString();
   const openings = collectOpenBrackets(doc, lineStart, lineEnd);

   for (const opening of openings) {
      const closing = findMatchingBracket(doc, opening);
      if (closing < 0) continue;

      const openingLine = state.doc.lineAt(opening);
      const closingLine = state.doc.lineAt(closing);
      if (closingLine.number > openingLine.number) {
         return { from: opening + 1, to: closing };
      }
   }

   return null;
});

function collectOpenBrackets(doc: string, lineStart: number, lineEnd: number): number[] {
   const openings: number[] = [];
   let quote: string | null = null;
   let escaped = false;
   let inLineComment = false;
   let inBlockComment = false;

   for (let index = 0; index < lineEnd; index++) {
      const char = doc[index];
      const next = doc[index + 1];

      if (inLineComment) {
         if (char === '\n') inLineComment = false;
         continue;
      }
      if (inBlockComment) {
         if (char === '*' && next === '/') {
            inBlockComment = false;
            index++;
         }
         continue;
      }
      if (quote) {
         if (escaped) {
            escaped = false;
         } else if (char === '\\') {
            escaped = true;
         } else if (char === quote) {
            quote = null;
         }
         continue;
      }
      if (char === '/' && next === '/') {
         inLineComment = true;
         index++;
         continue;
      }
      if (char === '/' && next === '*') {
         inBlockComment = true;
         index++;
         continue;
      }
      if (char === '"' || char === "'" || char === '`') {
         quote = char;
         escaped = false;
         continue;
      }
      if (index >= lineStart && OPEN_TO_CLOSE.has(char)) {
         openings.push(index);
      }
   }

   return openings;
}

function findMatchingBracket(doc: string, openingPosition: number): number {
   const stack: Array<{ char: string; position: number }> = [];
   let quote: string | null = null;
   let escaped = false;
   let inLineComment = false;
   let inBlockComment = false;

   for (let index = 0; index < doc.length; index++) {
      const char = doc[index];
      const next = doc[index + 1];

      if (inLineComment) {
         if (char === '\n') inLineComment = false;
         continue;
      }
      if (inBlockComment) {
         if (char === '*' && next === '/') {
            inBlockComment = false;
            index++;
         }
         continue;
      }
      if (quote) {
         if (escaped) {
            escaped = false;
         } else if (char === '\\') {
            escaped = true;
         } else if (char === quote) {
            quote = null;
         }
         continue;
      }
      if (char === '/' && next === '/') {
         inLineComment = true;
         index++;
         continue;
      }
      if (char === '/' && next === '*') {
         inBlockComment = true;
         index++;
         continue;
      }
      if (char === '"' || char === "'" || char === '`') {
         quote = char;
         escaped = false;
         continue;
      }
      if (OPEN_TO_CLOSE.has(char)) {
         stack.push({ char, position: index });
         continue;
      }

      const latest = stack[stack.length - 1];
      if (!latest || OPEN_TO_CLOSE.get(latest.char) !== char) continue;

      stack.pop();
      if (latest.position === openingPosition) {
         return index;
      }
   }

   return -1;
}

function initEditor() {
   if (!editorContainer.value) return;

   editorView.value?.destroy();
   editorView.value = new EditorView({
      state: EditorState.create({
         doc: sourceCode.value,
         extensions: buildExtensions()
      }),
      parent: editorContainer.value
   });
}

function updateEditorCode(code: string) {
   if (!editorView.value) {
      initEditor();
      return;
   }

   const currentCode = editorView.value.state.doc.toString();
   if (currentCode === code) return;

   editorView.value.dispatch({
      changes: {
         from: 0,
         to: editorView.value.state.doc.length,
         insert: code
      }
   });
}

function rebuildEditor() {
   if (!editorView.value) {
      initEditor();
      return;
   }

   editorView.value.setState(
      EditorState.create({
         doc: sourceCode.value,
         extensions: buildExtensions()
      })
   );
}

async function copyCode() {
   const code = sourceCode.value;
   if (!code) return;

   try {
      if (navigator.clipboard?.writeText) {
         await navigator.clipboard.writeText(code);
      } else {
         const textarea = document.createElement('textarea');
         textarea.value = code;
         textarea.setAttribute('readonly', '');
         textarea.style.position = 'fixed';
         textarea.style.opacity = '0';
         document.body.appendChild(textarea);
         textarea.select();
         document.execCommand('copy');
         document.body.removeChild(textarea);
      }

      copied.value = true;
      if (copyTimer) window.clearTimeout(copyTimer);
      copyTimer = window.setTimeout(() => {
         copied.value = false;
      }, 1600);
   } catch (error) {
      console.error('[FoldCodeBlock] Copy failed:', error);
   }
}

watch(sourceCode, updateEditorCode, { flush: 'post' });
watch([normalizedLang, () => props.lineNumbers, () => props.folding, isDark], rebuildEditor, {
   flush: 'post'
});

onMounted(initEditor);

onUnmounted(() => {
   if (copyTimer) window.clearTimeout(copyTimer);
   editorView.value?.destroy();
   editorView.value = null;
});
</script>

<template>
   <section
      class="fold-code-block"
      :class="[`lang-${normalizedLang}`, { 'has-line-numbers': props.lineNumbers }]"
      :style="{
         '--fold-code-min-height': props.minHeight,
         '--fold-code-max-height': props.maxHeight
      }"
   >
      <div v-if="!props.hideHeader" class="fold-code-header">
         <span class="fold-code-lang">{{ displayTitle }}</span>
         <button class="fold-code-copy" type="button" @click="copyCode">
            {{ copied ? '已复制' : '复制' }}
         </button>
      </div>
      <div ref="editorContainer" class="fold-code-editor" />
   </section>
</template>

<style lang="scss" scoped>
.fold-code-block {
   --fold-code-bg: var(--eng-c-code-bg, var(--vp-code-block-bg));
   --fold-code-panel: var(--eng-c-code-panel, var(--vp-code-block-bg));
   --fold-code-border: var(--eng-c-code-border, var(--vp-code-block-divider-color));
   --fold-code-text: var(--eng-c-code-text, var(--vp-c-text-1));
   --fold-code-muted: var(--eng-c-code-muted, var(--vp-c-text-2));
   --fold-code-hover: var(--eng-c-code-tab-hover, rgba(37, 99, 235, 0.06));
   --fold-code-copy-bg: var(--eng-c-code-copy-bg, var(--vp-c-bg-soft));
   --fold-code-copy-hover-bg: var(--eng-c-code-copy-hover-bg, var(--vp-c-bg-alt));
   --fold-code-copy-border: var(--eng-c-code-copy-border, var(--vp-c-divider));
   --fold-code-scrollbar-thumb: var(--eng-c-code-scrollbar-thumb, rgba(100, 116, 139, 0.45));
   --fold-code-scrollbar-thumb-hover: var(
      --eng-c-code-scrollbar-thumb-hover,
      rgba(100, 116, 139, 0.7)
   );

   margin: 16px 0;
   overflow: hidden;
   border: 1px solid var(--fold-code-border);
   border-radius: 8px;
   background: var(--fold-code-bg);
}

.fold-code-header {
   display: flex;
   align-items: center;
   justify-content: space-between;
   gap: 10px;
   min-height: 38px;
   padding: 7px 10px 7px 14px;
   border-bottom: 1px solid var(--fold-code-border);
   background: var(--fold-code-panel);
}

.fold-code-lang {
   overflow: hidden;
   color: var(--fold-code-muted);
   font-family: Consolas, Monaco, 'Courier New', monospace;
   font-size: 12px;
   font-weight: 700;
   line-height: 1.4;
   text-overflow: ellipsis;
   white-space: nowrap;
}

.fold-code-copy {
   flex-shrink: 0;
   min-width: 52px;
   height: 26px;
   padding: 0 10px;
   border: 1px solid var(--fold-code-copy-border);
   border-radius: 6px;
   color: var(--fold-code-muted);
   background: var(--fold-code-copy-bg);
   font-size: 12px;
   line-height: 24px;
   cursor: pointer;
   transition:
      color 0.15s,
      border-color 0.15s,
      background 0.15s;

   &:hover {
      color: var(--fold-code-text);
      background: var(--fold-code-copy-hover-bg);
   }
}

.fold-code-editor {
   min-height: var(--fold-code-min-height);
   max-height: var(--fold-code-max-height);
   background: var(--fold-code-bg);

   :deep(.cm-editor) {
      min-height: var(--fold-code-min-height);
      max-height: var(--fold-code-max-height);
      font-family: 'Fira Code', Consolas, Monaco, 'Courier New', monospace;
      font-size: 13.5px;
      line-height: 1.65;
      background: var(--fold-code-bg);
      color: var(--fold-code-text);

      &.cm-focused {
         outline: none;
      }
   }

   :deep(.cm-scroller) {
      max-height: var(--fold-code-max-height);
      overflow: auto;
      font-family: inherit;

      &::-webkit-scrollbar {
         width: 10px;
         height: 10px;
      }

      &::-webkit-scrollbar-track {
         background: transparent;
      }

      &::-webkit-scrollbar-thumb {
         border: 3px solid var(--fold-code-bg);
         border-radius: 999px;
         background-color: var(--fold-code-scrollbar-thumb);
         background-clip: padding-box;

         &:hover {
            background-color: var(--fold-code-scrollbar-thumb-hover);
         }
      }
   }

   :deep(.cm-content) {
      padding: 8px 0 14px;
      caret-color: transparent;
   }

   :deep(.cm-line) {
      padding: 0 14px 0 6px;
   }

   :deep(.cm-gutters) {
      border-right: 1px solid var(--fold-code-border);
      background: var(--fold-code-bg);
      color: var(--eng-c-code-line-number);
      user-select: none;
   }

   :deep(.cm-lineNumbers .cm-gutterElement) {
      min-width: 38px;
      padding: 0 9px 0 8px;
      color: var(--eng-c-code-line-number);
      font-size: 12px;
   }

   :deep(.cm-foldGutter) {
      width: 34px;

      .cm-gutterElement {
         display: flex;
         align-items: center;
         justify-content: center;
         padding: 0;
         cursor: pointer;
      }
   }

   :deep(.cm-fold-open),
   :deep(.cm-fold-closed) {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 18px;
      border-radius: 4px;
      color: var(--eng-c-code-line-number);
      transition:
         color 0.15s,
         background 0.15s;
   }

   :deep(.cm-fold-open) {
      color: transparent;
   }

   :deep(.cm-gutters:hover .cm-fold-open),
   :deep(.cm-fold-closed) {
      color: var(--eng-c-code-line-number);
   }

   :deep(.cm-gutterElement:hover .cm-fold-open),
   :deep(.cm-fold-closed:hover) {
      background: var(--fold-code-hover);
      color: var(--fold-code-text);
   }

   :deep(.cm-foldPlaceholder) {
      padding: 0 7px;
      border: 1px solid var(--fold-code-border);
      border-radius: 4px;
      color: var(--fold-code-muted);
      background: var(--fold-code-panel);
      font-size: 11px;
      cursor: pointer;
   }

   :deep(.cm-cursor) {
      display: none;
   }
}
</style>
