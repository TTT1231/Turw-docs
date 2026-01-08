---
outline: deep
---

# WebAssembly

`WebAssembly`用于在跨平台中，游览器/`Nodejs`调用C++/C代码，用来解决`JS`在CPU密集计算任务下的缺点问题。

如果是在Nodejs环境下，需要考量需不需要支持跨平台，这里指的是**游览器**，同时也需要考量开销问题和沙箱安全问题。由于wasm执行需要wasm VM开销以及内存开销以及调用开销，因此它不适合用于高频调用，只适合低频次高CPU计算场景，同时由于它的特性不能访问`Nodejs`和`DOM`如果需要时只能通过手动授权调用访问，执行沙箱安全。

`wasm`格式适合简单的高CPU计算也即纯计算，不适合复杂场景，如果涉及一些IO异步和运行时的话就需要`js`格式。这里是讨论`emcc`打包代码为`wasm`和`js`格式场景。

Emscripten会将`C++`通过`Clang + LLVM`转化中间件IR代码，而后Emscripten复杂将IR代码转化wasm，并打通wasm与游览器和Nodejs(取决对应环境)的交互问题。

::: tip WebAssembly和Web Workers
`Web Workers`侧重解决并发问题，不阻塞JS执行主线程，而卡顿UI。

`WebAssembly`侧重解决`JS`计算性能问题，来提高`JS`执行高CPU密集型计算任务的提速，类似提高`JS`计算性能。

两者一般一起使用，来最大程度追求性能，当然这是在`Web`场景下。
:::

## 编译执行差异

`emcc`可以将cpp代码编译成`.wasm`和`.js`格式，这里讨论这两种编译差异和执行差异。

::: info wasm
`.wasm`是二进制可执行代码，可以被缓存性能最好无`JS`包裹性能损耗，但是需要手动写JS加载和调用，但是只适合简单高密集型CPU计算，不适合复杂逻辑。

执行过程：加载 → 验证 → 编译 → 实例化 → 桥接 JS → 执行 /（环境层面WASM资源） 回收。

`wasm`编译后，包含编译后的函数逻辑（字节码格式），函数签名和导出信息等，不包含有关原始代码信息，例如C++源代码、编译器、标准库（这里除了用到并静态链接）等。

在执行阶段的编译阶段，由对应的JIT编译器（取决于环境）中V8（WebAssembly执行引擎）全量直接编译为CPU本地机器码，而后实例化，进行WASM与JS交互。

针对时间开销而言：wasm执行存在加载wasm文件开销，而后就是解析和验证开销，而后就是wasm字节码->V8编译器->本地机器码开销，而后就是JS<->wasm调用开销。
:::

::: info js
`.js`是文本格式代码，由`emcc`编译时会包含胶水代码用于加载和初始化 wasm 模块，适合复杂逻辑场景，包含异步IO、运行时交互等。

执行过程：JS加载 → 解析(生成AST) → 字节码生成 → 解释执行(Ignition) → JIT编译优化(TurboFan) → 执行优化后机器码 → 垃圾回收。

在 V8 引擎中，JS 代码首先被解析成抽象语法树（AST），然后通过 Ignition 解释器生成字节码并执行。对于频繁执行的热点代码，TurboFan 优化编译器会将其编译成高度优化的机器码以提升性能。

针对时间开销而言：JS执行存在解析开销（词法/语法分析生成AST），字节码生成开销，解释执行开销，以及热点代码的JIT编译优化开销。相比 wasm 的提前编译（AOT），JS 是边解释边执行的即时编译（JIT）模式。
:::

> [!IMPORTANT] 重要
> JS代码实际调用路径：JS → Emscripten包装层 → WebAssembly。
>
> wasm实际调用路径：JS → WebAssembly。
>
> 因此在调用耗时方面，wasm直接调用比JS代码执行快，没有包装层开销。

::: tip 提示
js提供了完整的`C++`操作，例如类、指针、异常处理、内存管理等。而wasm只能用于简单计算。
:::

::: danger 危险
`JS`只是Emscripten帮你手动完成了自动创建内存、设置imports和查找加载wasm文件、全局对象的构造函数初始化以及自动实例化初始化等操作，也就是这个JS是胶水代码和管理器、自动化操作，真正`C++`逻辑在wasm中。

该过程本质上也是Emscripten抽象了手动写的时候管理的混乱问题，最基本核心也是依赖wasm文件的，因此使用`JS`时，这个wasm不能删掉，
两者是一起用的。

特别是一些标准库和`C++`特性使用时，在纯wasm需要手写js自己实现标准库支持和配置`C++`特性，这个效果是没有Emscripten管理的好，而且手动实现难度较大，而且容易造成内存泄漏和管理等问题。
:::

### 输出与模块化

## 类型安全

这里类型使用**Emscripten自动生成**的最好，这最能精准知道导出什么需要什么，里面有什么，保证了wasm编译器编译和实际使用一致。

wasm和js两种格式，最后生成的`.d.ts`文件类型都是一样的。

