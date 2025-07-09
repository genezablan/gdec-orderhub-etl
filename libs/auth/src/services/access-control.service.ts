import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { User, AccessRequest, UserService, AccessRequestService, UserRole, UserStatus, AccessStatus } from '@app/database-orderhub';
import { 
  CreateAccessRequestDto, 
  ProcessAccessRequestDto, 
  CreateUserDto, 
  UpdateUserDto, 
  UpdateUserStatusDto 
} from '../dto/access-control.dto';

export interface AccessCheckResult {
  hasAccess: boolean;
  user?: User;
  accessRequest?: AccessRequest;
  message: string;
}

@Injectable()
export class AccessControlService {
  constructor(
    private readonly userService: UserService,
    private readonly accessRequestService: AccessRequestService,
  ) {}

  /**
   * Check if an email has access to the application
   */
  async checkAccess(email: string): Promise<AccessCheckResult> {
    // First check if user exists and has access
    const user = await this.userService.findByEmail(email);
    
    if (user) {
      if (user.canAccess) {
        return {
          hasAccess: true,
          user,
          message: 'User has active access'
        };
      } else {
        return {
          hasAccess: false,
          user,
          message: `User exists but access is ${user.status === UserStatus.ACTIVE ? 'pending approval' : user.status}`
        };
      }
    }

    // Check if there's a pending access request
    const accessRequest = await this.accessRequestService.findByEmail(email);

    if (accessRequest) {
      return {
        hasAccess: false,
        accessRequest,
        message: `Access request is ${accessRequest.status}`
      };
    }

    // No user and no access request
    return {
      hasAccess: false,
      message: 'No access. User can request access.'
    };
  }

  /**
   * Create a new access request
   */
  async requestAccess(createAccessRequestDto: CreateAccessRequestDto): Promise<AccessRequest> {
    const { email } = createAccessRequestDto;

    // Check if user already exists
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User already exists in the system');
    }

    // Check if there's already a pending request
    const existingRequest = await this.accessRequestService.findByEmail(email);
    if (existingRequest) {
      if (existingRequest.status === AccessStatus.PENDING) {
        throw new ConflictException('Access request already exists and is pending');
      } else if (existingRequest.status === AccessStatus.REJECTED) {
        // Update existing rejected request to pending
        existingRequest.status = AccessStatus.PENDING;
        existingRequest.createdAt = new Date();
        existingRequest.processedAt = undefined;
        existingRequest.processedBy = undefined;
        existingRequest.adminNotes = undefined;
        return await this.accessRequestService.update(existingRequest.id, existingRequest);
      }
    }

    // Create new access request
    const accessRequest = await this.accessRequestService.create({
      email,
      status: AccessStatus.PENDING,
    });

