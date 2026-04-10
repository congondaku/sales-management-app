import React, { useState } from 'react';
import PartnerQueue  from './PartnerQueue';
import PartnerDetail from './PartnerDetail';

const PartnersPage = () => {
  const [selected, setSelected] = useState(null);

  if (selected) {
    return (
      <PartnerDetail
        partner={selected}
        onBack={() => setSelected(null)}
        onReviewed={() => setSelected(null)}
      />
    );
  }

  return (
    <PartnerQueue
      onSelectPartner={(p) => setSelected(p)}
    />
  );
};

export default PartnersPage;
