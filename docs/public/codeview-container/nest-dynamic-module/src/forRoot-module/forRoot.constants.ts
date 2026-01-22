/**
 * ForRoot 模块的配置选项接口
 */
export interface ForRootModuleOptions {
  someKey: string;
  //... other options
}

/**
 * DI 容器中的 token
 */
export const FOR_ROOT_MODULE_OPTIONS = 'FOR_ROOT_MODULE_OPTIONS';
