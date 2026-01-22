import { Injectable } from '@nestjs/common';
import { ThirdConfigValidator } from '../dynamic-module/third-config.validator';
import type { ThirdOptions } from '../dynamic-module/third-module';

@Injectable()
export class MyThirdConfigValidator2 extends ThirdConfigValidator {
  validate(data: ThirdOptions): void {
    console.log('Validating ThirdOptions2:', data);
  }
}
