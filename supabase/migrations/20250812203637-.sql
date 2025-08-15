-- Drop and recreate the function with explicit schema references
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role_text text;
BEGIN
  -- Get user_type from metadata, default to 'user'
  user_role_text := COALESCE(NEW.raw_user_meta_data ->> 'user_type', 'user');
  
  -- Insert into profiles
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email
  );
  
  -- Assign role based on user_type from signup with explicit schema
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role_text::public.app_role);
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();