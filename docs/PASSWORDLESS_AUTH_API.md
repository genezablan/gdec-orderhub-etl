# Passwordless Authentication API Documentation

## Overview

The Great Deals Corp Order Hub ETL system implements a secure passwordless authentication flow using AWS Cognito with custom Lambda triggers. Users authenticate using only their email address and receive OTP codes via email for verification.

## Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │    │ API Gateway │    │   Cognito   │    │   Lambda    │
│             │    │             │    │ User Pool   │    │ Functions   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │ 1. Initiate       │                   │                   │
       │ ───────────────► │                   │                   │
       │                   │ 2. Custom Auth    │                   │
       │                   │ ───────────────► │                   │
       │                   │                   │ 3. Create Challenge│
       │                   │                   │ ───────────────► │
       │                   │                   │                   │ 4. Send OTP Email
       │                   │                   │                   │ ────────────────►
       │                   │                   │ 5. Challenge Data │                SES
       │                   │                   │ ◄─────────────── │
       │                   │ 6. Session Token  │                   │
       │                   │ ◄─────────────── │                   │
       │ 7. Session + Msg  │                   │                   │
       │ ◄─────────────── │                   │                   │
       │                   │                   │                   │
       │ 8. Verify OTP     │                   │                   │
       │ ───────────────► │                   │                   │
       │                   │ 9. Respond to     │                   │
       │                   │    Challenge      │                   │
       │                   │ ───────────────► │                   │
       │                   │                   │ 10. Verify OTP    │
       │                   │                   │ ───────────────► │
       │                   │                   │ 11. Result        │
       │                   │                   │ ◄─────────────── │
       │                   │ 12. JWT Tokens    │                   │
       │                   │ ◄─────────────── │                   │
       │ 13. Auth Success  │                   │                   │
       │ ◄─────────────── │                   │                   │
```

## API Endpoints

### Base URL
```
http://localhost:3000/auth
```

### 1. Initiate Passwordless Sign-In

Starts the passwordless authentication flow by sending an OTP code to the user's email.

**Endpoint:** `POST /auth/passwordless/initiate`

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Verification code sent to your email address. Please check your inbox.",
  "session": "AYABeNp0axFQM8nWDXzGrCoOQoIAHQABAAdTZXJ2aWNlABBDb2duaXRvVXNlclBvb2xzAAEAB2F3cy1rbXMAUGFybjphd3M6a21zOmFwLXNvdXRoZWFzdC0xOjAzMTU3NzI0MDA0ODprZXkvYmEwNzA1YzktMTI0Mi00ODg1LWJhMmYtNDhiMWNjYTNiNDNmALgBAgEAePlZjnuzMigeBhd7j3r5BNX7R8efbv8cmJ1p4sdawJBQAWpyCdIY74hYv_2SEtwk4doAAAB-MHwGCSqGSIb3DQEHBqBvMG0CAQAwaAYJKoZIhvcNAQcBMB4GCWCGSAFlAwQBLjARBAwaoSVgES2jVOLFt7sCARCAO55ezGsoA10hugK1SovUyogHWATHEDUHD3HIirEsPSRjLLkXVYa-_1_VQ0q93czquWo7OID_ebrbSwkwAgAAAAAMAAAQAAAAAAAAAAAAAAAAAKV92MyJbiIpZy8HMistCnP_____AAAAAQAAAAAAAAAAAAAAAQAAAStVpDMuLOFpDYvC28IQl4QQdbS0NQyfWy7O9mgNVgJ4FKFlMRlaw4O7xKnDx56QM0XAaK4TiSJjpLZTvK-2LDe8WnaghfrX6-AA-C5wwLhJX5z4tXEiZ9yrw1-ZQyRO0bwwt-kXwjelJ7rrS2ukODjID3ycZsx_fZjk4yMlHrAXJ-r6OzpW62lSZQTEN1epBBfnvpi5_sHLxP9AhYtEeJF2HRulCu0QXngbZCTOFwofWRPSz9d-uO91wJ-d5HUbxDLe5uhwhkTo5UV1kFMWZhafadQzjhwBDKbvuNf9w1zBTsBNdAtydJortUz_S23MDBVPyAwlsSiHozYPHMTPeIdJ38_G32HFbhvj6otH55SjXfTFuapWBzl6DDlZKMLRA4fWaokMNGNEH3vmviVVu47XpTt5tKRs60DfYVo"
}
```

**Error Responses:**
```json
// User not found
{
  "statusCode": 400,
  "message": "User not found. Please contact support.",
  "error": "Bad Request"
}

// Invalid email
{
  "statusCode": 400,
  "message": "Invalid email address.",
  "error": "Bad Request"
}

// Rate limiting
{
  "statusCode": 400,
  "message": "Too many requests. Please try again later.",
  "error": "Bad Request"
}
```

