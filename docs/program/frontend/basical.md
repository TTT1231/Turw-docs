---
outline: [2, 3]
---

# Basical

## CSS

这个文档是有关于css的示例和详解。

### Flex Layout

flex布局默认方向是水平摆放即`flex-direction:row` 即主轴方向。还有一根交叉轴与主轴垂直。其主要提供一种有效的方式来对容器中的项目进行排列、对齐和分配空间，即使它们的大小是未知或动态的。

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
- `justify-content: stretch;` - `justify-stretch`（把内容拉伸）

::: tip 提示
后面有一个`safe`(css)，防止内容溢出容器，在css中直接加入即可`safe`，但是tailwindcss不支持。
:::

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

grid布局是一个二维布局系统，同时处理多行多列。与flex布局(一维布局系统)相比，grid更适合创建复杂的网页布局。一般用来实现多栏布局方便实现自适应和重排布局。因而更适合需要控制行和列的场景。

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

- `auto-fit` - 尽量多放置网格项，多余空间收缩为 0
- `auto-fill` - 尽量多放置网格项，多余空间不会收缩

#### grid-template-rows (定义行和行的宽度，与上诉的grid-template-cols类似)

::: tip 提示
repeat(重复次数, 列宽度)，表示在列中重复多少次，简化重复列或者行的写法。例如repeat(4,1fr)表示4列，每列宽度都是1fr。
:::

### 图片清晰度问题

原始尺寸 = 样式尺寸（原始图片的长和宽） \* DPR（devicePixelRatio）  
srcset提供多个图片源，让游览器自行选择（要提供多个图片不同尺寸大小）示例

```js
//其中 1x表示DPR的值，要保持上诉公式成立
<img
   srcset="
    example.com/id/img1_1 1x,
    example.com/id/img1_2 2x, 
"
/>
```

img还有一个size属性，目的时在告诉游览器在不同视口（viewport）或布局条件下，图片实际会显示的宽度是多少，从而让游览器选择最合适的图片。例如

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

::: tip 提示
如果是根据设备尺寸加载不同格式、和不同内容的图片场景。例如手机端加载`png`、游览器端加载`webp`，这时候就需要结合`picture`去选择对应对应的图片了。

它使用`source`进行选择，该用法和img用法一样。
:::

### tailwind 写法

::: warning 注意

**&** 在tailwind中表父级

:::

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

js下一代标准，使得js可以编写复杂系统.

### Symbol

Symbol() 会生成**全新且唯一**的值，核心作用是避免对象属性名冲突，默认无法通过 `for...in`、`Object.keys()` 等常规方式枚举，若需遍历需定义 `Symbol.iterator` 方法（支持 `for...of`、解构赋值等）。

::: tip 提示
其唯一性体现在即使传入相同描述字符串，生成的 Symbol 也不相等（例：`Symbol('a') !== Symbol('a')`），字符串参数仅用于区分标识，不影响唯一性。
:::

#### Symbol.iterator 实现可迭代对象或者数组

::: code-group-fold line-numbers

```js [demo.js]
//可迭代对象
const myObj = {
    let targetIndex = 0;
    const data = this.data;
    return {
        next(){
            return targetIndex<data.length?{
                value:data[targetIndex++],
                done:false
            }:{
                value:undefined,done:true
            }
        }
    }
}

//可迭代symbol数组,和普通数组一样不需要手动实现迭代器Symbol.iterator方法
const arr = [Symbol('a'), Symbol('b')];
let [a,b] = arr; //解构赋值
for (const c of arr){} // for .. of
```

:::

::: tip 提示
迭代器对象必须实现next方法，迭代协议要求。
:::

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

一般用作对象代理，拦截对象的属性等。

#### get

get(target,propertyKey,receiver),get拦截器。

- target:被代理的对象。
- propertyKey:被访问的属性名,也可以是Symbol。
- receiver: 代理本身也即Proxy本身,避免原型链问题导致this指向windows。

#### set

