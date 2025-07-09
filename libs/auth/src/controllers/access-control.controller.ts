import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AccessControlService, AccessCheckResult } from '../services/access-control.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { SkipAccessCheck } from '../decorators/skip-access-check.decorator';
import { User as CurrentUser } from '../decorators/user.decorator';
import { UserRole, User, AccessRequest } from '@app/database-orderhub';
import {
  ProcessAccessRequestDto,
  CreateUserDto,
  UpdateUserDto,
  UpdateUserStatusDto,
} from '../dto/access-control.dto';

@ApiTags('Access Control')
@Controller('access-control')
@UseGuards(JwtAuthGuard) // Require authentication for all endpoints
@ApiBearerAuth()
export class AccessControlController {
  constructor(private readonly accessControlService: AccessControlService) {}

  @Get('my-access')
  @SkipAccessCheck() // Allow authenticated users without approved access to check their status
  @ApiOperation({ summary: 'Check current user access status' })
  @ApiResponse({ status: 200, description: 'Current user access status' })
  async checkMyAccess(@CurrentUser() user: any): Promise<AccessCheckResult> {
    console.log('checkMyAccess - User object:', JSON.stringify(user, null, 2)); // Better debug log
    
    const email = user.email || user.username; // Fallback to username if email not available
    if (!email) {
      console.error('checkMyAccess - No email or username found in user object:', user);
      throw new Error(`User email or username not found in token. Token type: ${user.tokenType || 'unknown'}. Available fields: ${Object.keys(user).join(', ')}`);
    }
    
    console.log('checkMyAccess - Using email/username:', email);
    return await this.accessControlService.checkAccess(email);
  }

  @Post('request-access')
  @SkipAccessCheck() // Allow authenticated users without approved access to request access
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Request access to the application for current user' })
  @ApiResponse({ status: 201, description: 'Access request created successfully' })
  @ApiResponse({ status: 409, description: 'User or request already exists' })
  async requestAccess(@CurrentUser() user: any): Promise<AccessRequest> {
    console.log('requestAccess - User object:', JSON.stringify(user, null, 2)); // Better debug log
    
    const email = user.email || user.username; // Fallback to username if email not available
    if (!email) {
      console.error('requestAccess - No email or username found in user object:', user);
      throw new Error(`User email or username not found in token. Token type: ${user.tokenType || 'unknown'}. Available fields: ${Object.keys(user).join(', ')}`);
    }
    
    console.log('requestAccess - Using email/username:', email);
    return await this.accessControlService.requestAccess({ email });
  }

