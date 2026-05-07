CREATE POLICY "Lecturers can view profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'lecturer'::app_role));