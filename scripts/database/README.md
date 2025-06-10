# Database Scripts

This directory contains all database-related scripts for migrations, connections, and data management.

## Scripts

### `run_migration.js/.ts`
Runs database migrations for the OrderHub database.

**Usage:**
```bash
cd scripts/database
npx ts-node run_migration.ts
```

### `database_orderhub_migration.js/.ts`
Contains the actual migration logic and schema updates.

### `test-db-connection.ts`
Tests database connectivity and validates connection parameters.

**Usage:**
```bash
cd scripts/database
npx ts-node test-db-connection.ts
```

## Environment Variables Required

```bash
# OrderHub Database
ORDERHUB_DB_HOST=localhost
ORDERHUB_DB_PORT=5432
ORDERHUB_DB_NAME=orderhub
ORDERHUB_DB_USER=username
ORDERHUB_DB_PASS=password

# Scrooge Database  
SCROOGE_DB_HOST=localhost
SCROOGE_DB_PORT=5432
SCROOGE_DB_NAME=scrooge
SCROOGE_DB_USER=username
SCROOGE_DB_PASS=password

# TikTok Database
TIKTOK_DB_HOST=localhost
TIKTOK_DB_PORT=5432
TIKTOK_DB_NAME=tiktok
TIKTOK_DB_USER=username
TIKTOK_DB_PASS=password
```

## Quick Start

1. **Test database connections:**
   ```bash
   cd scripts/database
   npx ts-node test-db-connection.ts
   ```

2. **Run migrations:**
   ```bash
   cd scripts/database
   npx ts-node run_migration.ts
   ```

## Migration Process

The migration scripts handle:
- Schema creation and updates
- Data transformations
- Index creation
- Constraint management
- Rollback capabilities
