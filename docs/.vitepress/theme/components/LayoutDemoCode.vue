<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import { cssLanguage } from '@codemirror/lang-css';
import { htmlLanguage } from '@codemirror/lang-html';
import { highlightTree, tagHighlighter, tags } from '@lezer/highlight';
import CopyBtn from './CopyBtn.vue';

interface CodeEntry {
    label: string;
    language: 'css' | 'html';
    code: string;
}

const props = defineProps<{ entries: CodeEntry[] }>();
const panelId = useId();
const activeIndex = ref(0);
const activeEntry = computed(() => props.entries[activeIndex.value] ?? props.entries[0]);
const parsers = { css: cssLanguage.parser, html: htmlLanguage.parser };
const highlighter = tagHighlighter([
    { tag: [tags.propertyName, tags.attributeName], class: 'syntax-property' },
    { tag: [tags.className, tags.function(tags.variableName)], class: 'syntax-selector' },
    { tag: tags.tagName, class: 'syntax-tag' },
    { tag: [tags.number, tags.unit], class: 'syntax-number' },
    { tag: tags.string, class: 'syntax-string' },
    { tag: tags.comment, class: 'syntax-comment' }
]);

function escapeHtml(value: string) {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const highlightedCode = computed(() => {
    const entry = activeEntry.value;
    if (!entry) return '';

    const fragments: string[] = [];
    let position = 0;
    highlightTree(parsers[entry.language].parse(entry.code), highlighter, (from, to, classes) => {
        fragments.push(escapeHtml(entry.code.slice(position, from)));
        fragments.push(`<span class="${classes}">${escapeHtml(entry.code.slice(from, to))}</span>`);
        position = to;
    });
    fragments.push(escapeHtml(entry.code.slice(position)));
    return fragments.join('');
});

function onTabKeydown(event: KeyboardEvent) {
    let nextIndex = activeIndex.value;
    if (event.key === 'ArrowRight') nextIndex = (nextIndex + 1) % props.entries.length;
    else if (event.key === 'ArrowLeft') {
        nextIndex = (nextIndex - 1 + props.entries.length) % props.entries.length;
    } else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = props.entries.length - 1;
    else return;

    event.preventDefault();
    activeIndex.value = nextIndex;
    const tabList = event.currentTarget as HTMLElement;
    tabList.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex]?.focus();
}
</script>

<template>
    <div v-if="activeEntry" class="demo-code">
        <div class="code-header">
            <div
                v-if="entries.length > 1"
                class="code-tabs"
                role="tablist"
                aria-label="示例代码语言"
                @keydown="onTabKeydown"
            >
                <button
                    v-for="(entry, index) in entries"
                    :id="`${panelId}-tab-${index}`"
                    :key="entry.label"
                    class="code-tab"
                    type="button"
                    role="tab"
                    :aria-selected="index === activeIndex"
                    :aria-controls="`${panelId}-panel`"
                    :tabindex="index === activeIndex ? 0 : -1"
                    @click="activeIndex = index"
                >
                    {{ entry.label }}
                </button>
            </div>
            <span v-else :id="`${panelId}-label`" class="code-language">
                {{ activeEntry.label }}
            </span>
            <CopyBtn :copy-value="activeEntry.code" show-label />
        </div>
        <div
            :id="`${panelId}-panel`"
            class="demo-code-content"
            :role="entries.length > 1 ? 'tabpanel' : 'region'"
            :aria-labelledby="
                entries.length > 1 ? `${panelId}-tab-${activeIndex}` : `${panelId}-label`
            "
            tabindex="0"
        >
            <pre><code v-html="highlightedCode"></code></pre>
        </div>
    </div>
</template>
