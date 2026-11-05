---
outline: deep
---

# 常见问题及其解决方案

## 大文件上传

快速概览：分片上传一般分三步 — 前端分片并上传、后端临时存储、完成后合并。

::: tip 提示
常见要点：断点续传、分片哈希校验、使用 AbortController 终止请求、把耗时计算交给 Web Worker。
:::

**分片断点终止上传**

主要实现用户可以对大文件请求进行终止和根据文件内容hash去判断在服务端有没有分片  
对之前上传的分片继续上传，提高上传速率和容错率。

::: code-group-fold line-numbers

```ts [slice-breakpoint.upload.ts]
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

      const chunk = file.slice(start, end); //获取当前分片

      //创建FormData对象
      const formData = new FormData();
      formData.append('file', chunk);
      formData.append('fileId', fileId);
      formData.append('chunkIndex', i.toString());

      $fetch('/api/upload', {
         method: 'POST',
         body: formData
      });
   }
   //合并
   await $fetch('/api/merage', {
      method: 'POST',
      body: { fileId, fileName }
   });
};
//===========================后端================================
//前端传递过来的分片数据进行临时目录存储
export default defineEventHandler(async (event) => {
   //这里不考虑上传分片过来数据错误
   const formData = await readMultipartFormData(event);
   const file = formData?.find((item) => item.name === 'file');
   const fileID = formData?.find((item) => item.name === 'fileId')?.data.toString();
   const chunkIndex = formData?.find((item) => item.name === 'chunkIndex')?.data.toString();
   //分片要存放目录
   const chunkDir = path.join(process.cwd(), 'uploads', fileID);
   //分片目标存放位置
   const chunkPath = path.join(chunkDir, chunkIndex);
   fs.ensureDirSync(chunkDir);
   fs.writeFileSync(chunkPath, file.data);

   return 'success';
});
//合并分片就简单多了，主要逻辑是获取分片的目标位置，然后读取所有分片数据(注意排序)，最后写入
```

:::

### 要点速览

- 前端：主线程分片、Worker 计算哈希、预检断点续传、使用 AbortController 终止上传
- 后端：接收分片、校验分片哈希、临时保存并在完成后合并

::: warning 注意
为保证一致性，前后端应使用相同的分片/文件哈希算法；大文件优先传 ArrayBuffer 给 Worker
:::

::: code-group-fold line-numbers

