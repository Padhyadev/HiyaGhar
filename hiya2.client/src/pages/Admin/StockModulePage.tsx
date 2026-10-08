import React, { useState } from 'react';
import { StockManagementPage } from './StockManagementPage';
import { StockHistoryPage } from './StockHistoryPage';
import { StockReservationPage } from './StockReservationPage';

type StockTab = 'overview' | 'history' | 'reservations';

interface HistoryFilter {
  productId?: number;
  variantId?: number;
  productName?: string;
  variantName?: string;
}

export const StockModulePage: React.FC = () => {
  const [tab, setTab] = useState<StockTab>('overview');
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>({});

  const tabs: { key: StockTab; label: string }[] = [
    { key: 'overview', label: 'Stock Overview' },
    { key: 'history', label: 'Stock History' },
    { key: 'reservations', label: 'Reservations' },
  ];

  const handleTabClick = (key: StockTab) => {
    setTab(key);
    if (key !== 'history') {
      setHistoryFilter({});
    }
  };

  const handleViewHistory = (line: { productId: number; variantId: number; productName: string; variantName: string }) => {
    setHistoryFilter(line);
    setTab('history');
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => handleTabClick(t.key)}
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

      {tab === 'overview' && <StockManagementPage onViewHistory={handleViewHistory} />}
      {tab === 'history' && (
        <StockHistoryPage
          productId={historyFilter.productId}
          variantId={historyFilter.variantId}
          productName={historyFilter.productName}
          variantName={historyFilter.variantName}
          onClearFilter={() => setHistoryFilter({})}
        />
      )}
      {tab === 'reservations' && <StockReservationPage />}
    </div>
  );
};
