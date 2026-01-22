import { Inject, Injectable } from '@nestjs/common';
import { FOR_ROOT_MODULE_OPTIONS, type ForRootModuleOptions } from './forRoot.constants';

@Injectable()
export class ForRootService {
  constructor(
    // Add any dependencies you need here
    //or inject configuration options
    @Inject(FOR_ROOT_MODULE_OPTIONS) private readonly options: ForRootModuleOptions,
  ) {}
  getHello(): string {
    return 'Hello from ForRootService!';
  }
}
