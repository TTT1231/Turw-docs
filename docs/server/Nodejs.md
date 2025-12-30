---
outline: deep
---

# Nodejs

高性能IO、BBF、跨平台开发工具、cli、SSR、SSG、小工具脚本等

## RESTful框架选择

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

::: warning 注意
需要注意定义**顺序**
:::

- 应用级别中间件（app.use），为应用或路由添加通用功能。
- 路由级别中间件（app.get、app.post），匹配方法和路径请求。
- 错误处理中间件（app.use(err,...)）,处理错误
- cors中间件 ,处理不同源请求。

## 中间件应用

**错误处理**

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

**CORS**

这里如果要让ajax(XMLHttpRequest)或者fetch区别游览发起请求和表单之间访问url
则需要`x-requested-with`用于标识，**Content-Type**和**Authorization**用于认证，
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

```js:no-line-numbers
nodemon --watch \"src/**/*.ts\" --exec \"ts-node\"  main.ts
```

## 静态资源代理

静态资源代理直接使用express.static中间件即可，例如将所有public目录暴露出去（当然也可以自定义别的目录。

```js:no-line-numbers
app.use(express.static('public'));
```

## **ts-node运行时类型问题**

在使用`ts-node`会出现 “运行时类型未加载” 问题，也就是`.d.ts`文件未纳入加载范围。

::: tip 问题原因
此问题出现在使用`ts-node`去运行`ts`文件并在`tsconfig`中配置了`ts-node`中`transpileOnly`属性启用了类型检查，由于启用了检查，但是没有配置`files`去加载文件，那么此时就会出现运行时类型问题。

其中files只会加载项目文件，此时必须通过`include`显示指定哪些文件属于项目中的一部分 。（启用类型检查条件下`transpileOnly`）

该问题只是一个类型问题，关闭`transpileOnly`也是可以运行的，如果非要`ts-node`检查的话，就必须要配置`files`和`transpileOnly`两种属性。

当然了，在开发中也是需要针对一些类型文件编译器也是要识别到的，使得开发更加类型安全。
:::

::: warning 注意
在配置包含类型文件中，有两种方案，一种是`include`和`typeRoots`方案。

:grinning: :`include`是文件级别精确匹配，针对每个文件可控，结构也更加清晰。因此实际中推荐使用这种。
:disappointed_relieved: : `typeRoots`会扫描整个目录，同时会覆盖默认，需要显示声明，实际使用容易造成误配。因此大多数不推荐。
:::

::: tip 提示
**对于类型声明文件来讲** `typeRoots`告诉ts去哪里找全局类型声明，默认"typeRoots" ,这里可以拓展自定义.d.ts声明文件,例如（**第一个是默认，后面一个是自定义的**）：

```json
{
   "typeRoots": ["./node_modules/@types", "./server/types"]
}
```

:::

