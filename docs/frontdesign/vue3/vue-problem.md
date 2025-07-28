# vue 问题及其解决

主要介绍vue中环境变量，以及使用的代理问题。

## vue中环境变量文件

- .env全局默认环境变量，所有环境都会被加载，相同变量会被其他环境变量覆盖（也即如果.env和开发环境和生产环境只要有一个相同就会被覆盖掉，因为其首先加载）。
- .env.development开发环境变量，仅仅在使用pnpm run dev或vite时加载
- .env.production生成环境变量，仅打包代码pnpm run build时加载

## 开发与生产环境中proxy（api）问题

```js
//这里是vite中的代理，主要将javaserver代理到目标
//这里是开发环境，在生产环境中没有效果需要使用nginx进行代替
proxy:{
    '/javaserver':{
        target:'http://127.0.0.1:7002',
        changeOrigin:true,
        rewrite:(path)=>path.replace(/^\/javaserver/,'')
      }
    }
```
```json
//vite打包后，proxy配置不会生效，需要在Nginx中配置/javaserver转发规则，代替vite中proxy使得请求进行转发。
//==========nginx setting ==================
location /javaserver/ {
    proxy_pass http://127.0.0.1:7002/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    rewrite ^/javaserver/(.*)$ /$1 break;
}
```