set(target,propertyKey,value,receiver),set拦截器。

- target: 被代理的对象。
- propertyKey: 被访问的属性名,也可以是Symbol。
- value 要赋值给属性的值
- receiver: 代理本身也即Proxy本身,避免原型链问题导致this指向windows。

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
::: tip 提示
当代理用完不想用时，或者代理就使用一次，就可以**取消代理**Proxy.revocable revocable:可撤销的，可取消的
:::

### Promise并发处理

当有多个网络请求promise或者多个异步promise时，一个一个获取或异步等待速度慢时，就可以将多个请求promise封装成一个数组或队列，然后借助es6中allSettled进行同时处理。最后进行统一处理错误或者成功的结果。  
当然了业务不同具体用的方法也不同，但是本质都是差不多的，只是**发生错误的逻辑不同**

- Promise.all 当业务包含原子性、一致性等，就可以使用它，只要一个失败整个Promise并发数组都会失败
- Promise.allSettled 不关心单个失败，只关心具体成功的结果或者失败的结果
- Promise.race 竞争promise，谁快，谁就最先返回，其他的promise继续执行但是结果不返回，只返回最快的promise结果

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

module

- 静态加载，编译时就确定了依赖关系和导出内容(由于其静态加载功能，因而可以使用静态分析并移除未使用代码优化技术也即treeShaking)。
- 只读引用，可以实时绑定。

commonjs

- 动态加载，只在需要时才会加载(由于动态加载，因而静态treeShaking不支持)。
- 基于nodejs，导入内容不会同步变化。

### WeakMap & Map

**Map**强引用，`Map`一直会持有这个对象的引用，即使外部没有变量引用这个对象，垃圾回收（GC）不会回收它，**会占用内存**，除非手动置空。

**WeakMap**弱引用，外部没有变量引用这个`WeakMap`的时候，垃圾回收（GC）自动回收，避免了忘记手动置空，导致的内存泄漏。

### stage3

::: code-group-fold line-numbers

<!-- prettier-ignore-start -->
```ts [class-decorator.ts]
/**
 * @description 类装饰器 - 新标准 (Stage 3 Decorators)
 * @returns 返回一个类装饰器函数
 * @template T - 传递给装饰器的泛型参数，解决this类型问题
 * @returns @param target - 被装饰的类构造函数
 * @returns @param context - 类装饰器上下文，包含类的元数据和初始化器
 */
export function classDecorator(token?: string) {
   return function <T extends abstract new (...args: any[]) => any>(
      target: T,
      context: ClassDecoratorContext<T>
   ): T | void {
      /**
       * !获取不了参数名称，这里是编译时，运行时会被删除所以获取不到
       * @description 获取构造函数参数类型数组
       * @deprecated 这里ts编译器在新的版本中，由于违反了职责单一原则，不再自动添加设计时元数据
       */
      // Reflect.getMetadata('design:paramtypes', target) || [];

      /**
       * TODO: 设置类修饰器自定义元数据
       * !特别注意，context.addInitializer在类装饰器和方法装饰器还有属性装饰器中的行为不同，体现在
       *    - 类装饰器中，addInitializer的回调在类定义完成时执行，this指向类的构造函数（类本身）
       *    - 方法装饰器中，addInitializer的回调在类实例化时执行，this指向类的实例对象
       *    - 属性装饰器中，同方法装饰器类似，其必须要初始化类实例才能执行
       * @example @usage
       * ```ts
       * @classDecorator()
       * class A {}
       * const class_value = Reflect.getMetadata('custom:class', A);
       * //打印：类元数据，不用实例化类
       * console.log('类元数据：', class_value);
       * ```ts
       */
      context.addInitializer(function (this: T) {
         Reflect.defineMetadata('custom:class', '类元数据，不用实例化类', target);
      });

      //不对类进行修改，返回undefined
      return undefined;
   };
}
```
<!-- prettier-ignore-end -->

