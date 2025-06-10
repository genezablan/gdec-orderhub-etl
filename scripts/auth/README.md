# Authentication Scripts

This directory contains all authentication and AWS Cognito related scripts.

## Scripts

### `setup-custom-auth.sh`
Sets up AWS Cognito custom authentication with Lambda triggers.

**Usage:**
```bash
cd scripts/auth
./setup-custom-auth.sh
```

**What it does:**
- Creates IAM roles for Lambda functions
- Deploys Lambda functions for custom authentication
- Configures Cognito User Pool triggers
- Sets up SES permissions

### `setup-passwordless-cognito.sh`
Legacy Cognito setup script (deprecated - use setup-custom-auth.sh instead).

### `update-lambda-functions.sh` 
Updates existing Lambda functions with new code.

**Usage:**
```bash
cd scripts/auth
./update-lambda-functions.sh
```

## Lambda Functions

The `lambda-functions/` directory contains the actual Lambda function code:

### `define-auth-challenge.js`
Determines the authentication flow and challenge types.

### `create-auth-challenge.js`
Generates OTP codes and sends verification emails via SES.

### `verify-auth-challenge-response.js`
Validates user's OTP input against the generated code.

## Environment Variables Required

```bash
AWS_COGNITO_REGION=your-aws-region
AWS_COGNITO_USER_POOL_ID=your-user-pool-id
AWS_COGNITO_CLIENT_ID=your-client-id
AWS_COGNITO_CLIENT_SECRET=your-client-secret
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

## Quick Start

1. **Setup authentication system:**
   ```bash
   cd scripts/auth
   ./setup-custom-auth.sh
   ```

2. **Update Lambda functions after code changes:**
   ```bash
   cd scripts/auth
   ./update-lambda-functions.sh
   ```

3. **Test authentication:**
   ```bash
   curl -X POST http://localhost:3000/auth/passwordless/initiate \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com"}'
   ```
