import React from 'react';
import ManualReviewSection from '../components/ManualReviewSection';

export default function ReviewPage({
  pendingRecords,
  allRecords,
  onApprove,
  onReject
}) {
  return (
    <ManualReviewSection
      pendingRecords={pendingRecords}
      allRecords={allRecords}
      onApprove={onApprove}
      onReject={onReject}
    />
  );
}
