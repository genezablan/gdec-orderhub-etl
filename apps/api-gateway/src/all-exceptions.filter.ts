import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  HttpException,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Response, Request } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = 500;
    let message = 'Internal server error';
    let error = 'Internal Server Error';

    console.log('exception:', exception)
    
    // Handle HTTP exceptions first (including UnauthorizedException)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse();
      if (typeof errorResponse === 'string') {
        message = errorResponse;
      } else if (typeof errorResponse === 'object' && errorResponse) {
        message = (errorResponse as any).message || exception.message;
        error = (errorResponse as any).error || exception.constructor.name;
      }
    }
    // Check if it's a direct BadRequestException
    else if (exception instanceof BadRequestException) {
      status = 400;
      message = exception.message;
      error = 'Bad Request';
    }
    // Check if it's an UnauthorizedException
    else if (exception instanceof UnauthorizedException) {
      status = 401;
      message = exception.message;
      error = 'Unauthorized';
    }
    // Check if it's a NotFoundException
    else if (exception instanceof NotFoundException) {
      status = 404;
      message = exception.message;
      error = 'Not Found';
    } 
    // Check if it's an RpcException containing a BadRequestException
    else if (exception instanceof RpcException) {
      const rpcError = exception.getError();
      if (rpcError instanceof BadRequestException) {
        status = 400;
        message = rpcError.message;
        error = 'Bad Request';
      }
    }
    // Handle the structured error object from microservices
    else if (exception && typeof exception === 'object' && 'response' in exception) {
      const errorResponse = (exception as any).response;
      if (errorResponse && errorResponse.statusCode === 400) {
        status = 400;
        message = errorResponse.message;
        error = 'Bad Request';
      }else if(errorResponse.statusCode === 404) {
        status = 404;
        message = errorResponse.message || 'Not Found';
        error = 'Not Found';
      }
    }

    const errorResponseObj = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponseObj);
  }
}