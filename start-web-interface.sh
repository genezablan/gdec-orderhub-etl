#!/bin/bash

# TikTok Order Status Web Interface Starter Script

echo "🚀 Starting TikTok Order Status Web Interface..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Navigate to web interface directory
cd "$(dirname "$0")/web-interface" || {
    echo "❌ Could not find web-interface directory"
    exit 1
}

echo "📂 Current directory: $(pwd)"
echo ""

# Check if API Gateway is running
echo "🔍 Checking if API Gateway is running on port 3000..."
if curl -s http://localhost:3000/tiktok/shops > /dev/null 2>&1; then
    echo "✅ API Gateway is running"
else
    echo "⚠️  API Gateway might not be running on port 3000"
    echo "   Please start it with: npm run start:dev api-gateway"
    echo "   Continuing anyway..."
fi

echo ""
echo "🌐 Starting web interface server..."
echo ""

# Start the web server
node server.js
