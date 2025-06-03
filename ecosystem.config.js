require('dotenv').config();

module.exports = {
  apps: [
    {
      name: 'api-gateway',
      script: 'dist/apps/api-gateway/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        ...process.env
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        ...process.env
      },
      error_file: 'logs/api-gateway-error.log',
      out_file: 'logs/api-gateway-out.log',
      log_file: 'logs/api-gateway-combined.log',
      time: true
    },
    {
      name: 'tiktok-fetcher',
      script: 'dist/apps/tiktok-fetcher/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
        ...process.env
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        ...process.env
      },
      error_file: 'logs/tiktok-fetcher-error.log',
      out_file: 'logs/tiktok-fetcher-out.log',
      log_file: 'logs/tiktok-fetcher-combined.log',
      time: true
    },
    {
      name: 'tiktok-transformer',
      script: 'dist/apps/tiktok-transformer/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3002,
        ...process.env
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3002,
        ...process.env
      },
      error_file: 'logs/tiktok-transformer-error.log',
      out_file: 'logs/tiktok-transformer-out.log',
      log_file: 'logs/tiktok-transformer-combined.log',
      time: true
    },
    {
      name: 'tiktok-loader',
      script: 'dist/apps/tiktok-loader/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3003,
        ...process.env
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3003,
        ...process.env
      },
      error_file: 'logs/tiktok-loader-error.log',
      out_file: 'logs/tiktok-loader-out.log',
      log_file: 'logs/tiktok-loader-combined.log',
      time: true
    },
    {
      name: 'tiktok-receipt',
      script: 'dist/apps/tiktok-receipt/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3004,
        PUPPETEER_ARGS: '--no-sandbox,--disable-setuid-sandbox,--disable-dev-shm-usage,--disable-gpu',
        ...process.env
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3004,
        PUPPETEER_ARGS: '--no-sandbox,--disable-setuid-sandbox,--disable-dev-shm-usage,--disable-gpu',
        ...process.env
      },
      error_file: 'logs/tiktok-receipt-error.log',
      out_file: 'logs/tiktok-receipt-out.log',
      log_file: 'logs/tiktok-receipt-combined.log',
      time: true
    }
  ]
};
