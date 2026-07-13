import Box from '@mui/material/Box';

import { fCurrency } from 'src/utils/format-number';

// ----------------------------------------------------------------------

export function ProductPrice({ price, priceSale = 0, sx, ...other }) {
  return (
    <Box
      component="span"
      sx={[
        {
          gap: 0.5,
          display: 'flex',
          typography: 'subtitle2',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {fCurrency(price)}

      {priceSale > 0 && (
        <Box
          component="span"
          sx={{
            color: 'text.disabled',
            textDecoration: 'line-through',
            fontWeight: 'fontWeightMedium',
          }}
        >
          {fCurrency(priceSale)}
        </Box>
      )}
    </Box>
  );
}
