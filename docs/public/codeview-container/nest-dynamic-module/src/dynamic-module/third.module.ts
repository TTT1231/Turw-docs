import { Module, DynamicModule, Provider } from '@nestjs/common';
import type {
  IThirdModuleAsyncFactory,
  IThirdModuleAsyncOptions,
  IThirdModuleOptions,
  ThirdOptions,
} from './third-module';
import { THIRD_MODULE_OPTIONS, THIRD_MODULE_OPTIONS_VALIDATOR } from './constant';
import { ThirdService } from './third.service';
import { ThirdConfigValidator } from './third-config.validator';

@Module({})
export class ThirdModule {
  public static register(options: IThirdModuleOptions): DynamicModule {
    this.validateOptions(options);
    return {
      module: ThirdModule,
      global: options.isGlobal ?? false,
      providers: [
        ThirdService,
        {
          provide: THIRD_MODULE_OPTIONS,
          useValue: options as ThirdOptions,
        },
      ],
      exports: [ThirdService, THIRD_MODULE_OPTIONS],
    };
  }

  public static registerAsync(options: IThirdModuleAsyncOptions): DynamicModule {
    const validateProvider: Provider[] = this.extraValidatorFromExtraProviders(options.extraProviders || []);
    //先注册，在DI
    return {
      module: ThirdModule,
      imports: options.imports || [],
      global: options.global || false,
      providers: [
        ...this.createAsyncOptions(options, validateProvider),
        ThirdService,
        ...(options.extraProviders || []),
      ],
      exports: [ThirdService, THIRD_MODULE_OPTIONS],
    };
  }
  //创建异步配置提供者
  private static createAsyncOptions(options: IThirdModuleAsyncOptions, validateProvider: Provider[]): Provider[] {
    //useFactory or useExisting 这里不需要额外的验证器提供者，依赖在inject中，不需要nestjs帮忙创建实例
    //!这里不需要provider2,因为inject已经提供了
    if (options.useFactory || options.useExisting) {
      return [this.createAsyncOptionsProvider(options, validateProvider)];
    }

    if (!options.useClass) {
      throw new Error('创建配置提供者失败，缺少useClass');
    }

    //useClass情况，这里需要两个provider
    //!主要就是 这个inject没有提供，而useFactory和useExisting有提供
    /**
     * useClass，需要手动注册工厂类，类似下面这种情况
     * ThirdModule.registerAsync({
     *   useClass: MyConfigService // 传入一个工厂类
     * })
     * provider1
     * {
     *   provide: THIRD_MODULE_OPTIONS,
     *    useFactory: async (myConfigService) => {
     *    return await myConfigService.createThirdOptions();
     * },
     * provider2
     * inject: [MyConfigService] // 依赖 MyConfigService 的实例
     * }
     */
    return [
      //provider1
      this.createAsyncOptionsProvider(options, validateProvider),
      //provider2
      {
        provide: options.useClass,
        useClass: options.useClass,
      },
    ];
  }

