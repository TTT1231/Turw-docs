// 异步函数类型
type AsyncFunction<T extends any[], R> = (...args: T) => Promise<R>;

interface MeasurementResult<T> {
  result: T;
  executeTime: number;
}

export async function measureExecutionTime<T extends any[], R>(func: AsyncFunction<T, R>, ...args: T): Promise<MeasurementResult<R>> {
  const start = performance.now();

  // 执行异步函数
  const result = await func(...args);

  const end = performance.now();
  const duration = Number((end - start).toFixed(2));

  //   console.log(`函数执行时间: ${duration} 毫秒`);

  return {
    result,
    executeTime: duration,
  };
}
