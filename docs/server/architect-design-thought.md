---
outline: deep
---

# 服务端架构设计思想

## 服务、功能模块解耦

**服务解耦**将单体应用拆分成一组**微小、可拓展、自治**的服务，`该服务`围绕业务进行划分服务边界，使的该服务专注于某一业务，使其专注本身的业务。例如：

```
📁 services/
     📂 user/                      #用户服务（登录、注册、更新管理）
         📂 controller/            # Controller 层
         📂 service/               # 业务逻辑层
         📂 modal/                 # 数据库表模型层（如果是使用了orm的话，那么这里的操作可以直接放入到service中，service直接用对应操作数据库的client去操作数据库即可）
         📂 dto/                   # 数据传输对象（DTO）
     📂 infrastructure/            #基础设施服务
         📂 log/                   #日志服务（包含日志处理和收集，记录什么时间发送了什么）
           📂 monitor/               #监控服务（整个系统有关CPU使用率、容错率、故障率、恢复率等指标）
           📂 config/                #配置服务（动态配置，统一管理系统中有关所有的配置）
           📂 service-discovery/     #服务发现
        ...

     📂 core/                      #核心业务
            📂 auth/               #认证授权（包含jwt，OAuth2等）
            📂 common/             #公共逻辑、共享组件、DTO、工具类等
            📂 a-core              #业务模块 A
            ....

     📂 notify/                    #通知服务

     📂 gateway/                   #API流量入口服务（所有流量的入口）

   📂 test/                      #系统测试（可进一步划分成单元测试、系统集成测试等）

```

**功能模块解耦**对功能模块进行划分类似

```
  📂 user/                      #用户服务（登录、注册、更新管理）
          📂 controller/            # Controller 层
          📂 service/               # 业务逻辑层
          📂 modal/                 # 数据库表模型层（如果是使用了orm的话，那么这里的操作可以直接放入到service中，service直接用对应操作数据库的client去操作数据库即可）
          📂 dto/                   # 数据传输对象（DTO）
          ...
```

## IOC、DI

IOC控制反转将程序控制权反转到外部容器中，交由外部容器负责。

```java
public class A {}
public class TestService {
   private A a;
   //di
   public TestService(A a){
      this.a = a;
   }
   //TODO:some method ...
}
```

DI指外部容器在运行时动态将依赖关系注入进去，包含setter注入、字段注入、函数注入函数注入一般就是通过构造函数注入。

```java
//字段注入,这样做封装性不好，同时依赖关系不显式可见
@Autowired
private A a;
```

## AOP设计思想

在切入方法之前动态将功能**嵌入**到指定位置，而不需要修改原有的业务类代码，实现**开-闭原则**，也即不修改业务，但是对拓展进行开发。**日后想修改或者拓展时，只需对切面进行操作即可**。

**实现步骤：**也即在方法执行之前或者之后，执行**副作用函数**（是切入函数，执行时不会破坏原有结构，等于是在业务函数执行前后执行这个副作用函数），这个函数可以是记录日志函数等。

::: tip 提示
只要实现类似上诉AOP设计思想都可以称为APO设计，例如对象代理、拦截器（包括全局拦截、局部拦截）、装饰器，不过它们的思想都差不多，都是为了**在方法执行前或者后，执行这个副作用函数**。
:::

## nestjs架构思想

### 职责、模块分离思想

其应用注解**修饰器**只负责向**Function**注入元数据信息，而后IOC（container）容器负责根据这些元数据信息存储`providers` Function，**这里的providers包含providers和controllers**，同时懒注入`providers`当容器发现需要使用`providers`容器会自动注入实例，并存储该实例，进行实例的全生命周期管理。

而它的工厂函数思想**将类对象的创建封装起来**使得使用者不关心其内部实现，只关心其向外部暴露的方法进行调用。

**简单实现**

<details>
<summary class="bg-blue-400 text-white cursor-pointer select-none text-center active:scale-95">
   装饰器
</summary>

