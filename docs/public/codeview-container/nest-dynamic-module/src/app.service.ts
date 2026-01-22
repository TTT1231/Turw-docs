import { Inject, Injectable } from '@nestjs/common';
import type { IThirdModuleOptions } from './dynamic-module/third-module';
import { THIRD_MODULE_OPTIONS } from './dynamic-module/constant';
import { FOR_ROOT_MODULE_OPTIONS, type ForRootModuleOptions } from './forRoot-module/forRoot.constants';
import { ForRootService } from './forRoot-module/forRoot.service';

@Injectable()
export class AppService {
  //   constructor(@Inject(THIRD_MODULE_OPTIONS) private readonly options: IThirdModuleOptions) {
  //     console.log('AppService received ThirdModule options:', this.options);
  //   }

  //forRoot service example
  constructor(
    @Inject(FOR_ROOT_MODULE_OPTIONS) private readonly forRootOptions: ForRootModuleOptions,

    private readonly forRootService: ForRootService,
  ) {}
  getHello(): string {
    return 'Hello World!';
  }
}
