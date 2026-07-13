import Box from '@mui/material/Box';
import Link from '@mui/material/Link';

import { fDate } from 'src/utils/format-time';

import { Image } from 'src/components/image';

import { PostTime } from './post-time';

// ----------------------------------------------------------------------

export function PostItemMobile({ post, onSiderbar, sx, ...other }) {
  return (
    <Box
      sx={[
        {
          gap: 2,
          width: 1,
          display: 'flex',
          alignItems: { xs: 'flex-start', md: 'unset' },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Image
        alt={post.title}
        src={post.coverUrl}
        sx={{
          width: 64,
          height: 64,
          flexShrink: 0,
          borderRadius: 1.5,
        }}
      />

      <Box sx={{ flexGrow: 1 }}>
        <Link
          color="inherit"
          variant={onSiderbar ? 'subtitle2' : 'subtitle1'}
          sx={(theme) => ({
            ...theme.mixins.maxLine({
              line: 2,
              persistent: onSiderbar ? theme.typography.subtitle2 : theme.typography.subtitle1,
            }),
            mb: onSiderbar ? 0.5 : 1,
          })}
        >
          {post.title}
        </Link>

        <PostTime createdAt={fDate(post.createdAt)} duration={post.duration} />
      </Box>
    </Box>
  );
}
