import React from 'react';
import { SalesInvoice } from '../types';
import { formatDate, formatCurrency } from '../utils/formatters';
import { apiService } from '../services/api';

interface InvoicesSectionProps {
  salesInvoices: SalesInvoice[];
  isPollingInvoices?: boolean;
  pollingAttempts?: number;
  maxPollingAttempts?: number;
  orderId?: string;
  shopId?: string;
}

const InvoicesSection: React.FC<InvoicesSectionProps> = ({ 
  salesInvoices, 
  isPollingInvoices = false,
  pollingAttempts = 0,
  maxPollingAttempts = 10,
  orderId,
  shopId
}) => {
  // Show polling message if currently polling and no invoices yet
  if (isPollingInvoices && (!salesInvoices || salesInvoices.length === 0)) {
    return (
      <div className="px-6 py-5">
        <h5 className="text-sm font-semibold text-gray-800 mb-4 uppercase tracking-wide">
          <i className="fas fa-spinner fa-spin mr-2"></i>Sales Invoices - Processing
        </h5>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <i className="fas fa-clock text-yellow-600 mr-3"></i>
            <div>
              <div className="text-sm font-medium text-yellow-800">
                Generating sales invoices... ({pollingAttempts}/{maxPollingAttempts})
              </div>
              <div className="text-xs text-yellow-600 mt-1">
                This may take a few moments. Please wait while we process your request.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!salesInvoices || salesInvoices.length === 0) return null;
  
  const handleDownloadInvoice = async (filePath: string, sequenceNumber: string) => {
    try {
      await apiService.downloadInvoice(filePath);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Failed to download invoice. Please try again.');
    }
  };
  
  return (
    <div className="px-6 py-5">
      <h5 className="text-sm font-semibold text-gray-800 mb-4 uppercase tracking-wide">
        <i className="fas fa-file-invoice mr-2"></i>Sales Invoices ({salesInvoices.length})
      </h5>
      <div className="space-y-4">
        {salesInvoices.map((invoice: any, index) => {
          const sequenceNumber = invoice.sequenceNumber || invoice.sequence_number;
          const invoiceDate = invoice.generatedAt || invoice.createdAt || invoice.created_at || 'N/A';
          const amountDue = invoice.amountDue || invoice.total_amount || invoice.amount || 0;
          const vatAmount = invoice.vatAmount || 0;
          const vatableSales = invoice.vatableSales || 0;
          const filePath = invoice.filePath;
          const packageId = invoice.packageId || invoice.package_id;
          
          return (
            <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h6 className="text-sm font-semibold text-gray-900 mb-1">Invoice #{sequenceNumber}</h6>
                  <div className="text-xs text-gray-500 mb-1">
                    Generated: {formatDate(invoiceDate)}
                  </div>
                  {packageId && (
                    <div className="text-xs text-gray-500">
                      Package: {packageId}
                    </div>
                  )}
                </div>
                <div className="text-right ml-4">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(amountDue, 'PHP')}
                  </div>
                  <div className="text-xs text-gray-500">Amount Due</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 pt-3 border-t border-gray-200">
                <div>
                  <span className="font-semibold">VATable Sales:</span> 
                  <span className="ml-1">{formatCurrency(vatableSales, 'PHP')}</span>
                </div>
                <div>
                  <span className="font-semibold">VAT Amount:</span> 
                  <span className="ml-1">{formatCurrency(vatAmount, 'PHP')}</span>
                </div>
              </div>
              
              {filePath && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <button 
                    onClick={() => handleDownloadInvoice(filePath, sequenceNumber)}
                    className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer bg-transparent border-none p-0"
                  >
                    <i className="fas fa-download mr-2"></i>
                    Download PDF Invoice
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InvoicesSection;
