---
outline: deep
---

# Nodejs

一般用于RESTful API(Express/Fastify)，BBF,特别适合中小型项目。
也即前端全栈，实时应用开发、偏前端方向。相比java其开发速度很快，适合快速迭代开发。

**优点**：高性能IO、启动快、丰富生态、开发速度快  
**缺点**：类型安全差、不适合高CPU

## 框架选择

| **Framework** | **Version** | **Router?** | **Requests/sec** |
| ------------- | ----------- | ----------- | ---------------- |
| Express       | 4.17.3      | ✅          | 14,200           |
| hapi          | 20.2.1      | ✅          | 42,284           |
| Restify       | 8.6.1       | ✅          | 50,363           |
| Koa           | 2.13.0      | ❌          | 54,272           |
| **Fastify**   | **4.0.0**   | ✅          | **77,193**       |
| `http.Server` | 16.14.2     | ❌          | 74,513           |

**express生态丰富，使用简单**

## 中间件

请求 → 中间件1 → 中间件2 → 中间件3 → 路由处理 → 中间件3 → 中间件2 → 中间件1 → 响应  
<span>
<label class=" bg-red-200">注: </label>
<label>需要注意定义顺序</label>
</span>

- 应用级别中间件（app.use），为应用或路由添加通用功能。
- 路由级别中间件（app.get、app.post），匹配方法和路径请求。
- 错误处理中间件（app.use(err,...)）,处理错误
- cors中间件 ,处理不同源请求。

## 中间件应用

### 错误处理

```js
//语法错误处理
const handleSyntaxError=(app:Express)=>{
    app.use((err: any, req: any, res: any, next: NextFunction) => {
        if(err instanceof SyntaxError){
            res.status(400).send('存在语法错误');
        }else{
            next();
        }
    })
}

//类型错误处理
const handleTypeError=(app:Express)=>{
    app.use((err: any, req: any, res: any, next: NextFunction) => {
        if(err instanceof TypeError){
            res.status(400).send('存在类型错误');
        }else{
            next();
        }
    })
}

//引用错误处理
const handleReferenceError=(app:Express)=>{
    app.use((err: any, req: any, res: any, next: NextFunction) => {
        if(err instanceof ReferenceError){
            res.status(400).send('存在引用错误');
        }else{
            next();
        }
    })
}

//网络错误处理
const handleNetworkError=(app:Express)=>{
    app.use((err: any, req: any, res: any, next: NextFunction) => {
        if(err instanceof URIError){
            res.status(400).send('存在网络错误');
        }else{
            next();
        }
    })
}

//数据库错误处理
const handleDatabaseError=(app:Express)=>{
    app.use((err: any, req: any, res: any, next: NextFunction) => {
        if(err instanceof EvalError){
            res.status(400).send('存在数据库错误');
        }else{
            next();
        }
    })
}

//未知错误处理
const handleUnknownError=(app:Express)=>{
    app.use((err: any, req: any, res: any, next: NextFunction) => {
        res.status(500).send('未知错误');
    })
}
```

### CORS

这里如果要让ajax(XMLHttpRequest)或者fetch区别游览发起请求和表单之间访问url
则需要**x-requested-with**用于标识，**Content-Type**和**Authorization**用于认证，
也可以使用自定义允许的请求头**customHeaders**。示例：

```js
const customHeaders = ['my-customer-header'];
//x-requested-with 标识请求XMLHttpRequest或fetch区别游览发起请求和表单提交或者之间访问url
const requiredHeaders = ['x-requested-with', 'Content-Type', 'Authorization'];
const corsOptions = {
   origin: 'http://example-ip:port', //允许访问的源
   optionsSuccessStatus: 200,
   credentials: true,
   method: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
   allowedHeaders: [...customHeaders, ...requiredHeaders]
};

app.use(cors(corsOptions));
```

## 热更新配置

