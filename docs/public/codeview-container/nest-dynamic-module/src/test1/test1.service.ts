import { Inject, Injectable } from '@nestjs/common';
import { THIRD_MODULE_OPTIONS } from '../dynamic-module/constant';
import type { IThirdModuleOptions } from '../dynamic-module/third-module';

@Injectable()
export class Test1Service {
  //   constructor(@Inject(THIRD_MODULE_OPTIONS) private readonly options: IThirdModuleOptions) {
  //     console.log('Test1Service received ThirdModule options:', this.options);
  //   }
}
