-- Create admin user with proper identity structure
DO $$
DECLARE
    new_user_id UUID;
    new_identity_id UUID;
BEGIN
    -- Generate UUIDs
    new_user_id := gen_random_uuid();
    new_identity_id := gen_random_uuid();
    
    -- Insert user into auth.users
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
        new_user_id,
        '00000000-0000-0000-0000-000000000000',
        'dan.armellini@gmail.com',
        crypt('teste123@#', gen_salt('bf')),
        now(),
        now(),
        now(),
        'authenticated',
        'authenticated',
        jsonb_build_object('full_name', 'Danilo Armellini')
    );

    -- Insert identity with provider_id
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
    ) VALUES (
        new_identity_id,
        new_user_id,
        jsonb_build_object(
            'sub', new_user_id::text, 
            'email', 'dan.armellini@gmail.com',
            'email_verified', true,
            'provider', 'email'
        ),
        'email',
        new_user_id::text,
        now(),
        now(),
        now(),
        'dan.armellini@gmail.com'
    );

    -- Create profile
    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (new_user_id, 'Danilo Armellini', 'dan.armellini@gmail.com');

    -- Assign admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new_user_id, 'admin'::app_role);

END $$;