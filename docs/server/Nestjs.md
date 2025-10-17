---
outline: deep
---

# Nestjs

## 源码逻辑

### 响应Observable流程

整个响应流程指：**真正开始处理请求到返回响应数据结束**，考虑一个请求生命周期如下：  


1、请求进入 → 2、中间件 → 3、守卫 → 4、拦截器（Before） → 5、管道 → 6、控制器方法（业务） → 7、拦截器（After） → 8、响应发出

**这里就是从4→7这个过程，也就是响应式编程流程**，其他的算http生命周期。

**Nestjs**使用Observable 来统一内部处理的**所有的抽象模型和流程**【统一输出，例如输出一个number,Promise,Observer等等，nest统一使用Observable处理，特别是`微服务`、`WebSocket`、`流操作`等等】，内部使用**RxJS**的解决**异步操作**的便利性和功能强大性。

考虑这样一个`RxJS`中的of
```ts
//RxJX of
//from方法跟of类似，不过from可以从数组、迭代对象、Promise或者类Observable的数据源创建一个Observable
function of(value:any):Observable {
   return new Observable(subscriber=>{
      //Observable的执行体,一旦被订阅这里会立即执行
      subscriber.next(value); //向订阅者发送value

      //input stream complete
      subscriber.complete();
   })
}

//核心：当被订阅的时候会自动执行
const observables = of[1,2]
observables.subscribe({
   next:val=>console.log(val) //print 1,2
})
```

那么`Nestjs`响应式设计类似，我们看看这个拦截器的内部自动实现,**核心实现与上诉类似**

```ts
//抽象类型
export interface CallHandler<T = any> {
   /**
     * Returns an `Observable` representing the response stream from the route
     * handler.
   */
   handle(): Observable<T>;
}

handle()返回 new Observable(subscrier =>{}),在nestjs框架在触发订阅的时候会被触发（这个在最外部订阅的Observable触发，以HTTP的请求周期为例就是在最后一个after拦截器之后，nest会启动该订阅）
//这个订阅，订阅的是最外部的Observable
//这个Observable是nestjs针对拦截器、管道、控制器处理好的一条Observable链
//也就是最后一个拦截器中返回的哪个Observable
//类似单链表，随着一个一个的节点的加入，当最后一个节点加入时，组成了一条完整的单链表



/**
 * 调用 next.handle() 会将当前的 HTTP 请求传递给下一个拦截器或最终的 HTTP 处理逻辑（如控制器）。
 * next.handle() 返回的是一个 RxJS Observable，代表整个请求-响应流程的异步操作流。
 *
 * NestJS 内部会订阅这个 Observable，并在数据流（比如响应数据）发出时，
 * 自动将响应内容写入底层的 HTTP 平台响应对象（如 Express 或 Fastify 的 Response）。
 * 也就是说，**不需要手动将 Observable 的结果转换为 HTTP 响应**，NestJS 会帮你完成。
 *
 * 这里我们通过 .pipe(tap(...)) 对这个 Observable 进行“监听”，
 * 但并不会改变流的正常执行流程。tap 是一个纯副作用操作符，
 * 它允许我们在不干预数据流的情况下，观察流中的事件：
 * - next: 每当有新的数据项（如响应数据）发出时触发（但通常在 HTTP 场景中可能不常见，除非手动发出多个值）。
 * - complete: 当整个流成功结束（即请求处理完毕，响应已发送）时触发。
 *
 * 所以这里的 tap 主要用于在请求/响应流程中的某些关键节点打印日志，
 * 不会影响最终响应返回给客户端的过程。
 */
return next.handle().pipe(
   tap({
      //在该拦截器结束时，会打印After intercept
      next: () => {
         console.log('After intercept'); 
      },
      //在该拦截器流结束时会打印
      complete: () => {
         console.log('拦截流结束');
      },
   }),
);
```

**在Controller方法中，最后的结果也会被Observable包裹，统一返回格式，统一拦截器的Obserable和管道的链式调用触发**

### DI思想

[详情见服务端架构设计思想](./architect-design-thought.md#职责、模块分离思想)

### 装饰器 

装饰器的本质是一个函数，用来修饰类、方法、属性。  

- 类装饰器，可以给类添加`元数据`也可以返回一个`新构造函数`
- 方法装饰器,接受类的原型、方法名、方法描述符作为参数，`修改方法实现`
- 属性装饰器,接受类的原型和属性名作为参数，可以对属性进行元数据`标记`

<span class=" text-red-400">注意：</span>截至`2025/10/12` Nestjs还是使用stage2写法，因此它会自动添加元数据`design:paramtypes`但这种不安全，同时由于是stage2写法所有在tsconfig.json中必须要配置`emitDecoratorMetadata`和`experimentalDecorators`**值为true**，否则其内部提供的元数据会失效，DI和AOP会失效，工厂函数创建实例失败。


**使用示例:【ts5标准 (Stage 3 Decorators)】**  

```ts
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
            Reflect.defineMetadata("custom:class", "类元数据，不用实例化类", target);
        });

        //不对类进行修改，返回undefined
        return undefined;
    };
}

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
        context: ClassMethodDecoratorContext<
            This,
            (this: This, ...args: Args) => Return
        >
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
            "custom:method:noInit",
            "类不用初始化就能获取元数据",
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
                "custom:method:mustInit",
                "类必须要初始化才能获取元数据",
                this.constructor.prototype,
                context.name
            )
        })

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

```ts
```

## 元数据处理实践

针对**Nestjs**提供的两种元数据处理`Reflector`和`MetadataScanner`两者侧重点不同，虽然都是简化元数据处理，两者在使用场景和侧重点不同。

**Reflector:**
- 简化元数据获取，通常从类、方法、参数获取装饰器简化**设置**和**获取**
- 主要在守卫、拦截器、管道中来获取元数据
- 自定义装饰器和元数据获取

**MetadataScanner:**
- 关注：**方法元数据**获取，倾向结构化和静态的扫描
- 主要用在静态扫描和自动化注册以及模块化和配置
- **现在只保留了getAllMethodNames**，用来获取类原型上面的所有方法名称，用于发现控制器方法和AOP增强方法

## 缓存监控与埋点

详情代码：[stackblitz](https://stackblitz.com/edit/ttt1231-nestjs-cachemonoitor?file=README.md){target="_blank" rel="noopener noreferrer"}  
详情Github仓库：[Github](https://github.com/TTT1231/nestjs-cachemonitor){target="_blank" rel="noopener noreferrer"}

## 动态模块配置验证与实现

详情代码：[stackblitz](https://stackblitz.com/edit/nestjs-dynamicmodule-rte9xnqd){target="_blank" rel="noopener noreferrer"}  
详情Github仓库：[Github](https://github.com/TTT1231/nestjs-dynamicmodule-rte9xnqd){target="_blank" rel="noopener noreferrer"}
