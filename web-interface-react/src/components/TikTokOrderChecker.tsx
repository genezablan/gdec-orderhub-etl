import React, { useState, useEffect } from 'react';
import Header from './Header';
import OrderForm from './OrderForm';
import LoadingCard from './LoadingCard';
import OrderResults from './OrderResults';
import ErrorCard from './ErrorCard';
import { Shop, OrderData, SalesInvoice } from '../types';
import { apiService } from '../services/api';

const TikTokOrderChecker: React.FC = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>([]);
  const [error, setError] = useState<string>('');
  const [showResults, setShowResults] = useState<boolean>(false);

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    try {
      const shopsData = await apiService.getShops();
      setShops(shopsData);
    } catch (error) {
      console.error('Error loading shops:', error);
      setError(`Failed to load shops: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleFormSubmit = async (shopId: string, orderIdValue: string) => {
    if (!shopId || !orderIdValue) {
      setError('Please select a shop and enter an order ID.');
      return;
    }

    setIsLoading(true);
    setError('');
    setShowResults(false);
    setOrderData(null);
    setSalesInvoices([]);

    try {
      // Fetch order details
      const orderResponse = await apiService.getOrderDetails(shopId, orderIdValue);
      setOrderData(orderResponse);

      // Fetch sales invoices
      try {
        const invoicesResponse = await apiService.getSalesInvoices(shopId, orderIdValue);
        setSalesInvoices(invoicesResponse);
      } catch (invoiceError) {
        console.warn('Could not fetch sales invoices:', invoiceError);
        setSalesInvoices([]);
      }

      setShowResults(true);
    } catch (error) {
      console.error('Error checking order status:', error);
      setError(`Failed to check order status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismissError = () => {
    setError('');
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      
      <div className="flex h-screen pt-16"> {/* pt-16 to account for fixed header */}
        {/* Sidebar */}
        <div className="w-80 bg-white shadow-lg border-r border-gray-200 overflow-y-auto">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Order Checker</h2>
            <OrderForm
              shops={shops}
              selectedShop={selectedShop}
              orderId={orderId}
              isLoading={isLoading}
              onShopChange={setSelectedShop}
              onOrderIdChange={setOrderId}
              onSubmit={handleFormSubmit}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {isLoading && <LoadingCard />}
            
            {showResults && !isLoading && orderData && (
              <OrderResults 
                orderData={orderData} 
                salesInvoices={salesInvoices} 
              />
            )}

            {error && !isLoading && (
              <ErrorCard 
                message={error} 
                onDismiss={handleDismissError} 
              />
            )}

            {!isLoading && !showResults && !error && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <i className="fas fa-search text-6xl mb-4 text-gray-300"></i>
                  <h3 className="text-xl font-medium mb-2">No Order Selected</h3>
                  <p>Select a shop and enter an order ID to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TikTokOrderChecker;
