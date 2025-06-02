import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
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
    
    // Check if it's a direct BadRequestException
    if (exception instanceof BadRequestException) {
      status = 400;
      message = exception.message;
      error = 'Bad Request';
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
      }
    }
    // Handle error objects with statusCode property directly
    else if (exception && typeof exception === 'object' && 'statusCode' in exception) {
      const err = exception as any;
      if (err.statusCode === 400) {
        status = 400;
        message = err.message || 'Bad Request';
        error = 'Bad Request';
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