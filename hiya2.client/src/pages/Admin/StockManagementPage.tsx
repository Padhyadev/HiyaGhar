import React, { useEffect, useState } from 'react';
import { DataTable, type ColumnDef } from '../../components/admin/DataTable';
import { AdminAuthService } from '../../services/adminAuthService';
import { usePermission } from '../../context/PermissionContext';

interface StockLine {
  productId: number;
  productName: string;
  variantId: number;
  variantName: string;
  availableStock: number;
  reservedStock: number;
  sellableStock: number;
  isInStock: boolean;
  status: 'InStock' | 'LowStock' | 'OutOfStock';
}

const statusLabel: Record<StockLine['status'], string> = {
  InStock: 'In Stock',
  LowStock: 'Low Stock',
  OutOfStock: 'Out of Stock',
};

const statusColor: Record<StockLine['status'], string> = {
  InStock: '#2d6a4f',
  LowStock: '#b45309',
  OutOfStock: '#b42318',
};

interface StockManagementPageProps {
  onViewHistory?: (line: { productId: number; variantId: number; productName: string; variantName: string }) => void;
}

export const StockManagementPage: React.FC<StockManagementPageProps> = ({ onViewHistory }) => {
  const { currentMenuPermission } = usePermission('STOCK');
  const [lines, setLines] = useState<StockLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const [adjusting, setAdjusting] = useState<StockLine | null>(null);
  const [adjustMode, setAdjustMode] = useState<'StockIn' | 'Adjustment'>('StockIn');
  const [adjustQty, setAdjustQty] = useState<string>('');
  const [adjustRemarks, setAdjustRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadStock = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stock', { headers: AdminAuthService.getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setLines(data.items || []);
      } else {
        setLines([]);
      }
    } catch (e) {
      console.warn('Error loading stock:', e);
      setLines([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStock();
  }, []);

  const openAdjust = (line: StockLine, mode: 'StockIn' | 'Adjustment') => {
    setAdjusting(line);
    setAdjustMode(mode);
    setAdjustQty('');
    setAdjustRemarks('');
    setFormError(null);
  };

  const submitAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjusting) return;

    const qty = Number(adjustQty);
    if (!qty || Number.isNaN(qty)) {
      setFormError('Please enter a non-zero quantity.');
      return;
    }
    if (!adjustRemarks.trim()) {
      setFormError('A remark is required for every stock change.');
      return;
    }

    const signedQty = adjustMode === 'StockIn' ? Math.abs(qty) : qty;

    setSaving(true);
    try {
      const res = await fetch('/api/stock/adjust', {
        method: 'POST',
        headers: AdminAuthService.getAuthHeaders(),
        body: JSON.stringify({
          variantId: adjusting.variantId,
          quantity: signedQty,
          changeType: adjustMode,
          remarks: adjustRemarks.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(data.message || 'Failed to update stock.');
        return;
      }
      setAdjusting(null);
      showToastMsg('Stock updated.');
      await loadStock();
    } catch (e) {
      console.warn('Error adjusting stock:', e);
      setFormError('Failed to update stock. Please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnDef<StockLine>[] = [
    { key: 'productName', label: 'Product' },
    { key: 'variantName', label: 'Variant' },
    { key: 'availableStock', label: 'Available' },
    { key: 'reservedStock', label: 'Reserved' },
    { key: 'sellableStock', label: 'Sellable' },
    {
      key: 'status',
      label: 'Status',
      render: (l) => (
        <span style={{ color: statusColor[l.status], fontWeight: 700 }}>{statusLabel[l.status]}</span>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (l) => {
        return (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              className="hiyaghar-action-edit-btn"
              title="View stock history for this variant"
              onClick={() =>
                onViewHistory?.({
                  productId: l.productId,
                  variantId: l.variantId,
                  productName: l.productName,
                  variantName: l.variantName,
                })
              }
            >
              👁️
            </button>
            {currentMenuPermission.canEdit && (
              <>
                <button type="button" className="hiyaghar-export-btn" onClick={() => openAdjust(l, 'StockIn')}>
                  + Add Stock
                </button>
                <button type="button" className="hiyaghar-export-btn" onClick={() => openAdjust(l, 'Adjustment')}>
                  Adjust
                </button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      {toast && <div className="hiyaghar-role-toast">{toast}</div>}

      {!adjusting ? (
        <DataTable<StockLine>
          title="Stock Management"
          columns={columns}
          data={lines}
          loading={loading}
          canAdd={false}
          canEdit={false}
          canDelete={false}
        />
      ) : (
        <div className="hiyaghar-datatable-card">
          <div className="hiyaghar-datatable-top-header">
            <h2 className="hiyaghar-datatable-title">
              {adjustMode === 'StockIn' ? 'Add Stock' : 'Adjust Stock'}: {adjusting.productName} — {adjusting.variantName}
            </h2>
            <button type="button" className="hiyaghar-export-btn" onClick={() => setAdjusting(null)}>
              ← Back to Stock List
            </button>
          </div>

          <form onSubmit={submitAdjust} className="hiyaghar-role-modal-body" style={{ padding: 0 }}>
            <div className="hiyaghar-form-group">
              <label>Current Available Stock: {adjusting.availableStock}</label>
            </div>

            <div className="hiyaghar-form-group">
              <label>{adjustMode === 'StockIn' ? 'Quantity to Add *' : 'Quantity Change (use - to reduce) *'}</label>
              <input
                type="number"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                placeholder={adjustMode === 'StockIn' ? 'e.g. 50' : 'e.g. -5 or 10'}
                required
              />
            </div>

            <div className="hiyaghar-form-group">
              <label>Remarks *</label>
              <textarea
                value={adjustRemarks}
                onChange={(e) => setAdjustRemarks(e.target.value)}
                placeholder="Reason for this stock change..."
                rows={3}
                required
              />
            </div>

            {formError && <p style={{ color: '#b42318', fontSize: '0.85rem' }}>{formError}</p>}

            <div className="hiyaghar-modal-footer" style={{ marginTop: '20px' }}>
              <button type="button" className="hiyaghar-btn-cancel" onClick={() => setAdjusting(null)}>
                Cancel
              </button>
              <button type="submit" className="hiyaghar-btn-submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Stock Change'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
