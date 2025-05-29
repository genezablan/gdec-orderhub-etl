import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as pug from 'pug';
import * as path from 'path';
import * as fs from 'fs';
import { ReceiptDto } from '@app/contracts/tiktok-transformer/dto/';
import { TiktokOrderDto } from '@app/contracts/database-orderhub/tiktok_order.dto';
import { TiktokOrderItemDto } from '@app/contracts/database-orderhub/tiktok_order_item.dto';

@Injectable()
export class TiktokReceiptService {
    constructor() {}
    getHello(): string {
        return 'Hello World!';
    }
    
    /**
     * Rounds a number up to two decimal places.
     * @param value The number to round up.
     * @returns The rounded number.
     */
    roundUpToTwoDecimals(value: number): number {
        return Math.ceil(value * 100) / 100;
    }

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
        // Ensure output directory exists
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const html = this.renderReceiptHtml(data);
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        await page.pdf({ path: outputPath, format: 'A4' });
        await browser.close();
    }

    mapOrderWithItemsToReceiptDto(orderWithItems: TiktokOrderDto , sequenceNumber: string): ReceiptDto {
        const items = Array.isArray(orderWithItems.items)
            ? orderWithItems.items.map((item: TiktokOrderItemDto) => ({
                  shop_sku: item.sellerSku ?? '',
                  variation_sku: item.skuId ?? '',
                  item_name: item.productName ?? '',
                  quantity:
                      typeof item.quantity === 'number' ? item.quantity : 1,
                  item_price: item.originalPrice
                      ? Number(item.originalPrice)
                      : 0,
                  store_discount:
                      (item.sellerDiscount ? Number(item.sellerDiscount) : 0) +
                      (item.platformDiscount
                          ? Number(item.platformDiscount)
                          : 0),
                  total_actual_price:
                        this.roundUpToTwoDecimals(
                            (Number(item.originalPrice ?? 0) - (Number(item.sellerDiscount ?? 0) + Number(item.platformDiscount ?? 0)))
                            * (typeof item.quantity === 'number' ? item.quantity : 1)
                        )
              }))
            : [];
        const amount_due =
            (orderWithItems.originalShippingFee
                ? Number(orderWithItems.originalShippingFee)
                : 0) +
            (orderWithItems.originalTotalProductPrice
                ? Number(orderWithItems.originalTotalProductPrice)
                : 0) -
            (orderWithItems.platformDiscount
                ? Number(orderWithItems.platformDiscount)
                : 0) -
            (orderWithItems.sellerDiscount
                ? Number(orderWithItems.sellerDiscount)
                : 0) -
            (orderWithItems.shippingFeeCofundedDiscount
                ? Number(orderWithItems.shippingFeeCofundedDiscount)
                : 0) -
            (orderWithItems.shippingFeePlatformDiscount
                ? Number(orderWithItems.shippingFeePlatformDiscount)
                : 0) -
            (orderWithItems.shippingFeeSellerDiscount
                ? Number(orderWithItems.shippingFeeSellerDiscount)
                : 0);
        const vatable_sales = Math.round((amount_due / 1.12) * 100) / 100;
        const total_discount = 0;
        const subtotal_net = vatable_sales;
        const vat_amount = Math.round(vatable_sales * 0.12 * 100) / 100;

        return {
            packages: [
                {
                    sequence_number: sequenceNumber,
                    page_number: 1,
                    total_pages: 1,
                    billing_address: {
                        full_name: orderWithItems.name ?? '',
                        address_line1: orderWithItems.addressDetail ?? '',
                        address_line2: '',
                        city: orderWithItems.municipality ?? '',
                        state: orderWithItems.region ?? '',
                        postal_code: orderWithItems.postalCode ?? '',
                        country: orderWithItems.country ?? '',
                        full_address: orderWithItems.fullAddress ?? '',
                        tax_identification_number: orderWithItems?.tin ?? ''
                    },
                    shipping_address: {
                        full_name: orderWithItems.name ?? '',
                        address_line1: orderWithItems.addressDetail ?? '',
                        address_line2: '',
                        city: orderWithItems.municipality ?? '',
                        state: orderWithItems.region ?? '',
                        postal_code: orderWithItems.postalCode ?? '',
                        country: orderWithItems.country ?? '',
                        full_address: orderWithItems.fullAddress ?? '',
                    },
                    items,
                    account_name: 'Great Deals E-Commerce Corp',
                    account_full_address:
                        '2/F Bookman Building, 373 Quezon Avenue, Barangay Lourdes Quezon City National Capital Region Philippines 1114',
                    account_tax_identification_number: '009-717-682-000',
                    invoice_printed_date: new Date().toLocaleDateString(
                        'en-US',
                        {
                            year: 'numeric',
                            month: 'long',
                            day: '2-digit',
                        }
                    ),
                    order_number: orderWithItems.orderId ?? '',
                    payment_method: orderWithItems.paymentMethodName ?? '',
                    vatable_sales,
                    vat_exempt_sales: 0,
                    vat_zero_rated_sales: 0,
                    total_discount,
                    subtotal_net,
                    vat_amount,
                    amount_due,
                },
            ],
        };
    }
}
