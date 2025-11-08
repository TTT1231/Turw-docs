---
outline: deep
---

# 常见问题及其解决方案

主要讲解项目中遇到的问题及其解决方案。

## 大文件分片上传

**思路**：获取文件信息，然后进行分片，分片使用form表单上传（前端）  
后端接受分片存储在一个临时目录中（可以按文件id进行临时存储）  
最后存储完毕，对所有分片结果进行合并

### 分片断点终止上传

主要实现用户可以对大文件请求进行终止和根据文件内容hash去判断在服务端有没有分片  
对之前上传的分片继续上传，提高上传速率和容错率。

<details>
<summary class="bg-blue-400 text-white cursor-pointer select-none text-center active:scale-95">
    分片上传
</summary>

```ts
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

</details>

**分片断点上传思路**：

**前端：**
在上传文件时根据文件内容计算整体md5 hash 这里为了优化采用worker和控制分片策略（**主线程负责分片，worker负责计算hash**）【主线程将每个文件分片ArrayBuffer给Worker,worker计算每个分片md5，最后合并所有分片hash结果，汇总成整个文件内容的md5 hash】，在发送前要进行预检实现断点上传，也即检查服务器中文件hash的目录内容  
前端重新上传时会发送整个文件的md5 hash给后端，后端根据这个hash去临时目录中去找分片数，然后返回给前端，前端就可以知道之前上传了多少<span class="text-red-400">
为了前后端统一，和防止上传过程中被修改和丢包，每次上传前应该计算分片hash后端也计算进行比对，保证文件的一致性
</span>

**后端：**
后端主要负责接受分片，并计算分片hash与前端比对，最后进行汇总将数据存储到服务器中，也可以存储到数据库中都可以。前端下载功能直接设置http header启用流失传输，将文件流逐步推送到客户端即可

**注意**

- 前端如果时fetch请求，由于fetch不支持终止，但是可以使用终止器（AbortController），要将**终止器信号signal**传递给fetch，这样当外部调用终止器的abort时候，就可以终止请求，多次调用没有效果，注意垃圾清理
- 前端在worker计算md5的时候，不能接受File(**worker在独立线程中，与主线测不共享内存**)，这里可以传递ArrayBuffer或Blob，也可以通过结构化克隆机制（structuredClone）传入File对象。**前者性能更优、后者代码简洁，大文件用前者**

<details>
<summary class="bg-blue-400 text-white cursor-pointer select-none text-center active:scale-95">
   断点上传实现(前端)
</summary>

```ts
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

</details>

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

<details>
<summary class="bg-blue-400 text-white cursor-pointer select-none text-center active:scale-95">
  插值过渡（要借助js去计算比较麻烦）
</summary>

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

</details>

还有一种方案不使用js使用css中scale实现，对内容进行y轴缩放实现动画效果。  
效率很高不会触发游览器重排，动画更流畅，性能更好。  
注：**由于scale操作的时transform所以动画效果要用transform效果**。  
这里效果是从上到下（默认中间散开）所以需要origin-top`transform-origin: top;`设置动画起点

<details>
<summary class="bg-blue-400 text-white cursor-pointer select-none text-center active:scale-95">
  缩放过渡（平滑过渡，要注意方向）
</summary>

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

</details>

## NUXT中JWT认证问题

header.payload.signature【以base64进行网络传输，遵循RFC标准】
**nuxt插件先于中间件执行**

### 实现逻辑

