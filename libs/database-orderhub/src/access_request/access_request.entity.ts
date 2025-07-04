import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AccessStatus } from '../enums/access-control.enum';
import { User } from '../user/user.entity';

@Entity('access_requests')
@Index(['email'], { unique: true })
export class AccessRequest {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'email', type: 'varchar', unique: true })
  email: string;

  @Column({ 
    name: 'status',
    type: 'enum', 
    enum: AccessStatus, 
    default: AccessStatus.PENDING 
  })
  status: AccessStatus;

  @Column({ name: 'admin_notes', type: 'text', nullable: true })
  adminNotes?: string;

  @Column({ name: 'requested_role', type: 'varchar', nullable: true })
  requestedRole?: string;

  // Who processed this request
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'processed_by_user_id' })
  processedByUser?: User;

  @Column({ name: 'processed_by', type: 'varchar', nullable: true })
  processedBy?: string;

  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  processedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Virtual getter for display name
  get displayName(): string {
    return this.email;
  }

  // Check if request is still pending
  get isPending(): boolean {
    return this.status === AccessStatus.PENDING;
  }
}
