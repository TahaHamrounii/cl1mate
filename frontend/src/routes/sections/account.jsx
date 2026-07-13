import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

import { MainLayout } from 'src/layouts/main';

import { LoadingScreen } from 'src/components/loading-screen';

import { AccountLayout } from 'src/sections/_account/layout';
import { EcommerceLayout } from 'src/sections/_ecommerce/layout';

import { AuthGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

const PersonalPage = lazy(() => import('src/pages/account/personal'));

// ----------------------------------------------------------------------

export const accountRoutes = [
  {
    path: 'profile',
    element: (
      <AuthGuard>
        <MainLayout>
          <EcommerceLayout>
            <AccountLayout>
              <Suspense fallback={<LoadingScreen sx={{ height: 480 }} />}>
                <Outlet />
              </Suspense>
            </AccountLayout>
          </EcommerceLayout>
        </MainLayout>
      </AuthGuard>
    ),
    children: [
      { index: true, element: <PersonalPage /> },
    ],
  },
];
