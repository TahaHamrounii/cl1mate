import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

export function PostTags({ tags, sx, ...other }) {
  return (
    <Box
      sx={[
        {
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Typography variant="subtitle2" sx={{ mr: 1 }}>
        Tags:
      </Typography>
      <Box sx={{ gap: 1, display: 'flex', flexWrap: 'wrap' }}>
        {tags.map((tag) => (
          <Chip key={tag} size="small" variant="soft" label={tag} onClick={() => {}} />
        ))}
      </Box>
    </Box>
  );
}
