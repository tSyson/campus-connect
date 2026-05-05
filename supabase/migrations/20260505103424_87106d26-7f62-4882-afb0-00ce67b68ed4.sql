ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS year_of_study integer NOT NULL DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _role text;
  _reg_number text;
  _dept_id uuid;
BEGIN
  BEGIN
    _dept_id := NULLIF(NEW.raw_user_meta_data->>'department', '')::uuid;
  EXCEPTION WHEN OTHERS THEN
    _dept_id := NULL;
  END;

  INSERT INTO public.profiles (user_id, full_name, email, department_id)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email, _dept_id);

  _role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');

  IF _role IN ('admin', 'lecturer', 'student') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, _role::app_role);
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'student'::app_role);
  END IF;

  IF _role = 'student' THEN
    _reg_number := COALESCE(NEW.raw_user_meta_data->>'registration_number', 'REG-' || substr(NEW.id::text, 1, 8));
    INSERT INTO public.students (user_id, registration_number, department_id)
    VALUES (NEW.id, _reg_number, _dept_id);
  END IF;

  RETURN NEW;
END;
$function$;