---
outline: deep
---

# 常见问题及其解决方案

主要讲解项目中遇到的问题及其解决方案。

## 大文件分片上传

快速概览：分片上传一般分三步 — 前端分片并上传、后端临时存储、完成后合并。

<Tip title="提示}">
常见要点：断点续传、分片哈希校验、使用 AbortController 终止请求、把耗时计算交给 Web Worker。
</Tip>

### 分片断点终止上传

主要实现用户可以对大文件请求进行终止和根据文件内容hash去判断在服务端有没有分片  
对之前上传的分片继续上传，提高上传速率和容错率。

::: code-group

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

::: info 注意
为保证一致性，前后端应使用相同的分片/文件哈希算法；大文件优先传 ArrayBuffer 给 Worker
:::

::: details 断点上传实现(前端)

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

:::

## 响应式对象数据性能问题

问题概述：大量深层响应式对象会触发过多依赖追踪，渲染时会卡顿。

<Tip title="解决方案">
使用 shallowReactive / shallowRef、markRaw、Object.freeze 或 readonly 来避免不必要的响应式追踪；列表建议使用虚拟列表按需渲染。
</Tip>

## 下拉组件下拉效果不显示及其动画问题

要点：动画类**必须配对**（例如 h 与 h，或 max-h 与 max-h），不能以 `h-auto` 作为过渡目标。常用解决：

- 使用 JS 动态计算高度并设置内联 transition（注意触发重排）
- 或使用 CSS transform scaleY（origin-top）实现无回流的平滑动画

::: details 插值过渡（要借助js去计算比较麻烦）

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

:::

还有一种方案不使用js使用css中scale实现，对内容进行y轴缩放实现动画效果。  
效率很高不会触发游览器重排，动画更流畅，性能更好。

<Warning title="注意">
由于 scale 是 transform 的子属性（操作的是 transform 变换），所以动画效果要基于 transform 属性实现，而非直接操作 `width/height` 等布局属性
</Warning>

这里效果是从上到下（默认中间散开）所以需要origin-top`transform-origin: top;`设置动画起点

::: code-group

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

## NUXT 中的 JWT 认证（概览）

快速说明：后端中间件负责验证 Access Token，失败时使用 Refresh Token 刷新；为避免并发刷新冲突，应使用单例刷新（promise 单例或短期缓存）。

要点：

- 中间件验证：服务端验证 token 并将 user 放入上下文
- 并发刷新：使用单例 promise 或短期缓存，保证只有一次刷新请求
- 路由白名单：对登录接口/页面放行，避免重定向死循环

### 实现流程

| 环节             | 职责                                  | 关键点                                              |
| ---------------- | ------------------------------------- | --------------------------------------------------- |
| **服务端中间件** | 验证 JWT、刷新 token                  | 进入 `/api/*` 时触发，验证失败用 Refresh Token 刷新 |
| **客户端中间件** | 调用 `/api/user/auth/me` 验证登录状态 | 处理 401 错误、token 过期情况                       |
| **插件拦截**     | 全局拦截 401 响应                     | 弹窗提示并跳转登录页                                |

> [!NOTE]
> **Cookie 存储**：Token 存入 Cookie（`httpOnly` 保护），浏览器自动携带，避免重复登录。注意：`httpOnly` 可防 JS 访问，但开发者工具仍可查看。

### 核心要点

#### 🔄 并发刷新问题

| 问题                   | 解决方案                                     |
| ---------------------- | -------------------------------------------- |
| 多个请求同时刷新 token | 使用单例 Promise，只刷新一次，其他请求等待   |
| 高并发场景             | Promise Pool 或请求去重 + 短期缓存（2-5 秒） |

#### ⚠️ 路由白名单

| 必须放行的路由          | 原因                     |
| ----------------------- | ------------------------ |
| `/login` (登录页面)     | 避免未登录时无限重定向   |
| `/api/login` (登录接口) | 允许用户登录并获取 token |

### 验证流程（简化）

<JwtValProcess/>

**状态判断逻辑**：

1. ✅ AccessToken 未过期 → 直接放行
2. ⏰ AccessToken 过期 + RefreshToken 有效 → 刷新后放行
3. ❌ 无 Token 或 RefreshToken 过期 → 401 错误处理

::: details 01.jwt.server.ts（服务端——自动调试模式）

```ts
// 服务端 JWT 认证中间件——jwt 令牌 token 验证
// 存储用户上下文对象，避免在同一请求反复验证
// 请求结束时 event.context.user 自动销毁
//[!code warning]
//并发请求时，这里需要做防抖，缓存处理。【缓存时间不能太长2~5秒即可】
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

:::

::: details 01.auth.client.ts（客户端验证服务端有没有成功）

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

:::

fetch-interceptor.ts插件拦截$fetch响应  
**解决token过期401不解决，导致api一直在刷新等待问题，错误没处理，抛出401错误直接弹窗**

::: details fetch-interceptor.ts（插件）

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

:::

## 动态数据渲染CLS问题

在初次渲染数据时，如果采用骨架屏去占位，

> [!WARNING]
> **如果采用简单宽度占位**，此时如果有footer页脚的话，在数据初始化完后渲染时，footer会被大量内容推下去，产生CLS（cumulative layout shift累计布局偏移）的值会迅速升高。

<Tip title="解决方案">
动态预估实际内容数量、或者预留合适空间避免布局偏移。如果是在第一个数据已经知道的情况下，预估第一个数据的布局所占用的长和宽，然后根据总数据的length去动态设置骨架屏的占位
</Tip>

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

## DevTools 和 Env提示

[详情见](./Vite.md#vite-dev-tools-和-增强import-meta提示)

## Axios封装

### 参数序列化

| 格式名   | 示例 URL 查询参数                                   | 预期解析结果:smiley:       |
| -------- | --------------------------------------------------- | -------------------------- |
| indices  | `http://localhost:3000/?ids[0]=1&ids[1]=2&ids[2]=3` | `{ ids: ["1", "2", "3"] }` |
| brackets | `http://localhost:3000/?ids[]=1&ids[]=2&ids[]=3`    | `{ ids: ["1", "2", "3"] }` |
| comma    | `http://localhost:3000/?ids=1,2,3`                  | `{ ids: "1,2,3" }`         |
| repeat   | `http://localhost:3000/?ids=1&ids=2&ids=3`          | `{ ids: ["1", "2", "3"] }` |

#### 框架参数序列化支持

|         框架/格式         |      brackets      |      indices       |       comma        |       repeat       |
| :-----------------------: | :----------------: | :----------------: | :----------------: | :----------------: |
| NestJS（Express+fastify） |        :x:         |        :x:         | :white_check_mark: | :white_check_mark: |
|       Node Express        | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
|          Fastify          |        :x:         |        :x:         | :white_check_mark: | :white_check_mark: |

### 实现

::: code-group

```ts [request-client.ts]
import type { AxiosInstance, AxiosResponse } from 'axios';
import { InterceptorManager } from './modules/interceptor';
import type { RequestClientConfig, RequestClientOptions, RequestContentType } from './types';
import { bindMethods } from '../../utils/utils';
import { defu as merge } from 'defu';
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

```ts [intercepeor.ts]
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
import { isFunction } from '../../utils/utils';
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
import { isUndefined } from '../../../utils/utils';
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
```
<!-- prettier-ignore-end -->

:::

### 使用

#### 参数序列化

```ts
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

#### 请求响应

::: code-group

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

<Tip title="后端返回以下数据类型">

```json
{
   "code": 200,
   "data1": "Hello World!",
   "message": "success"
}
```

</Tip>
