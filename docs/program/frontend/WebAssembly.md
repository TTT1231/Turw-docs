---
outline: deep
---

# WebAssembly

WebAssembly（Wasm）是一种可在浏览器、Node.js 等环境中运行的二进制格式。Emscripten 可以把 C/C++ 编译为 Wasm，让现有代码或计算密集任务在这些环境中运行。

适不适合使用 Wasm，应结合实际任务测量：加载、初始化、内存和 JS 与 Wasm 之间的数据传递都有成本。计算量较小或需要频繁跨边界传递数据时，不一定比直接使用 JavaScript 更快。Wasm 本身不能直接访问 DOM 或宿主 API，需要宿主提供相应接口。

Web Worker 用于将任务移到后台线程，避免阻塞页面；Wasm 是代码的运行格式。两者解决的问题不同，也可以组合使用：例如在 Worker 中运行耗时的 Wasm 计算。

Emscripten 使用 Clang/LLVM 编译 C/C++，并可生成 JavaScript 胶水代码，负责加载 Wasm、准备导入项和提供运行时接口。

## 编译执行差异

| 输出              | 组成和用途                                                                                                     |
| ----------------- | -------------------------------------------------------------------------------------------------------------- |
| JavaScript + Wasm | JavaScript 胶水代码加载并初始化 Wasm，适合使用 Emscripten 运行时或 Embind 的场景。通常需要同时部署生成的文件。 |
| 独立 Wasm         | 直接生成 `.wasm`，由宿主加载、实例化并提供所需导入。是否能独立运行取决于编译选项及程序使用的宿主接口。         |

Wasm 一般经历加载、验证、编译和实例化后才可调用；JavaScript 也有解析、编译和执行成本。具体性能取决于运行环境和负载，不能仅凭输出格式判断。

可以检查模块需要宿主提供哪些导入项：

```ts
const response = await fetch('/path/to/module.wasm');
const module = await WebAssembly.compile(await response.arrayBuffer());
console.log(WebAssembly.Module.imports(module));
```

