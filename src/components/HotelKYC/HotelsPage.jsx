import React, { useState } from 'react';
import { ClipboardCheck, Building2, Bell } from 'lucide-react';
import HotelKYCQueue      from './HotelKYCQueue';
import HotelKYCDetail     from './HotelKYCDetail';
import HotelOperatorsTab  from './HotelOperatorsTab';
import PendingProfileReviewsTab from './PendingProfileReviewsTab';

const HotelsPage = () => {
  const [activeTab,   setActiveTab]   = useState('operators');
  const [kycDetailId, setKycDetailId] = useState(null);

  // ── KYC sub-navigation ────────────────────────────────────────
  const renderKycTab = () => {
    if (kycDetailId) {
      return (
        <HotelKYCDetail
          accountId={kycDetailId}
          onBack={() => setKycDetailId(null)}
          onReviewed={() => setKycDetailId(null)}
        />
      );
    }
    return (
      <HotelKYCQueue
        onSelectAccount={(account) => setKycDetailId(account.id)}
      />
    );
  };

  const TABS = [
    { id: 'operators', label: 'Opérateurs',  icon: Building2      },
    { id: 'reviews',   label: 'Révisions',   icon: Bell           },
    { id: 'kyc',       label: 'KYC Queue',   icon: ClipboardCheck },
  ];

  return (
    <div className="space-y-0">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {TABS.map(tab => {
          const Icon     = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setKycDetailId(null);
              }}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'operators' && <HotelOperatorsTab />}
      {activeTab === 'reviews'   && <PendingProfileReviewsTab />}
      {activeTab === 'kyc'       && renderKycTab()}
    </div>
  );
};

export default HotelsPage;
