---
outline: deep
---

# Electron

## 类型统一与安全

解决ipcRenderer.invoke(chunnel,..args)和ipcMain.handle(chunnel,(e,..args))=>ReturnType的chunnel提示和参数类型安全以及返回类型安全等问题。进一步简化繁琐函数的编写。

### ipc类型提示

::: code-group

```ts [window.d.ts]
declare global {
   interface Window {
      /**
       * @description 渲染进程调用主线程提供的api
       */
      electronApi: IElectronApi;
   }
}

// global默认是模块作用域,需要显式导出才能成为全局声明文件
export {};
```

```ts [ipc.d.ts]
//ipc.d.ts
declare interface IElectronTest {
   nihao1: (s: string) => void;
   nihao2: (s: string) => string;
   //....
}
declare interface IElectronApi {
   test: IElectronTest;
}
```

```ts [ipc-util-type.d.ts]
/* eslint-disable @typescript-eslint/no-explicit-any */
//ipc-type-util.d.ts
/**
 * @description 递归生成所有可能的路径（限制深度5层嵌套）
 * @usage @example
 * type User = {
 *  nihao: () => void;
 *  query:{
 *   getUserData: () => Promise<UserData>;
 *  }
 * !name:string; // 非函数属性会被忽略,不会出现在路径中
 * }
 * type UserPaths = Paths<User>; // "nihao" | "query-getUserData"
 */
type Paths<T, Prefix extends string = '', Depth extends any[] = []> = Depth['length'] extends 5 // 限制递归深度为5
   ? never
   : T extends (...args: any[]) => any
     ? Prefix
     : {
          [K in keyof T & string]: T[K] extends (...args: any[]) => any
             ? Prefix extends ''
                ? K
                : `${Prefix}-${K}`
             : T[K] extends object
               ? Paths<T[K], Prefix extends '' ? K : `${Prefix}-${K}`, [...Depth, 1]>
               : never;
       }[keyof T & string];

/**
 * @description 根据路径获取函数类型
 * @usage @example
 * type User = {
 *  nihao: () => void;
 * }
 * type FuncType = GetFunc<User, 'nihao'>; // () => void
 */
type GetFunc<T, P> = P extends `${infer First}-${infer Rest}`
   ? First extends keyof T
      ? GetFunc<T[First], Rest>
      : never
   : P extends keyof T
     ? T[P]
     : never;

/**
 * @description 提取函数参数类型
 * @usage @example
 * type FuncType = (a: string, b: number) => void;
 * type Args = FuncArgs<FuncType>; // [string, number]参数类型元组
 */
type FuncArgs<F> = F extends (...args: infer Args) => any ? Args : never;

/**
 * @description 提取函数返回值类型
 * @usage @example
 * type FuncType = () => string;
 * type ReturnType = FuncReturn<FuncType>; // string
 */
type FuncReturn<F> = F extends (...args: any[]) => infer R ? R : never;

/**
 * @description 辅助类型 - 用于严格检查返回值类型
 * 如果期望返回 void，则只能返回 void 或 undefined
 * 如果期望返回 Promise<T>，则可以返回 Promise<T> 或 T（会被自动包装）
 * 否则必须返回精确匹配的类型
 */
type StrictReturnType<T> =
   T extends Promise<infer R>
      ? Promise<R> | R // 允许同步返回值，ipcMain.handle 会自动包装
      : T extends void
        ? void | undefined // void 只能返回 void 或 undefined
        : T; // 其他类型必须精确匹配
```