```ts
import 'reflect-metadata';
//controller 装饰器
export const Controller = (path?: string): ClassDecorator => {
   return (target: Function) => {
      Reflect.defineMetadata('controller:path', path, target);
      //用于后面的自动扫描
      Reflect.defineMetadata('controller', true, target);
   };
};

//Injectable 装饰器
export const Injectable = (): ClassDecorator => {
   return (target: Function) => {
      Reflect.defineMetadata('injectable', true, target);
   };
};

//GET装饰器
export const Get = (path?: string): MethodDecorator => {
   return (target: Object, propertyKey: string | Symbol, descriptor: PropertyDescriptor) => {
      Reflect.defineMetadata('http:method', 'GET', descriptor.value!);
      Reflect.defineMetadata('http:method:path', path, descriptor.value!);
   };
};

interface ModuleMetadata {
   providers?: Function[];
   imports?: Function[];
   exports?: Function[];
   controllers?: Function[];
}
//module 装饰器
export const Module = (metadata: ModuleMetadata): ClassDecorator => {
   return (target) => {
      Reflect.defineMetadata('module:true', true, target);

      //关联控制器和模块
      //一个模块可以包含多个控制器，用于模块化管理控制器
      defineModule(target, metadata.controllers || []);
      Reflect.defineMetadata('controllers', metadata.controllers, target);

      //关联提供者（providers）和模块
      defineProvidersModule(target, metadata.providers || []);
      Reflect.defineMetadata('providers', metadata.providers, target);

      //在类上保存exports
      Reflect.defineMetadata('exports', metadata.exports, target);
      //在类上保存imports
      Reflect.defineMetadata('imports', metadata.imports, target);
   };
};

//给每个控制器添加元数据，标识它们属于哪个模块
export function defineModule(target: Function, metadataControllers: Function[]) {
   metadataControllers.forEach((controller) => {
      Reflect.defineMetadata('MODULE_METADATA', target, controller);
   });
}
//定义 Provider 类型，可以是类或 useClass 对象
type Provider = Function | { useClass: Function };

//给每个提供者添加元数据，标识服务属于哪个模块
export function defineProvidersModule(target: Function, providers: Provider[] = []) {
   defineModule(
      target,
      (providers ?? [])
         .map((provider) => (typeof provider === 'function' ? provider : provider.useClass))
         .filter(Boolean)
   );
}
```

</details>

<details>
<summary class="bg-blue-400 text-white cursor-pointer select-none text-center active:scale-95">
   IOC容器
</summary>

