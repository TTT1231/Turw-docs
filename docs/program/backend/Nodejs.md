---
outline: 2
---

# Nodejs

Node.js 适合处理大量 I/O 请求，也常用于 BFF、服务端渲染、命令行工具和自动化脚本。

## core

### libuv

Node.js 使用 libuv 提供事件循环、异步 I/O 和跨平台能力。JavaScript 回调通常在所属线程的事件循环上执行；文件操作、部分加密和压缩等工作可交给 libuv 线程池。网络 I/O 通常依赖操作系统提供的异步机制。线程池默认有 4 个线程，可按需求配置。

事件循环持续处理就绪的回调。常见阶段包括：

- **timers**：处理到期的 `setTimeout` 和 `setInterval` 回调。
- **pending callbacks**：处理部分推迟到后续循环的系统回调。
- **poll**：获取并处理 I/O 事件，必要时等待新的事件。
- **check**：执行 `setImmediate` 回调。
- **close callbacks**：处理部分关闭事件。

同步代码先在当前调用栈执行。Node.js 在适当时机处理 `process.nextTick` 队列及 Promise、`queueMicrotask` 的微任务队列；不要依赖一个适用于所有上下文的固定输出顺序。`setTimeout` 与 `setImmediate` 的先后也受调用上下文影响。详见 [Node.js 事件循环文档](https://nodejs.org/learn/asynchronous-work/event-loop-timers-and-nexttick)。

## 微任务 & 宏任务

- **微任务**：例如 Promise 回调和 `queueMicrotask`，在当前执行上下文结束后的检查点运行。
- **事件循环阶段中的回调**：例如定时器、I/O 和 `setImmediate` 回调，在各自阶段等待执行。常用的“宏任务”一词描述调度类别，与任务耗时长短无关。

`process.nextTick` 使用 Node.js 自己的队列。连续递归安排微任务或 `nextTick` 会延迟 I/O，因此应避免无界调度。

## 框架选择

下表是不同版本的一组历史性能数据，缺少测试环境和负载细节，不能用于判断当前版本的实际性能。选择框架还应考虑生态、维护成本及项目需求，并在自己的负载下测试。

| **Framework** | **Version** | **Router?** | **Requests/sec** |
| ------------- | ----------- | ----------- | ---------------- |
| Express       | 4.17.3      | ✅          | 14,200           |
| hapi          | 20.2.1      | ✅          | 42,284           |
| Restify       | 8.6.1       | ✅          | 50,363           |
| Koa           | 2.13.0      | ❌          | 54,272           |
| **Fastify**   | **4.0.0**   | ✅          | **77,193**       |
| `http.Server` | 16.14.2     | ❌          | 74,513           |

Express 生态较丰富；Fastify 等框架也可以根据项目需求考虑。

## 中间件

中间件按注册顺序处理请求。Express 中间件调用 `next()` 后交给后续处理；能否在响应阶段继续执行取决于具体实现。

- 应用级中间件：通过 `app.use()` 为应用或指定路径添加通用功能。
- 路由处理：通过 `app.get()`、`app.post()` 等匹配方法和路径。
- 错误处理中间件：使用四个参数 `(err, req, res, next)` 接收错误。
- CORS 中间件：设置浏览器跨域访问所需的响应头。

**错误处理**

路由和中间件之后注册错误处理器；对于已发送响应头的情况，应交给后续错误处理器。错误类型和状态码需结合应用实际定义，不能把普通编程错误一律视为客户端错误。

```ts
import type { ErrorRequestHandler } from 'express';

const handleError: ErrorRequestHandler = (err, req, res, next) => {
    if (res.headersSent) return next(err);
    console.error(err);
    res.status(500).send('服务器内部错误');
};

app.use(handleError);
```

**CORS**

CORS 响应头控制浏览器是否允许网页读取跨源响应。`allowedHeaders` 应包含客户端实际发送且需要预检许可的请求头；`Authorization` 可携带认证信息，`Content-Type` 描述请求体类型。`X-Requested-With` 并非所有请求都需要，也不能作为认证凭据。

```js
const corsOptions = {
    origin: 'http://example-ip:port',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'my-custom-header']
};

app.use(cors(corsOptions));
```

## 热更新

开发时可用 nodemon 监听文件变化并重启服务。模块格式和 TypeScript 配置应与实际运行环境一致。

```sh:no-line-numbers
nodemon --watch "src/**/*.ts" --exec "ts-node src/main.ts"
```

## 静态资源代理

使用 Express 的 `express.static` 可以提供指定目录下的静态文件：

```js:no-line-numbers
app.use(express.static('public'));
```

## 运行类型问题

如果 ts-node 报找不到项目中的全局类型声明，先检查声明文件是否属于 TypeScript 项目。ts-node 默认不会在启动时加载 `files`、`include` 和 `exclude` 中的所有文件；可通过 `files: true` 让它加载项目文件。

`transpileOnly: true` 跳过类型检查，不等于加载了类型声明。需要类型检查时可以关闭该选项，或另行运行 `tsc --noEmit`。`typeRoots` 用于配置类型包目录，显式设置后会覆盖默认搜索位置；普通声明文件可通过 `include` 纳入项目。

例如扩展 Express 的 Request 类型：

::: code-group

```ts [env.d.ts]
declare global {
    namespace Express {
        interface Request {
            //customer field
            user?: {
                id: string;
                //other field
            };
            cookies: {
                accessToken?: string;
                refreshToken?: string;
                [key: string]: any;
            };
        }
    }
}

//模块化
export {};
```

```jsonc [tsconfig.json]
{
    "ts-node": {
        "transpileOnly": false,
        "files": true
    },
    "include": ["src/**/*.ts", "env.d.ts"]
}
```

```jsonc [package.json]
{
    "scripts": {
        //[!code ++]
        "dev": "ts-node src/main.ts"
    }
}
```

:::

ts-node 可在开发中直接运行 TypeScript。CommonJS 与原生 ESM 的运行方式不同，应按项目模块配置和 ts-node 版本选择对应方式。

## 约定式路由

约定式路由根据文件路径生成路由。例如 `api/users/index.get.ts` 对应 `GET /users`，`api/users/[id].get.ts` 对应 `GET /users/:id`。这样新增接口时可以直接创建文件，但也需要明确命名规则和加载方式。

下面是一个简化的 Express 示例：扫描时根据文件名注册默认导出的处理函数，静态路径排在动态路径前。示例仅处理 GET、POST、PUT、PATCH 和 DELETE，不包含热重载、冲突检测和权限校验。

::: code-group-fold line-numbers

```ts [routeScanner.ts]
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { RequestHandler, Router } from 'express';

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';
const methods = new Set<Method>(['get', 'post', 'put', 'patch', 'delete']);

async function findFiles(dir: string): Promise<string[]> {
    const entries = await readdir(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) files.push(...(await findFiles(fullPath)));
        else if (/\.(ts|js)$/.test(entry.name) && !entry.name.endsWith('.d.ts'))
            files.push(fullPath);
    }
    return files;
}

function parseRoute(root: string, file: string): { method: Method; route: string } {
    const parts = path.relative(root, file).split(path.sep);
    const fileName = parts.pop()!.replace(/\.(ts|js)$/, '');
    const match = fileName.match(/^(.+)\.(get|post|put|patch|delete)$/);
    if (!match || !methods.has(match[2] as Method)) {
        throw new Error(`Invalid route file: ${file}`);
    }
    if (match[1] !== 'index') parts.push(match[1]);
    const segments = parts.map((segment) => {
        const param = segment.match(/^\[([a-zA-Z_][a-zA-Z0-9_]*)\]$/);
        if (param) return `:${param[1]}`;
        if (!/^[a-zA-Z0-9_-]+$/.test(segment)) throw new Error(`Invalid segment: ${segment}`);
        return segment;
    });
    return { method: match[2] as Method, route: '/' + segments.join('/') };
}

export async function registerRoutes(router: Router, root: string): Promise<void> {
    const files = await findFiles(root);
    const routes = files.map((file) => ({ file, ...parseRoute(root, file) }));
    routes.sort((a, b) => (a.route.match(/:/g)?.length ?? 0) - (b.route.match(/:/g)?.length ?? 0));

    for (const { file, method, route } of routes) {
        const module = await import(pathToFileURL(file).href);
        if (typeof module.default !== 'function') throw new Error(`Missing handler: ${file}`);
        router[method](route, module.default as RequestHandler);
    }
}
```

```ts [api/users/[id].get.ts]
import type { RequestHandler } from 'express';

const handler: RequestHandler = (req, res) => {
    res.json({ id: req.params.id });
};

export default handler;
```

```ts [main.ts]
import express from 'express';
import path from 'node:path';
import { registerRoutes } from './routeScanner.js';

const app = express();
const router = express.Router();
// 指向实际的 api 目录：开发时是源码目录，部署后是编译输出目录
await registerRoutes(router, path.resolve('dist/api'));
app.use('/api', router);
app.listen(3000);
```

:::

示例使用 ESM，运行 TypeScript 源文件时需要支持 `.ts` 导入的运行器；生产环境应扫描编译后的 `.js` 文件，并确保运行时能访问它们。`dist/api` 只是输出目录示例，需与实际构建配置一致。

**打包**

以下脚本使用 esbuild 将 `server` 中的 TypeScript 文件分别转译到 `dist`，保留目录结构，以便运行时扫描 `dist/api`。项目的 `package.json` 需设置 `"type": "module"`，本地相对导入应与输出文件扩展名一致。

```js [build.mjs]
import { build } from 'esbuild';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

async function findSources(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) files.push(...(await findSources(fullPath)));
        else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) files.push(fullPath);
    }
    return files;
}

await build({
    entryPoints: await findSources('server'),
    outbase: 'server',
    outdir: 'dist',
    platform: 'node',
    format: 'esm',
    sourcemap: true
});
```

该示例只转译源文件，不会自动复制静态资源或安装运行时依赖；按部署环境另行处理，并在构建前执行类型检查。

## 压缩加速

Node.js 的 `node:zlib` 支持 gzip、deflate 等压缩格式。HTTP 响应应根据客户端支持的编码选择格式，并设置对应响应头；实际压缩效果和耗时取决于数据和配置。

大文件可使用流处理，避免一次性读入全部内容。`pipeline` 处理背压并在出错时清理相关流，适合连接文件、压缩流和目标流。

```ts
// 使用流压缩和解压文件
import { createReadStream, createWriteStream } from 'node:fs';
import { createGzip, createDeflate, createGunzip, createInflate } from 'node:zlib';
import { pipeline } from 'node:stream/promises';

//压缩
async function compressFile(inputPath, outputPath, useGzip = true) {
    await pipeline(
        createReadStream(inputPath, { highWaterMark: 16 * 1024 * 1024 }), // 16MB 分块，示例
        useGzip ? createGzip() : createDeflate(),
        createWriteStream(outputPath)
    );
    console.log('压缩完成:', outputPath);
}

//解压
async function decompressFile(inputPath, outputPath, isGzip = true) {
    await pipeline(
        createReadStream(inputPath),
        isGzip ? createGunzip() : createInflate(),
        createWriteStream(outputPath)
    );
    console.log('解压完成:', outputPath);
}
```

**通过 HTTP 返回压缩内容**

示例假设客户端支持 gzip；实际服务应先检查 `Accept-Encoding` 并设置适当的 `Vary` 响应头。

::: code-group-fold line-numbers

```ts [demo-small-file-handle.ts]
import type { Router } from 'express';
import { createDeflate, createGzip } from 'node:zlib';
import { createReadStream } from 'node:fs';
import { pipeline } from 'node:stream/promises'; // 使用 Promise 版本的 pipeline

export const setupDefaultRoute = (router: Router) => {
    router.get('/', async (req, res) => {
        try {
            // 设置响应头
            res.setHeader('Content-Encoding', 'gzip');
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');

            // 创建读取流和 Gzip 转换流
            const readStream = createReadStream('./src/test.txt', { encoding: 'utf-8' });
            const gzipStream = createGzip();
            const deflateStream = createDeflate();
            // pipeline 会将 readStream → gzipStream → res
            await pipeline(
                readStream, // 源：文件读取流
                gzipStream, // 转换：Gzip 压缩,gzip
                res // 目标：HTTP 响应
            );

            //deflate 压缩
            // await pipeline(
            //   readStream,
            //   deflateStream, // 转换：Deflate 压缩
            //   res            // 目标：HTTP 响应
            // )

            console.log('文件已成功压缩并发送');
        } catch {
            // 如果响应头还没发送，可以发送错误状态
            if (!res.headersSent) {
                res.status(500).send('服务器内部错误');
            }
        }
    });
};
```

:::

## ESM & Commonjs

Node.js 同时支持 ESM 和 CommonJS。选择模块格式时，应让 `package.json`、TypeScript 配置和运行方式保持一致。

对于编译为 JavaScript 后直接交给 Node.js 的 ESM 项目，相对导入通常需要写运行时的 `.js` 扩展名，即使源文件是 `.ts`。使用打包器或直接运行 TypeScript 时，解析规则可能不同，应以所用工具的配置为准。

例如，在 `package.json` 中设置 `"type": "module"`，并使用以下 TypeScript 配置：

```jsonc
{
    "compilerOptions": {
        "target": "ES6",
        /* Modules */
        "module": "NodeNext" /* 指定生成的模块代码.Node ESM推荐 */,
        "moduleResolution": "NodeNext" /* 让ts模块解析逻辑完全匹配Nodejs的ESM解析规则*/,
        "rootDir": ".",
        "resolveJsonModule": true /* 启用导入.json文件. */,
        "baseUrl": "./",
        "outDir": "./dist",
        "esModuleInterop": true /** commonjs支持 */,
        "forceConsistentCasingInFileNames": true,
        "strict": true,
        "skipLibCheck": true
    },
    "exclude": ["node_modules", "dist"]
}
```

开发时可用 `tsx` 等工具运行 TypeScript。生产环境可以使用 `tsc` 编译，也可以根据部署需求选择打包器；`tsc` 本身不提供打包和 tree shaking，但可用于类型检查及生成 JavaScript。

## 打包

服务端是否需要打包取决于部署方式、依赖和启动环境。esbuild、tsup、Rollup 等工具提供不同的构建能力；SWC 常用于快速转译。选择时应检查目标模块格式、原生依赖和工具的维护状态。

转译或打包不一定包含 TypeScript 类型检查，可在构建流程中单独执行 `tsc --noEmit`。下面以 esbuild 为例：

::: code-group-fold line-numbers

```bash:no-line-numbers [install.sh]
pnpm i esbuild -D
```

```ts [esbuild.config.mjs]
import { build } from 'esbuild';
import { rmSync, existsSync } from 'fs';
import glob from 'fast-glob';

const outdir = 'dist';

// 先清空 dist 目录
if (existsSync(outdir)) rmSync(outdir, { recursive: true });

// 模块解耦，或者微服务的时候很重要，因为要保证文件的结构
// 使用 glob 匹配所有 .ts,.js 文件，同时排除prisma生成的文件
const entryPoints = await glob([
  'src/**/*.{ts,js}',
  '!src/common/prisma/generated/**/*',
]);

// 打包核心入口
await build({
  //模块解耦
  //entryPoints, // 配置为多个入口，这里配置时就会保持目录结构
                // 如果在微服务或者对模块功能进行解耦时这里是必须要的
  //outbase: 'src', // 保持 src 目录结构
  entryPoints:['/src/main.ts'] //简单api使用单入口打包即可
  outdir,
  bundle: true,

  platform: 'node', // 针对 Node.js 平台，如果是node平台就不能使用esbuild的代码压缩minify(这个是在游览器独有的)
                    //nodejs是运行时，会一次性加载所有目标代码（在需要时）分包会导致性能下降等，除非很在乎启动时间
  target: 'node18', // 目标 Node.js 版本
  format: 'esm',

  //调试
  minify: false,
  sourceMap:true,

  external: [
    // Node.js 内置模块
    'fs', 'path', 'http', 'https', 'url', 'net', 'dns', 'tls',
    'child_process', 'cluster', 'os', 'process', 'querystring',
    'readline', 'repl', 'stream', 'tty', 'util', 'v8', 'vm', 'zlib',
    // 大型外部依赖
    'express', 'mongoose', 'redis', 'mysql2'
  ],
});

```

:::

## 进程 & 脚本

Node.js 的 `child_process` 模块可启动其他进程，用于调用外部程序、运行脚本或隔离任务。例如，通过子进程执行 Python 脚本，或将 CPU 密集计算交给其他进程，避免长时间阻塞当前 JavaScript 线程。

| 方式           | 适用场景                             | 注意事项                                                 |
| -------------- | ------------------------------------ | -------------------------------------------------------- |
| 子进程         | 进程隔离、运行其他语言或程序         | 创建进程有开销，需要控制数量；进程隔离本身不等于安全沙箱 |
| Worker Threads | 在同一进程内并行执行 JavaScript 计算 | 可通信或共享内存，需要处理同步与资源管理                 |
| 消息队列       | 跨进程或跨机器分发任务               | 需要部署和维护相应组件                                   |

**child_process配置速通**

**Base配置**

|    属性    |    默认值     |                     描述                     |
| :--------: | :-----------: | :------------------------------------------: |
|    env     |       -       | 环境变量，可覆盖Nodejs相关的PATH，NODE_ENV等 |
|  timeout   |       0       |                表进程执行限制                |
|    uid     |       -       |             /Unix系统下的用户id              |
|   signal   |       -       |       AbortSignal信号，用于中止子进程        |
|    gid     |       -       |               Unix系统下的组id               |
| killSignal |   'SIGTERM'   |         超时时发送给子进程的终止信号         |
|    cwd     | process.cwd() |              子进程当前工作目录              |

**spawn特点和配置**

异步执行，流式返回输出，默认不用Shell启动。
[spawn官方配置文档](https://nodejs.org/api/child_process.html#child_processspawncommand-args-options)

|           属性           | 默认值 |         类型          |           描述           |
| :----------------------: | :----: | :-------------------: | :----------------------: |
|       windowsHide        | false  |       `boolean`       |        窗口不隐藏        |
| windowsVerbatimArguments | false  |       `boolean`       |   windows参数自动转义    |
|          argv0           |   -    |       `string`        |   显式设置argv[0]的值    |
|      serialization       | 'json' | `'json'\|'advanced' ` |    发送消息序列化类型    |
|          shell           | false  | `'boolean'\|'string'` |  是否在shell中运行命令   |
|         detached         |   -    |       `boolean`       | 分离子进程，使其独立运行 |

**exec/execFile特点和配置**

缓存输出后一次性返回

[exec官方配置文档](https://nodejs.org/api/child_process.html#child_processexeccommand-options-callback)

[execFile官方配置文档](https://nodejs.org/api/child_process.html#child_processexecfilefile-args-options-callback)

|    属性     |    默认值    |           类型           |                     描述                     |
| :---------: | :----------: | :----------------------: | :------------------------------------------: |
| windowsHide |    false     |        `boolean`         |                  窗口不隐藏                  |
|  encoding   |    'utf8'    |         `string`         | 字符编码，设置为 'buffer' 则输出 Buffer 对象 |
|  maxBuffer  | 1024 \* 1024 | `'number'\|'undefined' ` |                  缓冲区大小                  |

`exec` 默认通过 shell 执行命令；`execFile` 默认直接运行可执行文件，因此默认不解析 shell 语法。使用 shell 时不要拼接不可信输入，以免产生命令注入。

**fork特点和配置**

`fork` 启动新的 Node.js 子进程并默认建立 IPC 通道，适合运行 Node.js 模块并与父进程交换消息。

[fork官方配置文档](https://nodejs.org/api/child_process.html#child_processforkmodulepath-args-options)

|           属性           | 默认值 |         类型          |                   描述                    |
| :----------------------: | :----: | :-------------------: | :---------------------------------------: |
| windowsVerbatimArguments | false  |       `boolean`       |            windows参数自动转义            |
|         execArgv         |   -    |      `string[]`       |               命令执行参数                |
|         execPath         |   -    |       `string`        |               命令执行路径                |
|      serialization       | 'json' | `'json'\|'advanced' ` |            发送消息序列化类型             |
|          silent          | false  |       `boolean`       | 默认从父进程继承，如果为true则类似console |
