-- Update the handle_new_user function to assign role based on user_type
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
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
$function$