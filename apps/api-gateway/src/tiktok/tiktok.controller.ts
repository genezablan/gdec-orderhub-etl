import { Body, Controller, Get, Post, Put, Patch, Query, Param, HttpException, HttpStatus, BadRequestException, NotFoundException, InternalServerErrorException, Res, StreamableFile } from '@nestjs/common';
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
import { IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
const pdf2pic = require('pdf2pic');

// DTO for updating unmasked details
export class UpdateUnmaskedDetailsDto {
    @IsString()
    shop_id: string;

    @IsString()
    order_id: string;

    @IsOptional()
    @IsString()
    name_unmasked?: string;

    @IsOptional()
    @IsString()
    address_detail_unmasked?: string;

    @IsOptional()
    @IsString()
    tin?: string;
}

// DTO for billing address
export class BillingAddressDto {
    @IsString()
    fullName: string;

    @IsString()
    fullAddress: string;

    @IsString()
    taxIdentificationNumber: string;
}

// DTO for shipping address
export class ShippingAddressDto {
    @IsOptional()
    @IsString()
    fullName: string;

    @IsOptional()
    @IsString()
    fullAddress: string;
}

// DTO for updating sales invoice
export class UpdateSalesInvoiceDto {
    @ValidateNested()
    @Type(() => BillingAddressDto)
    billingAddress: BillingAddressDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => ShippingAddressDto)
    shippingAddress?: ShippingAddressDto;
}
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
    async downloadInvoice(
        @Query('file') filePath: string,
        @Query('fileType') fileType: string = 'pdf',
        @Res({ passthrough: true }) res: Response,
    ): Promise<StreamableFile> {
        try {
            if (!filePath) {
                throw new BadRequestException('File path is required');
            }

            // Validate fileType parameter
            if (!['pdf', 'jpg', 'jpeg'].includes(fileType.toLowerCase())) {
                throw new BadRequestException('File type must be either pdf, jpg, or jpeg');
            }

            // Security check: ensure the file path is pointing to a PDF file
            if (!filePath.toLowerCase().endsWith('.pdf')) {
                throw new BadRequestException('Only PDF files are allowed');
            }

            // Check if it's an S3 URL
            if (filePath.startsWith('https://s3.') || filePath.startsWith('https://') && filePath.includes('.amazonaws.com')) {
                return await this.downloadFromS3(filePath, res, fileType.toLowerCase());
            } else {
                throw new BadRequestException('Only S3 URLs are supported for invoice downloads');
            }
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            console.error('Download error:', error);
            throw new InternalServerErrorException('Failed to download invoice file');
        }
    }

    private async downloadFromS3(
        s3Url: string, 
        res: Response, 
        fileType: string = 'pdf'
    ): Promise<StreamableFile> {
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

            console.log('S3 response details:', {
                ContentType: response.ContentType,
                ContentLength: response.ContentLength,
                LastModified: response.LastModified,
                ETag: response.ETag
            });

            // Extract sequence number from the original filename (without .pdf extension)
            const originalFileName = key.split('/').pop() || 'invoice.pdf';
            const sequenceNumber = originalFileName.replace('.pdf', '');
            
            // Generate timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5); // Remove milliseconds and format
            
            // If JPG is requested, convert PDF to JPG
            if (fileType === 'jpg' || fileType === 'jpeg') {
                console.log('Converting PDF to JPG format...');
                return await this.convertPdfToJpg(response.Body as Readable, sequenceNumber, timestamp, res);
            }
            
            // Generate customer-friendly filename for PDF
            const fileName = `TikTok_Invoice_${sequenceNumber}_${timestamp}.pdf`;
            
            // Set response headers for PDF
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

    @Get('shops')
    getShops() {
        return this.tiktokService.getShops();
    }

    @Put('orders/unmasked-details')
    async updateUnmaskedDetails(@Body() updateDto: UpdateUnmaskedDetailsDto) {
        try {
            if (!updateDto.shop_id || !updateDto.order_id) {
                throw new BadRequestException('shop_id and order_id are required');
            }

            // Validate that at least one field is provided to update
            if (!updateDto.name_unmasked && !updateDto.address_detail_unmasked && !updateDto.tin) {
                throw new BadRequestException('At least one field (name_unmasked, address_detail_unmasked, or tin) must be provided');
            }

            const result = await this.tiktokService.updateUnmaskedDetails({
                shop_id: updateDto.shop_id,
                order_id: updateDto.order_id,
                name_unmasked: updateDto.name_unmasked,
                address_detail_unmasked: updateDto.address_detail_unmasked,
                tin: updateDto.tin
            });

            return {
                success: true,
                message: 'Unmasked details updated successfully',
                data: result
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            console.error('Update unmasked details error:', error);
            throw new InternalServerErrorException('Failed to update unmasked details');
        }
    }

    @Get('orders/unmasked-details')
    async getUnmaskedDetails(@Query() query: { shop_id: string; order_id: string }) {
        try {
            if (!query.shop_id || !query.order_id) {
                throw new BadRequestException('shop_id and order_id are required');
            }

            const result = await this.tiktokService.getUnmaskedDetails({
                shop_id: query.shop_id,
                order_id: query.order_id
            });

            return result;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            console.error('Get unmasked details error:', error);
            throw new InternalServerErrorException('Failed to retrieve unmasked details');
        }
    }

    @Patch('sales-invoices/:id')
    async updateSalesInvoice(
        @Param('id') id: string,
        @Body() updateData: UpdateSalesInvoiceDto
    ) {
        try {
            console.log(`Updating sales invoice ${id} with data:`, updateData);

            const result = await this.tiktokService.updateSalesInvoice(id, updateData);

            return result;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            console.error(`Failed to update sales invoice ${id}:`, error);
            throw new InternalServerErrorException('Failed to update sales invoice');
        }
    }

    @Post('sales-invoices/:salesInvoiceId/reprint')
    async reprintInvoice(@Param('salesInvoiceId') salesInvoiceId: string) {
        try {
            console.log(`API Gateway: Reprint request for sales invoice: ${salesInvoiceId}`);
            
            const result = await this.tiktokService.reprintInvoice(salesInvoiceId);
            
            return {
                success: true,
                message: 'Invoice reprint request processed successfully',
                data: result
            };
        } catch (error) {
            console.error(`API Gateway: Failed to reprint sales invoice ${salesInvoiceId}:`, error);
            
            if (error instanceof NotFoundException) {
                throw new NotFoundException({
                    success: false,
                    message: `Sales invoice ${salesInvoiceId} not found or cannot be reprinted`,
                    salesInvoiceId
                });
            }
            
            throw new InternalServerErrorException({
                success: false,
                message: 'Failed to process reprint request',
                error: error.message,
                salesInvoiceId
            });
        }
    }

    private async convertPdfToJpg(
        pdfStream: Readable,
        sequenceNumber: string,
        timestamp: string,
        res: Response
    ): Promise<StreamableFile> {
        let tempPdfPath: string | null = null;
        let tempDir: string | null = null;
        
        try {
            console.log('Starting PDF to JPG conversion...');
            
            // Convert stream to buffer
            const chunks: Buffer[] = [];
            for await (const chunk of pdfStream) {
                chunks.push(chunk);
            }
            const pdfBuffer = Buffer.concat(chunks);
            
            console.log(`PDF buffer size: ${pdfBuffer.length} bytes`);
            
            // Validate PDF buffer
            if (pdfBuffer.length === 0) {
                throw new Error('PDF buffer is empty');
            }
            
            // Check if buffer starts with PDF header
            const pdfHeader = pdfBuffer.slice(0, 4).toString();
            if (pdfHeader !== '%PDF') {
                console.error('Invalid PDF header:', pdfHeader);
                throw new Error('Invalid PDF file - missing PDF header');
            }
            
            // Create temporary directory for processing
            tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-convert-'));
            tempPdfPath = path.join(tempDir, `temp-${Date.now()}.pdf`);
            
            console.log(`Writing PDF to temporary file: ${tempPdfPath}`);
            
            // Write PDF buffer to temporary file
            fs.writeFileSync(tempPdfPath, pdfBuffer);
            
            // Verify file was written correctly
            const fileStats = fs.statSync(tempPdfPath);
            console.log(`Temporary PDF file size: ${fileStats.size} bytes`);
            
            if (fileStats.size !== pdfBuffer.length) {
                throw new Error('File write verification failed - size mismatch');
            }
            
            // Use pdf2pic to convert PDF to JPG
            console.log('Starting pdf2pic conversion...');
            
            const convert = pdf2pic.fromPath(tempPdfPath, {
                density: 150,           // DPI (dots per inch) - higher for better quality
                saveFilename: "page",   // Filename prefix for output files
                savePath: tempDir,      // Directory to save converted images
                format: "jpg",          // Output format
                width: 794,             // A4 width in pixels at 96 DPI
                height: 1123,           // A4 height in pixels at 96 DPI
                quality: 75,            // JPEG quality
                gmPath: "/usr/bin/gm"   // Explicitly set GraphicsMagick path
            });
            
            console.log('Converting first page of PDF...');
            
            // Convert first page (most invoices are single page) - use file approach
            const convertResult = await convert(1, { responseType: "image" });
            
            console.log('Conversion result:', {
                hasResult: !!convertResult,
                resultType: typeof convertResult,
                resultKeys: convertResult ? Object.keys(convertResult) : [],
                resultValue: convertResult
            });
            
            if (!convertResult) {
                throw new Error('Failed to convert PDF to JPG - no result returned');
            }
            
            // Check if convertResult has a path or name property
            let imagePath: string | null = null;
            if (typeof convertResult === 'string') {
                imagePath = convertResult;
            } else if (convertResult.path) {
                imagePath = convertResult.path;
            } else if (convertResult.name) {
                imagePath = path.join(tempDir, convertResult.name);
            } else {
                // Try to find the converted file in the temp directory
                const files = fs.readdirSync(tempDir);
                const jpgFiles = files.filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg'));
                if (jpgFiles.length > 0) {
                    imagePath = path.join(tempDir, jpgFiles[0]);
                }
            }
            
            console.log('Image path:', imagePath);
            
            if (!imagePath || !fs.existsSync(imagePath)) {
                // List all files in temp directory for debugging
                const tempFiles = fs.readdirSync(tempDir);
                console.log('Files in temp directory:', tempFiles);
                throw new Error(`Converted JPG file not found. Expected: ${imagePath}, Available files: ${tempFiles.join(', ')}`);
            }
            
            // Read the JPG file as buffer
            const jpgBuffer = fs.readFileSync(imagePath);
            
            if (jpgBuffer.length === 0) {
                throw new Error('Converted JPG file is empty');
            }
            
            console.log(`PDF converted to JPG successfully using pdf2pic. JPG size: ${jpgBuffer.length} bytes`);
            
            // Generate customer-friendly filename for JPG
            const fileName = `TikTok_Invoice_${sequenceNumber}_${timestamp}.jpg`;
            
            // Set response headers for JPG
            res.set({
                'Content-Type': 'image/jpeg',
                'Content-Length': jpgBuffer.length.toString(),
                'Content-Disposition': `attachment; filename="${fileName}"`,
            });
            
            return new StreamableFile(jpgBuffer);
            
        } catch (error) {
            console.error('PDF to JPG conversion error:', error);
            console.error('Error stack:', error.stack);
            
            // Provide more specific error messages
            if (error.message.includes('PDF header')) {
                throw new BadRequestException('Invalid PDF file format');
            } else if (error.message.includes('empty')) {
                throw new BadRequestException('PDF file is empty or corrupted');
            } else {
                throw new InternalServerErrorException(`Failed to convert PDF to JPG: ${error.message}`);
            }
        } finally {
            // Clean up temporary files
            try {
                if (tempPdfPath && fs.existsSync(tempPdfPath)) {
                    console.log(`Cleaning up temporary PDF file: ${tempPdfPath}`);
                    fs.unlinkSync(tempPdfPath);
                }
                if (tempDir && fs.existsSync(tempDir)) {
                    // Remove any remaining files in temp directory
                    const files = fs.readdirSync(tempDir);
                    files.forEach(file => {
                        const filePath = path.join(tempDir!, file);
                        if (fs.existsSync(filePath)) {
                            console.log(`Cleaning up temporary file: ${filePath}`);
                            fs.unlinkSync(filePath);
                        }
                    });
                    fs.rmdirSync(tempDir);
                    console.log(`Cleaned up temporary directory: ${tempDir}`);
                }
            } catch (cleanupError) {
                console.warn('Failed to clean up temporary files:', cleanupError);
            }
        }
    }
}
