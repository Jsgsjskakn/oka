-- Add auth_id to employees table to link with auth.users
ALTER TABLE public.employees
ADD COLUMN auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update RLS policies if necessary (currently admin checks profiles, but employees table might need policies if employees need to read their own row)
-- For now, the existing RLS policy allows admins to manage employees. Employees reading their own data is handled via service role in actions or by adding a policy.

-- Let's add a policy so an employee can read their own row using auth_id
CREATE POLICY "Employees can read own row" ON public.employees
  FOR SELECT TO authenticated
  USING (auth.uid() = auth_id);
