-- Setup initial admin users and super admin
-- This script creates initial admin users and super admin for the access control system

BEGIN;

-- Create super admin user (GM Zablan)
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
) VALUES 
    (
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
    )
ON CONFLICT (email) DO UPDATE SET
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    department = EXCLUDED.department,
    job_title = EXCLUDED.job_title,
    updated_at = NOW();

-- You can add more admin users here by uncommenting and modifying:
-- ,
-- (
--     gen_random_uuid(),
--     'another.admin@greatdealscorp.com',
--     'First',
--     'Last',
--     'admin',
--     'active',
--     'IT',
--     'Administrator',
--     'system',
--     NOW(),
--     NOW(),
--     NOW()
-- )

COMMIT;

-- Display created admin users and super admin
SELECT 
    id,
    email,
    first_name,
    last_name,
    role,
    status,
    department,
    job_title,
    created_at,
    approved_by,
    approved_at
FROM users 
WHERE role IN ('admin', 'super_admin')
ORDER BY 
    CASE 
        WHEN role = 'super_admin' THEN 1 
        WHEN role = 'admin' THEN 2 
        ELSE 3 
    END,
    created_at DESC;
