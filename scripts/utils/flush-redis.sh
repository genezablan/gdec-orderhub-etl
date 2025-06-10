#!/bin/bash

# Load environment variables if .env file exists
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Set default Redis URL if not provided
REDIS_URL=${REDIS_URL:-"redis://localhost:6379"}

echo "🔗 Connecting to Redis..."
echo "📍 Redis URL: $REDIS_URL"

# Extract host and port from Redis URL
if [[ $REDIS_URL == redis://* ]]; then
    # Remove redis:// prefix
    REDIS_HOST_PORT=${REDIS_URL#redis://}
    # Extract host and port
    if [[ $REDIS_HOST_PORT == *:* ]]; then
        REDIS_HOST=${REDIS_HOST_PORT%:*}
        REDIS_PORT=${REDIS_HOST_PORT#*:}
    else
        REDIS_HOST=$REDIS_HOST_PORT
        REDIS_PORT=6379
    fi
else
    REDIS_HOST="localhost"
    REDIS_PORT=6379
fi

echo "🔗 Redis Host: $REDIS_HOST"
echo "🔗 Redis Port: $REDIS_PORT"

# Test Redis connection
if ! redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping > /dev/null 2>&1; then
    echo "❌ Error: Cannot connect to Redis at $REDIS_HOST:$REDIS_PORT"
    echo "💡 Make sure Redis is running and accessible"
    exit 1
fi

echo "✅ Connected to Redis successfully"

# Count current keys
KEY_COUNT=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" DBSIZE)
echo "🔢 Total keys before flush: $KEY_COUNT"

if [ "$KEY_COUNT" -eq 0 ]; then
    echo "ℹ️  No keys to flush"
    exit 0
fi

# Show some sample keys
echo "📋 Sample keys:"
redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" KEYS "*" | head -5

# Ask for confirmation
echo ""
read -p "❓ Are you sure you want to flush all $KEY_COUNT Redis keys? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Operation cancelled"
    exit 0
fi

# Flush all keys
echo "🗑️  Flushing all Redis keys..."
redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" FLUSHDB

# Verify flush
NEW_KEY_COUNT=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" DBSIZE)
echo "✅ Redis flush completed successfully"
echo "🔢 Total keys after flush: $NEW_KEY_COUNT"

if [ "$NEW_KEY_COUNT" -eq 0 ]; then
    echo "🎉 All keys have been successfully removed"
else
    echo "⚠️  Warning: Some keys may still exist"
fi

echo "🏁 Script completed"
