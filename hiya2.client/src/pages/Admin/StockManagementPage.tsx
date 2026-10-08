import React, { useEffect, useState } from 'react';
import { DataTable, type ColumnDef } from '../../components/admin/DataTable';
import { AdminAuthService } from '../../services/adminAuthService';
import { usePermission } from '../../context/PermissionContext';
import { showToast } from '../../utils/alertService';

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

  const [adjusting, setAdjusting] = useState<StockLine | null>(null);
  const [adjustMode, setAdjustMode] = useState<'StockIn' | 'Adjustment'>('StockIn');
  const [adjustQty, setAdjustQty] = useState<string>('');
  const [adjustRemarks, setAdjustRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [isBulkMode, setIsBulkMode] = useState<boolean>(false);
  const [bulkDraft, setBulkDraft] = useState<Record<number, number>>({});
  const [bulkSaving, setBulkSaving] = useState<boolean>(false);

  const showToastMsg = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    showToast(msg, type);
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

  const handleOpenBulkMode = () => {
    const draft: Record<number, number> = {};
    lines.forEach((l) => {
      draft[l.variantId] = l.availableStock;
    });
    setBulkDraft(draft);
    setIsBulkMode(true);
  };

  const handleBulkSave = async () => {
    const changes: { variantId: number; quantity: number; changeType: string; remarks: string }[] = [];
    lines.forEach((l) => {
      const targetStock = bulkDraft[l.variantId];
      if (targetStock !== undefined && targetStock !== l.availableStock) {
        const delta = targetStock - l.availableStock;
        changes.push({
          variantId: l.variantId,
          quantity: delta,
          changeType: 'Adjustment',
          remarks: `Bulk Quick Update from ${l.availableStock} to ${targetStock}`,
        });
      }
    });

    if (changes.length === 0) {
      showToastMsg('No stock changes detected.', 'info');
      setIsBulkMode(false);
      return;
    }

    setBulkSaving(true);
    try {
      const res = await fetch('/api/stock/bulk-adjust', {
        method: 'POST',
        headers: AdminAuthService.getAuthHeaders(),
        body: JSON.stringify({ items: changes }),
      });
      const data = await res.json();
      if (res.ok && data.isSuccess) {
        showToastMsg(`✅ ${data.message || 'Bulk stock updated successfully!'}`);
        setIsBulkMode(false);
        await loadStock();
      } else {
        showToastMsg(data.message || 'Failed to update bulk stock.', 'error');
      }
    } catch (e: any) {
      showToastMsg(e.message || 'Network error while updating bulk stock.', 'error');
    } finally {
      setBulkSaving(false);
    }
  };

  const openAdjust = (line: StockLine, mode: 'StockIn' | 'Adjustment') => {
    setAdjusting(line);
    setAdjustMode(mode);
    setAdjustQty('');
    setAdjustRemarks('');
    setFormErrors({});
  };

  const submitAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjusting) return;

    const newErrors: Record<string, string> = {};
    const qty = Number(adjustQty);

    if (!adjustQty || Number.isNaN(qty) || qty === 0) {
      newErrors.adjustQty = 'Please enter quantity';
    }
    if (!adjustRemarks.trim()) {
      newErrors.adjustRemarks = 'Please enter remarks';
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }
    setFormErrors({});

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
        setFormErrors({ submit: data.message || 'Failed to update stock. Please try again' });
        return;
      }
      setAdjusting(null);
      showToastMsg('Stock updated successfully.');
      await loadStock();
    } catch (e) {
      console.warn('Error adjusting stock:', e);
      setFormErrors({ submit: 'Failed to update stock. Please check your connection and try again' });
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnDef<StockLine>[] = [
    { key: 'productName', label: 'Product' },
    { key: 'variantName', label: 'Variant' },
    {
      key: 'availableStock',
      label: 'Available',
      render: (l) =>
        isBulkMode ? (
          <input
            type="number"
            min={0}
            style={{ width: '90px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #D19A27', fontWeight: 700 }}
            value={bulkDraft[l.variantId] ?? l.availableStock}
            onChange={(e) => {
              const val = Math.max(0, parseInt(e.target.value, 10) || 0);
              setBulkDraft((prev) => ({ ...prev, [l.variantId]: val }));
            }}
          />
        ) : (
          <strong>{l.availableStock}</strong>
        ),
    },
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
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
            {currentMenuPermission.canEdit && !isBulkMode && (
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
      {!adjusting ? (
        <DataTable<StockLine>
          title="Stock Management"
          columns={columns}
          data={lines}
          loading={loading}
          canAdd={false}
          canEdit={false}
          canDelete={false}
          extraControls={
            currentMenuPermission.canEdit && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {isBulkMode ? (
                  <>
                    <button
                      type="button"
                      className="hiyaghar-add-entity-btn"
                      style={{ padding: '6px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                      onClick={handleBulkSave}
                      disabled={bulkSaving}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="17 21 17 13 7 13 7 21" />
                        <polyline points="7 3 7 8 15 8" />
                      </svg>
                      <span>{bulkSaving ? 'Saving...' : 'Save All Stock Changes'}</span>
                    </button>
                    <button
                      type="button"
                      className="hiyaghar-export-btn"
                      onClick={() => setIsBulkMode(false)}
                      disabled={bulkSaving}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="hiyaghar-panel-btn"
                    style={{ background: '#10243E', color: '#fff', padding: '6px 12px', fontSize: '0.82rem', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                    onClick={handleOpenBulkMode}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                    <span>Bulk Stock Quick Edit</span>
                  </button>
                )}
              </div>
            )
          }
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

          <form onSubmit={submitAdjust} className="hiyaghar-role-modal-body" style={{ padding: 0 }} noValidate>
            <div className="hiyaghar-form-group">
              <label>Current Available Stock: {adjusting.availableStock}</label>
            </div>

            <div className="hiyaghar-form-group">
              <label>{adjustMode === 'StockIn' ? 'Quantity to Add *' : 'Quantity Change (use - to reduce) *'}</label>
              <input
                type="number"
                value={adjustQty}
                className={formErrors.adjustQty ? 'input-error' : ''}
                onChange={(e) => {
                  setAdjustQty(e.target.value);
                  if (formErrors.adjustQty) setFormErrors((prev) => ({ ...prev, adjustQty: '' }));
                }}
                placeholder={adjustMode === 'StockIn' ? 'e.g. 50' : 'e.g. -5 or 10'}
              />
              {formErrors.adjustQty && <span className="hiyaghar-field-error">{formErrors.adjustQty}</span>}
            </div>

            <div className="hiyaghar-form-group">
              <label>Remarks *</label>
              <textarea
                value={adjustRemarks}
                className={formErrors.adjustRemarks ? 'input-error' : ''}
                onChange={(e) => {
                  setAdjustRemarks(e.target.value);
                  if (formErrors.adjustRemarks) setFormErrors((prev) => ({ ...prev, adjustRemarks: '' }));
                }}
                placeholder="Reason for this stock change..."
                rows={3}
              />
              {formErrors.adjustRemarks && <span className="hiyaghar-field-error">{formErrors.adjustRemarks}</span>}
            </div>

            {formErrors.submit && <p style={{ color: '#b42318', fontSize: '0.85rem' }}>{formErrors.submit}</p>}

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
