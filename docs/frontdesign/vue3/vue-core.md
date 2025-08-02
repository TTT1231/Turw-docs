# vue核心

针对定义对象vue2抛出错误的问题，vue3结合使用**ES6**中的Reflect（对象操作工具箱），  
相比Object.defineProperty()【vue2】成功返回对象，失败抛出错的头疼问题，  
该结合Reflect.get/set直接返回true or false这样就让错误处理更加优雅  
提升数据劫持的灵活性和安全性。同时也完美解决了this指向windows或undefined错误。
```js
const obj = {name:'testname'}
const proxy = new Proxy(obj,{
    //使得receiver始终指向该代理对象proxy,避免指向问题
    get(target,key,receiver){
        return Reflect.get(target,key,receiver)
    }
})
```

## vue响应式核心

以响应式对象为例，vue一个响应式系统包含所有的响应式对象的集合set  
然后每个响应式对象又包含多个响应式属性  
这个响应式属性其实就是一个装有副作用函数的盒子，  
当依赖发生变化然后指向副作用函数就完成了响应式实现。例如:
```js
// ===== 核心数据结构详解 =====
// 第三层：Dep - 依赖集合（最内层）
// 就是一个装副作用函数的盒子
type Dep = Set<Function>
// 例子：假设有3个副作用函数都用到了 obj.name
const nameDepSet = new Set()
nameDepSet.add(effect1)  // 副作用函数1
nameDepSet.add(effect2)  // 副作用函数2  
nameDepSet.add(effect3)  // 副作用函数3
// 现在 nameDepSet 就是 obj.name 属性的依赖集合
// 第二层：KeyToDepMap - 属性映射表（中间层）
// 一个对象有多个属性，每个属性都有自己的依赖集合
type KeyToDepMap = Map<string, Dep>
// 例子：obj 对象有 name 和 age 两个属性
const objDepsMap = new Map()
objDepsMap.set('name', nameDepSet)    // name属性 -> 它的依赖集合
objDepsMap.set('age', ageDepSet)      // age属性 -> 它的依赖集合
// 第一层：targetMap - 对象映射表（最外层）  
// 全局可能有多个响应式对象，每个对象都有自己的属性映射表
const targetMap = new WeakMap<object, KeyToDepMap>()
```

## 游览器重绘和回流对响应式数据影响

当响应式数据发送变化，然后需要实时渲染页面,vue就会发生重绘，使得数据能够实时展示。  
而回流只是css外观风格发生改变，不会受到响应式数据的影响。