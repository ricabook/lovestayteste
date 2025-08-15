-- Create admin user with specified credentials
-- First, we need to insert the user into auth.users with encrypted password
-- Then create profile and assign admin role

-- Insert into auth.users (this creates the authentication user)
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    aud,
    role,
    raw_user_meta_data
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'dan.armellini@gmail.com',
    crypt('teste123@#', gen_salt('bf')),
    now(),
    now(),
    now(),
    'authenticated',
    'authenticated',
    '{"full_name": "Danilo Armellini"}'::jsonb
);

-- Get the user ID we just created
DO $$
DECLARE
    new_user_id uuid;
BEGIN
    -- Get the user ID
    SELECT id INTO new_user_id 
    FROM auth.users 
    WHERE email = 'dan.armellini@gmail.com';

    -- Create profile entry
    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (new_user_id, 'Danilo Armellini', 'dan.armellini@gmail.com')
    ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;

    -- Assign admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
END $$;