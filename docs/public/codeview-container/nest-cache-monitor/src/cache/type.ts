//缓存指标
export interface ICacheMetrics {
  // 度量指标
  hit: number;
  miss: number;
  hitRate: number;

  // 性能指标
  totalReadTime: number;
  totalWriteTime: number;
  readCount: number;
  writeCount: number;
  p95ReadTime: number;
  p95WriteTime: number;

  // 自定义指标
  cacheTokenUsage: Map<string, number>; //使用频率,这里string采用controller+method的形式
  currentMemorySize: number; //当前缓存所占内存大小，单位B（比特）
  cacheMap: Map<string, string[]> | undefined; //编译后要缓存的map，类型同cacheTokenUsage类似
}

export interface ISettingCacheResult<T> {
  result: T;
  executeTime: number;
}
export interface ICacheResult {
  value: unknown;
  settingTime: string;
  duration: number;
}
