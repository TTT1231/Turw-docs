<script setup lang="ts">
import { computed, ref } from 'vue';
import { Select as ASelect, SelectOption as ASelectOption } from 'ant-design-vue';

type GridColumnClass =
   | 'grid-cols-none'
   | 'grid-cols-[1fr_2fr_1fr]'
   | 'gird-cols-[repeat(auto-fit,minmax(200px,1fr))]'
   | 'grid-cols-[repeat(auto-fill,minmax(200px,1fr))]'
   | 'grid-cols-[repeat(3,minmax(min-content,1fr))]'
   | 'grid-cols-[repeat(auto-fit,minmax(200px,auto))]'
   | 'grid-cols-3';
type GridRowClass =
   | 'grid-rows-none'
   | 'grid-rows-[1fr_2fr_1fr]'
   | 'gird-rows-[repeat(auto-fit,minmax(200px,1fr))]'
   | 'grid-rows-[repeat(auto-fill,minmax(200px,1fr))]'
   | 'grid-rows-[]repeat(3,minmax(min-content,1fr))]'
   | 'grid-rows-[repeat(auto-fit,minmax(200px,auto))]'
   | 'grid-rows-3';

const dynamicStyleColumns = ref<GridColumnClass>('grid-cols-3');
const dynamicStyleRows = ref<GridRowClass>('grid-rows-none');

const dynamicStyle = computed(() => {
   return dynamicStyleColumns.value + ' ' + dynamicStyleRows.value;
});
</script>
<template>
   <div class="mb-6 mr-0 p-5 border border-solid border-[#e5e7eb] bg-[#fefefe] rounded-xl">
      <!-- 多选选择 -->
      <div class="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-4">
         <!-- 列属性 -->
         <div class="flex flex-col gap-1.5">
            <label class="font-bold">grid-templates-column:</label>
            <a-select v-model:value="dynamicStyleColumns" style="width: 100%">
               <a-select-option value="grid-cols-none">grid-cols-none(默认)</a-select-option>
               <a-select-option value="grid-cols-[1fr_2fr_1fr]">1fr 2fr 1fr</a-select-option>
               <a-select-option value="grid-cols-[repeat(auto-fit,minmax(200px,1fr))]"
                  >repeat(auto-fit,minmax(200px,1fr))</a-select-option
               >
               <a-select-option value="grid-cols-[repeat(auto-fill,minmax(200px,1fr))]"
                  >repeat(auto-fill minmax(200px,1fr))</a-select-option
               >
               <a-select-option value="grid-cols-[repeat(3,minmax(min-content,1fr))]"
                  >repeat(3,minmax(min-content,1fr))</a-select-option
               >
               <a-select-option value="grid-cols-3">grid-cols-3</a-select-option>
            </a-select>
         </div>
         <!-- 行属性 -->
         <div class="flex flex-col gap-1.5">
            <label class="font-bold">grid-templates-row:</label>
            <a-select v-model:value="dynamicStyleRows" style="width: 100%">
               <a-select-option value="grid-rows-none">grid-rows-none(默认)</a-select-option>
               <a-select-option value="grid-rows-[1fr_2fr_1fr]">1fr 2fr 1fr</a-select-option>
               <a-select-option value="grid-rows-[repeat(auto-fit,minmax(200px,1fr))]"
                  >repeat(auto-fit,minmax(200px,1fr))</a-select-option
               >
               <a-select-option value="grid-rows-[repeat(auto-fill,minmax(200px,1fr))]"
                  >repeat(auto-fill minmax(200px,1fr))</a-select-option
               >
               <a-select-option value="grid-rows-[repeat(3,minmax(min-content,1fr))]"
                  >repeat(3,minmax(min-content,1fr))</a-select-option
               >
               <a-select-option value="grid-rows-3">grid-rows-3</a-select-option>
            </a-select>
         </div>
      </div>

      <!-- 效果展示 -->
      <div class="mb-8 p-5 bg-[#f8fafc] rounded-lg border border-solid border-[#e5e7eb]">
         <h4>效果展示</h4>
         <div class="transition-all duration-300 ease-in-out grid" :class="dynamicStyle">
            <template v-for="i in 8" :key="i">
               <div
                  class="p-4 rounded font-medium text-white text-center min-w-20 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg"
                  :class="`item-${i}`"
               >
                  Item {{ i }}
               </div>
            </template>
         </div>
      </div>
   </div>
</template>

<style scoped lang="scss">
@use 'sass:list';

$gradients: (
   1: (
      #ef4444,
      #dc2626
   ),
   2: (
      #3b82f6,
      #2563eb
   ),
   3: (
      #10b981,
      #059669
   ),
   4: (
      #f59e0b,
      #d97706
   ),
   5: (
      #a21caf,
      #7c3aed
   ),
   6: (
      #14b8a6,
      #06b6d4
   ),
   7: (
      #f43f5e,
      #f97316
   ),
   8: (
      #84cc16,
      #22d3ee
   )
);

@each $i, $colors in $gradients {
   .item-#{$i} {
      background: linear-gradient(135deg, list.nth($colors, 1), list.nth($colors, 2));
   }
}
</style>
