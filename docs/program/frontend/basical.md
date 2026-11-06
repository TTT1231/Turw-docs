---
outline: [2, 3]
---

# Basical

## CSS

这里整理布局、图片适配、JavaScript 和前端安全中常用的概念与示例。

### Flex Layout

Flex 是一维布局：项目沿主轴排列，并沿交叉轴对齐。默认主轴方向为 `row`；适合处理一行或一列中项目的排列和空间分配。

#### 交互式属性选择器

通过下拉菜单选择不同的Flex属性值，实时查看代码和效果：

<FlexProperty/>
#### justify-content (主轴对齐) - （tailwindcss写法）
- `justify-content: flex-start;` - `justify-start`（默认值，左对齐）
- `justify-content: flex-end;` - `justify-end`（右对齐）
- `justify-content: center;` - `justify-center`（居中对齐）
- `justify-content: space-between;` - `justify-between`（两端对齐）
- `justify-content: space-around;` - `justify-around`（环绕对齐）
- `justify-content: space-evenly;` - `justify-evenly`（平均分布）
- `justify-content: stretch;` - 在 Flex 主轴上通常按 `flex-start` 处理；伸缩由子项的 `flex` 属性控制

对齐值可以配合 `safe` 使用，例如 `justify-content: safe center`：空间不足时回退到起始位置，避免内容无法访问。

#### align-items (交叉轴对齐方式) - （tailwindcss写法）

| CSS          | Tailwind         | 说明                                         |
| ------------ | ---------------- | -------------------------------------------- |
| `stretch`    | `items-stretch`  | 默认值，拉伸填充交叉空间                     |
| `flex-start` | `items-start`    | 交叉轴起始对齐（水平时顶部、垂直时左侧）     |
| `flex-end`   | `items-end`      | 交叉轴末端对齐（水平时底部、垂直时右侧）     |
| `center`     | `items-center`   | 交叉轴居中（水平时垂直居中、垂直时水平居中） |
| `baseline`   | `items-baseline` | 文字基线对齐                                 |

#### flex-direction (主轴方向) - Tailwind CSS 写法

- `flex-direction: row;` - `flex-row` (默认值，水平排列)
- `flex-direction: row-reverse;` - `flex-row-reverse` (水平反向排列)
- `flex-direction: column;` - `flex-col` (垂直排列)
- `flex-direction: column-reverse;` - `flex-col-reverse` (垂直反向排列)

#### flex-wrap (换行控制) - Tailwind CSS 写法

- `flex-wrap: nowrap;` - `flex-nowrap` (默认值，不换行)
- `flex-wrap: wrap;` - `flex-wrap` (允许换行)
- `flex-wrap: wrap-reverse;` - `flex-wrap-reverse` (反向换行)

#### flex (子项伸缩) - Tailwind CSS 写法

- `flex: 0 1 auto;` - `flex-initial` (默认值，不放大，可缩小)
- `flex: 1 1 0;` - `flex-1` (平均分配剩余空间)
- `flex: 1 1 auto;` - `flex-auto` (基于内容大小分配空间)
- `flex: none;` - `flex-none` (固定大小，不放大不缩小)

### Grid Layout

Grid 是二维布局，适合同时控制行和列，例如自适应多栏布局；只需沿一个方向排列时，可优先考虑 Flex。

<GridProperty/>

#### grid-template-columns (定义列和列的宽度) - （tailwindcss写法）

##### 基础列定义

| CSS 属性                                                                    | Tailwind 类                                                   | 说明                                            |
| --------------------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------- |
| `grid-template-columns: none;`                                              | `grid-cols-none`                                              | 默认值，不会自动生成列                          |
| `grid-template-columns: 1fr 2fr 1fr;`                                       | `grid-cols-[1fr_2fr_1fr]`                                     | 按照剩余空间比例分配（1:2:1）                   |
| `grid-template-columns: minmax(min-content, 1fr) minmax(min-content, 1fr);` | `grid-cols-[minmax(min-content,1fr)_minmax(min-content,1fr)]` | 每列先按内容最小宽度，再分配剩余空间（2列示例） |

##### 响应式自适应布局

| CSS 属性                                                    | Tailwind 类                                       | 说明                                       |
| ----------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------ |
| `grid-template-columns:repeat(auto-fit,minmax(200px,1fr))`  | `grid-cols-[repeat(auto-fit,minmax(200px,1fr))]`  | 每列最小 200px，剩余空间平分，自动换行     |
| `grid-template-columns:repeat(auto-fit,minmax(200px,auto))` | `grid-cols-[repeat(auto-fit,minmax(200px,auto))]` | 每列最小 200px，最大根据内容扩展，自动换行 |

