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

# Stop and delete existing processes
echo "🛑 Stopping existing PM2 processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Create logs directory if it doesn't exist
echo "📁 Creating logs directory..."
mkdir -p logs

# Start all services using ecosystem config
echo "🔧 Starting microservices with ecosystem configuration..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Show status
echo "✅ All services started! Current PM2 status:"
pm2 status

echo ""
echo "📊 Useful PM2 commands:"
echo "  pm2 status           - Show status of all services"
echo "  pm2 monit            - Monitor services in real-time"
echo "  pm2 logs             - Show logs for all services"
echo "  pm2 logs [app-name]  - Show logs for specific service"
echo "  pm2 restart all      - Restart all services"
echo "  pm2 stop all         - Stop all services"
echo "  pm2 delete all       - Delete all services"
echo ""
echo "🗂️ Log files are stored in the 'logs' directory:"
echo "  logs/api-gateway-*.log"
echo "  logs/tiktok-fetcher-*.log"
echo "  logs/tiktok-transformer-*.log"
echo "  logs/tiktok-loader-*.log"
echo "  logs/tiktok-receipt-*.log"
