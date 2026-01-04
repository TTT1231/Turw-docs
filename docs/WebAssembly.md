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
