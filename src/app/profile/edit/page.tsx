import { EditableProfileForm } from '@/components/profile/EditableProfileForm';
import { getCurrentUser } from '@/lib/auth/convex-auth-actions';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function EditProfilePage() {
  // 1. Primary: Resolve Convex session
  const convexUser = await getCurrentUser();
  if (convexUser) {
    return (
      <EditableProfileForm
        name={convexUser.name || ''}
        email={convexUser.email || ''}
        phone={convexUser.phone || ''}
      />
    );
  }

  // 2. Secondary: Fallback to Supabase (fetch data in try/catch, return JSX outside)
  let supabaseUser: any = null;
  let supabaseProfile: any = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();

    if (data?.user) {
      supabaseUser = data.user;
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single() as { data: any; error: any };
      supabaseProfile = profile;
    }
  } catch {
    // Supabase unavailable
  }

  if (supabaseUser) {
    return (
      <EditableProfileForm
        name={supabaseProfile?.name || ''}
        email={supabaseUser.email || ''}
        phone={supabaseProfile?.phone || ''}
      />
    );
  }

  redirect('/auth/login?redirectTo=/profile/edit');
}
