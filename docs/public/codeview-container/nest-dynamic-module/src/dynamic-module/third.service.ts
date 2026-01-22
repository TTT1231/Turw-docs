import { Inject, Injectable } from '@nestjs/common';
import { THIRD_MODULE_OPTIONS } from './constant';
import type { IThirdModuleOptions } from './third-module';

@Injectable()
export class ThirdService {
  constructor(@Inject(THIRD_MODULE_OPTIONS) private readonly options: IThirdModuleOptions) {}
}
