#!/bin/bash

# Start PM2 server for GDEC OrderHub ETL microservices
# This script starts all microservices using PM2 process manager

echo "🚀 Starting GDEC OrderHub ETL microservices with PM2..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed. Installing PM2..."
    npm install -g pm2
fi

# Build the project first
echo "📦 Building the project..."
npm run build

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️ Warning: .env file not found in root directory"
    echo "Please copy .env.example to .env and configure your environment variables"
    exit 1
fi

# Load environment variables from .env file
echo "🔧 Loading environment variables from .env..."
export $(grep -v '^#' .env | xargs)

# Start all services with PM2
echo "🔧 Starting microservices with environment variables..."

# API Gateway (Port 3000)
pm2 start dist/apps/api-gateway/main.js --name "api-gateway"

# TikTok Fetcher (Port 3001)
pm2 start dist/apps/tiktok-fetcher/main.js --name "tiktok-fetcher"

# TikTok Transformer (Port 3002)
pm2 start dist/apps/tiktok-transformer/main.js --name "tiktok-transformer"

# TikTok Loader (Port 3003)
pm2 start dist/apps/tiktok-loader/main.js --name "tiktok-loader"

# TikTok Receipt (Port 3004)
pm2 start dist/apps/tiktok-receipt/main.js --name "tiktok-receipt"

# Save PM2 configuration
pm2 save

# Show status
echo "✅ All services started! Current PM2 status:"
pm2 status

echo "📊 To monitor services:"
echo "  pm2 monit"
echo ""
echo "🔄 To restart all services:"
echo "  pm2 restart all"
echo ""
echo "🛑 To stop all services:"
echo "  pm2 stop all"
echo ""
echo "🗑️ To delete all services:"
echo "  pm2 delete all"