  //创建配置提供者
  private static createAsyncOptionsProvider(
    options: IThirdModuleAsyncOptions,
    validatorProvider: Provider[],
  ): Provider {
    //useFactory情况
    if (options.useFactory) {
      const originalInject = options.inject || [];
      const validatorToken = this.extractValidatorTokens(validatorProvider);
      const originalFactory = options.useFactory;
      return {
        provide: THIRD_MODULE_OPTIONS,
        useFactory: async (...args: unknown[]) => {
          const originalInjectArgs = args.slice(0, originalInject.length);
          const validatorArgs = args.slice(originalInject.length) as ThirdConfigValidator[];
          const thirdOptions = (await originalFactory(...originalInjectArgs)) as IThirdModuleOptions;
          this.validateAsyncOptions(thirdOptions, validatorArgs);

          return thirdOptions;
        },

        inject: [...originalInject, ...validatorToken] as any[],
      };
    }

    //useExisting,和useClass情况
    /**
     * TODO 示例：
       ThirdModule.registerAsync({
         useClass: MyConfigFactory,  // 传入配置工厂类
         extraProviders: [
         MyValidator1,              // 验证器1
         MyValidator2,              // 验证器2
         ]  
      })
      //1.inject = options.useClass = MyConfigFactory
      //2.validatorTokens = [MyValidator1, MyValidator2]
      //3.inject 数组 = [MyConfigFactory, MyValidator1, MyValidator2] 

      //最终provider:
      {
        provide: THIRD_MODULE_OPTIONS,
        useFactory: async (
          optionsFactory: MyConfigFactory,      // ← NestJS 注入 MyConfigFactory 实例
          ...validators: ThirdConfigValidator[] // ← NestJS 注入 [MyValidator1实例, MyValidator2实例]
        ) => {
          const config = await optionsFactory.createThirdOptions();
          this.validateConfig(config, validators);
          return config;
        },
        inject: [MyConfigFactory, MyValidator1, MyValidator2]
        //       ↑第1个参数      ↑第2个参数    ↑第3个参数
      }
     * 
     */
    const inject = options.useExisting || options.useClass;
    if (!inject) {
      throw new Error('创建配置提供者失败，缺少useExisting或useClass');
    }

    const validatorTokens = this.extractValidatorTokens(validatorProvider);

    return {
      provide: THIRD_MODULE_OPTIONS,
      useFactory: async (optionsFactory: IThirdModuleAsyncFactory, ...validators: ThirdConfigValidator[]) => {
        const config = await optionsFactory.createThirdOptions();
        this.validateAsyncOptions(config, validators);
        return config;
      },
      inject: [inject, ...validatorTokens] as any[],
    };
  }

  //执行配置验证，register可用
  private static validateOptions(options: IThirdModuleOptions): void {
    if (!!options.validator) {
      const thirdOptions = options as ThirdOptions;
      if (options.validator.length > 0) {
        options.validator.forEach((validator) => {
          validator.validate(thirdOptions);
        });
      }
    }
  }
  // 执行配置验证，registerAsync可用
  private static validateAsyncOptions(options: IThirdModuleOptions, validators: ThirdConfigValidator[]): void {
    if (validators.length > 0) {
      const thirdOptions = options as ThirdOptions;
      validators.forEach((validator) => {
        validator.validate(thirdOptions);
      });
    }
  }

  // 从extraProviders中提取验证器
  private static extraValidatorFromExtraProviders(options: Provider[]): Provider[] {
    return options.filter((provider) => {
      //类provider validator
      if (typeof provider === 'function') {
        return provider.prototype instanceof ThirdConfigValidator || provider === ThirdConfigValidator;
      }

      //令牌provider validator
      if (typeof provider === 'object' && 'provide' in provider) {
        //useClass
        if ('useClass' in provider && typeof provider.useClass === 'function') {
          return (
            provider.useClass.prototype instanceof ThirdConfigValidator || provider.useClass === ThirdConfigValidator
          );
        }

        //useExsiting
        if ('useExisting' in provider) {
          return provider.provide === THIRD_MODULE_OPTIONS_VALIDATOR;
        }

        //useValue,值必须是ThirdConfigValidator实例，且必须是令牌导入
        if ('useValue' in provider) {
          const value = provider.useValue;
          return value instanceof ThirdConfigValidator && provider.provide === THIRD_MODULE_OPTIONS_VALIDATOR;
        }

        //!useFactory情况,不支持作为验证器
        //!无法在编译时进行类型检查，动态工厂函数验证应该是明确类实例
        if ('useFactory' in provider) {
          throw new Error('工厂验证，不支持作为配置验证器，违背设计初衷');
        }

        //!其他异常provider情况
        if (provider.provide === THIRD_MODULE_OPTIONS_VALIDATOR) {
          throw new Error('不支持的配置验证器provider类型');
        }
      }
      return false;
    });
  }

  // 从验证器中提取令牌
  private static extractValidatorTokens(validatorProviders: Provider[]): unknown[] {
    return validatorProviders.map((provider) => {
      if (typeof provider === 'function') {
        return provider;
      }

      if (typeof provider === 'object' && 'provide' in provider) {
        return provider.provide;
      }

      throw new Error('无法提取配置验证器令牌');
    });
  }
}