> 首先需要保证**类型安全**，这里以环境类型为例

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
      //[!code warning]
      // 关闭它时，不会出现这个问题，需要解决类型问题，使用ts-node需要明确指定需不需要它
      //[!code warning]
      //使用ts-node类型检查，不推荐，检查多余且不适配耗时长

      "transpileOnly": false //[!code ++] 启用类型检查 ,
      "files": true //[!code ++] 加载 include 中的所有文件
   },
   "include": ["env.d.ts"] //[!code ++] 包含类型
}
```

```json [package.json]
{
   "scripts": {
      //[!code ++]
      "dev": "ts-node src/main.ts"
   }
}
```

:::

::: details
**ts-node是为了让 Node.js 能够直接运行 TypeScript 文件（.ts），而无需先手动编译成 JavaScript。**

同时由于`esm`格式目前还是不支持，只能使用加载器格式进行加载`esm`格式，而且加载器未来会抛弃选用`import`格式。

因此实际`ts-node`运行中会将项目的`esm`格式转化为`commonJS`格式。

它核心就是**轻量、即时执行**，因此只适合一些验证场景和简单脚本场景不需要打包工具参与。
:::

## 约定式路由实现

::: warning 注意
路由定义要存储全局，要不然打包就不会共享 这里的约定是文件必须按照Nuxt中api一样配置【约定即配置核心】，这里约定函数为**defineNodeRoute**,可以自行定义。
:::

**实现**

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

**插件注册**

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

**打包**

::: tip 提示
这里以esbuild打包为例，因为esbuild非常适合**中小型RESTful API**项目打包  
其速度快、简洁，符合实际实践
:::

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

**以node:zlib**中的两个gzip和deflate为例。

- gip适合http传输，**游览器兼容**
- deflate适合嵌入式设备、低延迟通信（**大文件下1gb以上，比gzip压缩时间快15%**）

::: warning 注意
大文件下，为了避免文件一次性加载要使用流失处理（Stream + Pipeline）
:::

::: tip 提示
**为了保证生产者和消费者的平衡，也即内存安全，所以使用流失处理最好（pipe管道不会处理错误，会导致读或者写流永远挂起，因而这里使用pipeline最好）**

pipeline相比pipe，引入了错误处理机制，当错误发生时会销毁管道中的所有流，其位于**stream**包下，node内部包
:::

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

::: tip 提示
由于**nodejs**已全面转向了ESM模块作为未来发展方向，因而从最佳实践和现代化做法中，选择ESM。Nodejs和ts编译器职责分离，nodejs只执行js，而ts编译器只编译ts。因而引入ts文件必须要.js拓展名即使是ts。

原因：**但esm模块解析时，nodejs不会像commonjs自动查找.js、.json扩展名，省略.js就node找不到该模块**。

之所以必须是`.js`而不是`.ts`因为node是运行时，而ts是编译时类似源文件，所以在nodejs引入或者使用模块就必须引入编译后的`.js`文件

在vue官方脚手架项目中`vite`编译器自动处理了ts文件，隐藏了编译过程，从而导入文件时不用关心拓展名。
:::

**配置：**  
在`package.json`显示声明`"type":"module"`即可，然后就是配置`tsconfig.json`让ts如何解析该模块

::: warning 注意
实际上不会这样子做，这样开发体验不好，每次都要输入文件后缀`js`，即使是`ts`。

在node环境下的时候，当设置它的时候，node会强制要求文件后缀，如果是`ts`写的，那么特别是本地引入文件的时候会是`js`后缀，这样不直观，因此开发的时候一般不用，保持默认即可。

同时如果确认需要显式的`esm`的时候，此时就需要，但是不推荐`ts`，因为`ts`会被视为`js`处理，此时可以使用`mjs`。

:::

::: tip 提示
大部分情况下，`type`保持默认即可，避免在开发中`ts`本地文件引入时，要保持文件后缀`js`，**JS**文件选用`mjs`格式即可。
:::

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

然后就是`package.json`启动命令的配置，这里使用更加现代的ts编译器`tsx`。其他的也可以，根据实际情况使用即可。

::: danger 危险
`tsc`由于是单线程，构建速度慢，没有tree-shaking、模块打包等情况，因此实际上很少会选用它。

但是由于它是`ts`的官方打包工具，而且它非常适合类型检查，在快速验证的场景下可以选用它。
:::

## 打包

::: tip 提示
如果是CLI、npm库、API服务，可以选用`tsup`。

如果是库开发，需要tree-shaking效果好、输出可读性好，此时可以选用`rollup`，但是速度会稍微比较慢较`tsup`、以及HMR不支持。

由于`rollup`受限JS单线程，打包耗时就会长，可以考虑`rolldown`也就是`rollup`重置版本，**未来发展趋势**，未来也会慢慢支持HMR功能，目前主要部分插件支持首先开发者一小部分会不支持，但是大部分是支持的。

如果需要HMR热更新，可以选用`swc`，但是它仅转义不支持类型检查，因此在选用它时注意考虑**类型安全**
:::

::: warning 注意
以上打包工具，`tsup`、`rollup`、`rolldown`、`swc`都不支持类型检查，因此打包前需要注意类型安全，或者执行一次类型安全检查，也是可以的。
:::

::: info 通知
`nestjs`中在使用`swc`进行转译`ts`->`js`然后在`build`阶段会先执行`tsc`类型检查，检查完后就是`swc`转译代码了。

`vite8`打包构建也是选用的`rolldown`。
:::

在进行快速场景验证的时候，可以选用`esbuild`进行转译，但是正常项目不推荐，只适合很少场景，追求简单的话，选用`tsup`也是可以的。

::: code-group

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

## 进程与脚本

`Nodejs`可以针对进程进行管理，实现**进程并发、任务沙箱隔离、脚本编写、聚合层BFF转发、自动化运维和构建、数据处理等**等功能。

主要就是一些CPU密集任务型处理，因为`Nodejs`是高性能I/O处理，因此对这方面特别擅长，其核心就是**将I/O操作迁移到后台，避免阻塞主进程**。

大部分场景如下：数据加密、数据计算、图片处理等。也是通过Nodejs中`fork`创建子进程，然后进行处理（类似CPU并行），使得主进程继续处理其他请求，返回最终处理结果而后主进程进行处理。

还一种就是一些定时任务和流式长期运行任务，例如**日志监控、数据备份、爬虫任务、跨语言集成等**。

::: tip 提示
跨语言集成能力，也是借助`Nodejs`环境，类似`Nodejs`脚本使用对应的环境启动对应的代码，例如使用`python`启用`.py`完成模型推理工作等。
:::

::: danger 危险
`fork`创建子进程会消耗资源，因此实际中不能创建太多，会有性能损耗
:::

> [!IMPORTANT] 重要
> 上诉中的能力，是借助`Nodejs`中`child_process`模块的，翻译过来就是子进程模块。

::: tip 为什么是`child_process`

|       库       |              优点              |       缺点       |     适用场景      |
| :------------: | :----------------------------: | :--------------: | :---------------: |
| child_process  | 进程隔离、进程并行、跨语言集成 |  创建进程有开销  | CPU密集、需要沙箱 |
| Worker Threads |        共享内存，开销小        |     ipc通信      |    进程间通信     |
|    Redis/MQ    |         分布式、持久化         | 必须要中间件集成 |    分布式系统     |

:::

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

::: danger 危险
`exec`和`execFile`的核心就是有关**shell**配置，因为`execFile`就是针对`exec`的封装，主要就是解决shell注入问题。

- `exec`中shell默认启用(true)
- `execFile`中shell默认关闭(false)

因此`execFile`就不支持了shell语法。
:::

**fork特点和配置**

IPC通信（基于spawn）封装，主要用于CPU任务拆分，优化CPU利用。只会在Node环境下执行，默认包含IPC通信通道。

一般类似就是像electron通信一样，还有就是node脚本执行，进程守护等。

[fork官方配置文档](https://nodejs.org/api/child_process.html#child_processforkmodulepath-args-options)

|           属性           | 默认值 |         类型          |                   描述                    |
| :----------------------: | :----: | :-------------------: | :---------------------------------------: |
| windowsVerbatimArguments | false  |       `boolean`       |            windows参数自动转义            |
|         execArgv         |   -    |      `string[]`       |               命令执行参数                |
|         execPath         |   -    |       `string`        |               命令执行路径                |
|      serialization       | 'json' | `'json'\|'advanced' ` |            发送消息序列化类型             |
|          silent          | false  |       `boolean`       | 默认从父进程继承，如果为true则类似console |
