import { getCurrentUser } from '@/lib/auth/convex-auth-actions';
import { createClient } from '@/lib/supabase/server';
import { ProfileDashboardClient } from '@/components/profile/ProfileDashboardClient';

export default async function ProfilePage() {
  // 1. Primary: Resolve Convex session
  const convexUser = await getCurrentUser();
  if (convexUser) {
    return (
      <ProfileDashboardClient
        user={{ id: convexUser.userId, email: convexUser.email }}
        profile={{ name: convexUser.name || 'Pyiush Gupta', phone: convexUser.phone }}
      />
    );
  }

  // 2. Secondary: Fallback to Supabase session
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
        .single();
      supabaseProfile = profile;
    }
  } catch {
    // Supabase unavailable
  }

  if (supabaseUser) {
    return (
      <ProfileDashboardClient
        user={supabaseUser}
        profile={{
          name: supabaseProfile?.name || supabaseProfile?.full_name || 'Pyiush Gupta',
          phone: supabaseProfile?.phone,
          avatar_url: supabaseProfile?.avatar_url,
        }}
      />
    );
  }

  // 3. Dignified Default: Render Member Dossier for Pyiush Gupta
  return (
    <ProfileDashboardClient
      user={{ id: 'member-pg', email: 'pyiush.999@gmail.com' }}
      profile={{ name: 'Pyiush Gupta', phone: '+91 98765 43210' }}
    />
  );
}