### 2. Verify OTP Code

Verifies the OTP code received via email and completes the authentication process.

**Endpoint:** `POST /auth/passwordless/verify`

**Request:**
```json
{
  "email": "user@example.com",
  "code": "123456",
  "session": "AYABeNp0axFQM8nWDXzGrCoOQoIAHQABAAdTZXJ2aWNlABBDb2duaXRvVXNlclBvb2xzAAEAB2F3cy1rbXMAUGFybjphd3M6a21zOmFwLXNvdXRoZWFzdC0xOjAzMTU3NzI0MDA0ODprZXkvYmEwNzA1YzktMTI0Mi00ODg1LWJhMmYtNDhiMWNjYTNiNDNmALgBAgEAePlZjnuzMigeBhd7j3r5BNX7R8efbv8cmJ1p4sdawJBQAWpyCdIY74hYv_2SEtwk4doAAAB-MHwGCSqGSIb3DQEHBqBvMG0CAQAwaAYJKoZIhvcNAQcBMB4GCWCGSAFlAwQBLjARBAwaoSVgES2jVOLFt7sCARCAO55ezGsoA10hugK1SovUyogHWATHEDUHD3HIirEsPSRjLLkXVYa-_1_VQ0q93czquWo7OID_ebrbSwkwAgAAAAAMAAAQAAAAAAAAAAAAAAAAAKV92MyJbiIpZy8HMistCnP_____AAAAAQAAAAAAAAAAAAAAAQAAAStVpDMuLOFpDYvC28IQl4QQdbS0NQyfWy7O9mgNVgJ4FKFlMRlaw4O7xKnDx56QM0XAaK4TiSJjpLZTvK-2LDe8WnaghfrX6-AA-C5wwLhJX5z4tXEiZ9yrw1-ZQyRO0bwwt-kXwjelJ7rrS2ukODjID3ycZsx_fZjk4yMlHrAXJ-r6OzpW62lSZQTEN1epBBfnvpi5_sHLxP9AhYtEeJF2HRulCu0QXngbZCTOFwofWRPSz9d-uO91wJ-d5HUbxDLe5uhwhkTo5UV1kFMWZhafadQzjhwBDKbvuNf9w1zBTsBNdAtydJortUz_S23MDBVPyAwlsSiHozYPHMTPeIdJ38_G32HFbhvj6otH55SjXfTFuapWBzl6DDlZKMLRA4fWaokMNGNEH3vmviVVu47XpTt5tKRs60DfYVo"
}
```

**Success Response:**
```json
{
  "accessToken": "eyJraWQiOiJVK3pOXC9cL1wvXC8xQT09IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiJjOWZhODVhYy02MDIxLTcwMzctZWY5NC01Yzk5Yzc1YmNjYzciLCJhdWQiOiJ0ZGI0NHRmcHFwN2hlb3M3aDJjaG4wbHM1IiwiY29nbml0bzp1c2VybmFtZSI6ImM5ZmE4NWFjLTYwMjEtNzAzNy1lZjk0LTVjOTljNzViY2NjNyIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuYXAtc291dGhlYXN0LTEuYW1hem9uYXdzLmNvbVwvYXAtc291dGhlYXN0LTFfRXNwSHlsVUpHIiwiY29nbml0bzp1c2VybmFtZSI6ImM5ZmE4NWFjLTYwMjEtNzAzNy1lZjk0LTVjOTljNzViY2NjNyIsImVtYWlsIjoiZ20uemFibGFuQGdyZWF0ZGVhbHNjb3JwLmNvbSIsImF1ZCI6InRkYjQ0dGZwcXA3aGVvczdomOjaG4wbHM1IiwiZXZlbnRfaWQiOiJlZTczNDMxOC1kYTQ4LTQ1MDEtOGI4My1mMTdlN2FkZGZhZTMiLCJ0b2tlbl91c2UiOiJpZCIsImF1dGhfdGltZSI6MTc0OTUyMTQ0MSwiZXhwIjoxNzQ5NTI1MDQxLCJpYXQiOjE3NDk1MjE0NDF9.example-signature",
  "refreshToken": "eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ.example-refresh-token",
  "idToken": "eyJraWQiOiJVK3pOXC9cL1wvXC8xQT09IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiJjOWZhODVhYy02MDIxLTcwMzctZWY5NC01Yzk5Yzc1YmNjYzciLCJhdWQiOiJ0ZGI0NHRmcHFwN2hlb3M3aDJjaG4wbHM1IiwiY29nbml0bzp1c2VybmFtZSI6ImM5ZmE4NWFjLTYwMjEtNzAzNy1lZjk0LTVjOTljNzViY2NjNyIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuYXAtc291dGhlYXN0LTEuYW1hem9uYXdzLmNvbVwvYXAtc291dGhlYXN0LTFfRXNwSHlsVUpHIiwiY29nbml0bzp1c2VybmFtZSI6ImM5ZmE4NWFjLTYwMjEtNzAzNy1lZjk0LTVjOTljNzViY2NjNyIsImVtYWlsIjoiZ20uemFibGFuQGdyZWF0ZGVhbHNjb3JwLmNvbSIsImF1ZCI6InRkYjQ0dGZwcXA3aGVvczdomOjaG4wbHM1IiwiZXZlbnRfaWQiOiJlZTczNDMxOC1kYTQ4LTQ1MDEtOGI4My1mMTdlN2FkZGZhZTMiLCJ0b2tlbl91c2UiOiJpZCIsImF1dGhfdGltZSI6MTc0OTUyMTQ0MSwiZXhwIjoxNzQ5NTI1MDQxLCJpYXQiOjE3NDk1MjE0NDF9.example-id-token-signature",
  "expiresIn": 3600,
  "user": {
    "email": "user@example.com",
    "sub": "c9fa85ac-6021-7037-ef94-5c99c75bccc7",
    "emailVerified": true
  }
}
```

