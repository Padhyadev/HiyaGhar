import React, { useState } from 'react';
import { RewardSettingsPage } from './RewardSettingsPage';
import { RewardSlabManagementPage } from './RewardSlabManagementPage';
import { RewardLedgerPage } from './RewardLedgerPage';

type RewardTab = 'settings' | 'slabs' | 'ledger';

export const RewardModulePage: React.FC = () => {
  const [tab, setTab] = useState<RewardTab>('settings');

  const tabs: { key: RewardTab; label: string }[] = [
    { key: 'settings', label: 'Reward Settings' },
    { key: 'slabs', label: 'Order Reward Slabs' },
    { key: 'ledger', label: 'Customer Ledger' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: 'none',
              borderBottom: tab === t.key ? '3px solid #CB992C' : '3px solid transparent',
              fontWeight: tab === t.key ? 700 : 500,
              color: tab === t.key ? '#11223A' : '#667085',
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'settings' && <RewardSettingsPage />}
      {tab === 'slabs' && <RewardSlabManagementPage />}
      {tab === 'ledger' && <RewardLedgerPage />}
    </div>
  );
};
