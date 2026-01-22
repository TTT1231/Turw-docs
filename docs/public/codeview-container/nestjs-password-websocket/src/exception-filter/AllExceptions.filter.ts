import { Catch, HttpException, type ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

@Catch()
/**
 * BaseExceptionFilter 所有nestjs内置异常过滤器都继承了它，
 * 如果要判断一个异常实例是否是nestjs的内置异常，可以使用instanceof HttpException
 */
export class AllExceptionsFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    //内置nestjs异常处理
    if (exception instanceof HttpException) {
      return super.catch(exception, host);
    }

    //自定义异常处理
  }
}
