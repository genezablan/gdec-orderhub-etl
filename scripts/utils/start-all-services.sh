#!/bin/bash

# Complete Services Startup Script
echo "🚀 Starting all services for GDEC OrderHub ETL..."

# Start PostgreSQL
echo "📊 Starting PostgreSQL..."
sudo service postgresql start

# Start Redis
echo "🔴 Starting Redis..."
redis-server --daemonize yes

# Start MongoDB
echo "🍃 Starting MongoDB..."
if ! pgrep -x "mongod" > /dev/null; then
    sudo mongod --fork --logpath /var/log/mongodb/mongod.log --dbpath /var/lib/mongodb
fi

# Wait for services to start
sleep 3

# Verify services
echo "🔍 Checking service status..."

# Check PostgreSQL
if sudo service postgresql status > /dev/null 2>&1; then
    echo "✅ PostgreSQL: Running"
else
    echo "❌ PostgreSQL: Not running"
fi

# Check Redis
if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis: Running"
else
    echo "❌ Redis: Not running"
fi

# Check MongoDB
if pgrep -x "mongod" > /dev/null; then
    echo "✅ MongoDB: Running"
else
    echo "❌ MongoDB: Not running"
fi

echo ""
echo "🎉 Service startup complete!"
echo "You can now run: npm run start:all"
