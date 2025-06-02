import React from 'react';
import { LineItem } from '../types';
import { formatCurrency } from '../utils/formatters';

interface ItemsSectionProps {
  items: LineItem[];
}

const ItemsSection: React.FC<ItemsSectionProps> = ({ items }) => {
  if (!items || items.length === 0) return null;
  
  // Helper function to safely convert string or number to float
  const toFloat = (value: string | number | undefined): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    return 0;
  };
  
  return (
    <div className="px-6 py-5">
      <h5 className="text-sm font-semibold text-gray-800 mb-4 uppercase tracking-wide">
        <i className="fas fa-shopping-bag mr-2"></i>Order Items ({items.length})
      </h5>
      
      {/* Items Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr className="text-xs text-gray-600 uppercase tracking-wider">
              <th className="px-4 py-3 text-left border-b border-gray-200">Product</th>
              <th className="px-4 py-3 text-right border-b border-gray-200">Original Price</th>
              <th className="px-4 py-3 text-right border-b border-gray-200">Sale Price</th>
              <th className="px-4 py-3 text-right border-b border-gray-200">Platform Discount</th>
              <th className="px-4 py-3 text-right border-b border-gray-200">Seller Discount</th>
              <th className="px-4 py-3 text-center border-b border-gray-200">Status</th>
              <th className="px-4 py-3 text-center border-b border-gray-200">Package/Tracking</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any, index) => {
              const itemName = item.product_name || item.name || 'Unknown Item';
              const skuName = item.sku_name;
              const sellerSku = item.seller_sku;
              const salePrice = toFloat(item.sale_price || item.price || item.unit_price);
              const originalPrice = toFloat(item.original_price || salePrice);
              const platformDiscount = toFloat(item.platform_discount);
              const sellerDiscount = toFloat(item.seller_discount);
              const currency = item.currency || 'PHP';
              const packageId = item.package_id;
              const trackingNumber = item.tracking_number;
              const status = item.display_status || item.package_status;
              
              return (
                <tr key={index} className="hover:bg-gray-50 border-b border-gray-100">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-semibold text-sm text-gray-900">{itemName}</div>
                      {skuName && skuName !== 'Default' && (
                        <div className="text-xs text-gray-600">SKU: {skuName}</div>
                      )}
                      {sellerSku && (
                        <div className="text-xs text-gray-600">Seller SKU: {sellerSku}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-mono">
                      {formatCurrency(originalPrice, currency)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-mono font-semibold text-green-700">
                      {formatCurrency(salePrice, currency)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-mono text-blue-600">
                      {platformDiscount > 0 ? `-${formatCurrency(platformDiscount, currency)}` : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-mono text-orange-600">
                      {sellerDiscount > 0 ? `-${formatCurrency(sellerDiscount, currency)}` : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {status || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="text-xs">
                      {packageId && (
                        <div className="font-medium text-gray-700">Pkg: {packageId}</div>
                      )}
                      {trackingNumber && (
                        <div className="font-mono text-gray-600 mt-1">{trackingNumber}</div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Summary Section */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h6 className="text-sm font-semibold text-gray-800 mb-3">Order Summary</h6>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-xs text-gray-600">Total Items</div>
            <div className="font-semibold text-gray-900">{items.length}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600">Subtotal (Original)</div>
            <div className="font-semibold text-gray-900 font-mono">
              {formatCurrency(
                items.reduce((sum, item) => sum + toFloat(item.original_price || item.sale_price), 0),
                items[0]?.currency || 'PHP'
              )}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600">Total Discounts</div>
            <div className="font-semibold text-red-600 font-mono">
              -{formatCurrency(
                items.reduce((sum, item) => 
                  sum + toFloat(item.platform_discount) + toFloat(item.seller_discount), 0
                ),
                items[0]?.currency || 'PHP'
              )}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600">Final Total</div>
            <div className="font-semibold text-green-700 font-mono">
              {formatCurrency(
                items.reduce((sum, item) => sum + toFloat(item.sale_price || item.price), 0),
                items[0]?.currency || 'PHP'
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemsSection;
