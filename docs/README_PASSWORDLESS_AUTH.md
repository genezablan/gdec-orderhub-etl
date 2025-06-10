# Passwordless Authentication System

A secure, email-based passwordless authentication system built with AWS Cognito, Lambda, and SES.

## Quick Start

### 1. Initiate Sign-In
```bash
curl -X POST http://localhost:3000/auth/passwordless/initiate \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

**Response:**
```json
{
  "message": "Verification code sent to your email address. Please check your inbox.",
  "session": "session-token-here"
}
```

### 2. Check Email
User receives a 6-digit OTP code via email:

📧 **Your Verification Code - Great Deals Corp**
```
Your verification code is: 123456

This code will expire in 5 minutes.
```

### 3. Verify Code
```bash
curl -X POST http://localhost:3000/auth/passwordless/verify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "code": "123456",
    "session": "session-token-from-step-1"
  }'
```

**Response:**
```json
{
  "accessToken": "eyJraWQiOiJVK3pOXC9cL1wvXC8xQT09...",
  "refreshToken": "eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwi...",
  "idToken": "eyJraWQiOiJVK3pOXC9cL1wvXC8xQT09IiwiYWxnIjoi...",
  "expiresIn": 3600,
  "user": {
    "email": "user@example.com",
    "sub": "c9fa85ac-6021-7037-ef94-5c99c75bccc7",
    "emailVerified": true
  }
}
```

## How It Works

```
User → API Gateway → Cognito → Lambda → SES → Email
                ↓
     ← JWT Tokens ← Lambda ← Cognito ← API Gateway ← User enters OTP
```

1. **User enters email** → System sends OTP via AWS SES
2. **User receives email** → Contains 6-digit verification code
3. **User enters OTP** → System validates and issues JWT tokens
4. **Authenticated** → User can access protected resources

## Features

✅ **Truly Passwordless** - No passwords stored anywhere  
✅ **Email-Based** - Uses AWS SES for reliable email delivery  
✅ **Secure** - Built on AWS Cognito with custom Lambda triggers  
✅ **Stateless** - Works with multiple server instances  
✅ **JWT Tokens** - Industry-standard authentication tokens  
✅ **Auto User Creation** - Users are created automatically on first sign-in  
✅ **Beautiful Emails** - Professional HTML email templates  
✅ **Rate Limited** - Built-in protection against abuse  

## AWS Infrastructure

### Lambda Functions
- **define-auth-challenge** - Controls authentication flow
- **create-auth-challenge** - Generates OTP and sends email
- **verify-auth-challenge-response** - Validates OTP codes

### Services Used
- **AWS Cognito** - User management and authentication
- **AWS SES** - Email delivery
- **AWS Lambda** - Custom authentication logic
- **AWS CloudWatch** - Logging and monitoring

## Environment Setup

Required environment variables:
```bash
AWS_COGNITO_REGION=your-aws-region
AWS_COGNITO_USER_POOL_ID=your-user-pool-id
AWS_COGNITO_CLIENT_ID=your-client-id
AWS_COGNITO_CLIENT_SECRET=your-client-secret
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/passwordless/initiate` | Start authentication flow |
| `POST` | `/auth/passwordless/verify` | Verify OTP code |
| `POST` | `/auth/passwordless/resend` | Resend verification code |
| `POST` | `/auth/refresh` | Refresh access token |

## Error Handling

The API returns structured error responses:

```json
{
  "statusCode": 401,
  "message": "Invalid verification code",
  "error": "Unauthorized",
  "timestamp": "2025-06-10T02:50:41.019Z",
  "path": "/auth/passwordless/verify"
}
```

Common error scenarios:
- Invalid email address
- Expired verification code
- Invalid OTP code
- Missing session token
- Rate limiting exceeded

## Security

### Built-in Protections
- **OTP Expiration** - Codes expire in 5 minutes
- **Session Expiration** - Authentication sessions are short-lived
- **Rate Limiting** - Cognito provides built-in rate limiting
- **Email Verification** - Only email owners can authenticate
- **JWT Validation** - Tokens are cryptographically signed

### Best Practices Implemented
- No password storage
- Secure session management
- Professional email templates
- Comprehensive error handling
- Detailed logging for debugging

## Development

### Start the Server
```bash
npm run start:dev
```

### View Logs
```bash
# Application logs
npm run start:dev | tail -f

# Lambda function logs
aws logs filter-log-events \
  --log-group-name /aws/lambda/gdec-cognito-auth-create-auth-challenge \
  --start-time $(date -d '1 hour ago' +%s)000
```

### Test Authentication
```bash
# Test with your email
curl -X POST http://localhost:3000/auth/passwordless/initiate \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'
```

## Documentation

For complete API documentation, see: [PASSWORDLESS_AUTH_API.md](./PASSWORDLESS_AUTH_API.md)

## Production Deployment

1. **Configure SES** - Verify your domain and move out of sandbox
2. **Set Environment Variables** - Update production environment
3. **Monitor Lambda Functions** - Set up CloudWatch alerts
4. **Enable HTTPS** - Use SSL certificates in production
5. **Configure CORS** - Set proper origin restrictions

---

Built with ❤️ by the Great Deals Corp team using AWS serverless technologies.
