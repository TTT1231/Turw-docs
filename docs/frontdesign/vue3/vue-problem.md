# vue 问题及其解决

主要介绍vue中环境变量，以及使用的代理问题。

## vue中环境变量文件

- .env全局默认环境变量，所有环境都会被加载，相同变量会被其他环境变量覆盖（也即如果.env和开发环境和生产环境只要有一个相同就会被覆盖掉，因为其首先加载）。
- .env.development开发环境变量，仅仅在使用pnpm run dev或vite时加载
- .env.production生成环境变量，仅打包代码pnpm run build时加载

## 开发与生产环境中proxy（api）问题

::: code-group

```ts [vite.config.ts]
//这里是vite中的代理，主要将javaserver代理到目标
//这里是开发环境，在生产环境中没有效果需要使用nginx进行代替
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vite.dev/config/
export default defineConfig({
   plugins: [vue()],
   server: {
      proxy: {
         '/javaserver': {
            target: 'http://127.0.0.1:7002',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/javaserver/, '')
         }
      }
   }
});
```

```sh [nginx.conf]
# vite打包后，proxy配置不会生效，需要在Nginx中配置/javaserver转发规则，
# 代替vite中proxy使得请求进行转发。
server {
  # API 代理 - 不需要 CORS！
  location /javaserver/ {
    proxy_pass http://127.0.0.1:7002/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    rewrite ^/javaserver/(.*)$ /$1 break;
   }
}
```

:::

::: danger 危险
代理的核心作用就是避免`CORS`问题，而不是解决`CORS`问题

因此当开启代理之后，就不需要再`Nginx`中启用`CORS`，因为这里`vite`作为了中转站点，因此这里是一个同源请求转发。

因此实践中如果是网关的话，只需统一经过网关，然后网关转发即可，此时也是不需要`CORS`，和配置`vite`请求转发，然后nginx配置代理类似。
:::
