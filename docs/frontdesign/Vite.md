# Vite

冷启动、按需加载模块、热更新、高效`Rollup`打包。

## Vite动态路由

采用`import.meta.glob`方式，其是一个异步导入函数（懒加载函数），只有当路由真正被访问的时候，才会去加载对应组件文件。

### 示例

假设我菜单路由如下:

::: details 菜单路由配置

```json
[
   {
      path: '/main',
      name: 'main',
      component: 'MainForm',
      meta: {
         ishide: false,
         ishome: true
      },
      children: [
         {
            path: 'home',
            name: 'home',
            component: '',
            meta: {
               ishide: false,
               ishome: false
            },
            children: [
               {
                  path: 'analysis',
                  name: 'analysis',
                  component: 'sys/home/Analysis',
                  meta: {
                     ishide: false,
                     ishome: false
                  },
                  children: []
               },
               {
                  path: 'workbench',
                  name: 'workbench',
                  component: 'sys/home/WorkBench',
                  meta: {
                     ishide: true,
                     ishome: false
                  },
                  children: []
               }
            ]
         },
         {
            path: '/:patchMatch(.*)',
            name: 'error',
            component: 'error/Error',
            meta: {
               ishide: false,
               ishome: false
            },
            children: []
         },
         {
            path: 'systemanager',
            name: 'systemanager',
            component: '',
            meta: {
               ishide: false,
               ishome: false
            },
            children: [
               {
                  path: 'usermanager',
                  name: 'usermanager',
                  component: 'sys/systemanager/UserManager',
                  meta: {
                     ishide: false,
                     ishome: false
                  },
                  children: []
               },
               {
                  path: 'menumanager',
                  name: 'menumanager',
                  component: 'sys/systemanager/MenuManager',
                  meta: {
                     ishide: false,
                     ishome: false
                  },
                  children: []
               }
            ]
         },
         {
            path: 'fun',
            name: 'fun',
            component: '',
            meta: {
               ishide: false,
               ishome: false
            },
            children: [
               {
                  path: 'shotscreen',
                  name: 'shotscreen',
                  component: 'sys/fun/ShotScreen',
                  meta: {
                     ishide: false,
                     ishome: false
                  },
                  children: []
               },
               {
                  path: 'commontable',
                  name: 'commontable',
                  component: 'sys/fun/CommonTable',
                  meta: {
                     ishide: false,
                     ishome: false
                  },
                  children: []
               }
            ]
         }
      ]
   }
];
```

:::

### 动态导入组件的原理

`import.meta.glob` 返回一个对象，其中：

- **键（key）** - 文件路径（相对路径）
- **值（value）** - 异步导入函数（懒加载函数）

通过递归函数遍历路由配置，将组件字符串转换为异步导入函数，实现动态加载。

::: tip 提示
**文件位置和名字需要约定**，保证 `components` 对象中的路径能正确对应到实际组件文件
:::

#### 实现示例

```ts {1,4}
// 1. 使用 import.meta.glob 导入所有组件
const components = import.meta.glob('../../views/**/*.vue');

// 2. 递归处理路由，将组件字符串替换为导入函数
function recurseAddRoutes(routes: RoutesType[]) {
   return routes.map((route) => {
      // 如果有组件配置，获取对应的导入函数
      if (route.component && route.component !== '') {
         route.component = components[`../../views/${route.component}.vue`];
      }

      // 递归处理子路由
      if (route.children?.length > 0) {
         route.children = recurseAddRoutes(route.children);
      }

      return route;
   });
}
```

## vite dev tools 和 增强import.meta提示

::: code-group

```sh:no-line-numbers [install.sh]
pnpm add vite-plugin-vue-devtools -D
```

```ts [usage.ts]
import vueDevTools from 'vite-plugin-vue-devtools'; //[!code ++]

export default defineConfig({
   plugins: [
      vueDevTools() //[!code ++]
   ]
});
```

:::

**增强提示（类型安全）**

```js
/// <reference types="vite/client" /> //[!code ++]
//加上上面那个进行类型提示增强
//需要在tsconfig.app.json配置`"types": ["vite/client"]` // [!code warning]
interface ImportMeta {
   readonly env: ImportMetaEnv; //这个ImportMetaEnv这个是自定义的
}
```

