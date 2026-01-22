import { Module, Injectable } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThirdModule } from './dynamic-module/third.module';
import ThirdConfig from './dynamic-module/config/third.config';
import { MyThirdConfigValidator } from './validator/third-config.validator';
import type { IThirdModuleAsyncFactory, IThirdModuleOptions, ThirdOptions } from './dynamic-module/third-module';
import { Test1Module } from './test1/test1.module';
import { MyThirdConfigValidator2 } from './validator/third-config2.validator';
import { ForRootModule } from './forRoot-module/forRoot.module';
import { DevtoolsModule } from '@nestjs/devtools-integration';

// ==================== 工厂类示例 ====================
// 方式1: 创建一个配置工厂类（用于 useClass）
@Injectable()
class ThirdConfigFactory implements IThirdModuleAsyncFactory {
  createThirdOptions(): IThirdModuleOptions {
    return {
      apiKey: 'my-api-key-from-factory-class',
      isGlobal: false,
    };
  }
}

// 方式2: 使用 ConfigService 的工厂类
@Injectable()
class ThirdConfigFactoryWithConfigService implements IThirdModuleAsyncFactory {
  constructor(private configService: ConfigService) {}

  createThirdOptions(): IThirdModuleOptions {
    return {
      apiKey: this.configService.get('apiKey') || 'default-api-key',
      isGlobal: false,
    };
  }
}

