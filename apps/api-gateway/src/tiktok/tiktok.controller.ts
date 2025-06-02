import { Body, Controller, Get, Post, Query, HttpException, HttpStatus, BadRequestException, NotFoundException, InternalServerErrorException, Res, StreamableFile } from '@nestjs/common';
import { Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';
import { TiktokService } from './tiktok.service';
import {
    GetOrdersQueryDto,
    GetOrderDetailsQueryDto,
    GetSupportOrderDetailsQueryDto,
    GetSalesInvoicesQueryDto,
} from '@app/contracts/tiktok-fetcher/dto/';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
@Controller('tiktok')
export class TiktokController {
    private s3Client: S3Client;

    constructor(private readonly tiktokService: TiktokService) {
        // Initialize S3 client for downloading files from S3
        this.s3Client = new S3Client({
            region: process.env.AWS_REGION || 'ap-southeast-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
            },
            forcePathStyle: true
        });
    }

    @Get('orders')
    getOrders(@Query() query: GetOrdersQueryDto) {
        return this.tiktokService.getOrders({
            shop_id: query.shop_id,
        });
    }

    @Get('orders/details')
    getOrderDetails(@Query() query: GetOrderDetailsQueryDto) {
        const orderDetails = this.tiktokService.getOrderDetails({
            shop_id: query.shop_id,
            order_id: query.order_id,
            name: query.name,
            full_address: query.full_address,
            tin: query.tin
        });

        return orderDetails;
    }

    @Get('orders/support-details')
    async getSupportOrderDetails(@Query() query: GetSupportOrderDetailsQueryDto) {
        const result = await this.tiktokService.getSupportOrderDetails({
            shop_id: query.shop_id,
            order_id: query.order_id
        });
        
        return result;
    }

    @Get('orders/sales-invoices')
    async getSalesInvoices(@Query() query: GetSalesInvoicesQueryDto) {
        const result = await this.tiktokService.getSalesInvoices({
            shop_id: query.shop_id,
            order_id: query.order_id
        });
        
        return result;
    }

    @Get('download/invoice')
    async downloadInvoice(@Query('file') filePath: string, @Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
        try {
            if (!filePath) {
                throw new BadRequestException('File path is required');
            }

            // Security check: ensure the file path is pointing to a PDF file
            if (!filePath.toLowerCase().endsWith('.pdf')) {
                throw new BadRequestException('Only PDF files are allowed');
            }

            // Check if it's an S3 URL
            if (filePath.startsWith('https://s3.') || filePath.startsWith('https://') && filePath.includes('.amazonaws.com')) {
                return await this.downloadFromS3(filePath, res);
            } else {
                return await this.downloadFromLocal(filePath, res);
            }
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            console.error('Download error:', error);
            throw new InternalServerErrorException('Failed to download invoice file');
        }
    }

    private async downloadFromS3(s3Url: string, res: Response): Promise<StreamableFile> {
        try {
            // Parse S3 URL to extract bucket and key
            const url = new URL(s3Url);
            const pathParts = url.pathname.split('/');
            const bucketName = pathParts[1]; // First part after the initial /
            const key = pathParts.slice(2).join('/'); // Rest is the key

            console.log(`Downloading from S3: bucket=${bucketName}, key=${key}`);

            // Create GetObject command
            const command = new GetObjectCommand({
                Bucket: bucketName,
                Key: key
            });

            // Get the object from S3
            const response = await this.s3Client.send(command);

            if (!response.Body) {
                throw new NotFoundException('File not found in S3');
            }

            // Extract filename for the download
            const fileName = key.split('/').pop() || 'invoice.pdf';

            // Set response headers
            res.set({
                'Content-Type': response.ContentType || 'application/pdf',
                'Content-Length': response.ContentLength?.toString() || '',
                'Content-Disposition': `attachment; filename="${fileName}"`,
            });

            // Convert S3 response body to a readable stream
            const stream = response.Body as Readable;
            return new StreamableFile(stream);
        } catch (error) {
            console.error('S3 download error:', error);
            if (error.name === 'NoSuchKey' || error.name === 'NoSuchBucket') {
                throw new NotFoundException('Invoice file not found in S3');
            }
            throw new InternalServerErrorException('Failed to download file from S3');
        }
    }

    private async downloadFromLocal(filePath: string, res: Response): Promise<StreamableFile> {
        try {
            // Validate that the file exists
            if (!existsSync(filePath)) {
                throw new NotFoundException('Invoice file not found');
            }

            // Extract filename for the download
            const fileName = filePath.split('/').pop() || 'invoice.pdf';

            // Set response headers
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${fileName}"`,
            });

            // Create and return the file stream
            const file = createReadStream(filePath);
            return new StreamableFile(file);
        } catch (error) {
            console.error('Local file download error:', error);
            throw new InternalServerErrorException('Failed to download local file');
        }
    }

    @Get('shops')
    getShops() {
        return this.tiktokService.getShops();
    }
}