全部放在一个文件也是可以的，例如下面这段代码:

```ts
/// <reference types="vite/client" />

interface MyEnvType {
   qwe: string;
}

declare global {
   interface ImportMetaEnv extends MyEnvType {}

   interface ImportMeta {
      readonly env: ImportMetaEnv;
   }
}

export {};
```

::: tip 提示
这里其实也可以不用导入这个`.d.ts`，定义全局类型也是一样的，或者`import type`,然后该声明文件会变为局部声明文件，使用`export {}` 导出，变为全局声明文件也是一样可以的。
:::

## env配置验证注意

在环境变量验证中，不能将

```ts
interface ImportMetaEnv extends Record<ImportMetaEnvFallbackKey, any> {
   BASE_URL: string;
   MODE: string;
   DEV: boolean;
   PROD: boolean;
   SSR: boolean;
}
```

其中的BASE_URL，MODE，DEV，PROD，SSR属性移除掉组合一个新类型，例如`type newType = Omit<ImportMetaEnv,'BASE_URL',...>`这时ts会推断不出来全局拓展的环境变量，也就没有了类型安全。

> [!IMPORTANT]
> 解决方案就是**保留它**，在需要的验证的地方例如`zod`中scheme只针对特定的变量进行验证，
> parse验证时直接将`import.meta.env`进行解构赋值即可

> [!WARNING]
> 如果想在vite启动时就对环境变量进行验证，使得验证不通过应用程序直接终止，那么就需要在`vite.config.ts`文件中在defineConfig进行验证，缺点就是要**手动加载环境变量**，vite不会自动处理，如下:

```ts
//vite.config.ts
export default defineConfig(({mode})=>{
   //手动加载环境变量,env-> Record<string,string>
   const env = loadEnv(mode,process.cwd().'path-to-envfile')//.env,.env*

   //validate env config
   validateEnv(env)

   return {
      plugins:[
         vue()
      ]
   }

})
```

为保障类型安全需手动定义相关类型，但易出现重复定义情况（例如在 `env.d.ts` 中拓展 `ImportMeta` 全局类型时，可能与其他位置类型冲突）。

::: tip 提示
解决方案是将所需的 `envConfig` 直接定义为全局类型，再嵌入 `ImportMeta` 中，`vite.config.ts` 可直接使用，既避免重复定义，也解决了多位置维护类型的问题。
:::

::: tip
上诉中这个`ImportMeta`是自定义的环境变量类型
:::

```ts
//这是全局类型，这里是局部类型定义
type RequiredEnv = {
   VITE_API_BASE_URL: string;
};
type ViteEnv = RequiredEnv & Record<string, string>;

//类型安全，这是env.VITE_API_BASE_URL就会有类型提示了
const env = loadEnv(mode, process.cwd(), '') as ViteEnv;
```

这种手动没有vite自动加载BASE_URL，MODE，DEV，PROD，SSR属性，如果要对其进行验证就需要手动完成vite的这个功能。

## 反向代理

反向代理就是代理服务器地址，充当中间商，隐藏真实的服务器地址，特别适合防范ddos攻击等。

::: code-group

```ts [vite.config.ts]
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
   plugins: [vue()],
   //[!code ++]
   server: {
      proxy: {
         '/api': {
            target: 'your-example.ip', // 动态设置代理目标
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            // 添加更多配置选项
            configure: (proxy) => {
               //目标服务不可用情况
               proxy.on('error', (err) => {
                  console.log('❌ 代理错误:', err.message);
               });
               //代理请求发出前，一般记录请求日志/修改请求头
               proxy.on('proxyReq', (proxyReq, req) => {
                  console.log('📤 代理请求:', req.method, req.url, '→', proxyTarget);
               });
               //收到响应后，一般记录响应日志/修改响应数据
               proxy.on('proxyRes', (proxyRes, req) => {
                  console.log('📥 代理响应:', proxyRes.statusCode, req.url);
               });
            }
         }
      }
      //[!code ++]
   }
});
```

:::
