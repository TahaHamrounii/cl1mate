import Box from '@mui/material/Box';
import Pagination, { paginationClasses } from '@mui/material/Pagination';

import { EcommerceReviewItem } from './ecommerce-review-item';

// ----------------------------------------------------------------------

export function EcommerceReviewList({ reviews, sx, ...other }) {
  return (
    <Box sx={[{ pt: 5 }, ...(Array.isArray(sx) ? sx : [sx])]} {...other}>
      {reviews.map((review) => (
        <EcommerceReviewItem
          key={review.id}
          name={review.name}
          avatarUrl={review.avatarUrl}
          createdAt={review.createdAt}
          message={review.message}
          rating={review.rating}
          helpful={review.helpful}
        />
      ))}

      <Pagination
        count={10}
        sx={{
          mt: 5,
          mb: 10,
          [`& .${paginationClasses.ul}`]: { justifyContent: 'center' },
        }}
      />
    </Box>
  );
}