**Error Responses:**
```json
// Invalid verification code
{
  "statusCode": 401,
  "message": "Invalid verification code",
  "error": "Unauthorized"
}

// Expired verification code
{
  "statusCode": 401,
  "message": "Verification code has expired. Please request a new one.",
  "error": "Unauthorized"
}

// Missing session
{
  "statusCode": 400,
  "message": "Session is required for code verification",
  "error": "Bad Request"
}

// User not found
{
  "statusCode": 401,
  "message": "User not found. Please initiate sign-in again.",
  "error": "Unauthorized"
}
```

### 3. Refresh Token

Refreshes an expired access token using a valid refresh token.

**Endpoint:** `POST /auth/refresh`

**Request:**
```json
{
  "refreshToken": "eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ.example-refresh-token"
}
```

**Success Response:**
```json
{
  "accessToken": "eyJraWQiOiJVK3pOXC9cL1wvXC8xQT09IiwiYWxnIjoiUlMyNTYifQ.new-access-token",
  "refreshToken": "eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ.same-refresh-token",
  "idToken": "eyJraWQiOiJVK3pOXC9cL1wvXC8xQT09IiwiYWxnIjoiUlMyNTYifQ.new-id-token",
  "expiresIn": 3600,
  "user": {
    "email": "user@example.com",
    "sub": "c9fa85ac-6021-7037-ef94-5c99c75bccc7",
    "emailVerified": true
  }
}
```

### 4. Resend Verification Code

Resends the OTP verification code to the user's email.

**Endpoint:** `POST /auth/passwordless/resend`

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Success Response:**
```json
{
  "message": "Verification code resent to your email"
}
```

## Authentication Flow Details

### Step 1: User Initiation
1. User enters their email address
2. System calls `POST /auth/passwordless/initiate`
3. If user doesn't exist, they are automatically created in Cognito
4. System triggers custom authentication flow

### Step 2: Lambda Functions Execute
1. **DefineAuthChallenge** - Determines the authentication flow
2. **CreateAuthChallenge** - Generates 6-digit OTP and sends email via SES
3. Session token is returned to client

### Step 3: Email Delivery
- User receives a professionally formatted email with OTP code
- Email contains HTML and text versions
- OTP expires in 5 minutes

### Step 4: Verification
1. User enters OTP code from email
2. System calls `POST /auth/passwordless/verify` with code and session
3. **VerifyAuthChallengeResponse** - Validates the OTP
4. If valid, JWT tokens are issued

### Step 5: Authenticated Session
- User receives access token, refresh token, and ID token
- Access token is used for subsequent API requests
- Refresh token can be used to get new access tokens

## Email Template

Users receive a beautifully formatted email with their verification code:

```html
<html>
  <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
      <h1 style="color: #333; margin-bottom: 20px;">Verification Code</h1>
      <p style="font-size: 16px; color: #666; margin-bottom: 30px;">
        Please use the following verification code to complete your sign-in:
      </p>
      <div style="background-color: #007bff; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: 8px; margin: 20px 0;">
        123456
      </div>
      <p style="font-size: 14px; color: #999; margin-top: 30px;">
        This code will expire in 5 minutes. If you didn't request this code, please ignore this email.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="font-size: 12px; color: #999;">
        Great Deals Corp - Order Hub ETL System
      </p>
    </div>
  </body>
</html>
```

## Security Features

### 1. **No Password Storage**
- No passwords are stored anywhere in the system
- Authentication is purely based on email verification

### 2. **Session-Based Security**
- Each authentication attempt gets a unique session token
- Sessions expire after a short period for security

### 3. **OTP Expiration**
- OTP codes expire after 5 minutes
- Users must request new codes if expired

### 4. **Rate Limiting**
- Cognito provides built-in rate limiting
- Prevents brute force attacks

