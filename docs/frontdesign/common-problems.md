---
outline: deep
---

# 常见问题及其解决方案

主要讲解项目中遇到的问题及其解决方案。

## 大文件分片上传

**思路**：获取文件信息，然后进行分片，分片使用form表单上传（前端）  
后端接受分片存储在一个临时目录中（可以按文件id进行临时存储）  
最后存储完毕，对所有分片结果进行合并

```js
//===========================前端================================
const handleUpLoadFiles = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files![0];
  const fileName = file.name;

  const chunkSize = 1024 * 1024; // 1MB
  const chunkSizeTotal = Math.ceil(file.size / chunkSize); //分片总数

  const fileId = generateUUID(); //文件id可以随意生成，唯一就可以以便临时存储

  for (let i = 0; i < chunkSizeTotal; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);

    const chunk = file.slice(start, end);    //获取当前分片

    //创建FormData对象
    const formData = new FormData();
    formData.append("file", chunk);
    formData.append("fileId", fileId);
    formData.append("chunkIndex", i.toString());

    $fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
  }
  //合并
  await $fetch("/api/merage", {
    method: "POST",
    body: { fileId, fileName },
  });
};
//===========================后端================================
//前端传递过来的分片数据进行临时目录存储
export default defineEventHandler(async (event)=> {
    //这里不考虑上传分片过来数据错误
    const formData = await readMultipartFormData(event)
    const file =  formData?.find(item=>item.name === 'file')
    const fileID =  formData?.find(item=>item.name === 'fileId')?.data.toString()
    const chunkIndex = formData?.find(item=>item.name === 'chunkIndex')?.data.toString()
    //分片要存放目录
    const chunkDir = path.join(process.cwd(), 'uploads', fileID)
    //分片目标存放位置
    const chunkPath = path.join(chunkDir, chunkIndex)
    fs.ensureDirSync(chunkDir)
    fs.writeFileSync(chunkPath, file.data)

    return 'success'
})
//合并分片就简单多了，主要逻辑是获取分片的目标位置，然后读取所有分片数据(注意排序)，最后写入
```

## 响应式对象数据性能问题

如果一个对象有很多属性在内部使用响应式深度追踪，定义一个数组，  
这个数组中加入很多个这样的对象，在游览器去渲染的时候会卡顿。  
vue3内部对响应式数据做了数据代理和追踪【主要在这里卡顿】，  
如果不需要修改对象**取消响应式或者冻结对象**。  
vue3在定义响应式对象之前，通过原生API判断是否为freeze

## 下拉组件下拉效果不显示及其动画问题

在封装下拉组件时，如果动画过渡不对就触发不了下拉动画  
例如`h-0 group-hover:max-h-12`就没有效果，改成**group-hover:h-12或max-h-0**（需要1-1对应，**也即[h]-[h],[max-h]-[max-h]**）就有效。  
如果过渡目标到h-auto，由于动画只支持插值数值，这里会不生效，可以通过js计算获取，然后赋值。【js改写style，必须要手动写transition内联样式，同时js实现下拉动画也即改写style时要触发强制重排，否则动画就没有效果】

```vue
<script lang="ts" setup>
import { onMounted, useTemplateRef } from 'vue';

const father = useTemplateRef('father');
const son = useTemplateRef('son');

onMounted(() => {
   father.value!.onmouseenter = () => {
      son.value!.style.height = 'auto';
      const height = son.value!.offsetHeight + 'px';
      son.value!.style.height = '0px';
      //强制渲染,渲染Layout，强制重排
      son.value!.clientHeight;
      son.value!.style.transition = '0.5s';
      son.value!.style.height = height;
   };
   father.value!.onmouseleave = () => {
      son.value!.style.height = '0px';
      son.value!.style.transition = '0.5s';
   };
});
</script>
<template>
   <div class="flex flex-col items-center h-screen">
      <div class="relative inline-block" ref="father">
         鼠标移入显示下拉内容
         <div
            class="absolute top-full left-0 bg-cyan-400 w-64
       overflow-hidden h-0 
       transition-all duration-300 
      "
            ref="son"
         >
            ...下拉内容（占位用）...
         </div>
      </div>
   </div>
</template>
```

