import { useEffect } from 'react';

import { useRouter } from 'src/routes/hooks';

import { SplashScreen } from 'src/components/loading-screen';

import { useAuth } from '../hooks/use-auth';

// ----------------------------------------------------------------------

export function AuthGuard({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/sign-in');
    }
  }, [user, loading, router]);

  if (loading) {
    return <SplashScreen />;
  }

  return user ? <>{children}</> : null;
}
