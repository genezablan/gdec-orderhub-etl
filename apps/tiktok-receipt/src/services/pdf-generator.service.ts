import { Injectable, OnModuleDestroy } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as pug from 'pug';
import * as path from 'path';
import * as fs from 'fs';
import { LoggingService } from '@app/logging';
import { SalesInvoiceDto } from '@app/contracts/database-orderhub/sales_invoice.dto';

@Injectable()
export class PdfGeneratorService implements OnModuleDestroy {
    private browser: puppeteer.Browser | null = null;
    private readonly browserConfig = {
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-extensions',
            '--no-first-run',
            '--disable-default-apps',
            '--hide-scrollbars',
            '--mute-audio'
        ],
        headless: true
    };

    constructor(private readonly logger: LoggingService) {}

    async onModuleDestroy() {
        if (this.browser) {
            await this.browser.close();
            this.logger.log('PDF Generator browser closed', 'PdfGeneratorService');
        }
    }

    private async getBrowser(): Promise<puppeteer.Browser> {
        if (!this.browser || !this.browser.connected) {
            this.logger.log('Initializing new Puppeteer browser', 'PdfGeneratorService');
            this.browser = await puppeteer.launch(this.browserConfig);
        }
        return this.browser;
    }

    renderReceiptHtml(data: SalesInvoiceDto): string {
        try {
            this.logger.log(`Current __dirname: ${__dirname}`, 'PdfGeneratorService');
            
            // Try the expected path first
            let templatePath = path.join(
                __dirname,
                '..',
                'templates',
                'b2c-sales-invoice',
                'receipt.pug'
            );
            
            this.logger.log(`Looking for template at: ${templatePath}`, 'PdfGeneratorService');
            this.logger.log(`Template path resolved to: ${path.resolve(templatePath)}`, 'PdfGeneratorService');
            
            if (!fs.existsSync(templatePath)) {
                // Try alternative path - absolute path to dist folder
                templatePath = path.join(
                    process.cwd(),
                    'dist',
                    'apps',
                    'tiktok-receipt',
                    'templates',
                    'b2c-sales-invoice',
                    'receipt.pug'
                );
                
                this.logger.log(`Trying alternative template path: ${templatePath}`, 'PdfGeneratorService');
                
                if (!fs.existsSync(templatePath)) {
                    throw new Error(`Template not found at expected path or alternative path: ${templatePath}`);
                }
            }

            this.logger.log('Template found, rendering with sales invoice data...', 'PdfGeneratorService');
            this.logger.log(`Sales invoice data structure: ${JSON.stringify(data, null, 2)}`, 'PdfGeneratorService');
            
            // Transform SalesInvoiceDto to template-compatible structure
            // The template expects 'packages' array at the root level
            const templateData = {
                packages: [{
                    // Account/Company info - use stored data only
                    account_name: data.accountDetails?.companyName,
                    account_full_address: data.accountDetails?.companyAddress,
                    account_tax_identification_number: data.accountDetails?.companyTin,
                    
                    // Customer billing info - use stored data only
                    billing_address: data.billingAddress,
                    
                    // Customer shipping info - use stored data only
                    shipping_address: data.shippingAddress,
                    
                    // Invoice metadata
                    sequence_number: data.sequenceNumber,
                    page_number: data.pageNumber,
                    total_pages: data.totalPages,
                    invoice_printed_date: data.invoicePrintedDate 
                        ? new Date(data.invoicePrintedDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long', 
                            day: '2-digit',
                        })
                        : undefined,
                    order_number: data.orderNumber,
                    payment_method: data.paymentMethod,
                    
                    // Line items
                    items: data.lineItems,
                    
                    // Financial totals - use stored data only
                    vatable_sales: data.vatableSales ? parseFloat(data.vatableSales) : undefined,
                    vat_exempt_sales: data.vatExemptSales ? parseFloat(data.vatExemptSales) : undefined,
                    vat_zero_rated_sales: data.vatZeroRatedSales ? parseFloat(data.vatZeroRatedSales) : undefined,
                    subtotal_net: data.subtotalNet ? parseFloat(data.subtotalNet) : undefined,
                    total_discount: data.totalDiscount ? parseFloat(data.totalDiscount) : undefined,
                    vat_amount: data.vatAmount ? parseFloat(data.vatAmount) : undefined,
                    amount_due: data.amountDue ? parseFloat(data.amountDue) : undefined
                }],
                document_type: 'SALES INVOICE'
            };
            
            this.logger.log(`Template data structure: ${JSON.stringify(templateData, null, 2)}`, 'PdfGeneratorService');
            
            // Log specifically the billing address structure that the template will use
            this.logger.log('=== TEMPLATE BILLING ADDRESS DETAILS ===', 'PdfGeneratorService');
            this.logger.log(`billing_address.full_name: ${templateData.packages[0].billing_address?.full_name}`, 'PdfGeneratorService');
            this.logger.log(`billing_address.full_address: ${templateData.packages[0].billing_address?.full_address}`, 'PdfGeneratorService');
            this.logger.log(`billing_address.tax_identification_number: ${templateData.packages[0].billing_address?.tax_identification_number}`, 'PdfGeneratorService');
            this.logger.log('=== END TEMPLATE BILLING ADDRESS DETAILS ===', 'PdfGeneratorService');
            
            return pug.renderFile(templatePath, templateData);
        } catch (error) {
            this.logger.error(`Failed to render receipt HTML: ${error.message}`, error, 'PdfGeneratorService');
            throw error;
        }
    }

    async generatePdf(data: SalesInvoiceDto, outputPath: string): Promise<void> {
        try {
            // Ensure output directory exists
            const dir = path.dirname(outputPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const html = this.renderReceiptHtml(data);
            const browser = await this.getBrowser();
            const page = await browser.newPage();
            
            await page.setContent(html, { 
                waitUntil: 'networkidle0',
                timeout: 30000 
            });
            
            await page.pdf({ 
                path: outputPath, 
                format: 'A4',
                printBackground: true 
            });
            
            await page.close();
            this.logger.log(`PDF generated successfully: ${outputPath}`, 'PdfGeneratorService');
        } catch (error) {
            this.logger.error('Failed to generate PDF', error, 'PdfGeneratorService');
            throw error;
        }
    }

    async generatePdfBuffer(data: SalesInvoiceDto): Promise<Buffer> {
        try {
            // Create a deep copy to prevent mutation of the original data object
            const dataCopy = JSON.parse(JSON.stringify(data));
            this.logger.log('Generating PDF buffer with data...', 'PdfGeneratorService');
            this.logger.log(`Data keys: ${Object.keys(dataCopy)}`, 'PdfGeneratorService');
            
            const html = this.renderReceiptHtml(dataCopy);
            this.logger.log('HTML rendered successfully, creating PDF...', 'PdfGeneratorService');
            
            const browser = await this.getBrowser();
            const page = await browser.newPage();
            
            await page.setContent(html, { 
                waitUntil: 'networkidle0',
                timeout: 30000 
            });
            
            const pdfData = await page.pdf({ 
                format: 'A4',
                printBackground: true 
            });
            
            await page.close();
            this.logger.log('PDF buffer generated successfully', 'PdfGeneratorService');
            
            return Buffer.from(pdfData);
        } catch (error) {
            this.logger.error(`Failed to generate PDF buffer: ${error.message}`, error, 'PdfGeneratorService');
            throw error;
        }
    }
}
