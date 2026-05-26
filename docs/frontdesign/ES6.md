# ES6

js下一代标准，使得js可以编写复杂系统.

## Symbol

Symbol() 会生成**全新且唯一**的值，核心作用是避免对象属性名冲突，默认无法通过 `for...in`、`Object.keys()` 等常规方式枚举，若需遍历需定义 `Symbol.iterator` 方法（支持 `for...of`、解构赋值等）。

::: tip 提示
其唯一性体现在即使传入相同描述字符串，生成的 Symbol 也不相等（例：`Symbol('a') !== Symbol('a')`），字符串参数仅用于区分标识，不影响唯一性。
:::

### Symbol.iterator 实现可迭代对象或者数组

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

#### Symbol属性或方法

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

## Proxy

一般用作对象代理，拦截对象的属性等。

### get

get(target,propertyKey,receiver),get拦截器。

- target:被代理的对象。
- propertyKey:被访问的属性名,也可以是Symbol。
- receiver: 代理本身也即Proxy本身,避免原型链问题导致this指向windows。

### set

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

## Promise并发处理

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

## es6中Module与commonjs模块的差异和区别

module

- 静态加载，编译时就确定了依赖关系和导出内容(由于其静态加载功能，因而可以使用静态分析并移除未使用代码优化技术也即treeShaking)。
- 只读引用，可以实时绑定。

commonjs

- 动态加载，只在需要时才会加载(由于动态加载，因而静态treeShaking不支持)。
- 基于nodejs，导入内容不会同步变化。

## WeakMap和Map

**Map**强引用，`Map`一直会持有这个对象的引用，即使外部没有变量引用这个对象，垃圾回收（GC）不会回收它，**会占用内存**，除非手动置空。

**WeakMap**弱引用，外部没有变量引用这个`WeakMap`的时候，垃圾回收（GC）自动回收，避免了忘记手动置空，导致的内存泄漏。

## stage3装饰器

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