import要设置module为ESNext或commonJS（要配置ts），后端api使用commonJS兼容性好。其他的话ESNext，或者需要使用ES6最新语法。  
开发时可以使用热更新重载，例如**nodemon** ,例如让nodemon监视src下所有文件，一有变动就重启服务（这里加上ts类型安全），重启服务时，然后编译main.ts。

```js
nodemon --watch \"src/**/*.ts\" --exec \"ts-node\"  main.ts
```

## 静态资源代理

静态资源代理直接使用express.static中间件即可，例如将所有public目录暴露出去（当然也可以自定义别的目录。

```js
app.use(express.static('public'));
```

## **Request拓展（.d.ts不加载问题）**

在对原生类型如express中Request进行全局拓展时，如果只定义了

```ts
import type { Request } from 'express';

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

就算在tsconfig配置了**typeRoots**定义声明文件查找文件，此时ts不报错但是运行报错。  
原因就是：执行pnpm dev 启动项目时类型声明文件没有加载导致出错。

此时可以使用在`tsconfig.json`中添加`ts-node`配置

- 解决.d.ts没导入
- 所有.d.ts配置都在一个地方、维护友好
- 官方ts和ts-node推荐做法
- 避免重复导入和保持全局类型的特性

**ts-node是为了让 Node.js 能够直接运行 TypeScript 文件（.ts），而无需先手动编译成 JavaScript。**

<span class=" text-red-400">注意：生产模式还是tsc编译成 JavaScript，再用 node运行【这样保险些】</span>

```ts
  /* ts-node 配置，输入编译选项外 */
  "ts-node": {
    "files": true,                                     /* 启用 TypeScript 的 files 选项，确保类型文件被正确加载 */
    "transpileOnly": false                             /* 启用严格的类型检查，生产模式注意要关闭 */
  },
```

其中files只会加载项目文件，此时必须通过`include`显示指定哪些文件属于项目中的一部分 。

**对于类型声明文件来讲** `typeRoots`告诉ts去哪里找全局类型声明，默认"typeRoots" ,这里可以拓展自定义.d.ts声明文件,例如（**第一个是默认，后面一个是自定义的**）：  
 ` "typeRoots": [                                    
    "./node_modules/@types",               
    "./server/types"
  ],`

## 约定式路由实现

这里打包要**特别注意**，路由定义要存储全局，要不然打包就不会共享  
这里的约定是文件必须按照Nuxt中api一样配置【约定即配置核心】，这里约定函数为**defineNodeRoute**,可以自行定义。

### 实现

<details>
<summary class=" bg-blue-400  text-white cursor-pointer select-none
 text-center active:scale-95">
   routerScanner（路由扫描函数，在插件中引入即可快速完成路由定义）
</summary>

```ts
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import type { Router, Request, Response, NextFunction } from 'express';

// 路由处理器类型 - 使用扩展的Request类型
export type RouteHandler = (
   req: Request,
   res: Response,
   next: NextFunction
) => void | Promise<void | any>;

// 路由定义类型
export interface RouteDefinition {
   handler: RouteHandler;
   method: string;
   path: string;
   filePath: string;
}

// 存储所有路由定义 - 使用全局对象确保在打包后能正确共享
global.routeDefinitions = global.routeDefinitions || new Map();
const routeDefinitions = global.routeDefinitions;

// 存储全局 router 引用，这样可以立即注册路由
let globalRouter: Router | null = null;

/**
 * 跨平台文件路径转换为导入路径
 * @param filePath 文件的绝对路径
 * @returns 适合当前平台的导入路径
 */
function convertToImportPath(filePath: string): string {
   // 对于 .ts 文件（开发环境），直接使用文件路径
   if (filePath.endsWith('.ts')) {
      return filePath;
   }

   // 对于 .js 文件（生产环境），使用 file:// URL
   // pathToFileURL 会自动处理 Windows 和 macOS 的路径格式
   return pathToFileURL(filePath).href;
}

/**
 * 设置全局 router 引用
 * @param router Express Router 实例
 */
export function setGlobalRouter(router: Router): void {
   globalRouter = router;
}

