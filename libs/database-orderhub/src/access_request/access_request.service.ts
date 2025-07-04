import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccessRequest } from './access_request.entity';
import { AccessStatus } from '../enums/access-control.enum';

@Injectable()
export class AccessRequestService {
    private readonly logger = new Logger(AccessRequestService.name);

    constructor(
        @InjectRepository(AccessRequest, 'orderhubConnection')
        private readonly repo: Repository<AccessRequest>
    ) {}

    /**
     * Find access request by email
     */
    async findByEmail(email: string): Promise<AccessRequest | null> {
        try {
            return await this.repo.findOne({ where: { email } });
        } catch (error) {
            this.logger.error(`Error finding access request by email: ${email}`, error);
            throw error;
        }
    }

    /**
     * Find access request by ID
     */
    async findById(id: string): Promise<AccessRequest | null> {
        try {
            return await this.repo.findOne({ 
                where: { id },
                relations: ['processedByUser']
            });
        } catch (error) {
            this.logger.error(`Error finding access request by ID: ${id}`, error);
            throw error;
        }
    }

    /**
     * Create a new access request
     */
    async create(requestData: Partial<AccessRequest>): Promise<AccessRequest> {
        try {
            const accessRequest = this.repo.create(requestData);
            return await this.repo.save(accessRequest);
        } catch (error) {
            this.logger.error('Error creating access request', error);
            throw error;
        }
    }

    /**
     * Update access request
     */
    async update(id: string, requestData: Partial<AccessRequest>): Promise<AccessRequest> {
        try {
            await this.repo.update(id, requestData);
            const updatedRequest = await this.findById(id);
            if (!updatedRequest) {
                throw new Error('Access request not found after update');
            }
            return updatedRequest;
        } catch (error) {
            this.logger.error(`Error updating access request: ${id}`, error);
            throw error;
        }
    }

    /**
     * Find all pending access requests
     */
    async findPending(): Promise<AccessRequest[]> {
        try {
            return await this.repo.find({
                where: { status: AccessStatus.PENDING },
                order: { createdAt: 'ASC' }
            });
        } catch (error) {
            this.logger.error('Error finding pending access requests', error);
            throw error;
        }
    }

    /**
     * Find all access requests
     */
    async findAll(): Promise<AccessRequest[]> {
        try {
            return await this.repo.find({
                order: { createdAt: 'DESC' },
                relations: ['processedByUser']
            });
        } catch (error) {
            this.logger.error('Error finding all access requests', error);
            throw error;
        }
    }

    /**
     * Count requests by status
     */
    async countByStatus(): Promise<{ [key: string]: number }> {
        try {
            const result = await this.repo
                .createQueryBuilder('request')
                .select('request.status', 'status')
                .addSelect('COUNT(*)', 'count')
                .groupBy('request.status')
                .getRawMany();

            return result.reduce((acc, item) => {
                acc[item.status] = parseInt(item.count);
                return acc;
            }, {});
        } catch (error) {
            this.logger.error('Error counting access requests by status', error);
            throw error;
        }
    }

    /**
     * Delete access request
     */
    async delete(id: string): Promise<void> {
        try {
            await this.repo.delete(id);
        } catch (error) {
            this.logger.error(`Error deleting access request: ${id}`, error);
            throw error;
        }
    }
}
