import React, { useState } from 'react';
import { Order, SalesInvoice } from '../types';
import { formatDate, formatCurrency, getStatusBadgeClass } from '../utils/formatters';
import AddressSection from './AddressSection';
import InvoicesSection from './InvoicesSection';
import ItemsSection from './ItemsSection';

interface OrderCardProps {
  order: Order;
  index: number;
  salesInvoices: SalesInvoice[];
}

const OrderCard: React.FC<OrderCardProps> = ({ order, index, salesInvoices }) => {
  const [showRawData, setShowRawData] = useState(false);

  // Handle nested order structure and map TikTok API fields
  const orderDetails = (order as any).order || order;
  
  const orderId = orderDetails.id || orderDetails.order_id || orderDetails.orderId || 'N/A';
  const status = orderDetails.status || orderDetails.order_status || 'Unknown';
  const createdTime = orderDetails.create_time || orderDetails.created_at || orderDetails.createdAt;
  const updateTime = orderDetails.update_time || orderDetails.updated_at || orderDetails.updatedAt;
  
  // Extract payment information from nested payment object
  const payment = orderDetails.payment || {};
  const totalAmount = payment.total_amount || orderDetails.total_amount;
  const currency = payment.currency || orderDetails.currency || 'PHP';
  
  // Extract recipient information from nested recipient_address
  const recipientAddress = orderDetails.recipient_address || {};
  const recipientName = recipientAddress.name || orderDetails.recipient_name;
  const recipientPhone = recipientAddress.phone_number || orderDetails.recipient_phone;
  
  // Extract other order details
  const paymentMethod = orderDetails.payment_method_name || orderDetails.payment_method;
  const buyerEmail = orderDetails.buyer_email;
  const deliveryOption = orderDetails.delivery_option_name || orderDetails.delivery_option;
  const trackingNumber = orderDetails.tracking_number;
  const lineItems = orderDetails.line_items || [];
  const packages = orderDetails.packages || [];
  
  // Format dates
  const createdDate = createdTime ? formatDate(createdTime) : 'N/A';
  const updatedDate = updateTime ? formatDate(updateTime) : 'N/A';
  
  // Get status badge class
  const statusBadgeClass = getStatusBadgeClass(status);
  
  // Check if sales invoices exist for this order
  const hasInvoices = salesInvoices && salesInvoices.length > 0;
  const invoiceStatus = hasInvoices ? 'Available' : 'Not Generated';
  const invoiceStatusClass = hasInvoices ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';

  const createDetailRow = (label: string, value: string | number | undefined) => {
    if (!value || value === 'N/A' || value === null || value === undefined) return null;
    
    return (
      <div key={label} className="flex justify-between items-start py-1">
        <span className="text-sm text-gray-600 font-medium">{label}:</span>
        <span className="text-sm font-semibold text-gray-900 text-right ml-4">{value}</span>
      </div>
    );
  };

  const toggleRawData = () => {
    setShowRawData(!showRawData);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {/* Order Header */}
      <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-xl font-semibold text-gray-800 mb-3">Order #{orderId}</h4>
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusBadgeClass}`}>
                <i className="fas fa-circle text-xs mr-2"></i>
                {status}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${invoiceStatusClass}`}>
                <i className="fas fa-receipt text-xs mr-2"></i>
                Invoice: {invoiceStatus}
              </span>
            </div>
          </div>
          <div className="text-right text-sm text-gray-500">
            <div className="mb-1">Created: {createdDate}</div>
            <div>Updated: {updatedDate}</div>
          </div>
        </div>
      </div>
      
      {/* Order Details */}
      <div className="px-6 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Basic Info */}
          <div>
            <h5 className="text-sm font-semibold text-gray-800 mb-4 uppercase tracking-wide">Order Information</h5>
            <div className="space-y-3">
              {createDetailRow('Order ID', orderId)}
              {createDetailRow('Status', status)}
              {createDetailRow('Payment Method', paymentMethod)}
              {createDetailRow('Total Amount', formatCurrency(totalAmount, currency))}
              {createDetailRow('Delivery Option', deliveryOption)}
              {createDetailRow('Tracking Number', trackingNumber)}
            </div>
          </div>
          
          {/* Customer Info */}
          <div>
            <h5 className="text-sm font-semibold text-gray-800 mb-4 uppercase tracking-wide">Customer Information</h5>
            <div className="space-y-3">
              {createDetailRow('Recipient Name', recipientName)}
              {createDetailRow('Phone', recipientPhone)}
              {createDetailRow('Email', buyerEmail)}
              {createDetailRow('Package Count', packages.length || 'N/A')}
            </div>
          </div>
          
          {/* Additional Info */}
          <div>
            <h5 className="text-sm font-semibold text-gray-800 mb-4 uppercase tracking-wide">Additional Details</h5>
            <div className="space-y-3">
              {createDetailRow('Created', createdDate)}
              {createDetailRow('Updated', updatedDate)}
              {createDetailRow('Items Count', lineItems.length || 'N/A')}
              {createDetailRow('Fulfillment Type', orderDetails.fulfillment_type)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Invoices Section */}
      {hasInvoices && (
        <div className="border-t border-gray-200">
          <InvoicesSection salesInvoices={salesInvoices} />
        </div>
      )}
      
      {/* Address Section */}
      {recipientAddress && Object.keys(recipientAddress).length > 0 && (
        <div className="border-t border-gray-200">
          <AddressSection address={recipientAddress} />
        </div>
      )}
      
      {/* Items Section */}
      {lineItems && lineItems.length > 0 && (
        <div className="border-t border-gray-200">
          <ItemsSection items={lineItems} />
        </div>
      )}
      
      {/* Raw Data Collapsible */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <button 
          type="button" 
          className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors font-medium"
          onClick={toggleRawData}
        >
          <i className={`fas fa-chevron-right mr-2 transition-transform ${showRawData ? 'rotate-90' : ''}`}></i>
          View Raw Data
        </button>
        {showRawData && (
          <div className="mt-4">
            <pre className="bg-white rounded-lg p-4 text-xs overflow-x-auto border border-gray-200 max-h-96 overflow-y-auto">
              {JSON.stringify({ order, salesInvoices }, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderCard;
