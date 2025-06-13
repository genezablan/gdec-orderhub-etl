import { Injectable } from '@nestjs/common';
import { LoggingService } from '@app/logging';

export interface OrderValidationInput {
    orderId: string;
    shopId: string;
}

export interface PackageValidationInput {
    packageId: string;
    shopId: string;
    orderId: string;
}

@Injectable()
export class ValidationService {
    constructor(private readonly logger: LoggingService) {}

    validateOrderInput(input: OrderValidationInput): void {
        const errors: string[] = [];

        if (!input.orderId || typeof input.orderId !== 'string' || input.orderId.trim() === '') {
            errors.push('orderId is required and must be a non-empty string');
        }

        if (!input.shopId || typeof input.shopId !== 'string' || input.shopId.trim() === '') {
            errors.push('shopId is required and must be a non-empty string');
        }

        if (errors.length > 0) {
            const errorMessage = `Invalid order input: ${errors.join(', ')}`;
            this.logger.error(errorMessage, errorMessage, 'ValidationService');
            throw new Error(errorMessage);
        }
    }

    validatePackageInput(input: PackageValidationInput): void {
        const errors: string[] = [];

        if (!input.packageId || typeof input.packageId !== 'string' || input.packageId.trim() === '') {
            errors.push('packageId is required and must be a non-empty string');
        }

        if (!input.shopId || typeof input.shopId !== 'string' || input.shopId.trim() === '') {
            errors.push('shopId is required and must be a non-empty string');
        }

        if (!input.orderId || typeof input.orderId !== 'string' || input.orderId.trim() === '') {
            errors.push('orderId is required and must be a non-empty string');
        }

        if (errors.length > 0) {
            const errorMessage = `Invalid package input: ${errors.join(', ')}`;
            this.logger.error(errorMessage, errorMessage, 'ValidationService');
            throw new Error(errorMessage);
        }
    }

    validateSequenceNumber(sequenceNumber: string): void {
        if (!sequenceNumber || typeof sequenceNumber !== 'string' || sequenceNumber.trim() === '') {
            const errorMessage = 'sequenceNumber is required and must be a non-empty string';
            this.logger.error(errorMessage, errorMessage, 'ValidationService');
            throw new Error(errorMessage);
        }
    }

    validatePdfBuffer(buffer: Buffer): void {
        if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
            const errorMessage = 'PDF buffer is required and must be a non-empty Buffer';
            this.logger.error(errorMessage, errorMessage, 'ValidationService');
            throw new Error(errorMessage);
        }
    }

    validateSalesInvoiceId(salesInvoiceId: string): void {
        if (!salesInvoiceId || typeof salesInvoiceId !== 'string' || salesInvoiceId.trim() === '') {
            const errorMessage = 'salesInvoiceId is required and must be a non-empty string';
            this.logger.error(errorMessage, errorMessage, 'ValidationService');
            throw new Error(errorMessage);
        }
    }
}
