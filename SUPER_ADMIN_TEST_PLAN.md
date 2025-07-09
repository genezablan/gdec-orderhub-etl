# Super Admin Implementation Test Plan

## Test Scenarios

### 1. Role Hierarchy Tests

#### Super Admin Capabilities:
- ✅ Can view all users (admin and regular users)
- ✅ Can create users with admin or user roles 
- ✅ Can update any user (except other super admins)
- ✅ Can delete any user (except other super admins)
- ✅ Can promote users to admin role
- ✅ Can demote admins to user role
- ✅ Can process access requests

#### Admin Capabilities:
- ✅ Can view only regular users and pending users
- ✅ Can create users with user role only
- ✅ Can update only regular users 
- ✅ Can delete only regular users
- ✅ Cannot manage other admins or super admins
- ✅ Can process access requests (assigns user role)

#### User Capabilities:
- ✅ Cannot access any admin endpoints
- ✅ Can only check own access status
- ✅ Can only request access for themselves

### 2. API Endpoint Tests

#### Public Endpoints (Authenticated):
- `GET /access-control/my-access` - All authenticated users
- `POST /access-control/request-access` - All authenticated users

#### Admin + Super Admin Endpoints:
- `GET /access-control/requests/pending` - Admin & Super Admin
- `GET /access-control/requests` - Admin & Super Admin  
- `PUT /access-control/requests/{id}/process` - Admin & Super Admin
- `POST /access-control/users` - Admin & Super Admin (with role restrictions)
- `GET /access-control/users` - Admin & Super Admin (filtered by role)
- `GET /access-control/users/{id}` - Admin & Super Admin (with role checks)
- `PUT /access-control/users/{id}` - Admin & Super Admin (with role checks)
- `PUT /access-control/users/{id}/status` - Admin & Super Admin (with role checks)
- `DELETE /access-control/users/{id}` - Admin & Super Admin (with role checks)
- `GET /access-control/stats` - Admin & Super Admin

#### Super Admin Only Endpoints:
- `GET /access-control/admin-users` - Super Admin only
- `PUT /access-control/admin-users/{id}/promote` - Super Admin only
- `PUT /access-control/admin-users/{id}/demote` - Super Admin only

### 3. Database Setup Tests

#### Initial Setup:
- ✅ `setup-admin-users.sql` creates GM Zablan as super admin
- ✅ `create-super-admin.sql` creates/updates GM Zablan as super admin
- ✅ `create-initial-admin.sql` creates GM Zablan as super admin

#### Role Validation:
```sql
-- Verify super admin creation
SELECT email, role, status, job_title 
FROM users 
WHERE email = 'gm.zablan@greatdealscorp.com'
AND role = 'super_admin';
```

### 4. Role Enforcement Tests

#### Test Case 1: Admin tries to manage another admin
- Expected: 403 Forbidden with role permission error

#### Test Case 2: Admin tries to create admin user
- Expected: 400 Bad Request with role assignment error

#### Test Case 3: Super Admin manages admin user
- Expected: Success

#### Test Case 4: User tries to access admin endpoint
- Expected: 403 Forbidden with role requirement error

### 5. Frontend Integration Tests

#### Role-based UI:
- Super Admin: Shows all user management options
- Admin: Shows limited user management (users only)
- User: Shows no administrative options

#### API Error Handling:
- Handle role permission errors gracefully
- Show appropriate messages for different access levels

## Implementation Checklist

### Backend Changes:
- ✅ Added `SUPER_ADMIN` to UserRole enum
- ✅ Updated all imports to use database-orderhub enums
- ✅ Implemented role hierarchy logic in service
- ✅ Added role-based access control methods
- ✅ Updated controller with role permission checks
- ✅ Added super admin specific endpoints
- ✅ Updated guards to support multiple roles
- ✅ Enhanced error messages with role context

### Database Changes:
- ✅ Updated enum to include `super_admin` role
- ✅ Created super admin setup scripts
- ✅ Updated existing admin scripts to use super admin

### Documentation Changes:
- ✅ Updated ACCESS_CONTROL.md with role hierarchy
- ✅ Updated database README with super admin info
- ✅ Added API documentation for new endpoints

### Security Considerations:
- ✅ Super admin cannot create other super admins
- ✅ Role validation on all user operations
- ✅ Proper error handling for permission denied
- ✅ Audit trail maintained for all operations

## Next Steps for Testing

1. **Run Database Setup:**
   ```bash
   psql -h localhost -U postgres -d orderhub -f scripts/database/setup-admin-users.sql
   ```

2. **Test Authentication:**
   - Login as gm.zablan@greatdealscorp.com (should have super_admin role)

3. **Test Role Hierarchy:**
   - Create an admin user as super admin
   - Login as that admin user
   - Verify they cannot manage other admins
   - Verify they can only create regular users

4. **Test API Endpoints:**
   - Test all endpoints with different role combinations
   - Verify proper error responses for unauthorized access

## Expected Behavior Summary

| Action | Super Admin | Admin | User |
|--------|-------------|-------|------|
| View all users | ✅ All users | ✅ Users only | ❌ No access |
| Create admin user | ✅ Yes | ❌ No | ❌ No |
| Create regular user | ✅ Yes | ✅ Yes | ❌ No |
| Manage admin user | ✅ Yes | ❌ No | ❌ No |
| Manage regular user | ✅ Yes | ✅ Yes | ❌ No |
| Process access requests | ✅ Yes | ✅ Yes | ❌ No |
| Promote to admin | ✅ Yes | ❌ No | ❌ No |
| Demote admin | ✅ Yes | ❌ No | ❌ No |
