# Access Control System

This document describes the access control system that allows admins to manage user access and users to request access to the application.

## Overview

The access control system provides:

1. **Authenticated API** to check current user's access status
2. **Authenticated API** for users to request access  
3. **Admin-only APIs** to manage users and process access requests
4. **Access Guard** to protect application routes

## Authentication Flow

1. **User logs in** through your existing authentication system (JWT/Cognito)
2. **User accesses protected routes** which check if they have application access
3. **If no access**, user can request access through the API
4. **Admin approves/rejects** access requests
5. **User gains access** to protected application features

## API Endpoints

### User Endpoints (Authentication Required)

#### Check My Access Status
```
GET /access-control/my-access
Authorization: Bearer {jwt_token}
```

Returns the current user's access status:
```json
{
  "hasAccess": true,
  "user": { /* user details */ },
  "message": "User has active access"
}
```

Possible responses:
- User has active access
- User exists but access is pending/inactive  
- Access request is pending/approved/rejected
- No access found (can request access)

#### Request Access
```
POST /access-control/request-access
Authorization: Bearer {jwt_token}
```

No body required - uses the authenticated user's email to create an access request.

### Admin-Only Endpoints (Requires Admin Role + Authentication)

All admin endpoints require both authentication and admin role.

#### Get Pending Access Requests
```
GET /access-control/requests/pending
Authorization: Bearer {jwt_token}
```

Returns all pending access requests that need admin approval.

#### Get All Access Requests
```
GET /access-control/requests
Authorization: Bearer {jwt_token}
```

Returns all access requests (pending, approved, rejected).

#### Process Access Request
```
PUT /access-control/requests/{id}/process
Authorization: Bearer {jwt_token}
```

Body:
```json
{
  "status": "approved|rejected",
  "adminNotes": "Optional admin notes",
  "assignedRole": "user|admin"
}
```

Approves or rejects an access request. If approved, automatically creates a user account.

#### User Management

All user management endpoints require authentication and admin role:

**Create User Directly:**
```
POST /access-control/users
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

Body:
```json
{
  "email": "newuser@company.com",
  "role": "user",
  "firstName": "John",
  "lastName": "Doe",
  "department": "IT",
  "jobTitle": "Developer"
}
```

**Get All Users:**
```
GET /access-control/users
Authorization: Bearer {jwt_token}
```

**Get User by ID:**
```
GET /access-control/users/{id}
Authorization: Bearer {jwt_token}
```

**Update User:**
```
PUT /access-control/users/{id}
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

Body:
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "department": "Marketing",
  "jobTitle": "Manager",
  "role": "user"
}
```

**Update User Status:**
```
PUT /access-control/users/{id}/status
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

Body:
```json
{
  "status": "suspended",
  "notes": "Account suspended for review"
}
```

**Delete User:**
```
DELETE /access-control/users/{id}
Authorization: Bearer {jwt_token}
```

#### Statistics
```
GET /access-control/stats
Authorization: Bearer {jwt_token}
```

Returns access control statistics for admin dashboard.

## Protecting Application Routes

Use the `AccessGuard` to protect application routes that require approved access:

```typescript
import { AccessGuard } from '@app/auth';

@Controller('orders')
@UseGuards(JwtAuthGuard, AccessGuard) // First authenticate, then check access
export class OrdersController {
  
  @Get()
  async getOrders() {
    // Only users with approved access can reach this endpoint
    // User details are available in request.user.dbUser
  }
}
```

## Access Flow

### For New Users:
1. **User logs in** through existing auth system (JWT/Cognito)
2. **User tries to access protected route** → Gets "Access denied" message
3. **User requests access** via `POST /access-control/request-access`
4. **Admin reviews request** via `GET /access-control/requests/pending`
5. **Admin approves/rejects** via `PUT /access-control/requests/{id}/process`
6. **If approved**, user account is automatically created with active status
7. **User can now access** protected application routes

### For Existing Users:
1. **User logs in** through existing auth system
2. **AccessGuard checks access** via `/access-control/my-access`
3. **If access granted**, proceed to protected routes
4. **If access denied**, show appropriate message with request option

## Database Schema

The entities are located in `@app/database-orderhub` library:

### Users Table (`User` entity)
- `id` (UUID, Primary Key)
- `email` (VARCHAR, Unique)
- `firstName` (VARCHAR, Nullable)
- `lastName` (VARCHAR, Nullable)
- `role` (ENUM: super_admin, admin, user, pending)
- `status` (ENUM: active, inactive, suspended)
- `cognitoUserId` (VARCHAR, Nullable) - For AWS Cognito integration
- `department` (VARCHAR, Nullable)
- `jobTitle` (VARCHAR, Nullable)
- `notes` (TEXT, Nullable) - Admin notes
- `lastLoginAt` (TIMESTAMP, Nullable)
- `approvedBy` (VARCHAR, Nullable) - Email of approving admin
- `approvedAt` (TIMESTAMP, Nullable)
- `createdAt` (TIMESTAMP)
- `updatedAt` (TIMESTAMP)