```ts [demo.ts]
//单个文件上传
const simulateFileUpload = async (file: UploadFile): Promise<void> => {
   const signal = file.abortInstance?.signal ?? new AbortController().signal;

   // 处理上传中止的逻辑
   const handleAbort = (message: string) => {
      console.log(message);
      file.progress = file.progress || 0;
      file.status = 'error';
      throw new Error(message);
   };

   // 监听中止信号，通过AbortController 中abort中止信号
   signal.addEventListener('abort', () => handleAbort('上传已被中止'));

   try {
      if (signal.aborted) {
         file.progress = file.progress || 0;
         console.log('上传已被中止');
         return; // 中止时提前返回
      }

      file.status = 'uploading';

      //主要完成根据字段名进行过滤，然后存储到相应对象中
      const extendDBInfo = getExtendDBInfoObj();
      if (!extendDBInfo) {
         file.status = 'error';
         throw new Error('缺少上传必要字段');
      }

      // 计算文件的MD5，worker计算
      const md5Hash = await computeFileWholeMD5(
         file.originFileObj!,
         file.chunkSize || defaultChunkSize,
         signal
      );
      console.log('文件整体 MD5');

      // 检查文件是否已经上传过
      //主要根据服务器中存储文件上传的临时目录，检查文件整体hash的分片数
      const checkFileApi = await $fetch<ApiResponse<CheckFileServerDTO>>(
         '/api/back/arts-management/check-file',
         {
            method: 'POST',
            body: { fileWholeMD5: md5Hash },
            signal: signal
         }
      );

      file.uploadMaxChunkIndex = checkFileApi.data?.currentChunkIndex ?? 0;
      const totalChunks = file.chunkCount ?? 1;
      file.fileContentWholeMD5 = md5Hash;

      // 如果文件已经完整上传过
      if (
         checkFileApi.status === HTTPStatus.OK &&
         checkFileApi.data?.currentChunkIndex === file.chunkCount
      ) {
         console.log('文件已完整上传');
         const isInDB = await $fetch<ApiResponse<'success' | 'uploading' | 'failed' | undefined>>(
            '/api/back/arts-management/db-exist',
            {
               method: 'POST',
               signal: signal,
               body: { fileWholeMd5: md5Hash }
            }
         );

         if (isInDB.status === HTTPStatus.OK && !isInDB.data) {
            await setFileStatus(md5Hash, 'uploading', extendDBInfo, file);
            const uploadRes = await uploadFileToDB(md5Hash, file, totalChunks, extendDBInfo);
            if (uploadRes) {
               await setFileStatus(md5Hash, 'success', extendDBInfo, file);
               resolveUpload(file);
            } else {
               file.status = 'error';
               resolveUpload(file);
            }
         } else {
            resolveUpload(file); // 文件已经在数据库中
         }
         return;
      }

      // 处理部分上传的情况，继续上传剩余的部分
      if (checkFileApi.status === HTTPStatus.OK && checkFileApi.data?.currentChunkIndex !== -1) {
         file.uploadMaxChunkIndex = checkFileApi.data.currentChunkIndex;
         file.progress = ((file.uploadMaxChunkIndex / totalChunks) * 100).toFixed(2);
         console.log('检测到部分上传，开始断点续传');
      }

      // 主上传循环
      for (let chunkIndex = file.uploadMaxChunkIndex; chunkIndex < totalChunks; chunkIndex++) {
         if (signal.aborted) {
            console.log('上传被中止');
            return;
         }

         if (file.status === 'paused') {
            console.log('上传已暂停');
            return;
         }

         if (file.status === 'error') {
            throw new Error('上传失败');
         }

         const chunkUploadRes = await upLoadFileChunk(file, extendDBInfo);
         if (signal.aborted) {
            console.log('上传被中止');
            return;
         }

         if (chunkUploadRes === 'user-cancel') {
            console.log('用户取消上传');
            return;
         }

         if (chunkUploadRes === undefined || chunkUploadRes.status !== HTTPStatus.OK) {
            file.status = 'error';
            throw new Error('上传失败');
         }

         // 更新上传进度和当前分片索引
         file.progress = ((chunkUploadRes.data?.currentChunksIndex! / totalChunks) * 100).toFixed(
            2
         );
         file.uploadMaxChunkIndex =
            chunkUploadRes.data?.currentChunksIndex ?? file.uploadMaxChunkIndex;

         await new Promise((res) => setTimeout(res, 200)); // 延迟，避免请求过于频繁
      }

      // 上传完成后保存到数据库
      await setFileStatus(md5Hash, 'uploading', extendDBInfo, file);
      const uploadRes = await uploadFileToDB(md5Hash, file, totalChunks, extendDBInfo);

      if (uploadRes) {
         await setFileStatus(md5Hash, 'success', extendDBInfo, file);
         resolveUpload(file);
      } else {
         file.status = 'error';
         resolveUpload(file);
      }
   } catch (error) {
      console.error('上传过程中发生错误:', error);
      file.status = 'error';
      file.progress = file.progress || 0;
      throw error;
   }
};

// 辅助函数：设置文件状态
const setFileStatus = async (
   md5Hash: string,
   status: string,
   extendDBInfo: any,
   file: UploadFile
) => {
   await $fetch('/api/back/arts-management/set-status', {
      method: 'POST',
      body: { fileWholeMd5: md5Hash, status }
   });
};

// 辅助函数：上传文件到数据库
const uploadFileToDB = async (
   md5Hash: string,
   file: UploadFile,
   totalChunks: number,
   extendDBInfo: any
) => {
   const uploadRes = await $fetch<ApiResponse<boolean>>('/api/back/arts-management/upload-db', {
      method: 'POST',
      body: {
         currentChunkIndex: file.uploadMaxChunkIndex,
         totalChunks,
         fileWholeMd5: md5Hash,
         totalSize: file.size,
         projectName: extendDBInfo.projectName ?? file.name,
         productType: extendDBInfo.productType,
         targetId: extendDBInfo.targetId,
         targetName: extendDBInfo.targetName
      }
   });

   return uploadRes.status === HTTPStatus.OK && uploadRes.data === true;
};

// 辅助函数：处理上传完成
const resolveUpload = (file: UploadFile) => {
   file.progress = 100;
   file.status = 'done';
};

//================================computed utils====================
//======================计算md5=========================
//md5Utils
import SparkMD5 from 'spark-md5';
//计算文件整体内容hash
// md5Utils.ts

export async function computeFileWholeMD5(
   file: File,
   chunkSize: number,
   signal: AbortSignal
): Promise<string> {
   return new Promise<string>((resolve, reject) => {
      // 创建 Worker
      const computeMD5Thread = new Worker(new URL('./md5Worker.js', import.meta.url), {
         type: 'module'
      });

      // 监听 Worker 返回的 MD5 结果
      computeMD5Thread.onmessage = (event) => {
         const { fileHash } = event.data;
         if (fileHash) {
            resolve(fileHash); // 计算完成，返回结果
         } else {
            reject(new Error('Failed to compute MD5 hash'));
         }
         computeMD5Thread.terminate(); // 计算完成后终止 Worker
      };

      computeMD5Thread.onerror = (err) => {
         reject(new Error('Worker error: ' + err.message));
         computeMD5Thread.terminate(); // 发生错误时终止 Worker
      };

      // Handle abort
      signal.addEventListener('abort', () => {
         console.log('MD5 computation aborted');
         computeMD5Thread.terminate(); // Terminate Worker when abort is triggered
         reject(new Error('MD5 computation aborted by user'));
      });
      // 计算文件分片总数
      const totalChunks = Math.ceil(file.size / chunkSize);
      const chunkPromises: Promise<ArrayBuffer>[] = [];

      // 逐个分片读取并转换为 ArrayBuffer
      for (let i = 0; i < totalChunks; i++) {
         const start = i * chunkSize;
         const end = Math.min((i + 1) * chunkSize, file.size);
         const chunk = file.slice(start, end); // 分片
         chunkPromises.push(chunk.arrayBuffer()); // 将每个分片转换为 ArrayBuffer
      }

      // 等待所有分片的 ArrayBuffer 完成后再传递给 Worker
      Promise.all(chunkPromises)
         .then((chunks) => {
            // 将所有分片（ArrayBuffer）传递给 Worker
            computeMD5Thread.postMessage({ chunks }, chunks);
         })
         .catch((error) => {
            reject(error);
            computeMD5Thread.terminate(); // Terminate Worker on error
         });
   });
}

/**
 * 使用 SparkMD5 计算 Blob 分片的 MD5 哈希值
 * @param chunk - 需要计算哈希的二进制数据分片（Blob）
 * @returns Promise<string> 返回 MD5 哈希字符串
 */
export async function computeChunkMD5(chunk: Blob): Promise<string> {
   return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      const spark = new SparkMD5.ArrayBuffer();

      fileReader.onload = (event) => {
         try {
            if (!event.target?.result) {
               throw new Error('FileReader failed to read chunk');
            }

            // 更新 SparkMD5 哈希计算
            spark.append(event.target.result as ArrayBuffer);

            // 获取最终哈希值（16进制字符串）
            const md5 = spark.end();
            resolve(md5);
         } catch (err) {
            reject(err);
         }
      };

      fileReader.onerror = () => {
         reject(new Error('FileReader error'));
      };

      // 以 ArrayBuffer 形式读取数据
      fileReader.readAsArrayBuffer(chunk);
   });
}

//==================================computed worker.js ======================
import SparkMD5 from 'spark-md5';

self.onmessage = function (e) {
   const chunks = e.data.chunks; // 接收所有分片的 ArrayBuffer

   const spark = new SparkMD5.ArrayBuffer();

   try {
      // 累加所有分片的 MD5
      for (let i = 0; i < chunks.length; i++) {
         spark.append(chunks[i]);
      }

      // 完成 MD5 计算
      const finalHash = spark.end();
      self.postMessage({ fileHash: finalHash });
   } catch {
      self.postMessage({ fileHash: null });
      self.close();
   }
};
```

