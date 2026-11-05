<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue';

const props = defineProps<{
    copyValue: string;
    showLabel?: boolean;
}>();

const isCopySuccess = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | undefined;
const copyToClipboard = async () => {
    const value = props.copyValue;
    try {
        await navigator.clipboard.writeText(value);
        if (props.copyValue !== value) return;
        isCopySuccess.value = true;
        if (copyTimer) clearTimeout(copyTimer);
        copyTimer = setTimeout(() => {
            isCopySuccess.value = false;
        }, 2000);
    } catch (err) {
        console.error('复制失败:', err);
    }
};
watch(
    () => props.copyValue,
    () => {
        clearTimeout(copyTimer);
        isCopySuccess.value = false;
    }
);
onUnmounted(() => clearTimeout(copyTimer));
</script>

<template>
    <button
        class="copy-button"
        :class="{ 'has-label': props.showLabel }"
        type="button"
        @click="copyToClipboard()"
        :title="isCopySuccess ? '已复制' : '复制代码'"
        :aria-label="isCopySuccess ? '已复制' : '复制代码'"
    >
        <svg
            v-if="!isCopySuccess"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
        >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>

        <svg
            v-else
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
        >
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span v-if="props.showLabel" aria-live="polite">{{
            isCopySuccess ? '已复制' : '复制'
        }}</span>
    </button>
</template>

<style lang="css" scoped>
.copy-button {
    background: var(--eng-c-code-copy-bg);
    border: 1px solid var(--eng-c-code-copy-border);
    border-radius: 6px;
    padding: 6px;
    color: var(--eng-c-code-muted);
    cursor: pointer;
    min-width: 30px;
    min-height: 30px;
    transition:
        background-color 0.15s ease,
        color 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.copy-button:hover {
    color: var(--eng-c-code-text);
    background: var(--eng-c-code-copy-hover-bg);
}

.copy-button svg {
    width: 14px;
    height: 14px;
}

.copy-button.has-label {
    gap: 6px;
    min-width: 72px;
    min-height: 36px;
    padding: 6px 10px;
    font-size: 13px;
    line-height: 20px;
}
</style>
