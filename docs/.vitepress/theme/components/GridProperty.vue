<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import LayoutDemoCode from './LayoutDemoCode.vue';

const demoId = useId();
const columns = ref('repeat(3, minmax(0, 1fr))');
const rows = ref('none');
const columnOptions = [
    'none',
    '1fr 2fr 1fr',
    'repeat(3, minmax(0, 1fr))',
    'repeat(auto-fit, minmax(200px, 1fr))',
    'repeat(auto-fill, minmax(200px, 1fr))',
    'repeat(3, minmax(min-content, 1fr))',
    'repeat(auto-fit, minmax(200px, auto))'
];
// Auto-repeat only accepts fixed track sizes, so use explicit repeats for fr rows.
const rowOptions = [
    'none',
    '1fr 2fr 1fr',
    'repeat(3, minmax(0, 1fr))',
    'repeat(auto-fit, minmax(80px, 1fr))',
    'repeat(auto-fill, minmax(80px, 1fr))',
    'repeat(3, minmax(min-content, 1fr))',
    'repeat(auto-fit, minmax(80px, auto))'
];
const containerStyle = computed(() => ({
    display: 'grid',
    gridTemplateColumns: columns.value,
    gridTemplateRows: rows.value,
    height: '300px'
}));
const cssCode = computed(
    () => `.container {
  display: grid;
  grid-template-columns: ${columns.value};
  grid-template-rows: ${rows.value};
  height: 300px;
  gap: 12px;
}`
);

function resetProperties() {
    columns.value = 'repeat(3, minmax(0, 1fr))';
    rows.value = 'none';
}
</script>

<template>
    <section class="layout-demo grid-property-demo" aria-label="Grid 布局演示">
        <div class="property-selectors">
            <div class="selector-group">
                <label :for="`${demoId}-columns`">grid-template-columns</label>
                <select :id="`${demoId}-columns`" v-model="columns">
                    <option v-for="value in columnOptions" :key="value" :value="value">
                        {{ value }}
                    </option>
                </select>
            </div>
            <div class="selector-group">
                <label :for="`${demoId}-rows`">grid-template-rows</label>
                <select :id="`${demoId}-rows`" v-model="rows">
                    <option v-for="value in rowOptions" :key="value" :value="value">
                        {{ value }}
                    </option>
                </select>
            </div>
        </div>
        <div class="demo-preview">
            <div class="preview-header">
                <h4>效果预览 <span class="preview-count">8 个项目</span></h4>
                <button class="demo-reset" type="button" @click="resetProperties">重置</button>
            </div>
            <div class="preview-scroll">
                <div class="layout-preview grid-container" :style="containerStyle">
                    <div v-for="i in 8" :key="i" class="demo-item">Item {{ i }}</div>
                </div>
            </div>
        </div>
        <LayoutDemoCode :entries="[{ label: 'CSS', language: 'css', code: cssCode }]" />
    </section>
</template>
