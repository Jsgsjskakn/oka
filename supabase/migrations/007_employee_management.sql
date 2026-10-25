-- Employees table
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  email TEXT UNIQUE,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  hired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS: Only admins can manage employees
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin only - employees" ON public.employees
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
