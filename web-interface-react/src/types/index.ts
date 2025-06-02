export interface Shop {
  id?: string;
  shop_id?: string;
  shopId?: string;
  tiktok_shop_code?: string;
  name?: string;
  shop_name?: string;
  shopName?: string;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  // TikTok API specific fields
  name?: string;
  phone_number?: string;
  full_address?: string;
  address_detail?: string;
  address_line1?: string;
  address_line2?: string;
  district_info?: any[];
}

export interface LineItem {
  product_name?: string;
  name?: string;
  quantity?: number;
  price?: number;
  unit_price?: number;
  sale_price?: string | number;
  original_price?: string | number;
  platform_discount?: string | number;
  seller_discount?: string | number;
  currency?: string;
  sku_name?: string;
  seller_sku?: string;
  package_id?: string;
  tracking_number?: string;
  display_status?: string;
  package_status?: string;
}

export interface Order {
  order_id?: string;
  orderId?: string;
  id?: string;
  status?: string;
  order_status?: string;
  create_time?: string;
  created_at?: string;
  createdAt?: string;
  update_time?: string;
  updated_at?: string;
  updatedAt?: string;
  buyer_name?: string;
  recipient_name?: string;
  recipient_phone?: string;
  buyer_email?: string;
  payment_method?: string;
  total_amount?: number;
  currency?: string;
  shipping_address?: Address;
  line_items?: LineItem[];
  shop_id?: string;
  package_count?: number;
  tracking_number?: string;
  delivery_option?: string;
}

export interface OrderData {
  data?: {
    orders?: Order[];
  } | Order[] | Order;
  order?: Order;
  orders?: Order[];
  [key: string]: any;
}

export interface SalesInvoice {
  sequence_number?: string;
  sequenceNumber?: string;
  invoice_id?: string;
  id?: string;
  create_time?: string;
  created_at?: string;
  createdAt?: string;
  generatedAt?: string;
  status?: string;
  total_amount?: number;
  amount?: number;
  amountDue?: string;
  vatAmount?: string;
  vatableSales?: string;
  currency?: string;
  filePath?: string;
  packageId?: string;
  package_id?: string;
}