<!-- prettier-ignore-start -->
```ts [method-decorator.ts]
/**
 * @description 方法装饰器 - 新标准 (Stage 3 Decorators)
 * @returns 返回一个方法装饰器函数
 * @template T - 传递给装饰器的泛型参数，解决this类型问题
 * @template This - 方法的this类型
 * @template Args - 方法参数类型元组
 * @template Return - 方法返回值类型
 * @returns @param target - 被装饰的方法，指向原方法
 * @returns @param context - 方法装饰器上下文，包含方法的元数据
 */
export function methodDecorator<T>() {
   return function <This extends Object, Args extends any[], Return>(
      target: (this: This, ...args: Args) => Return,
      context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
   ) {
      /**
       * @description 类定义时执行，直接在target（原方法）上设置元数据，将元数据附加到原方法中,
       *              可以通过 A.prototype.[methodName] 访问，然后获取元数据
       * @usage       用于不用实例化类就能获取元数据
       * !注意: 如果是在context.addInitializer中定义元数据，则在类实例化时执行,
       *              !该方法中的回调是在类实例化阶段执行的，不是在定义阶段
       * @usage       然后如果想要在实例化时获取元数据可以将元数据绑定到类实例上，必须在context.addInitializer中定义
       *
       * @example
       * ```ts
       * class A {
       *   @methodDecorator()
       *   say() {console.log('say'); }
       * }
       * const method_value = Reflect.getMetadata('custom:method:noInit', A.prototype.say, 'say');
       * //打印：类不用初始化就能获取元数据
       * console.log('方法元数据：', method_value);
       * ```ts
       */
      Reflect.defineMetadata(
         'custom:method:noInit',
         '类不用初始化就能获取元数据',
         target,
         context.name
      );

      /**
       * @description 在运行阶段获取元数据，编译时必须要写在context.addInitializer回调中
       * @note 注意this 指向问题
       * @example @usage
       * ```ts
       * class A {
       *   @methodDecorator()
       *   say() {console.log('say'); }
       * }
       * const a = new A();
       * const method_value = Reflect.getMetadata('custom:method:mustInit', a, 'say');
       * //打印：类必须要初始化才能获取元数据
       * console.log('方法元数据：', method_value);
       * ```ts
       */
      context.addInitializer(function (this: This) {
         Reflect.defineMetadata(
            'custom:method:mustInit',
            '类必须要初始化才能获取元数据',
            this.constructor.prototype,
            context.name
         );
      });

      // 在新标准中,方法装饰器返回新的方法实现或 undefined，同类装饰器返回类似
      //TODO 不修改方法实现，返回undefined
      return undefined;

      //TODO 修改方法实现
      // return function (this: This, ...args: Args): Return {
      //     console.log(`Calling method: ${String(context.name)}`);
      //     return target.apply(this, args);
      // };
   };
}
```
<!-- prettier-ignore-end -->

<!-- prettier-ignore-start -->
```ts [property-decorator.ts]
/**
 * @description 属性装饰器 - 新标准 (Stage 3 Decorators)
 * @template T - 指向类类型
 * @template Value - 属性值类型，也就是属性的类型
 * @returns @param target - 被装饰的属性，新标准值为undefined
 * @returns @param context - 属性装饰器上下文，包含属性的元数据
 * @returns @returns @param this - 指向类实例
 */
export function propertyDecorator<T extends Object, Value>() {

    //!第一个参数由于target是undefined，所以无法直接定义元数据，可以直接省略
    return function (
        context: ClassFieldDecoratorContext<T, Value>
    ): (initialValue: Value) => Value {

        /**
         * !十分注意的是： 这里的this指向类实例，但是在addInitializer回调中，this指向类的构造函数。也就是说这里的addInitializer每次实例化时执行
         * TODO 在类实例化时定义元数据
         * @example @usage
         * ```ts
         * class A {
         *   @propertyDecorator()
         *   name: string = '你好啊';
         * }
         * const a = new A();
         * const property_value = Reflect.getMetadata('custom:property', a, 'name');
         * //打印：类必须要初始化才能获取元数据
         * console.log('属性元数据：', property_value);
         * ```ts
         */

        context.addInitializer(function (this: T) {
            Reflect.defineMetadata(
                "custom:property",
                "property_value",
                this,
                context.name
            );
        });

        //TODO 修改属性的初始值 ,这里不修改直接原样返回
        //!注意类型
        return function (this: T, initialValue: Value): Value {
            return initialValue;
        };
    };
}

```
<!-- prettier-ignore-end -->

