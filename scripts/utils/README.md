# Utility Scripts

General utility scripts for maintenance, debugging, and configuration.

## Scripts

### `flush-redis.sh`
Flushes all Redis cache data.

**Usage:**
```bash
cd scripts/utils && ./flush-redis.sh
```

**What it does:**
- Connects to Redis server
- Flushes all cached data
- Confirms operation success

### `verify-env-config.ts`
Verifies that all required environment variables are properly configured.

**Usage:**
```bash
cd scripts/utils && npx ts-node verify-env-config.ts
```

**What it checks:**
- Database connection strings
- AWS credentials and configuration
- Redis connection parameters
- Required API keys and secrets
- Port configurations

## Environment Variables

The utility scripts may require the following environment variables:

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=optional-password

# AWS Configuration (for verification)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_COGNITO_REGION=ap-southeast-1

# Database connections (for verification)
ORDERHUB_DB_HOST=localhost
SCROOGE_DB_HOST=localhost
TIKTOK_DB_HOST=localhost
```

## Quick Commands

### Clean Cache
```bash
cd scripts/utils && ./flush-redis.sh
```

### Verify Configuration
```bash
cd scripts/utils && npx ts-node verify-env-config.ts
```

### Health Check
```bash
curl http://localhost:3000/health
```

## Troubleshooting

### Redis Connection Issues
1. Check if Redis is running: `redis-cli ping`
2. Verify connection parameters in `.env`
3. Check network connectivity

### Environment Variable Issues
1. Run environment verification script
2. Check `.env` file exists and is readable
3. Verify all required variables are set

### Permission Issues
1. Ensure scripts are executable: `chmod +x scripts/utils/*.sh`
2. Check file ownership and permissions
3. Run with appropriate user privileges
