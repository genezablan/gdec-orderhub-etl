# Deployment Scripts

Scripts for production deployment and server management.

## Scripts

### `start-server-prod.sh`
Starts the production server with PM2 process management.

**Usage:**
```bash
cd scripts/deployment
./start-server-prod.sh
```

**What it does:**
- Builds the application for production
- Starts services using PM2
- Configures production environment
- Sets up process monitoring
- Enables auto-restart on crashes

## Production Environment

Make sure you have the following configured for production:

### Environment Variables
```bash
NODE_ENV=production
PORT=3000

# Database connections (production values)
ORDERHUB_DB_HOST=prod-db-host
ORDERHUB_DB_USER=prod-user
# ... other production config
```

### PM2 Configuration
The production server uses PM2 for process management. Check `ecosystem.config.js` for configuration.

### SSL/HTTPS
Configure reverse proxy (nginx) for SSL termination in production.

## Deployment Checklist

1. **Build application:**
   ```bash
   npm run build
   ```

2. **Run database migrations:**
   ```bash
   cd scripts/database && npx ts-node run_migration.ts
   ```

3. **Start production server:**
   ```bash
   cd scripts/deployment && ./start-server-prod.sh
   ```

4. **Verify health:**
   ```bash
   curl http://localhost:3000/health
   ```

## Monitoring

- **PM2 status:** `pm2 status`
- **View logs:** `pm2 logs`
- **Restart services:** `pm2 restart all`