:::

## 响应式对象数据性能问题

问题概述：大量深层响应式对象会触发过多依赖追踪，渲染时会卡顿。

::: tip 解决方案
使用 shallowReactive / shallowRef、markRaw、Object.freeze 或 readonly 来避免不必要的响应式追踪；列表建议使用虚拟列表按需渲染。
:::

## 下拉组件下拉效果不显示及其动画问题

要点：动画类**必须配对**（例如 h 与 h，或 max-h 与 max-h），不能以 `h-auto` 作为过渡目标。常用解决：

- 使用 JS 动态计算高度并设置内联 transition（注意触发重排）
- 或使用 CSS transform scaleY（origin-top）实现无回流的平滑动画

::: code-group-fold line-numbers

```vue [demo.vue]
<script lang="ts" setup>
//[!code highlight]
//插值过渡（要借助js去计算比较麻烦）
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

:::

还有一种方案不使用js使用css中scale实现，对内容进行y轴缩放实现动画效果。  
效率很高不会触发游览器重排，动画更流畅，性能更好。

::: warning 注意
由于 scale 是 transform 的子属性（操作的是 transform 变换），所以动画效果要基于 transform 属性实现，而非直接操作 `width/height` 等布局属性
:::

这里效果是从上到下（默认中间散开）所以需要origin-top`transform-origin: top;`设置动画起点

::: code-group-fold line-numbers

```html [usage.html]
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

:::

## 动态数据渲染CLS问题

在初次渲染数据时，如果采用骨架屏去占位，

> [!WARNING]
> **如果采用简单宽度占位**，此时如果有footer页脚的话，在数据初始化完后渲染时，footer会被大量内容推下去，产生CLS（cumulative layout shift累计布局偏移）的值会迅速升高。

::: tip 解决方案
动态预估实际内容数量、或者预留合适空间避免布局偏移。如果是在第一个数据已经知道的情况下，预估第一个数据的布局所占用的长和宽，然后根据总数据的length去动态设置骨架屏的占位
:::

**还有一种方法就是虚拟滚动**，以vueuse中useVirtualList为例，也差不多，但是要限制容器高度触发滚动。

## 二次组件封装

注意封装完后，需要将事件通过ref去暴露。
::: code-group-fold line-numbers

```vue [demo.vue]
<script setup lang="ts">
import { Button } from 'ant-design-vue';
import { getCurrentInstance, h, type ComponentPublicInstance } from 'vue';
import type { ButtonProps } from 'ant-design-vue';

/**
 * 组件的二次封装
 * 1、属性
 * 2、事件
 * 3、方法
 * 4、插槽
 * 5、类型
 */

type ButtonInstance = ComponentPublicInstance<ButtonProps>;
const vm = getCurrentInstance();

//将事件方法暴露给父组件，供其ref（父组件）调用
function changeRef(expose: Element | ButtonInstance | null) {
   if (vm) {
      vm.exposed = expose;
   }
}

//ts 提示
defineExpose({} as ButtonInstance);
</script>
<template>
   <!-- 注意这里不能用div或者容器包裹，否则事件会冒泡会被重复执行 -->
   <component :is="h(Button, { ...$attrs, ref: changeRef }, $slots)"> </component>
</template>
```

:::

## Axios封装

### 参数序列化

| 格式名   | 示例 URL 查询参数                                   | 预期解析结果:smiley:       |
| -------- | --------------------------------------------------- | -------------------------- |
| indices  | `http://localhost:3000/?ids[0]=1&ids[1]=2&ids[2]=3` | `{ ids: ["1", "2", "3"] }` |
| brackets | `http://localhost:3000/?ids[]=1&ids[]=2&ids[]=3`    | `{ ids: ["1", "2", "3"] }` |
| comma    | `http://localhost:3000/?ids=1,2,3`                  | `{ ids: "1,2,3" }`         |
| repeat   | `http://localhost:3000/?ids=1&ids=2&ids=3`          | `{ ids: ["1", "2", "3"] }` |

**框架参数序列化支持**

|         框架/格式         |      brackets      |      indices       |       comma        |       repeat       |
| :-----------------------: | :----------------: | :----------------: | :----------------: | :----------------: |
| NestJS（Express+fastify） |        :x:         |        :x:         | :white_check_mark: | :white_check_mark: |
|       Node Express        | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
|          Fastify          |        :x:         |        :x:         | :white_check_mark: | :white_check_mark: |

### 实现

::: code-group-fold line-numbers

