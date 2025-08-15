-- First create the app_role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'proprietario');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update the handle_new_user function to assign role based on user_type
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  user_role app_role;
BEGIN
  -- Get user_type from metadata, default to 'user'
  user_role := COALESCE(NEW.raw_user_meta_data ->> 'user_type', 'user')::app_role;
  
  -- Insert into profiles
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email
  );
  
  -- Assign role based on user_type from signup
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  RETURN NEW;
END;
$function$