##### 列定位与跨度

| CSS 属性               | Tailwind 类             | 说明                       |
| ---------------------- | ----------------------- | -------------------------- |
| `grid-column-start: 2` | `col-start-2`           | 从第 2 列开始              |
| `grid-column-end: 2`   | `col-end-2`             | 到第 2 列结束              |
| `grid-column: 2 / 5`   | `col-start-2 col-end-5` | 从第 2 列开始，第 5 列结束 |
| `grid-column: span 2`  | `col-span-2`            | 跨越 2 列（仅用于子元素）  |

##### repeat() 参数说明

- `auto-fit` - 尽量创建轨道，并折叠没有网格项的轨道
- `auto-fill` - 尽量创建轨道，保留没有网格项的轨道

#### grid-template-rows (定义行和行的宽度，与上诉的grid-template-cols类似)

`repeat()` 用来简化重复的行列定义。例如 `repeat(4, 1fr)` 定义四个等比例的轨道。

### 图片清晰度问题

为高密度屏幕准备图片时，可参考：图片像素尺寸 ≈ 显示的 CSS 尺寸 × 设备像素比（DPR）。使用 `srcset` 提供不同尺寸的图片，由浏览器选择合适的资源。

```js
//其中 1x表示DPR的值，要保持上诉公式成立
<img
    srcset="
    example.com/id/img1_1 1x,
    example.com/id/img1_2 2x, 
"
/>
```

使用宽度描述符（如 `400w`）时，`sizes` 告诉浏览器不同视口下的预计显示宽度：

```js
//size后面表示
//当视口宽度<= 600px时，图片显示宽度为400ox;
//其他情况下，图片显示宽度为800px
<img
    srcset="
    example.com/id/img1_400.jpg 400w,
    example.com/id/img1_800.jpg 800w
  "
    sizes="(max-width: 600px) 400px, 800px"
    src="example.com/id/img1_800.jpg"
    alt="示例图片"
/>
```

如果不同屏幕需要不同裁剪，或需要按支持情况选择图片格式，可以使用 `<picture>` 和其中的 `<source>`。

### tailwind 写法

Tailwind 的任意变体中，`&` 代表当前选择器，可用来组合子元素和兄弟元素选择器。

```css {3,7,11,15}
/* 特定[target-element][attribute] 指定元素指定属性 */
[attribute] 属性选择器——例：[nihao]选中所有**nihao**属性。
[attributeName-attributeVal]:some css

/* 子选择器，直接作用子元素，仅作用一代 */
father-ele > child-ele
[father-ele(&)>child-ele]:some css

/* 相邻兄弟选择器——选择紧接在某个元素后的第一个兄弟元素。 */
father-ele + brother-ele
[father-ele(&)+brother-ele]:some css【推荐peer和adjacent】

/* 通用兄弟选择器 —— 所有同级别的孩子元素也即同级别*/
father-ele ~ all-child-ele
[father-ele(&)_all-child-ele]:some css
```

## ES6

这里记录 JavaScript 的常用语言特性。

### Symbol

`Symbol()` 创建唯一的值，常用于避免对象属性名冲突。即使描述相同，两个新建的 Symbol 也不相等；Symbol 属性不会出现在 `Object.keys()` 和 `for...in` 中。

要让对象支持 `for...of` 和解构，可以实现 `Symbol.iterator`。

#### Symbol.iterator 实现可迭代对象或者数组

::: code-group-fold line-numbers

```js [demo.js]
// 可迭代对象
const myObj = {
    data: ['a', 'b'],
    [Symbol.iterator]() {
        let index = 0;
        const data = this.data;
        return {
            next() {
                return index < data.length
                    ? { value: data[index++], done: false }
                    : { value: undefined, done: true };
            }
        };
    }
};

//可迭代symbol数组,和普通数组一样不需要手动实现迭代器Symbol.iterator方法
const arr = [Symbol('a'), Symbol('b')];
let [a, b] = arr; //解构赋值
for (const c of arr) {
} // for .. of
```

:::

迭代器对象的 `next()` 返回包含 `value` 和 `done` 的结果。

##### Symbol属性或方法

::: code-group-fold line-numbers

