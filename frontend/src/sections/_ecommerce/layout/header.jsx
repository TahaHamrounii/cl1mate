import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { CONFIG } from 'src/global-config';

import { Iconify } from 'src/components/iconify';

import { NavAccountPopover, navData as navDataAccount } from '../../_account/layout';

// ----------------------------------------------------------------------

export function Header({ sx, ...other }) {
  const renderActions = () => (
    <Box sx={{ gap: 3, display: 'flex', alignItems: 'center' }}>
      <Badge badgeContent={2} color="info">
        <IconButton
          disableRipple
          component={RouterLink}
          href={paths.eCommerce.wishlist}
          color="inherit"
          sx={{ p: 0 }}
        >
          <Iconify width={22} icon="solar:heart-outline" />
        </IconButton>
      </Badge>

      <Badge badgeContent={4} color="error">
        <IconButton
          disableRipple
          component={RouterLink}
          href={paths.eCommerce.cart}
          color="inherit"
          sx={{ p: 0 }}
        >
          <Iconify width={22} icon="solar:cart-3-outline" />
        </IconButton>
      </Badge>

      <NavAccountPopover data={navDataAccount} />
    </Box>
  );

  return (
    <Box
      component="section"
      sx={[
        (theme) => ({
          ...theme.mixins.bgGradient({
            images: [
              `linear-gradient(to bottom, ${varAlpha(theme.vars.palette.background.defaultChannel, 0.9)}, ${varAlpha(theme.vars.palette.background.defaultChannel, 0.9)})`,
              `url(${CONFIG.assetsDir}/assets/background/overlay-1.webp)`,
            ],
          }),
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Container
        sx={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        <Box component="span" sx={{ flexGrow: 1 }} />
        {renderActions()}
      </Container>
    </Box>
  );
}
