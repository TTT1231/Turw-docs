<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { Skeleton as ASkeleton } from 'ant-design-vue';

type ShowImgType = 'APP-ERROR' | 'FRONTEND-ERROR' | 'LAYERS-STRUCT';

const props = defineProps({
   showImg: {
      type: String as () => ShowImgType,
      required: true,
      validator: (value: string) => {
         return ['APP-ERROR', 'FRONTEND-ERROR', 'LAYERS-STRUCT'].includes(value);
      }
   }
});

//nuxt error handle skleton
const imgMap = {
   'APP-ERROR': '/Turw-docs/assets/images/application.png',
   'FRONTEND-ERROR': '/Turw-docs/assets/images/frontedend.png',
   'LAYERS-STRUCT': '/Turw-docs/assets/images/layers-struct.png'
};

const isLoading = ref(true);
const currentImgSrc = ref(imgMap[props.showImg]);

// 判断是否是第三张图片
const isLayersStruct = computed(() => props.showImg === 'LAYERS-STRUCT');

onMounted(() => {
   isLoading.value = false;
});
</script>

<template>
   <a-skeleton :loading="isLoading" active>
      <!-- 第三张图片的特殊布局 -->
      <div v-if="isLayersStruct" class="min-h-[800px] aspect-[12/8] relative">
         <img :src="currentImgSrc" :alt="showImg" class="h-[300px] max-w-[300px] object-cover" />
      </div>

      <!-- 其他图片的默认显示方式 -->
      <img v-else :src="currentImgSrc" :alt="showImg" />
   </a-skeleton>
</template>