```js [demo.js]
const GREET = Symbol('Gret');
class A {
    constructor() {
        this.__value = Symbol('value');
    }
    //特别注意这里，因为Symbol('Gret')!=Symbol('Gret') 所有必须要其引用，避免无法调用.
    [GREET]() {
        console.log('你好啊' + [this.__value]);
    }
}
const a = new A();
a[GREET]();
```

:::

### Proxy

`Proxy` 可以拦截对象的属性读取、赋值等操作；`Reflect` 提供对应的默认操作。

#### get

get(target,propertyKey,receiver),get拦截器。

- target:被代理的对象。
- propertyKey:被访问的属性名,也可以是Symbol。
- receiver: 通常是代理对象；传给 `Reflect.get` 可保留 getter 的接收者语义。

#### set

set(target,propertyKey,value,receiver),set拦截器。

- target: 被代理的对象。
- propertyKey: 被访问的属性名,也可以是Symbol。
- value 要赋值给属性的值
- receiver: 通常是代理对象；传给 `Reflect.set` 可保留赋值时的接收者语义。

::: code-group-fold line-numbers

```js [demo.js]
//set，get一般配合Reflect(js操作对象工具箱，简单明了)

//使用示例
const obj = {
    _a: 'testVal'
};

const proxy = new Proxy(obj, {
    get(target, propertyKey, receiver) {
        // 保证getter里的this指向proxy
        return Reflect.get(target, propertyKey, receiver);
    },
    set(target, propertyKey, value, receiver) {
        // 保证setter里的this指向proxy
        return Reflect.set(target, propertyKey, value, receiver);
    }
});
```

:::

需要撤销代理时，可用 `Proxy.revocable()` 创建代理并在结束后调用 `revoke()`。

### Promise并发处理

多个独立任务可以先启动，再根据失败处理方式选择组合方法：

- `Promise.all`：全部成功才返回结果；任一任务失败即拒绝。它不会撤销已启动的任务。
- `Promise.allSettled`：等待全部任务结束，分别返回成功或失败状态。
- `Promise.race`：采用最先结束的任务结果，其他任务仍会继续执行。

```js
const p1 = Promise.resolve(1);
const p2 = Promise.reject('error');
const p3 = Promise.resolve(3);

Promise.allSettled([p1, p2, p3]).then((results) => {
    console.log(results);
    // [
    //   { status: 'fulfilled', value: 1 },
    //   { status: 'rejected', reason: 'error' },
    //   { status: 'fulfilled', value: 3 }
    // ]
});
```

### Module & Commonjs

ES Modules（ESM）和 CommonJS 都用于组织模块，主要区别在加载方式和导出绑定：

| 维度     | ES Modules                                    | CommonJS                                                       |
| -------- | --------------------------------------------- | -------------------------------------------------------------- |
| 语法     | `import` / `export`                           | `require()` / `module.exports`                                 |
| 加载     | 静态导入可在执行前分析；也支持动态 `import()` | `require()` 在运行时调用，可按条件加载                         |
| 导出     | 导入是只读的实时绑定                          | `require()` 返回导出的值；对象属性变化可通过同一对象引用观察到 |
| 构建优化 | 静态导入导出便于工具进行 tree shaking         | 动态用法通常更难静态分析                                       |

### WeakMap & Map

两者都保存键值关系，区别在于对键的引用和能否遍历：

| 维度     | Map                        | WeakMap                                     |
| -------- | -------------------------- | ------------------------------------------- |
| 键       | 可使用任意值               | 对象或未注册的 Symbol                       |
| 垃圾回收 | Map 存活时会强引用其键和值 | 不会仅因键存在于 WeakMap 中而阻止该键被回收 |
| 遍历     | 可遍历，有 `size`          | 不可遍历，也没有 `size`                     |

需要遍历或统计条目时用 Map；为对象附加不应延长其生命周期的数据时，可以用 WeakMap。垃圾回收的具体时间不可预测。

### stage3

TypeScript 5 支持新的装饰器语义：装饰器接收被装饰的值和上下文，可以使用 `context.addInitializer()` 安排初始化逻辑。它与传统装饰器的参数和元数据机制不同。

下面使用 `reflect-metadata` 演示手动写入元数据；需先安装并引入该库。新标准不会自动提供传统 `emitDecoratorMetadata` 生成的参数类型信息。

::: code-group-fold line-numbers

