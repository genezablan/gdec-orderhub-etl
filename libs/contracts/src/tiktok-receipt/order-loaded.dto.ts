export interface OrderLoadedPayloadDto {
  orderId: string;
  shopId: string;
  orderStatus?: string;
}

export interface OrderProcessingResult {
  success: boolean;
  message: string;
  packagesProcessed?: number;
  orderId: string;
  shopId: string;
  orderStatus?: string;
}
