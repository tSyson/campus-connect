
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _role text;
  _reg_number text;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email);

  -- Assign role from metadata (default to 'student')
  _role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  
  IF _role IN ('admin', 'lecturer', 'student') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, _role::app_role);
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'student'::app_role);
  END IF;

  -- If student, create student record
  IF _role = 'student' THEN
    _reg_number := COALESCE(NEW.raw_user_meta_data->>'registration_number', 'REG-' || substr(NEW.id::text, 1, 8));
    INSERT INTO public.students (user_id, registration_number)
    VALUES (NEW.id, _reg_number);
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate the trigger to use the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