:::

## Mobile

如果项目中有`Web`和`H5`情况下，去做移动端适配时，考虑业务方向来进行技术选型。

- 以`Web`为主，`H5`为辅（使用比较低情况下），且不是主要业务方向，那么这里就可以考虑使用`taidwindcss`和`媒体查询@media`进行辅助适配。

- 以`Web`为主，`H5`为辅（使用中等情况下），那么这里就可以考虑使用`taidwindcss`和`媒体查询@media`并结合`rem`和`vw/vh`视口进行适配。

- 业务复杂，`Web`为主，`H5`为主，此时那么就考虑移动端`H5`和`Web`分成两个组件写且样式进行隔离，不用一套代码进行适配，这样开发成本和维护成本都比较友好，这时候就可以根据平板尺寸`tailwind md`来进行判断是否是移动端，来适配两个不同组件。

::: danger 危险
`rem`做适配的时候，其只能根据`font-size`进行适配，并且只能通过动态设置这个值，来设置rem大小，这是会有多余`JS`，同时还要考虑动态扩展，去适配动态width

但是这有个缺点，它是一个**正方形**，只有一个边可以设置，当监听width时候，Height就是没适配了。

因此实际使用的时候很少考虑使用`rem`进行适配。
:::

::: tip 提示
`媒体查询@media`写的话去适配不同设备尺寸，可能会面临css代码过多，可以完全抛弃它，选用`tailwindcss`中`sm`、`md`、`lg`、`xl`效果也是一样的，在快速开发下速度也快，维护也好。
:::


## 安全

前端安全包括csp内容安全，防止xss攻击和脚本注入，和防止跨站请求伪造  
CSRF和配置生产反向代理隐藏真实服务器ip防范ddos攻击。

通过配置 CSP，可以有效阻止恶意 JavaScript 执行和跨站资源注入。  
部署时应注意：

- **防御恶意用户篡改响应头**（拦截并修改 HTTP Header）
- **强制使用 HTTPS 加密传输**，防止中间人攻击
- **严格限制资源来源**，避免策略过宽

---

### 核心安全指令（必须强制启用）

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
2. 开启 **`upgrade-insecure-requests`** 与 **`block-all-mixed-content`**，确保统一加密请求。
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
> 开发模式下，Nuxt/Vite/Webpack 需要动态脚本支持，必须允许以下行为：

| 指令              | 配置                                                                  | 原因                                              |
| ----------------- | --------------------------------------------------------------------- | ------------------------------------------------- |
| `script-src`      | `* 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:*` | HMR、DevTools、Vue 编译器需要动态脚本和 WebSocket |
| `script-src-elem` | `* 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:*` | 动态 `<script>` 标签注入和模块热更新              |

### CSP 实现策略对比（Nuxt）

#### 注入方式选择

| 方式                 | 优点                                 | 缺点                           | 推荐 |
| -------------------- | ------------------------------------ | ------------------------------ | ---- |
| **HTTP Response 头** | 客户端无法修改，精准控制，优先级最高 | -                              | ✅   |
| **`<meta>` 标签**    | 可动态修改                           | 客户端可修改，优先级低于响应头 | ❌   |

#### 配置方式对比

| 方式                  | 性能      | 灵活性    | 维护成本  | 适用场景          |
| --------------------- | --------- | --------- | --------- | ----------------- |
| **nuxt.config**       | ⭐⭐⭐ 高 | ⭐ 低     | ⭐ 简单   | 全局统一策略      |
| **server middleware** | ⭐⭐ 中   | ⭐⭐⭐ 高 | ⭐⭐ 中等 | 页面级/权限级策略 |