```ts [request-client.ts]
import type { AxiosInstance, AxiosResponse } from 'axios';
import { InterceptorManager } from './modules/interceptor';
import type { RequestClientConfig, RequestClientOptions, RequestContentType } from './types';
import { bindMethods, merge } from './utils';
import qs from 'qs';
import axios from 'axios';
import { FileDownloader } from './modules/downloader';
import { FileUploader } from './modules/uploader';

//参数序列化
function getParamsSerializer(paramsSerializer: RequestClientOptions['paramsSerializer']) {
   if (typeof paramsSerializer === 'string') {
      switch (paramsSerializer) {
         case 'brackets': {
            return (params: any) => qs.stringify(params, { arrayFormat: 'brackets' });
         }
         case 'comma': {
            return (params: any) => qs.stringify(params, { arrayFormat: 'comma' });
         }
         case 'indices': {
            return (params: any) => qs.stringify(params, { arrayFormat: 'indices' });
         }
         case 'repeat': {
            return (params: any) => qs.stringify(params, { arrayFormat: 'repeat' });
         }
      }
   }
   return paramsSerializer;
}
//请求客户端类
class RequestClient {
   public addRequestInterceptor: InterceptorManager['addRequestInterceptor'];
   public addResponseInterceptor: InterceptorManager['addResponseInterceptor'];

   public readonly instance: AxiosInstance;

   public download: FileDownloader['download'];
   public upload: FileUploader['upload'];

   /**
    * 构造函数，用于创建Axios实例
    * @param options - Axios请求配置，可选
    */
   constructor(options: RequestClientOptions = {}) {
      const defaultConfig: RequestClientOptions = {
         headers: {
            'Content-Type': 'application/json;charset=utf-8' as const satisfies RequestContentType
         },
         responseReturn: 'raw',
         //默认超时时间10s
         timeout: 10_000
      };
      const { ...axiosConfig } = options;
      const requestConfig = merge(axiosConfig, defaultConfig);

      // 仅在存在 paramsSerializer 时进行规范化，避免将 undefined 赋值导致类型错误
      // 没有就是用axios默认
      const normalizedParamsSerializer = getParamsSerializer(requestConfig.paramsSerializer);
      if (normalizedParamsSerializer !== undefined) {
         requestConfig.paramsSerializer = normalizedParamsSerializer;
      }
      this.instance = axios.create(requestConfig);

      bindMethods(this);

      //实例化拦截器管理器
      const interceptorManager = new InterceptorManager(this.instance);
      this.addRequestInterceptor =
         interceptorManager.addRequestInterceptor.bind(interceptorManager);
      this.addResponseInterceptor =
         interceptorManager.addResponseInterceptor.bind(interceptorManager);

      // 实例化文件上传和下载器
      const fileUploader = new FileUploader(this);
      this.upload = fileUploader.upload.bind(fileUploader);
      const fileDownloader = new FileDownloader(this);
      this.download = fileDownloader.download.bind(fileDownloader);
   }

   /**
    * DELETE 请求
    */
   public delete<T = any>(url: string, config?: RequestClientConfig): Promise<T> {
      return this.request<T>(url, { ...config, method: 'DELETE' });
   }

   /**
    * GET请求
    */
   public get<T = any>(url: string, config?: RequestClientConfig): Promise<T> {
      return this.request<T>(url, { ...config, method: 'GET' });
   }

   /**
    * POST请求
    */
   public post<T = any>(url: string, data?: any, config?: RequestClientConfig): Promise<T> {
      return this.request<T>(url, { ...config, data, method: 'POST' });
   }
   /**
    * PUT请求方法
    */
   public put<T = any>(url: string, data?: any, config?: RequestClientConfig): Promise<T> {
      return this.request<T>(url, { ...config, data, method: 'PUT' });
   }
   /**
    * request请求
    */
   public async request<T = any>(url: string, config: RequestClientConfig): Promise<T> {
      try {
         /**
          * ...(config.paramsSerializer ? { paramsSerializer: getParamsSerializer(config.paramsSerializer) } : {})
          * 如果在某次请求的config提供了paramsSerializer会覆盖全局设置;
          * 没有提供就默认采用RequestClient实例化的config，没有提供就是axios默认
          */
         const response: AxiosResponse<T> = await this.instance.request({
            url,
            ...config,
            ...(config.paramsSerializer
               ? { paramsSerializer: getParamsSerializer(config.paramsSerializer) }
               : {})
         } as any);
         return response as T;
      } catch (error: any) {
         throw error.response ? error.response.data : error;
      }
   }

   /**
    * 获取基础URL
    */
   public getBaseUrl() {
      return this.instance.defaults.baseURL;
   }
}

export { RequestClient };
```

```ts [interceptor.ts]
import type { AxiosInstance, AxiosResponse } from 'axios';
import type { RequestInterceptorConfig, ResponseInterceptorConfig } from '../types';

//==================== 默认拦截器配置====================
//解决只定义一个导致的问题
const defaultRequestInterceptorConfig: RequestInterceptorConfig = {
   fulfilled: (config) => config,
   rejected: (error) => Promise.reject(error)
};
const defaultResponseInterceptorConfig: ResponseInterceptorConfig = {
   fulfilled: (response: AxiosResponse) => response,
   rejected: (error) => Promise.reject(error)
};

//==================== 拦截器管理类====================
class InterceptorManager {
   private axiosInstance: AxiosInstance;

   constructor(instance: AxiosInstance) {
      this.axiosInstance = instance;
   }

   addRequestInterceptor({
      fulfilled,
      rejected
   }: RequestInterceptorConfig = defaultRequestInterceptorConfig) {
      this.axiosInstance.interceptors.request.use(fulfilled, rejected);
   }

   addResponseInterceptor<T = any>({
      fulfilled,
      rejected
   }: ResponseInterceptorConfig<T> = defaultResponseInterceptorConfig) {
      this.axiosInstance.interceptors.response.use(fulfilled, rejected);
   }
}

export { InterceptorManager };
```

