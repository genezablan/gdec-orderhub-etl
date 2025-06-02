import React from 'react';
import { Shop } from '../types';

interface OrderFormProps {
  shops: Shop[];
  selectedShop: string;
  orderId: string;
  isLoading: boolean;
  onShopChange: (shopId: string) => void;
  onOrderIdChange: (orderId: string) => void;
  onSubmit: (shopId: string, orderId: string) => void;
}

const OrderForm: React.FC<OrderFormProps> = ({
  shops,
  selectedShop,
  orderId,
  isLoading,
  onShopChange,
  onOrderIdChange,
  onSubmit
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(selectedShop, orderId);
  };

  const getShopId = (shop: Shop): string => {
    return shop.tiktok_shop_code || shop.id || shop.shop_id || shop.shopId || '';
  };

  const getShopName = (shop: Shop): string => {
    return shop.name || shop.shop_name || shop.shopName || `Shop ${getShopId(shop)}`;
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Shop Selection */}
        <div>
          <label htmlFor="shopSelect" className="block text-sm font-medium text-gray-700 mb-2">
            <i className="fas fa-store mr-2"></i>Select Shop
          </label>
          <select
            id="shopSelect"
            value={selectedShop}
            onChange={(e) => onShopChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
            required
          >
            <option value="">
              {shops.length === 0 ? 'Loading shops...' : 'Select a shop...'}
            </option>
            {shops.map((shop) => {
              const shopId = getShopId(shop);
              const shopName = getShopName(shop);
              return shopId ? (
                <option key={shopId} value={shopId}>
                  {shopName}
                </option>
              ) : null;
            })}
          </select>
        </div>

        {/* Order ID Input */}
        <div>
          <label htmlFor="orderIdInput" className="block text-sm font-medium text-gray-700 mb-2">
            <i className="fas fa-receipt mr-2"></i>Order ID
          </label>
          <input
            type="text"
            id="orderIdInput"
            value={orderId}
            onChange={(e) => onOrderIdChange(e.target.value)}
            placeholder="Enter order ID"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 text-sm"
        >
          {isLoading ? (
            <>
              <div className="loading-spinner"></div>
              <span>Checking...</span>
            </>
          ) : (
            <>
              <i className="fas fa-search"></i>
              <span>Check Order</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default OrderForm;
