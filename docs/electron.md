---
outline: deep
---

# Electron

## 类型统一与安全

::: info 通知
主要就是在使用`ipcRenderer.invoke(chunnel,..args)`等的`chunnel`必须要确保`chunnel`一致，不一致时会出现问题还要来回查看，这里使用`TS`进行参与和智能提示，简化繁琐`chunnel`的编写和误写。
:::

### ipc主线程类型提示安全

::: code-group

```ts [window.d.ts]
//渲染线程类型拓展用
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

```ts [ipcHelpType.d.ts]
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * 提取对象中所有函数类型的键
 */
type FuncKeys<T> = {
   [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T] &
   string;

/**
 * 提取对象中所有非函数对象类型的键（用于嵌套）
 */
type ObjKeys<T> = {
   [K in keyof T]: T[K] extends (...args: any[]) => any ? never : T[K] extends object ? K : never;
}[keyof T] &
   string;

/**
 * @description 生成所有可能的路径（最多3层嵌套）
 */
type Paths<T> =
   | FuncKeys<T>
   | {
        [K1 in ObjKeys<T>]: `${K1}-${FuncKeys<T[K1]>}`;
     }[ObjKeys<T>]
   | {
        [K1 in ObjKeys<T>]: {
           [K2 in ObjKeys<T[K1]>]: `${K1}-${K2}-${FuncKeys<T[K1][K2]>}`;
        }[ObjKeys<T[K1]>];
     }[ObjKeys<T>];

/**
 * @description 根据路径获取函数类型
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
 */
type FuncArgs<F> = F extends (...args: infer Args) => any ? Args : never;

/**
 * @description 提取函数返回值类型
 */
type FuncReturn<F> = F extends (...args: any[]) => infer R ? R : never;

/**
 * @description 辅助类型 - 用于严格检查返回值类型
 */
type StrictReturnType<T> =
   T extends Promise<infer R> ? Promise<R> | R : T extends void ? void | undefined : T;

/**
 * @description IPC 通道定义类型
 * 将路径映射为包含 channel 和对应函数类型的对象
 */
type IpcChannelMap<T> = {
   [P in Paths<T>]: {
      channel: P;
      args: FuncArgs<GetFunc<T, P>>;
      return: FuncReturn<GetFunc<T, P>>;
   };
};
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

```ts [ipcFactoryType.d.ts]
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * 提取对象中所有函数类型的键
 */
type FuncKeys<T> = {
   [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T] &
   string;

/**
 * 提取对象中所有非函数对象类型的键（用于嵌套）
 */
type ObjKeys<T> = {
   [K in keyof T]: T[K] extends (...args: any[]) => any ? never : T[K] extends object ? K : never;
}[keyof T] &
   string;

/**
 * @description 生成所有可能的路径（最多3层嵌套，不带命名空间前缀）
 */
type Paths<T> =
   | FuncKeys<T>
   | {
        [K1 in ObjKeys<T>]: `${K1}-${FuncKeys<T[K1]>}`;
     }[ObjKeys<T>]
   | {
        [K1 in ObjKeys<T>]: {
           [K2 in ObjKeys<T[K1]>]: `${K1}-${K2}-${FuncKeys<T[K1][K2]>}`;
        }[ObjKeys<T[K1]>];
     }[ObjKeys<T>];

/**
 * @description 生成带命名空间前缀的路径
 * @example NamespacedPaths<'IElectronApi', IElectronApi> = 'IElectronApi-windowControl-minimize' | ...
 */
type NamespacedPaths<NS extends string, T> =
   | {
        [K in FuncKeys<T>]: `${NS}-${K}`;
     }[FuncKeys<T>]
   | {
        [K1 in ObjKeys<T>]: `${NS}-${K1}-${FuncKeys<T[K1]>}`;
     }[ObjKeys<T>]
   | {
        [K1 in ObjKeys<T>]: {
           [K2 in ObjKeys<T[K1]>]: `${NS}-${K1}-${K2}-${FuncKeys<T[K1][K2]>}`;
        }[ObjKeys<T[K1]>];
     }[ObjKeys<T>];

/**
 * @description 根据带命名空间的路径获取函数类型
 */
type GetFuncFromNamespaced<NS extends string, T, P> = P extends `${NS}-${infer Rest}`
   ? GetFunc<T, Rest>
   : never;

/**
 * @description 根据路径获取函数类型
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
 */
type FuncArgs<F> = F extends (...args: infer Args) => any ? Args : never;

/**
 * @description 提取函数返回值类型
 */
type FuncReturn<F> = F extends (...args: any[]) => infer R ? R : never;

/**
 * @description 辅助类型 - 用于严格检查返回值类型
 */
type StrictReturnType<T> =
   T extends Promise<infer R> ? Promise<R> | R : T extends void ? void | undefined : T;

/**
 * @description 用于构建 preload API 的类型
 * 将接口转换为可用于 contextBridge.exposeInMainWorld 的结构
 */
type BuildExposedApi<NS extends string, T> = {
   [K in keyof T]: T[K] extends (...args: infer Args) => infer R
      ? {
           /** IPC 通道名称 */
           channel: `${NS}-${K & string}`;
           /** 调用方法 */
           invoke: (...args: Args) => Promise<Awaited<R>>;
           send: (...args: Args) => void;
        }
      : T[K] extends object
        ? BuildExposedApiNested<`${NS}-${K & string}`, T[K]>
        : never;
};

type BuildExposedApiNested<Prefix extends string, T> = {
   [K in keyof T]: T[K] extends (...args: infer Args) => infer R
      ? {
           /** IPC 通道名称 */
           channel: `${Prefix}-${K & string}`;
           /** 调用方法 */
           invoke: (...args: Args) => Promise<Awaited<R>>;
           send: (...args: Args) => void;
        }
      : T[K] extends object
        ? BuildExposedApiNested<`${Prefix}-${K & string}`, T[K]>
        : never;
};

/**
 * @description IPC 通道定义类型
 */
type IpcChannelMap<T> = {
   [P in Paths<T>]: {
      channel: P;
      args: FuncArgs<GetFunc<T, P>>;
      return: FuncReturn<GetFunc<T, P>>;
   };
};
```

```ts [ipcFactoryMainTypeUtil.ts]
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ipcMain, type IpcMainInvokeEvent, type IpcMainEvent } from 'electron/main';

/**
 * @description 创建带命名空间的类型安全 IPC 管理器
 * @template NS - 命名空间字符串（通常是接口名称）
 * @template T - IPC 接口定义类型
 * @returns 返回一个包含类型化 IPC 方法的对象
 *
 * @usage @example
 * // 定义接口
 * interface IElectronApi {
 *   windowControl: {
 *     minimize: () => void;
 *     maximize: () => void;
 *     close: () => void;
 *   };
 *   app: {
 *     getVersion: () => Promise<string>;
 *   };
 * }
 *
 * // 创建带命名空间的管理器（不需要传递 namespace 参数）
 * const api = createIpcMain<'IElectronApi', IElectronApi>();
 *
 * // 通道名会自动加上命名空间前缀
 * api.handle('IElectronApi-windowControl-minimize', (event) => {
 *   // 处理最小化
 * });
 *
 * api.handle('IElectronApi-app-getVersion', async (event) => {
 *   return '1.0.0';
 * });
 */
export function createIpcMain<NS extends string, T extends Record<string, any>>() {
   type Channel = NamespacedPaths<NS, T>;

   return {
      /**
       * 注册 handle 处理器（用于 invoke 调用）
       */
      handle<P extends Channel>(
         channel: P,
         handler: (
            event: IpcMainInvokeEvent,
            ...args: FuncArgs<GetFuncFromNamespaced<NS, T, P>>
         ) => StrictReturnType<FuncReturn<GetFuncFromNamespaced<NS, T, P>>>
      ): void {
         ipcMain.handle(channel as string, handler);
      },

      /**
       * 注册一次性 handle 处理器
       */
      handleOnce<P extends Channel>(
         channel: P,
         handler: (
            event: IpcMainInvokeEvent,
            ...args: FuncArgs<GetFuncFromNamespaced<NS, T, P>>
         ) => StrictReturnType<FuncReturn<GetFuncFromNamespaced<NS, T, P>>>
      ): void {
         ipcMain.handleOnce(channel as string, handler);
      },

      /**
       * 移除 handle 处理器
       */
      removeHandler<P extends Channel>(channel: P): void {
         ipcMain.removeHandler(channel as string);
      },

      /**
       * 注册事件监听器（用于 send 调用）
       */
      on<P extends Channel>(
         channel: P,
         listener: (event: IpcMainEvent, ...args: FuncArgs<GetFuncFromNamespaced<NS, T, P>>) => void
      ): void {
         ipcMain.on(channel as string, listener);
      },

      /**
       * 注册一次性事件监听器
       */
      once<P extends Channel>(
         channel: P,
         listener: (event: IpcMainEvent, ...args: FuncArgs<GetFuncFromNamespaced<NS, T, P>>) => void
      ): void {
         ipcMain.once(channel as string, listener);
      },

      /**
       * 移除事件监听器
       */
      off<P extends Channel>(
         channel: P,
         listener: (event: IpcMainEvent, ...args: FuncArgs<GetFuncFromNamespaced<NS, T, P>>) => void
      ): void {
         ipcMain.off(channel as string, listener);
      },

      /**
       * 移除指定通道的所有监听器
       */
      removeAllListeners<P extends Channel>(channel: P): void {
         ipcMain.removeAllListeners(channel as string);
      }
   };
}

export const IpcTypeManager = {
   createIpcMain
};
```

:::

::: tip 提示
上诉中使用工厂函数模式在创建实例时一次性绑定，避免每次在调用时指定泛型，TS计算时而有，时而没有的问题。
:::

### preload桥接类型提示安全

避免在桥接渲染进程与主进程通信时，这个`chunnel`以及命名空间提示需求。

这里前提也是需要上诉**ipc主线程类型提示安全**前面四个代码，接上。

::: code-group

```ts [ipcFactoryPreloadTypeUtil.ts]
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ipcRenderer } from 'electron/renderer';

/**
 * @description 创建类型安全的 Preload API 构建器
 * @template NS - 命名空间字符串（通常是接口名称）
 * @template T - IPC 接口定义类型
 * @returns 返回一个类型安全的 API 构建器，用于 contextBridge.exposeInMainWorld
 *
 * @usage @example
 * // 定义接口
 * interface IElectronApi {
 *   windowControl: {
 *     minimize: () => void;
 *     maximize: () => void;
 *     close: () => void;
 *   };
 *   app: {
 *     getVersion: () => Promise<string>;
 *   };
 * }
 *
 * // 创建 API 构建器（不需要传递 namespace 参数）
 * const api = createPreloadApi<'IElectronApi', IElectronApi>();
 *
 * // 使用 - 每一层都有类型提示！
 * contextBridge.exposeInMainWorld('electronApi', {
 *   windowControl: {
 *     // 输入时会提示 minimize, maximize, close
 *     minimize: () => api.send('IElectronApi-windowControl-minimize'),
 *     // channel 名称也有自动提示
 *   },
 *   app: {
 *     getVersion: () => api.invoke('IElectronApi-app-getVersion'),
 *   },
 * });
 */
export function createPreloadApi<NS extends string, T extends Record<string, any>>() {
   type Channel = NamespacedPaths<NS, T>;

   return {
      /**
       * 异步调用主进程的 handle 处理器
       */
      invoke<P extends Channel>(
         channel: P,
         ...args: FuncArgs<GetFuncFromNamespaced<NS, T, P>> extends any[]
            ? FuncArgs<GetFuncFromNamespaced<NS, T, P>>
            : never
      ): Promise<Awaited<FuncReturn<GetFuncFromNamespaced<NS, T, P>>>> {
         return ipcRenderer.invoke(channel as string, ...args);
      },

      /**
       * 向主进程发送消息（无返回值）
       */
      send<P extends Channel>(
         channel: P,
         ...args: FuncArgs<GetFuncFromNamespaced<NS, T, P>> extends any[]
            ? FuncArgs<GetFuncFromNamespaced<NS, T, P>>
            : never
      ): void {
         ipcRenderer.send(channel as string, ...args);
      },

      /**
       * 同步调用主进程（阻塞，谨慎使用）
       */
      sendSync<P extends Channel>(
         channel: P,
         ...args: FuncArgs<GetFuncFromNamespaced<NS, T, P>> extends any[]
            ? FuncArgs<GetFuncFromNamespaced<NS, T, P>>
            : never
      ): FuncReturn<GetFuncFromNamespaced<NS, T, P>> {
         return ipcRenderer.sendSync(channel as string, ...args);
      },

      /**
       * 监听主进程消息
       */
      on<P extends Channel>(
         channel: P,
         callback: (
            ...args: FuncArgs<GetFuncFromNamespaced<NS, T, P>> extends any[]
               ? FuncArgs<GetFuncFromNamespaced<NS, T, P>>
               : never
         ) => void
      ): () => void {
         const listener = (_event: any, ...args: any[]) => {
            (callback as (...a: any[]) => void)(...args);
         };
         ipcRenderer.on(channel as string, listener);
         return () => {
            ipcRenderer.off(channel as string, listener);
         };
      },

      /**
       * 监听主进程消息（只触发一次）
       */
      once<P extends Channel>(
         channel: P,
         callback: (
            ...args: FuncArgs<GetFuncFromNamespaced<NS, T, P>> extends any[]
               ? FuncArgs<GetFuncFromNamespaced<NS, T, P>>
               : never
         ) => void
      ): void {
         ipcRenderer.once(channel as string, (_event, ...args) => {
            (callback as (...a: any[]) => void)(...(args as any));
         });
      },

      /**
       * 获取通道名称的辅助方法（用于类型提示）
       */
      channel<P extends Channel>(channel: P): P {
         return channel;
      }
   };
}

/**
 * @description 创建类型安全的 exposeInMainWorld API 结构定义
 * 这个类型用于帮助开发者在手写 contextBridge.exposeInMainWorld 时获得完整的类型提示
 *
 * @usage @example
 * interface IElectronApi {
 *   windowControl: {
 *     minimize: () => void;
 *     maximize: () => void;
 *   };
 * }
 *
 * // 使用类型约束（不需要传递 namespace 参数）
 * const api = createPreloadApi<'IElectronApi', IElectronApi>();
 *
 * // 定义符合接口结构的 API
 * const electronApi: ExposedApiStructure<IElectronApi> = {
 *   windowControl: {
 *     minimize: () => api.send('IElectronApi-windowControl-minimize'),
 *     maximize: () => api.send('IElectronApi-windowControl-maximize'),
 *   },
 * };
 *
 * contextBridge.exposeInMainWorld('electronApi', electronApi);
 */
export type ExposedApiStructure<T> = {
   [K in keyof T]: T[K] extends (...args: infer Args) => infer R
      ? (...args: Args) => R extends Promise<any> ? R : Promise<R> | void
      : T[K] extends object
        ? ExposedApiStructure<T[K]>
        : never;
};

/**
 * @description 获取所有带命名空间的通道名称类型
 * 用于在手写 ipcRenderer.send/invoke 时获得通道名提示
 */
export type GetChannels<NS extends string, T extends Record<string, any>> = NamespacedPaths<NS, T>;

export const IpcRendererManager = {
   createPreloadApi
};
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
