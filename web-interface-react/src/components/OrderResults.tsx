import React from 'react';
import { OrderData, SalesInvoice } from '../types';
import OrderCard from './OrderCard';

interface OrderResultsProps {
  orderData: OrderData;
  salesInvoices: SalesInvoice[];
}

const OrderResults: React.FC<OrderResultsProps> = ({ orderData, salesInvoices }) => {
  // Handle nested response structure from TikTok API
  let orders: any[] = [];
  
  // The API returns data in format: { data: { orders: [...] } }
  const apiData = orderData as any;
  
  if (apiData?.data?.orders && Array.isArray(apiData.data.orders)) {
    orders = apiData.data.orders;
  } else if (apiData?.data && Array.isArray(apiData.data)) {
    orders = apiData.data;
  } else if (apiData?.data && !Array.isArray(apiData.data)) {
    orders = [apiData.data];
  } else if (Array.isArray(orderData)) {
    orders = orderData as any[];
  } else if (orderData) {
    orders = [orderData];
  }

  const ordersArray = orders;

  if (ordersArray.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 fade-in">
        <div className="flex items-center mb-6">
          <i className="fas fa-info-circle text-yellow-500 text-2xl mr-3"></i>
          <h3 className="text-xl font-semibold text-gray-800">No Results</h3>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <i className="fas fa-info-circle text-yellow-500 mr-2"></i>
            <span className="text-yellow-800">No order details found for the provided Order ID.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <i className="fas fa-check-circle text-green-500 text-xl mr-3"></i>
          <h3 className="text-xl font-semibold text-gray-800">Order Details</h3>
          <span className="ml-auto text-sm text-gray-500">
            {ordersArray.length} {ordersArray.length === 1 ? 'order' : 'orders'} found
          </span>
        </div>
      </div>
      
      <div className="grid gap-8">
        {ordersArray.map((order, index) => (
          <OrderCard
            key={index}
            order={order}
            index={index}
            salesInvoices={salesInvoices}
          />
        ))}
      </div>
    </div>
  );
};

export default OrderResults;
