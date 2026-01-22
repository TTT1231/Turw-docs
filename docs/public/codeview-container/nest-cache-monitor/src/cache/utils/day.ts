/**
 * 获取当前时间的格式化字符串（格式：YYYY/MM/DD HH:mm:ss.SSS）精确到毫秒
 * @returns 例如 "2025/10/10 13:51:56.789"
 */
export function getTimeNowString(): string {
  const now = new Date();

  // 补零函数（确保两位数）
  const pad = (num: number): string => num.toString().padStart(2, '0');
  // 补零函数（毫秒固定3位）
  const padMs = (num: number): string => num.toString().padStart(3, '0');

  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1); // 月份从 0 开始
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());
  const milliseconds = padMs(now.getMilliseconds()); // 获取毫秒并补零

  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}

/**
 * 将时间字符串解析为 Date 对象
 * @param timeStr 时间字符串（格式：YYYY/MM/DD HH:mm:ss.SSS）
 */
export function parseTimeToDate(timeStr: string): Date {
  // 正则匹配拆分年月日时分秒毫秒
  const match = timeStr.match(/^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}):(\d{2})\.(\d{3})$/);
  if (!match) {
    throw new Error('无效的时间格式，请使用 YYYY/MM/DD HH:mm:ss.SSS');
  }

  // 提取各部分并转换为数字
  const [, year, month, day, hours, minutes, seconds, milliseconds] = match.map(Number);

  // 返回 Date 对象
  return new Date(year, month - 1, day, hours, minutes, seconds, milliseconds);
}

export function diffTimeInMsNow(timeStr: string): number {
  const pastDate = parseTimeToDate(timeStr);
  const now = new Date();
  return now.getTime() - pastDate.getTime();
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
