import Box from '@mui/material/Box';
import Card from '@mui/material/Card';

import { fDate } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function CareerJobDetailsInfo({
  sx,
  level,
  deadline,
  createdAt,
  languages,
  experience,
  ...other
}) {
  return (
    <Card
      sx={[
        {
          p: 3,
          gap: 2,
          display: 'flex',
          flexDirection: 'column',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Item icon="solar:calendar-mark-outline" label="Date posted" value={fDate(createdAt)} />

      <Item
        icon="solar:hourglass-line-outline"
        label="Expiration date"
        value={fDate(deadline)}
        sx={{ '& .value': { color: 'error.main' } }}
      />

      <Item icon="carbon:increase-level" label="Experience" value={`${experience} year exp`} />

      <Item icon="solar:user-rounded-outline" label="Level" value={level} />

      <Item
        icon="carbon:translate"
        label="Language"
        value={typeof languages === 'string' ? languages : languages.join(', ')}
      />
    </Card>
  );
}

// ----------------------------------------------------------------------

function Item({ icon, label, value, sx }) {
  return (
    <Box
      sx={[
        {
          gap: 2,
          display: 'flex',
          typography: 'subtitle2',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Iconify width={24} icon={icon} />

      <div>
        {label}
        <Box
          component="span"
          className="value"
          sx={{ display: 'block', typography: 'body2', color: 'text.secondary' }}
        >
          {value || '-'}
        </Box>
      </div>
    </Box>
  );
}