- 当请求/api的时候，会进入服务端的中间件，这里可以做jwt令牌验证。`【/server/middle/jwt.server.ts】验证完后，可以对server中上下文设置user,然后向外暴露一个/api,以me.get.ts为例，每次调用都会先走服务端中间件，进行验证token，没有通过可以重定位到登录路由。【出错直接进入nitro错误处理即可，通过可以从上下文获取user来判断是否验证通过】`  
  注意应该要游览器携带cookie，存放cookie的原因使得用户无需反复登录，直接可以用token进行认证）(如果考虑refresh_token的情况下也即access_token可以刷新，**依赖jwt的无状态认证**，进行认证和刷新，可以存入cookie进行短期验证。  
span red注：安全考虑可以设置`http:only`,阻止js访问，但是还是能被游览器获取，用户可以在开发者工具查看/span
- 这里可以做client验证，因为要调用`me.get.ts`客户端来判断有没有登录，span blue同时对出错情况，和token过期等情况进行处理/span。
- 登录之后，token存入cookie,以后发送token进行验证，过期在返回error,直接弹窗回到登录即可，过期清空cookie

### 注意问题

**1、为避免死循环问题要将登录api和登录界面设置路由白名单处理**

- /login.post.ts：不设置会导致没有token一直跳转到登录界面的死循环
- 登录界面，解决用户登录情况，设置jwt令牌。  
  **同时需要注意如果并发调用api，考虑验证token复用情况（只有一次请求去刷新token，其他请求等待，刷新token后其他请求直接复用。【考虑请求防抖情况下，可以使用cache进行缓存token，考虑安全性要设置这个token的过期时间】**

**2、并发请求，Token同时刷新逻辑重复导致反复更新验证token问题**

- 界面在onMounted并发请求数据时，重复验证token导致token被覆盖。  
  **并发量不是很大时采用单例promise，只刷新一次Token。很大时可以采用promise pool或者请求去重等。特别注意并发请求到来后，验证期间再次来的请求，此时应该是等待**

### 实现步骤

======注意路由白名单放行=======

- 有accessToken没有过期，放行（refresh失不失效没有关系，这里都会放行）
- 没有任何cookie（未登录情况）
- accessToken过期，进入尝试刷新token阶段
- 【这里就需要解决多并发请求的多次更新替换token问题,这里采用promise单例模式】
- refreshToken没有过期，使用refreshToken刷新accessToken，  
这里刷新token采用单例刷新，下一个请求来时等待promise单例完成，拿结果就返回 。
最后单例清空promise状态，留给下一次并发请求。
**由于这里并发请求的驼峰性，这里设置cache的过期时间几秒钟就可以了（也不会有那么多并发请求需要验证）**

<details>
<summary class="bg-blue-400 text-white cursor-pointer select-none text-center active:scale-95">01.jwt.server.ts（服务端——自动调试模式）</summary>

```ts
// 服务端 JWT 认证中间件——jwt 令牌 token 验证
// 存储用户上下文对象，避免在同一请求反复验证
// 请求结束时 event.context.user 自动销毁

import { JWTExpired, JWTInvalid } from 'jose/errors';
import { HTTPStatus } from '~~/shared/enums/httpEnums';
import { whiteRoute } from '~~/shared/whiteRoute';
import { decodeJwt } from 'jose';
import { logServer } from '../utils/serverLog';

// 当前更新 access_token 的 promise，保证并发时只会有一个请求刷新
let currentAccessTokenUpdatePromise: Promise<string> | null = null;
// 缓存的 access_token
let targetAccessTokenCache: string | null = null;
// 缓存过期时间戳（秒）
let targetAccessTokenExpires: number = 0;
// 缓存有效期（秒）
const CACHE_EXPIRY_TIME = 5;
const getCurrentTime = () => Math.floor(Date.now() / 1000);

export default defineEventHandler(async (event) => {
   const rawUrl = event.node.req.url || '';
   const path = rawUrl.split('?')[0];
   if (whiteRoute.includes(path)) return;

   const isApiRequest = path.startsWith('/api/');
   const { accessToken, refreshToken } = getTokensFromCookie(event);

   // ===== 调试日志开始 =====
   logServer('=== JWT中间件调试信息 ===');
   logServer('请求路径:', path);
   logServer('当前时间:', new Date().toISOString());
   logServer('当前时间戳(秒):', getCurrentTime());
   logServer('Access Token 存在:', !!accessToken);
   logServer('Refresh Token 存在:', !!refreshToken);

   if (accessToken) {
      try {
         const accessDecoded = decodeJwt(accessToken);
         logServer('Access Token 过期时间:', new Date(accessDecoded.exp! * 1000).toISOString());
         logServer('Access Token 剩余秒数:', accessDecoded.exp! - getCurrentTime());
      } catch (e) {
         logServer('Access Token 解码失败:', e);
      }
   }

   if (refreshToken) {
      try {
         const refreshDecoded = decodeJwt(refreshToken);
         logServer('Refresh Token 过期时间:', new Date(refreshDecoded.exp! * 1000).toISOString());
         logServer('Refresh Token 剩余秒数:', refreshDecoded.exp! - getCurrentTime());
      } catch (e) {
         logServer('Refresh Token 解码失败:', e);
      }
   }
   // ===== 调试日志结束 =====

   // 没有任何 token
   if (!accessToken && !refreshToken) {
      logServer('🚫 没有任何token，准备跳转登录');
      if (isApiRequest) {
         throw createError({
            statusCode: HTTPStatus.UNAUTHORIZED,
            statusMessage: 'UNAUTHORIZED',
            message: '未登录或 token 缺失'
         });
      } else {
         return sendRedirect(event, '/');
      }
   }

   // 1. 尝试验证 access_token
   if (accessToken) {
      try {
         logServer('🔍 验证 Access Token...');
         const payload = await verifyAccessToken(accessToken);
         logServer('✅ Access Token 验证成功，用户:', payload.userAccount);
         event.context.user = payload;
         return;
      } catch (err: any) {
         logServer('❌ Access Token 验证失败，尝试使用 Refresh Token:', err.message);
      }
   }

   // 2. 使用 refresh_token 刷新
   if (refreshToken) {
      logServer('🔄 开始 Refresh Token 流程...');

      // 并发等待
      if (currentAccessTokenUpdatePromise) {
         logServer('⏳ 等待其他请求完成刷新...');
         try {
            await currentAccessTokenUpdatePromise;
            if (event.context.user) {
               logServer('✅ 从其他请求获得用户信息');
               return;
            }
         } catch (error) {
            logServer('❌ 等待其他请求刷新失败');
         }
      }

      // 缓存有效，直接用
      if (targetAccessTokenCache && targetAccessTokenExpires > getCurrentTime()) {
         logServer('📦 使用缓存的 Access Token');
         event.context.user = decodeJwt(targetAccessTokenCache);
         return;
      }

      // 开始刷新
      logServer('🚀 开始刷新 Access Token...');
      currentAccessTokenUpdatePromise = new Promise(async (resolve, reject) => {
         try {
            logServer('🔍 验证 Refresh Token...');
            const refreshPayload = await verifyRefreshToken(refreshToken);
            logServer('✅ Refresh Token 验证成功，用户:', refreshPayload.userAccount);

            logServer('🔨 生成新的 Access Token...');
            const newAccessToken = await signAccessToken({
               id: refreshPayload.id,
               userAccount: refreshPayload.userAccount,
               userPhone: refreshPayload.userPhone,
               userAuth: refreshPayload.userAuth
            });

            logServer('🍪 设置新的 Cookie...');
            setTokensFromCookie(event, newAccessToken, refreshToken);
            event.context.user = refreshPayload;

            // 更新缓存
            targetAccessTokenCache = newAccessToken;
            targetAccessTokenExpires = getCurrentTime() + CACHE_EXPIRY_TIME;
            logServer('✅ Access Token 刷新成功!');

            resolve(newAccessToken);
         } catch (e) {
            logServer('❌ Refresh Token 验证失败:', e);
            cleanAllTokensFromCookie(event);

            if (isApiRequest) {
               if (e instanceof JWTExpired) {
                  logServer('⏰ Refresh Token 已过期');
                  reject(
                     createError({
                        statusCode: HTTPStatus.UNAUTHORIZED,
                        statusMessage: 'UNAUTHORIZED',
                        message: 'token 已过期，请重新登录'
                     })
                  );
               } else if (e instanceof JWTInvalid) {
                  logServer('🚫 Refresh Token 无效');
                  reject(
                     createError({
                        statusCode: HTTPStatus.UNAUTHORIZED,
                        statusMessage: 'UNAUTHORIZED',
                        message: '无效的 token，请重新登录'
                     })
                  );
               } else {
                  logServer('❓ 未知认证错误:', e);
                  reject(
                     createError({
                        statusCode: HTTPStatus.UNAUTHORIZED,
                        statusMessage: 'UNAUTHORIZED',
                        message: '认证失败，未知错误，请稍后再试'
                     })
                  );
               }
            } else {
               logServer('🏠 非API请求，重定向到登录页');
               reject(new Error('需要重定向到登录页'));
            }
         } finally {
            logServer('🔄 清理 Promise 状态');
            currentAccessTokenUpdatePromise = null;
         }
      });

      try {
         await currentAccessTokenUpdatePromise;
         if (event.context.user) {
            logServer('✅ 刷新成功，用户已设置');
            return;
         }
      } catch (error) {
         logServer('❌ 刷新失败:', error);
         if (!isApiRequest) {
            return sendRedirect(event, '/');
         }
         throw error;
      }
   }

   // 3. 最终失败
   logServer('🚫 最终认证失败，清理所有 token');
   cleanAllTokensFromCookie(event);
   if (isApiRequest) {
      logServer('❌ API请求认证失败');
      throw createError({
         statusCode: HTTPStatus.UNAUTHORIZED,
         statusMessage: 'UNAUTHORIZED',
         message: '未授权，认证失败'
      });
   } else {
      logServer('🏠 页面请求认证失败，重定向到登录页');
      return sendRedirect(event, '/');
   }
});
```

</details>

**并发请求时，这里需要做防抖，缓存处理。【缓存时间不能太长2~5秒即可】**

<details>
<summary class="bg-blue-400 text-white cursor-pointer select-none text-center active:scale-95">01.auth.client.ts（客户端验证服务端有没有成功）</summary>

```ts
import { whiteRoute } from '~~/shared/whiteRoute';

//01.auth.client.ts
export default defineNuxtRouteMiddleware(async (to, from) => {
   if (whiteRoute.includes(to.path)) {
      return;
   }

   //获取验证后的user,确保走服务端中间件验证token能正常接受cookie
   try {
      const user = await $fetch('/api/user/auth/me', {
         method: 'GET',
         credentials: 'include' //强制游览器带上cookie,解决在登录情况下不带cookie的问题
      });
      if (user) return;
   } catch (error: any) {
      // 401错误会被全局插件自动处理，显示友好的弹框
      // 这里不需要手动处理，但为了确保路由正确，还是添加检查
      if (error?.status === 401 || error?.statusCode === 401) {
         // 认证错误，插件会处理弹框，这里不做跳转
         // 因为插件会自动跳转到登录页
         return;
      }

      // 其他错误直接跳转
      navigateTo('/', { replace: true });
   }
});
```

</details>

fetch-interceptor.ts插件拦截$fetch响应  
**解决token过期401不解决，导致api一直在刷新等待问题，错误没处理，抛出401错误直接弹窗**

<details>
<summary class=" bg-blue-400  text-white cursor-pointer select-none
 text-center active:scale-95">
fetch-interceptor.ts（插件）

</summary>

```ts
import { Modal } from 'ant-design-vue';

//处理401错误的插件，主要功能就是弹窗
//自动监听
export default defineNuxtPlugin(() => {
   // 防止重复弹框的标志
   let isDialogShowing = false;

   const showLoginExpiredDialog = () => {
      // 防止重复弹框
      if (isDialogShowing) {
         return;
      }
      isDialogShowing = true;

      Modal.confirm({
         title: '登录已过期',
         content: '您的登录状态已过期，请重新登录',
         okText: '重新登录',
         cancelText: '取消',
         maskClosable: false,
         keyboard: false,
         centered: true,
         //确认取消都直接回到登录页
         onOk() {
            isDialogShowing = false;
            window.location.href = '/';
         },
         onCancel() {
            isDialogShowing = false;
            window.location.href = '/';
         }
      });
   };

   //响应拦截器
   const originalFetch = $fetch.create({
      onResponseError({ response }) {
         if (response.status === 401) {
            showLoginExpiredDialog();
         }
      }
   });

   $fetch = originalFetch;

   // 监听全局未处理的 Promise 拒绝
   if (import.meta.client) {
      window.addEventListener('unhandledrejection', (event) => {
         const error = event.reason;

         // 检查是否是 401 错误
         if (
            error?.status === 401 ||
            error?.statusCode === 401 ||
            error?.response?.status === 401 ||
            (error?.data && error.data.statusCode === 401)
         ) {
            // 阻止控制台错误显示
            event.preventDefault();
            showLoginExpiredDialog();
         }
      });

      // 监听全局错误事件
      window.addEventListener('error', (event) => {
         const error = event.error;
         if (error?.status === 401 || error?.statusCode === 401) {
            event.preventDefault();
            showLoginExpiredDialog();
         }
      });
   }

   return {
      provide: {
         /**全局方法，处理token过期情况，弹出对话框 */
         handleAuthError: (error: any) => {
            if (
               error?.status === 401 ||
               error?.statusCode === 401 ||
               error?.response?.status === 401
            ) {
               showLoginExpiredDialog();
               return true; // 表示已处理
            }
            return false; // 未处理
         }
      }
   };
});
```

</details>

## 动态数据渲染CLS问题

在初次渲染数据时，如果采用骨架屏去占位，**如果采用简单宽度占位**，此时如果有footer页脚的话，在数据初始化完后渲染时，footer会被大量内容推下去，产生CLS（cumulative layout shift累计布局偏移）的值会迅速升高。

所以**解决方案**是：动态预估实际内容数量、或者预留合适空间避免布局偏移。

如果是在第一个数据已经知道的情况下，预估第一个数据的布局所占用的长和宽，然后根据总数据的length去动态设置骨架屏的占位

**还有一种方法就是虚拟滚动**，以vueuse中useVirtualList为例，也差不多，但是要限制容器高度触发滚动。

## 二次组件封装

注意封装完后，需要将事件通过ref去暴露。

```vue
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

