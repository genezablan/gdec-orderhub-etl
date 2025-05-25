import { Injectable } from '@nestjs/common';
import { RawOrderDetailsDto } from '@app/contracts/tiktok-fetcher/dto/';
import { ReceiptDto } from '@app/contracts/tiktok-transformer/dto/';

@Injectable()
export class ReceiptService {
    transformRawOrderDetails(raw: RawOrderDetailsDto): ReceiptDto[] {
        const parseAmount = (value: string | number | undefined): number => {
            const num =
                typeof value === 'string' ? parseFloat(value) : Number(value);
            return isNaN(num) ? 0 : Math.round(num * 100) / 100;
        };

        // Map each order to a ReceiptDto (with all required fields)
        return raw.orders.map((order, idx) => {
            const billingAddress = {
                full_name: order.recipient_address.name,
                address_line1: order.recipient_address.address_line1,
                address_line2: order.recipient_address.address_line2,
                city: '', // Map if available
                state: '', // Map if available
                postal_code: order.recipient_address.postal_code,
                country: order.recipient_address.region_code,
                full_address: [
                    order.recipient_address.address_line1,
                    order.recipient_address.address_line2,
                    order.recipient_address.address_line3,
                    order.recipient_address.address_line4,
                ]
                    .filter(Boolean)
                    .join(', '),
            };
            const shippingAddress = { ...billingAddress };
            const items = order.line_items.map(item => {
                const item_price = parseAmount(item.original_price);
                const platform_discount = parseAmount(item.platform_discount);
                const seller_discount = parseAmount(item.seller_discount);
                const store_discount = platform_discount + seller_discount;
                return {
                    shop_sku:
                        typeof item.sku_id === 'string' ? item.sku_id : '',
                    variation_sku:
                        typeof item.seller_sku === 'string'
                            ? item.seller_sku
                            : '',
                    item_name:
                        typeof item.product_name === 'string'
                            ? item.product_name
                            : '',
                    quantity: 1,
                    item_price,
                    store_discount,
                    total_actual_price:
                        Math.round((item_price - store_discount) * 100) / 100,
                };
            });
            const total_net_amount =
                Math.round(
                    items.reduce(
                        (sum, item) => sum + item.total_actual_price,
                        0
                    ) * 100
                ) / 100;
            const vatable_sales =
                Math.round((total_net_amount / 1.12) * 100) / 100;
            const vat_amount = Math.round(vatable_sales * 0.12 * 100) / 100;

            return {
                account: raw.shop.tiktok_shop_code,
                platform: order.commerce_platform,
                shop_id: order.user_id,
                platform_order_id: order.id,
                api_version: '',
                buyer_id: 0,
                billing_address: billingAddress,
                shipping_address: shippingAddress,
                items,
                account_name: `Great Deals E-Commerce Corp`,
                account_full_address: '',
                account_tax_identification_number: '',
                invoice_printed_date: '',
                order_number: order.id,
                payment_method: order.payment_method_name,
                vat_exempt_sales: 0,
                vat_zero_rated_sales: 0,
                total_discount: 0,
                subtotal_net: 0,
                amount_due: Number(order.payment?.total_amount) || 0,
                total_net_amount,
                packages: [
                    {
                        sequence_number: String(idx + 1),
                        page_number: 1,
                        total_pages: 1,
                        billing_address: billingAddress,
                        shipping_address: shippingAddress,
                        items,
                        account_name: `Great Deals E-Commerce Corp`,
                        account_full_address: '',
                        account_tax_identification_number: '',
                        invoice_printed_date: '',
                        order_number: order.id,
                        payment_method: order.payment_method_name,
                        vatable_sales: vatable_sales,
                        vat_exempt_sales: 0,
                        vat_zero_rated_sales: 0,
                        total_discount: 0,
                        subtotal_net: vatable_sales,
                        vat_amount: vat_amount,
                        amount_due: Number(order.payment?.total_amount) || 0,
                    },
                ],
            } as unknown as ReceiptDto;
        });
    }
}
