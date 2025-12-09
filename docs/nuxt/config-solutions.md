---
outline: deep
---

# 配置问题及其常见解决方案

主要将nuxt4的项目配置问题和解决方案。

## TS类型问题

### tailwindcss配置问题

> [!tip]
> **不要直接跟随 Tailwind CSS V4 官方文档安装！**
>
> Nuxt 已内置集成 `@nuxt/tailwindcss`。若按 V4 文档操作，`@tailwindcss/vite` 会在 nuxt.config.ts 中产生 TypeScript 类型错误。

**✨ 推荐方案**

使用官方模块 `@nuxt/tailwindcss` + 本地 `tailwind.config.js` 覆盖，实现：

- ✅ 自定义配置
- ✅ 完整类型提示
- ✅ 最简最易维护

**🚀 安装步骤**

**步骤 1：安装依赖**

```sh
pnpm add -D @nuxtjs/tailwindcss
```

**步骤 2：配置 nuxt.config.ts**

```ts
export default defineNuxtConfig({
   css: ['~/assets/css/main.css'],
   modules: ['@nuxtjs/tailwindcss']
});
```

**步骤 3：创建 CSS 入口文件**

```css
/* ~/assets/css/main.css */
@import 'tailwindcss';
```

**步骤 4：创建 tailwind.config.js 自定义配置**

```js
/** @type {import('tailwindcss').Config} */
export default {
   content: [
      './components/**/*.{js,vue,ts}',
      './layouts/**/*.vue',
      './pages/**/*.vue',
      './plugins/**/*.{js,ts}',
      './app.vue',
      './error.vue'
   ],
   theme: {
      extend: {}
   },
   plugins: []
};
```

### antd 类型问题

> [!NOTE]
> **为什么需要手动配置类型提示？**
>
> Nuxt 采用 TypeScript 项目引用机制：
>
> - `tsconfig.json` 只引用 `.nuxt/tsconfig*.json` 子配置
> - 实际类型检查发生在这些子文件中
> - `.d.ts` 文件在 `app/` 目录下会被自动识别

::: tip 类型声明文件位置建议
**开发流程：** 开发时引入类型文件 → 完成后可删除 → 让 Nuxt 自动处理

即使不配置类型提示，代码依然可运行，但开发环境会：

- ❌ TypeScript 类型推断为 `any`
- ❌ 丧失组件属性提示

**社区实践**：所有 `.d.ts` 类型文件统一放在 `types/` 目录  
**开发方式**：在 `app/` 目录下的 `.d.ts` 文件中直接引入

:::

**✨ 解决方案：全局类型声明**

创建 `.d.ts` 类型文件让 TypeScript 识别即可：

::: details antd类型声明文件