还有一种方案不使用js使用css中scale实现，对内容进行y轴缩放实现动画效果。  
效率很高不会触发游览器重排，动画更流畅，性能更好。  
注：**由于scale操作的时transform所以动画效果要用transform效果**。  
这里效果是从上到下（默认中间散开）所以需要origin-top`transform-origin: top;`设置动画起点

```html
<!-- tailwind css 写法 -->
<div class="relative inline-block group">
   鼠标移入显示下拉内容
   <div
      class="absolute top-full left-0 bg-cyan-400 w-64
       overflow-hidden origin-top scale-y-0 group-hover:scale-y-100
       transition-transform duration-300 ease-in-out
      "
   >
      ...下拉内容（占位）...
   </div>
</div>
```

## NUXT中JWT认证问题
header.payload.signature【以base64进行网络传输，遵循RFC标准】
**nuxt插件先于中间件执行**   
### 实现逻辑
- 当请求/api的时候，会进入服务端的中间件，这里可以做jwt令牌验证。`【/server/middle/jwt.server.ts】验证完后，可以对server中上下文设置user,然后向外暴露一个/api,以me.get.ts为例，每次调用都会先走服务端中间件，进行验证token，没有通过可以重定位到登录路由。【出错直接进入nitro错误处理即可，通过可以从上下文获取user来判断是否验证通过】`  
注意应该要游览器携带cookie，存放cookie的原因使得用户无需反复登录，直接可以用token进行认证）(如果考虑refresh_token的情况下也即access_token可以刷新，**依赖jwt的无状态认证**，进行认证和刷新，可以存入cookie进行短期验证。  
<span class=" text-red-400">注：安全考虑可以设置`http:only`,阻止js访问，但是还是能被游览器获取，用户可以在开发者工具查看</span>
- 这里可以做client验证，因为要调用`me.get.ts`客户端来判断有没有登录，<span class=" text-blue-400">同时对出错情况，和token过期等情况进行处理</span>。
- 登录之后，token存入cookie,以后发送token进行验证，过期在返回error,直接弹窗回到登录即可，过期清空cookie

### 注意问题
**1、为避免死循环问题要将登录api和登录界面设置路由白名单处理**  
- /login.post.ts：不设置会导致没有token一直跳转到登录界面的死循环  
- 登录界面，解决用户登录情况，设置jwt令牌。  
**同时需要注意如果并发调用api，考虑验证token复用情况（只有一次请求去刷新token，其他请求等待，刷新token后其他请求直接复用。【考虑请求防抖情况下，可以使用cache进行缓存token，考虑安全性要设置这个token的过期时间】**

**2、并发请求，Token同时刷新逻辑重复导致反复更新验证token问题**
- 界面在onMounted并发请求数据时，重复验证token导致token被覆盖。  
**并发量不是很大时采用单例promise，只刷新一次Token。很大时可以采用promise pool或者请求去重等。特别注意并发请求到来后，验证期间再次来的请求，此时应该是等待**
### 实现步骤
======注意路由白名单放行=======
- 有accessToken没有过期，放行（refresh失不失效没有关系，这里都会放行）
- 没有任何cookie（未登录情况）
- accessToken过期，进入尝试刷新token阶段
- 【这里就需要解决多并发请求的多次更新替换token问题,这里采用promise单例模式】  
- refreshToken没有过期，使用refreshToken刷新accessToken，  
这里刷新token采用单例刷新，下一个请求来时等待promise单例完成，拿结果就返回 。
最后单例清空promise状态，留给下一次并发请求。 
**由于这里并发请求的驼峰性，这里设置cache的过期时间几秒钟就可以了（也不会有那么多并发请求需要验证）**
<details>
<summary class=" bg-blue-400  text-white cursor-pointer select-none
 text-center active:scale-95">
 01.jwt.server.ts（服务端——自动调试模式）
</summary>

```ts
// 服务端 JWT 认证中间件——jwt 令牌 token 验证
// 存储用户上下文对象，避免在同一请求反复验证
// 请求结束时 event.context.user 自动销毁

import { JWTExpired, JWTInvalid } from 'jose/errors';
import { HTTPStatus } from '~~/shared/enums/httpEnums';
import { whiteRoute } from '~~/shared/whiteRoute';
import { decodeJwt } from 'jose';
import { logServer } from '../utils/serverLog';
//多个请求，会有多个token被更新，导致资源浪费，用户体验不好

//当前更新access_token的promise,多个请求只会有一个
let currentAccessTokenUpdatePromise: Promise<string> | null = null;
//目标jwt token缓存
let targetAccessTokenCache: string | null = null;
//目标缓存过期时间
let targetAccessTokenExpires: number = 0;
//缓存过期时间
const CACHE_EXPIRY_TIME = 5; // 5秒
const getCurrentTime = () => Math.floor(Date.now() / 1000); // 获取当前时间戳（秒）

export default defineEventHandler(async (event) => {
   const rawUrl = event.node.req.url || '';
   const path = rawUrl.split('?')[0];
   if (whiteRoute.includes(path)) return;

   const isApiRequest = path.startsWith('/api/');
   const { accessToken, refreshToken } = getTokensFromCookie(event);

   // ===== 调试日志开始 =====
   logServer('=== JWT中间件调试信息 ===');
   logServer('请求路径:', path);
   logServer('当前时间:', new Date().toISOString());
   logServer('当前时间戳(秒):', getCurrentTime());
   logServer('Access Token 存在:', !!accessToken);
   logServer('Refresh Token 存在:', !!refreshToken);

   // 解码token查看过期时间
   if (accessToken) {
      try {
         const accessDecoded = decodeJwt(accessToken);
         logServer('Access Token 过期时间:', new Date(accessDecoded.exp! * 1000).toISOString());
         logServer('Access Token 剩余秒数:', accessDecoded.exp! - getCurrentTime());
      } catch (e) {
         logServer('Access Token 解码失败:', e);
      }
   }

   if (refreshToken) {
      try {
         const refreshDecoded = decodeJwt(refreshToken);
         logServer('Refresh Token 过期时间:', new Date(refreshDecoded.exp! * 1000).toISOString());
         logServer('Refresh Token 剩余秒数:', refreshDecoded.exp! - getCurrentTime());
      } catch (e) {
         logServer('Refresh Token 解码失败:', e);
      }
   }

   // ===== 调试日志结束 =====

   // 没任何 token
   if (!accessToken && !refreshToken) {
      logServer('🚫 没有任何token，准备跳转登录');
      if (isApiRequest) {
         throw createError({
            statusCode: HTTPStatus.UNAUTHORIZED,
            statusMessage: 'UNAUTHORIZED',
            message: '未登录或 token 缺失'
         });
      } else {
         return sendRedirect(event, '/'); // 登录页是 '/'
      }
   }
   // access_token还有效，但是refresh_token没有或者过期无效等其他异常情况
   if (accessToken) {
      try {
         logServer('🔍 尝试验证 Access Token...');
         const payload = await verifyAccessToken(accessToken);
         logServer('✅ Access Token 验证成功，用户:', payload.userAccount);
         event.context.user = payload;
         return;
      } catch (err: any) {
         logServer('❌ Access Token 验证失败:', err.message);
         // 如果 access_token 验证失败，才会尝试使用 refresh_token 刷新
      }
   }

   // 1. 尝试使用 access_token
   if (accessToken) {
      try {
         logServer('🔍 再次尝试验证 Access Token...');
         const payload = await verifyAccessToken(accessToken);
         logServer('✅ Access Token 二次验证成功');
         event.context.user = payload;
         return;
      } catch (err: any) {
         logServer('❌ Access Token 二次验证失败，准备使用 Refresh Token');
         // 失败则尝试refresh,统一处理
      }
   }

   // 2. 尝试使用 refresh_token 刷新，promise单例模式
   //多请求并发时，只会有一个请求去更新access_token
   if (refreshToken) {
      logServer('🔄 开始 Refresh Token 流程...');
      //目标在刷新，等待
      if (currentAccessTokenUpdatePromise) {
         logServer('⏳ 等待其他请求完成刷新...');
         try {
            await currentAccessTokenUpdatePromise;
            // 等待完成后，检查用户是否已经设置
            if (event.context.user) {
               logServer('✅ 从其他请求获得用户信息');
               return;
            }
         } catch (error) {
            logServer('❌ 等待其他请求刷新失败');
         }
      }

      if (targetAccessTokenCache && targetAccessTokenExpires > getCurrentTime()) {
         logServer('📦 使用缓存的 Access Token');
         //缓存未过期，直接使用缓存
         event.context.user = decodeJwt(targetAccessTokenCache);
         return;
      }

      // 开始刷新 access_token
      logServer('🚀 开始刷新 Access Token...');
      currentAccessTokenUpdatePromise = new Promise(async (resolve, reject) => {
         try {
            logServer('🔍 验证 Refresh Token...');
            //有没有过期
            const refreshPayload = await verifyRefreshToken(refreshToken);
            logServer('✅ Refresh Token 验证成功，用户:', refreshPayload.userAccount);

            //重新签发新的access_token
            logServer('🔨 生成新的 Access Token...');
            const newAccessToken = await signAccessToken({
               id: refreshPayload.id,
               userAccount: refreshPayload.userAccount,
               userPhone: refreshPayload.userPhone,
               userAuth: refreshPayload.userAuth
            });

            logServer('🍪 设置新的 Cookie...');
            setTokensFromCookie(event, newAccessToken, refreshToken);
            event.context.user = refreshPayload;

            //更新缓存
            targetAccessTokenCache = newAccessToken;
            targetAccessTokenExpires = getCurrentTime() + CACHE_EXPIRY_TIME;
            logServer('✅ Access Token 刷新成功!');

            resolve(newAccessToken); //返回新的access_token
         } catch (e) {
            logServer('❌ Refresh Token 验证失败:', e);
            cleanAllTokensFromCookie(event);

            if (isApiRequest) {
               //refresh token过期
               if (e instanceof JWTExpired) {
                  logServer('⏰ Refresh Token 已过期');
                  reject(
                     createError({
                        statusCode: HTTPStatus.UNAUTHORIZED,
                        statusMessage: 'UNAUTHORIZED',
                        message: 'token 已过期，请重新登录'
                     })
                  );
               }
               //无效的refresh token
               else if (e instanceof JWTInvalid) {
                  logServer('🚫 Refresh Token 无效');
                  reject(
                     createError({
                        statusCode: HTTPStatus.UNAUTHORIZED,
                        statusMessage: 'UNAUTHORIZED',
                        message: '无效的 token，请重新登录'
                     })
                  );
               }
               //未知情况
               else {
                  logServer('❓ 未知认证错误:', e);
                  reject(
                     createError({
                        statusCode: HTTPStatus.UNAUTHORIZED,
                        statusMessage: 'UNAUTHORIZED',
                        message: '认证失败，未知错误，请稍后再试'
                     })
                  );
               }
            } else {
               logServer('🏠 非API请求，重定向到登录页');
               reject(new Error('需要重定向到登录页'));
            }
         } finally {
            logServer('🔄 清理 Promise 状态');
            currentAccessTokenUpdatePromise = null; //置空，留给下一些并发请求
         }
      });

      // 等待刷新完成
      try {
         await currentAccessTokenUpdatePromise;
         if (event.context.user) {
            logServer('✅ 刷新成功，用户已设置');
            return;
         }
      } catch (error) {
         logServer('❌ 刷新失败:', error);
         if (!isApiRequest) {
            return sendRedirect(event, '/');
         }
         throw error;
      }
   }

   // 3. 没有 refresh tokens 或刷新失败
   logServer('🚫 最终认证失败，清理所有 token');
   cleanAllTokensFromCookie(event);
   if (isApiRequest) {
      logServer('❌ API请求认证失败');
      throw createError({
         statusCode: HTTPStatus.UNAUTHORIZED,
         statusMessage: 'UNAUTHORIZED',
         message: '未授权，认证失败'
      });
   } else {
      logServer('🏠 页面请求认证失败，重定向到登录页');
      return sendRedirect(event, '/');
   }
});

```
</details>

**并发请求时，这里需要做防抖，缓存处理。【缓存时间不能太长2~5秒即可】**
<details>
<summary class=" bg-blue-400  text-white cursor-pointer select-none
 text-center active:scale-95">
01.auth.client.ts（客户端验证服务端有没有成功）
</summary>

```ts
import { whiteRoute } from '~~/shared/whiteRoute';

//01.auth.client.ts
export default defineNuxtRouteMiddleware(async (to, from) => {
   if (whiteRoute.includes(to.path)) {
      return;
   }

   //获取验证后的user,确保走服务端中间件验证token能正常接受cookie
   try {
      const user = await $fetch('/api/user/auth/me', {
         method: 'GET',
         credentials: 'include' //强制游览器带上cookie,解决在登录情况下不带cookie的问题
      });
      if (user) return;
   } catch (error: any) {
      // 401错误会被全局插件自动处理，显示友好的弹框
      // 这里不需要手动处理，但为了确保路由正确，还是添加检查
      if (error?.status === 401 || error?.statusCode === 401) {
         // 认证错误，插件会处理弹框，这里不做跳转
         // 因为插件会自动跳转到登录页
         return;
      }

      // 其他错误直接跳转
      navigateTo('/', { replace: true });
   }
});

```
</details>

fetch-interceptor.ts插件拦截$fetch响应  
**解决token过期401不解决，导致api一直在刷新等待问题，错误没处理，抛出401错误直接弹窗**
<details>
<summary class=" bg-blue-400  text-white cursor-pointer select-none
 text-center active:scale-95">
fetch-interceptor.ts（插件） 

</summary>

```ts
import { Modal } from 'ant-design-vue';

//处理401错误的插件，主要功能就是弹窗
//自动监听
export default defineNuxtPlugin(() => {
   // 防止重复弹框的标志
   let isDialogShowing = false;

   const showLoginExpiredDialog = () => {
      // 防止重复弹框
      if (isDialogShowing) {
         return;
      }
      isDialogShowing = true;

      Modal.confirm({
         title: '登录已过期',
         content: '您的登录状态已过期，请重新登录',
         okText: '重新登录',
         cancelText: '取消',
         maskClosable: false,
         keyboard: false,
         centered: true,
         //确认取消都直接回到登录页
         onOk() {
            isDialogShowing = false;
            window.location.href = '/';
         },
         onCancel() {
            isDialogShowing = false;
            window.location.href = '/';
         }
      });
   };

   //响应拦截器
   const originalFetch = $fetch.create({
      onResponseError({ response }) {
         if (response.status === 401) {
            showLoginExpiredDialog();
         }
      }
   });

   $fetch = originalFetch;

   // 监听全局未处理的 Promise 拒绝
   if (import.meta.client) {
      window.addEventListener('unhandledrejection', (event) => {
         const error = event.reason;

         // 检查是否是 401 错误
         if (
            error?.status === 401 ||
            error?.statusCode === 401 ||
            error?.response?.status === 401 ||
            (error?.data && error.data.statusCode === 401)
         ) {
            // 阻止控制台错误显示
            event.preventDefault();
            showLoginExpiredDialog();
         }
      });

      // 监听全局错误事件
      window.addEventListener('error', (event) => {
         const error = event.error;
         if (error?.status === 401 || error?.statusCode === 401) {
            event.preventDefault();
            showLoginExpiredDialog();
         }
      });
   }

   return {
      provide: {
         /**全局方法，处理token过期情况，弹出对话框 */
         handleAuthError: (error: any) => {
            if (
               error?.status === 401 ||
               error?.statusCode === 401 ||
               error?.response?.status === 401
            ) {
               showLoginExpiredDialog();
               return true; // 表示已处理
            }
            return false; // 未处理
         }
      }
   };
});

```

</details>