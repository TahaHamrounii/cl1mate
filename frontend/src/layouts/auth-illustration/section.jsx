import Box from '@mui/material/Box';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

export function AuthIllustrationSection({
  sx,
  layoutQuery = 'md',
  imgUrl = `${CONFIG.assetsDir}/assets/illustrations/illustration-sign-in.svg`,
  ...other
}) {
  return (
    <Box
      sx={[
        (theme) => ({
          display: 'none',
          flex: '1 1 auto',
          [theme.breakpoints.up(layoutQuery)]: {
            display: 'block',
          },
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Box component="img" alt="Sign in" src={imgUrl} sx={{ width: 1 }} />
    </Box>
  );
}
