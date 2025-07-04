import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { UserRole, UserStatus } from '../enums/access-control.enum';

@Entity('users')
@Index(['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'email', type: 'varchar', unique: true })
  email: string;

  @Column({ name: 'first_name', type: 'varchar', nullable: true })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', nullable: true })
  lastName: string;

  @Column({ 
    name: 'role',
    type: 'enum', 
    enum: UserRole, 
    default: UserRole.PENDING 
  })
  role: UserRole;

  @Column({ 
    name: 'status',
    type: 'enum', 
    enum: UserStatus, 
    default: UserStatus.INACTIVE 
  })
  status: UserStatus;

  @Column({ name: 'cognito_user_id', type: 'varchar', nullable: true })
  cognitoUserId: string;

  @Column({ name: 'department', type: 'varchar', nullable: true })
  department: string;

  @Column({ name: 'job_title', type: 'varchar', nullable: true })
  jobTitle: string;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @Column({ name: 'approved_by', type: 'varchar', nullable: true })
  approvedBy: string;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Virtual getter for full name
  get fullName(): string {
    return [this.firstName, this.lastName].filter(Boolean).join(' ') || this.email;
  }

  // Check if user can access the application
  get canAccess(): boolean {
    return this.role !== UserRole.PENDING && this.status === UserStatus.ACTIVE;
  }

  // Check if user is admin
  get isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }
}
