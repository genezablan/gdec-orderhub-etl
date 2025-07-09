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

## Admin User Setup

### Initial Admin Creation Scripts

#### `create-initial-admin.sql`
Creates GM Zablan as a super admin user with email `gm.zablan@greatdealscorp.com`.

**Usage:**
```bash
psql -h your-db-host -U your-username -d your-database -f create-initial-admin.sql
```

#### `create-super-admin.sql`
Creates or updates GM Zablan as super admin user who can manage all users including other admins.

**Usage:**
```bash
psql -h your-db-host -U your-username -d your-database -f create-super-admin.sql
```

#### `setup-admin-users.sql`
Comprehensive script for setting up GM Zablan as the super admin user. This is the recommended script to run for initial setup.

**Usage:**
```bash
psql -h your-db-host -U your-username -d your-database -f setup-admin-users.sql
```

### Role Hierarchy

The system implements a three-tier role hierarchy:

- **Super Admin** (`super_admin`): Can manage all users including admins
- **Admin** (`admin`): Can only manage regular users, cannot manage other admins
- **User** (`user`): Standard application access only

### Prerequisites for Admin Setup

Before running admin setup scripts:
1. Generate and run TypeORM migrations for the `users` and `access_requests` tables
2. Ensure database connection is properly configured
3. Have proper database credentials

### Super Admin User Capabilities

The created super admin user (GM Zablan) will be able to:
- Log in using passwordless authentication with the email `gm.zablan@greatdealscorp.com`
- Access all admin endpoints
- Approve/reject access requests
- Manage all users including other admins
- Create admin and user accounts
- View system statistics
- Assign roles (admin or user) to other users

### Admin User Capabilities

Regular admin users can:
- Access admin endpoints
- Approve/reject access requests
- Manage only regular users (not other admins)
- Create user accounts only
- View limited system statistics

### Verification

After running the script, verify the users were created with correct roles:

```sql
SELECT email, role, status, job_title FROM users WHERE role IN ('super_admin', 'admin') ORDER BY role;
```

### Adding More Admins

To add more admin users, modify the `setup-admin-users.sql` script and add additional entries in the VALUES clause. Remember that only super admins can create other admin users through the API.
