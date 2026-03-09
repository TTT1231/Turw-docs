# Uniapp

## 微信小程序环境变量问题

在 uni-app 微信小程序中使用环境变量时，直接使用 `import.meta.env.VITE_XXX` 会返回 `undefined`。
uni-app 小程序端使用自己的编译流程，Vite 默认不会自动将 `.env` 文件中的变量注入到小程序代码中。

因此需要手动加载环境变量并通过`define`注入，同时还要替换整个env对象，然后就可以用`import.meta.env`访问了。

```ts
import { defineConfig, loadEnv } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';

export default defineConfig(({ mode }) => {
   const env = loadEnv(mode, process.cwd());

   return {
      plugins: [uni()],
      define: {
         // 关键：替换整个 import.meta.env 对象
         'import.meta.env': JSON.stringify({
            VITE_SUPABASE_URL: env.VITE_SUPABASE_URL,
            VITE_SUPABASE_PUBLISHABLE_KEY: env.VITE_SUPABASE_PUBLISHABLE_KEY
            // 添加更多环境变量...
         })
      }
   };
});
```
