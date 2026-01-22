import type { ThirdConfigValidator } from './third-config.validator';
import { Type, ModuleMetadata, Provider, InjectionToken, OptionalFactoryDependency } from '@nestjs/common';

export class ThirdOptions {
  apiKey: string;
}

export type IThirdModuleOptions = ThirdOptions & {
  isGlobal?: boolean;
  validator?: Array<ThirdConfigValidator>;
};

export interface IThirdModuleAsyncFactory {
  createThirdOptions(): Promise<IThirdModuleOptions> | IThirdModuleOptions;
}

export interface IThirdModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<IThirdModuleAsyncFactory>;
  useClass?: Type<IThirdModuleAsyncFactory>;
  useFactory?: (...args: unknown[]) => Promise<IThirdModuleOptions> | IThirdModuleOptions;
  inject?: (InjectionToken | OptionalFactoryDependency)[];
  extraProviders?: Provider[];
  global?: boolean;
}
