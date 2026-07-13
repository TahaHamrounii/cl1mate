import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { Form } from 'src/components/hook-form';

import { useAuth } from 'src/auth/hooks/use-auth';

import { FormHead } from './components/form-head';
import { SignUpSchema } from './components/schema';
import { SignUpForm } from './components/sign-up-form';

// ----------------------------------------------------------------------

export function SignUpView() {
  const router = useRouter();
  const { signup, user } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      router.push(paths.profile);
    }
  }, [user, router]);

  const defaultValues = {
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'hotel',
    phone: '',
  };

  const methods = useForm({
    resolver: zodResolver(SignUpSchema),
    defaultValues,
  });

  const { handleSubmit } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      setErrorMsg('');
      await signup(data.fullName, data.email, data.password, data.role, data.phone);
      router.push(paths.profile);
    } catch (error) {
      console.error(error);
      setErrorMsg(error.message || 'Registration failed');
    }
  });

  return (
    <>
      <FormHead
        title="Get started"
        description={
          <>
            {`Already have an account? `}
            <Link component={RouterLink} href={paths.signIn} variant="subtitle2">
              Sign in
            </Link>
          </>
        }
      />

      {!!errorMsg && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMsg}
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        <SignUpForm />
      </Form>
    </>
  );
}