```ts
import 'reflect-metadata';

/**
 * 依赖注入容器 - 模拟 NestJS 的 IoC 容器
 */
export class Container {
   // 存储所有注册的 providers (包括 services 和 controllers)
   private providers = new Map<Function, any>();
   // 存储已经创建的实例，确保单例
   private instances = new Map<Function, any>();

   /**
    * 注册模块
    */
   async registerModule(moduleClass: Function): Promise<void> {
      console.log(`📋 Registering module: ${moduleClass.name}`);

      // 获取模块的 providers，controllers 和 imports
      const providers = Reflect.getMetadata('providers', moduleClass) || [];
      const controllers = Reflect.getMetadata('controllers', moduleClass) || [];
      const imports = Reflect.getMetadata('imports', moduleClass) || [];

      // 注册导入的imports模块
      for (const importedModule of imports) {
         await this.registerModule(importedModule);
      }

      // 注册 providers
      for (const provider of providers) {
         await this.registerProvider(provider);
      }

      // 注册 controllers (controllers 也是 providers)
      //创建controller示例
      //负责给controller注入service
      //管理controller的生命周期
      for (const controller of controllers) {
         await this.registerProvider(controller);
      }

      console.log(`✅ Module ${moduleClass.name} registered successfully`);
   }

   /**
    * 注册单个 provider
    */
   async registerProvider(provider: any): Promise<void> {
      let providerClass: Function;

      if (typeof provider === 'function') {
         providerClass = provider;
      } else if (provider.useClass) {
         providerClass = provider.useClass;
      } else {
         throw new Error(`Invalid provider: ${provider}`);
      }

      // 检查是否是有效的 injectable 或 controller
      const isInjectable = Reflect.getMetadata('injectable', providerClass);
      const isController = Reflect.getMetadata('controller', providerClass);

      if (!isInjectable && !isController) {
         throw new Error(
            `${providerClass.name} must be marked with @Injectable() or @Controller()`
         );
      }

      if (isController) {
         console.log(`🎯 Registering Controller: ${providerClass.name}`);
      } else {
         console.log(`📦 Registering Service: ${providerClass.name}`);
      }

      this.providers.set(providerClass, provider);
   }

   /**
    * 获取 provider 实例（DI实现）,如果没有实例则创建
    */
   async get<T>(providerClass: Function): Promise<T> {
      // 如果已经有实例，直接返回（单例模式）
      if (this.instances.has(providerClass)) {
         return this.instances.get(providerClass);
      }

      // 检查是否已注册
      if (!this.providers.has(providerClass)) {
         throw new Error(`Provider ${providerClass.name} is not registered`);
      }

      // 创建实例
      const instance = await this.createInstance(providerClass);
      this.instances.set(providerClass, instance);

      return instance;
   }

   /**
    * 创建实例并处理依赖注入
    */
   private async createInstance(providerClass: Function): Promise<any> {
      // 获取构造函数参数类型
      const paramTypes = Reflect.getMetadata('design:paramtypes', providerClass) || [];

      //print paramTypes for debug
      console.log(`🔍 Resolving dependencies for: ${paramTypes}`);
      // 解析依赖，也就是provider的构造函数参数
      const dependencies = [];
      for (const paramType of paramTypes) {
         if (paramType && this.providers.has(paramType)) {
            const dependency = await this.get(paramType);
            dependencies.push(dependency);
         } else {
            // 如果依赖没有注册，传入 null
            dependencies.push(null);
         }
      }

      // 创建实例
      const instance = new (providerClass as any)(...dependencies);
      console.log(`🎯 Created instance: ${providerClass.name}`);

      return instance;
   }

   /**
    * 检查 provider 是否已注册
    */
   has(providerClass: Function): boolean {
      return this.providers.has(providerClass);
   }

   /**
    * 获取所有已注册的 providers
    */
   getProviders(): Function[] {
      return Array.from(this.providers.keys());
   }

   /**
    * 清除所有实例（用于测试）
    */
   clear(): void {
      this.providers.clear();
      this.instances.clear();
   }
}
```

</details>

<details>
<summary class="bg-blue-400 text-white cursor-pointer select-none text-center active:scale-95">
    工厂函数及其内部实现
</summary>