```ts [preset-interceptor.ts]
import { isFunction } from './utils';
import type { ResponseInterceptorConfig } from './types';

//默认响应拦截器
export const defaultResponseInterceptor = ({
   codeField = 'code',
   dataField = 'data',
   successCode = 0
}: {
   /**代表访问结果的字段名，默认为code */
   //!注意，这个要和后端返回的字段名一致
   codeField: string;
   /**响应数据中实际装载数据的字段名默认为data,或者提供自定义解析函数返回解析数据，函数接受response.data */
   //!注意，这个要和后端返回的数据字段名一致
   dataField: string | ((data: any) => any);
   /**
    * @description 找字段
    * 当codeField和successCode相同，代表接口访问成功 如果提供了一个函数返回true代表接口访问成功。
    * successCode: 'success' or 0 or (code) => code === 'success'
    */
   //!注意，这个的值要和codeField对应的后端返回值一致，或者提供一个函数来判断
   successCode: ((code: any) => boolean) | number | string;
}): ResponseInterceptorConfig => {
   return {
      fulfilled: (response) => {
         const { config, data: responseData, status } = response;

         if (config.responseReturn === 'raw') {
            return response;
         }

         //这个·responseData[codeField]·表示从data中取对应字段的值
         if (status >= 200 && status < 400) {
            if (config.responseReturn === 'body') {
               return responseData;
            } else if (
               isFunction(successCode)
                  ? successCode(responseData[codeField])
                  : responseData[codeField] === successCode
            ) {
               return isFunction(dataField) ? dataField(responseData) : responseData[dataField];
            }
         }
         throw Object.assign({}, response, { response });
      }
   };
};
```

```ts [downloader.ts]
import type { RequestClientConfig } from '../types';
import type { RequestClient } from '../request-client';

type DownloadRequestConfig = {
   /**
    * 定义期望获得的数据类型。
    * raw: 原始的AxiosResponse，包括headers、status等。
    * body: 只返回响应数据的BODY部分(Blob)
    */
   responseReturn?: 'raw' | 'body';
} & Omit<RequestClientConfig, 'responseType'>;

class FileDownloader {
   private client: RequestClient;
   constructor(client: RequestClient) {
      this.client = client;
   }

   /**
    * 下载文件
    * @param url - 文件下载的URL地址
    * @param config - 配置信息，可选
    * @return 如果config.responseReturn为'body'，则返回Blob(默认)，否则返回RequestResponse<Blob>
    */
   public async download<T = Blob>(url: string, config?: DownloadRequestConfig): Promise<T> {
      const finalConfig: RequestClientConfig = {
         ...config,
         responseType: 'blob'
      };

      return await this.client.get<T>(url, finalConfig);
   }
}
export { FileDownloader };
```

```ts [uploader.ts]
import { isUndefined } from '../utils';
import type { RequestClient } from '../request-client';
import type { RequestClientConfig, RequestContentType } from '../types';

class FileUploader {
   private client: RequestClient;
   constructor(client: RequestClient) {
      this.client = client;
   }

   async upload<T = any>(
      url: string,
      data: Record<string, any> & { file: File | Blob },
      config?: RequestClientConfig
   ): Promise<T> {
      const formData = new FormData();

      /**
     * @rawdata 
      const data = {
         name: 'John',
         age: 30,
         hobbies: ['reading', 'gaming'],
         file: new Blob(['file content'], { type: 'text/plain' }),
      };
      @transformdata
      name: John
      age: 30
      hobbies[0]: reading
      hobbies[1]: gaming
      file: [object Blob]
     */
      Object.entries(data).forEach(([key, value]) => {
         if (Array.isArray(value)) {
            value.forEach((item, index) => {
               !isUndefined(item) && formData.append(`${key}[${index}]`, item);
            });
         } else {
            !isUndefined(value) && formData.append(key, value);
         }
      });

      const finalConfig: RequestClientConfig = {
         ...config,
         headers: {
            'Content-Type':
               'multipart/form-data;charset=utf-8' as const satisfies RequestContentType,
            ...config?.headers
         }
      };

      return this.client.post<T>(url, formData, finalConfig);
   }
}

export { FileUploader };
```

```ts [type.ts]
/**
 * @param CreateAxiosDefaults 使用axios.create时传入的配置类型
 * @param InternalAxiosRequestConfig 相比配置多了一个headers属性
 *
 */
import type {
   AxiosRequestConfig,
   AxiosResponse,
   CreateAxiosDefaults,
   InternalAxiosRequestConfig
} from 'axios';

type ExtendOptions<T = any> = {
   /**
    * 主要就是解决param在各个框架中不一致的问题，导致识别不到参数
    * 参数序列化方式。预置的有
    * - brackets: ids[]=1&ids[]=2&ids[]=3
    * - comma: ids=1,2,3
    * - indices: ids[0]=1&ids[1]=2&ids[2]=3
    * - repeat: ids=1&ids=2&ids=3
    *
    * 最后一个AxiosRequestConfig<D>["paramsSerializer"];允许自定义参数序列化逻辑
    * 特别是当预置的几种方式不符合需求的时候
    */
   paramsSerializer?:
      | 'brackets'
      | 'comma'
      | 'indices'
      | 'repeat'
      | AxiosRequestConfig<T>['paramsSerializer'];

   /**
    * 响应数据的返回方式。
    * - raw: 原始的AxiosResponse，包括headers、status等，不做是否成功请求的检查。
    * - body: 返回响应数据的BODY部分（只会根据status检查请求是否成功，忽略对code的判断，这种情况下应由调用方检查请求是否成功）。
    * - data: 解构响应的BODY数据，只返回其中的data节点数据（会检查status和code是否为成功状态）。
    */
   responseReturn?: 'body' | 'data' | 'raw';
};

type RequestClientConfig<T = any> = AxiosRequestConfig<T> & ExtendOptions<T>;

type RequestResponse<T = any> = AxiosResponse<T> & {
   config: RequestClientConfig<T>;
};

type RequestContentType =
   | 'application/json;charset=utf-8'
   | 'application/octet-stream;charset=utf-8'
   | 'application/x-www-form-urlencoded;charset=utf-8'
   | 'multipart/form-data;charset=utf-8';

//请求options
type RequestClientOptions = CreateAxiosDefaults & ExtendOptions;

interface RequestInterceptorConfig {
   fulfilled: (
      config: InternalAxiosRequestConfig & ExtendOptions
   ) =>
      | (InternalAxiosRequestConfig<any> & ExtendOptions)
      | Promise<InternalAxiosRequestConfig<any> & ExtendOptions>;

   rejected?: (error: any) => any;
}

interface ResponseInterceptorConfig<T = any> {
   fulfilled: (response: RequestResponse<T>) => RequestResponse | Promise<RequestResponse>;
   rejected?: (error: any) => any;
}

export type {
   RequestClientConfig,
   RequestClientOptions,
   RequestContentType,
   RequestInterceptorConfig,
   RequestResponse,
   ResponseInterceptorConfig
};
```

