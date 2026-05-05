
ALTER TABLE public.students
  ADD CONSTRAINT students_profile_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
