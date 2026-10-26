import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/convex-auth-actions';

/**
 * Contact Route Redirect:
 * Routes directly to Customer Login or Customer Profile Portal,
 * replacing the legacy "send message" contact form.
 */
export default async function ContactPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect('/profile');
  }
  redirect('/auth/login?redirectTo=/profile');
}