```ts [utils.ts]
/* eslint-disable @typescript-eslint/no-explicit-any */
import { defu as merge } from 'defu';

/**
 * bindMethods(this) 会遍历当前实例的原型方法，把每个“普通函数方法”都用 Function.prototype.bind 绑定到该实例上，确保方法里的 this 永远指向这个实例。
 * 仅绑定“普通方法”，不会动构造函数、getter/setter、非函数属性。
 * 其实现大致逻辑是：拿到原型 → 枚举属性 → 如果是函数且不是 constructor 、不是 getter/setter → method = method.bind(instance) 。
 *
 * 主要就是支持 const {method1} = instance; method1()不会出现this指向错误的问题。
 */
export function bindMethods<T extends object>(instance: T): void {
   const prototype = Object.getPrototypeOf(instance);
   const propertyNames = Object.getOwnPropertyNames(prototype);

   propertyNames.forEach((propertyName) => {
      const descriptor = Object.getOwnPropertyDescriptor(prototype, propertyName);
      const propertyValue = instance[propertyName as keyof T];

      if (
         typeof propertyValue === 'function' &&
         propertyName !== 'constructor' &&
         descriptor &&
         !descriptor.get &&
         !descriptor.set
      ) {
         instance[propertyName as keyof T] = propertyValue.bind(instance);
      }
   });
}
export { merge };

/**
 * 判断传入值是否为基础字符串类型（推荐日常使用）
 * @param value 待判断的值
 * @returns 布尔值：是 string 字面量返回 true，否则返回 false
 */
export function isString(value: unknown): value is string {
   return typeof value === 'string';
}

//判断是否是函数
export function isFunction(value: unknown): value is Function {
   return typeof value === 'function';
}

//判断是否是undefined
export function isUndefined(value: unknown): value is undefined {
   return typeof value === 'undefined';
}

//判断是否为boolean
export function isBoolean(value: unknown): value is boolean {
   return typeof value === 'boolean';
}
```

<!-- prettier-ignore-start -->
```md [project-project.md]
# 文件目录结构
📂 request-client/
  📂 src/
    📂 modules/                  
      📄downloader.ts           下载
      📄uploader.ts             上传
      📄interceptor.ts          拦截器
   📄preset-interceptor.ts      预置拦截器，用于配置响应拦截器
   📄request-client.ts          请求客户端
   📄types.ts                   类型
   📄index.ts                   统一出口
   📄utils.ts                   工具
```
<!-- prettier-ignore-end -->

:::

### 使用

**参数序列化**

::: code-group-fold line-numbers

```ts [demo.ts]
const client = new RequestClient({
   baseURL: '/api',
   responseReturn: 'body',
   //brackets,comma,indices,repeat
   //都不符合时自定义函数实现，来模拟参数序列化
   /**
    * @example                     
    *                              [!code ++]
    * paramsSerializer: 'brackets' [!code ++]
    * paramsSerializer: 'comma'    [!code ++]
    * paramsSerializer: 'repeat'   
    * or function [!code ++]
    * paramsSerializer: (params) => { 
    *   // 这里以简单的 key=value&key2=value2 形式序列化
    *   return Object.entries(params)
         .map(([key, value]) => {
            if (Array.isArray(value)) {
               return value.map(v => `${encodeURIComponent(key)}=${encodeURIComponent(v)}`).join('&');
            }
            return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
         })
         .join('&');   
    * }
    */
   paramsSerializer: 'indices' //[!code ++]
});
client.addResponseInterceptor(
   defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: 0
   })
);
client
   .get('/', {
      params: {
         a: [1, 2, 3]
      }
   })
   .then((res) => {
      console.log('GET / response:', res);
   });
```

:::

**请求响应**

::: code-group-fold line-numbers

```ts{24} [test.ts]
const client = new RequestClient({
   baseURL: '/api',
   responseReturn: 'raw', //你可以在这设置`body`和`data` [!code ++]
   paramsSerializer: 'indices'
});
//预置的响应拦截器
client.addResponseInterceptor(
   defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data1',
      successCode: 200
   })
);

//实际调用，可以添加responseReturn来覆盖全局配置 [!code ++]
client.get('/', {responseReturn: 'data',//或者一些axios配置选项})
   .then(res => {
      console.log(res); // 现在会输出: "Hello World!"
   });

//返回类型约束
client.post<string>('/test-post',{responseReturn: 'data'})
   .then(res => {
      console.log(res); //res被ts推断string
   });

```

```ts [file-upload.ts]
//文件上传
client
   .upload('/upload', {
      file: file,
      name: encodeURIComponent(file.name) //解决中文乱码问题，后端接受要解码[!code warning]
   })
   .then((res) => {
      console.log('File uploaded successfully:', res);
   })
   .catch((err) => {
      console.error('File upload failed:', err);
   });
```

