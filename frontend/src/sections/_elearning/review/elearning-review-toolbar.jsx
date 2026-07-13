import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';

// ----------------------------------------------------------------------

const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'popular', label: 'Popular' },
];

// ----------------------------------------------------------------------

export function ElearningReviewToolbar({ sort, onChangeSort, sx, ...other }) {
  return (
    <Box
      sx={[
        {
          mb: 5,
          gap: 5,
          display: 'flex',
          alignItems: 'center',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Typography variant="h4" sx={{ flexGrow: 1 }}>
        Reviews
      </Typography>

      <FormControl hiddenLabel size="small" sx={{ flexShrink: 0 }}>
        <Select value={sort} onChange={onChangeSort} inputProps={{ id: `sort-select` }}>
          {SORT_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
