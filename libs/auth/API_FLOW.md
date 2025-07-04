# Access Control API Flow

This document describes the complete API flow for the access control system, starting from user login through accessing protected application features.

## 🔐 Complete User Journey

### Phase 1: User Authentication & Initial Access Check

#### 1. User Login (Passwordless Flow)

**Step 1: Initiate Passwordless Login**
```http
POST /auth/passwordless/initiate
Content-Type: application/json

{
  "email": "user@company.com"
}
```

**Response (Success):**
```json
{
  "message": "Verification code sent to your email",
  "sessionId": "session-uuid-12345"
}
```

**Step 2: Verify Code and Complete Login**
```http
POST /auth/passwordless/verify
Content-Type: application/json

{
  "sessionId": "session-uuid-12345",
  "code": "123456"
}
```

**Response (Success):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "email": "user@company.com",
    "sub": "cognito-user-id"
  }
}
```

#### 2. Check Access Status
After successful login, the user's first request should check their access status:

```http
GET /access-control/my-access
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Possible Responses:**

**A) User Has Access:**
```json
{
  "hasAccess": true,
  "user": {
    "id": "user-uuid",
    "email": "user@company.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "status": "active",
    "department": "IT",
    "jobTitle": "Developer"
  },
  "message": "User has active access"
}
```

**B) User Needs to Request Access:**
```json
{
  "hasAccess": false,
  "message": "No access. User can request access."
}
```

**C) Access Request Pending:**
```json
{
  "hasAccess": false,
  "accessRequest": {
    "id": "request-uuid",
    "email": "user@company.com",
    "status": "pending",
    "createdAt": "2025-07-04T10:00:00Z"
  },
  "message": "Access request is pending"
}
```

**D) Access Request Rejected:**
```json
{
  "hasAccess": false,
  "accessRequest": {
    "id": "request-uuid",
    "email": "user@company.com",
    "status": "rejected",
    "adminNotes": "Not authorized for this application",
    "processedAt": "2025-07-04T11:00:00Z"
  },
  "message": "Access request is rejected"
}
```

### Phase 2: Request Access (If Needed)

#### 3. User Requests Access
If the user doesn't have access, they can request it:

```http
POST /access-control/request-access
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (Success):**
```json
{
  "id": "request-uuid",
  "email": "user@company.com",
  "status": "pending",
  "createdAt": "2025-07-04T10:00:00Z",
  "message": "Access request submitted successfully"
}
```

**Response (Already Exists):**
```json
{
  "statusCode": 409,
  "message": "Access request already exists and is pending"
}
```

### Phase 3: Admin Processing (Admin Side)

#### 4. Admin Views Pending Requests
Admins can see all pending access requests:

```http
GET /access-control/requests/pending
Authorization: Bearer {admin_jwt_token}
```

**Response:**
```json
[
  {
    "id": "request-uuid",
    "email": "user@company.com",
    "status": "pending",
    "createdAt": "2025-07-04T10:00:00Z",
    "displayName": "user@company.com"
  },
  {
    "id": "request-uuid-2",
    "email": "newuser@company.com",
    "status": "pending",
    "createdAt": "2025-07-04T10:30:00Z",
    "displayName": "newuser@company.com"
  }
]
```

#### 5. Admin Approves/Rejects Request
Admin processes the access request:

```http
PUT /access-control/requests/{request-id}/process
Authorization: Bearer {admin_jwt_token}
Content-Type: application/json

{
  "status": "approved",
  "adminNotes": "Approved for IT team access",
  "assignedRole": "user"
}
```

**Response (Approval):**
```json
{
  "id": "request-uuid",
  "email": "user@company.com",
  "status": "approved",
  "adminNotes": "Approved for IT team access",
  "processedBy": "admin@company.com",
  "processedAt": "2025-07-04T11:00:00Z"
}
```

> **Note:** When approved, a user account is automatically created with the assigned role.

### Phase 4: User Gains Access

#### 6. User Checks Access Again
After admin approval, user checks access status again:

```http
GET /access-control/my-access
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (Now Has Access):**
```json
{
  "hasAccess": true,
  "user": {
    "id": "user-uuid",
    "email": "user@company.com",
    "role": "user",
    "status": "active",
    "approvedBy": "admin@company.com",
    "approvedAt": "2025-07-04T11:00:00Z",
    "createdAt": "2025-07-04T11:00:00Z"
  },
  "message": "User has active access"
}
```