```ts
/* eslint-disable @typescript-eslint/consistent-type-imports */
declare module 'vue' {
   export interface GlobalComponents {
      AAffix: (typeof import('ant-design-vue'))['Affix'];

      AAlert: (typeof import('ant-design-vue'))['Alert'];

      AAnchor: (typeof import('ant-design-vue'))['Anchor'];

      AAnchorLink: (typeof import('ant-design-vue'))['AnchorLink'];

      AAutoComplete: (typeof import('ant-design-vue'))['AutoComplete'];

      AAutoCompleteOptGroup: (typeof import('ant-design-vue'))['AutoCompleteOptGroup'];

      AAutoCompleteOption: (typeof import('ant-design-vue'))['AutoCompleteOption'];

      AAvatar: (typeof import('ant-design-vue'))['Avatar'];

      AAvatarGroup: (typeof import('ant-design-vue'))['AvatarGroup'];

      ABadge: (typeof import('ant-design-vue'))['Badge'];

      ABadgeRibbon: (typeof import('ant-design-vue'))['BadgeRibbon'];

      ABreadcrumb: (typeof import('ant-design-vue'))['Breadcrumb'];

      ABreadcrumbItem: (typeof import('ant-design-vue'))['BreadcrumbItem'];

      ABreadcrumbSeparator: (typeof import('ant-design-vue'))['BreadcrumbSeparator'];

      AButton: (typeof import('ant-design-vue'))['Button'];

      AButtonGroup: (typeof import('ant-design-vue'))['ButtonGroup'];

      ACalendar: (typeof import('ant-design-vue'))['Calendar'];

      ACard: (typeof import('ant-design-vue'))['Card'];

      ACardGrid: (typeof import('ant-design-vue'))['CardGrid'];

      ACardMeta: (typeof import('ant-design-vue'))['CardMeta'];

      ACarousel: (typeof import('ant-design-vue'))['Carousel'];

      ACascader: (typeof import('ant-design-vue'))['Cascader'];

      ACheckableTag: (typeof import('ant-design-vue'))['CheckableTag'];

      ACheckbox: (typeof import('ant-design-vue'))['Checkbox'];

      ACheckboxGroup: (typeof import('ant-design-vue'))['CheckboxGroup'];

      ACol: (typeof import('ant-design-vue'))['Col'];

      ACollapse: (typeof import('ant-design-vue'))['Collapse'];

      ACollapsePanel: (typeof import('ant-design-vue'))['CollapsePanel'];

      AComment: (typeof import('ant-design-vue'))['Comment'];

      AConfigProvider: (typeof import('ant-design-vue'))['ConfigProvider'];

      AStyleProvider: (typeof import('ant-design-vue'))['StyleProvider'];

      ADatePicker: (typeof import('ant-design-vue'))['DatePicker'];

      ADescriptions: (typeof import('ant-design-vue'))['Descriptions'];

      ADescriptionsItem: (typeof import('ant-design-vue'))['DescriptionsItem'];

      ADirectoryTree: (typeof import('ant-design-vue'))['DirectoryTree'];

      ADivider: (typeof import('ant-design-vue'))['Divider'];

      ADrawer: (typeof import('ant-design-vue'))['Drawer'];

      ADropdown: (typeof import('ant-design-vue'))['Dropdown'];

      ADropdownButton: (typeof import('ant-design-vue'))['DropdownButton'];

      AEmpty: (typeof import('ant-design-vue'))['Empty'];

      AForm: (typeof import('ant-design-vue'))['Form'];

      AFormItem: (typeof import('ant-design-vue'))['FormItem'];

      AFormItemRest: (typeof import('ant-design-vue'))['FormItemRest'];

      AImage: (typeof import('ant-design-vue'))['Image'];

      AImagePreviewGroup: (typeof import('ant-design-vue'))['ImagePreviewGroup'];

      AInput: (typeof import('ant-design-vue'))['Input'];

      AInputGroup: (typeof import('ant-design-vue'))['InputGroup'];

      AInputNumber: (typeof import('ant-design-vue'))['InputNumber'];

      AInputPassword: (typeof import('ant-design-vue'))['InputPassword'];

      AInputSearch: (typeof import('ant-design-vue'))['InputSearch'];

      ALayout: (typeof import('ant-design-vue'))['Layout'];

      ALayoutContent: (typeof import('ant-design-vue'))['LayoutContent'];

      ALayoutFooter: (typeof import('ant-design-vue'))['LayoutFooter'];

      ALayoutHeader: (typeof import('ant-design-vue'))['LayoutHeader'];

      ALayoutSider: (typeof import('ant-design-vue'))['LayoutSider'];

      AList: (typeof import('ant-design-vue'))['List'];

      AListItem: (typeof import('ant-design-vue'))['ListItem'];

      AListItemMeta: (typeof import('ant-design-vue'))['ListItemMeta'];

      ALocaleProvider: (typeof import('ant-design-vue'))['LocaleProvider'];

      AMentions: (typeof import('ant-design-vue'))['Mentions'];

      AMentionsOption: (typeof import('ant-design-vue'))['MentionsOption'];

      AMenu: (typeof import('ant-design-vue'))['Menu'];

      AMenuDivider: (typeof import('ant-design-vue'))['MenuDivider'];

      AMenuItem: (typeof import('ant-design-vue'))['MenuItem'];

      AMenuItemGroup: (typeof import('ant-design-vue'))['MenuItemGroup'];

      AModal: (typeof import('ant-design-vue'))['Modal'];

      AMonthPicker: (typeof import('ant-design-vue'))['MonthPicker'];

      APageHeader: (typeof import('ant-design-vue'))['PageHeader'];

      APagination: (typeof import('ant-design-vue'))['Pagination'];

      APopconfirm: (typeof import('ant-design-vue'))['Popconfirm'];

      APopover: (typeof import('ant-design-vue'))['Popover'];

      AProgress: (typeof import('ant-design-vue'))['Progress'];

      AQuarterPicker: (typeof import('ant-design-vue'))['QuarterPicker'];

      ARadio: (typeof import('ant-design-vue'))['Radio'];

      ARadioButton: (typeof import('ant-design-vue'))['RadioButton'];

      ARadioGroup: (typeof import('ant-design-vue'))['RadioGroup'];

      ARangePicker: (typeof import('ant-design-vue'))['RangePicker'];

      ARate: (typeof import('ant-design-vue'))['Rate'];

      AResult: (typeof import('ant-design-vue'))['Result'];

      ARow: (typeof import('ant-design-vue'))['Row'];

      ASelect: (typeof import('ant-design-vue'))['Select'];

      ASegmented: (typeof import('ant-design-vue'))['Segmented'];

      ASelectOptGroup: (typeof import('ant-design-vue'))['SelectOptGroup'];

      ASelectOption: (typeof import('ant-design-vue'))['SelectOption'];

      ASkeleton: (typeof import('ant-design-vue'))['Skeleton'];

      ASkeletonAvatar: (typeof import('ant-design-vue'))['SkeletonAvatar'];

      ASkeletonButton: (typeof import('ant-design-vue'))['SkeletonButton'];

      ASkeletonImage: (typeof import('ant-design-vue'))['SkeletonImage'];

      ASkeletonInput: (typeof import('ant-design-vue'))['SkeletonInput'];

      ASlider: (typeof import('ant-design-vue'))['Slider'];

      ASpace: (typeof import('ant-design-vue'))['Space'];

      ASpaceCompact: (typeof import('ant-design-vue'))['Compact'];

      ASpin: (typeof import('ant-design-vue'))['Spin'];

      AStatistic: (typeof import('ant-design-vue'))['Statistic'];

      AStatisticCountdown: (typeof import('ant-design-vue'))['StatisticCountdown'];

      AStep: (typeof import('ant-design-vue'))['Step'];

      ASteps: (typeof import('ant-design-vue'))['Steps'];

      ASubMenu: (typeof import('ant-design-vue'))['SubMenu'];

      ASwitch: (typeof import('ant-design-vue'))['Switch'];

      ATabPane: (typeof import('ant-design-vue'))['TabPane'];

      ATable: (typeof import('ant-design-vue'))['Table'];

      ATableColumn: (typeof import('ant-design-vue'))['TableColumn'];

      ATableColumnGroup: (typeof import('ant-design-vue'))['TableColumnGroup'];

      ATableSummary: (typeof import('ant-design-vue'))['TableSummary'];

      ATableSummaryCell: (typeof import('ant-design-vue'))['TableSummaryCell'];

      ATableSummaryRow: (typeof import('ant-design-vue'))['TableSummaryRow'];

      ATabs: (typeof import('ant-design-vue'))['Tabs'];

      ATag: (typeof import('ant-design-vue'))['Tag'];

      ATextarea: (typeof import('ant-design-vue'))['Textarea'];

      ATimePicker: (typeof import('ant-design-vue'))['TimePicker'];

      ATimeRangePicker: (typeof import('ant-design-vue'))['TimeRangePicker'];

      ATimeline: (typeof import('ant-design-vue'))['Timeline'];

      ATimelineItem: (typeof import('ant-design-vue'))['TimelineItem'];

      ATooltip: (typeof import('ant-design-vue'))['Tooltip'];

      ATransfer: (typeof import('ant-design-vue'))['Transfer'];

      ATree: (typeof import('ant-design-vue'))['Tree'];

      ATreeNode: (typeof import('ant-design-vue'))['TreeNode'];

      ATreeSelect: (typeof import('ant-design-vue'))['TreeSelect'];

      ATreeSelectNode: (typeof import('ant-design-vue'))['TreeSelectNode'];

      ATypography: (typeof import('ant-design-vue'))['Typography'];

      ATypographyLink: (typeof import('ant-design-vue'))['TypographyLink'];

      ATypographyParagraph: (typeof import('ant-design-vue'))['TypographyParagraph'];

      ATypographyText: (typeof import('ant-design-vue'))['TypographyText'];

      ATypographyTitle: (typeof import('ant-design-vue'))['TypographyTitle'];

      AUpload: (typeof import('ant-design-vue'))['Upload'];

      AUploadDragger: (typeof import('ant-design-vue'))['UploadDragger'];

      AWeekPicker: (typeof import('ant-design-vue'))['WeekPicker'];

      AQrCode: (typeof import('ant-design-vue'))['QRCode'];

      ATour: (typeof import('ant-design-vue'))['Tour'];

      AFloatButton: (typeof import('ant-design-vue'))['FloatButton'];

      AFloatButtonGroup: (typeof import('ant-design-vue'))['FloatButtonGroup'];

      ABackTop: (typeof import('ant-design-vue'))['BackTop'];

      AWatermark: (typeof import('ant-design-vue'))['Watermark'];

      AFlex: (typeof import('ant-design-vue'))['Flex'];
   }
}
export {};
```

