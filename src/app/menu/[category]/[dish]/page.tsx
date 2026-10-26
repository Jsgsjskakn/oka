import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    category: string;
    dish: string;
  }>;
}

export default async function DishDetailsPage({ params }: PageProps) {
  const { dish: dishSlug } = await params;
  redirect(`/3d/${dishSlug}`);
}
