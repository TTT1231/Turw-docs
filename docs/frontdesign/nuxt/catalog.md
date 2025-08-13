# Nuxt目录

这里以nuxt4.0为准，结构如下
```js
my-nuxt-app/ 
├─ app/
│  ├─ assets/         //存放静态资源文件，构建工具处理后会交给游览器
│  ├─ components/     //vue组件，自动导入无需手动import，支持异步
│  ├─ composables/    //类似vue中hooks
│  ├─ layouts/        //页面布局，主要包裹页面的外层框架，其中slot会明确内容插入到哪里
│  ├─ middleware/     //类似nodejs路由中间件，可以在这进行权限或导航前执行代码
│  ├─ pages/          //vue router会自动生成路由，动态路由只需按照pages/users/[id].vue即可
│  ├─ plugins/        //存放nuxt插件，扩展vue/nuxt，应用启动时自动运行
│  ├─ utils/          //工具函数
│  ├─ app.vue         //主入口组件，类似vue中App.vue
│  ├─ app.config.ts   //应用运行时配置，主要定义一些应用访问公共变量
│  └─ error.vue       //错误页面组件，类似vue中找不到路由组件
├─ content/           //存放内容目录，一般就是创建内容的网站，例如博客、文档等。
├─ public/            //直接提供给客户端的静态文件，不会被构建工具处理，通过/根路径直接访问
├─ shared/            //存放前后端共享代码，一般就是类型定义，常量，枚举等等。
├─ server/            //服务器目录
|  ├─ api/            //api路由映射文件
|     └─ hello.ts     //这里会被映射到/api/hello就可以被访问=================示例=================
|  ├─ middleware/     //服务器请求拦截，可以用来一些日志访问、鉴权等
|     └─ auth.ts      //鉴权=================示例=================
|  ├─ plugins/        //服务器插件，主要拓展Nuxt服务端功能，如注册数据库、三方库等等
|     └─ myPlugin.ts  //插件定义逻辑=================示例=================
|  ├─ utils/          //服务端utils
|     └─ db.ts        //数据库工具参数，比如数据库连接、查询等，常见例如mysql.ts....=================示例=================
|  └─ index.ts        //服务器入口文件，只有在对服务器启动过程做一些处理才用得到，大部分不需要。
└─ nuxt.config.ts     //配置整个nuxt应用行为

```

## 自动引入规制和类型提示

- **components**——组件自动引入包括**类型**（要将项目运行起来，依赖文件系统）能根据自动嵌套目录结构生成组件名称。例如<span class=" bg-green-400 text-white">components/base/Button.vue → BaseButton</span>也可以自定义：
```js
 {
    path: '~/components/base',      //路径
    prefix: 'Base',               //前缀
    ignore: ['**/*.stories.ts']  // 忽略特定文件
 },
```

- **composables**——hooks自动引入包括**类型**（要将项目运行起来，依赖文件系统）能根据自动嵌套目录结构处理。例如<span class=" bg-green-400/90 text-white">composables/auth/login.ts → useLogin()</span>

### 其它（默认不会自动引入，如需自动引入在nuxt.config.tss手动配置即可）
- **plugins**——插件自动注册（要将项目运行起来，依赖文件系统） 【一般是注入全局方法、指令等等】，**需要注意的是，nuxt不会自动引入，也就是要用的时候，手动引入【具体useNuxtApp()解构出来使用即可】**  
`plugins/my-plugin.client.ts → 仅客户端【游览器】`    
 `plugins/my-plugin.server.ts → 仅服务端【服务器】`  

- pinia: ~/stores/ (需安装 @pinia/nuxt)  #😃完整类型提示
- API 路由: ~/server/api/                #😃$fetch有，或者封装axios提供类型也可以
- 中间件: ~/middleware/                  #基本对象类型，不影响
- 布局: ~/layouts/                       #基本布局名称【props要手动声明】
- 页面: ~/pages/                         #😃部分类型提示

## 文件命名

[order].[name].[env].[type].ts
- order 执行顺序，一般用01，02...表示，其中01第一个执行,其次02。
- name  名字
- env 作用环境有**server、client、global**表示服务端、客户端、全局。
- type 文件类型可以是plugin、middleware等

## 服务端 Hooks（Nitro）

### 核心 Runtime Hooks
| Hook 名称 | 触发时机 |
|-----------|----------|
| `request` | 收到请求时触发（处理日志、鉴权等） |
| `beforeResponse` | 响应发送前（可修改 body 和 headers） |
| `afterResponse` | 响应发送后（做清理、记录等） |
| `render:response` | SSR 页面渲染完成、响应发送前（**这里可以做注入csp中nonce**） |
| `render:html` | 构建 HTML 前（SSR 流程中） |
| `error` | 请求或渲染出错时触发 |
| `close` | Nitro 进程关闭时触发 |
| `dev:ssr-logs` | 开发模式下 SSR 日志输出时 |

---

## 客户端 Hooks

### Nuxt App Hooks（`nuxtApp.hooks`）
| Hook 名称 | 触发时机 |
|-----------|----------|
| `app:created` | Nuxt 应用实例创建后（Vue app 未挂载） |
| `app:beforeMount` | Vue 应用挂载到 DOM 前 |
| `app:mounted` | Vue 应用挂载完成（hydration 完成） |
| `app:rendered` | 首次渲染完成（包含 SSR hydration） |
| `app:error` | 应用运行时抛出错误 |
| `vue:error` | **Vue 应用运行时抛出错误**（等价于 `app.config.errorHandler` 捕获） |
| `page:start` | 页面导航开始（路由切换开始） |
| `page:finish` | 页面导航完成（页面和数据就绪） |
| `page:loading:start` | 页面数据开始加载 |
| `page:loading:end` | 页面数据加载完成 |

### Router Hooks（`vue-router`）
| Hook 名称 | 触发时机 |
|-----------|----------|
| `beforeEach` | 路由跳转前 |
| `beforeResolve` | 目标路由解析完成前 |
| `afterEach` | 路由跳转后 |

---