```ts [class-decorator.ts]
import 'reflect-metadata';

function classDecorator<T extends abstract new (...args: any[]) => any>(
    target: T,
    context: ClassDecoratorContext<T>
) {
    // 类装饰器的初始化回调在类定义完成时运行
    context.addInitializer(function () {
        Reflect.defineMetadata('label', 'service', this);
    });
}

@classDecorator
class Service {}

console.log(Reflect.getMetadata('label', Service)); // service
```

```ts [method-decorator.ts]
import 'reflect-metadata';

function methodDecorator<This, Args extends unknown[], Result>(
    target: (this: This, ...args: Args) => Result,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Result>
) {
    // 将元数据附加到原方法，不必先创建实例
    Reflect.defineMetadata('label', String(context.name), target);
}

class Service {
    @methodDecorator
    run() {}
}

console.log(Reflect.getMetadata('label', Service.prototype.run)); // run
```

```ts [property-decorator.ts]
import 'reflect-metadata';

function propertyDecorator<This, Value>(
    _value: undefined,
    context: ClassFieldDecoratorContext<This, Value>
) {
    // 实例字段的初始化回调会在每次创建实例时运行
    context.addInitializer(function (this: This) {
        Reflect.defineMetadata('label', String(context.name), this as object, context.name);
    });
}

class Service {
    @propertyDecorator
    name = 'example';
}

const service = new Service();
console.log(Reflect.getMetadata('label', service, 'name')); // name
```

:::

## Mobile

移动端适配先看布局和交互是否可以共用，再选择适配方式：

- **布局差异较小**：使用弹性布局、Grid 和媒体查询调整断点。
- **尺寸需要随视口变化**：按需结合 `rem`、`vw`、`vh` 等单位，并检查文字缩放、横屏和不同高度下的表现。
- **交互或业务差异较大**：考虑拆分移动端和桌面端组件，共享数据和业务逻辑；不要仅凭设备宽度判断设备能力。

`rem` 相对根元素字号，适合统一调整尺寸，但不会自动适配所有方向。Tailwind 的 `sm`、`md` 等响应式前缀本质上也使用媒体查询。

## 安全

前端安全需要组合多种措施：CSP 限制页面可加载的资源，输出转义和输入处理有助于防范 XSS，CSRF 则需要结合 Cookie 策略和服务端校验处理。反向代理可以隐藏源站地址，但不能单独防御 DDoS。

CSP 应根据实际资源来源逐步收紧，并通过 HTTPS 传输。以下指令是配置参考，不是所有应用都必须使用的固定清单。

---

### 核心安全指令（按需配置） {#核心安全指令必须强制启用}

| 指令                               | 作用                                   | 示例               |
| ---------------------------------- | -------------------------------------- | ------------------ |
| **`default-src 'self' sample.ip`** | 兜底机制，限制所有未单独声明的资源     | `'self' sample.ip` |
| **`script-src 'self' sample.ip`**  | 限制 JS 来源，防止外部恶意脚本         | `'self' sample.ip` |
| **`connect-src 'self' sample.ip`** | 限制 XHR/Ajax/WebSocket 请求           | `'self' sample.ip` |
| **`object-src 'none'`**            | 禁止 `<object>`、`<embed>`、`<applet>` | `'none'`           |
| **`frame-ancestors 'self'`**       | 限制页面被谁 iframe 嵌入               | `'self'`           |
| **`form-action 'self' sample.ip`** | 限制表单提交目标                       | `'self' sample.ip` |
| **`base-uri 'self'`**              | 限制 `<base>` 标签的 href              | `'self'`           |
| **`block-all-mixed-content`**      | 禁止 HTTPS 页面加载 HTTP 资源          | _(无参数)_         |
| **`upgrade-insecure-requests`**    | 自动升级 HTTP 请求为 HTTPS             | _(无参数)_         |

---

### 细化与增强选项（可选）

| 指令                                         | 作用                                                  | 示例                                                 |
| -------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------- |
| `script-src-elem 'self'`                     | 单独控制 `<script>` 标签的脚本来源                    | `'self'`                                             |
| `style-src 'self' sample.ip 'unsafe-inline'` | 限制 CSS 来源，`unsafe-inline` 允许内联样式（不安全） | `'self' sample.ip 'unsafe-inline'`                   |
| `img-src 'self' sample.ip`                   | 限制图片来源                                          | `'self' sample.ip`                                   |
| `font-src 'self' sample.ip`                  | 限制字体文件来源                                      | `'self' sample.ip`                                   |
| `frame-src 'self' sample.ip`                 | 限制可嵌入 iframe 来源                                | `'self' sample.ip`                                   |
| `require-trusted-types-for 'script'`         | 配合 Trusted Types API 防止 DOM 注入                  | `'script'`                                           |
| `report-to`                                  | 配置 CSP 违规报告发送位置                             | `{"group":"g","max_age":10886400,"endpoints":[...]}` |

