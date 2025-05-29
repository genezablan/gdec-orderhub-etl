export class Address {
    full_name: string;
    address_line1: string;
    address_line2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    full_address: string;
    tax_identification_number: string
}

export class Item {
    shop_sku: string;
    variation_sku: string;
    item_name: string;
    quantity: number;
    item_price: number;
    store_discount: number;
    total_actual_price: number;
}

export class Package {
    sequence_number: string;
    page_number: number;
    total_pages: number;
    billing_address: Address;
    shipping_address: Address;
    items: Item[];
    account_name: string;
    account_full_address: string;
    account_tax_identification_number: string;
    invoice_printed_date: string = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
    });
    order_number: string;
    payment_method: string;
    vatable_sales: number;
    vat_exempt_sales: number;
    vat_zero_rated_sales: number;
    total_discount: number;
    subtotal_net: number;
    vat_amount: number;
    amount_due: number;
}

export class ReceiptDto {
    packages: Package[];
}