    return accessRequest;
  }

  /**
   * Get all pending access requests
   */
  async getPendingAccessRequests(): Promise<AccessRequest[]> {
    return await this.accessRequestService.findPending();
  }

  /**
   * Get all access requests
   */
  async getAllAccessRequests(): Promise<AccessRequest[]> {
    return await this.accessRequestService.findAll();
  }

  /**
   * Process an access request (approve/reject)
   */
  async processAccessRequest(
    requestId: string, 
    processAccessRequestDto: ProcessAccessRequestDto,
    adminEmail: string
  ): Promise<AccessRequest> {
    const { status, adminNotes, assignedRole } = processAccessRequestDto;

    const accessRequest = await this.accessRequestService.findById(requestId);
    if (!accessRequest) {
      throw new NotFoundException('Access request not found');
    }

    if (accessRequest.status !== AccessStatus.PENDING) {
      throw new BadRequestException('Access request has already been processed');
    }

    // Update the access request
    accessRequest.status = status;
    accessRequest.adminNotes = adminNotes;
    accessRequest.processedBy = adminEmail;
    accessRequest.processedAt = new Date();

    const savedRequest = await this.accessRequestService.update(requestId, accessRequest);

    // If approved, create user account
    if (status === AccessStatus.APPROVED) {
      const newUser = await this.userService.create({
        email: accessRequest.email,
        role: assignedRole || UserRole.USER,
        status: UserStatus.ACTIVE,
        approvedBy: adminEmail,
        approvedAt: new Date(),
      });
    }

    return savedRequest;
  }

  /**
   * Create a new user manually (admin only)
   */
  async createUser(createUserDto: CreateUserDto, adminEmail: string): Promise<User> {
    const { email, role = UserRole.USER, firstName, lastName, department, jobTitle } = createUserDto;

    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const user = await this.userService.create({
      email,
      role,
      status: UserStatus.ACTIVE,
      firstName,
      lastName,
      department,
      jobTitle,
      approvedBy: adminEmail,
      approvedAt: new Date(),
    });

    return user;
  }

  /**
   * Get all users
   */
  async getAllUsers(): Promise<User[]> {
    return await this.userService.findAll();
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    return await this.userService.findById(id);
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return await this.userService.findByEmail(email);
  }

  /**
   * Find user by email (throws if not found)
   */
  async findUserByEmail(email: string): Promise<User> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * Update user
   */
  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return await this.userService.update(id, updateUserDto);
  }

  /**
   * Update user status
   */
  async updateUserStatus(id: string, updateUserStatusDto: UpdateUserStatusDto): Promise<User> {
    const user = await this.userService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return await this.userService.update(id, {
      status: updateUserStatusDto.status,
      // Add any additional fields if needed
    });
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<void> {
    const user = await this.userService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    await this.userService.delete(id);
  }

  /**
   * Get access statistics
   */
  async getAccessStats(): Promise<{
    users: { total: number; active: number; pending: number; inactive: number; };
    requests: { total: number; pending: number; approved: number; rejected: number; };
  }> {
    const [userStats, requestStats, allUsers] = await Promise.all([
      this.userService.countByStatus(),
      this.accessRequestService.countByStatus(),
      this.userService.findAll() // Get all users to count by role
    ]);

    const pendingUsers = allUsers.filter(user => user.role === UserRole.PENDING).length;

    return {
      users: {
        total: Object.values(userStats).reduce((sum, count) => sum + count, 0),
        active: userStats[UserStatus.ACTIVE] || 0,
        pending: pendingUsers,
        inactive: userStats[UserStatus.INACTIVE] || 0,
      },
      requests: {
        total: Object.values(requestStats).reduce((sum, count) => sum + count, 0),
        pending: requestStats[AccessStatus.PENDING] || 0,
        approved: requestStats[AccessStatus.APPROVED] || 0,
        rejected: requestStats[AccessStatus.REJECTED] || 0,
      },
    };
  }

  /**
   * Check if a Cognito user ID has access to the application
   * This is used when we have an access token but no email
   */
  async checkAccessByCognitoId(cognitoUserId: string): Promise<AccessCheckResult> {
    // First try to find user by cognito_user_id
    const users = await this.userService.findAll();
    const user = users.find(u => u.cognitoUserId === cognitoUserId);
    
    if (user) {
      if (user.canAccess) {
        return {
          hasAccess: true,
          user,
          message: 'User has active access'
        };
      } else {
        return {
          hasAccess: false,
          user,
          message: `User exists but access is ${user.status === UserStatus.ACTIVE ? 'pending approval' : user.status}`
        };
      }
    }

    // No user found with this Cognito ID
    return {
      hasAccess: false,
      message: 'No access found. User needs to request access with their email address.'
    };
  }

  /**
   * Check if user can manage other users based on role hierarchy
   * Super Admin: Can manage all users (admins and regular users)
   * Admin: Can only manage regular users (not other admins or super admins)
   * User: Cannot manage any users
   */
  canManageUser(managerRole: UserRole, targetRole: UserRole): boolean {
    // Super admin can manage everyone
    if (managerRole === UserRole.SUPER_ADMIN) {
      return true;
    }
    
    // Admin can only manage regular users (not other admins or super admins)
    if (managerRole === UserRole.ADMIN) {
      return targetRole === UserRole.USER || targetRole === UserRole.PENDING;
    }
    
    // Regular users and pending users cannot manage anyone
    return false;
  }

  /**
   * Get users that the current user can manage based on their role
   */
  async getUsersForRole(userRole: UserRole): Promise<User[]> {
    const allUsers = await this.userService.findAll();
    
    // Super admin can see all users
    if (userRole === UserRole.SUPER_ADMIN) {
      return allUsers;
    }
    
    // Admin can only see regular users and pending users
    if (userRole === UserRole.ADMIN) {
      return allUsers.filter(user => 
        user.role === UserRole.USER || user.role === UserRole.PENDING
      );
    }
    
    // Regular users cannot see any user management data
    return [];
  }

  /**
   * Check if a user can create another user with the specified role
   */
  canCreateUserWithRole(creatorRole: UserRole, targetRole: UserRole): boolean {
    // Super admin can create any role except another super admin (for security)
    if (creatorRole === UserRole.SUPER_ADMIN) {
      return targetRole !== UserRole.SUPER_ADMIN;
    }
    
    // Admin can only create regular users
    if (creatorRole === UserRole.ADMIN) {
      return targetRole === UserRole.USER;
    }
    
    // Regular users cannot create any users
    return false;
  }

  /**
   * Get maximum role that a user can assign to others
   */
  getMaxAssignableRole(userRole: UserRole): UserRole {
    if (userRole === UserRole.SUPER_ADMIN) {
      return UserRole.ADMIN; // Super admin can assign up to admin role
    }
    
    if (userRole === UserRole.ADMIN) {
      return UserRole.USER; // Admin can only assign user role
    }
    
    return UserRole.PENDING; // Regular users cannot assign roles
  }

  /**
   * Enhanced create user method with role hierarchy validation
   */
  async createUserWithRoleCheck(
    createUserDto: CreateUserDto, 
    adminEmail: string,
    adminRole: UserRole
  ): Promise<User> {
    const { role = UserRole.USER } = createUserDto;
    
    // Check if admin can create user with this role
    if (!this.canCreateUserWithRole(adminRole, role)) {
      throw new BadRequestException(
        `You do not have permission to create users with role: ${role}`
      );
    }
    
    return this.createUser(createUserDto, adminEmail);
  }

  /**
   * Enhanced update user method with role hierarchy validation
   */
  async updateUserWithRoleCheck(
    id: string, 
    updateUserDto: UpdateUserDto,
    managerEmail: string,
    managerRole: UserRole
  ): Promise<User> {
    const targetUser = await this.userService.findById(id);
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Check if manager can manage this user
    if (!this.canManageUser(managerRole, targetUser.role)) {
      throw new BadRequestException(
        'You do not have permission to manage this user'
      );
    }

    // If updating role, check if manager can assign the new role
    if (updateUserDto.role && !this.canCreateUserWithRole(managerRole, updateUserDto.role)) {
      throw new BadRequestException(
        `You do not have permission to assign role: ${updateUserDto.role}`
      );
    }

    return this.updateUser(id, updateUserDto);
  }

  /**
   * Enhanced delete user method with role hierarchy validation
   */
  async deleteUserWithRoleCheck(
    id: string,
    managerRole: UserRole
  ): Promise<void> {
    const targetUser = await this.userService.findById(id);
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Check if manager can manage this user
    if (!this.canManageUser(managerRole, targetUser.role)) {
      throw new BadRequestException(
        'You do not have permission to delete this user'
      );
    }

    await this.deleteUser(id);
  }
}
