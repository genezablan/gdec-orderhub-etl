# Frontend Error Codes Reference

This document lists all the error codes that the access control system can return, helping frontend developers handle different scenarios appropriately.

## Access Control Error Codes

### Authentication Errors

#### `USER_AUTHENTICATION_REQUIRED`
- **HTTP Status**: 403 Forbidden
- **Meaning**: User is not authenticated (no valid JWT token)
- **Frontend Action**: Redirect to login page

#### `ACCESS_VALIDATION_FAILED`
- **HTTP Status**: 403 Forbidden
- **Meaning**: General access validation error (unexpected error)
- **Frontend Action**: Show generic error message, possibly retry

### Access Permission Errors

#### `NO_ACCESS_REQUEST_AVAILABLE`
- **HTTP Status**: 403 Forbidden
- **Meaning**: User has no access and can request access
- **Frontend Action**: Show "Request Access" button/form
- **API Response**: Includes `accessResult` with details

#### `ACCESS_REQUEST_PENDING`
- **HTTP Status**: 403 Forbidden
- **Meaning**: User has submitted an access request that is pending admin approval
- **Frontend Action**: Show pending status with "Check Status" option
- **API Response**: Includes `accessResult.accessRequest` with request details

#### `ACCESS_REQUEST_REJECTED`
- **HTTP Status**: 403 Forbidden
- **Meaning**: User's access request was rejected by admin
- **Frontend Action**: Show rejection message with admin notes, allow new request
- **API Response**: Includes `accessResult.accessRequest` with rejection details

#### `USER_ACCESS_INACTIVE`
- **HTTP Status**: 403 Forbidden
- **Meaning**: User exists but their access is inactive/suspended
- **Frontend Action**: Show "Account Inactive" message, contact admin

#### `USER_NOT_FOUND`
- **HTTP Status**: 403 Forbidden
- **Meaning**: User is authenticated but not found in the access control system
- **Frontend Action**: Show "Account Setup Required" message

### Role-Based Access Errors

#### `INSUFFICIENT_ROLE`
- **HTTP Status**: 403 Forbidden
- **Meaning**: User has access but lacks required role for this specific endpoint
- **Frontend Action**: Show "Insufficient Permissions" message
- **API Response**: Includes `requiredRoles` and `userRole` fields

## Example Frontend Error Handling

### React Example

```tsx
const handleApiError = (error) => {
  if (error.response?.status === 403) {
    const { code, accessResult } = error.response.data;
    
    switch (code) {
      case 'USER_AUTHENTICATION_REQUIRED':
        // Redirect to login
        window.location.href = '/login';
        break;
        
      case 'NO_ACCESS_REQUEST_AVAILABLE':
        // Show request access UI
        setShowRequestAccessForm(true);
        break;
        
      case 'ACCESS_REQUEST_PENDING':
        // Show pending status
        setAccessStatus({
          status: 'pending',
          request: accessResult.accessRequest
        });
        break;
        
      case 'ACCESS_REQUEST_REJECTED':
        // Show rejection with admin notes
        setAccessStatus({
          status: 'rejected',
          request: accessResult.accessRequest,
          adminNotes: accessResult.accessRequest.adminNotes
        });
        break;
        
      case 'USER_ACCESS_INACTIVE':
        // Show inactive account message
        setAccessStatus({ status: 'inactive' });
        break;
        
      case 'INSUFFICIENT_ROLE':
        // Show insufficient permissions
        const { requiredRoles, userRole } = error.response.data;
        showError(`Access denied. Required: ${requiredRoles.join(', ')}, You have: ${userRole}`);
        break;
        
      default:
        // Generic error
        showError('Access denied. Please contact support.');
    }
  }
};

// Usage with axios interceptor
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    handleApiError(error);
    return Promise.reject(error);
  }
);
```

### Vue.js Example

```javascript
// In your Vue store or composable
const handleAccessError = (error) => {
  if (error.response?.status === 403) {
    const errorCode = error.response.data.code;
    
    switch (errorCode) {
      case 'NO_ACCESS_REQUEST_AVAILABLE':
        router.push('/request-access');
        break;
      case 'ACCESS_REQUEST_PENDING':
        router.push('/access-pending');
        break;
      case 'ACCESS_REQUEST_REJECTED':
        router.push('/access-rejected');
        break;
      case 'USER_ACCESS_INACTIVE':
        router.push('/account-inactive');
        break;
      default:
        // Handle other cases
    }
  }
};
```

## API Response Structure

All access control errors follow this structure:

```json
{
  "message": "Human-readable error message",
  "error": "Forbidden",
  "statusCode": 403,
  "code": "ERROR_CODE_FROM_ABOVE",
  "accessResult": {
    "hasAccess": false,
    "user": { /* user object if exists */ },
    "accessRequest": { /* access request object if exists */ },
    "message": "Detailed status message"
  }
}
```

## Best Practices for Frontend

1. **Always check the `code` field** for specific error handling
2. **Use the `accessResult`** object for additional context
3. **Provide clear user feedback** for each error type
4. **Implement retry mechanisms** for temporary errors
5. **Cache access status** to avoid repeated API calls
6. **Graceful degradation** - disable features rather than breaking the UI
