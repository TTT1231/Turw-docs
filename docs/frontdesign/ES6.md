# ES6

js下一代标准，使得js可以编写复杂系统.

## Symbol

Symbol()都会生成一个全新、唯一的值，避免属性名冲突，同时不能被常规的属性遍历如(for...in、Object.keys)枚举出来，如果非要实现则需要定义对象的默认迭代器方法(Symbol.iterator)，使得对象可以被for...of、解构赋值等语法遍历。  
Symbol的值是唯一的，可以接受一个字符串用来区分。即使字符串一样但是Symbol的值不一样`Symbol('a')!=Symbol('a')`。

### Symbol.iterator 实现可迭代对象或者数组

```js
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

<span class=" text-red-400">注: </span>
<span class=" font-medium">迭代器对象必须实现next方法，迭代协议要求。</span>

#### Symbol属性或方法

```js
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

```js
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

<label>当代理用完不想用时，或者代理就使用一次，就可以取消代理Proxy.revocable <span class=" text-red-300">revocable:可撤销的，可取消的</span></label>

## Promise并发处理

当有多个网络请求promise或者多个异步promise时，一个一个获取或异步等待速度慢时，就可以将多个请求promise封装成一个数组或队列，然后借助es6中allSettled进行同时处理。最后进行统一处理错误或者成功的结果。

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