### Phase 5: Accessing Protected Application Features

#### 7. User Accesses Protected Routes
Now the user can access application features protected by `AccessGuard`:

```http
GET /orders
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (Success):**
```json
{
  "orders": [
    {
      "id": "order-1",
      "customerName": "Customer A",
      "total": 100.00
    }
  ]
}
```

**Response (Access Denied - if user doesn't have access):**
```json
{
  "statusCode": 403,
  "message": "Access denied: No access. User can request access. Please contact an administrator if you need access.",
  "error": "Forbidden",
  "code": "NO_ACCESS_REQUEST_AVAILABLE",
  "accessResult": {
    "hasAccess": false,
    "message": "No access. User can request access."
  }
}
```

**Other possible error codes:**
- `ACCESS_REQUEST_PENDING` - User has pending access request
- `ACCESS_REQUEST_REJECTED` - User's access request was rejected
- `USER_ACCESS_INACTIVE` - User exists but access is inactive
- `USER_NOT_FOUND` - User not found in system
- `INSUFFICIENT_ROLE` - User lacks required role for admin endpoints

## 🔄 Frontend Implementation Flow

### React Example

```tsx
import React, { useState, useEffect } from 'react';

function App() {
  const [user, setUser] = useState(null);
  const [accessStatus, setAccessStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginStep, setLoginStep] = useState('email'); // 'email' | 'code' | 'authenticated'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      checkUserAccess();
    } else {
      setLoading(false);
    }
  }, []);

  const initiateLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/passwordless/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const result = await response.json();
      if (response.ok) {
        setSessionId(result.sessionId);
        setLoginStep('code');
        alert('Verification code sent to your email!');
      }
    } catch (error) {
      console.error('Error initiating login:', error);
    }
  };

  const verifyLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/passwordless/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, code })
      });

      const result = await response.json();
      if (response.ok) {
        localStorage.setItem('access_token', result.access_token);
        setLoginStep('authenticated');
        checkUserAccess();
      }
    } catch (error) {
      console.error('Error verifying login:', error);
    }
  };

  const checkUserAccess = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setLoginStep('email');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/access-control/my-access', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        }
      });

      const result = await response.json();
      setAccessStatus(result);
      
      if (result.hasAccess) {
        setUser(result.user);
        setLoginStep('authenticated');
      }
    } catch (error) {
      console.error('Error checking access:', error);
      localStorage.removeItem('access_token');
      setLoginStep('email');
    } finally {
      setLoading(false);
    }
  };

  const requestAccess = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/access-control/request-access', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        }
      });

      if (response.ok) {
        alert('Access request submitted successfully!');
        checkUserAccess(); // Refresh status
      }
    } catch (error) {
      console.error('Error requesting access:', error);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    setAccessStatus(null);
    setLoginStep('email');
    setEmail('');
    setCode('');
    setSessionId('');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  // Login flow - Enter email
  if (loginStep === 'email') {
    return (
      <div>
        <h2>Login</h2>
        <form onSubmit={initiateLogin}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Send Verification Code</button>
        </form>
      </div>
    );
  }

  // Login flow - Enter verification code
  if (loginStep === 'code') {
    return (
      <div>
        <h2>Enter Verification Code</h2>
        <p>Please check your email ({email}) for the verification code.</p>
        <form onSubmit={verifyLogin}>
          <input
            type="text"
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          <button type="submit">Verify & Login</button>
        </form>
        <button onClick={() => setLoginStep('email')}>
          Back to Email
        </button>
      </div>
    );
  }

  // User has access - show main application
  if (accessStatus?.hasAccess) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>Welcome {user.firstName || user.email}!</h1>
          <button onClick={logout}>Logout</button>
        </div>
        <MainApplication />
      </div>
    );
  }

  // User needs to request access
  if (accessStatus?.message === "No access. User can request access.") {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Access Required</h2>
          <button onClick={logout}>Logout</button>
        </div>
        <p>You need permission to access this application.</p>
        <button onClick={requestAccess}>
          Request Access
        </button>
      </div>
    );
  }

  // Access request is pending
  if (accessStatus?.accessRequest?.status === 'pending') {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Access Request Pending</h2>
          <button onClick={logout}>Logout</button>
        </div>
        <p>Your access request is being reviewed by an administrator.</p>
        <p>Request submitted: {new Date(accessStatus.accessRequest.createdAt).toLocaleDateString()}</p>
        <button onClick={checkUserAccess}>
          Check Status
        </button>
      </div>
    );
  }

  // Access request was rejected
  if (accessStatus?.accessRequest?.status === 'rejected') {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Access Request Rejected</h2>
          <button onClick={logout}>Logout</button>
        </div>
        <p>Your access request was not approved.</p>
        {accessStatus.accessRequest.adminNotes && (
          <p><strong>Admin Notes:</strong> {accessStatus.accessRequest.adminNotes}</p>
        )}
        <button onClick={requestAccess}>
          Request Access Again
        </button>
      </div>
    );
  }

  return <div>Something went wrong. Please try again.</div>;
}
```

## 🛡️ Backend Route Protection

### Protecting Controllers

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, AccessGuard } from '@app/auth';

// Option 1: Require authentication + access approval
@Controller('orders')
@UseGuards(JwtAuthGuard, AccessGuard)
export class OrdersController {
  @Get()
  async getOrders() {
    // Only users with approved access can reach this
    return this.ordersService.findAll();
  }
}

// Option 2: Admin-only access
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  @Get('users')
  async getUsers() {
    // Only admins can access this
    return this.userService.findAll();
  }
}

// Option 3: Public access (no guards)
@Controller('public')
export class PublicController {
  @Get('health')
  getHealth() {
    return { status: 'ok' };
  }
}
```

