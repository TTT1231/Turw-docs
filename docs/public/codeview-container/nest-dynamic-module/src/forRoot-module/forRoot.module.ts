import { DynamicModule, Module } from '@nestjs/common';
import { ForRootService } from './forRoot.service';
import { FOR_ROOT_MODULE_OPTIONS, type ForRootModuleOptions } from './forRoot.constants';

@Module({})
export class ForRootModule {
  public static forRoot(options: ForRootModuleOptions): DynamicModule {
    return {
      global: false, // ✅ 不声明为全局模块，避免与 ConfigHostModule 的三角循环依赖
      module: ForRootModule,
      providers: [
        {
          provide: FOR_ROOT_MODULE_OPTIONS,
          useValue: options,
        },
        ForRootService,
        //... other providers like services
      ],
      exports: [
        //export providers here,like services
        //...
        ForRootService,
        //or export the options token,so it can be injected in other modules
        //@Inject(FOR_ROOT_MODULE_OPTIONS) private options: ForRootModuleOptions
        FOR_ROOT_MODULE_OPTIONS,
      ],
    };
  }
}
