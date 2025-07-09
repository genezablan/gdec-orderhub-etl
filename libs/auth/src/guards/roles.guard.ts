import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@app/database-orderhub';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AccessControlService } from '../services/access-control.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private accessControlService: AccessControlService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // No specific roles required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const email = user?.email || user?.username;
    if (!user || !email) {
      throw new ForbiddenException({
        message: 'User authentication required',
        error: 'Forbidden',
        statusCode: 403,
        code: 'USER_AUTHENTICATION_REQUIRED'
      });
    }

    try {
      // Get user from database to check current role and status
      const dbUser = await this.accessControlService.findUserByEmail(email);
      
      if (!dbUser) {
        throw new ForbiddenException({
          message: 'User not found in system',
          error: 'Forbidden',
          statusCode: 403,
          code: 'USER_NOT_FOUND'
        });
      }

      if (!dbUser.canAccess) {
        throw new ForbiddenException({
          message: 'User access not approved or account inactive',
          error: 'Forbidden',
          statusCode: 403,
          code: 'USER_ACCESS_INACTIVE'
        });
      }

      // Check if user has any of the required roles
      const hasRole = requiredRoles.includes(dbUser.role);
      
      if (!hasRole) {
        throw new ForbiddenException({
          message: `Access denied. Required roles: ${requiredRoles.join(', ')}. User role: ${dbUser.role}`,
          error: 'Forbidden',
          statusCode: 403,
          code: 'INSUFFICIENT_ROLE',
          requiredRoles,
          userRole: dbUser.role
        });
      }

      // Add user info to request for use in controllers
      request.user = { ...user, dbUser };
      
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