直接加载不等于自动获得 Emscripten 运行时：如果模块需要导入内存、系统调用或其他接口，实例化时仍须提供。生成 `.wasm` 文件与用于动态链接的 `SIDE_MODULE` 也是不同的选项。详见 [Emscripten 输出格式](https://emscripten.org/docs/tools_reference/emcc.html)和[动态链接](https://emscripten.org/docs/compiling/Dynamic-Linking.html)。

## Emcc GUI工具

[Emcc GUI](https://github.com/TTT1231/emccgui/releases) 用图形界面生成编译命令，减少查找和手写参数的工作。使用前需要安装 [Emscripten](https://emscripten.org/docs/)；生成 TypeScript 声明时还需要 TypeScript。确保工具能从运行环境找到 `emcc` 和 `tsc`，也可以复制生成的命令自行执行。

## 使用示例

::: code-group-fold line-numbers

```cpp [test1.cpp]
#include <emscripten.h>

extern "C" {
	EMSCRIPTEN_KEEPALIVE
	int add(int x, int y) {
		return x + y;
	}
}
```

```cpp [ClassObj.cpp]
#include <emscripten/bind.h>

using namespace emscripten;

class MyClass {
private:
	int x;
public:
	MyClass(int x) : x(x) {}
	void incrementX() {
		this->x = this->x + 1;
	}
	int getX() const { return x; }
	std::string showStr() {
		return "Hello, this is C++ MyClass";
	}
};

//Binding
EMSCRIPTEN_BINDINGS(bind_unique_group) {
	class_<MyClass>("MyClass")
		.constructor<int>()
		.function("incrementX", &MyClass::incrementX)
		.function("getX", &MyClass::getX)
		.function("showStr", &MyClass::showStr);
}
```

```ts [test1_V1.d.ts]
//该文件是类型文件
//这种是js+wasm格式，此时有dts类型
// 直接使用 Wasm 时需另行描述导出类型；ccall 等属于 Emscripten 运行时。
/// <reference types="emscripten" />

declare namespace RuntimeExports {
    /**
     * @param {string|null=} returnType
     * @param {Array=} argTypes
     * @param {Array=} args
     * @param {Object=} opts
     */
    function ccall(
        ident: any,
        returnType?: (string | null) | undefined,
        argTypes?: any[] | undefined,
        args?: any[] | undefined,
        opts?: any | undefined
    ): any;
    /**
     * @param {string=} returnType
     * @param {Array=} argTypes
     * @param {Object=} opts
     */
    function cwrap(
        ident: any,
        returnType?: string | undefined,
        argTypes?: any[] | undefined,
        opts?: any | undefined
    ): any;
    /**
     * @param {number} ptr
     * @param {string} type
     */
    function getValue(ptr: number, type?: string): any;
    /**
     * @param {number} ptr
     * @param {number} value
     * @param {string} type
     */
    function setValue(ptr: number, value: number, type?: string): void;
}
interface WasmModule extends EmscriptenModule {
    _add(_0: number, _1: number): number;
    _malloc(size: number): number;
    _free(ptr: number): void;
}

export type MainModule = WasmModule & typeof RuntimeExports;
export default function MainModuleFactory(options?: Partial<MainModule>): Promise<MainModule>;
```

```ts [test1_V2.d.ts]
//该文件解决动态import的ts类型问题
//[!code warning] 注意需要编译时采用工厂编译
/// <reference types="emscripten" />

//定义路径
declare module '@/assets/test1.js' {
    interface RuntimeExports {
        /**
         * @param {string|null=} returnType
         * @param {Array=} argTypes
         * @param {Array=} args
         * @param {Object=} opts
         */
        ccall(
            ident: any,
            returnType?: (string | null) | undefined,
            argTypes?: any[] | undefined,
            args?: any[] | undefined,
            opts?: any | undefined
        ): any;
        /**
         * @param {string=} returnType
         * @param {Array=} argTypes
         * @param {Object=} opts
         */
        cwrap(
            ident: any,
            returnType?: string | undefined,
            argTypes?: any[] | undefined,
            opts?: any | undefined
        ): any;
        /**
         * @param {number} ptr
         * @param {string} type
         */
        getValue(ptr: number, type?: string): any;
        /**
         * @param {number} ptr
         * @param {number} value
         * @param {string} type
         */
        setValue(ptr: number, value: number, type?: string): void;
    }
    interface WasmModule extends EmscriptenModule {
        _add(_0: number, _1: number): number;
    }

    export type MainModule = WasmModule & RuntimeExports;
    export default function MainModuleFactory(options?: Partial<MainModule>): Promise<MainModule>;
}
```

```ts [ClassObj_V1.d.ts]
//该文件是类型文件,这种是js+wasm格式，此时有dts类型.
// 此示例使用 Embind 和 Emscripten 的 JavaScript 胶水代码。
/// <reference types="emscripten" />

interface WasmModule extends EmscriptenModule {}

export interface ClassHandle {
    isAliasOf(other: ClassHandle): boolean;
    delete(): void;
    deleteLater(): this;
    isDeleted(): boolean;
    // @ts-ignore - If targeting lower than ESNext, this symbol might not exist.
    [Symbol.dispose](): void;
    clone(): this;
}
export interface MyClass extends ClassHandle {
    incrementX(): void;
    getX(): number;
    showStr(): string;
}

interface EmbindModule {
    MyClass: {
        new (_0: number): MyClass;
    };
}

export type MainModule = WasmModule & EmbindModule;
export default function MainModuleFactory(options?: Partial<MainModule>): Promise<MainModule>;
```

```ts [ClassObj_V2.d.ts]
//该文件解决动态import的ts类型问题
//[!code warning] 注意需要编译时采用工厂编译
/// <reference types="emscripten" />

declare module '@/assets/ClassObj.js' {
    interface WasmModule extends EmscriptenModule {}
    export interface ClassHandle {
        isAliasOf(other: ClassHandle): boolean;
        delete(): void;
        deleteLater(): this;
        isDeleted(): boolean;
        // @ts-ignore - If targeting lower than ESNext, this symbol might not exist.
        [Symbol.dispose](): void;
        clone(): this;
    }
    export interface MyClass extends ClassHandle {
        incrementX(): void;
        getX(): number;
        showStr(): string;
    }
    interface EmbindModule {
        MyClass: {
            new (_0: number): MyClass;
        };
    }

    export type MainModule = WasmModule & EmbindModule;
    export default function MainModuleFactory(options?: Partial<MainModule>): Promise<MainModule>;
}
```

:::

**实际用法:**

::: code-group-fold line-numbers

```ts [test1.ts]
import type { MainModule } from './types/test1';

const test1Module = ref<MainModule | null>(null);
onMounted(async () => {
    const { default: createModule } = await import('@/assets/test1.js');
    test1Module.value = await createModule();
    console.log('WASM模块加载完成');
});

const handleCallBack = () => {
    if (test1Module.value) {
        const result = test1Module.value._add(123, 456);
        // print 579
        console.log('WASM计算结果：', result);

        //ccall
        const addResult: number = test1Module.value.ccall(
            'add',
            'number',
            ['number', 'number'],
            [10, 20]
        );
        //print 30
        console.log('WASM ccall计算结果：', addResult);
        //cwrap
        const addFunc: MainModule['_add'] = test1Module.value.cwrap('add', 'number', [
            'number',
            'number'
        ]);
        //print 70
        console.log('WASM cwrap计算结果：', addFunc(30, 40));
    }
};
```

```ts [ClassObj.ts]
import { ref, onMounted } from 'vue';
import type { MainModule } from '@/types/classObj';

const classModule = ref<MainModule | null>(null);

onMounted(async () => {
    const { default: createModule } = await import('@/assets/ClassObj.js');
    classModule.value = await createModule();
    console.log('class WASM模块加载完成');
});

const handleCallBack = () => {
    if (classModule.value) {
        const instance = new classModule.value.MyClass(10);

        //print 10
        console.log('对象内部私有值', instance.getX());
        instance.incrementX();
        //print 11
        console.log('调用方法后对象内部私有值', instance.getX());
        //print Hello, this is C++ MyClass
        console.log('普通方法调用', instance.showStr());
        instance.delete(); // 释放 Embind 创建的 C++ 对象
    }
};
```

```ts [test1-wasm-pure.ts]
// 此示例假设模块无需额外导入，且可直接调用导出的 add。
// 实际模块可能需要提供 imports 和执行初始化函数。

try {
    //[!code warning]
    // 使用流式编译时，服务器需要以 application/wasm 返回文件。
    const { instance } = await WebAssembly.instantiateStreaming(fetch('/src/assets/111.wasm'));
    // 调用 add 函数
    //[!code warning]
    //下面注意类型安全
    const add = instance.exports.add as (x: number, y: number) => number;
    result.value = add(1, 2);
    //print 3
    console.log('结果:', result.value);
} catch (error) {
    console.error('加载失败:', error);
}
```

:::

## 类型安全

优先使用与当前构建选项匹配的生成声明，并检查它是否覆盖实际导出的函数、运行时方法与初始化参数。`--emit-tsd <文件名>` 可以生成类型声明；浏览器和 Node.js 项目都可使用 `@types/emscripten` 补充 Emscripten 类型。

以下是一个模块化构建的声明示例。不同 Emscripten 版本和编译选项生成的类型可能不同，需要以实际输出为准。

```ts
// TypeScript bindings for emscripten-generated code.  Automatically generated at compile time.
interface WasmModule {
    _main(_0: number, _1: number): number;
}

export type MainModule = WasmModule;
export default function MainModuleFactory(options?: unknown): Promise<MainModule>;
```

如果生成的声明缺少项目实际使用的运行时类型，可以结合 `EmscriptenModule` 补充：

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

也可以通过接口继承表达相同关系：

```ts
/// <reference types="emscripten" />

export interface MainModule extends EmscriptenModule {
    _main(_0: number, _1: number): number;
}

export default function MainModuleFactory(options?: Partial<MainModule>): Promise<MainModule>;
```

### 工厂函数类型

工厂函数接收可选的模块配置，异步返回初始化后的实例：

```ts
/**
 * @param moduleOverrides 模块覆盖配置
 * @return 完整模块实例
 */
type EmscriptenModuleFactory<T extends EmscriptenModule = EmscriptenModule> = (
    moduleOverrides?: Partial<T>
) => Promise<T>;
```

`EmscriptenModule` 可用于描述配置和模块实例，具体可用成员取决于构建选项。

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

通过 `EMSCRIPTEN_BINDINGS` 暴露的 C++ 类型可以单独声明，再与其他模块接口组合。生成声明的具体覆盖范围取决于 Emscripten 版本和绑定方式。

### 游览器类型安全

安装 `@types/emscripten` 后，可以引用类型并扩展项目实际使用的导出：

```ts
/// <reference types="emscripten" />

export interface MyModule extends EmscriptenModule {
    // 声明你需要使用的导出函数
    _add: (a: number, b: number) => number;
}

export {};
```

### Nodejs环境下类型安全

Node.js 项目也可以安装相同的类型包，再按上面的方式补充导出类型：

::: code-group

```sh:no-line-numbers [pnpm.sh]
pnpm install @types/emscripten -D
```

```sh:no-line-numbers [npm.sh]
npm install --save-dev @types/emscripten
```

:::

## 注意事项

### 方法的\_问题

C++ 函数名可能因名称修饰（name mangling）发生变化，未使用的函数也可能被链接器移除。例如：

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

可用 `extern "C"` 指定 C 链接方式，避免 C++ 名称修饰；再用 `EMSCRIPTEN_KEEPALIVE` 或编译选项导出函数。

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

Emscripten 的 JavaScript 模块通常通过 `Module._add` 访问导出的 C 函数；直接访问 Wasm 实例时，导出名称取决于构建结果。`extern "C"` 与 JS 包装层的下划线命名是不同的事情。

### 导出模块问题

`-sEXPORT_ES6` 控制生成 ES module 格式；`-sMODULARIZE` 将输出封装为可调用的工厂，便于传入配置并创建实例。使用默认异步编译时，等待工厂返回的 Promise 后再调用导出函数。二者经常组合使用，但用途不同，具体行为还取决于其他编译选项。[官方说明](https://emscripten.org/docs/compiling/Modularized-Output.html)

动态导入生成文件时，如果 TypeScript 无法找到声明，可为对应模块路径提供声明文件。下面先展示一个容易混淆的写法：顶层 `export` 会使文件成为模块，此时 `declare module` 的含义与独立的环境模块声明不同。

```ts
/// <reference types="emscripten" />

export interface MainModule extends EmscriptenModule {
    _main(_0: number, _1: number): number;
}

export default function MainModuleFactory(options?: Partial<MainModule>): Promise<MainModule>;

// 顶层 export 使此文件成为模块，下面会被当作模块增强，
// 不适合作为尚不存在的模块的独立环境声明。

declare module 'path/to/js' {
    export { MainModuleFactory as default, MainModule };
}
```

可以将环境模块声明与供其他代码导入的类型分别放在文件中。模块名应与实际导入路径匹配，并结合项目的 TypeScript 模块解析配置检查。

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

### 函数指针问题

通过不匹配的函数指针类型调用函数属于未定义行为，在 WebAssembly 中可能因签名不匹配而报错。应保证声明、实际函数和调用处的签名一致：

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

使用签名匹配的适配函数调用原函数；如果调用方需要返回值，应调整接口而不是丢弃结果：

```cpp
//签名一样
void intReturnAdapter(const char* message){
   //!返回值只能在该函数内进行处理
   intReturn(message);
}
//这样就不会报错
functionList[1] = intReturnAdapter;
```

开发时可用 `emcc -sSAFE_HEAP -sASSERTIONS test.cpp` 开启运行时断言和内存访问检查；这些检查会增加开销。

## 宏相关

### 常用宏

#### 类绑定相关

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

#### 值类型和枚举

- `enum_<T>(name)`绑定枚举类型
- `value(name, EnumValue)`导出枚举值
- `value_object<T>(name)`绑定简单结构体
- `field(name, &T::member)`导出结构体字段

#### 内存和智能指针

- `smart_ptr<std::shared_ptr<T>>()`绑定智能指针
- `EMSCRIPTEN_KEEPALIVE`防止函数被优化掉

#### 继承和多态

- `base<BaseClass>()`声明类继承关系
- `allow_subclass<Wrapper>(name)`允许 JS 继承 C++ 类
- `pure_virtual(&Class::method)`标记纯虚函数
- `optional_override(callback)`可选重写虚函数

#### 常量和数组

- `constant(name, value)`导出编译时常量
- `value_array<T>(name)`绑定固定大小数组
- `element(index_func)`自定义数组索引访问

#### 异步和主循环

- `emscripten_set_main_loop`设置主循环（游戏/动画）
- `EM_ASYNC_JS(...)`异步 JavaScript 函数
- `await()`等待 Promise

#### 其他场景

|      场景      |               命令                |            描述            |
| :------------: | :-------------------------------: | :------------------------: |
|    网络请求    |        `emscripten_fetch`         |   C++调用JS发起网络请求    |
| HTML5 事件回调 | `emscripten_set_keydown_callback` |   C++监听键盘鼠标等事件    |
|   WebGL 相关   |       `emscripten_webgl_*`        |    C++调用WebGL渲染图形    |
|  Worker/线程   |       Pthreads / Worker API       | 在支持的环境中运行并发任务 |

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

> 默认值已对照 [Emscripten 5.0.3 官方源码](https://github.com/emscripten-core/emscripten/blob/5.0.3/src/settings.js)核对，不同版本可能存在差异，最新请以[官方 settings reference](https://emscripten.org/docs/tools_reference/settings_reference.html)为准。

### 高频配置

日常使用频率最高的配置项，完整配置见下方[全量配置](#全量配置)。

|                  选项                   |          默认值          |                              说明                              |
| :-------------------------------------: | :----------------------: | :------------------------------------------------------------: |
|               `-o <file>`               |            -             | 指定输出文件名（后缀决定输出格式，`.mjs` 隐式启用 EXPORT_ES6） |
|             `-sMODULARIZE`              |          false           |                    将 JS 输出封装为工厂函数                    |
|             `-sEXPORT_ES6`              |          false           |                      生成 ES module 格式                       |
|           `--emit-tsd <file>`           |            ''            |                  生成 TypeScript 类型声明文件                  |
|         `-sEXPORTED_FUNCTIONS`          | `[]`（隐式导出 `_main`） |             指定导出的 C/C++ 函数（需加 \_ 前缀）              |
|      `-sEXPORTED_RUNTIME_METHODS`       |    `[]`（默认不导出）    | 导出 ccall、cwrap 等运行时方法（默认一个都不导出，需显式指定） |
|          `-lembind` / `--bind`          |          false           |                链接 Embind 库（C++ 与 JS 绑定）                |
|         `-sALLOW_MEMORY_GROWTH`         |          false           |                        允许内存动态增长                        |
| `-sINITIAL_MEMORY` / `-sMAXIMUM_MEMORY` |         -1 / 2GB         |       初始内存自动计算 / 最大内存限制（须为 64KB 倍数）        |
|             `-fexceptions`              |          false           |              启用基于 JavaScript 的 C++ 异常处理               |
|               `-pthread`                |          false           |           启用 Pthreads 多线程（需配置响应头，见下）           |
|             `-sASSERTIONS`              |            1             |    运行时断言检查（0 关闭，1 基础，2 详细；优化构建默认 0）    |
|              `-sSAFE_HEAP`              |            0             |          内存访问边界检查（性能开销大），生产环境关闭          |
|          `-O0` / `-O2` / `-Oz`          |           -O0            |          优化级别：-O2 标准优化，-Oz 极限压缩代码体积          |

`ccall`、`cwrap`、`getValue`、`setValue` 等运行时方法需按构建配置通过 `-sEXPORTED_RUNTIME_METHODS` 导出。调试选项会增加开销，生产构建应根据排错和性能需求选择。

### 常用运行时方法

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

::: warning 多线程响应头
`-pthread` 需要配置 HTTP 响应头：`Cross-Origin-Opener-Policy: same-origin` 和 `Cross-Origin-Embedder-Policy: require-corp`。

因为浏览器为防范跨源攻击会限制共享内存，而 wasm 多线程依赖**共享内存和跨源隔离**，会被浏览器的安全限制禁止掉。
:::

::: warning Embind 内存泄漏
在 JS 层面创建的 Embind 对象，即使置为 `null`，wasm 内存层面也无法感知 JS 的 GC，对象依然存在。需要在 wasm 层面手动回收，例如调用类析构或自定义 `delete`。
:::

### `--bind` 与 `-lembind`

```bash
emcc --bind example.cpp -o example.js
```

等价于：

```bash
emcc -lembind example.cpp -o example.js
```

### 异常处理

C++ 异常处理的行为和成本取决于编译选项；需要跨 JS 与 Wasm 边界处理异常时，应按所用版本查阅 [Emscripten 异常处理文档](https://emscripten.org/docs/porting/exceptions.html)。

### 全量配置

::: details 展开全部配置表（默认值核对于 Emscripten 5.0.3）

**输出与模块化**

|             选项             |          默认值          |                             说明                              |
| :--------------------------: | :----------------------: | :-----------------------------------------------------------: |
|         `-o <file>`          |            -             |                        指定输出文件名                         |
|        `-sMODULARIZE`        |          false           |                   将 JS 输出封装为工厂函数                    |
|   `-sMODULARIZE=instance`    |          false           | 实验性 Instance ES Modules：导出单例 ES 模块（需 EXPORT_ES6） |
|        `-sEXPORT_ES6`        |          false           |                      生成 ES module 格式                      |
|       `-sEXPORT_NAME`        |          Module          |                      指定导出的模块名称                       |
|       `-sSINGLE_FILE`        |          false           |              将 wasm 以 base64 内嵌到 JS 文件中               |
|     `--emit-tsd <file>`      |            ''            |                 生成 TypeScript 类型声明文件                  |
|       `-sENVIRONMENT`        | web,webview,worker,node  |                   **运行环境(会增加体积)**                    |
|    `-sEXPORTED_FUNCTIONS`    | `[]`（隐式导出 `_main`） |             指定导出的 C/C++ 函数（需加 \_ 前缀）             |
| `-sEXPORTED_RUNTIME_METHODS` |    `[]`（默认不导出）    |               导出运行时辅助方法如 ccall, cwrap               |

**调试选项**

|           选项           |  默认值  |                             说明                             |
| :----------------------: | :------: | :----------------------------------------------------------: |
|           `-g`           | disabled |           保留调试信息（-g3 更详细，-g4 包含源码）           |
|      `-gsource-map`      |  false   |                       生成 source map                        |
|      `-sASSERTIONS`      |    1     | 启用运行时断言检查（0 关闭，1 基础，2 详细；优化构建默认 0） |
|      `-sSAFE_HEAP`       |    0     |                检测内存访问错误（性能开销大）                |
| `-sSTACK_OVERFLOW_CHECK` |    0     |                          栈溢出检测                          |

**内存配置**

|          选项           |      默认值      |                        说明                         |
| :---------------------: | :--------------: | :-------------------------------------------------: |
|   `-sINITIAL_MEMORY`    |        -1        | 初始内存大小（-1 自动计算，否则必须是 64KB 的倍数） |
|   `-sMAXIMUM_MEMORY`    | 2147483648 (2GB) |                    最大内存限制                     |
| `-sALLOW_MEMORY_GROWTH` |      false       |                  允许内存动态增长                   |
|     `-sSTACK_SIZE`      |   65536 (64KB)   |                     设置栈大小                      |

> **提示**：由于wasm运行在游览器或者`Nodejs`内存中的，因此这里内存配置主要是配置wasm的沙箱内存。

**文件系统配置**

|         选项         | 默认值 |           说明           |
| :------------------: | :----: | :----------------------: |
|    `-sFILESYSTEM`    |   1    |     启用文件系统支持     |
| `-sFORCE_FILESYSTEM` |   0    |     强制包含文件系统     |
|   `--preload-file`   |   ''   | 预加载文件到虚拟文件系统 |
|    `--embed-file`    |   ''   |   嵌入文件到JS/wasm中    |

浏览器中的 Wasm 不能直接访问宿主文件系统。Emscripten 提供虚拟文件系统，默认使用内存中的 MEMFS；可以在运行前预加载或嵌入文件，供 C/C++ 代码通过文件 API 使用。加载方式和可用时机取决于构建选项。[文件系统说明](https://emscripten.org/docs/porting/files/file_systems_overview.html#file-system-overview)

**Embind (C++ 与 JS 绑定)**

|      选项       | 默认值 |                      说明                      |
| :-------------: | :----: | :--------------------------------------------: |
|   `-lembind`    | false  |        链接 Embind 库（C++ 与 JS 绑定）        |
| `-sWASM_BIGINT` |   1    | 支持 JS BigInt 与 i64 互操作（0 关闭，1 启用） |

**WebAssembly 特性**

|            选项            | 默认值 |                         说明                         |
| :------------------------: | :----: | :--------------------------------------------------: |
|          `-sWASM`          |   1    |    输出 WebAssembly（0 输出 asm.js，1 输出 wasm）    |
| `-sWASM_ASYNC_COMPILATION` |   1    |           异步编译 wasm（0 同步，1 异步）            |
|    `-sSTANDALONE_WASM`     | false  | 生成一个尽量独立的 WASM，减少对外部依赖(最小imports) |
|     `-sIMPORT_MEMORY`      | false  |                    从外部导入内存                    |
|       `-sEXPORT_ALL`       | false  |    将已包含的 JS 符号挂到 Module；不阻止代码消除     |

选择独立 Wasm 还是 JavaScript + Wasm，应根据模块需要的导入和运行时接口决定，而不是仅凭是否使用 C++ 类或指针。Emscripten 胶水代码可以处理加载、实例化和宿主交互；独立输出仍可能需要宿主提供接口。

**多线程支持**

|         选项          | 默认值 |             说明             |
| :-------------------: | :----: | :--------------------------: |
|      `-pthread`       | false  |     启用 Pthreads 多线程     |
| `-sPTHREAD_POOL_SIZE` |   0    | 线程池大小（0 表示按需创建） |
| `-sPROXY_TO_PTHREAD`  | false  | 主线程执行在 pthread 中运行  |

**异常处理**

|              选项              | 默认值 |                        说明                        |
| :----------------------------: | :----: | :------------------------------------------------: |
|         `-fexceptions`         | false  |        启用基于 JavaScript 的 C++ 异常处理         |
| `-sDISABLE_EXCEPTION_CATCHING` |   1    | 禁用异常捕获控制（0 启用 JS 模拟，1 禁用，默认 1） |
|   `-sEXCEPTION_STACK_TRACES`   | false  |    异常时显示栈跟踪（ASSERTIONS=1 时默认 true）    |

**代码体积优化**

|          选项           |  默认值  |                                说明                                 |
| :---------------------: | :------: | :-----------------------------------------------------------------: |
|       `--closure`       |    0     | 使用 Closure Compiler 压缩 JS（0 关闭，1 压缩支持代码，2 压缩全部） |
| `--closure-args <args>` |    ''    |                     传递参数给 Closure Compiler                     |
| `-sIGNORE_MISSING_MAIN` |    1     |                  缺少 main 函数时不报错（默认 1）                   |
|       `-sMALLOC`        | dlmalloc | 内存分配器（dlmalloc 默认，emmalloc 更小但慢，mimalloc 适合多线程） |
|     `-sEVAL_CTORS`      |  false   |                编译时执行构造函数（减少运行时开销）                 |

**优化级别**

| 选项  | 默认值 |           说明           |
| :---: | :----: | :----------------------: |
| `-O0` |  true  | 无优化，编译最快（默认） |
| `-O1` | false  |         基础优化         |
| `-O2` | false  |         标准优化         |
| `-O3` | false  |         激进优化         |
| `-Os` | false  |       优化代码体积       |
| `-Oz` | false  |     极限压缩代码体积     |

**网络与 Web API**

|          选项           | 默认值 |               说明               |
| :---------------------: | :----: | :------------------------------: |
|        `-sFETCH`        | false  |       启用 Fetch API 支持        |
|    `-sWEBSOCKET_URL`    | ws://  |        WebSocket 连接 URL        |
| `-sPROXY_POSIX_SOCKETS` | false  | 通过 WebSocket 代理 POSIX socket |

> **提示**：这里主要体现在c++/c调用fetch、websocket、webGL。
>
> 但是由于底层JS网络是异步的，因此只能限制网络功能为异步非阻塞。

**库支持**

|         选项          | 默认值 |          说明           |
| :-------------------: | :----: | :---------------------: |
|      `-sUSE_SDL`      |   0    | 使用 SDL（2 表示 SDL2） |
|     `-sUSE_ZLIB`      | false  |        使用 zlib        |
|    `-sUSE_LIBPNG`     | false  |       使用 libpng       |
|   `-sUSE_FREETYPE`    | false  |      使用 FreeType      |
| `-sUSE_BOOST_HEADERS` | false  |    使用 Boost 头文件    |

**运行时行为**

|       选项       | 默认值 |                  说明                   |
| :--------------: | :----: | :-------------------------------------: |
|  `-sINVOKE_RUN`  |  true  |             自动运行 main()             |
| `-sEXIT_RUNTIME` | false  | main 结束后清理运行时（调用 atexit 等） |

**其他高级选项**

|            选项            |    默认值    |                           说明                           |
| :------------------------: | :----------: | :------------------------------------------------------: |
|         `-sSTRICT`         |    false     |            严格模式（检查废弃选项，向前兼容）            |
|        `-sVERBOSE`         |    false     |                     编译过程详细输出                     |
|   `-sMIN_CHROME_VERSION`   |      85      |          最低 Chrome 版本（85 = 2020-08 发布）           |
|  `-sMIN_FIREFOX_VERSION`   |      79      |          最低 Firefox 版本（79 = 2020-07 发布）          |
| `-sINCOMING_MODULE_JS_API` | 常用符号列表 | 限制从 Module 配置对象读取的属性（设为 `[]` 可减小体积） |
|   `-sAUTO_JS_LIBRARIES`    |     true     |                      自动链接 JS 库                      |
|   `-sLEGACY_VM_SUPPORT`    |    false     |               支持旧版 VM（iOS 11.2 之前）               |

:::
