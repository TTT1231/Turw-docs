<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue';
import FoldCodeBlock from './FoldCodeBlock.vue';

interface CodeEntry {
    lang: string;
    title: string;
    code: string;
}

interface Props {
    encodedBlocks: string;
    maxHeight?: string;
    minHeight?: string;
    lineNumbers?: boolean;
    folding?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    maxHeight: '550px',
    minHeight: '0px',
    lineNumbers: false,
    folding: true
});

const activeIndex = ref(0);
const copied = ref(false);
let copyTimer: number | undefined;

const groupName = computed(() => `fold-code-${hashString(props.encodedBlocks)}`);

const entries = computed<CodeEntry[]>(() => {
    try {
        const decoded = decodeURIComponent(props.encodedBlocks);
        const value = JSON.parse(decoded) as CodeEntry[];
        return Array.isArray(value) ? value.filter((item) => item.code) : [];
    } catch {
        return [];
    }
});

const activeEntry = computed(() => entries.value[activeIndex.value] ?? entries.value[0]);

watch(entries, (list) => {
    if (activeIndex.value >= list.length) {
        activeIndex.value = 0;
    }
});

function normalizeLang(lang: string): string {
    return lang.toLowerCase().trim() || 'txt';
}

function getTabLabel(entry: CodeEntry): string {
    return entry.title || normalizeLang(entry.lang).toUpperCase();
}

function getDataTitle(entry: CodeEntry): string {
    if (entry.title) return entry.title;

    const lang = normalizeLang(entry.lang);
    return lang.startsWith('.') ? lang : `.${lang}`;
}

function hashString(value: string): string {
    let hash = 0;

    for (let index = 0; index < value.length; index++) {
        hash = (hash << 5) - hash + value.charCodeAt(index);
        hash |= 0;
    }

    return Math.abs(hash).toString(36);
}

async function copyActiveCode() {
    const code = activeEntry.value?.code;
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
        console.error('[FoldCodeGroup] Copy failed:', error);
    }
}

onUnmounted(() => {
    if (copyTimer) window.clearTimeout(copyTimer);
});
</script>

<template>
    <section class="fold-code-group vp-code-group">
        <div class="tabs fold-code-tabs">
            <div class="tab-list" role="tablist" aria-label="代码文件">
                <template v-for="(entry, index) in entries" :key="`${entry.lang}-${index}`">
                    <input
                        :id="`${groupName}-${index}`"
                        class="tab-input"
                        type="radio"
                        :name="groupName"
                        :checked="index === activeIndex"
                        @change="activeIndex = index"
                    />
                    <label
                        :for="`${groupName}-${index}`"
                        :data-title="getDataTitle(entry)"
                        role="tab"
                        :aria-selected="index === activeIndex"
                    >
                        <span>{{ getTabLabel(entry) }}</span>
                    </label>
                </template>
            </div>
            <button
                class="copy-button"
                type="button"
                :aria-label="copied ? '已复制' : '复制代码'"
                :title="copied ? '已复制' : '复制代码'"
                @click="copyActiveCode"
            >
                <svg
                    v-if="!copied"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                >
                    <rect
                        x="9"
                        y="9"
                        width="11"
                        height="11"
                        rx="2"
                        stroke="currentColor"
                        stroke-width="2"
                    />
                    <path
                        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                    />
                </svg>
                <svg
                    v-else
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                >
                    <path
                        d="M20 6 9 17l-5-5"
                        stroke="currentColor"
                        stroke-width="2.3"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
            </button>
        </div>

        <div class="fold-code-body">
            <FoldCodeBlock
                v-if="activeEntry"
                :key="`${activeEntry.lang}-${activeIndex}`"
                class="group-editor"
                :lang="activeEntry.lang"
                :code="activeEntry.code"
                :max-height="props.maxHeight"
                :min-height="props.minHeight"
                :line-numbers="props.lineNumbers"
                :folding="props.folding"
                hide-header
            />
        </div>
    </section>
</template>

<style lang="scss" scoped>
.fold-code-group {
    --fold-code-bg: var(--eng-c-code-bg);
    --fold-code-panel: var(--eng-c-code-panel);
    --fold-code-border: var(--eng-c-code-border);
    --fold-code-text: var(--eng-c-code-text);
    --fold-code-muted: var(--eng-c-code-muted);
    --fold-code-hover: var(--eng-c-code-tab-hover);
    --fold-code-active: var(--eng-c-code-tab-active);
    --fold-code-active-line: var(--eng-c-code-tab-line);
    --fold-code-copy-bg: var(--eng-c-code-copy-bg);
    --fold-code-copy-hover-bg: var(--eng-c-code-copy-hover-bg);
    --fold-code-copy-border: var(--eng-c-code-copy-border);
    --fold-code-scrollbar-thumb: var(--eng-c-code-scrollbar-thumb);
    --fold-code-scrollbar-thumb-hover: var(--eng-c-code-scrollbar-thumb-hover);

    margin: 16px 0;
    overflow: hidden;
    border: 1px solid var(--fold-code-border);
    border-radius: 8px;
    background: var(--fold-code-bg);
}

.fold-code-tabs {
    display: flex;
    align-items: center;
    padding: 0;
    border-bottom: 1px solid var(--fold-code-border);
    background: var(--fold-code-panel);
}

.tab-list {
    display: flex;
    flex: 1;
    min-width: 0;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: thin;
    scrollbar-color: var(--fold-code-scrollbar-thumb) transparent;

    &::-webkit-scrollbar {
        height: 10px;
    }

    &::-webkit-scrollbar-track {
        background: transparent;
    }

    &::-webkit-scrollbar-thumb {
        border: 3px solid var(--fold-code-panel);
        border-radius: 999px;
        background-color: var(--fold-code-scrollbar-thumb);
        background-clip: padding-box;

        &:hover {
            background-color: var(--fold-code-scrollbar-thumb-hover);
        }
    }

    .tab-input {
        position: absolute;
        width: 1px;
        height: 1px;
        opacity: 0;
        pointer-events: none;
    }

    label {
        display: inline-flex;
        flex: 0 0 auto;
        align-items: center;
        gap: 6px;
        min-height: 42px;
        padding: 0 16px;
        color: var(--fold-code-muted);
        cursor: pointer;
        white-space: nowrap;
        transition:
            color 0.16s ease,
            background-color 0.16s ease;

        span {
            flex: 0 0 auto;
        }

        &:hover {
            color: var(--fold-code-text);
            background: var(--fold-code-hover);
        }
    }

    .tab-input:checked + label {
        color: var(--fold-code-text);
        background: var(--fold-code-active);
        box-shadow: inset 0 -2px 0 var(--fold-code-active-line);
    }
}

.fold-code-body {
    position: relative;
    min-height: 64px;
}

.copy-button {
    flex-shrink: 0;
    margin: 0 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 1px solid var(--fold-code-copy-border);
    border-radius: 6px;
    color: var(--fold-code-muted);
    background: var(--fold-code-copy-bg);
    cursor: pointer;
    transition:
        color 0.15s,
        background 0.15s;

    svg {
        flex-shrink: 0;
    }

    &:hover {
        color: var(--fold-code-text);
        background: var(--fold-code-copy-hover-bg);
    }
}

.group-editor {
    margin: 0;
    border: 0;
    border-radius: 0;
}
</style>
