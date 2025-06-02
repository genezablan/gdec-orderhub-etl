import React from 'react';

const Header: React.FC = () => {
  return (
    <div className="gradient-bg py-4 fixed top-0 left-0 right-0 z-50 shadow-lg">
      <div className="max-w-full mx-auto px-6">
        <div className="flex items-center text-white">
          <div className="flex items-center">
            <i className="fab fa-tiktok text-2xl mr-3"></i>
            <div>
              <h1 className="text-xl font-bold">TikTok Order Hub</h1>
              <p className="text-sm opacity-90">Order Management System</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