```ts [file-download.ts]
//获取的是文件blob
const fileBlob1 = await client.download(`/download/test.txt`);

//当然也可以配置第二个参数
const fileBlob2Body = await client.download(`/download/test.txt`, {
   responseReturn: 'body'
});
```

:::

::: tip 后端返回以下数据类型

```json
{
   "code": 200,
   "data1": "Hello World!",
   "message": "success"
}
```

:::

## 性能优化

### 重绘与回流优化

|                 观点                 |                                                                                                       描述                                                                                                       |
| :----------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|     回流影响布局，性能**损耗大**     |                                                                        回流是“布局重计算”，会触发DOM树重新排版，是性能开销最大的渲染操作                                                                         |
|    重绘影响外观，性能**损耗不大**    |                                                                                      重绘核心是“非几何属性变化”，例如颜色等                                                                                      |
| 响应式数据变化都可能会影响回流和重绘 | ① 数据变化但未关联 DOM 更新（比如纯逻辑数据）→ **无回流 / 重绘**；<br> ② 数据变化关联 DOM，但仅修改非几何属性（如color）→ **只重绘，无回流；**<br>③ 数据变化关联 DOM，且修改几何属性（如width）→ **回流 + 重绘** |

> [!IMPORTANT] 优化减少重绘和回流
>
> - 批量修改dom，`减少`回流
> - 先脱离文档流，然后修改dom，最后在一次性更新dom，使得回流`降低`2次
> - 使用游览器内部提供批量操作dom api DocumentFragment，一次性操作dom，`减少`回流
> - 使用requestAnimationFrame跟随游览器频率，`不掉帧`

### FP/FCP/LCP/CLS优化

::: info FP

`First Paint`首次绘制，游览器首次将像素点渲染到屏幕上的时间点。

**优化目标方向**:

- 网络请求耗时（HTML文件下载、解析）
- 减少阻塞渲染进程执行JS

**FCP**

`First Contentful Paint` 首次绘制文本、图片、canvas等有意义内容的时间

**优化目标方向**：

- 压缩css体积
- 移除未使用css

**LCP**

`Largest Contentful Paint` 视口最大可见元素的绘制时间

**优化目标方向**：

- 图片懒加载、压缩
- 减少JS执行时间（主要就是JS阻塞了主渲染进程）
- 缩短核心环节【渲染树构建->布局->绘制】耗时，让最大元素更快出现在屏幕上

**CLS**

`Cumulative Layout Shift` 累积布局偏移，页面加载期间元素位移的总和。

**优化目标方向**：

- 为图片设置宽和高
- 预留空间
- 避免动态修改元素位置/尺寸
- 合理设置视口（`ViewPort`）,解决移动端一致性
- 减少运行时样式修改，避免JS的意外重排
  :::

### Vite优化

**vite8**之前，`pnpm run dev`时候，vite主要采用`esbuild`将`ts->js`并配置`.vite`缓存，使得HMR开发热更新能够实时反馈。正式生产时采用`rollup`进行生产构建，将所有源代码和依赖打包成优化的生产文件。

因此这里优化方向主要就是**开发esbuild构建优化**和**生产rollup构建优化**

::: code-group-fold line-numbers

```ts [vite.config.ts]
// =======================  rollup 构建分包优化 - 依赖预构建===================
// vite.config.js
export default defineConfig({
   build: {
      rollupOptions: {
         output: {
            // 拆分包：将第三方依赖和业务代码分离
            manualChunks: {
               vue-vendor: ['vue', 'vue-router'], // vue提供商
               axios-http:['axios'], //网络请求
               antd-vue:['ant-design-vue']
               //other .....
            }
         }
      }
   },
   //TODO: 依赖预构建优化
   //主要就是缓存一些常见的，和一些不需要的
   optimizeDeps:{
     include: ['vue', 'vue-router', 'pinia'],//预构建依赖
     exclude: [],//排除预构建依赖
  }
});
```

```ts [vite.config.ts]
// =======================  生产构建压缩优化 - CSS优化 ===================
// vite.config.js
export default defineConfig({
   build: {
      //[!code warning] 生产关闭
      sourcemap: false
      //如果要极致压缩，不考虑时间效率的话可以选用terser
      minify: 'terser' //默认使用esbuild进行压缩，来平衡性能和压缩效率
      //配置，可以参考如下：
      // https://terser.org/docs/api-reference/#minify-options
      terserOptions: {
         maxWorkers:4 //cpu工作数
         //[!code warning]
         //!如果想要自定义的terserOptions必须要terser依赖
         //`pnpm add terser -D`
      },

      //TODO: CSS分离与优化
      cssCodeSplit: true, // 启用 CSS 代码拆分
      cssMinify: true, // 启用 CSS 压缩
   }
});
```

:::

::: tip 分包法则
代码不分包虽然可以运行，但是如果是CDN或者静态资源代理JS的时候，修改一行代码会导致一个大的包全部都要编译，而不是按需编译（也就是改动代码的那一个包）。

也就是分包使得部署也能跟开发一样有HMR热更新功能，改动打包完成之后直接替换改动的包，特别是在用户游览器缓存这些包的时候，下次访问只需要下载改动的包即可完成访问。

这样就大幅度降低了服务器资源消耗，和用户网络资源，对网络条件不好的用户非常友好。

因此分包就是**优化缓存策略**，在进行分包的时候，可以针对一些第三方库单独打包，业务代码按照需求和分析打包结果分包。
:::

::: danger 危险

**Vite8**发布之后，开发和生产统一使用了**Rolldown**，来避免开发与生产不一致效应，同时其性能提升大约**15倍**，因此`esbuild`和`rollup`构建优化在未来不会适用。

:::

### 内存优化

