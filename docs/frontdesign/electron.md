---
outline: deep
---

# Electron

## 类型统一与安全

### ipc类型提示

```ts
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

### preload IPC类型安全

为了解决`ipcRenderer.invoke(chunnel,args)`其中的chunnel和args类型安全问题，主要是防止人为写错，还有调试困难等问题。解决方案如下：

**传递实体**

```ts
//ipc-entity.d.ts
declare interface IUserQuery {
   user: {
      getUserData: () => Promise<string>;
   };
}
declare interface IpcQuery extends IUserQuery {}
declare interface IElectronApi {
   query: IpcQuery;
}
```

**类型转换工具**

```ts
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
```

**模拟ipcRenderer.invoke(也即模仿原生ipcRenderer.invoke行为，防止类型出错)**

```ts
///<reference path="./ipc-type-util.d.ts" />
//ipcRenderer.util.ts
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
 *   getUserData: () => Promise<string>;
 *   requireParam: (id: string) => Promise<void>;
 *  }
 * }
 * ipcRendererInvoke<IpcQuery>('user-getUserData');  // 自动推断 chunnel
 * ipcRendererInvoke<IpcQuery>('user-requireParam', 'abc123');  // 自动推断args类型
 *
 * //这里会报错，显示number不能赋值给string
 * //这时就避免了ipcRenderer.invoke('user-requireParam',123)，其中key写错还有arg类型错误
 */
export function ipcRendererInvoke<T extends Record<string, any>, P extends Paths<T> = Paths<T>>(
   path: P,
   ...args: FuncArgs<GetFunc<T, P>>
): FuncReturn<GetFunc<T, P>> {
   return ipcRenderer.invoke(path as string, ...args) as FuncReturn<GetFunc<T, P>>;
}
```

### preload自动桥接

preload中的`contextBridge`其中的`exposeXXX`方法中，第二个参数api是一个对象，因此可以通过`自动装配`思想，去自动装配这个对象，从而代替了ts的类型安全，就避免了不用写繁杂的`ipcRendererInvoke`（同上诉）的方法了。

ipc类型实体同[这里](#preload-ipc类型安全)中的**传递实体**可以看到，这里是演示，实际上可以替换掉的。

下面这个文件主要就是完成类型映射，将函数类型转化为**boolean**类型

```ts
//ipcRenderer.util.ts
//...
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
 *       getUserData: false, // ❌ 类型错误 - 必须是 true
 *     }
 *   }
 * }
 */
type IElectronApiConfig = ToFunctionMarker<IElectronApi>;
```

下面是完成**自动装配对象**

```ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ipcRenderer } from 'electron/renderer';

/**
 * @description 根据类型定义递归构建真实的桥接对象
 * @template T - API 类型定义
 * @param paths - 路径配置对象,结构与类型定义一致
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

下面是演示自动桥接使用，这个`IElectronApiConfig`对应`ToFunctionMarker<IElectronApi>`

```ts
//使用示例
const apiConfig: IElectronApiConfig = {
   query: {
      user: {
         getUserData: true,
       - nihao:false //这里为false会报错
      }
   },
};
contextBridge.exposeInMainWorld('electronApi', autoAssembleBridge<IElectronApi>(apiConfig));

```
