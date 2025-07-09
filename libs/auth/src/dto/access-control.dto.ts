import { IsEmail, IsOptional, IsString, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus, AccessStatus } from '@app/database-orderhub';

// DTOs for Access Requests
export class CreateAccessRequestDto {
  @ApiProperty({ example: 'user@company.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ProcessAccessRequestDto {
  @ApiProperty({ enum: AccessStatus })
  @IsEnum([AccessStatus.APPROVED, AccessStatus.REJECTED])
  @IsNotEmpty()
  status: AccessStatus.APPROVED | AccessStatus.REJECTED;

  @ApiPropertyOptional({ example: 'Approved for IT team access' })
  @IsOptional()
  @IsString()
  adminNotes?: string;

  @ApiPropertyOptional({ enum: UserRole, description: 'Role to assign if approved' })
  @IsOptional()
  @IsEnum(UserRole)
  assignedRole?: UserRole;
}

// DTOs for User Management
export class CreateUserDto {
  @ApiProperty({ example: 'user@company.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ enum: UserRole, default: UserRole.USER })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  @ApiPropertyOptional({ enum: UserStatus, default: UserStatus.ACTIVE })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ example: 'IT Department' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: 'Software Developer' })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional({ example: 'Admin notes about the user' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ example: 'IT Department' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: 'Software Developer' })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional({ example: 'Admin notes about the user' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateUserStatusDto {
  @ApiProperty({ enum: UserStatus })
  @IsEnum(UserStatus)
  @IsNotEmpty()
  status: UserStatus;

  @ApiPropertyOptional({ example: 'Reason for status change' })
  @IsOptional()
  @IsString()
  notes?: string;
}
