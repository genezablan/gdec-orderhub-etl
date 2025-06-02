import React, { useState, useEffect, useRef } from 'react';
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
  const [isPollingInvoices, setIsPollingInvoices] = useState<boolean>(false);
  const [pollingAttempts, setPollingAttempts] = useState<number>(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxPollingAttempts = 10; // Poll for 30 seconds (10 attempts * 3 seconds)

  useEffect(() => {
    loadShops();
    
    // Cleanup polling interval on component unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
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

  const pollForInvoices = async (shopId: string, orderIdValue: string) => {
    try {
      const invoicesResponse = await apiService.getSalesInvoices(shopId, orderIdValue);
      
      if (invoicesResponse && invoicesResponse.length > 0) {
        // Invoices found, stop polling
        setSalesInvoices(invoicesResponse);
        setIsPollingInvoices(false);
        setPollingAttempts(0);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        console.log(`✅ Found ${invoicesResponse.length} invoices after polling`);
      } else {
        // No invoices yet, continue polling
        setPollingAttempts(prev => prev + 1);
        console.log(`🔄 Polling attempt ${pollingAttempts + 1}/${maxPollingAttempts} for invoices`);
      }
    } catch (error) {
      console.warn('Error during invoice polling:', error);
      setPollingAttempts(prev => prev + 1);
    }
  };

  const startInvoicePolling = (shopId: string, orderIdValue: string) => {
    setIsPollingInvoices(true);
    setPollingAttempts(0);
    
    // Clear any existing polling interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    // Start polling every 3 seconds
    pollingIntervalRef.current = setInterval(() => {
      if (pollingAttempts >= maxPollingAttempts) {
        // Max attempts reached, stop polling
        setIsPollingInvoices(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        console.log('⏰ Max polling attempts reached for invoices');
        return;
      }
      
      pollForInvoices(shopId, orderIdValue);
    }, 3000);
    
    // Also check immediately
    pollForInvoices(shopId, orderIdValue);
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
    setIsPollingInvoices(false);
    setPollingAttempts(0);
    
    // Clear any existing polling interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    try {
      // Fetch order details
      const orderResponse = await apiService.getOrderDetails(shopId, orderIdValue);
      setOrderData(orderResponse);

      // Try to fetch sales invoices immediately
      try {
        const invoicesResponse = await apiService.getSalesInvoices(shopId, orderIdValue);
        
        if (invoicesResponse && invoicesResponse.length > 0) {
          // Invoices found immediately
          setSalesInvoices(invoicesResponse);
          console.log(`✅ Found ${invoicesResponse.length} invoices immediately`);
        } else {
          // No invoices found, start polling
          console.log('📋 No invoices found immediately, starting polling...');
          startInvoicePolling(shopId, orderIdValue);
        }
      } catch (invoiceError) {
        console.warn('Could not fetch sales invoices initially, starting polling:', invoiceError);
        // Start polling even if initial request failed
        startInvoicePolling(shopId, orderIdValue);
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
                isPollingInvoices={isPollingInvoices}
                pollingAttempts={pollingAttempts}
                maxPollingAttempts={maxPollingAttempts}
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
