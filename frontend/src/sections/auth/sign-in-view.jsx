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
import { SignInSchema } from './components/schema';
import { SignInForm } from './components/sign-in-form';

// ----------------------------------------------------------------------

export function SignInView() {
  const router = useRouter();
  const { login, user } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const defaultValues = {
    email: '',
    password: '',
  };

  const methods = useForm({
    resolver: zodResolver(SignInSchema),
    defaultValues,
  });

  const { handleSubmit } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      setErrorMsg('');
      await login(data.email, data.password);
      router.push('/');
    } catch (error) {
      console.error(error);
      setErrorMsg(error.message || 'Login failed');
    }
  });

  return (
    <>
      <FormHead
        title="Sign in"
        description={
          <>
            {`Don’t have an account? `}
            <Link component={RouterLink} href={paths.signUp} variant="subtitle2">
              Get started
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
        <SignInForm />
      </Form>
    </>
  );
}
