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
import { UserRole } from '../enums/roles.enum';
import { User, AccessRequest } from '@app/database-orderhub';
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
  }

  // Admin-only endpoints below
  @Get('requests/pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all pending access requests (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of pending access requests' })
  async getPendingAccessRequests(): Promise<AccessRequest[]> {
    return await this.accessControlService.getPendingAccessRequests();
  }

  @Get('requests')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all access requests (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all access requests' })
  async getAllAccessRequests(): Promise<AccessRequest[]> {
    return await this.accessControlService.getAllAccessRequests();
  }

  @Put('requests/:id/process')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
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
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() admin: any,
  ): Promise<User> {
    return await this.accessControlService.createUser(createUserDto, admin.email);
  }

  @Get('users')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all users' })
  async getAllUsers(): Promise<User[]> {
    return await this.accessControlService.getAllUsers();
  }

  @Get('users/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id') id: string): Promise<User | null> {
    return await this.accessControlService.getUserById(id);
  }

  @Put('users/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return await this.accessControlService.updateUser(id, updateUserDto);
  }

  @Put('users/:id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user status (Admin only)' })
  @ApiResponse({ status: 200, description: 'User status updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUserStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateUserStatusDto,
  ): Promise<User> {
    return await this.accessControlService.updateUserStatus(id, updateStatusDto);
  }

  @Delete('users/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('id') id: string): Promise<void> {
    await this.accessControlService.deleteUser(id);
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get access control statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Access control statistics' })
  async getAccessStats() {
    return await this.accessControlService.getAccessStats();
  }
}
