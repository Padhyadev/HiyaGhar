import React, { useEffect, useMemo, useRef, useState } from 'react';
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

interface CustomerOption {
  customerId: number;
  firstName: string;
  lastName: string;
  email: string;
  mobileNo: string;
  isGuest?: boolean;
}

const MAX_SUGGESTIONS = 50;

const customerName = (c: CustomerOption) => `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unnamed customer';

export const RewardLedgerPage: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [customerQuery, setCustomerQuery] = useState('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Admins pick a customer by name / mobile / email instead of remembering IDs.
  // Guests are left out - they can't earn reward coins.
  useEffect(() => {
    fetch('/api/customer', { headers: AdminAuthService.getAuthHeaders() })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCustomers(Array.isArray(data) ? data.filter((c: CustomerOption) => !c.isGuest) : []))
      .catch((e) => console.warn('Error loading customers:', e));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setIsPickerOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const matchingCustomers = useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    const list = q
      ? customers.filter((c) =>
          customerName(c).toLowerCase().includes(q) ||
          (c.mobileNo || '').includes(q) ||
          (c.email || '').toLowerCase().includes(q) ||
          String(c.customerId) === q
        )
      : customers;
    return list.slice(0, MAX_SUGGESTIONS);
  }, [customers, customerQuery]);

  const handleSelectCustomer = (customer: CustomerOption) => {
    setSelectedCustomer(customer);
    setCustomerQuery(`${customerName(customer)} (${customer.mobileNo || customer.email})`);
    setIsPickerOpen(false);
    loadLedger(customer.customerId);
  };

  const loadLedger = async (customerId: number) => {
    setError(null);
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
        <div ref={pickerRef} className="hiyaghar-form-group" style={{ position: 'relative', maxWidth: '460px', margin: 0 }}>
          <label>Customer</label>
          <input
            type="text"
            value={customerQuery}
            onChange={(e) => {
              setCustomerQuery(e.target.value);
              setIsPickerOpen(true);
            }}
            onFocus={(e) => {
              e.target.select();
              setIsPickerOpen(true);
            }}
            placeholder="Search by name, mobile or email"
            autoComplete="off"
            role="combobox"
            aria-expanded={isPickerOpen}
            aria-controls="reward-ledger-customer-list"
          />
          {isPickerOpen && (
            <ul
              id="reward-ledger-customer-list"
              role="listbox"
              style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, margin: '4px 0 0', padding: '4px 0',
                listStyle: 'none', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px',
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)', maxHeight: '280px', overflowY: 'auto',
              }}
            >
              {matchingCustomers.length === 0 ? (
                <li style={{ padding: '10px 14px', color: '#64748b', fontSize: '0.88rem' }}>
                  {customers.length === 0 ? 'Loading customers...' : 'No customer found'}
                </li>
              ) : (
                matchingCustomers.map((c) => (
                  <li
                    key={c.customerId}
                    role="option"
                    aria-selected={selectedCustomer?.customerId === c.customerId}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectCustomer(c)}
                    style={{
                      padding: '8px 14px', cursor: 'pointer',
                      background: selectedCustomer?.customerId === c.customerId ? '#FFF8E6' : 'transparent',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = selectedCustomer?.customerId === c.customerId ? '#FFF8E6' : 'transparent')}
                  >
                    <div style={{ fontWeight: 700, color: '#11223A', fontSize: '0.9rem' }}>{customerName(c)}</div>
                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                      {[c.mobileNo, c.email].filter(Boolean).join(' · ')}
                    </div>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
        {error && <p style={{ color: '#b42318', fontSize: '0.85rem', marginTop: '10px' }}>{error}</p>}
        {selectedCustomer && balance !== null && !loading && (
          <p style={{ marginTop: '10px', fontWeight: 700, color: '#11223A' }}>
            {customerName(selectedCustomer)} — Current Balance: {balance} coins
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
