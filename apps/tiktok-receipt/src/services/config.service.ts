import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AppConfig {
    aws: {
        region: string;
        accessKeyId: string;
        secretAccessKey: string;
        s3: {
            bucketName: string;
        };
    };
    business: {
        companyName: string;
        companyAddress: string;
        companyTin: string;
        vatRate: number;
        currency: string;
    };
    pdf: {
        timeout: number;
        format: string;
    };
    environment: {
        stage: string;
    };
}

@Injectable()
export class TiktokReceiptConfigService {
    private readonly config: AppConfig;

    constructor(private readonly configService: ConfigService) {
        this.config = this.loadConfiguration();
    }

    private loadConfiguration(): AppConfig {
        return {
            aws: {
                region: this.configService.get<string>('aws.region') || 
                       process.env.AWS_REGION || 
                       'ap-southeast-1',
                accessKeyId: this.configService.get<string>('aws.accessKeyId') || 
                           process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: this.configService.get<string>('aws.secretAccessKey') || 
                               process.env.AWS_SECRET_ACCESS_KEY || '',
                s3: {
                    bucketName: this.configService.get<string>('aws.s3.bucketName') || 
                               process.env.AWS_S3_BUCKET_NAME || 
                               'gdec-orderhub-invoices'
                }
            },
            business: {
                companyName: this.configService.get<string>('business.companyName') || 
                           'Great Deals E-Commerce Corp',
                companyAddress: this.configService.get<string>('business.companyAddress') || 
                              '2/F Bookman Building, 373 Quezon Avenue, Barangay Lourdes Quezon City National Capital Region Philippines 1114',
                companyTin: this.configService.get<string>('business.companyTin') || 
                          '009-717-682-000',
                vatRate: this.configService.get<number>('business.vatRate') || 0.12,
                currency: this.configService.get<string>('business.currency') || 'PHP'
            },
            pdf: {
                timeout: this.configService.get<number>('pdf.timeout') || 30000,
                format: this.configService.get<string>('pdf.format') || 'A4'
            },
            environment: {
                stage: process.env.NODE_ENV || 'development'
            }
        };
    }

    getConfig(): AppConfig {
        return this.config;
    }

    getAwsConfig() {
        return this.config.aws;
    }

    getBusinessConfig() {
        return this.config.business;
    }

    getPdfConfig() {
        return this.config.pdf;
    }

    getEnvironmentConfig() {
        return this.config.environment;
    }
}
