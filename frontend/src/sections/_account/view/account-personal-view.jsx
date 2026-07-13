import * as z from 'zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { varAlpha } from 'minimal-shared/utils';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { Form, Field, schemaUtils } from 'src/components/hook-form';

import { UserPhoto } from 'src/sections/_account/layout';

import { useAuth } from 'src/auth/hooks/use-auth';

// ----------------------------------------------------------------------

export const AccountPersonalSchema = z.object({
  firstName: z.string().min(1, { error: 'First name is required!' }),
  lastName: z.string().min(1, { error: 'Last name is required!' }),
  email: schemaUtils.email(),
  phoneNumber: z.string().min(1, { error: 'Phone number is required!' }),
  birthday: schemaUtils.date({ error: { required: 'Birthday is required!' } }),
  gender: z.string().min(1, { error: 'Gender is required!' }),
  streetAddress: z.string().min(1, { error: 'Street address is required!' }),
  city: z.string().min(1, { error: 'City is required!' }),
  country: schemaUtils.nullableInput(z.string().min(1, { error: 'Country is required!' }), {
    error: 'Country is required!',
  }),
  //
  zipCode: z.string(),
});


// ----------------------------------------------------------------------

export function AccountPersonalView() {
  const { user, updateUser } = useAuth();

  const personalMethods = useForm({
    resolver: zodResolver(AccountPersonalSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      birthday: null,
      gender: 'Male',
      streetAddress: '',
      zipCode: '',
      city: '',
      country: '',
    },
  });

  useEffect(() => {
    if (user) {
      const nameParts = user.name ? user.name.split(' ') : ['', ''];
      const firstName = user.firstName || nameParts[0] || '';
      const lastName = user.lastName || nameParts.slice(1).join(' ') || '';

      personalMethods.reset({
        firstName,
        lastName,
        email: user.email || '',
        phoneNumber: user.phone || user.phoneNumber || '',
        birthday: user.birthday || null,
        gender: user.gender || 'Male',
        streetAddress: user.streetAddress || '',
        zipCode: user.zipCode || '',
        city: user.city || '',
        country: user.country || '',
      });
    }
  }, [user, personalMethods]);

  const onSubmitPersonal = personalMethods.handleSubmit(async (data) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber,
          birthday: data.birthday,
          gender: data.gender,
          streetAddress: data.streetAddress,
          city: data.city,
          country: data.country,
          zipCode: data.zipCode,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const result = await response.json();
      if (result.success) {
        updateUser(result.data);
      }
    } catch (error) {
      console.error(error);
    }
  });

  const renderPersonalForm = () => (
    <>
      <Field.Text name="firstName" label="First name" />
      <Field.Text name="lastName" label="Last name" />
      <Field.Text name="email" label="Email address" />
      <Field.Text name="phoneNumber" label="Phone number" />
      <Field.DatePicker name="birthday" label="Birthday" />
      <Field.Select name="gender" label="Gender" slotProps={{ select: { native: true } }}>
        {['Male', 'Female', 'Other'].map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Field.Select>
      <Field.Text name="streetAddress" label="Street address" />
      <Field.Text name="zipCode" label="Zip/code" />
      <Field.Text name="city" label="City" />
      <Field.CountrySelect
        fullWidth
        name="country"
        label="Country"
        placeholder="Choose a country"
      />
    </>
  );

  return (
    <>
      <div>
        <Typography component="h6" variant="h5">
          Personal
        </Typography>

        <UserPhoto
          sx={(theme) => ({
            p: 3,
            mt: 3,
            borderRadius: 2,
            display: { xs: 'flex', md: 'none' },
            border: `solid 1px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.24)}`,
          })}
        />

        <Form methods={personalMethods} onSubmit={onSubmitPersonal}>
          <Box
            sx={{
              my: 3,
              rowGap: 2.5,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' },
            }}
          >
            {renderPersonalForm()}
          </Box>

          <Box sx={{ textAlign: 'right' }}>
            <Button
              color="inherit"
              type="submit"
              variant="contained"
              loading={personalMethods.formState.isSubmitting}
            >
              Save changes
            </Button>
          </Box>
        </Form>
      </div>

      <Divider sx={{ borderStyle: 'dashed', my: 5 }} />
    </>
  );
}
