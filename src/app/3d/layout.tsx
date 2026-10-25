import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '3D Menu | The Golden Oak',
  description: 'View our signature dishes in stunning 3D.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