:::

### SSR antd 样式闪烁问题

> [!IMPORTANT] 问题现象
> 页面加载时出现 FOUC (无样式内容闪烁)，核心（**HTML 先于 CSS 加载并渲染**）：
>
> - 初始化时无 CSS 样式 → 闪烁
> - CSS 加载完成后恢复正常

::: danger 常见错误做法

**问题**：CSS 异步加载，打包文件也会增大

```js
export default defineNuxtConfig({
   // ❌ 全量加载 antd CSS，页面会闪烁
   css: ['ant-design-vue/dist/antd.css']
});
```

:::

**推荐方案：按需注入 CSS**

使用官方模块 `@ant-design-vue/nuxt` 的 `extraStyle` 功能在组件加载前完成注入。

**安装**

```sh
pnpm add -D @ant-design-vue/nuxt
```

**配置 nuxt.config.ts**

```ts
export default defineNuxtConfig({
   modules: ['@ant-design-vue/nuxt'],
   antd: {
      extraStyle: true // 按需提取和注入 CSS（默认 false） //[!code ++]
   }
});
```

**在组件中使用**

```vue
<template>
   <a-extract-style>
      <!-- Your page or component -->
   </a-extract-style>
</template>
```

---

### eslint 修复代码 nuxt.config.ts 报错问题