::: tip 提示
**推荐方案**：在 server middleware 中动态生成 nonce 和基础 CSP，结合 render hook 为脚本标签注入 nonce，代码最少、最好维护。
:::

### 演示代码（Nuxt为例）

这里服务端中间件只需完成csp指令的设置，和动态生成唯一的**nonce**即可。  
最后在向服务端返回对应html之前，为\<script\>增加nonce即可

::: details 服务端中间件，完成csp指令的设置和生成nonce

```ts
import crypto from 'crypto';
export default defineEventHandler((event) => {
   const res = event.node.res;
   const isDev = process.env.NODE_ENV === 'development';
   const url = event.node.req.url || '';
   const isApiRoute = url.startsWith('/api/');

   // 为本次请求生成 nonce
   const nonce = crypto.randomBytes(16).toString('base64');
   event.context.cspNonce = nonce;

   const reportUri = 'http://localhost:7001/csp-report';

   // API 路由简单策略
   if (isApiRoute) {
      const apiCsp = [
         "default-src 'none'",
         "connect-src 'self' http://localhost:7001",
         `report-uri ${reportUri}`
      ].join('; ');
      res.setHeader('Content-Security-Policy', apiCsp);
      return;
   }

   // 公共指令
   const commonDirectives = [
      "img-src 'self' data: blob:",
      "base-uri 'self'",
      "form-action 'self'",
      `report-uri ${reportUri}`
   ];

   let modeDirectives: string[];

   if (isDev) {
      // 开发模式差异部分
      modeDirectives = [
         'default-src * data: blob:',
         "script-src * 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:*",
         "script-src-elem * 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:*",
         "style-src * 'unsafe-inline'",
         'connect-src * ws://localhost:* http://localhost:* http://127.0.0.1:*',
         'font-src * data:',
         'frame-src *',
         "object-src 'none'",
         'frame-ancestors *'
      ];
   } else {
      // 生产模式差异部分
      modeDirectives = [
         "default-src 'self'",
         `script-src 'self' 'nonce-${nonce}'`,
         `script-src-elem 'self' 'nonce-${nonce}'`,
         "style-src 'self' 'unsafe-inline'",
         "connect-src 'self' http://localhost:7001",
         "font-src 'self' data:",
         "frame-src 'none'",
         "object-src 'none'",
         "frame-ancestors 'none'",
         'upgrade-insecure-requests',
         'block-all-mixed-content'
      ];
   }

   // 合并模式指令和公共指令
   const csp = [...modeDirectives, ...commonDirectives].join('; ');
   res.setHeader('Content-Security-Policy', csp);
});
```

:::

::: details 服务端插件，为script添加nonce

```ts
//这个render:response会在渲染html完后，准备向客户端返回触发。
export default defineNitroPlugin((nitroApp) => {
   nitroApp.hooks.hook('render:response', (response, { event }) => {
      const nonce = event.context.cspNonce as string | undefined;
      if (!nonce) return;
      if (!response.body || typeof response.body !== 'string') return;

      // 只处理 HTML
      const headers = response.headers || {};
      const contentType = (headers['content-type'] || headers['Content-Type'] || '') as string;
      if (!contentType.includes('text/html')) return;

      // 给没有 nonce 的 <script> / <style> 标签自动加上 nonce
      // 注意：避免重复添加（用负向前瞻排除已有 nonce）
      response.body = response.body
         // 匹配 <script 开头的标签，排除已带 nonce 的
         .replace(/<script\b(?![^>]*\bnonce=)/g, `<script nonce="${nonce}"`)
         // 匹配 <style 开头的标签，排除已带 nonce 的
         .replace(/<style\b(?![^>]*\bnonce=)/g, `<style nonce="${nonce}"`);
   });
});
```

:::
