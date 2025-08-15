-- Fix the existing user's auth setup
-- Update the user to ensure proper authentication structure
UPDATE auth.users 
SET 
    email_confirmed_at = now(),
    updated_at = now(),
    raw_user_meta_data = jsonb_build_object('full_name', 'Danilo Armellini'),
    encrypted_password = crypt('teste123@#', gen_salt('bf'))
WHERE email = 'dan.armellini@gmail.com';

-- Ensure the user has a proper identity record
INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at,
    email
) 
SELECT 
    gen_random_uuid(),
    u.id,
    jsonb_build_object(
        'sub', u.id::text, 
        'email', u.email,
        'email_verified', true,
        'provider', 'email'
    ),
    'email',
    u.id::text,
    now(),
    now(),
    now(),
    u.email
FROM auth.users u 
WHERE u.email = 'dan.armellini@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM auth.identities i 
    WHERE i.user_id = u.id AND i.provider = 'email'
);

-- Ensure profile exists
INSERT INTO public.profiles (user_id, full_name, email)
SELECT u.id, 'Danilo Armellini', u.email
FROM auth.users u 
WHERE u.email = 'dan.armellini@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;

-- Ensure admin role exists
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role
FROM auth.users u 
WHERE u.email = 'dan.armellini@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;