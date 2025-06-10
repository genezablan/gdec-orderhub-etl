# Development Scripts

Scripts for local development and testing.

## Scripts

### `start-server.sh`
Starts the development server with hot reload.

**Usage:**
```bash
cd scripts/development
./start-server.sh
```

**What it does:**
- Starts NestJS in development mode
- Enables hot reload
- Loads environment variables
- Starts all microservices

## Development Workflow

1. **Start development server:**
   ```bash
   cd scripts/development && ./start-server.sh
   ```

2. **The server will start multiple services:**
   - API Gateway: http://localhost:3000
   - TikTok Fetcher: http://localhost:3001
   - TikTok Transformer: http://localhost:3002
   - TikTok Loader: http://localhost:3003
   - TikTok Receipt: http://localhost:3004

3. **Access API documentation:**
   - Swagger UI: http://localhost:3000/api
   - Health checks: http://localhost:3000/health

## Environment Setup

Make sure you have a `.env` file in the project root with all required variables.

Use the verification script to check your environment:
```bash
cd scripts/utils && npx ts-node verify-env-config.ts
```
