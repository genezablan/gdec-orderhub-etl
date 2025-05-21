import { Injectable } from '@nestjs/common';
import { RawOrderDetailsDto } from '@app/contracts/tiktok-fetcher/dto/';
import { ReceiptDto } from '@app/contracts/tiktok-transformer/dto/';

@Injectable()
export class ReceiptService {
    transformRawOrderDetails(raw: RawOrderDetailsDto): ReceiptDto[] {
        // Map each order to a ReceiptDto (with all required fields)
        return raw.orders.map((order, idx) => {
            const billingAddress = {
                full_name: order.recipient_address.first_name,
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
            const items = Array.isArray(order.line_items)
                ? order.line_items.map((item: Record<string, any>) => ({
                      shop_sku:
                          typeof item.shop_sku === 'string'
                              ? item.shop_sku
                              : '',
                      variation_sku:
                          typeof item.variation_sku === 'string'
                              ? item.variation_sku
                              : '',
                      item_name:
                          typeof item.item_name === 'string'
                              ? item.item_name
                              : '',
                      quantity:
                          typeof item.quantity === 'number' ? item.quantity : 1,
                      item_price:
                          typeof item.price === 'number' ? item.price : 0,
                      store_discount:
                          typeof item.store_discount === 'number'
                              ? item.store_discount
                              : 0,
                      total_actual_price:
                          typeof item.total_actual_price === 'number'
                              ? item.total_actual_price
                              : 0,
                  }))
                : [];
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
                account_name: raw.shop.tiktok_shop_code,
                account_full_address: '',
                account_tax_identification_number: '',
                invoice_printed_date: '',
                order_number: order.id,
                payment_method: order.payment_method_name,
                vatable_sales: 0,
                vat_exempt_sales: 0,
                vat_zero_rated_sales: 0,
                total_discount: 0,
                subtotal_net: 0,
                vat_amount: 0,
                amount_due: Number(order.payment?.total_amount) || 0,
                packages: [
                    {
                        sequence_number: String(idx + 1),
                        page_number: 1,
                        total_pages: 1,
                        billing_address: billingAddress,
                        shipping_address: shippingAddress,
                        items,
                        account_name: raw.shop.tiktok_shop_code,
                        account_full_address: '',
                        account_tax_identification_number: '',
                        invoice_printed_date: '',
                        order_number: order.id,
                        payment_method: order.payment_method_name,
                        vatable_sales: 0,
                        vat_exempt_sales: 0,
                        vat_zero_rated_sales: 0,
                        total_discount: 0,
                        subtotal_net: 0,
                        vat_amount: 0,
                        amount_due: Number(order.payment?.total_amount) || 0,
                    },
                ],
            } as unknown as ReceiptDto;
        });
    }
}