::: tip 问题现象
ESLint 报错 `defineNuxtConfig` 未定义，因为找不到 `TypeScript` 的顶层依赖项（隐藏在 Nuxt 后面）

**解决方案:**

直接安装 TypeScript：

```sh
pnpm install -D typescript
```

:::

## NUXT 中的 JWT 认证（概览）

快速说明：后端中间件负责验证 Access Token，失败时使用 Refresh Token 刷新；为避免并发刷新冲突，应使用单例刷新（promise 单例或短期缓存）。

要点：

- 中间件验证：服务端验证 token 并将 user 放入上下文
- 并发刷新：使用单例 promise 或短期缓存，保证只有一次刷新请求
- 路由白名单：对登录接口/页面放行，避免重定向死循环

### 实现流程

| 环节             | 职责                                  | 关键点                                              |
| ---------------- | ------------------------------------- | --------------------------------------------------- |
| **服务端中间件** | 验证 JWT、刷新 token                  | 进入 `/api/*` 时触发，验证失败用 Refresh Token 刷新 |
| **客户端中间件** | 调用 `/api/user/auth/me` 验证登录状态 | 处理 401 错误、token 过期情况                       |
| **插件拦截**     | 全局拦截 401 响应                     | 弹窗提示并跳转登录页                                |

> [!NOTE]
> **Cookie 存储**：Token 存入 Cookie（`httpOnly` 保护），浏览器自动携带，避免重复登录。注意：`httpOnly` 可防 JS 访问，但开发者工具仍可查看。

### 核心要点

**🔄 并发刷新问题**

| 问题                   | 解决方案                                     |
| ---------------------- | -------------------------------------------- |
| 多个请求同时刷新 token | 使用单例 Promise，只刷新一次，其他请求等待   |
| 高并发场景             | Promise Pool 或请求去重 + 短期缓存（2-5 秒） |

**⚠️ 路由白名单**

| 必须放行的路由          | 原因                     |
| ----------------------- | ------------------------ |
| `/login` (登录页面)     | 避免未登录时无限重定向   |
| `/api/login` (登录接口) | 允许用户登录并获取 token |

### 验证流程

<JwtValProcess/>

**状态判断逻辑**：

1. ✅ AccessToken 未过期 → 直接放行
2. ⏰ AccessToken 过期 + RefreshToken 有效 → 刷新后放行
3. ❌ 无 Token 或 RefreshToken 过期 → 401 错误处理

::: details 01.jwt.server.ts（服务端——自动调试模式）

