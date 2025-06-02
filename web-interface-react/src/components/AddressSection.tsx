import React from 'react';
import { Address } from '../types';

interface AddressSectionProps {
  address: Address;
}

const AddressSection: React.FC<AddressSectionProps> = ({ address }) => {
  if (!address) return null;
  
  // Handle TikTok API address format
  const addressData = address as any;
  const fullAddress = addressData.full_address || 
    [
      addressData.address_detail || addressData.address_line1,
      addressData.address_line2,
      address.city,
      address.state,
      address.postal_code,
      address.country
    ].filter(Boolean).join(', ');
  
  const recipientName = addressData.name;
  const phoneNumber = addressData.phone_number;
  
  return (
    <div className="px-6 py-5">
      <h5 className="text-sm font-semibold text-gray-800 mb-4 uppercase tracking-wide">
        <i className="fas fa-map-marker-alt mr-2"></i>Shipping Address
      </h5>
      <div className="space-y-3">
        {recipientName && (
          <div className="flex justify-between items-start py-1">
            <span className="text-sm text-gray-600 font-medium">Recipient:</span>
            <span className="text-sm font-semibold text-gray-900 text-right ml-4">{recipientName}</span>
          </div>
        )}
        {phoneNumber && (
          <div className="flex justify-between items-start py-1">
            <span className="text-sm text-gray-600 font-medium">Phone:</span>
            <span className="text-sm font-semibold text-gray-900 text-right ml-4">{phoneNumber}</span>
          </div>
        )}
        {fullAddress && (
          <div className="pt-2">
            <span className="text-sm text-gray-600 font-medium">Address:</span>
            <p className="text-sm font-semibold text-gray-900 mt-2 leading-relaxed">{fullAddress}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressSection;
