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