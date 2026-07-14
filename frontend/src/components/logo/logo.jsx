import { mergeClasses } from 'minimal-shared/utils';

import Link from '@mui/material/Link';
import { styled } from '@mui/material/styles';

import { RouterLink } from 'src/routes/components';

import { logoClasses } from './classes';

// ----------------------------------------------------------------------

export function Logo({ sx, disabled, className, href = '/', isSingle = false, ...other }) {
  const singleLogo = (
    <img src="../../assets/images/logo/L3.png" alt="Logo" />

  );

  const fullLogo = (
    <img src="../../assets/images/logo/L2.png" alt="Logo" />
  );

  return (
    <LogoRoot
      component={RouterLink}
      href={href}
      aria-label="Logo"
      underline="none"
      className={mergeClasses([logoClasses.root, className])}
      sx={[
        {
          width: 64,
          height: 64,
          ...(!isSingle && { width: 240, height: 66 }),
          ...(disabled && { pointerEvents: 'none' }),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {isSingle ? singleLogo : fullLogo}
    </LogoRoot>
  );
}

// ----------------------------------------------------------------------

const LogoRoot = styled(Link)(() => ({
  flexShrink: 0,
  color: 'inherit',
  display: 'inline-flex',
  verticalAlign: 'middle',
}));
