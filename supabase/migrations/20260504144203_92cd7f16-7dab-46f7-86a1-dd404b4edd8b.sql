DROP POLICY IF EXISTS "Everyone can view departments" ON public.departments;

CREATE POLICY "Public can view departments"
ON public.departments
FOR SELECT
TO anon, authenticated
USING (true);