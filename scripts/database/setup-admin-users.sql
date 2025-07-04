-- Setup initial admin users
-- This script creates initial admin users for the access control system

BEGIN;

-- Create initial admin users
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
        'admin',
        'active',
        'Management',
        'General Manager',
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

-- Display created admin users
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
WHERE role = 'admin'
ORDER BY created_at DESC;
