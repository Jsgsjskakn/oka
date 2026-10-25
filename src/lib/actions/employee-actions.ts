'use server';
import { requireAdmin, requireStaff } from '@/lib/auth/admin-auth';
import { addEmployee, removeEmployee } from '@/lib/services/employee.service';
import { updateOrderStatus } from '@/lib/services/order.service';
import { revalidatePath } from 'next/cache';
import { RESTAURANT_ID } from '@/lib/config';

export async function addEmployeeAction(formData: FormData) {
  await requireAdmin();
  const name = formData.get('name') as string;
  const role = formData.get('role') as string;
  const email = formData.get('email') as string || null;
  const phone = formData.get('phone') as string || null;
  
  if (!name || !role) return { error: 'Name and role are required' };
  
  try {
    await addEmployee({ name, role, email, phone, is_active: true });
    revalidatePath('/admin/employees');
    return { success: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function removeEmployeeAction(id: string) {
  await requireAdmin();
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const adminSupabase = createAdminClient();

    // 1. Fetch employee to get auth_id
    const { data: employee } = await (adminSupabase as any)
      .from('employees')
      .select('auth_id')
      .eq('id', id)
      .single();

    // 2. Delete from employees table
    await removeEmployee(id);

    // 3. Delete from Supabase Auth if auth_id exists
    if (employee?.auth_id) {
      await adminSupabase.auth.admin.deleteUser(employee.auth_id);
    }

    revalidatePath('/admin/employees');
    return { success: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function updateOrderStatusByEmployee(orderId: string, status: any, employeeId: string, employeeName: string) {
  const staff = await requireStaff();
  try {
    await updateOrderStatus(orderId, status, RESTAURANT_ID, employeeId, employeeName, 'employee', staff.sessionToken);
    revalidatePath('/employee/orders');
    return { success: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function setupEmployeePassword(identifier: string, password: string) {
  try {
    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      throw new Error('Identifier (email or mobile number) is required.');
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const { createAdminClient } = await import('@/lib/supabase/admin');
    const adminSupabase = createAdminClient();

    const isEmail = identifier.includes('@');
    let query = (adminSupabase as any).from('employees').select('*').limit(1);
    
    if (isEmail) {
      query = query.ilike('email', identifier.trim().toLowerCase());
    } else {
      // Strict phone validation: eliminate loose wildcard matches like %phoneSearch (SEC-03)
      const digits = identifier.replace(/\D/g, '');
      if (digits.length < 10) {
        throw new Error('Please enter a valid full 10-digit phone number.');
      }
      const last10 = digits.slice(-10);
      query = query.or(`phone.eq.${last10},phone.eq.+91${last10},phone.eq.0${last10},phone.eq.91${last10}`);
    }

    const { data: employees, error: searchError } = await query;

    if (searchError) throw new Error('Database error while finding employee.');
    if (!employees || employees.length === 0) {
      throw new Error(`No employee found with this ${isEmail ? 'email' : 'phone number'}. Ask your admin to add you first.`);
    }

    const employee = employees[0] as any;
    if (!employee.is_active) {
      throw new Error('This employee account is deactivated.');
    }
    if (employee.auth_id) {
      throw new Error('This account has already been set up. Please sign in normally.');
    }

    const phoneStr = employee.phone?.trim();
    let e164Phone: string | undefined = undefined;
    
    if (phoneStr && phoneStr.length > 0) {
      // If it doesn't start with '+', assume India country code +91 and strip non-digits
      e164Phone = phoneStr.startsWith('+') ? phoneStr : `+91${phoneStr.replace(/[^0-9]/g, '')}`;
    }

    // 2. Create Supabase Auth user
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email: employee.email?.trim() || undefined,
      phone: e164Phone,
      password: password,
      email_confirm: true,
      phone_confirm: true,
    });

    if (authError) {
      if (authError.message.includes('phone')) {
        throw new Error(`Auth Error: The phone number configured by admin (${employee.phone}) is invalid. Please ask admin to fix it to E.164 format (e.g. +91...). Details: ${authError.message}`);
      }
      throw new Error(authError.message);
    }
    if (!authData.user) throw new Error('Failed to create auth user');

    // 3. Link auth_id back to employees table
    const { error: updateError } = await (adminSupabase as any)
      .from('employees')
      .update({ auth_id: authData.user.id })
      .eq('id', employee.id);

    if (updateError) {
      // Rollback Auth user if linking fails
      await adminSupabase.auth.admin.deleteUser(authData.user.id);
      throw new Error('Failed to link account. Please try again.');
    }

    // 4. Sync to profiles table so RLS policies (`is_employee()`) work correctly!
    await (adminSupabase as any).from('profiles').upsert({
      id: authData.user.id,
      role: 'employee',
      is_active: employee.is_active,
      name: employee.name,
      email: employee.email,
      phone: employee.phone
    });

    return { success: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function sendEmployeePasswordResetEmail(email: string) {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const adminSupabase = createAdminClient();

    // 1. Verify email exists in employees table and is active
    const { data: employees, error: searchError } = await (adminSupabase as any)
      .from('employees')
      .select('*')
      .ilike('email', email.trim())
      .limit(1);

    if (searchError) throw new Error('Database error while verifying email.');
    if (!employees || employees.length === 0) {
      // Don't leak whether the email exists for security, just return a generic success
      // But in an internal app, returning an error is often preferred for UX.
      throw new Error('No active employee found with this email.');
    }

    const employee = employees[0] as any;
    if (!employee.is_active) {
      throw new Error('This employee account is deactivated.');
    }
    if (!employee.auth_id) {
      throw new Error('This account has not been set up yet. Please use First Time Setup.');
    }

    // 2. Send reset email
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient(); // Use standard client to trigger reset so it uses standard config
    
    // We want the reset link to go to our callback which redirects to update-password
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUrl = `${origin}/auth/callback?next=/employee/update-password`;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectUrl,
    });

    if (resetError) throw new Error(resetError.message);

    return { success: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function adminSendPasswordResetEmail(employeeId: string) {
  try {
    await requireAdmin();
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const adminSupabase = createAdminClient();

    // 1. Get employee email
    const { data: employee, error: getError } = await (adminSupabase as any)
      .from('employees')
      .select('email, auth_id, is_active')
      .eq('id', employeeId)
      .single();

    const emp = employee as any;
    if (getError || !emp) throw new Error('Employee not found.');
    if (!emp.email) throw new Error('Employee does not have an email address. They cannot receive a reset link.');
    if (!emp.auth_id) throw new Error('Employee has not completed First Time Setup yet.');
    if (!emp.is_active) throw new Error('Employee is deactivated.');

    // 2. Use Admin API to generate link or let supabase trigger it
    // We will just use the standard invite/reset flow.
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUrl = `${origin}/auth/callback?next=/employee/update-password`;

    // By generating the link, we can email it, but `admin.generateLink` returns the link, it doesn't always send the email automatically if we use it directly, wait, `resetPasswordForEmail` sends the email.
    // Let's just use `adminSupabase.auth.admin.generateLink` with type 'recovery', but wait, actually `resetPasswordForEmail` is standard and automatically sends the email template.
    // Since adminSupabase is bypassing RLS, we can just use the standard client to send the email so the user gets it.
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient(); 
    
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(emp.email, {
      redirectTo: redirectUrl,
    });

    if (resetError) throw new Error(resetError.message);

    return { success: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function updateEmployeePassword(newPassword: string) {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    
    // When the user clicks the recovery link and lands on the update-password page, 
    // their session is established via the callback. We can just call updateUser.
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    if (error) throw new Error(error.message);
    
    return { success: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
