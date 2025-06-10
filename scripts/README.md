# Scripts Directory

This directory contains organized scripts for the GDEC Order Hub ETL system.

## Quick Start

Navigate to the appropriate script directory and run the script directly:

```bash
# Development
cd scripts/development && ./start-server.sh        # Start development server

# Database operations  
cd scripts/database && npx ts-node run_migration.ts # Run database migrations
cd scripts/database && npx ts-node test-db-connection.ts # Test DB connectivity

# Authentication setup
cd scripts/auth && ./setup-custom-auth.sh          # Setup authentication system
cd scripts/auth && ./setup-passwordless-cognito.sh # Setup Cognito user pool

# Utilities
cd scripts/utils && ./flush-redis.sh               # Clear Redis cache
cd scripts/utils && npx ts-node verify-env-config.ts # Verify environment variables

# Production deployment
cd scripts/deployment && ./start-server-prod.sh    # Start production server
```

## Directory Structure

```
scripts/
├── auth/                     # Authentication & Cognito scripts
│   ├── setup-custom-auth.sh
│   ├── setup-passwordless-cognito.sh
│   ├── update-lambda-functions.sh
│   └── lambda-functions/     # Lambda function source code
├── database/                 # Database migration & connection scripts
│   ├── run_migration.ts
│   ├── test-db-connection.ts
│   └── database_orderhub_migration.ts
├── development/              # Development server scripts
│   └── start-server.sh
├── deployment/               # Production deployment scripts
│   └── start-server-prod.sh
└── utils/                    # Utility & maintenance scripts
    ├── flush-redis.sh
    ├── flush-redis.ts
    └── verify-env-config.ts
```

## Script Categories

### Authentication (`auth/`)
- Setup passwordless authentication
- Deploy/update Lambda functions
- Configure Cognito triggers

### Database (`database/`)
- Run schema migrations
- Test database connectivity
- Manage data transformations

### Development (`development/`)
- Start development server with hot reload

### Deployment (`deployment/`)
- Start production server with PM2

## Common Commands

### Development Workflow
```bash
# 1. Verify environment setup
cd scripts/utils && npx ts-node verify-env-config.ts

# 2. Setup authentication (first time only)  
cd scripts/auth && ./setup-custom-auth.sh

# 3. Run database migrations
cd scripts/database && npx ts-node run_migration.ts

# 4. Start development server
cd scripts/development && ./start-server.sh
```

### Production Deployment
```bash
# 1. Build application
npm run build

# 2. Run migrations
cd scripts/database && npx ts-node run_migration.ts

# 3. Start production server
cd scripts/deployment && ./start-server-prod.sh
```

### Maintenance
```bash
# Clear Redis cache
cd scripts/utils && ./flush-redis.sh

# Test database connections
cd scripts/database && npx ts-node test-db-connection.ts

# Update Lambda functions
cd scripts/auth && ./update-lambda-functions.sh
```

## Documentation

Each category has its own README with detailed information:

- **[auth/README.md](auth/README.md)** - Authentication system setup
- **[database/README.md](database/README.md)** - Database operations
- **[deployment/README.md](deployment/README.md)** - Production deployment
- **[development/README.md](development/README.md)** - Development workflow
- **[utils/README.md](utils/README.md)** - Utility functions

## Environment Setup

Most scripts require environment variables to be configured. Check the `.env` file in the project root and refer to `.env.example` for required variables.

## Security Notes

- Never commit AWS credentials or sensitive data to version control
- Use environment variables for all sensitive configuration
- Rotate credentials regularly
- Follow least-privilege principles for AWS IAM roles