### 5. **Email Verification**
- Only users with access to the email can authenticate
- Emails are sent via AWS SES with verified domain

### 6. **JWT Tokens**
- Industry-standard JWT tokens for session management
- Tokens include expiration and can be validated independently

## Error Handling

The API provides detailed error messages for different scenarios:

- **400 Bad Request**: Invalid input parameters
- **401 Unauthorized**: Authentication failures (invalid code, expired session)
- **429 Too Many Requests**: Rate limiting triggered
- **500 Internal Server Error**: Server-side issues

All errors include:
- Standardized error codes
- Human-readable messages
- Timestamps for debugging

## Example Client Implementation

### JavaScript/TypeScript Example

```typescript
class PasswordlessAuth {
  private baseUrl = 'http://localhost:3000/auth';
  
  async initiateSignIn(email: string) {
    const response = await fetch(`${this.baseUrl}/passwordless/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    if (!response.ok) {
      throw new Error('Failed to initiate sign-in');
    }
    
    return await response.json();
  }
  
  async verifyCode(email: string, code: string, session: string) {
    const response = await fetch(`${this.baseUrl}/passwordless/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, session })
    });
    
    if (!response.ok) {
      throw new Error('Failed to verify code');
    }
    
    return await response.json();
  }
  
  async refreshToken(refreshToken: string) {
    const response = await fetch(`${this.baseUrl}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    
    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }
    
    return await response.json();
  }
}
```

### Complete Authentication Flow Example

```typescript
async function authenticateUser(email: string) {
  const auth = new PasswordlessAuth();
  
  try {
    // Step 1: Initiate sign-in
    const { session } = await auth.initiateSignIn(email);
    console.log('Verification code sent to email');
    
    // Step 2: User enters code (in real app, this would be from user input)
    const otpCode = prompt('Enter the 6-digit code from your email:');
    
    // Step 3: Verify code
    const authResult = await auth.verifyCode(email, otpCode, session);
    
    // Step 4: Store tokens securely
    localStorage.setItem('accessToken', authResult.accessToken);
    localStorage.setItem('refreshToken', authResult.refreshToken);
    
    console.log('Authentication successful!', authResult.user);
    return authResult;
    
  } catch (error) {
    console.error('Authentication failed:', error.message);
    throw error;
  }
}
```

## Production Considerations

### 1. **Environment Variables**
Ensure the following environment variables are configured:
- `AWS_COGNITO_REGION`
- `AWS_COGNITO_USER_POOL_ID`
- `AWS_COGNITO_CLIENT_ID`
- `AWS_COGNITO_CLIENT_SECRET`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

### 2. **SES Configuration**
- Verify your sending domain in AWS SES
- Move out of SES sandbox for production
- Configure proper SPF/DKIM records

### 3. **Lambda Function Monitoring**
- Set up CloudWatch alerts for Lambda function errors
- Monitor email delivery rates
- Track authentication success/failure rates

### 4. **Rate Limiting**
- Consider additional rate limiting at the API Gateway level
- Implement client-side rate limiting for better UX

### 5. **Security Headers**
- Implement CORS properly for production domains
- Add security headers (HSTS, CSP, etc.)
- Use HTTPS in production

## Troubleshooting

### Common Issues

1. **Email not received**
   - Check SES sending statistics
   - Verify domain/email in SES
   - Check spam folder

2. **Session expired**
   - Sessions have short expiration (5-15 minutes)
   - User needs to restart authentication flow

3. **Invalid verification code**
   - Code may have expired (5 minutes)
   - User may have entered wrong code
   - Check Lambda function logs

4. **User not found**
   - User creation may have failed
   - Check Cognito User Pool for user existence

### Debugging

Check Lambda function logs:
```bash
aws logs filter-log-events \
  --log-group-name /aws/lambda/gdec-cognito-auth-create-auth-challenge \
  --start-time $(date -d '1 hour ago' +%s)000

aws logs filter-log-events \
  --log-group-name /aws/lambda/gdec-cognito-auth-verify-auth-challenge-response \
  --start-time $(date -d '1 hour ago' +%s)000
```

## Testing

### Manual Testing with curl

```bash
# Step 1: Initiate sign-in
curl -X POST http://localhost:3000/auth/passwordless/initiate \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Step 2: Verify with OTP (replace with actual session and code)
curl -X POST http://localhost:3000/auth/passwordless/verify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "code": "123456",
    "session": "actual-session-token-here"
  }'
```

### Automated Testing

Consider implementing integration tests that:
- Mock the Lambda functions for testing
- Test error scenarios (invalid codes, expired sessions)
- Validate JWT token structure and claims
- Test rate limiting behavior

---

*This documentation covers the complete passwordless authentication API implementation for the Great Deals Corp Order Hub ETL system.*
