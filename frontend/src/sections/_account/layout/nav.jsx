import { useRef, useEffect } from 'react';
import { usePopover } from 'minimal-shared/hooks';
import { varAlpha, isActiveLink } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Popover from '@mui/material/Popover';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ButtonBase, { buttonBaseClasses } from '@mui/material/ButtonBase';

import { RouterLink } from 'src/routes/components';
import { useRouter, usePathname } from 'src/routes/hooks';

import { _mock } from 'src/_mock';

import { Iconify } from 'src/components/iconify';

import { useAuth } from 'src/auth/hooks/use-auth';

// ----------------------------------------------------------------------

export function NavAccountDesktop({ data, sx }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/sign-in');
    } catch (error) {
      console.error(error);
    }
  };

  const renderUserInfo = () => (
    <Box sx={{ p: 3, pb: 2 }}>
      <UserPhoto sx={{ mb: 2 }} />
      <div>
        <Typography variant="subtitle1" noWrap sx={{ mb: 0.5 }}>
          {user?.name || 'Jayvion'}
        </Typography>
        <Typography variant="body2" noWrap sx={{ color: 'text.secondary' }}>
          {user?.email || 'nannie.abernathy70@yahoo.com'}
        </Typography>
      </div>
    </Box>
  );

  const renderNav = () => (
    <Box component="nav" sx={{ my: 1, px: 3, '& li': { display: 'flex' } }}>
      <ul>
        {data.map((item) => (
          <li key={item.title}>
            <NavItem title={item.title} path={item.path} icon={item.icon} />
          </li>
        ))}
      </ul>
    </Box>
  );

  const renderLogoutButton = () => (
    <Box sx={{ py: 1.5, px: 3 }}>
      <NavItem
        title="Logout"
        icon={<Iconify icon="carbon:logout" />}
        onClick={handleLogout}
      />
    </Box>
  );

  return (
    <Stack
      divider={<Divider component="span" sx={{ borderStyle: 'dashed' }} />}
      sx={[
        (theme) => ({
          width: 280,
          flexShrink: 0,
          borderRadius: 2,
          display: { xs: 'none', md: 'flex' },
          border: `solid 1px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.24)}`,
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {renderUserInfo()}
      {renderNav()}
      {renderLogoutButton()}
    </Stack>
  );
}

// ----------------------------------------------------------------------

export function NavAccountPopover({ data, sx }) {
  const { open, onClose, onOpen, anchorEl } = usePopover();
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      onClose();
      await logout();
      router.push('/sign-in');
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (open) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const renderNav = () => (
    <Box component="nav">
      <Box
        component="ul"
        sx={{
          gap: 0.5,
          display: 'flex',
          flexDirection: 'column',
          '& li': { display: 'flex' },
        }}
      >
        {data.map((item) => (
          <li key={item.title}>
            <NavItem title={item.title} path={item.path} icon={item.icon} />
          </li>
        ))}
      </Box>
    </Box>
  );

  const renderMenuActions = () => (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{
        paper: {
          sx: [
            {
              width: 220,
              [`& .${buttonBaseClasses.root}`]: {
                px: 1.5,
                py: 0.75,
                height: 'auto',
              },
            },
            ...(Array.isArray(sx) ? sx : [sx]),
          ],
        },
      }}
    >
      {renderNav()}
      <Divider sx={{ my: 0.5, borderStyle: 'dashed' }} />
      <NavItem title="Logout" icon={<Iconify icon="carbon:logout" />} onClick={handleLogout} />
    </Popover>
  );

  return (
    <>
      <IconButton disableRipple color={open ? 'primary' : 'inherit'} onClick={onOpen}>
        <Iconify width={22} icon="solar:user-rounded-outline" />
      </IconButton>
      {renderMenuActions()}
    </>
  );
}

// ----------------------------------------------------------------------

export function NavItem({ title, path = '', icon, sx, ...other }) {
  const pathname = usePathname();

  const isActive = path && isActiveLink(pathname, path);

  const buttonProps = path
    ? {
        href: path,
        component: RouterLink,
      }
    : {};

  return (
    <ButtonBase
      disableRipple
      key={title}
      {...buttonProps}
      sx={[
        {
          gap: 2,
          width: 1,
          height: 44,
          borderRadius: 1,
          typography: 'body2',
          justifyContent: 'flex-start',
          ...(isActive && { color: 'primary.main', typography: 'subtitle2' }),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {icon}
      {title}
    </ButtonBase>
  );
}

// ----------------------------------------------------------------------

export function UserPhoto({ sx, ...other }) {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  const handleAttach = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dcl02yykn';
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'unsigned_preset';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        console.error('Raw Cloudinary Error Response:', errText);
        throw new Error('Failed to upload image to Cloudinary');
      }

      const resData = await response.json();
      const secureUrl = resData.secure_url;

      const token = localStorage.getItem('token');
      const apiResponse = await fetch('http://localhost:5000/api/auth/profile/avatar', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatar: secureUrl }),
      });

      if (!apiResponse.ok) {
        throw new Error('Failed to update avatar in backend profile');
      }

      const result = await apiResponse.json();
      if (result.success) {
        updateUser({ avatar: secureUrl });
      }
    } catch (error) {
      console.error('Error changing avatar:', error);
    }
  };

  return (
    <Box
      sx={[
        {
          gap: 2,
          display: 'flex',
          alignItems: 'center',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Avatar src={user?.avatar || _mock.image.avatar(0)} sx={{ width: 64, height: 64 }} />

      <Box
        onClick={handleAttach}
        sx={{
          gap: 1,
          display: 'flex',
          cursor: 'pointer',
          alignItems: 'center',
          typography: 'body2',
          '&:hover': { opacity: 0.72 },
        }}
      >
        <Iconify icon="solar:pen-2-outline" />
        Change photo
      </Box>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />
    </Box>
  );
}
