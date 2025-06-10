#!/bin/bash

# MongoDB Auto-Start Script
echo "🚀 Starting MongoDB..."

# Check if MongoDB is already running
if pgrep -x "mongod" > /dev/null; then
    echo "✅ MongoDB is already running"
    exit 0
fi

# Start MongoDB in background
sudo mongod --fork --logpath /var/log/mongodb/mongod.log --dbpath /var/lib/mongodb

# Wait a moment for startup
sleep 2

# Verify it started
if pgrep -x "mongod" > /dev/null; then
    echo "✅ MongoDB started successfully"
    echo "📊 MongoDB is running on port 27017"
else
    echo "❌ Failed to start MongoDB"
    exit 1
fi
