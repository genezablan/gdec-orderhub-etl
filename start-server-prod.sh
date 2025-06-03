#!/bin/bash

# Start PM2 server for GDEC OrderHub ETL microservices in PRODUCTION mode
# This script starts all microservices using PM2 process manager with production configuration

echo "🚀 Starting GDEC OrderHub ETL microservices in PRODUCTION mode with PM2..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed. Installing PM2..."
    npm install -g pm2
fi

# Build the project first for production
echo "📦 Building the project for production..."
npm run build

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️ Warning: .env file not found in root directory"
    echo "Please copy .env.example to .env and configure your environment variables"
    exit 1
fi

# Verify dotenv can load the environment
echo "🔧 Verifying environment variables..."
node -e "
require('dotenv').config();
console.log('✅ NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('✅ MONGODB_SCROOGE_URI:', process.env.MONGODB_SCROOGE_URI ? process.env.MONGODB_SCROOGE_URI.substring(0, 50) + '...' : 'undefined');
console.log('✅ ORDERHUB_DB_HOST:', process.env.ORDERHUB_DB_HOST || 'undefined');
"

# Create logs directory if it doesn't exist
echo "📁 Creating logs directory..."
mkdir -p logs

# Stop and delete existing processes
echo "🛑 Stopping existing PM2 processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Start all services using ecosystem config in production mode
echo "🔧 Starting microservices in PRODUCTION mode with ecosystem configuration..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration for auto-restart on reboot
echo "💾 Saving PM2 configuration..."
pm2 save

# Set up PM2 startup script (run this once per server)
echo "🔄 Setting up PM2 startup script for auto-restart on server reboot..."
pm2 startup || echo "⚠️ PM2 startup already configured or needs manual setup"

# Show status
echo "✅ All services started in PRODUCTION mode! Current PM2 status:"
pm2 status

echo ""
echo "🔥 PRODUCTION MODE ACTIVE"
echo "📊 Useful PM2 commands:"
echo "  pm2 status           - Show status of all services"
echo "  pm2 monit            - Monitor services in real-time"
echo "  pm2 logs             - Show logs for all services"
echo "  pm2 logs [app-name]  - Show logs for specific service"
echo "  pm2 restart ecosystem.config.js --env production - Restart all services in production"
echo "  pm2 stop all         - Stop all services"
echo "  pm2 delete all       - Delete all services"
echo ""
echo "🗂️ Log files are stored in the 'logs' directory:"
echo "  logs/api-gateway-*.log"
echo "  logs/tiktok-fetcher-*.log"
echo "  logs/tiktok-transformer-*.log"
echo "  logs/tiktok-loader-*.log"
echo "  logs/tiktok-receipt-*.log"
echo ""
echo "🔧 Services will automatically restart if the server reboots!"
