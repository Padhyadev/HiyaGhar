import React, { useEffect, useState } from 'react';
import { DataTable, type ColumnDef } from '../../components/admin/DataTable';
import { AdminAuthService } from '../../services/adminAuthService';

interface HistoryLine {
  id: number;
  productName: string;
  variantName: string;
  changeType: string;
  quantityChanged: number;
  previousStock: number;
  newStock: number;
  referenceType?: string;
  referenceId?: number;
  remarks?: string;
  changedBy?: number;
  changedDate: string;
}

interface StockHistoryPageProps {
  productId?: number;
  variantId?: number;
  productName?: string;
  variantName?: string;
  onClearFilter?: () => void;
}

export const StockHistoryPage: React.FC<StockHistoryPageProps> = ({
  productId,
  variantId,
  productName,
  variantName,
  onClearFilter,
}) => {
  const [lines, setLines] = useState<HistoryLine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (productId) params.set('productId', String(productId));
        if (variantId) params.set('variantId', String(variantId));
        const url = params.toString() ? `/api/stock/history?${params.toString()}` : '/api/stock/history';

        const res = await fetch(url, { headers: AdminAuthService.getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          setLines(data.items || []);
        } else {
          setLines([]);
        }
      } catch (e) {
        console.warn('Error loading stock history:', e);
        setLines([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [productId, variantId]);

  const columns: ColumnDef<HistoryLine>[] = [
    { key: 'productName', label: 'Product' },
    { key: 'variantName', label: 'Variant' },
    { key: 'changeType', label: 'Type' },
    { key: 'quantityChanged', label: 'Qty', render: (h) => <span>{h.quantityChanged > 0 ? `+${h.quantityChanged}` : h.quantityChanged}</span> },
    { key: 'stockChange', label: 'Previous → New', render: (h) => <span>{h.previousStock} → {h.newStock}</span> },
    { key: 'referenceType', label: 'Reference', render: (h) => <span>{h.referenceType ? `${h.referenceType}${h.referenceId ? ' #' + h.referenceId : ''}` : '-'}</span> },
    { key: 'remarks', label: 'Remarks', render: (h) => <span>{h.remarks || '-'}</span> },
    { key: 'changedDate', label: 'Date', render: (h) => <span>{new Date(h.changedDate).toLocaleString()}</span> },
  ];

  const isFiltered = !!(productId || variantId);

  return (
    <div>
      {isFiltered && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
            padding: '10px 16px',
            background: '#FFFDF5',
            border: '1px solid #F0E6C8',
            borderRadius: '8px',
          }}
        >
          <span style={{ fontSize: '0.9rem', color: '#11223A' }}>
            Showing history for: <strong>{productName || `Product #${productId}`}</strong>
            {variantName ? ` — ${variantName}` : ''}
          </span>
          {onClearFilter && (
            <button type="button" className="hiyaghar-export-btn" onClick={onClearFilter}>
              ✕ Clear filter
            </button>
          )}
        </div>
      )}

      <DataTable<HistoryLine>
        title="Stock History"
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
