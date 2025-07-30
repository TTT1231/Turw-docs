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
- **utils**——utils自动引入(<span class="text-red-400">只引入默认导出，不默认导出要手动引入</span>)包括**类型**（要将项目运行起来，依赖文件系统）能根据自动嵌套目录结构处理。  
<span class=" bg-green-400/80 text-white">composables/auth/login.ts → useLogin()</span>
- **plugins**——插件自动引入（要将项目运行起来，依赖文件系统）  
`plugins/my-plugin.client.ts → 仅客户端【游览器】`  
 `plugins/my-plugin.server.ts → 仅服务端【服务器】`  

- pinia: ~/stores/ (需安装 @pinia/nuxt)  #😃完整类型提示
- API 路由: ~/server/api/                #😃$fetch有，或者封装axios提供类型也可以
- 中间件: ~/middleware/                  #基本对象类型，不影响
- 布局: ~/layouts/                       #基本布局名称【props要手动声明】
- 页面: ~/pages/                         #😃完整类型提示