```ts
/**
 * NestJS 工厂类 - 模拟 NestJS 的应用创建过程
 */
export class NestFactory {
   /**
    * 创建 Nest 应用实例
    * @param moduleClass - 根模块类
    * @returns NestApplication 实例
    */
   static async create(moduleClass: Function): Promise<NestApplication> {
      console.log('🚀 Starting Nest application...');

      // 创建应用实例
      const app = new NestApplication(moduleClass);

      // 初始化应用
      await app.init();

      console.log('✅ Nest application successfully started');

      return app;
   }
}

//=========================== 工厂函数内部实现=============================
import 'reflect-metadata';
import * as http from 'http';
import { Container } from './container.js';
import { RouteScanner } from './route-scanner.js';

/**
 * NestJS 应用核心类
 * 在首次创建时，初始化IOC容器，注册所有模块和提供者
 * 扫描所有控制器，注册路由
 */
export class NestApplication {
   private container: Container;
   private routeScanner: RouteScanner;
   private server?: http.Server;
   private rootModule: Function;

   constructor(moduleClass: Function) {
      this.rootModule = moduleClass;
      this.container = new Container();
      this.routeScanner = new RouteScanner(this.container);
   }

   /**
    * 初始化应用
    */
   async init(): Promise<void> {
      // 验证根模块，判断是否有效
      this.validateRootModule();

      // 初始化IOC容器，注册所有  providers，controllers 和 imports
      await this.initializeContainer();

      // 扫描并注册路由
      await this.scanRoutes();

      console.log('✅ Application initialized successfully');
   }

   /**
    * 验证根模块，根据模块元信息，判断是否是模块
    */
   private validateRootModule(): void {
      const isModule = Reflect.getMetadata('module:true', this.rootModule);
      if (!isModule) {
         throw new Error(
            `${this.rootModule.name} is not a valid module. Did you forget to add @Module() decorator?`
         );
      }
   }

   /**
    * 初始化容器
    */
   private async initializeContainer(): Promise<void> {
      console.log('📦 Initializing IoC container...');
      await this.container.registerModule(this.rootModule);
      console.log('✅ IoC container initialized');
   }

   /**
    * 扫描路由
    */
   private async scanRoutes(): Promise<void> {
      console.log('🔍 Scanning routes...');
      await this.routeScanner.scanModule(this.rootModule);
      console.log('✅ Routes scanned and registered');
   }

   /**
    * 启动 HTTP 服务器
    */
   async listen(port: number): Promise<void> {
      return new Promise((resolve) => {
         this.server = http.createServer((req, res) => {
            this.handleRequest(req, res);
         });

         this.server.listen(port, () => {
            console.log(`🌐 Application is running on: http://localhost:${port}`);
            resolve();
         });
      });
   }

   /**
    * 处理 HTTP 请求
    */
   private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
      try {
         const method = req.method?.toUpperCase();
         const url = req.url;

         console.log(`📥 ${method} ${url}`);

         // 查找匹配的路由
         const route = this.routeScanner.findRoute(method || '', url || '');

         if (!route) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(
               JSON.stringify({
                  statusCode: 404,
                  message: 'Cannot ' + method + ' ' + url
               })
            );
            return;
         }

         // 执行控制器方法
         const result = await route.handler();

         // 返回响应
         res.writeHead(200, { 'Content-Type': 'application/json' });
         res.end(JSON.stringify(result));
      } catch (error) {
         console.error('❌ Error handling request:', error);
         res.writeHead(500, { 'Content-Type': 'application/json' });
         res.end(
            JSON.stringify({
               statusCode: 500,
               message: 'Internal server error'
            })
         );
      }
   }

   /**
    * 关闭应用
    */
   async close(): Promise<void> {
      if (this.server) {
         return new Promise((resolve) => {
            this.server!.close(() => {
               console.log('🛑 Application closed');
               resolve();
            });
         });
      }
   }
   getRouteScannerInstance(): RouteScanner {
      return this.routeScanner;
   }

   /**
    * 获取容器实例
    */
   getContainer(): Container {
      return this.container;
   }
}
```

</details>

<details>
<summary class="bg-blue-400 text-white cursor-pointer select-none text-center active:scale-95">
    注入路由（完成路由映射）
</summary>

```ts
import 'reflect-metadata';
import { Container } from './container.js';
/**
 * 路由信息接口
 */
interface RouteInfo {
   method: string;
   path: string;
   handler: () => Promise<any>;
   controllerClass: Function;
   methodName: string;
}

/**
 * 路由扫描器 - 扫描控制器并注册路由
 */
export class RouteScanner {
   private routes: RouteInfo[] = [];
   private container: Container;

   constructor(container: Container) {
      this.container = container;
   }

   /**
    * 扫描模块中的控制器
    */
   async scanModule(moduleClass: Function): Promise<void> {
      // 获取模块中的所有控制器，在module类上通过元数据获取
      const controllers = Reflect.getMetadata('controllers', moduleClass) || [];

      //扫描成功后，对路由进行注册
      for (const controllerClass of controllers) {
         await this.scanController(controllerClass);
      }

      // 递归扫描导入的模块
      const imports = Reflect.getMetadata('imports', moduleClass) || [];
      for (const importedModule of imports) {
         await this.scanModule(importedModule);
      }
   }

