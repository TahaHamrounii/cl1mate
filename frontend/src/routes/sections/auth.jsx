import { lazy } from 'react';

import { AuthCenteredLayout } from 'src/layouts/auth-centered';

// ----------------------------------------------------------------------

const SignInPage = lazy(() => import('src/pages/auth/sign-in'));
const SignUpPage = lazy(() => import('src/pages/auth/sign-up'));


const VerifyPage = lazy(() => import('src/pages/auth/verify'));
const ResetPasswordPage = lazy(() => import('src/pages/auth/reset-password'));
const UpdatePasswordPage = lazy(() => import('src/pages/auth/update-password'));

// ----------------------------------------------------------------------

export const authRoutes = [
  {
    path: 'sign-in',
    element: (
      <AuthCenteredLayout>
        <SignInPage />
      </AuthCenteredLayout>
    ),
  },
  {
    path: 'sign-up',
    element: (
      <AuthCenteredLayout>
        <SignUpPage />
      </AuthCenteredLayout>
    ),
  },
  {
    path: 'reset-password',
    element: (
      <AuthCenteredLayout>
        <ResetPasswordPage />
      </AuthCenteredLayout>
    ),
  },
  {
    path: 'update-password',
    element: (
      <AuthCenteredLayout>
        <UpdatePasswordPage />
      </AuthCenteredLayout>
    ),
  },
  {
    path: 'verify',
    element: (
      <AuthCenteredLayout>
        <VerifyPage />
      </AuthCenteredLayout>
    ),
  },
];