## 📊 Admin Dashboard Flow

### Admin Views All Access Requests

```http
GET /access-control/requests
Authorization: Bearer {admin_jwt_token}
```

### Admin Views Users

```http
GET /access-control/users
Authorization: Bearer {admin_jwt_token}
```

### Admin Updates User Status

```http
PUT /access-control/users/{user-id}/status
Authorization: Bearer {admin_jwt_token}
Content-Type: application/json

{
  "status": "suspended",
  "notes": "Temporary suspension for review"
}
```

### Admin Views Statistics

```http
GET /access-control/stats
Authorization: Bearer {admin_jwt_token}
```

**Response:**
```json
{
  "users": {
    "total": 25,
    "active": 20,
    "pending": 2,
    "inactive": 3
  },
  "requests": {
    "total": 15,
    "pending": 3,
    "approved": 10,
    "rejected": 2
  }
}
```

## 🚀 Integration Checklist

### Backend Setup
- [ ] Import `AuthModule` in your main app module
- [ ] Configure TypeORM with `User` and `AccessRequest` entities
- [ ] Run database migrations
- [ ] Add `@UseGuards(JwtAuthGuard, AccessGuard)` to protected routes
- [ ] Add `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.ADMIN)` to admin routes

### Frontend Setup
- [ ] Implement login flow
- [ ] Add access status check after login
- [ ] Create access request UI
- [ ] Create pending/rejected status displays
- [ ] Add admin dashboard for managing requests
- [ ] Handle 403 errors gracefully

### Database Setup
- [ ] Generate and run migrations for `users` and `access_requests` tables
- [ ] Create initial admin user
- [ ] Configure database connection in TypeORM

This flow ensures a secure, user-friendly access control system where users can self-request access while maintaining full admin control over permissions.
