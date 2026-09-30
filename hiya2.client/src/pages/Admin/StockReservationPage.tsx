import React, { useEffect, useState } from 'react';
import { DataTable, type ColumnDef } from '../../components/admin/DataTable';
import { AdminAuthService } from '../../services/adminAuthService';

interface ReservationLine {
  id: number;
  customerName?: string;
  productName: string;
  variantName: string;
  quantity: number;
  status: 'Reserved' | 'Released' | 'Expired' | 'Converted';
  reservedAt: string;
  expiresAt: string;
  orderId?: number;
}

const statusColor: Record<ReservationLine['status'], string> = {
  Reserved: '#2d6a4f',
  Released: '#667085',
  Expired: '#b45309',
  Converted: '#1d4ed8',
};

export const StockReservationPage: React.FC = () => {
  const [lines, setLines] = useState<ReservationLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const load = async (status: string) => {
    setLoading(true);
    try {
      const url = status ? `/api/stockreservation?status=${status}` : '/api/stockreservation';
      const res = await fetch(url, { headers: AdminAuthService.getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setLines(data.items || []);
      } else {
        setLines([]);
      }
    } catch (e) {
      console.warn('Error loading reservations:', e);
      setLines([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const columns: ColumnDef<ReservationLine>[] = [
    { key: 'customerName', label: 'Customer', render: (r) => <span>{r.customerName || '-'}</span> },
    { key: 'productName', label: 'Product' },
    { key: 'variantName', label: 'Variant' },
    { key: 'quantity', label: 'Qty' },
    { key: 'reservedAt', label: 'Reserved At', render: (r) => <span>{new Date(r.reservedAt).toLocaleString()}</span> },
    { key: 'expiresAt', label: 'Expires At', render: (r) => <span>{new Date(r.expiresAt).toLocaleString()}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <span style={{ color: statusColor[r.status], fontWeight: 700 }}>{r.status}</span>,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
        {['', 'Reserved', 'Released', 'Expired', 'Converted'].map((s) => (
          <button
            key={s || 'all'}
            type="button"
            className="hiyaghar-export-btn"
            style={statusFilter === s ? { background: '#11223A', color: '#fff' } : undefined}
            onClick={() => setStatusFilter(s)}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <DataTable<ReservationLine>
        title="Stock Reservations"
        columns={columns}
        data={lines}
        loading={loading}
        canAdd={false}
        canEdit={false}
        canDelete={false}
      />
    </div>
  );
};
