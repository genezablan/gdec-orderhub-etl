import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as pug from 'pug';
import * as path from 'path';
import * as fs from 'fs';
import { ReceiptDto } from '@app/contracts/tiktok-transformer/dto/';

@Injectable()
export class ReceiptService {
    renderReceiptHtml(data: pug.Options & pug.LocalsObject): string {
        console.log('__dirname:', __dirname);
        const templatePath = path.join(
            __dirname,
            'templates',
            '/b2c-sales-invoice/receipt.pug'
        );
        return pug.renderFile(templatePath, data);
    }

    async generatePdf(data: ReceiptDto, outputPath: string): Promise<void> {
        const html = this.renderReceiptHtml(data);
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        await page.pdf({ path: outputPath, format: 'A4' });
        await browser.close();
    }
}