  // Admin-only endpoints below
  @Get('requests/pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all pending access requests (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of pending access requests' })
  async getPendingAccessRequests(): Promise<AccessRequest[]> {
    return await this.accessControlService.getPendingAccessRequests();
  }

  @Get('requests')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all access requests (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all access requests' })
  async getAllAccessRequests(): Promise<AccessRequest[]> {
    return await this.accessControlService.getAllAccessRequests();
  }

  @Put('requests/:id/process')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Process an access request (Admin only)' })
  @ApiResponse({ status: 200, description: 'Access request processed successfully' })
  @ApiResponse({ status: 404, description: 'Access request not found' })
  async processAccessRequest(
    @Param('id') id: string,
    @Body() processDto: ProcessAccessRequestDto,
    @CurrentUser() admin: any,
  ): Promise<AccessRequest> {
    return await this.accessControlService.processAccessRequest(id, processDto, admin.email);
  }

  @Post('users')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() admin: any,
  ): Promise<User> {
    const adminUser = await this.accessControlService.findUserByEmail(admin.email);
    return await this.accessControlService.createUserWithRoleCheck(
      createUserDto, 
      admin.email, 
      adminUser.role
    );
  }

  @Get('users')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get users based on role permissions (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of users that current admin can manage' })
  async getAllUsers(@CurrentUser() admin: any): Promise<User[]> {
    const adminUser = await this.accessControlService.findUserByEmail(admin.email);
    return await this.accessControlService.getUsersForRole(adminUser.role);
  }

  @Get('users/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get user by ID with role permission check (Admin only)' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Permission denied to view this user' })
  async getUserById(
    @Param('id') id: string,
    @CurrentUser() admin: any,
  ): Promise<User | null> {
    const adminUser = await this.accessControlService.findUserByEmail(admin.email);
    const targetUser = await this.accessControlService.getUserById(id);
    
    if (!targetUser) {
      return null;
    }
    
    // Check if admin can manage this user
    if (!this.accessControlService.canManageUser(adminUser.role, targetUser.role)) {
      throw new Error('You do not have permission to view this user');
    }
    
    return targetUser;
  }

  @Put('users/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update user with role permission check (Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Permission denied to update this user' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() admin: any,
  ): Promise<User> {
    const adminUser = await this.accessControlService.findUserByEmail(admin.email);
    return await this.accessControlService.updateUserWithRoleCheck(
      id, 
      updateUserDto, 
      admin.email, 
      adminUser.role
    );
  }

  @Put('users/:id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update user status with role permission check (Admin only)' })
  @ApiResponse({ status: 200, description: 'User status updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Permission denied to update this user' })
  async updateUserStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateUserStatusDto,
    @CurrentUser() admin: any,
  ): Promise<User> {
    const adminUser = await this.accessControlService.findUserByEmail(admin.email);
    const targetUser = await this.accessControlService.getUserById(id);
    
    if (!targetUser) {
      throw new Error('User not found');
    }
    
    // Check if admin can manage this user
    if (!this.accessControlService.canManageUser(adminUser.role, targetUser.role)) {
      throw new Error('You do not have permission to update this user');
    }
    
    return await this.accessControlService.updateUserStatus(id, updateStatusDto);
  }

  @Delete('users/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user with role permission check (Admin only)' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Permission denied to delete this user' })
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser() admin: any,
  ): Promise<void> {
    const adminUser = await this.accessControlService.findUserByEmail(admin.email);
    await this.accessControlService.deleteUserWithRoleCheck(id, adminUser.role);
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get access control statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Access control statistics' })
  async getAccessStats() {
    return await this.accessControlService.getAccessStats();
  }

  // Super Admin only endpoints
  @Get('admin-users')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all admin users (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all admin users' })
  @ApiResponse({ status: 403, description: 'Only super admins can access this endpoint' })
  async getAdminUsers(): Promise<User[]> {
    const allUsers = await this.accessControlService.getAllUsers();
    return allUsers.filter(user => 
      user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN
    );
  }

  @Put('admin-users/:id/promote')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Promote user to admin role (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'User promoted to admin successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Only super admins can promote users to admin' })
  async promoteToAdmin(
    @Param('id') id: string,
    @CurrentUser() superAdmin: any,
  ): Promise<User> {
    const targetUser = await this.accessControlService.getUserById(id);
    if (!targetUser) {
      throw new Error('User not found');
    }

    // Prevent promoting to super admin role through this endpoint
    if (targetUser.role === UserRole.SUPER_ADMIN) {
      throw new Error('Cannot modify super admin users');
    }

    return await this.accessControlService.updateUser(id, { role: UserRole.ADMIN });
  }

  @Put('admin-users/:id/demote')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Demote admin to user role (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Admin demoted to user successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Only super admins can demote admins' })
  async demoteAdmin(
    @Param('id') id: string,
    @CurrentUser() superAdmin: any,
  ): Promise<User> {
    const targetUser = await this.accessControlService.getUserById(id);
    if (!targetUser) {
      throw new Error('User not found');
    }

    // Prevent demoting super admin role through this endpoint
    if (targetUser.role === UserRole.SUPER_ADMIN) {
      throw new Error('Cannot modify super admin users');
    }

    // Only allow demoting admin users
    if (targetUser.role !== UserRole.ADMIN) {
      throw new Error('User is not an admin');
    }

    return await this.accessControlService.updateUser(id, { role: UserRole.USER });
  }
}
