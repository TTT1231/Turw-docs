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

