-- Create initial super admin user
-- This script creates GM Zablan as the super admin user who can manage all users including other admins

-- Insert/Update GM Zablan as super admin user
INSERT INTO users (
    id,
    email,
    first_name,
    last_name,
    role,
    status,
    department,
    job_title,
    approved_by,
    approved_at,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'gm.zablan@greatdealscorp.com',
    'GM',
    'Zablan',
    'super_admin',
    'active',
    'Management',
    'General Manager / Super Administrator',
    'system',
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    role = 'super_admin',
    status = 'active',
    first_name = 'GM',
    last_name = 'Zablan',
    department = 'Management',
    job_title = 'General Manager / Super Administrator',
    updated_at = NOW();

-- Verify the super admin user was created/updated
SELECT 
    id,
    email,
    first_name,
    last_name,
    role,
    status,
    department,
    job_title,
    created_at
FROM users 
WHERE email = 'gm.zablan@greatdealscorp.com';