进行类型安全的时候，要注意[模块导出问题](#导出模块问题)。

::: warning 注意
`emcc`生成的`.d.ts`类型文件，在工厂函数转化后，类型不安全，会被判断为unknown形式还有wasm运行时类型缺失，例如内存管理、I/O、文件系统、声明周期钩子。因此需要手动进行类型补全，如果需要类型安全前提下。

这是在加上转化为工厂函数前提下`-sMODULARIZE`让初始化变为异步，如果是`emcc`生成的类型文件会如下:

```ts
// TypeScript bindings for emscripten-generated code.  Automatically generated at compile time.
interface WasmModule {
   _main(_0: number, _1: number): number;
}

export type MainModule = WasmModule;
export default function MainModuleFactory(options?: unknown): Promise<MainModule>;
```

可以看到类型缺失了，还有wasm运行时类型，这时候需要进行手动补全，如下::: code-group

```ts
/// <reference types="emscripten" />

interface WasmModule {
   _main(_0: number, _1: number): number;
}
export type MainModule = WasmModule;
export default function MainModuleFactory(
   options?: Partial<EmscriptenModule>
): Promise<MainModule & EmscriptenModule>;
```

这样会有点类型略显冗余，可以直接使用TS继承类型即可:

```ts
/// <reference types="emscripten" />

export interface MainModule extends EmscriptenModule {
   _main(_0: number, _1: number): number;
}

export default function MainModuleFactory(options?: Partial<MainModule>): Promise<MainModule>;
```

上面这个MainModule只是`emcc`自动生成的一个模块。
:::

::: tip 工厂函数类型为什么是这样的？
这个类型在官方类型包中就定义了这个工厂函数类型。

```ts
/**
 * @param moduleOverrides 模块覆盖配置
 * @return 完整模块实例
 */
type EmscriptenModuleFactory<T extends EmscriptenModule = EmscriptenModule> = (
   moduleOverrides?: Partial<T>
) => Promise<T>;
```

`EmscriptenModule`是模块类型，有双重用途。

```ts
//用途1：作为工厂函数参数配置对象
const module = await createModule({
   print: (msg) => console.log(msg)
   //....
});

//用途2：作为模块实例
const module = await createModule(/** ... */);
module.print('some print'); //配置函数
module._malloc(100); //运行时生成函数
//....
```

:::

::: danger bind模块类型
`EmbindModule`模块不需要继承任何东西，它只定义了你通过`EMSCRIPTEN_BINDINGS`暴露的类型，这些类型是c++代码特有的，与emcc基础设施无关，最终会与其他接口合并。
:::

::: tip 使用方法

在`emcc`进行编译时，只需要在命令末尾加上`--emit-tsd`，而后跟文件名和类型即可，例如`qwe.d.ts`。

:::

### 游览器类型安全

由于游览器没有内置了`emscripten`类型需要下载`@types/emscripten`，在使用`JS Module`时可以进行拓展，但是由于`emscripten`是类型文件不是一个模块，因此需要三斜线，然后对类型进行拓展。

```ts
/// <reference types="emscripten" />

export interface MyModule extends EmscriptenModule {
   // 声明你需要使用的导出函数
   _add: (a: number, b: number) => number;
}

export {};
```

### Nodejs环境下类型安全

`Nodejs`中没有内置`emscripten`类型，因此需要手动下载或者定义，然后对需要的代码进行自定义声明和拓展自定义类型，完成类型安全。

::: code-group

```sh:no-line-numbers [pnpm.sh]
pnpm install @types/emscripten -D
```

```sh:no-line-numbers [npm.sh]
npm install --save-dev @types/emscripten
```

:::

然后类型拓展同游览器类型拓展一样使用即可。

## 注意事项

### 方法的\_问题

在标准`c++`代码中，Emscripten会将格式化掉原始方法的参数名，例如：

```cpp
//这里在没有使用条件下会被Emscripten删除掉，除非手动指定
//同时这个add会被格式化掉，类似_Z3addii这种格式
int add(int x,int y){
   return x+y;
}
int main(){
   return 0;
}
```

可以使用`extern "C"`禁用改名和手动指定不要删除。

```cpp
#include <emscripten/emscripten.h>

extern "C" {
  //也可以不要这个，在emcc中导出函数，效果也是类似的。
  EMSCRIPTEN_KEEPALIVE  // ←Emscripten宏，告诉编译器：不要删除这个函数！
  int add(int a, int b) {
    return a + b;
  }
}
```

::: warning 注意
注意，在`extern "C"`的时候，会将函数参数名前面手动加上`_`，上诉就是`_add`，之所以加上就是符合Emscripten的开发C函数命名标准。
差异就是体现在调用时，例如当加载`JS`或者wasm的时候，调用函数前面会有\_标识，表示这是wasm生成的C函数代码。

`C++`类、类方法等不会自动加，也不能使用`extern "C"`修饰，`extern "C"`只能修饰普通函数，会给普通函数自动添加`_`。
:::

### 导出模块问题

`emcc`模块导出模块方式是`UMD`格式，该格式兼容游览器、`Nodejs`、`AMD`多环境，在游览器中会挂载在windows.Module下，在`Nodejs`依赖`module.exports`这种commonJS形式。

同时默认情况下会立即同步执行。这种格式虽然很兼容但是使用方法很少，因此实际上会将其转化为`ES`形式，完成异步按需加载避免阻塞主线程。

::: warning 注意
`-sEXPORT_ES6=1`启用`ES`导出的时候，`emcc`只会解决模块导出问题，并不会控制如何进行初始化，此时任然还是同步初始化，会在引入模块时立即完成模块初始化工作。

这返回的是已经初始化的对象，同时不能传递配置参数，还有在webAssembly初始化异步情况下，会无法自定义初始化参数和加载完成前立即调用函数会崩溃情况。

因此它会和`-sMODULARIZE=1`启用工厂函数转化，`emcc`会异步加载wasm文件，此时能够正确处理异步初始化、传递配置参数、不会阻塞页面加载情况。
:::

::: tip 提示
上诉可以理解成这样，`-sMODULARIZE=1`让初始化变为异步，`-sEXPORT_ES6=1`转化ES6形式。因而实际中，两者要配合使用，并启用。
:::

::: danger 危险
如果按照[类型安全解决](#类型安全)进行类型安全，这里会出现在游览器`import(js)`的时候会找不到这个文件的声明文件，TS断言成any会报类型错误，如果按照下面进行类型声明会出现问题

```ts
/// <reference types="emscripten" />

export interface MainModule extends EmscriptenModule {
   _main(_0: number, _1: number): number;
}

export default function MainModuleFactory(options?: Partial<MainModule>): Promise<MainModule>;

//[!code error]
//!error1:这里问题主要出现在内部，MainModuleFactory和MainModule作用域不存在，有顶级export。
//[!code error]
//!error2:同时declare module 会创建一个隔离的作用域，因此在作用域内部没有MainModule和MainModuleFactory两个类型

declare module 'path/to/js' {
   export { MainModuleFactory as default, MainModule };
}
```

**特别注意：** 模块匹配规则，也就是这个`path/to/js`如果是相对路径或者具体包名，declare作用域规则会严格隔离，不能访问外部类型和全局类型，如果是路径别名`@`或者通配符`*`则TS作用域规则较为宽松，可以访问外部类型和全局类型。

这是由于declare的路径从当前路径出发的，外部的`import(js)`从外部初始路径出发，两者会严格对比，此时路径字符串会不一样，但是最终都是指向同一个文件，相对路径和具体包名就报类型错误了。

按照下面方法进行类型安全就可以了，下面之所以分成两个文件，一个就是模块声明文件，另外一个就是供给外部使用类型文件，主要是避免写在一个文件中由于export和declare矛盾，导致`import(js)`失败，报类型错误问题。

```ts
//[wasm-module].d.ts
declare module '@/path/to/target.js' {
   interface WasmModule extends EmscriptenModule {
      _main(_0: number, _1: number): number;
   }

   type MainModule = WasmModule;

   const factory: (options?: Partial<MainModule>) => Promise<MainModule>;
   export default factory;
   export type { MainModule, WasmModule };
}
```

```ts
/// <reference types="emscripten" />
//[wasm-type].d.ts

export interface WasmModule {
   _main(_0: number, _1: number): number;
}

export type MainModule = WasmModule;

export type MainModuleFactory = (options?: Partial<MainModule>) => Promise<MainModule>;
```

:::

### 函数指针问题

该问题报错主要原因就是：编译器对类型比较宽容，强制转换后仍然能运行，但是WebAssembly有严格类型检查，函数签名必须完全匹配才不会报`abort(10)`和`Invalid function pointer called`错误。例如：

```cpp
// 定义一个函数指针类型：void 返回值，接受 const char* 参数
typedef void(*voidReturnType)(const char *);

// 三个不同签名的函数：
void voidReturn(const char *message) { ... }        //  签名匹配
//[!code warning]
int intReturn(const char *message) { ... }          // 返回 int 而不是 void
//[!code warning]
void voidReturnNoParam() { ... }                    //  没有参数

voidReturnType functionList[3];
// 把它们都强制转换成同一类型
functionList[0] = voidReturn;                        //  正常，没有涉及到强制转换，类型严格
//[!code error]
functionList[1] = (voidReturnType)intReturn;         //  Emscripten 会报错，在调用时签名不同会失败，`int a = functionList[1]("")`
//[!code error]
functionList[2] = (voidReturnType)voidReturnNoParam; //  Emscripten 会报错，在调用时签名不同会失败，`functionList[2]()`
```

::: tip 解决思路
模拟一个签名一样的包装函数，去欺骗emcc编译器，然后在内部调用原函数，但是这必须要忽略返回类型。

```cpp
//签名一样
void intReturnAdapter(const char* message){
   //!返回值只能在该函数内进行处理
   intReturn(message);
}
//这样就不会报错
functionList[1] = intReturnAdapter;
```

:::

> [!IMPORTANT] 重要
>
> - `sASSERTIONS`为emcc的运行时断言检查(函数指针、类型匹配等)
> - `sSAFE_HEAP`为emcc的内存访问边界检查，能看到越界访问、空指针引用等指针问题。
>
> 开发时可用开启这两个进行检查，`emcc -sSAFE_HEAP -sASSERTIONS test.cpp`

## 宏相关

### 常用宏

::: tip 类绑定相关

- `EMSCRIPTEN_BINDINGS`绑定入口点
- `class_<T>(name)`绑定C++类到JS
- `constructor<Args...>()`导出类构造函数
- `function(name, &Class::method)`导出成员函数
- `function(name, &functionPtr)`导出全局函数
- `property(name, &getter, &setter)`导出可读写属性
- `property(name, &getter)`导出只读属性
- `select_overload<Signature>(&method)`解决函数重载
- `class_function(name, &Class::staticMethod)`导出静态方法
- `class_property(name, &getter, &setter)`类静态属性导出

:::

::: tip 值类型和枚举

- `enum_<T>(name)`绑定枚举类型
- `value(name, EnumValue)`导出枚举值
- `value_object<T>(name)`绑定简单结构体
- `field(name, &T::member)`导出结构体字段

:::

::: tip 内存和智能指针

- `smart_ptr<std::shared_ptr<T>>()`绑定智能指针
- `EMSCRIPTEN_KEEPALIVE`防止函数被优化掉

:::

::: tip 继承和多态

- `base<BaseClass>()`声明类继承关系
- `allow_subclass<Wrapper>(name)`允许 JS 继承 C++ 类
- `pure_virtual(&Class::method)`标记纯虚函数
- `optional_override(callback)`可选重写虚函数

:::

::: tip 常量和数组

- `constant(name, value)`导出编译时常量
- `value_array<T>(name)`绑定固定大小数组
- `element(index_func)`自定义数组索引访问

:::

::: tip 异步和主循环

- `emscripten_set_main_loop`设置主循环（游戏/动画）
- `EM_ASYNC_JS(...)`异步 JavaScript 函数
- `await()`等待 Promise

:::

::: tip 其他场景

|      场景      |               命令                |         描述          |
| :------------: | :-------------------------------: | :-------------------: |
|    网络请求    |        `emscripten_fetch`         | C++调用JS发起网络请求 |
| HTML5 事件回调 | `emscripten_set_keydown_callback` | C++监听键盘鼠标等事件 |
|   WebGL 相关   |       `emscripten_webgl_*`        | C++调用WebGL渲染图形  |
|  Worker/线程   |       `emscripten_webgl_*`        |    C++到Web Worker    |

:::

### 完整宏

::: details

**1. 核心绑定宏（bind.h）**

| 宏名称                              | 作用                  |
| :---------------------------------- | :-------------------- |
| `EMSCRIPTEN_BINDINGS(name)`         | 定义绑定块            |
| `EMSCRIPTEN_DECLARE_VAL_TYPE(type)` | 声明可用作 val 的类型 |
| `EMSCRIPTEN_SYMBOL(sym)`            | 符号声明              |

**2. 类绑定链式方法**

| 方法名                                   | 作用         |
| :--------------------------------------- | :----------- |
| `class_<T>(name)`                        | 开始绑定类   |
| `.constructor<Args...>()`                | 绑定构造函数 |
| `.function(name, ptr, policy)`           | 绑定成员函数 |
| `.class_function(name, ptr, policy)`     | 绑定静态函数 |
| `.property(name, getter, setter)`        | 绑定属性     |
| `.class_property(name, getter, setter)`  | 绑定静态属性 |
| `.base<BaseClass>()`                     | 声明继承关系 |
| `.smart_ptr<PtrType<T>>()`               | 绑定智能指针 |
| `.smart_ptr_constructor(name, func)`     | 智能指针构造 |
| `.allow_subclass<Wrapper>(name, policy)` | 允许 JS 继承 |

**3. 值类型绑定**

| 方法名                     | 作用             |
| :------------------------- | :--------------- |
| `value_object<T>(name)`    | 绑定值对象       |
| `.field(name, &T::member)` | 绑定字段         |
| `value_array<T>(name)`     | 绑定数组类型     |
| `.element(&T::operator[])` | 绑定数组元素访问 |
| `.element(index_func)`     | 自定义索引访问   |

**4. 枚举绑定**

| 方法名                    | 作用       |
| :------------------------ | :--------- |
| `enum_<T>(name)`          | 绑定枚举   |
| `.value(name, EnumValue)` | 绑定枚举值 |

**5. 函数绑定**

| 方法名                        | 作用           |
| :---------------------------- | :------------- |
| `function(name, ptr, policy)` | 绑定全局函数   |
| `select_overload<Sig>(ptr)`   | 选择重载版本   |
| `optional_override(func)`     | 可选重写虚函数 |
| `pure_virtual(&Class::func)`  | 纯虚函数标记   |

**6. 常量和变量**

| 方法名                  | 作用     |
| :---------------------- | :------- |
| `constant(name, value)` | 绑定常量 |

**7. 内存和所有权策略宏（emscripten.h）**

| 宏名称                            | 作用                 |
| :-------------------------------- | :------------------- |
| `EMSCRIPTEN_KEEPALIVE`            | 防止函数被优化删除   |
| `EMSCRIPTEN_WEBGL_CONTEXT_HANDLE` | WebGL 上下文句柄类型 |
| `EMSCRIPTEN_RESULT`               | 返回结果代码类型     |

**8. 内联 JavaScript 宏（emscripten.h）**

| 宏名称                              | 作用                |
| :---------------------------------- | :------------------ |
| `EM_ASM(...)`                       | 内联 JS 代码        |
| `EM_ASM_(...)`                      | 内联 JS（无返回）   |
| `EM_ASM_INT(...)`                   | 内联 JS 返回 int    |
| `EM_ASM_DOUBLE(...)`                | 内联 JS 返回 double |
| `EM_ASM_PTR(...)`                   | 内联 JS 返回指针    |
| `EM_JS(ret, name, args, ...)`       | 定义 JS 函数        |
| `EM_ASYNC_JS(ret, name, args, ...)` | 定义异步 JS 函数    |

**9. 异步和线程相关（emscripten.h）**

| 宏名称                            | 作用               |
| :-------------------------------- | :----------------- |
| `emscripten_sleep(ms)`            | 异步睡眠           |
| `emscripten_sleep_with_yield(ms)` | 带让步的睡眠       |
| `EMSCRIPTEN_PTHREAD_TRANSFERRED`  | 标记线程传输的对象 |
| `EMSCRIPTEN_PTHREAD_CALL(...)`    | 在线程中调用       |

**10. 主循环和事件（emscripten.h）**

| 函数/宏                        | 作用               |
| :----------------------------- | :----------------- |
| `emscripten_set_main_loop`     | 设置主循环         |
| `emscripten_set_main_loop_arg` | 设置带参数的主循环 |
| `emscripten_cancel_main_loop`  | 取消主循环         |
| `emscripten_pause_main_loop`   | 暂停主循环         |
| `emscripten_resume_main_loop`  | 恢复主循环         |

**11. 文件系统相关（emscripten.h）**

| 函数                           | 作用               |
| :----------------------------- | :----------------- |
| `emscripten_run_script`        | 执行 JS 脚本       |
| `emscripten_run_script_int`    | 执行脚本返回 int   |
| `emscripten_run_script_string` | 执行脚本返回字符串 |
| `EM_PRELOAD_FILE(...)`         | 预加载文件         |
| `EM_EMBED_FILE(...)`           | 嵌入文件           |

**12. WebGL 相关（html5.h）**

| 宏/类型                           | 作用             |
| :-------------------------------- | :--------------- |
| `EMSCRIPTEN_WEBGL_CONTEXT_HANDLE` | WebGL 上下文句柄 |
| `emscripten_webgl_*` 函数族       | WebGL 操作函数   |

**13. HTML5 事件相关（html5.h）**

| 宏/类型                     | 作用                                      |
| :-------------------------- | :---------------------------------------- |
| `EMSCRIPTEN_EVENT_*`        | 事件类型常量                              |
| `emscripten_set_*_callback` | 设置各种事件回调                          |
| 鼠标事件                    | mousedown, mouseup, mousemove 等          |
| 键盘事件                    | keydown, keyup, keypress                  |
| 触摸事件                    | touchstart, touchend, touchmove           |
| 指针锁定                    | pointerlockchange, pointerlockerror       |
| 全屏                        | fullscreenchange, fullscreenerror         |
| 页面可见性                  | visibilitychange                          |
| 焦点                        | focus, blur                               |
| 设备方向                    | deviceorientation, devicemotion           |
| 电池                        | batterychargingchange, batterylevelchange |
| Gamepad                     | gamepadconnected, gamepaddisconnected     |

**14. 内存和堆相关（emscripten.h）**

| 函数/宏                    | 作用              |
| :------------------------- | :---------------- |
| `emscripten_get_heap_size` | 获取堆大小        |
| `emscripten_resize_heap`   | 调整堆大小        |
| `emscripten_get_sbrk_ptr`  | 获取堆指针        |
| `EMSCRIPTEN_HEAP8`         | Int8Array 视图    |
| `EMSCRIPTEN_HEAP16`        | Int16Array 视图   |
| `EMSCRIPTEN_HEAP32`        | Int32Array 视图   |
| `EMSCRIPTEN_HEAPU8`        | Uint8Array 视图   |
| `EMSCRIPTEN_HEAPU16`       | Uint16Array 视图  |
| `EMSCRIPTEN_HEAPU32`       | Uint32Array 视图  |
| `EMSCRIPTEN_HEAPF32`       | Float32Array 视图 |
| `EMSCRIPTEN_HEAPF64`       | Float64Array 视图 |

**15. 调试和性能相关（emscripten.h）**

| 函数/宏                      | 作用              |
| :--------------------------- | :---------------- |
| `emscripten_debugger`        | 触发调试器断点    |
| `emscripten_log`             | 日志输出          |
| `emscripten_get_callstack`   | 获取调用栈        |
| `emscripten_get_now`         | 获取高精度时间    |
| `emscripten_performance_now` | Performance.now() |
| `EMSCRIPTEN_PROFILE_*`       | 性能分析宏        |

**16. Worker 和线程（emscripten.h, threading.h）**

| 函数/宏                                   | 作用            |
| :---------------------------------------- | :-------------- |
| `emscripten_create_worker`                | 创建 Worker     |
| `emscripten_destroy_worker`               | 销毁 Worker     |
| `emscripten_call_worker`                  | 调用 Worker     |
| `emscripten_worker_respond`               | Worker 响应     |
| `emscripten_worker_respond_provisionally` | Worker 临时响应 |
| `emscripten_get_worker_queue_size`        | 获取队列大小    |
| `pthread_create`                          | POSIX 线程创建  |
| `pthread_join`                            | POSIX 线程等待  |

**17. Fetch API（fetch.h）**

| 函数/宏                  | 作用           |
| :----------------------- | :------------- |
| `emscripten_fetch`       | 发起网络请求   |
| `emscripten_fetch_wait`  | 等待请求完成   |
| `emscripten_fetch_close` | 关闭请求       |
| `EMSCRIPTEN_FETCH_*`     | Fetch 标志常量 |

**18. WebSocket（websocket.h）**

| 函数                     | 作用                 |
| :----------------------- | :------------------- |
| `emscripten_websocket_*` | WebSocket 操作函数族 |

**19. Audio（webaudio.h）**

| 函数                              | 作用           |
| :-------------------------------- | :------------- |
| `emscripten_create_audio_context` | 创建音频上下文 |
| `emscripten_audio_*`              | 音频相关函数   |

**20. Val 类型方法（val.h）**

| 方法                         | 作用            |
| :--------------------------- | :-------------- |
| `val::undefined()`           | JS undefined    |
| `val::null()`                | JS null         |
| `val::global(name)`          | 全局对象        |
| `val::module_property(name)` | 模块属性        |
| `val::array()`               | 创建 JS 数组    |
| `val::object()`              | 创建 JS 对象    |
| `val::take_ownership(ptr)`   | 获取所有权      |
| `.await()`                   | 等待 Promise    |
| `.call(name, args...)`       | 调用方法        |
| `.new_(args...)`             | new 构造        |
| `[key]`                      | 索引访问        |
| `.as<T>()`                   | 类型转换        |
| `.typeof()`                  | 类型检查        |
| `.instanceof(constructor)`   | instanceof 检查 |

**21. 编译器属性宏**

| 宏                         | 作用                     |
| :------------------------- | :----------------------- |
| `__EMSCRIPTEN__`           | 标识 Emscripten 编译环境 |
| `__EMSCRIPTEN_major__`     | 主版本号                 |
| `__EMSCRIPTEN_minor__`     | 次版本号                 |
| `__EMSCRIPTEN_tiny__`      | 修订版本号               |
| `EMSCRIPTEN_ALWAYS_INLINE` | 强制内联                 |
| `EMSCRIPTEN_NOINLINE`      | 禁止内联                 |

**22. WASM 特定（wasm.h）**

| 函数/宏                    | 作用          |
| :------------------------- | :------------ |
| `emscripten_wasm_wait_i32` | WASM 原子等待 |
| `emscripten_wasm_notify`   | WASM 原子通知 |
| `__builtin_wasm_*`         | WASM 内建函数 |

**23. 导出/导入宏**

| 宏                  | 作用          |
| :------------------ | :------------ |
| `EMSCRIPTEN_EXPORT` | 导出符号      |
| `EMSCRIPTEN_IMPORT` | 导入符号      |
| `EM_PORT_API(ret)`  | 端口 API 声明 |

:::

## 配置速查

### 输出与模块化

|             选项             |      默认值       |                        说明                        |
| :--------------------------: | :---------------: | :------------------------------------------------: |
|         `-o <file>`          |     a.out.js      |            <mark>指定输出文件名</mark>             |
|        `-sMODULARIZE`        |         0         |  <mark>将 JS 代码转化工厂函数(转化为异步)</mark>   |
|        `-sEXPORT_ES6`        |         0         | <mark>生成 ES6 模块格式（需配合MODULARIZE）</mark> |
|       `-sEXPORT_NAME`        |     'Module'      |                 指定导出的模块名称                 |
|       `-sSINGLE_FILE`        |         0         |         将 wasm 以 base64 内嵌到 JS 文件中         |
|     `--emit-tsd <file>`      |      不生成       |     <mark>生成 TypeScript 类型声明文件</mark>      |
|       `-sENVIRONMENT`        | 'web,worker,node' |              **运行环境(会增加体积)**              |
|    `-sEXPORTED_FUNCTIONS`    |     ['main']      | <mark>指定导出的 C/C++ 函数（需加 \_ 前缀）</mark> |
| `-sEXPORTED_RUNTIME_METHODS` |        []         |   <mark>导出运行时辅助方法如 ccall, cwrap</mark>   |

::: tip 提示
这里注意[模块导出问题](#导出模块问题)。

同时这里可以按照实际需要按需导出运行时方法，例如`ccall`、`cwrap`、`getValue`、`setValue`等，以及字符串转换、内存管理、内存视图、函数表操作、数组转换、运行时控制、动态调用。
:::

::: info 常用运行时方法

```cpp
int add(int x,int y){
   return x+y;
}
```

|    方法    |              说明              |                               示例                                |
| :--------: | :----------------------------: | :---------------------------------------------------------------: |
|  `ccall`   |     一次性调用C/C++等函数      |   `Module.ccall('add', 'number', ['number', 'number'], [1, 2])`   |
|  `cwrap`   | 返回一个 JS 函数，适合多次调用 | `const add = Module.cwrap('add', 'number', ['number', 'number'])` |
| `getValue` |          从内存读取值          |                   `Module.getValue(ptr, 'i32')`                   |
| `setValue` |          向内存写入值          |                `Module.setValue(ptr, 100, 'i32')`                 |

:::

### 调试选项

|           选项           | 默认值 |                         说明                          |
| :----------------------: | :----: | :---------------------------------------------------: |
|           `-g`           |  关闭  | <mark>保留调试信息（-g3 更详细，-g4 包含源码）</mark> |
|      `-gsource-map`      |  关闭  |             <mark>生成 source map </mark>             |
|      `-sASSERTIONS`      |   0    |   <mark>启用运行时断言检查（1 基础，2 详细）</mark>   |
|      `-sSAFE_HEAP`       |   0    |            检测内存访问错误（性能开销大）             |
| `-sSTACK_OVERFLOW_CHECK` |   0    |                      栈溢出检测                       |

::: tip 提示
在准备应用到生产模式中，要关闭所有调试。
:::

### 内存配置

|          选项           |      默认值      |                说明                |
| :---------------------: | :--------------: | :--------------------------------: |
|   `-sINITIAL_MEMORY`    | 16MB (16777216)  | 初始内存大小（必须是 64KB 的倍数） |
|   `-sMAXIMUM_MEMORY`    | 2GB (2147483648) |            最大内存限制            |
| `-sALLOW_MEMORY_GROWTH` |        0         |   <mark>允许内存动态增长</mark>    |
|     `-sSTACK_SIZE`      |   64KB (65536)   |             设置栈大小             |
|     `-sTOTAL_STACK`     |  同 STACK_SIZE   |           旧版本大小设置           |

::: tip 提示
由于wasm运行在游览器或者`Nodejs`内存中的，因此这里内存配置主要是配置wasm的沙箱内存。
:::

### 文件系统配置

|         选项         | 默认值 |            说明             |
| :------------------: | :----: | :-------------------------: |
|    `-sFilesystem`    |   1    |      启用文件系统支持       |
|  `-sNO_FILESYSTEM`   |   0    | 禁用文件系统（减小～120KB） |
| `-sFORCE_FILESYSTEM` |   0    |      强制包含文件系统       |
|   `--preload-file`   |   -    |  预加载文件到虚拟文件系统   |
|    `--embed-file`    |   -    |     嵌入文件到JS/wasm中     |

::: tip 提示
游览器环境中运行代码无法访问DOM，也无法直接访问本地文件系统，因此可以使用`EMCC`的虚拟文件系统，可以预加载数据或链接到URL，方便懒加载。

默认使用`MEMFS`虚拟文件系统，同时本地代码调用文件时，大部分会调用`libc`和`libcxx`同步文件API，会进一步调用底层的文件系统API。

文件使用JS使用同步XHR异步加载，编译后的代码只有在异步加载完成且在虚拟文件系统可用时才允许允许，并调用同步API。

[更详细介绍文档](https://emscripten.org/docs/porting/files/file_systems_overview.html#file-system-overview)
:::

### bind

|      选项       | 默认值 |                     说明                      |
| :-------------: | :----: | :-------------------------------------------: |
|    `--bind`     |  关闭  |  <mark>启用 Embind（C++ 与 JS 绑定）</mark>   |
|   `-lembind`    |  关闭  |             同上，链接 Embind 库              |
| `-sWASM_BIGINT` |   0    | 支持 JS BigInt 与 i64 互操作（需 Node 10.4+） |

::: tip 提示
主要就是在使用C++类等特性的时候，需要导出去，调用。

这里要注意内存泄漏，主要就是在JS层面创建了对象，即使JS指向为`null`的时候，但是wasm内存层面，还是会存在无法感知JS层面的GC被屏蔽掉了，需要调用wasm层面手动定义的回收函数例如类析构，或者自定义`delete`。

`--bind`是`-lembind`和额外配置，一站式自动完成链接Embind库、导出必要Embind符号、配置JS并生成`.d.ts`类型定义。

`--bind`在cpp代码中如果embind的时候，导出时此时必须要它参与，才能真正使用。

:::

### WebAssembly特性

|            选项            | 默认值 |          说明          |
| :------------------------: | :----: | :--------------------: |
|          `-sWASM`          |   1    |    输出 WebAssembly    |
| `-sWASM_ASYNC_COMPILATION` |   1    |     异步编译 wasm      |
|    `-sSTANDALONE_WASM`     |   0    |     生成独立 wasm      |
|     `-sIMPORT_MEMORY`      |   0    |     从外部导入内存     |
|       `-sEXPORT_ALL`       |   0    | 导出所有函数（调试用） |

::: tip 提示
如果只是简单的计算，没有用到C++的特性如类、指针等，可以只生成wasm格式，这是占用内存和大小会小好多，而且使用也方便。

如果涉及了特性，而且需要用到C++做很多事的时候，就需要将其编译`JS+WASM`层面，注意JS这里只是`emcc`帮你手动完成了自动创建内存、设置imports和查找加载wasm文件、全局对象的构造函数初始化以及自动实例化初始化等操作。

此时无需手动在负责WASM与JS的交互，但是这个JS还是依赖wasm的，只是封装了它。
:::

### 多线程支持

|         选项          | 默认值 |                说明                |
| :-------------------: | :----: | :--------------------------------: |
|      `-pthread`       |  关闭  | <mark> 启用 Pthreads 多线程</mark> |
| `-sPTHREAD_POOL_SIZE` |   0    |    线程池大小（0 表示按需创建）    |
| `-sPROXY_TO_PTHREAD`  |   0    |    主线程执行在 pthread 中运行     |
|   `-sUSE_PTHREADS`    |   0    |            同 -pthread             |

::: warning 注意
这里需要配置HTTP头，`Cross-Origin-Opener-Policy: same-origin`和`Cross-Origin-Embedder-Policy: require-corp`。

主要是因为游览器防止跨源攻击，但是wasm多线程依赖**共享内存和跨源隔离**内部会尝试使用共享内存会被游览器的安全限制禁止掉。
:::

### 异常处理

|              选项              | 默认值 |                   说明                   |
| :----------------------------: | :----: | :--------------------------------------: |
|         `-fexceptions`         |  关闭  | <mark> 启用 C++ 异常（Wasm 原生）</mark> |
| `-sDISABLE_EXCEPTION_CATCHING` |   1    |      禁用异常捕获（0 启用 JS 实现）      |
|   `-sEXCEPTION_STACK_TRACES`   |   0    |            异常时显示栈上跟踪            |

::: tip 提示
启用它之后，JS层面使用它时，只需像`try..catch...finally`一样使用即可。

不启用出错会直接崩溃，且无异常信息，无法定位问题。
:::

### 代码体积优化

|                选项                 |   默认值   |                     说明                     |
| :---------------------------------: | :--------: | :------------------------------------------: |
|            `--closure 1`            |     0      | 使用 Closure Compiler 压缩 JS（需安装 Java） |
|       `--closure-args <args>`       |     -      |             传递参数给给 Closure             |
|       `-sIGNORE_MISSING_MAIN`       |     0      |             无 main 函数也不报错             |
|             `-sMALLOC`              | 'dlmalloc' |       内存分配器（'emmalloc'更小但慢）       |
|           `-sEVAL_CTORS`            |     0      |              编译时执行构造函数              |
| `-sAGGRESSIVE_VARIABLE_ELIMINATION` |     0      |                激进的变量消除                |

### 优化级别

| 选项  | 默认值 |         说明          |
| :---: | :----: | :-------------------: |
| `-O0` |   有   |   无优化，编译最快    |
| `-O1` |   -    |       基础优化        |
| `-O2` |   -    | <mark>标准优化</mark> |
| `-O3` |   -    |       激进优化        |
| `-Os` |   -    |     优化代码体积      |
| `-Oz` |   -    |   极限压缩代码体积    |

### 网络与Web API

|          选项           | 默认值 |               说明               |
| :---------------------: | :----: | :------------------------------: |
|        `-sFETCH`        |   0    |       启用 Fetch API 支持        |
|    `-sWEBSOCKET_URL`    |   -    |          WebSocket 配置          |
| `-sPROXY_POSIX_SOCKETS` |   0    | 通过 WebSocket 代理 POSIX socket |
|    `-sWEBGL_VERSION`    |   0    |       WebGL 版本（1 或 2）       |

::: tip 提示
这里主要体现在c++/c调用fetch、websocket、webGL。

但是由于底层JS网络是异步的，因此只能限制网络功能为异步非阻塞。
:::

### 库支持

|         选项          | 默认值 |          说明           |
| :-------------------: | :----: | :---------------------: |
|      `-sUSE_SDL`      |   0    | 使用 SDL（2 表示 SDL2） |
|     `-sUSE_ZLIB`      |   0    |        使用 zlib        |
|    `-sUSE_LIBPNG`     |   0    |       使用 libpng       |
|   `-sUSE_FREETYPE`    |   0    |      使用 FreeType      |
| `-sUSE_BOOST_HEADERS` |   0    |    使用 Boost 头文件    |

### 运行时行为

|          选项           | 默认值 |         说明          |
| :---------------------: | :----: | :-------------------: |
|     `-sINVOKE_RUN`      |   1    |    自动运行 main()    |
|    `-sEXIT_RUNTIME`     |   0    | main 结束后清理运行时 |
|   `-sNO_EXIT_RUNTIME`   |   0    |    禁止运行时退出     |
| `-sMODULARIZE_INSTANCE` |   0    | 导出实例而非工厂函数  |

### 其他高级选项

|            选项            | 默认值 |               说明                |
| :------------------------: | :----: | :-------------------------------: |
|         `-sSTRICT`         |   0    |     严格模式（检查废弃选项）      |
|        `-sVERBOSE`         |   0    |             详细输出              |
|   `-sMIN_CHROME_VERSION`   |   0    |         最低 Chrome 版本          |
|  `-sMIN_FIREFOX_VERSION`   |   0    |         最低 Firefox 版本         |
| `-sINCOMING_MODULE_JS_API` |   []   | 指定导出的 Module 属性（空=全部） |
|   `-sAUTO_JS_LIBRARIES`    |   1    |          自动链接 JS 库           |
|   `-sLEGACY_VM_SUPPORT`    |   0    |    支持旧版 VM（iOS 11.2 前）     |
