import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessControlService } from '../services/access-control.service';
import { SKIP_ACCESS_CHECK_KEY } from '../decorators/skip-access-check.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Access Guard - Ensures authenticated users have access to the application
 * 
 * This guard should be used on application routes that require users to have
 * approved access beyond just being authenticated.
 * 
 * Usage:
 * @UseGuards(JwtAuthGuard, AccessGuard)
 * @Get('protected-route')
 * async protectedRoute() {
 *   // Only users with approved access can reach this endpoint
 * }
 */
@Injectable()
export class AccessGuard implements CanActivate {
  constructor(
    private accessControlService: AccessControlService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Check if access check should be skipped for this route
    const skipAccessCheck = this.reflector.getAllAndOverride<boolean>(SKIP_ACCESS_CHECK_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipAccessCheck) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const email = user?.email || user?.username;
    if (!user || !email) {
      throw new ForbiddenException('User authentication required');
    }

    try {
      const accessResult = await this.accessControlService.checkAccess(email);
      
      if (!accessResult.hasAccess) {
        let errorCode = 'ACCESS_DENIED';
        
        // Determine specific error code based on the access result
        if (accessResult.message === 'No access. User can request access.') {
          errorCode = 'NO_ACCESS_REQUEST_AVAILABLE';
        } else if (accessResult.accessRequest?.status === 'pending') {
          errorCode = 'ACCESS_REQUEST_PENDING';
        } else if (accessResult.accessRequest?.status === 'rejected') {
          errorCode = 'ACCESS_REQUEST_REJECTED';
        } else if (accessResult.user && !accessResult.user.canAccess) {
          errorCode = 'USER_ACCESS_INACTIVE';
        }
        
        throw new ForbiddenException({
          message: `Access denied: ${accessResult.message}. Please contact an administrator if you need access.`,
          error: 'Forbidden',
          statusCode: 403,
          code: errorCode,
          accessResult
        });
      }

      // Add the user's database record to the request for use in controllers
      if (accessResult.user) {
        request.user.dbUser = accessResult.user;
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException({
        message: 'Access validation failed',
        error: 'Forbidden',
        statusCode: 403,
        code: 'ACCESS_VALIDATION_FAILED'
      });
    }
  }
}
