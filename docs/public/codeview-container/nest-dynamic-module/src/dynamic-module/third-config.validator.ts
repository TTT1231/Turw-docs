import type { ThirdOptions } from './third-module';

export abstract class ThirdConfigValidator {
  abstract validate(data: ThirdOptions): void;
}
