---
outline: deep
---

# 常见问题及其解决方案

主要讲解项目中遇到的问题及其解决方案。

## 大文件分片上传

**思路**：获取文件信息，然后进行分片，分片使用form表单上传（前端）  
后端接受分片存储在一个临时目录中（可以按文件id进行临时存储）  
最后存储完毕，对所有分片结果进行合并

```js
//===========================前端================================
const handleUpLoadFiles = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files![0];
  const fileName = file.name;

  const chunkSize = 1024 * 1024; // 1MB
  const chunkSizeTotal = Math.ceil(file.size / chunkSize); //分片总数

  const fileId = generateUUID(); //文件id可以随意生成，唯一就可以以便临时存储

  for (let i = 0; i < chunkSizeTotal; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);

    const chunk = file.slice(start, end);    //获取当前分片

    //创建FormData对象
    const formData = new FormData();
    formData.append("file", chunk);
    formData.append("fileId", fileId);
    formData.append("chunkIndex", i.toString());

    $fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
  }
  //合并
  await $fetch("/api/merage", {
    method: "POST",
    body: { fileId, fileName },
  });
};
//===========================后端================================
//前端传递过来的分片数据进行临时目录存储
export default defineEventHandler(async (event)=> {
    //这里不考虑上传分片过来数据错误
    const formData = await readMultipartFormData(event)
    const file =  formData?.find(item=>item.name === 'file')
    const fileID =  formData?.find(item=>item.name === 'fileId')?.data.toString()
    const chunkIndex = formData?.find(item=>item.name === 'chunkIndex')?.data.toString()
    //分片要存放目录
    const chunkDir = path.join(process.cwd(), 'uploads', fileID)
    //分片目标存放位置
    const chunkPath = path.join(chunkDir, chunkIndex)
    fs.ensureDirSync(chunkDir)
    fs.writeFileSync(chunkPath, file.data)

    return 'success'
})
//合并分片就简单多了，主要逻辑是获取分片的目标位置，然后读取所有分片数据(注意排序)，最后写入
```

## 响应式对象数据性能问题

如果一个对象有很多属性在内部使用响应式深度追踪，定义一个数组，  
这个数组中加入很多个这样的对象，在游览器去渲染的时候会卡顿。  
vue3内部对响应式数据做了数据代理和追踪【主要在这里卡顿】，  
如果不需要修改对象**取消响应式或者冻结对象**。  
vue3在定义响应式对象之前，通过原生API判断是否为freeze

## 下拉组件下拉效果不显示及其动画问题

在封装下拉组件时，如果动画过渡不对就触发不了下拉动画  
例如`h-0 group-hover:max-h-12`就没有效果，改成**group-hover:h-12或max-h-0**（需要1-1对应，**也即[h]-[h],[max-h]-[max-h]**）就有效。  
如果过渡目标到h-auto，由于动画只支持插值数值，这里会不生效，可以通过js计算获取，然后赋值。【js改写style，必须要手动写transition内联样式，同时js实现下拉动画也即改写style时要触发强制重排，否则动画就没有效果】

```vue
<script lang="ts" setup>
import { onMounted, useTemplateRef } from 'vue';

const father = useTemplateRef('father');
const son = useTemplateRef('son');

onMounted(() => {
   father.value!.onmouseenter = () => {
      son.value!.style.height = 'auto';
      const height = son.value!.offsetHeight + 'px';
      son.value!.style.height = '0px';
      //强制渲染,渲染Layout，强制重排
      son.value!.clientHeight;
      son.value!.style.transition = '0.5s';
      son.value!.style.height = height;
   };
   father.value!.onmouseleave = () => {
      son.value!.style.height = '0px';
      son.value!.style.transition = '0.5s';
   };
});
</script>
<template>
   <div class="flex flex-col items-center h-screen">
      <div class="relative inline-block" ref="father">
         鼠标移入显示下拉内容
         <div
            class="absolute top-full left-0 bg-cyan-400 w-64
       overflow-hidden h-0 
       transition-all duration-300 
      "
            ref="son"
         >
            ...下拉内容（占位用）...
         </div>
      </div>
   </div>
</template>
```

还有一种方案不使用js使用css中scale实现，对内容进行y轴缩放实现动画效果。  
效率很高不会触发游览器重排，动画更流畅，性能更好。  
注：**由于scale操作的时transform所以动画效果要用transform效果**。  
这里效果是从上到下（默认中间散开）所以需要origin-top`transform-origin: top;`设置动画起点

```html
<!-- tailwind css 写法 -->
<div class="relative inline-block group">
   鼠标移入显示下拉内容
   <div
      class="absolute top-full left-0 bg-cyan-400 w-64
       overflow-hidden origin-top scale-y-0 group-hover:scale-y-100
       transition-transform duration-300 ease-in-out
      "
   >
      ...下拉内容（占位）...
   </div>
</div>
```