/**
 * 全局 defineNodeRoute 函数
 * @param handler 路由处理函数
 * @returns 路由处理函数
 */
export function defineNodeRoute(handler: RouteHandler): RouteHandler {
   // 获取调用栈信息来确定文件路径
   const stack = new Error().stack;
   if (stack) {
      const stackLines = stack.split('\n');
      // 找到调用 defineNodeRoute 的文件
      for (let i = 1; i < stackLines.length; i++) {
         const line = stackLines[i];
         // 支持 .ts 和 .js 文件，但排除 routeScanner 文件本身
         if ((line.includes('.ts') || line.includes('.js')) && !line.includes('routeScanner')) {
            // 改进正则表达式以匹配 .ts 或 .js 文件的Windows路径
            const match = line.match(/\(([A-Za-z]:[^:)]+\.(ts|js))/);
            if (match) {
               const filePath = match[1];

               try {
                  const { method, path: routePath } = parseRouteFromFilePath(filePath);

                  const routeDefinition = {
                     handler,
                     method,
                     path: routePath,
                     filePath
                  };

                  routeDefinitions.set(filePath, routeDefinition);

                  // 如果有全局 router，立即注册路由
                  if (globalRouter) {
                     registerSingleRoute(globalRouter, routeDefinition);
                  }

                  break;
               } catch (error) {
                  console.error(
                     `❌ Error parsing route from ${filePath}:`,
                     error instanceof Error ? error.message : error
                  );
               }
            }
         }
      }
   }

   return handler;
}

/**
 * 注册单个路由到 Express Router
 * @param router Express Router 实例
 * @param routeDefinition 路由定义
 */
function registerSingleRoute(router: Router, routeDefinition: RouteDefinition): void {
   const { method, path: routePath, handler } = routeDefinition;

   try {
      // 注册路由到 router
      switch (method.toLowerCase()) {
         case 'get':
            router.get(routePath, handler);
            break;
         case 'post':
            router.post(routePath, handler);
            break;
         case 'put':
            router.put(routePath, handler);
            break;
         case 'delete':
            router.delete(routePath, handler);
            break;
         case 'patch':
            router.patch(routePath, handler);
            break;
         case 'head':
            router.head(routePath, handler);
            break;
         case 'options':
            router.options(routePath, handler);
            break;
         default:
            console.warn(`⚠️ Unsupported HTTP method: ${method} for route ${routePath}`);
            return;
      }
   } catch (error) {
      console.error(
         `❌ Failed to register route ${method.toUpperCase()} ${routePath}:`,
         error instanceof Error ? error.message : error
      );
   }
}

/**
 * 从文件路径解析路由信息
 * @param filePath 文件路径
 * @returns 解析后的方法和路径
 */
