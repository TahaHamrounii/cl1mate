import ReactPlayer from 'react-player';

import Box from '@mui/material/Box';

// ----------------------------------------------------------------------
// https://github.com/cookpete/react-player

export function Player({ fullScreen, slotProps, ...other }) {
  return (
    <Box
      {...slotProps?.wrapper}
      sx={[
        fullScreen && { width: 1, height: 1 },
        ...(Array.isArray(slotProps?.wrapper?.sx)
          ? slotProps.wrapper.sx
          : [slotProps?.wrapper?.sx]),
      ]}
    >
      <ReactPlayer
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
        {...other}
      />
    </Box>
  );
}
