'use client';

import { ReactNode, useMemo } from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  
  const client = useMemo(() => {
    if (!convexUrl) {
      console.warn('NEXT_PUBLIC_CONVEX_URL is not set. ConvexProvider running in fallback mode.');
      return new ConvexReactClient('https://fallback.convex.cloud');
    }
    return new ConvexReactClient(convexUrl);
  }, [convexUrl]);

  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
