-- Create the app_role enum that is missing
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'proprietario');

-- Verify that the handle_new_user function exists and is working correctly
-- If it doesn't exist, create it
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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
  
  -- Assign role based on user_type from signup
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role_text::app_role);
  
  RETURN NEW;
END;
$$;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
    ) THEN
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
END
$$;