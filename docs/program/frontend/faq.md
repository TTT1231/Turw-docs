---
outline: deep
---

# FAQ

## 大文件上传

分片上传将大文件拆成多个请求。服务端暂存并校验分片，全部上传完成后再合并；失败时只需补传缺失分片。

实现时重点关注分片和文件哈希校验、断点续传、取消请求，以及将耗时计算交给 Web Worker。下面先展示顺序上传和合并的基本流程，再给出断点续传的项目示例。基本流程省略了服务端鉴权、参数校验和路径安全处理，不能直接用于生产。

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

        await $fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
    }
    //合并
    await $fetch('/api/merge', {
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

- 前端：分片、使用 Worker 计算哈希，预检已上传分片，并用 `AbortController` 取消请求。
- 后端：接收并校验分片，临时保存；确认分片齐全后合并。

前后端需要约定一致的哈希算法和分片规则。下面的项目示例依赖特定接口和类型；其哈希实现一次读取所有分片，大文件会占用较多内存，实际使用时应改为逐片读取和增量计算。传递 `ArrayBuffer` 时可使用可转移对象减少线程间的数据复制。

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
            const isInDB = await $fetch<
                ApiResponse<'success' | 'uploading' | 'failed' | undefined>
            >('/api/back/arts-management/db-exist', {
                method: 'POST',
                signal: signal,
                body: { fileWholeMd5: md5Hash }
            });

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
            file.progress = (
                (chunkUploadRes.data?.currentChunksIndex! / totalChunks) *
                100
            ).toFixed(2);
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

大量深层响应式数据可能增加依赖追踪和渲染成本。先用性能工具确认瓶颈，再按数据的更新方式处理：

- 只需追踪根引用变化时，使用 `shallowRef` 或 `shallowReactive`；更新嵌套数据后需替换根引用或显式触发更新。
- 不需要响应式转换的对象可用 `markRaw`；不可变数据可考虑 `Object.freeze`。
- 大列表使用虚拟列表，只渲染可视区域附近的项目。

`readonly` 用于禁止通过该代理修改数据，不应视为取消依赖追踪的通用性能优化。

## 下拉组件下拉效果不显示及其动画问题

高度过渡需要可插值的起止值；`height: auto` 在许多场景下不能直接作为过渡目标。常用方案：

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

另一种方案使用 `transform: scaleY()` 缩放内容，避免动画过程中反复修改布局尺寸。它不会改变元素占据的布局空间；需要从顶部展开时，设置 `transform-origin: top`。

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

数据加载前预留的空间过小，加载后的内容会把页脚等元素推走，造成布局偏移（CLS）。可以根据内容数量和预计尺寸设计骨架屏，或为容器预留合适高度。

长列表还可以使用虚拟滚动，例如 VueUse 的 `useVirtualList`；应同时为滚动容器设置合适的高度。

## 二次组件封装

封装组件时，按需透传属性和事件；需要父组件通过模板 ref 调用的方法，则使用 `defineExpose` 显式暴露。

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

| 格式名   | 示例 URL 查询参数                                   | 解析结果示例               |
| -------- | --------------------------------------------------- | -------------------------- |
| indices  | `http://localhost:3000/?ids[0]=1&ids[1]=2&ids[2]=3` | `{ ids: ["1", "2", "3"] }` |
| brackets | `http://localhost:3000/?ids[]=1&ids[]=2&ids[]=3`    | `{ ids: ["1", "2", "3"] }` |
| comma    | `http://localhost:3000/?ids=1,2,3`                  | `{ ids: "1,2,3" }`         |
| repeat   | `http://localhost:3000/?ids=1&ids=2&ids=3`          | `{ ids: ["1", "2", "3"] }` |

服务端能否将这些格式解析为数组，取决于框架及其查询解析器配置。尤其是 `indices`、`brackets` 和 `comma` 的处理方式可能不同；应以前后端实际约定和测试结果为准。

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
                'Content-Type':
                    'application/json;charset=utf-8' as const satisfies RequestContentType
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
                    return isFunction(dataField)
                        ? dataField(responseData)
                        : responseData[dataField];
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

后端返回数据示例：

```json
{
    "code": 200,
    "data1": "Hello World!",
    "message": "success"
}
```

## 性能优化

### 重绘与回流优化

浏览器更新页面时，布局变化可能引发回流（重新计算元素的位置和尺寸）；外观变化可能引发重绘。实际开销取决于受影响的范围和绘制内容，不能简单认为某一种操作总是昂贵或廉价。

- 数据变化没有导致 DOM 更新时，不会因此产生回流或重绘。
- 修改颜色等外观属性可能只需重绘；修改宽高等几何属性通常需要重新布局，并可能触发重绘。
- 批量读取布局、再批量写入样式，避免交替读写导致强制同步布局。可将多个 DOM 更新集中处理。
- 动画优先考虑 `transform` 和 `opacity`，并通过性能工具验证效果。`requestAnimationFrame` 能把更新安排到浏览器的绘制周期，但不能保证不掉帧。

### FP/FCP/LCP/CLS优化

| 指标                            | 含义                                 | 主要优化方向                                                     |
| ------------------------------- | ------------------------------------ | ---------------------------------------------------------------- |
| FP（First Paint）               | 页面首次绘制出像素的时间             | 缩短 HTML 请求时间，减少阻塞渲染的资源                           |
| FCP（First Contentful Paint）   | 首次绘制文本、图片等内容的时间       | 优化关键 CSS，移除未使用样式，减少渲染阻塞                       |
| LCP（Largest Contentful Paint） | 视口内最大内容元素的渲染时间         | 尽早发现和加载首屏关键资源，压缩图片，减少服务端响应和主线程阻塞 |
| CLS（Cumulative Layout Shift）  | 页面生命周期中意外布局偏移的累积指标 | 为图片、广告和动态内容预留空间，避免在已有内容上方突然插入元素   |

对于可能成为 LCP 的首屏图片，不要默认使用懒加载；页面外的图片则可以按需懒加载。

### Vite优化

优化 Vite 时，分别关注开发启动与热更新速度、生产包大小和浏览器缓存。下面的配置以 Vite 8 之前使用 Rollup 的版本为例；升级时应对照当前版本文档检查构建选项。

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
                    'vue-vendor': ['vue', 'vue-router'], // Vue 相关依赖
                    'axios-http': ['axios'], // 网络请求
                    'antd-vue': ['ant-design-vue']
                    //other .....
                }
            }
        }
    },
    //TODO: 依赖预构建优化
    //主要就是缓存一些常见的，和一些不需要的
    optimizeDeps: {
        include: ['vue', 'vue-router', 'pinia'], //预构建依赖
        exclude: [] //排除预构建依赖
    }
});
```

```ts [vite.config.ts]
// =======================  生产构建压缩优化 - CSS优化 ===================
// vite.config.js
export default defineConfig({
    build: {
        //[!code warning] 生产关闭
        sourcemap: false,
        // 根据压缩率和构建速度的权衡选择压缩器
        minify: 'terser',
        //配置，可以参考如下：
        // https://terser.org/docs/api-reference/#minify-options
        terserOptions: {
            maxWorkers: 4 //cpu工作数
            //[!code warning]
            //!如果想要自定义的terserOptions必须要terser依赖
            //`pnpm add terser -D`
        },

        //TODO: CSS分离与优化
        cssCodeSplit: true, // 启用 CSS 代码拆分
        cssMinify: true // 启用 CSS 压缩
    }
});
```

:::

分包可以让更新频率不同的代码分别缓存，减少后续访问需要重新下载的资源；它不等同于开发时的 HMR。分包过细也可能增加请求和管理开销，应结合构建分析结果调整。

Vite 8 使用 Rolldown 统一开发和生产构建。版本升级后应重新核对配置，不能直接假设旧版 Rollup 或 esbuild 的所有选项仍然适用。

### 内存优化

内存优化的重点是释放不再需要的引用，让垃圾回收器能够回收对象。常见排查方向：

- 全局变量、缓存或闭包仍引用不再使用的数据。
- 定时器、订阅或手动注册的事件监听器在组件销毁后仍未清理。
- 已移出文档的 DOM 节点仍被 JavaScript 引用。
- 异步创建的 Vue watcher 未绑定组件生命周期；必要时保存并调用其停止函数。

在组件的卸载钩子或自定义指令的卸载钩子中，清理对应的定时器、监听器和订阅。同步创建于组件 `setup` 中的 watcher 通常由 Vue 自动停止。

### 静态资源优化

图片优化需要同时考虑文件大小、显示尺寸和加载时机。可用 [Squoosh](https://squoosh.app/) 比较画质与体积，选择适合浏览器兼容要求的格式，例如 JPEG、PNG、WebP 或 AVIF；压缩效果取决于图片和编码设置。

- 首屏关键图片尽早加载；视口外的非关键图片可使用 `loading="lazy"`。
- 可使用 `decoding="async"` 提示浏览器异步解码，但实际调度由浏览器决定。
- 使用 `srcset` 提供不同尺寸的图片；搭配宽度描述符 `w` 时，使用 `sizes` 描述图片实际显示宽度。`picture` 的 `media` 可以按媒体条件选择不同图片。

下面的示例按视口选择图片来源：

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

使用 `w` 描述符时，如果省略 `sizes`，浏览器通常按 `100vw` 选择资源，可能下载比实际显示尺寸更大的图片。使用像素密度描述符（如 `3x`）时不需要 `sizes`。

### 网络资源压缩

对 HTML、CSS 和 JavaScript 等文本资源启用 Gzip 或 Brotli，可以减少传输体积。服务器根据客户端支持情况返回相应的 `Content-Encoding`。

| 方式     | 处理时机                 | 取舍                                                 |
| -------- | ------------------------ | ---------------------------------------------------- |
| 预压缩   | 构建或部署时生成压缩文件 | 增加构建时间和存储，但请求时可直接发送               |
| 动态压缩 | 服务器响应请求时压缩     | 部署简单，但会占用运行时 CPU；是否缓存取决于服务配置 |

Brotli 通常能提供更高的压缩率，但具体体积和耗时受内容与压缩级别影响。结合部署环境、CPU 成本和浏览器支持情况选择。
