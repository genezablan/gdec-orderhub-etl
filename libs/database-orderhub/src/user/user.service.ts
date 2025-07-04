import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);

    constructor(
        @InjectRepository(User, 'orderhubConnection')
        private readonly repo: Repository<User>
    ) {}

    /**
     * Find user by email
     */
    async findByEmail(email: string): Promise<User | null> {
        try {
            return await this.repo.findOne({ where: { email } });
        } catch (error) {
            this.logger.error(`Error finding user by email: ${email}`, error);
            throw error;
        }
    }

    /**
     * Find user by ID
     */
    async findById(id: string): Promise<User | null> {
        try {
            return await this.repo.findOne({ where: { id } });
        } catch (error) {
            this.logger.error(`Error finding user by ID: ${id}`, error);
            throw error;
        }
    }

    /**
     * Create a new user
     */
    async create(userData: Partial<User>): Promise<User> {
        try {
            const user = this.repo.create(userData);
            return await this.repo.save(user);
        } catch (error) {
            this.logger.error('Error creating user', error);
            throw error;
        }
    }

    /**
     * Update user
     */
    async update(id: string, userData: Partial<User>): Promise<User> {
        try {
            await this.repo.update(id, userData);
            const updatedUser = await this.findById(id);
            if (!updatedUser) {
                throw new Error('User not found after update');
            }
            return updatedUser;
        } catch (error) {
            this.logger.error(`Error updating user: ${id}`, error);
            throw error;
        }
    }

    /**
     * Delete user
     */
    async delete(id: string): Promise<void> {
        try {
            await this.repo.delete(id);
        } catch (error) {
            this.logger.error(`Error deleting user: ${id}`, error);
            throw error;
        }
    }

    /**
     * Find all users
     */
    async findAll(): Promise<User[]> {
        try {
            return await this.repo.find({
                order: { createdAt: 'DESC' }
            });
        } catch (error) {
            this.logger.error('Error finding all users', error);
            throw error;
        }
    }

    /**
     * Count users by status
     */
    async countByStatus(): Promise<{ [key: string]: number }> {
        try {
            const result = await this.repo
                .createQueryBuilder('user')
                .select('user.status', 'status')
                .addSelect('COUNT(*)', 'count')
                .groupBy('user.status')
                .getRawMany();

            return result.reduce((acc, item) => {
                acc[item.status] = parseInt(item.count);
                return acc;
            }, {});
        } catch (error) {
            this.logger.error('Error counting users by status', error);
            throw error;
        }
    }
}