function parseRouteFromFilePath(filePath: string): { method: string; path: string } {
   // 输入验证
   if (!filePath || typeof filePath !== 'string') {
      throw new Error('Invalid file path provided');
   }

   // 验证文件是否为 TypeScript 或 JavaScript 文件
   const fileExtension = path.extname(filePath);
   if (fileExtension !== '.ts' && fileExtension !== '.js') {
      throw new Error(`File must be a TypeScript or JavaScript file: ${filePath}`);
   }

   // 标准化路径分隔符
   const normalizedPath = filePath.replace(/\\/g, '/');

   // 找到 api 目录的位置
   const apiIndex = normalizedPath.indexOf('/api/');
   if (apiIndex === -1) {
      throw new Error(`File is not in the api directory: ${filePath}`);
   }

   // 获取 api 目录后的相对路径
   const relativePath = normalizedPath.substring(apiIndex + 5); // 5 = '/api/'.length

   // 验证相对路径不为空
   if (!relativePath) {
      throw new Error(`Invalid api file path: ${filePath}`);
   }

   // 解析文件名（移除扩展名）
   const fileName = path.basename(relativePath, fileExtension);
   const directory = path.dirname(relativePath);

   // 验证文件名不为空
   if (!fileName) {
      throw new Error(`Invalid file name: ${filePath}`);
   }

   // 解析 HTTP 方法（从文件名中提取，如 hello.get.ts -> get）
   const fileParts = fileName.split('.');
   let method = 'get'; // 默认方法
   let routeName = fileName;

   if (fileParts.length >= 2) {
      const possibleMethod = fileParts[fileParts.length - 1].toLowerCase();
      const validMethods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'];

      if (validMethods.includes(possibleMethod)) {
         method = possibleMethod;
         routeName = fileParts.slice(0, -1).join('.');
      }
   }

   // 验证路由名称
   if (!routeName && routeName !== 'index') {
      throw new Error(`Invalid route name derived from file: ${filePath}`);
   }

   // 构建路由路径
   let routePath = '';

   // 处理目录路径（不处理动态参数，只处理静态路径）
   if (directory && directory !== '.') {
      // 验证目录路径格式
      const directorySegments = directory.split('/');
      for (const segment of directorySegments) {
         if (!segment || segment.includes('..') || segment.includes('<') || segment.includes('>')) {
            throw new Error(`Invalid directory segment in path: ${directory}`);
         }
      }
      routePath = '/' + directory;
   }

   // 添加文件名作为路径（除非是 index）
   if (routeName && routeName !== 'index') {
      // 处理动态路由参数（只在文件名级别）
      if (routeName.startsWith('[') && routeName.endsWith(']')) {
         const paramName = routeName.slice(1, -1);
         // 验证参数名格式
         if (!paramName || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(paramName)) {
            throw new Error(`Invalid dynamic parameter name: ${paramName} in file ${filePath}`);
         }
         routePath += '/:' + paramName;
      } else {
         // 验证静态路由名称格式
         if (!/^[a-zA-Z0-9_-]+$/.test(routeName)) {
            throw new Error(`Invalid route name format: ${routeName} in file ${filePath}`);
         }
         routePath += '/' + routeName;
      }
   }

   // 确保路径以 / 开头
   if (!routePath) {
      routePath = '/';
   } else if (!routePath.startsWith('/')) {
      routePath = '/' + routePath;
   }

   // 验证最终路径格式
   if (!/^\/[a-zA-Z0-9\/_:-]*$/.test(routePath)) {
      throw new Error(
         `Generated route path contains invalid characters: ${routePath} from file ${filePath}`
      );
   }

   return { method, path: routePath };
}

/**
 * 扫描 api 目录并加载所有路由文件
 * @param apiDir api 目录路径
 */
export async function scanApiDirectory(apiDir: string): Promise<void> {
   if (!fs.existsSync(apiDir)) {
      console.warn(`⚠️ API directory ${apiDir} does not exist`);
      return;
   }

   try {
      const files = await getAllRouteFiles(apiDir);
      console.log(`📂 Found ${files.length} route files in API directory`);

      // 动态导入所有路由文件
      for (const file of files) {
         try {
            // 使用跨平台路径转换函数
            const importPath = convertToImportPath(file);

            await import(importPath);
         } catch (error) {
            console.error(
               `❌ Error importing route file ${path.basename(file)}:`,
               error instanceof Error ? error.message : error
            );
         }
      }
   } catch (error) {
      console.error(
         `❌ Error scanning API directory ${apiDir}:`,
         error instanceof Error ? error.message : error
      );
   }
}

/**
 * 递归获取目录下的所有路由文件（.ts 或 .js）
 * @param dir 目录路径
 * @returns 路由文件路径数组
 */
async function getAllRouteFiles(dir: string): Promise<string[]> {
   const files: string[] = [];

   try {
      const items = fs.readdirSync(dir);

      for (const item of items) {
         const fullPath = path.join(dir, item);

         try {
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
               const subFiles = await getAllRouteFiles(fullPath);
               files.push(...subFiles);
            } else {
               // 支持 .ts 和 .js 文件，但排除 .d.ts 文件
               const ext = path.extname(item);
               if ((ext === '.ts' && !item.endsWith('.d.ts')) || ext === '.js') {
                  files.push(fullPath);
               }
            }
         } catch (error) {
            console.error(
               `❌ Error accessing file ${fullPath}:`,
               error instanceof Error ? error.message : error
            );
         }
      }
   } catch (error) {
      console.error(
         `❌ Error reading directory ${dir}:`,
         error instanceof Error ? error.message : error
      );
   }

   return files;
}