`内存优化核心`降低内存的使用，使得垃圾回收器（GC）充分发挥作用。

内存泄漏常见情况：

- 意外全局变量（挂在`windows`下，没有被释放掉）
- 没有清理的定时器或者回调（setInterval、setTimeout），没有被`clear`掉
- 闭包内部维持的局部变量，忘记指向为空，得不到释放（不需要时，还在被引用）
- DOM节点从DOM树中移除了（removeChild），但是还是被引用，GC无法回收该节点和父节点，**DOM数连通的**
- 绑定了事件监听器，在元素被移除或组件销毁时，没有手动移除`removeEventListener`，主要发生在手动给dom元素绑定事件（`addEventListener`）
- `watch/watchEffect`监听外部变量，`vue`中`onUnMounted`不会自动回收该回调，导致内存泄漏（监听组件内部变量不会有该情况）
- 自定义指令`v-[direct name]`中`onUnMounted`内部引用的定时器等没有清理干净

> [!CAUTION] 特别小心
> 当使用`windows`去保留引用的时候，例如状态、组件实例的时候，很容易导致内存泄漏，主要就是全局`windows`对象当每个组件都去使用的时候，导致管理混乱。

### 静态资源优化

**图片优化：**

::: info squoosh图片压缩
在选择图片时，这里采用外部插件进行优化后，在放到项目当中去。这里选用[squoosh](https://squoosh.app/)进行图片可视化压缩，来权衡画质和图片体积。

|           场景            |    推荐选项    | 输出格式  |
| :-----------------------: | :------------: | :-------: |
|          兼容性           |    MozJPEG     |   .jpg    |
|    透明背景 + 较小体积    |     OxiPNG     |   .png    |
|     现代设备 + 小体积     |      WebP      |   .webp   |
| **现代设备 + 极致小体积** |    **AVIF**    | **.avif** |
|      无损压缩 + 临时      | JPEG XL (beta) |   .jxl    |

优先选用`AVIF`其比`WebP`小**20%-50%**,而且压缩效率也比`WebP`快。
:::

由于游览器会在首次请求的时候一次性全部下载和加载所有的图片，哪怕图片在屏幕外，同时等到真正加载的时候会将图片进行解码解码成像素点进行渲染，因此可以从这两个方面入手。

> [!IMPORTANT] 图片性能优化核心
>
> - **图片加载优化**，例如首屏图片不用立即渲染的，可以使用`H5`的`loading lazy`属性，将图片加载延迟到视口内（也即位于可视化页面中，能够被看的见的）
> - **图片解码优化**，例如首屏图片不用立即渲染的，可以使用`H5`的`decoding async`控制，来控制图片的解码，将图片的解码去放到后台中进行（类似`Web Worker`），避免解码堵塞了主渲染进程，造成卡顿

::: tip 图片展示
由于`media`只能用作筛选，不能处理DPR，因此需要这个`size`，如果是只适配手机的话，可以加上`media="(max-width: 640px)"`，去处理手机。

`size`可以针对不同的图片，可以根据不同设备尺寸和分辨率去设置图片源，来展示图片。例如：

<!-- prettier-ignore-start -->
```vue 
<template>
   <!-- (size现代方案)根据视口宽度自动选择图片尺寸 -->
   <!-- Tip:大于600px的匹配第二条规则 -->
   <img
      srcset="
        ../public/small.avif   384w,
        ../public/medium.avif  768w,
        ../public/large.avif  1200w
      "
      sizes="
         (max-width: 600px) 384px,
         (max-width: 1000px) 768px,
         1200px"
      src="../public/medium.avif"
      alt="兜底处理图片"
   />
   <!-- (size+media过滤方案)只在手机端展示（） -->
   <!-- Tip:source必须配合picture使用 -->
   <picture>
      <source
         media="(max-width: 600px)"
         srcset="../public/small.avif 384w"
         sizes="384px"
      />
      <img
         src="../public/small.avif"
         alt="兜底处理图片"
      />
</picture>
</template>
```
<!-- prettier-ignore-end -->

:::

::: warning 注意
使用`srcset`去定义不同分辨率的图片源的时候，必须要`sizes`去告诉游览器图片显示尺寸，否则游览器默认使用视口的全宽作为图片的显示宽度，会导致选错图片（**错选大图**）

同时这个`srcset`必须要指定描述符`w`去告诉游览器这张图片原始的width是多少像素,

例如`  <source srcset="../public/logo@3x.png 3x">`
:::

### 网络资源压缩

`Web`应用中(js、CSS、HTML)数据打包之后，在网络传输上响应体比较大，在网络不佳情况下，打开应用比较卡顿，同时响应体大意味者服务器网络资源消耗大，因此实际中往往会将该资源打包。

常见有`Gzip`和`Brotli`格式，游览器响应体对应`Content-Encoding: gzip/br`。

::: info 预构建与Nginx动态对比

**预构建：**

前端预构建就是，`压缩阶段`工作在前端，前端负责压缩成`gz`和`br`格式，然后Nginx直接使用即可，但是这会耗费很多构建时间，开发不友好，而且dist目录会产生很多`gz`和`br`格式，管理混乱。

**Nginx动态压缩：**

`压缩阶段`工作Nginx负责，效率比前端快，而且对开发特别友好，开发者只负责打包构建即可,dist目录也没有多余的`br`,`gz`格式文件，可以很方便的分析打包构建结果，进行构建优化，剩下工作交给Nginx负责，其有缓存，但是首次请求时会很慢
:::

::: tip Brotli与Gzip
由于`brotli`比`gzip`压缩效率更高，但是耗时会很多，实际运行效率却比`gzip`高。

因此实际过程中，如果需要快速上线就直接选用`gzip`，后续如果发现占用太高上线出现了问题直接换`brotli`
:::
