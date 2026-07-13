import Box from '@mui/material/Box';

// ----------------------------------------------------------------------

export function PostTime({ createdAt, duration, sx, ...other }) {
  return (
    <Box
      sx={[
        {
          flexWrap: 'wrap',
          display: 'flex',
          alignItems: 'center',
          typography: 'caption',
          color: 'text.disabled',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {createdAt}
      {duration && (
        <>
          <Box
            component="span"
            sx={{
              mx: 1,
              width: 4,
              height: 4,
              borderRadius: '50%',
              backgroundColor: 'currentColor',
            }}
          />

          {duration}
        </>
      )}
    </Box>
  );
}
