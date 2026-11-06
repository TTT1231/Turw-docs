# Provider 令牌与循环依赖

当模块文件导入 Service，而 Service 又从模块文件导入注入令牌时，就形成了文件级循环依赖。模块初始化顺序可能使令牌在使用时尚未初始化，导致运行时错误或依赖注入失败。

## 问题场景示例

```ts
// forRoot.module.ts
import { ForRootService } from './forRoot.service';
export const FOR_ROOT_MODULE_OPTIONS = 'FOR_ROOT_MODULE_OPTIONS';
// 模块配置中使用 ForRootService 和 FOR_ROOT_MODULE_OPTIONS
```

```ts
// forRoot.service.ts
import { FOR_ROOT_MODULE_OPTIONS } from './forRoot.module';
// Service 通过 @Inject(FOR_ROOT_MODULE_OPTIONS) 注入配置
```

依赖方向为 `module → service → module`。具体表现取决于模块系统和访问时机：CommonJS 可能看到尚未完成的导出，ES module 可能在初始化前访问绑定时报错。

## 解决方案：分离常量和类型

将令牌和配置类型放到不依赖模块或 Service 的文件中，双方都从该文件导入。本示例对应 `src/forRoot-module/forRoot.constants.ts`：

```ts
export interface ForRootModuleOptions {
  someKey: string;
}

export const FOR_ROOT_MODULE_OPTIONS = 'FOR_ROOT_MODULE_OPTIONS';
```

```ts
// forRoot.service.ts
import { FOR_ROOT_MODULE_OPTIONS, type ForRootModuleOptions } from './forRoot.constants';

@Injectable()
export class ForRootService {
  constructor(@Inject(FOR_ROOT_MODULE_OPTIONS) private readonly options: ForRootModuleOptions) {}
}
```

模块文件也从 `forRoot.constants.ts` 导入令牌，再注册 Service 和配置提供者。依赖因此变为 `module → service → constants`，模块也可以直接依赖 constants，不再形成环。

## 排查方法

- 从报错中找到无法解析的依赖或未初始化的导出，沿文件导入关系查找环。
- `tsc --traceResolution` 可以帮助检查导入解析到了哪个文件，但不能单独证明存在循环。
- 可使用 `eslint-plugin-import` 的 `import/no-cycle` 规则检查导入环；若设置 `maxDepth`，超过该深度的环不会被发现。
- 聚合导出文件（`index.ts`）也可能引入间接循环；模块内部引用优先检查实际导入路径。

文件之间的循环依赖与 Nest 模块或提供者之间的循环依赖有关，但不是完全相同的问题。拆分令牌能解决上述文件导入环；其他依赖关系需要分别排查。

## 延伸阅读

- [NestJS 循环依赖](https://docs.nestjs.com/fundamentals/circular-dependency)
- [ES Modules: A cartoon deep-dive](https://hacks.mozilla.org/2018/03/es-modules-a-cartoon-deep-dive/)
