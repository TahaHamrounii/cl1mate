import { lazy, Suspense } from 'react';
import { Outlet, Navigate } from 'react-router';

import { SplashScreen } from 'src/components/loading-screen';

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
        element: <Navigate to="/sign-in" replace />,
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