   /**
    * 扫描单个控制器
    */
   async scanController(controllerClass: Function): Promise<void> {
      const isController = Reflect.getMetadata('controller', controllerClass);
      if (!isController) {
         //不是控制器
         return;
      }
      console.log(`🎯 Scanning controller: ${controllerClass.name}`);

      // 获取控制器路径
      const controllerPath = Reflect.getMetadata('controller:path', controllerClass) || '';

      // 获取控制器实例，这里没有的时候会创建实例，并处理依赖注入
      const controllerInstance = await this.container.get(controllerClass);

      // 扫描控制器的方法
      const prototype = controllerClass.prototype;
      const methodNames = Object.getOwnPropertyNames(prototype).filter(
         (name) => name !== 'constructor' && typeof prototype[name] === 'function'
      );

      for (const methodName of methodNames) {
         const method = prototype[methodName];

         // 检查是否有 HTTP 方法装饰器
         const httpMethod = Reflect.getMetadata('http:method', method);
         const methodPath = Reflect.getMetadata('http:method:path', method);

         if (httpMethod) {
            // 构建完整路径
            const fullPath = this.buildPath(controllerPath, methodPath);

            // 创建路由处理函数
            const handler = async () => {
               return await (controllerInstance as any)[methodName]();
            };

            // 注册路由
            const route: RouteInfo = {
               method: httpMethod,
               path: fullPath,
               handler,
               controllerClass,
               methodName
            };

            this.routes.push(route);
            console.log(
               `📍 Registered route: ${httpMethod} ${fullPath} -> ${controllerClass.name}.${methodName}`
            );
         }
      }
   }

   /**
    * 构建完整路径
    */
   private buildPath(controllerPath: string, methodPath: string): string {
      // 清理路径
      const cleanControllerPath = this.cleanPath(controllerPath);
      const cleanMethodPath = this.cleanPath(methodPath);

      // 拼接路径
      if (!cleanControllerPath && !cleanMethodPath) {
         return '/';
      }

      return ('/' + [cleanControllerPath, cleanMethodPath].filter(Boolean).join('/')).replace(
         /\/+/g,
         '/'
      );
   }

   /**
    * 清理路径（移除前后斜杠）
    */
   private cleanPath(path: string): string {
      if (!path) return '';
      return path.replace(/^\/+|\/+$/g, '');
   }

   /**
    * 查找匹配的路由
    */
   findRoute(method: string, url: string): RouteInfo | null {
      // 简单的精确匹配（实际的路由器会支持参数和通配符）
      const route = this.routes.find((route) => route.method === method && route.path === url);

      if (route) {
         console.log(
            `🎯 Route matched: ${method} ${url} -> ${route.controllerClass.name}.${route.methodName}`
         );
      }

      return route || null;
   }

   /**
    * 获取所有路由
    */
   getRoutes(): RouteInfo[] {
      return [...this.routes];
   }

   /**
    * 打印所有路由（用于调试）
    */
   printRoutes(): void {
      console.log('\n📋 Registered Routes:');
      if (this.routes.length === 0) {
         console.log('  No routes registered');
         return;
      }

      this.routes.forEach((route) => {
         console.log(
            `  ${route.method.padEnd(6)} ${route.path.padEnd(20)} -> ${route.controllerClass.name}.${route.methodName}`
         );
      });
      console.log();
   }
}
```

</details>

<details>
<summary class="bg-blue-400 text-white cursor-pointer select-none text-center active:scale-95">
   示例用法
</summary>

```ts
//app.server.ts
@Injectable()
export class AppService {
   getHello(): string {
      return 'Hello NestJS';
   }
}
//app.controller.ts
@Controller()
export class AppController {
   constructor(private readonly appService: AppService) {}
   @Get()
   getHello(): string {
      return this.appService.getHello();
   }
}
//===================================根模块=======================
//app.module.ts
//模块划分
@Module({
   controllers: [AppController, UserController],
   providers: [AppService, UserService],
   imports: [],
   exports: []
})
export class AppModule {}

//user.server.ts
@Injectable()
export class UserService {
   getAllUsers() {
      return {
         message: 'Get all users',
         users: ['nihao']
      };
   }
}
//user.controller.ts
@Controller('/users')
export class UserController {
   constructor(private readonly userService: UserService) {}

   @Get()
   getAllUsers(): any {
      return this.userService.getAllUsers();
   }
}

//=================================启动入口==========================
//main.ts
/**
 * 应用入口文件 - 演示 NestJS 的启动过程
 */
async function bootstrap() {
   try {
      // 创建应用实例
      const app = await NestFactory.create(AppModule);

      // 启动服务器
      const port = 3000;
      await app.listen(port);
   } catch {}
}

// 启动应用
bootstrap();
```

</details>
