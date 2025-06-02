#!/bin/bash

echo "🧪 Testing TikTok Order Management APIs..."
echo "==========================================="

# Test 1: Get Shops
echo "📋 1. Testing GET /tiktok/shops"
if curl -s --connect-timeout 5 "http://localhost:3001/tiktok/shops" > /dev/null 2>&1; then
    echo "✅ API Gateway is responding on port 3001"
    echo "📊 Shops endpoint is accessible"
else
    echo "❌ Failed to connect to API Gateway on port 3001"
    echo "   Make sure the API Gateway is running: npm run start:api-gateway"
fi

echo ""
echo "📋 2. Testing GET /tiktok/orders/support-details"
echo "Usage: GET /tiktok/orders/support-details?shop_id=SHOP_ID&order_id=ORDER_ID"
echo "Example: curl \"http://localhost:3001/tiktok/orders/support-details?shop_id=123&order_id=456\""

echo ""
echo "📋 3. Testing GET /tiktok/orders/sales-invoices"
echo "Usage: GET /tiktok/orders/sales-invoices?shop_id=SHOP_ID&order_id=ORDER_ID"
echo "Example: curl \"http://localhost:3001/tiktok/orders/sales-invoices?shop_id=123&order_id=456\""

echo ""
echo "🌐 4. Starting Web Interface..."
echo "The web interface will be available at: http://localhost:3002"
echo "Make sure to install dependencies first with: cd web-interface && npm install"
echo ""

# Check if we're in the web-interface directory
if [ ! -f "package.json" ]; then
    echo "📁 Changing to web-interface directory..."
    cd web-interface || { echo "❌ web-interface directory not found"; exit 1; }
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🚀 Starting web server..."
npm start
