import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';

import { Iconify } from 'src/components/iconify';

import { FilterTime } from './filter-time';
import { FilterGuests } from './filter-guests';
import { FilterLocation } from './filter-location';

// ----------------------------------------------------------------------

export function TravelFilters({ sx, ...other }) {
  const [guests, setGuests] = useState({ adults: 0, children: 0 });
  const [departureDay, setDepartureDay] = useState(null);

  const handleChangeDepartureDay = useCallback((newValue) => {
    setDepartureDay(newValue);
  }, []);

  const handleIncrement = useCallback(
    (guest) => {
      if (guest === 'children') {
        setGuests({ ...guests, children: guests.children + 1 });
      } else {
        setGuests({ ...guests, adults: guests.adults + 1 });
      }
    },
    [guests]
  );

  const handleDecrease = useCallback(
    (guest) => {
      if (guest === 'children') {
        setGuests({ ...guests, children: guests.children - 1 });
      } else {
        setGuests({ ...guests, adults: guests.adults - 1 });
      }
    },
    [guests]
  );

  const renderDivider = () => (
    <Divider flexItem orientation="vertical" sx={{ display: { xs: 'none', md: 'block' } }} />
  );

  return (
    <Box
      sx={[
        {
          p: 4,
          gap: 2.5,
          display: 'flex',
          borderRadius: 2,
          alignItems: { md: 'center' },
          bgcolor: 'background.neutral',
          flexDirection: { xs: 'column', md: 'row' },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <FilterLocation />

      {renderDivider()}

      <FilterTime value={departureDay} onChange={handleChangeDepartureDay} />

      {renderDivider()}

      <FilterGuests value={guests} onDecrease={handleDecrease} onIncrement={handleIncrement} />

      <Button
        size="large"
        color="secondary"
        variant="contained"
        sx={{ px: 0, flexShrink: 0, minWidth: { xs: 1, md: 48 } }}
      >
        <Iconify icon="carbon:search" />
      </Button>
    </Box>
  );
}
