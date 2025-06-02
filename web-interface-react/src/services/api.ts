import { Shop, OrderData, SalesInvoice } from '../types';

const API_BASE_URL = 'http://localhost:3000/tiktok';

class ApiService {
  async getShops(): Promise<Shop[]> {
    const response = await fetch(`${API_BASE_URL}/shops`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data : (data.shops || []);
  }

  async getOrderDetails(shopId: string, orderId: string): Promise<OrderData> {
    const params = new URLSearchParams({
      shop_id: shopId,
      order_id: orderId
    });
    
    const response = await fetch(`${API_BASE_URL}/orders/details?${params.toString()}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  }

  async getSalesInvoices(shopId: string, orderId: string): Promise<SalesInvoice[]> {
    const params = new URLSearchParams({
      shop_id: shopId,
      order_id: orderId
    });
    
    const response = await fetch(`${API_BASE_URL}/orders/sales-invoices?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch sales invoices: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data || [];
  }

  async downloadInvoice(filePath: string): Promise<void> {
    const params = new URLSearchParams({
      file: filePath
    });
    
    const response = await fetch(`${API_BASE_URL}/download/invoice?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to download invoice: ${response.status}`);
    }
    
    // Extract original filename from the S3 URL
    const originalFileName = filePath.split('/').pop() || 'invoice.pdf';
    const fileNameWithoutExtension = originalFileName.replace('.pdf', '');
    
    // Generate timestamp
    const timestamp = Date.now().toString();
    
    // Create filename with original name + timestamp
    const filename = `${fileNameWithoutExtension}_${timestamp}.pdf`;
    
    // Convert response to blob and trigger download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export const apiService = new ApiService();
