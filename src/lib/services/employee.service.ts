import { fetchQuery, fetchMutation } from 'convex/nextjs';
import { api } from '@/../convex/_generated/api';
import { createClient } from '@/lib/supabase/server';
import { getSessionToken } from '@/lib/auth/admin-auth';

export interface Employee {
  id: string;
  name: string;
  role: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  hired_at: string;
  created_at: string;
}

export async function getEmployees(): Promise<Employee[]> {
  // 1. Primary: Convex Query
  try {
    const list = await fetchQuery(api.employees.getEmployees, {});
    if (list && list.length > 0) {
      return list.map((e: any) => ({
        id: e._id,
        name: e.name,
        role: e.role,
        email: e.email || null,
        phone: e.phone || null,
        is_active: e.isActive,
        hired_at: e.hiredAt || new Date(e._creationTime).toISOString(),
        created_at: new Date(e._creationTime).toISOString(),
      }));
    }
  } catch (err) {
    console.warn('[employee.service] Convex getEmployees failed, trying Supabase:', err);
  }

  // 2. Supabase Fallback
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  } catch {
    return [];
  }
}

export async function addEmployee(
  employee: Omit<Employee, 'id' | 'created_at' | 'hired_at'>,
  sessionToken?: string
): Promise<Employee> {
  const token = sessionToken || (await getSessionToken());

  // 1. Primary: Convex Mutation
  try {
    const res = await fetchMutation(api.employees.addEmployee, {
      name: employee.name,
      role: employee.role,
      email: employee.email || undefined,
      phone: employee.phone || undefined,
      isActive: employee.is_active,
      sessionToken: token,
    });

    if (res && res.success) {
      return {
        id: res.employeeId,
        name: employee.name,
        role: employee.role,
        email: employee.email,
        phone: employee.phone,
        is_active: employee.is_active,
        hired_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn('[employee.service] Convex addEmployee failed, trying Supabase:', err);
  }

  // 2. Supabase Fallback
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('employees')
    .insert(employee as any)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function removeEmployee(id: string, sessionToken?: string): Promise<void> {
  const token = sessionToken || (await getSessionToken());

  // 1. Primary: Convex Mutation
  try {
    const res = await fetchMutation(api.employees.removeEmployee, {
      employeeId: id,
      sessionToken: token,
    });
    if (res && res.success) return;
  } catch (err) {
    console.warn('[employee.service] Convex removeEmployee failed, trying Supabase:', err);
  }

  // 2. Supabase Fallback
  const supabase = await createClient();
  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
}
