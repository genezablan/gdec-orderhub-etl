#!/bin/bash

echo "🌐 Starting TikTok Order Management Web Interface..."
echo "=================================================="

# Check if we're in the correct directory
PROJECT_ROOT="/home/morris/projects/gdec-orderhub-etl"
WEB_INTERFACE_DIR="$PROJECT_ROOT/web-interface"

# Navigate to web-interface directory
if [ ! -d "$WEB_INTERFACE_DIR" ]; then
    echo "❌ Web interface directory not found: $WEB_INTERFACE_DIR"
    exit 1
fi

cd "$WEB_INTERFACE_DIR"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found in web-interface directory"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
fi

echo ""
echo "🚀 Starting web server..."
echo "📱 Web Interface will be available at: http://localhost:3002"
echo "🔗 Make sure API Gateway is running on: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
npm start
