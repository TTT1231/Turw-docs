# Nodejs

一般用于RESTful API(Express/Fastify)，BBF,特别适合中小型项目。
也即前端全栈，实时应用开发、偏前端方向。相比java其开发速度很快，适合快速迭代开发。

## 优点

- **高性能I/O型**：基api服务快，启动速度比java快。
- **异步非阻塞I/O**：适合高并发场景，能处理大量连接。
- **单语言开发**：前后端都可用JavaScript，降低学习成本。
- **丰富的生态**：npm拥有大量第三方模块，开发效率高。

## 缺点

- **类型安全性差**：JavaScript为弱类型语言，易出现类型相关bug。
- **不适合CPU密集型应用**：如视频处理、科学计算等。
- **稳定性问题**：部分第三方包质量参差不齐

## 中间件

请求 → 中间件1 → 中间件2 → 中间件3 → 路由处理 → 中间件3 → 中间件2 → 中间件1 → 响应  
<span>
<label class=" bg-red-200">注:  </label>
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

## 配置
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

## **自定义类型（.d.ts不加载问题）**

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