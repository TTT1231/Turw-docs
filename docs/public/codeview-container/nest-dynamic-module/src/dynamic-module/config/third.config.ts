import type { ThirdOptions } from '../third-module';

export default () =>
  ({
    apiKey: process.env.apiKey,
  }) satisfies ThirdOptions;