```ts [ipc-util.ts]
///<reference path="./ipc-type-util.d.ts" />

import { ipcRenderer } from 'electron/renderer';

/**
 * @description 根据传递的类型，自动推断路径和参数类型（类型安全）
 * @template T - 目标对象的类型，必须是一个记录类型
 * @template P - 方法路径字符串，自动推断为 T 中所有可能的有效路径(也就是 Paths<T>)
 * @param path 路径字符串
 * @param args 参数
 * @returns 函数返回类型
 *
 * @usage @example
 * interface IpcQuery {
 *  user:{
 *   getUserData: (id:string) => Promise<string>;
 *  }
 * }
 * ipcRendererInvoke<IpcQuery>('user-getUserData',id);  // 自动推断 chunnel，和id类型
 */
export function ipcRendererInvoke<T extends Record<string, any>, P extends Paths<T> = Paths<T>>(
   path: P,
   ...args: FuncArgs<GetFunc<T, P>>
): FuncReturn<GetFunc<T, P>> {
   return ipcRenderer.invoke(path as string, ...args) as FuncReturn<GetFunc<T, P>>;
}

/**
 * @description 对 ipcMain.handle 的类型安全封装
 * @template T - 目标对象的类型，必须是一个记录类型
 * @template P - 方法路径字符串，自动推断为 T 中所有可能的有效路径(也就是 Paths<T>)
 * @param channel - IPC 通道名称，自动推断和提示
 * @param handler - 处理函数，第一个参数是 event，后续参数自动推断类型，返回值类型也会严格检查
 * @returns void
 *
 * @usage @example
 * interface IElectronNihao2 {
 *   nihao2: (s: string) => void;
 * }
 *
 * // 使用示例：
 * ipcMainHandle<IElectronNihao2>('nihao2', (event, s) => {
 *   // s 的类型会自动推断为 string
 *   console.log(s);
 *   // 如果 return ''; 会报错，因为返回值应该是 void
 * });
 *
 * interface IpcQuery {
 *   user: {
 *     getUserData: () => Promise<string>;
 *   }
 * }
 *
 * // 嵌套路径示例（这个chunnel同ipcRendererInvoke一样）[!code error]：
 * ipcMainHandle<IpcQuery>('user-getUserData', async (event) => {
 *   // 返回值类型会被推断为 Promise<string>
 *   return 'user data';
 * });
 *
 */
export function ipcMainHandle<T extends Record<string, any>, P extends Paths<T> = Paths<T>>(
   channel: P,
   handler: (
      event: IpcMainInvokeEvent,
      ...args: FuncArgs<GetFunc<T, P>>
   ) => StrictReturnType<FuncReturn<GetFunc<T, P>>>
): void {
   ipcMain.handle(channel as string, handler);
}

/**
 * @description 移除 IPC 处理器
 * @template T - 目标对象的类型
 * @template P - 方法路径字符串
 * @param channel - 要移除的 IPC 通道名称
 *
 * @usage @example
 * ipcMainHandleRemove<IElectronNihao2>('nihao2');
 */
export function ipcMainHandleRemove<T extends Record<string, any>, P extends Paths<T> = Paths<T>>(
   channel: P
): void {
   ipcMain.removeHandler(channel as string);
}
```

:::

### preload自动桥接

::: tip 自动装配
在`contextBridge`方法中的`exposeXXX`，第二个参数api是一个对象，并且preload在electron只是做转发的话，那么完全可以自动装配这个对象

- ts类型安全，不用在意chunnel的写错了
- 避免繁杂的转发方法的编写

:::

::: warning 注意
由于ipcRenderer.invoke默认是`异步的`，因此完全不用担心在preload中前面加`async`是否有啥影响。

核心就是preload只是负责转发，也是main和render的桥梁，因此它只是返回对应值，然后传递给render即可

```ts
contextBridge.exposeInMainWorld('electronApi', {
   nihao: async () => ipcRendererInvoke('nihao') //前面加与不加async没区别，因为逻辑处理不在这，自然而然不用await[!code --]
   nihao: () => ipcRendererInvoke('nihao') //[!code ++]
});
```

:::

::: code-group

