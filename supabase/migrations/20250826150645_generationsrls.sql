-- Allow users to insert their own pending job
CREATE POLICY "Users can insert their own pending analysis job"
ON public.analysis_jobs
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'
);

-- Ensure users can read their own jobs (add if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'analysis_jobs'
      AND policyname = 'Users can read their own jobs.'
  ) THEN
    CREATE POLICY "Users can read their own jobs."
    ON public.analysis_jobs
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END$$;

-- Optional: allow user-side UPSERT (only to 'pending')
-- Only needed if you keep using upsert that may perform an UPDATE on conflict.
CREATE POLICY "Users can update their own job to pending only"
ON public.analysis_jobs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'
);