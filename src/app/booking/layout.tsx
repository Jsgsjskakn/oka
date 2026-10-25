import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Book a Table | The Golden Oak',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