/**
 * 将所有扫描到的路由注册到 Express Router
 * @param router Express Router 实例
 */
export function registerRoutes(router: Router): void {
   for (const [filePath, routeDefinition] of routeDefinitions) {
      const { method, path: routePath, handler } = routeDefinition;

      try {
         // 注册路由到 router
         switch (method.toLowerCase()) {
            case 'get':
               router.get(routePath, handler);
               break;
            case 'post':
               router.post(routePath, handler);
               break;
            case 'put':
               router.put(routePath, handler);
               break;
            case 'delete':
               router.delete(routePath, handler);
               break;
            case 'patch':
               router.patch(routePath, handler);
               break;
            case 'head':
               router.head(routePath, handler);
               break;
            case 'options':
               router.options(routePath, handler);
               break;
            default:
               console.warn(`⚠️ Unsupported HTTP method: ${method} for route ${routePath}`);
         }
      } catch (error) {
         console.error(
            `❌ Failed to register route ${method.toUpperCase()} ${routePath}:`,
            error instanceof Error ? error.message : error
         );
      }
   }

   console.log(`✅ Total routes registered: ${routeDefinitions.size}`);
}
```

</details>

### 插件注册

<details>
<summary class=" bg-blue-400  text-white cursor-pointer select-none
 text-center active:scale-95">
   register-router.server.ts（完成动态引入路由）
</summary>

```ts
import path from 'path';
import type { Router } from 'express';
import { registerRoutes, scanApiDirectory, setGlobalRouter } from '../../utils/routeScanner';

/**
 * 设置所有路由，约定大于配置自动导入设置
 * 异步导入所有路由文件并注册
 */
async function setupRoutes(router: Router) {
   // 设置全局 router，这样路由会在导入时立即注册
   setGlobalRouter(router);

   // 扫描并注册 API 路由（包括根路由）
   let apiDir: string;

   if (__dirname.includes('dist')) {
      // 生产环境：在 dist 目录中，api 目录就在同级
      apiDir = path.join(__dirname, 'api');
   } else {
      // 开发环境：在 server 目录中
      apiDir = path.join(__dirname, '../../api');
   }

   await scanApiDirectory(apiDir);

   // 作为备用，仍然调用传统的注册方法（如果有剩余的路由）
   registerRoutes(router);
}

// 02.register-router.server.ts plugin
/**
 * @description register router once
 */
const defineRouterPlugin = async (router: Router) => {
   await setupRoutes(router);
};

export default defineRouterPlugin;
```

</details>

### 打包

这里以esbuild打包为例，因为esbuild非常适合**中小型RESTful API**项目打包  
其速度快、简洁，符合实际实践

<details>
<summary class=" bg-blue-400  text-white cursor-pointer select-none
 text-center active:scale-95">
   esbuild（esbuild.config.ts）
</summary>

```ts
// esbuild.config.mjs
import { build } from 'esbuild';
import { rmSync, existsSync, cpSync } from 'fs';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

const outdir = 'dist';

// 先清空 dist 目录
if (existsSync(outdir)) rmSync(outdir, { recursive: true });

// 获取所有 TypeScript 文件
function getAllTsFiles(dir, basePath = dir) {
   const files = [];
   const items = readdirSync(dir);

   for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
         files.push(...getAllTsFiles(fullPath, basePath));
      } else if (item.endsWith('.ts') && !item.endsWith('.d.ts')) {
         files.push(fullPath);
      }
   }

   return files;
}