@Module({
  imports: [
    DevtoolsModule.register({
      http: true,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [ThirdConfig], // 加载 ThirdConfig
    }),
    //==================================ForRoot ===============================
    ForRootModule.forRoot({
      someKey: 'someValue',
    }),

    // ==================== 使用方式 1: useFactory (最简单) ====================
    // 直接使用工厂函数，不依赖任何服务
    //  ThirdModule.registerAsync({
    //    useFactory: () => ({
    //      apiKey: 'simple-factory-key',
    //      isGlobal: false,
    //    }),
    //    extraProviders: [MyThirdConfigValidator],
    //  }),

    // ==================== 使用方式 2: useFactory + ConfigService ====================
    //  使用 ConfigService 获取配置
    //  ThirdModule.registerAsync({
    //    imports: [ConfigModule.forFeature(ThirdConfig)], // 可选：如果需要加载特定配置
    //    useFactory: (configService: ConfigService) => {
    //      return {
    //        apiKey: configService.get('apiKey') || 'default-key',
    //        isGlobal: false,
    //      };
    //    },
    //    inject: [ConfigService],
    //  }),

    // ==================== 使用方式 3: useFactory + ConfigService + 验证器 ====================
    // 带验证器的配置
    //  ThirdModule.registerAsync({
    //    imports: [ConfigModule.forFeature(ThirdConfig)],
    //    useFactory: (configService: ConfigService) => {
    //      return {
    //        apiKey: configService.get('apiKey') || 'default-key',
    //        isGlobal: false,
    //      };
    //    },
    //    inject: [ConfigService],
    //    extraProviders: [MyThirdConfigValidator], // 添加验证器
    //  }),

    // ==================== 使用方式 4: useClass ====================
    // 使用工厂类
    //  ThirdModule.registerAsync({
    //    useClass: ThirdConfigFactory,
    //    extraProviders: [MyThirdConfigValidator], // 可选：添加验证器
    //  }),

    // ==================== 使用方式 5: useClass + 依赖注入 ====================
    // 工厂类依赖 ConfigService
    //  ThirdModule.registerAsync({
    //    imports: [ConfigModule.forFeature(ThirdConfig)],
    //    useClass: ThirdConfigFactoryWithConfigService,
    //    extraProviders: [MyThirdConfigValidator],
    //  }),

    // ==================== 使用方式 6: useExisting ====================
    // 使用已存在的服务实例
    // useExisting 需要先在 extraProviders 中注册该服务
    //  ThirdModule.registerAsync({
    //    imports: [ConfigModule.forFeature(ThirdConfig)],
    //    useExisting: ThirdConfigFactoryWithConfigService,
    //    extraProviders: [
    //      ThirdConfigFactoryWithConfigService, // 必须先注册
    //      MyThirdConfigValidator,
    //    ],
    //  }),

    // ==================== 使用方式 7: useFactory + 自定义服务 ====================
    //!注意这里AppService 在 extraProviders 中注册到 ThirdModule
    // inject: [AppService] 告诉 NestJS 要注入 AppService
    // 最终的 inject 数组是：[AppService, MyThirdConfigValidator]
    // NestJS 能在 ThirdModule 的 providers 中找到 AppService（因为 extraProviders 中有）
    //ThirdModule访问不了 AppModule 的 providers，只能访问 extraProviders 中的服务

    // 注入自定义服务
    //  ThirdModule.registerAsync({
    //    useFactory: (appService: AppService) => {
    //      console.log('AppService in factory:', appService);
    //      // 可以使用任何已注册的服务
    //      return {
    //        apiKey: 'key-from-app-service',
    //        isGlobal: false,
    //      };
    //    },
    //    inject: [AppService],
    //    extraProviders: [MyThirdConfigValidator, AppService],
    //  }),

    // ==================== 使用方式 8: useFactory + 异步加载 ====================
    // 异步工厂函数
    //  ThirdModule.registerAsync({
    //    imports: [ConfigModule.forFeature(ThirdConfig)],
    //    useFactory: async (configService: ConfigService<ThirdOptions>) => {
    //      // 模拟异步操作（如从数据库或远程服务获取配置）
    //      await new Promise((resolve) => setTimeout(resolve, 100));

    //      return {
    //        apiKey: configService.get('apiKey') || 'async-key',
    //        isGlobal: false,
    //      };
    //    },
    //    inject: [ConfigService],
    //    extraProviders: [MyThirdConfigValidator],
    //  }),

    // ==================== 使用方式 9: 全局模块 ====================
    // 设置为全局模块
    //  ThirdModule.registerAsync({
    //    global: true, // 设置为全局
    //    useFactory: (configService: ConfigService) => ({
    //      apiKey: configService.get('apiKey') || 'global-key',
    //      isGlobal: true,
    //    }),
    //    inject: [ConfigService],
    //  }),

    // ==================== 使用方式 10: 多个验证器 ====================
    // 使用多个验证器
    //  ThirdModule.registerAsync({
    //    useFactory: () => ({
    //      apiKey: 'multi-validator-key',
    //      isGlobal: false,
    //    }),
    //    extraProviders: [
    //      MyThirdConfigValidator,
    //      // 可以添加更多验证器类
    //      MyThirdConfigValidator2,
    //    ],
    //  }),

    // ==================== 使用方式 11: useFactory 直接从环境变量读取 ====================
    // 直接从 process.env 读取
    //  ThirdModule.registerAsync({
    //    useFactory: () => ({
    //      apiKey: process.env.apiKey || 'env-key',
    //      isGlobal: false,
    //    }),
    //    extraProviders: [MyThirdConfigValidator],
    //  }),

    // ==================== 使用方式 12: 结合 ConfigModule.forFeature ====================
    // 使用 forFeature 加载特定配置文件
    ThirdModule.registerAsync({
      // imports: [ConfigModule.forFeature(ThirdConfig)],
      useFactory: (configService: ConfigService) => {
        // ThirdConfig 返回的配置会被合并到 ConfigService 中
        const config = configService.get('apiKey'); // 直接获取 ThirdConfig 导出的值
        return {
          apiKey: config || 'feature-key',
          isGlobal: false,
        };
      },
      inject: [ConfigService],
      extraProviders: [MyThirdConfigValidator],
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // 注意：useExisting 的工厂类应该在 ThirdModule.registerAsync 的 extraProviders 中注册
    // 而不是在这里注册
  ],
})
export class AppModule {}
