#!/bin/bash

echo "🧪 Testing TikTok Order Management APIs..."
echo "==========================================="

API_BASE="http://localhost:3001"

echo "📋 Testing API Gateway connectivity..."

# Test basic connectivity
if curl -s --connect-timeout 5 "$API_BASE/health" > /dev/null 2>&1; then
    echo "✅ API Gateway is responding"
else
    echo "❌ API Gateway is not responding on port 3001"
    echo "   Start it with: npm run start:api-gateway"
    exit 1
fi

echo ""
echo "📋 Available API Endpoints:"
echo "  GET $API_BASE/tiktok/shops"
echo "  GET $API_BASE/tiktok/orders/support-details?shop_id=SHOP_ID&order_id=ORDER_ID"
echo "  GET $API_BASE/tiktok/orders/sales-invoices?shop_id=SHOP_ID&order_id=ORDER_ID"

echo ""
echo "🧪 Testing /tiktok/shops endpoint..."
SHOPS_RESPONSE=$(curl -s --connect-timeout 10 "$API_BASE/tiktok/shops")
if [ $? -eq 0 ] && [ ! -z "$SHOPS_RESPONSE" ]; then
    echo "✅ Shops endpoint is working"
    echo "📊 Response preview: ${SHOPS_RESPONSE:0:100}..."
else
    echo "❌ Shops endpoint failed"
fi

echo ""
echo "📝 Example API Calls:"
echo "curl \"$API_BASE/tiktok/shops\""
echo "curl \"$API_BASE/tiktok/orders/support-details?shop_id=123&order_id=456\""
echo "curl \"$API_BASE/tiktok/orders/sales-invoices?shop_id=123&order_id=456\""

echo ""
echo "🌐 You can now start the web interface with:"
echo "   ./start-web-ui.sh"
echo "   or manually: cd web-interface && npm start"
