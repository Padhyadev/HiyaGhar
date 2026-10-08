import React, { useState } from 'react';
import { DataTable, type ColumnDef } from '../../components/admin/DataTable';
import { AdminAuthService } from '../../services/adminAuthService';

interface LedgerEntry {
  id: number;
  orderId?: number;
  type: string;
  coins: number;
  source?: string;
  remarks?: string;
  balanceAfter: number;
  createdDate: string;
}

export const RewardLedgerPage: React.FC = () => {
  const [customerIdInput, setCustomerIdInput] = useState('');
  const [searchedCustomerId, setSearchedCustomerId] = useState<number | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const customerId = Number(customerIdInput);
    if (!customerId || customerId <= 0) {
      setError('Please enter a valid customer ID.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/reward/ledger/${customerId}`, {
        headers: AdminAuthService.getAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || 'Failed to load ledger for this customer.');
        setEntries([]);
        setBalance(null);
        return;
      }
      setBalance(data.balance ?? 0);
      setEntries(data.transactions || []);
      setSearchedCustomerId(customerId);
    } catch (e) {
      console.warn('Error loading customer ledger:', e);
      setError('Failed to load ledger. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnDef<LedgerEntry>[] = [
    { key: 'createdDate', label: 'Date', render: (t) => <span>{new Date(t.createdDate).toLocaleString()}</span> },
    { key: 'type', label: 'Type' },
    { key: 'source', label: 'Source', render: (t) => <span>{t.source || '-'}</span> },
    {
      key: 'coins',
      label: 'Coins',
      render: (t) => (
        <span style={{ color: t.coins >= 0 ? '#2d6a4f' : '#b42318', fontWeight: 700 }}>
          {t.coins >= 0 ? `+${t.coins}` : t.coins}
        </span>
      ),
    },
    { key: 'balanceAfter', label: 'Balance After' },
    { key: 'orderId', label: 'Order', render: (t) => <span>{t.orderId ? `#${t.orderId}` : '-'}</span> },
    { key: 'remarks', label: 'Remarks', render: (t) => <span>{t.remarks || '-'}</span> },
  ];

  return (
    <div>
      <div className="hiyaghar-datatable-card" style={{ marginBottom: '16px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="hiyaghar-form-group" style={{ minWidth: '220px' }}>
            <label>Customer ID</label>
            <input
              type="number"
              value={customerIdInput}
              onChange={(e) => setCustomerIdInput(e.target.value)}
              placeholder="e.g. 42"
            />
          </div>
          <button type="submit" className="hiyaghar-btn-submit" disabled={loading}>
            {loading ? 'Searching...' : 'View Ledger'}
          </button>
        </form>
        {error && <p style={{ color: '#b42318', fontSize: '0.85rem', marginTop: '10px' }}>{error}</p>}
        {searchedCustomerId !== null && balance !== null && (
          <p style={{ marginTop: '10px', fontWeight: 700, color: '#11223A' }}>
            Customer #{searchedCustomerId} — Current Balance: {balance} coins
          </p>
        )}
      </div>

      <DataTable<LedgerEntry>
        title="Reward Coin Ledger"
        columns={columns}
        data={entries}
        loading={loading}
        canAdd={false}
        canEdit={false}
        canDelete={false}
      />
    </div>
  );
};