```ts [type.d.ts]
/**
 * 由于electron ipc调用基于事件回调,没有属性值,所以true标记是强制标记，为false会报错
 * @description 将接口中的函数类型转换为 boolean 标记，默认为true
 * @template T - 源类型
 * @usage @example
 * type Original = {
 *   query: {
 *     user: {
 *       getUserData: () => Promise<string>;
 *       getName: (id: string) => Promise<string>;
 *     }
 *   }
 * }
 * type Config = ToFunctionMarker<Original>;
 * // 结果:
 * // {
 * //   query: {
 * //     user: {
 * //       getUserData: true;
 * //       getName: true;
 * //     }
 * //   }
 * // }
 */
type ToFunctionMarker<T> = {
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   [K in keyof T]: T[K] extends (...args: any[]) => any
      ? true // 如果是函数,转换为 true
      : T[K] extends object
        ? ToFunctionMarker<T[K]> // 如果是对象,递归转换
        : T[K]; // 其他类型保持不变
};

/**
 * @description IElectronApi 的配置类型
 * 使用示例:
 * const config: IElectronApiConfig = {
 *   query: {
 *     user: {
 *       getUserData: true,  // ✅ 类型正确
 *       getUserData: false, // ❌ 类型错误 - 必须是 true [!code error]
 *     }
 *   }
 * }
 */
```

```ts [auto-assemble-util.ts]
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ipcRenderer } from 'electron/renderer';

/**
 * @description 根据类型定义递归构建真实的桥接对象
 * @template T - API 类型定义
 * @param paths - 路径配置对象,结构与类型定义一致
 * @return @type T 根据T返回对应返回值类型
 * @returns 可通过 contextBridge 传递的真实对象
 *
 * @usage @example
 * // 定义路径结构(与类型定义一致)
 * const config = {
 *   query: {
 *     user: {
 *       getUserData: true,  // true 表示这是一个函数
 *     }
 *   }
 * };
 *
 * // 自动生成桥接对象
 * const api = autoAssembleBridge<IElectronApi>(config);
 * // 示例结果:
 * // {
 * //   query: {
 * //     user: {
 * //       getUserData: (...args) => ipcRenderer.invoke('query-user-getUserData', ...args)
 * //     }
 * //   }
 * // }
 */
export function autoAssembleBridge<T extends Record<string, any>>(
   config: Record<string, any>,
   prefix: string = ''
): T {
   const result: any = {};

   for (const key in config) {
      const value = config[key];
      const currentPath = prefix ? `${prefix}-${key}` : key;

      if (value === true) {
         // 叶子节点: 函数
         result[key] = (...args: any[]) => {
            return ipcRenderer.invoke(currentPath, ...args);
         };
      } else if (typeof value === 'object' && value !== null) {
         // 中间节点: 递归构建
         result[key] = autoAssembleBridge(value, currentPath);
      }
   }
   return result as T;
}
```

```ts [example.ts]
/**
 * interface IElectronApi{
 *  query:{
 *    user:{
 *       getUserData
 *    }
 *  }
 * }
 * //相当将函数类型转化为boolean类型，简化判断是否为函数
 * IElectronApiConfig = ToFunctionMarker<IElectronApi>
 */
//使用示例
const apiConfig: IElectronApiConfig = {
   //[!code warning]
   //如果嫌弃这里编写麻烦，在确认类型全部为函数的前提下，完全可以再次封装，自动映射
   //[!code warning]
   //因为不可能为false，那么就不需要额外的判断逻辑，直接置为true即可
   query: {
      user: {
         getUserData: true,
         nihao: false //这里为false会报错，因为不可能调用一个字段的 [!code error]
      }
   }
};
contextBridge.exposeInMainWorld('electronApi', autoAssembleBridge<IElectronApi>(apiConfig));
```

:::

## 打包路径问题

Electron应用在打包后无法解析以`/`开头的绝对路径，即使配置了`publicDir`，这会在开发环境下有用，但是在打包环境中，这种路径引用方式会失效。

解决思路是**交给Vite处理**，让`Vite`在构建时处理资源路径，从而避免路径问题。例如使用资源加载形式加载`import logo from '/assets/vue.svg'`，这样在开发模式和打包模式下都能正常工作。
