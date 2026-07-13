import { lazy, Suspense } from 'react';
import { Outlet, Navigate } from 'react-router';

import { MainLayout } from 'src/layouts/main';

import { SplashScreen } from 'src/components/loading-screen';

import { AuthGuard } from 'src/auth/guard';

import { authRoutes } from './auth';
import { mainRoutes } from './main';
import { careerRoutes } from './career';
import { travelRoutes } from './travel';
import { accountRoutes } from './account';
import { marketingRoutes } from './marketing';
import { eLearningRoutes } from './elearning';
import { eCommerceRoutes } from './ecommerce';
import { componentsRoutes } from './components';

// ----------------------------------------------------------------------

const Page404 = lazy(() => import('src/pages/error/404'));
const DashboardPage = lazy(() => import('src/pages/dashboard'));

export const routesSection = [
  {
    element: (
      <Suspense fallback={<SplashScreen />}>
        <Outlet />
      </Suspense>
    ),
    children: [
      {
        index: true,
        element: (
          <AuthGuard>
            <MainLayout>
              <DashboardPage />
            </MainLayout>
          </AuthGuard>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <AuthGuard>
            <MainLayout>
              <DashboardPage />
            </MainLayout>
          </AuthGuard>
        ),
      },
      {
        path: 'signin',
        element: <Navigate to="/sign-in" replace />,
      },
      {
        path: 'signup',
        element: <Navigate to="/sign-up" replace />,
      },

      // Main
      ...mainRoutes,

      // Auth
      ...authRoutes,

      // Marketing
      ...marketingRoutes,

      // Travel
      ...travelRoutes,

      // Career
      ...careerRoutes,

      // E-learning
      ...eLearningRoutes,

      // E-commerce
      ...eCommerceRoutes,

      // Account
      ...accountRoutes,

      // Demo components
      ...componentsRoutes,

      // No match
      { path: '*', element: <Page404 /> },
    ],
  },
];
