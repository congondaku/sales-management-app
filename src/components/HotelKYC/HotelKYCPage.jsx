import React, { useState } from 'react';
import HotelKYCQueue from './HotelKYCQueue';
import HotelKYCDetail from './HotelKYCDetail';

const HotelKYCPage = () => {
  const [selectedId, setSelectedId] = useState(null);

  if (selectedId) {
    return (
      <HotelKYCDetail
        accountId={selectedId}
        onBack={() => setSelectedId(null)}
        onReviewed={() => setSelectedId(null)}
      />
    );
  }

  return (
    <HotelKYCQueue
      onSelectAccount={(account) => setSelectedId(account.id)}
    />
  );
};

export default HotelKYCPage;