---

### 安全建议

1. **尽量不要使用 `unsafe-inline`**，改用 **`nonce`** 或 **`hash`** 验证内联脚本。
2. 使用 HTTPS，并按兼容性需要考虑 `upgrade-insecure-requests`；它不能代替服务端正确配置 HTTPS。
3. 配置 **`report-to`**，便于及时发现并修复策略违规。

```js{1,5-8}
// report-to参数字段，如果要兼容则使用report-uri即可【report-uri sample.ip】
group：指定报告目标的名称，通常对应于 Content-Security-Policy 中的 report-to。
max_age：报告目标的最大有效时间（秒）。
endpoints：定义多个报告端点。一个端点包含一个 URL，报告将发送到这些 URL。
//========================示例============================
Report-To: {"group":"csp-reports-sample","max_age":10,"endpoints":
[{"url":"https://example.com/csp-reports-samples"}]}
//========================结束============================

//JSON报告字段
document-uri：引发违规的页面 URL。
referrer：触发违规请求的页面的引荐来源。
violated-directive：违反的具体指令。
effective-directive：实际触发违规的指令（可能不同于 violated-directive）。
original-policy：请求的完整 CSP 策略。
blocked-uri：被阻止的资源 URL。
source-file：违反策略的资源文件。
line-number：资源出现问题的代码行号。
```

### Nuxt 开发模式 CSP 配置

> [!WARNING]
> 下表是某些开发环境可能需要的宽松配置示例，具体应按工具和报错收紧；不要用于生产环境。

| 指令              | 配置                                                                  | 原因                                              |
| ----------------- | --------------------------------------------------------------------- | ------------------------------------------------- |
| `script-src`      | `* 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:*` | HMR、DevTools、Vue 编译器需要动态脚本和 WebSocket |
| `script-src-elem` | `* 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:*` | 动态 `<script>` 标签注入和模块热更新              |

### CSP 实现策略对比（Nuxt）

#### 注入方式选择

| 方式          | 优点                                     | 缺点                                 | 推荐 |
| ------------- | ---------------------------------------- | ------------------------------------ | ---- |
| HTTP 响应头   | 支持完整的策略能力，适合由服务器统一配置 | 需要控制响应头                       | 推荐 |
| `<meta>` 标签 | 适用于无法配置响应头的静态页面           | 部分指令不可用，只约束标签之后的内容 | 备选 |

#### 配置方式对比

| 方式                  | 性能      | 灵活性    | 维护成本  | 适用场景          |
| --------------------- | --------- | --------- | --------- | ----------------- |
| **nuxt.config**       | ⭐⭐⭐ 高 | ⭐ 低     | ⭐ 简单   | 全局统一策略      |
| **server middleware** | ⭐⭐ 中   | ⭐⭐⭐ 高 | ⭐⭐ 中等 | 页面级/权限级策略 |

使用 nonce 时，每次响应生成不可预测的新值，并只为可信脚本添加该值。不要对最终 HTML 中所有脚本统一追加 nonce，否则注入的恶意脚本也可能得到许可。

### 演示代码（Nuxt为例）

服务端可以为每次响应生成随机 nonce，并通过响应头下发策略。示例仅演示 nonce 的生成和传递；具体的脚本注入方式取决于应用使用的 Nuxt/Nitro 版本。

```ts
// server/middleware/csp.ts
import { randomBytes } from 'node:crypto';

export default defineEventHandler((event) => {
    const nonce = randomBytes(16).toString('base64');
    event.context.cspNonce = nonce;
    event.node.res.setHeader(
        'Content-Security-Policy',
        `default-src 'self'; script-src 'self' 'nonce-${nonce}'; object-src 'none'; base-uri 'self'`
    );
});
```

将同一个 nonce 通过框架支持的渲染机制传给可信脚本，并根据实际样式、连接和图片来源补充策略。上线前可先使用 `Content-Security-Policy-Report-Only` 观察违规报告，再启用强制策略。含 nonce 的 HTML 还需正确处理缓存，避免不同响应复用同一个 nonce。

参考 [MDN 的 CSP 实施指南](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/CSP)。
