import { Fragment } from 'react';

import Pagination, { paginationClasses } from '@mui/material/Pagination';

import { ElearningReviewItem } from './elearning-review-item';

// ----------------------------------------------------------------------

export function ElearningReviewList({ reviews }) {
  const renderReplyComments = (comments, users) =>
    comments.map((replyItem) => {
      const replyUser = users.find((user) => user.id === replyItem.userId);

      return (
        <ElearningReviewItem
          key={replyItem.id}
          tagUser={replyItem.tagUser}
          createdAt={replyItem.createdAt}
          message={replyItem.message}
          name={replyUser?.name}
          avatarUrl={replyUser?.avatarUrl}
          hasReply
        />
      );
    });

  return (
    <>
      {reviews.map((review) => (
        <Fragment key={review.id}>
          <ElearningReviewItem
            name={review.name}
            avatarUrl={review.avatarUrl}
            createdAt={review.createdAt}
            message={review.message}
            rating={review.rating}
            helpful={review.helpful}
          />

          {!!review.replyComment.length && renderReplyComments(review.replyComment, review.users)}
        </Fragment>
      ))}

      <Pagination
        count={10}
        sx={{
          mt: 5,
          mb: 10,
          [`& .${paginationClasses.ul}`]: { justifyContent: 'center' },
        }}
      />
    </>
  );
}