### Access Requests Table (`AccessRequest` entity)
- `id` (UUID, Primary Key)
- `email` (VARCHAR, Unique)
- `status` (ENUM: pending, approved, rejected)
- `adminNotes` (TEXT, Nullable) - Admin notes about the request
- `requestedRole` (VARCHAR, Nullable) - Requested role
- `processedBy` (VARCHAR, Nullable) - Email of processing admin
- `processedAt` (TIMESTAMP, Nullable)
- `createdAt` (TIMESTAMP)
- `updatedAt` (TIMESTAMP)

## Integration

### Frontend Integration

```typescript
// Check current user's access status
const checkMyAccess = async () => {
  const response = await fetch('/api/access-control/my-access', {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json' 
    }
  });
  return response.json();
};

// Request access for current user
const requestAccess = async () => {
  const response = await fetch('/api/access-control/request-access', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json' 
    }
  });
  return response.json();
};

// Example React component
function AccessControl() {
  const [accessStatus, setAccessStatus] = useState(null);
  
  useEffect(() => {
    checkMyAccess().then(setAccessStatus);
  }, []);
  
  if (!accessStatus?.hasAccess) {
    return (
      <div>
        <p>{accessStatus?.message}</p>
        <button onClick={requestAccess}>
          Request Access
        </button>
      </div>
    );
  }
  
  return <MainApplication />;
}
```

### Backend Integration

```typescript
import { AccessGuard, AccessControlService, UserRole } from '@app/auth';
import { User, AccessRequest } from '@app/database-orderhub';

// Protect application routes
@Controller('orders')
@UseGuards(JwtAuthGuard, AccessGuard)
export class OrdersController {
  @Get()
  async getOrders(@User() user: any) {
    // user.dbUser contains the full user record with role/status
    return this.ordersService.getOrders();
  }
}

// Admin-only routes
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  // Only admins can access these endpoints
}

// In your service
constructor(private accessControlService: AccessControlService) {}

// Check if user has access programmatically
const hasAccess = await this.accessControlService.checkAccess(email);
```

## Security Considerations

1. **Role-based Access Control**: Only admins can manage users and process requests
2. **Request Validation**: Prevents duplicate requests and handles edge cases
3. **Status Tracking**: Full audit trail of access requests and approvals
4. **Guard Integration**: Seamless integration with existing JWT and role guards

## Migration

The database migration is located in `libs/database-orderhub/src/migrations/`.

Run the database migration to create the necessary tables:

```bash
# Add the migration to your TypeORM config
# Then run:
npm run migration:run
```

Or run the migration script directly in your database setup.

Make sure to add the new entities to your TypeORM configuration:

```typescript
// In your app module or database config
import { User, AccessRequest } from '@app/database-orderhub';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      // ... other config
      entities: [
        User,
        AccessRequest,
        // ... other entities
      ],
    }),
  ],
})
export class AppModule {}
```

## Role Hierarchy

The access control system implements a three-tier role hierarchy:

### Super Admin Role
- **Access Level**: Highest level access to all system functionality
- **User Management**: Can manage all users including other admins and super admins
- **Role Assignment**: Can assign any role except super admin (for security)
- **Access Requests**: Can process all access requests
- **Statistics**: Full access to all system statistics

### Admin Role  
- **Access Level**: Can manage regular users only
- **User Management**: Can only manage users with "user" or "pending" roles
- **Role Assignment**: Can only assign "user" role to others
- **Access Requests**: Can process access requests (assigns "user" role by default)
- **Statistics**: Access to user statistics within their scope
- **Restrictions**: Cannot manage other admins or super admins

### User Role
- **Access Level**: Standard application access
- **User Management**: No user management capabilities
- **Role Assignment**: Cannot assign roles
- **Access Requests**: Can only request access for themselves
- **Statistics**: No access to administrative statistics

### Role Hierarchy Rules

1. **Super Admin** can manage:
   - All admins
   - All regular users
   - All pending users
   - Can create users with admin or user roles

2. **Admin** can manage:
   - Regular users only
   - Pending users only
   - Can create users with user role only
   - Cannot modify other admins or super admins

3. **User** can manage:
   - No other users
   - Can only access their own profile information

### Role-Based API Access

All admin endpoints now support both admin and super admin roles:

```typescript
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
```

The system automatically enforces role hierarchy in all user management operations:

- `GET /access-control/users` - Returns only users the current role can manage
- `PUT /access-control/users/{id}` - Only allows updates to users within scope
- `DELETE /access-control/users/{id}` - Only allows deletion of users within scope
- `POST /access-control/users` - Validates role assignment permissions
