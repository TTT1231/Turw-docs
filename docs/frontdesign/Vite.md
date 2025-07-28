# Vite

冷启动、按需加载模块、热更新、高效`Rollup`打包。

## Vite动态路由

采用`import.meta.glob`方式，其是一个异步导入函数（懒加载函数），只有当路由真正被访问的时候，才会去加载对应组件文件。

### 示例

假设我菜单路由如下:

```js
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

然后使用递归函数将components组件懒加载过来，实际上import.meta.glob，其数组对象，对象返回键是文件路径（key），值是一个异步导入函数（value），然后访问数组中特定对象，【文件的位置，名字也需要进行约定】，然后在将异步导入函数赋值给component，来完成动态路由的导入。例如：

```js
//递归处理
function recurseAddRoutes(routes: RoutesType[]) {
   return routes.map((route) => {
      if ( route.component === ''||route.component === undefined ) {
         //空字符说明不要加载组件,这里就不需要做任何操作
      } else {
         route.component = components[`../../views/${route.component}.vue`];
     
        }
      // 递归处理子路由
      if (route.children.length > 0 && route.children) {
         route.children = recurseAddRoutes(route.children);
      }

      // 返回更新后的路由项
      return {
         ...route
      };
   });
}
```

## 代码分割

针对代码分割，这里可以调整vite中Rollup打包中的output中manualChunks(id)函数，其中id是模块的绝对路径，以此来半自动进行代码打包后分割。例如：
```js
 manualChunks(id) {
          // id 是模块的绝对路径
          if (id.includes('node_modules')) {
            return 'vendor' // 第三方依赖打包到 vendor
          }
          if (id.includes('src/views/admin')) {
            return 'admin' // 管理后台相关组件
          }
        }

```

## 代码压缩

sourceMap（源映射）是一种映射文件，主要用于调试。它可以将编译、打包、压缩后的代码映射到源代码位置，及其方便进行调试。**但是它文件体积大，如果直接应用到实际环境会有源码泄露风险**。  
在打包时可以启动代码压缩`Minify`的功能，同时也要关闭sourceMap映射，如果用于调试上线则不用。具体配置如下
```js
// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    minify: 'esbuild', // 启用代码压缩，默认就是 'esbuild',速度快，也可用 'terser'
    sourcemap: false   // 关闭 sourceMap 映射，防止源码泄露
  }
})
```

## vite dev tools 和 增强import.meta提示
`import vueDevTools from 'vite-plugin-vue-devtools'`  
**增强提示（类型安全）**
```js
interface ImportMeta {
   readonly env: ImportMetaEnv;
}
```

