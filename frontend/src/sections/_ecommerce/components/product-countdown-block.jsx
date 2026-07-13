import { useCountdownDate } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

// ----------------------------------------------------------------------

const timeUnits = ['days', 'hours', 'minutes', 'seconds'];

export function ProductCountdownBlock({
  sx,
  expired,
  slotProps,
  hideDays,
  hideHours,
  hideMinutes,
  hideSeconds,
  width = 56,
  height = 44,
  labelPlacement = 'bottom',
  ...other
}) {
  const countdown = useCountdownDate(expired);

  const shouldHideUnit = (unit) => {
    switch (unit) {
      case 'days':
        return hideDays;
      case 'hours':
        return hideHours;
      case 'minutes':
        return hideMinutes;
      case 'seconds':
        return hideSeconds;
      default:
        return false;
    }
  };

  const renderLabel = (unit) => {
    if (labelPlacement === 'inline') {
      return (
        <Box
          component="span"
          {...slotProps?.label}
          sx={[
            { opacity: 0.48, typography: 'subtitle2' },
            ...(Array.isArray(slotProps?.label?.sx) ? slotProps.label.sx : [slotProps?.label?.sx]),
          ]}
        >
          {unit.charAt(0)}
        </Box>
      );
    }
    if (labelPlacement === 'bottom') {
      return (
        <Box
          component="span"
          {...slotProps?.label}
          sx={[
            { textAlign: 'center', typography: 'caption', color: 'text.secondary' },
            ...(Array.isArray(slotProps?.label?.sx) ? slotProps.label.sx : [slotProps?.label?.sx]),
          ]}
        >
          {unit}
        </Box>
      );
    }
    return null;
  };

  return (
    <Stack
      divider={
        <Box component="strong" sx={{ lineHeight: `${height}px` }}>
          :
        </Box>
      }
      sx={[
        {
          gap: 1,
          flexDirection: 'row',
          typography: 'subtitle1',
          justifyContent: 'center',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {timeUnits.map((unit) => {
        if (shouldHideUnit(unit)) return null;

        return (
          <Box key={unit} sx={{ gap: 1, display: 'flex', flexDirection: 'column' }}>
            <Box
              component="span"
              {...slotProps?.value}
              sx={[
                {
                  width,
                  height,
                  gap: 0.25,
                  display: 'flex',
                  borderRadius: 1,
                  bgcolor: 'grey.800',
                  alignItems: 'center',
                  color: 'common.white',
                  justifyContent: 'center',
                },
                ...(Array.isArray(slotProps?.value?.sx)
                  ? slotProps.value.sx
                  : [slotProps?.value?.sx]),
              ]}
            >
              {countdown[unit]}
              {labelPlacement === 'inline' && renderLabel(unit)}
            </Box>

            {labelPlacement === 'bottom' && renderLabel(unit)}
          </Box>
        );
      })}
    </Stack>
  );
}
