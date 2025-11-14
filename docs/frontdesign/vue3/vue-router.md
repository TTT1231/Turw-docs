# Vue-Router

<Tip title="提示">
Hash:带#不美观，部署简单，刷新能正确加载

history模式，干净标准的url，直接访问子路由会404，需要配置try_files(刷新会报404)在niginx情况下
</Tip>

## 路由元信息提示

vue-router做权限控制可以对路由中meta元信息进行类型拓展，这里可以自定义角色和权限。例如:

```js
declare module 'vue-router' {
  interface RouteMeta {
    // 基础属性
    title?: string
    requiresAuth: boolean
    // 权限相关,按钮权限等等
    permissions?: string[]
    // 布局控制
    layout?: 'default' | 'admin'
    // SEO 相关
    metaTags?: {
      name: string
      content: string
    }[]
  }
}

```
