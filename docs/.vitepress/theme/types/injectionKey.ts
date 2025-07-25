import type { InjectionKey } from 'vue';
import type { MessageApi } from 'ant-design-vue/es/message';

/**
 * InjectionKey是一个泛型类型，它创建一个带类型的Symbol，用于在Vue的依赖注入系统中提供和注入值。
 * 这种方式可以确保在使用`inject`时获得正确的类型提示。
 */

// 创建类型化的 injection key
export const messageKey: InjectionKey<MessageApi> = Symbol('message');