```ts
// 服务端 JWT 认证中间件——jwt 令牌 token 验证
// 存储用户上下文对象，避免在同一请求反复验证
// 请求结束时 event.context.user 自动销毁
//[!code warning]
//并发请求时，这里需要做防抖，缓存处理。【缓存时间不能太长2~5秒即可】
import { JWTExpired, JWTInvalid } from 'jose/errors';
import { HTTPStatus } from '~~/shared/enums/httpEnums';
import { whiteRoute } from '~~/shared/whiteRoute';
import { decodeJwt } from 'jose';
import { logServer } from '../utils/serverLog';

// 当前更新 access_token 的 promise，保证并发时只会有一个请求刷新
let currentAccessTokenUpdatePromise: Promise<string> | null = null;
// 缓存的 access_token
let targetAccessTokenCache: string | null = null;
// 缓存过期时间戳（秒）
let targetAccessTokenExpires: number = 0;
// 缓存有效期（秒）
const CACHE_EXPIRY_TIME = 5;
const getCurrentTime = () => Math.floor(Date.now() / 1000);

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

   // 没有任何 token
   if (!accessToken && !refreshToken) {
      logServer('🚫 没有任何token，准备跳转登录');
      if (isApiRequest) {
         throw createError({
            statusCode: HTTPStatus.UNAUTHORIZED,
            statusMessage: 'UNAUTHORIZED',
            message: '未登录或 token 缺失'
         });
      } else {
         return sendRedirect(event, '/');
      }
   }

   // 1. 尝试验证 access_token
   if (accessToken) {
      try {
         logServer('🔍 验证 Access Token...');
         const payload = await verifyAccessToken(accessToken);
         logServer('✅ Access Token 验证成功，用户:', payload.userAccount);
         event.context.user = payload;
         return;
      } catch (err: any) {
         logServer('❌ Access Token 验证失败，尝试使用 Refresh Token:', err.message);
      }
   }

   // 2. 使用 refresh_token 刷新
   if (refreshToken) {
      logServer('🔄 开始 Refresh Token 流程...');

      // 并发等待
      if (currentAccessTokenUpdatePromise) {
         logServer('⏳ 等待其他请求完成刷新...');
         try {
            await currentAccessTokenUpdatePromise;
            if (event.context.user) {
               logServer('✅ 从其他请求获得用户信息');
               return;
            }
         } catch (error) {
            logServer('❌ 等待其他请求刷新失败');
         }
      }

      // 缓存有效，直接用
      if (targetAccessTokenCache && targetAccessTokenExpires > getCurrentTime()) {
         logServer('📦 使用缓存的 Access Token');
         event.context.user = decodeJwt(targetAccessTokenCache);
         return;
      }

      // 开始刷新
      logServer('🚀 开始刷新 Access Token...');
      currentAccessTokenUpdatePromise = new Promise(async (resolve, reject) => {
         try {
            logServer('🔍 验证 Refresh Token...');
            const refreshPayload = await verifyRefreshToken(refreshToken);
            logServer('✅ Refresh Token 验证成功，用户:', refreshPayload.userAccount);

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

            // 更新缓存
            targetAccessTokenCache = newAccessToken;
            targetAccessTokenExpires = getCurrentTime() + CACHE_EXPIRY_TIME;
            logServer('✅ Access Token 刷新成功!');

            resolve(newAccessToken);
         } catch (e) {
            logServer('❌ Refresh Token 验证失败:', e);
            cleanAllTokensFromCookie(event);

            if (isApiRequest) {
               if (e instanceof JWTExpired) {
                  logServer('⏰ Refresh Token 已过期');
                  reject(
                     createError({
                        statusCode: HTTPStatus.UNAUTHORIZED,
                        statusMessage: 'UNAUTHORIZED',
                        message: 'token 已过期，请重新登录'
                     })
                  );
               } else if (e instanceof JWTInvalid) {
                  logServer('🚫 Refresh Token 无效');
                  reject(
                     createError({
                        statusCode: HTTPStatus.UNAUTHORIZED,
                        statusMessage: 'UNAUTHORIZED',
                        message: '无效的 token，请重新登录'
                     })
                  );
               } else {
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
            currentAccessTokenUpdatePromise = null;
         }
      });

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

   // 3. 最终失败
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

:::

::: details 01.auth.client.ts（客户端验证服务端有没有成功）

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

:::

fetch-interceptor.ts插件拦截$fetch响应  
**解决token过期401不解决，导致api一直在刷新等待问题，错误没处理，抛出401错误直接弹窗**

::: details fetch-interceptor.ts（插件）

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

:::
