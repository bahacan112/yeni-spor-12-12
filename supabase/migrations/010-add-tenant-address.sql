-- Add address column to tenants table
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS address TEXT;

-- Optional: update RLS policies if needed
-- Ensure existing update policies allow updating the address column.
-- Example (adjust to your policies):
-- CREATE POLICY tenants_update_self ON public.tenants
--   FOR UPDATE USING (auth.uid() = id) WITH CHECK (true);

-- Note: After running this migration on Supabase, refresh PostgREST schema cache if necessary.
