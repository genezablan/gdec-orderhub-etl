-- Create initial admin user
-- This script creates an admin user with email gm.zablan@greatdealscorp.com

-- Insert the admin user
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
    'admin',
    'active',
    'Management',
    'General Manager',
    'system',
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    department = EXCLUDED.department,
    job_title = EXCLUDED.job_title,
    updated_at = NOW();

-- Verify the user was created
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
