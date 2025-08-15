-- Remove the incorrectly created user and recreate properly
-- First, clean up any existing data for this email
DELETE FROM public.user_roles WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'dan.armellini@gmail.com'
);

DELETE FROM public.profiles WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'dan.armellini@gmail.com'
);

-- Remove from auth.users (this should be done carefully)
DELETE FROM auth.users WHERE email = 'dan.armellini@gmail.com';

-- Now we'll create a proper signup function that handles user creation correctly
CREATE OR REPLACE FUNCTION public.create_admin_user(
    user_email TEXT,
    user_password TEXT,
    user_full_name TEXT DEFAULT 'Admin User'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id UUID;
    result JSON;
BEGIN
    -- Create user using Supabase auth
    -- This is a temporary function to help with admin user creation
    -- In production, you should use the Supabase dashboard or API
    
    -- Generate a new UUID for the user
    new_user_id := gen_random_uuid();
    
    -- Insert user into auth.users with proper structure
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
        raw_user_meta_data,
        confirmation_token,
        email_change_token_new,
        recovery_token
    ) VALUES (
        new_user_id,
        '00000000-0000-0000-0000-000000000000',
        user_email,
        crypt(user_password, gen_salt('bf')),
        now(),
        now(),
        now(),
        'authenticated',
        'authenticated',
        jsonb_build_object('full_name', user_full_name),
        '',
        '',
        ''
    );

    -- Create identity record
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        new_user_id,
        jsonb_build_object('sub', new_user_id::text, 'email', user_email),
        'email',
        now(),
        now(),
        now()
    );

    -- The handle_new_user trigger should automatically create profile and role
    -- But let's make sure they exist
    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (new_user_id, user_full_name, user_email)
    ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;

    -- Assign admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    result := jsonb_build_object(
        'success', true,
        'user_id', new_user_id,
        'email', user_email
    );

    RETURN result;
END;
$$;

-- Execute the function to create the admin user
SELECT public.create_admin_user(
    'dan.armellini@gmail.com',
    'teste123@#',
    'Danilo Armellini'
);