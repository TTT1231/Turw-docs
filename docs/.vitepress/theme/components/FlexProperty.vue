<script setup lang="ts">
import { ref, computed, useId } from 'vue';
import LayoutDemoCode from './LayoutDemoCode.vue';
const demoId = useId();
// 响应式数据
const justifyContent = ref<
    'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'
>('flex-start');
const alignItems = ref<'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline'>('stretch');
const flexDirection = ref<'row' | 'row-reverse' | 'column' | 'column-reverse'>('row');

const flex = ref<'flex-initial' | 'flex-1' | 'flex-auto' | 'flex-none'>('flex-initial');
const flexWrap = ref<'nowrap' | 'wrap' | 'wrap-reverse'>('nowrap');

// 计算属性：容器样式
const containerStyle = computed(() => ({
    display: 'flex',
    justifyContent: justifyContent.value,
    alignItems: alignItems.value,
    flexDirection: flexDirection.value,
    flexWrap: flexWrap.value,
    height: flexDirection.value.includes('column') ? '360px' : '168px'
}));

const flexValues = {
    'flex-initial': '0 1 auto',
    'flex-1': '1 1 0%',
    'flex-auto': '1 1 auto',
    'flex-none': 'none'
};
const itemStyle = computed(() => ({ flex: flexValues[flex.value] }));

// 计算属性：CSS代码
const cssCode = computed(() => {
    return `.container {
  display: flex;
  justify-content: ${justifyContent.value};
  align-items: ${alignItems.value};
  flex-direction: ${flexDirection.value};
  flex-wrap: ${flexWrap.value};
  height: ${containerStyle.value.height};
  gap: 12px;
}

.flex-item {
  flex: ${flexValues[flex.value]};
}`;
});

// 计算属性：Tailwind CSS代码
const tailwindCode = computed(() => {
    const justifyMap = {
        'flex-start': 'justify-start',
        'flex-end': 'justify-end',
        center: 'justify-center',
        'space-between': 'justify-between',
        'space-around': 'justify-around',
        'space-evenly': 'justify-evenly'
    };

    const alignMap = {
        stretch: 'items-stretch',
        'flex-start': 'items-start',
        'flex-end': 'items-end',
        center: 'items-center',
        baseline: 'items-baseline'
    };

    const directionMap = {
        row: 'flex-row',
        'row-reverse': 'flex-row-reverse',
        column: 'flex-col',
        'column-reverse': 'flex-col-reverse'
    };

    const wrapMap = {
        nowrap: 'flex-nowrap',
        wrap: 'flex-wrap',
        'wrap-reverse': 'flex-wrap-reverse'
    };

    const containerClasses = [
        'flex',
        justifyMap[justifyContent.value],
        alignMap[alignItems.value],
        directionMap[flexDirection.value],
        wrapMap[flexWrap.value],
        `h-[${containerStyle.value.height}]`,
        'gap-3'
    ].join(' ');

    return `<div class="${containerClasses}">
  <div class="${flex.value}">Item 1</div>
  <div class="${flex.value}">Item 2</div>
  <div class="${flex.value}">Item 3</div>
  <div class="${flex.value}">Item 4</div>
</div>`;
});

function resetProperties() {
    justifyContent.value = 'flex-start';
    alignItems.value = 'stretch';
    flexDirection.value = 'row';
    flexWrap.value = 'nowrap';
    flex.value = 'flex-initial';
}
</script>

<template>
    <section class="layout-demo flex-property-demo" aria-label="Flex 布局演示">
        <div class="property-selectors">
            <div class="selector-group">
                <label :for="`${demoId}-justify`">justify-content</label>
                <select :id="`${demoId}-justify`" v-model="justifyContent">
                    <option value="flex-start">flex-start（左对齐）</option>
                    <option value="flex-end">flex-end（右对齐）</option>
                    <option value="center">center（居中）</option>
                    <option value="space-between">space-between（两端对齐）</option>
                    <option value="space-around">space-around（环绕对齐）</option>
                    <option value="space-evenly">space-evenly（平均分布）</option>
                </select>
            </div>
            <div class="selector-group">
                <label :for="`${demoId}-align`">align-items</label>
                <select :id="`${demoId}-align`" v-model="alignItems">
                    <option value="stretch">stretch（拉伸）</option>
                    <option value="flex-start">flex-start（起始对齐）</option>
                    <option value="flex-end">flex-end（末端对齐）</option>
                    <option value="center">center（居中）</option>
                    <option value="baseline">baseline（基线对齐）</option>
                </select>
            </div>
            <div class="selector-group">
                <label :for="`${demoId}-direction`">flex-direction</label>
                <select :id="`${demoId}-direction`" v-model="flexDirection">
                    <option value="row">row（水平）</option>
                    <option value="row-reverse">row-reverse（水平反向）</option>
                    <option value="column">column（垂直）</option>
                    <option value="column-reverse">column-reverse（垂直反向）</option>
                </select>
            </div>
            <div class="selector-group">
                <label :for="`${demoId}-wrap`">flex-wrap</label>
                <select :id="`${demoId}-wrap`" v-model="flexWrap">
                    <option value="nowrap">nowrap（不换行）</option>
                    <option value="wrap">wrap（换行）</option>
                    <option value="wrap-reverse">wrap-reverse（反向换行）</option>
                </select>
            </div>
            <div class="selector-group">
                <label :for="`${demoId}-flex`">flex（子项伸缩）</label>
                <select :id="`${demoId}-flex`" v-model="flex">
                    <option value="flex-initial">0 1 auto（默认）</option>
                    <option value="flex-1">1 1 0%（平均分配）</option>
                    <option value="flex-auto">1 1 auto（基于内容）</option>
                    <option value="flex-none">none（固定大小）</option>
                </select>
            </div>
        </div>
        <div class="demo-preview">
            <div class="preview-header">
                <h4>效果预览 <span class="preview-count">4 个项目</span></h4>
                <button class="demo-reset" type="button" @click="resetProperties">重置</button>
            </div>
            <div class="preview-scroll">
                <div class="layout-preview flex-container" :style="containerStyle">
                    <div v-for="i in 4" :key="i" class="demo-item" :style="itemStyle">
                        Item {{ i }}
                    </div>
                </div>
            </div>
        </div>
        <LayoutDemoCode
            :entries="[
                { label: 'CSS', language: 'css', code: cssCode },
                { label: 'Tailwind CSS', language: 'html', code: tailwindCode }
            ]"
        />
    </section>
</template>