// 打包核心入口
await build({
   entryPoints: ['server/main.ts'],
   outdir,
   bundle: true,
   platform: 'node',
   target: 'node18',
   format: 'cjs', // 改为 CommonJS 格式
   sourcemap: true,
   external: ['fs', 'path', 'url'] // Node 内置模块不打包
});

// 单独编译所有其他 TypeScript 文件（包括 API 文件）
const allFiles = getAllTsFiles('server');
const otherFiles = allFiles.filter((file) => !file.endsWith('main.ts'));

if (otherFiles.length > 0) {
   await build({
      entryPoints: otherFiles,
      outdir,
      bundle: false,
      platform: 'node',
      target: 'node18',
      format: 'cjs',
      sourcemap: true,
      outbase: 'server'
   });
}

// 复制静态文件目录（约定大于配置：只有当 server/public/static 存在时才复制整个 public 目录）
if (existsSync('server/public/static')) {
   cpSync('server/public', `${outdir}/public`, { recursive: true });
   console.log('📁 Static files copied to dist/public (triggered by server/public/static)');
} else {
   console.log('ℹ️  No server/public/static directory found, skipping static files copy');
}

console.log('✅ Build completed successfully!');
```

</details>

## 传输数据压缩加速

**以node:zlib**中的两个gzip和defalte为例。

- gip适合http传输，**游览器兼容**
- deflate适合嵌入式设备、低延迟通信（**大文件下1gb以上，比gzip压缩时间快15%**）

<span class=" text-red-400">注：大文件下，为了避免文件一次性加载要使用流失处理（Stream + Pipeline）</span>

**为了保证生产者和消费者的平衡，也即内存安全，所以使用流失处理最好（pipe管道不会处理错误，会导致读或者写流永远挂起，因而这里使用pipeline最好）**  
pipeline相比pipe，引入了错误处理机制，当错误发生时会销毁管道中的所有流，其位于**stream**包下，node内部包

```ts
//大文件流失处理，返回前端
import { createReadStream, createWriteStream } from 'node:fs';
import { createGzip, createDeflate } from 'node:zlib';
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

**小文件处理示例**

```ts
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

## ESM or Commonjs?

由于**nodejs**已全面转向了ESM模块作为未来发展方向，因而从最佳实践和现代化做法中，选择ESM。Nodejs和ts编译器职责分离，nodejs只执行js，而ts编译器只编译ts。因而引入ts文件必须要.js拓展名即使是ts，主要原因是：**但esm模块解析时，nodejs不会像commonjs自动查找.js、.json扩展名，省略.js就node找不到该模块**

之所以必须是`.js`而不是`.ts`因为node是运行时，而ts是编译时类似源文件，所以在nodejs引入或者使用模块就必须引入编译后的`.js`文件

在vite+vue+ts的官方项目中vite+ts编译器自动处理了ts文件，隐藏了编译过程，从而导入文件时不用关心拓展名。

**配置：**  
在`package.json`显示声明`"type":"module"`即可，然后就是配置`tsconfig.json`让ts如何解析该模块，

```json
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

然后就是`package.json`启动命令的配置，这里使用更加现代的ts编译器`tsx`。

```
<!-- 1、install tsx -->
pnpm i tsx -D
<!-- 2、setting command(默认src/main.ts为入口) -->
"scripts": {
   "start": "node --import tsx src/main.ts",
   "dev": "nodemon --watch \"src/**/*.ts\" -e ts,json --exec \"node --import tsx src/main.ts\""
},
```

## 打包

打包nodejs常见的有两个一个是`esbuild`另外一个是`webpack`，esbuild构建速度快，配置简单易用性高，但是在一些复杂项目中没有webpack好用，因而**复杂项目使用webpack，快速上线中小项目使用esbuild**

### esbuild打包

```terminal
pnpm i esbuild -D
```

**setting config file(esbuild.config.mjs)**

```ts
const// esbuild.config.mjs
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

  platform: 'node', // 针对 Node.js 平台，如果是node平台就不能使用esbuild的代码压缩minifiy(这个是在游览器独有的)
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
