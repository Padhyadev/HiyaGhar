import React, { useEffect, useState } from 'react';
import { DataTable, type ColumnDef } from '../../components/admin/DataTable';
import { AdminAuthService } from '../../services/adminAuthService';
import { usePermission } from '../../context/PermissionContext';
import { showConfirm, showToast } from '../../utils/alertService';

interface RewardSlab {
  id: number;
  minOrderAmount: number;
  maxOrderAmount: number;
  rewardCoins: number;
  isActive: boolean;
}

const emptyForm = { minOrderAmount: '', maxOrderAmount: '', rewardCoins: '', isActive: true };

export const RewardSlabManagementPage: React.FC = () => {
  const { currentMenuPermission } = usePermission('REWARD');
  const [slabs, setSlabs] = useState<RewardSlab[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const showToastMsg = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    showToast(msg, type);
  };

  const loadSlabs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reward/slabs', { headers: AdminAuthService.getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSlabs(Array.isArray(data) ? data : []);
      } else {
        setSlabs([]);
      }
    } catch (e) {
      console.warn('Error loading reward slabs:', e);
      setSlabs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlabs();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormErrors({});
    setViewMode('form');
  };

  const openEdit = (slab: RewardSlab) => {
    setEditingId(slab.id);
    setForm({
      minOrderAmount: String(slab.minOrderAmount),
      maxOrderAmount: String(slab.maxOrderAmount),
      rewardCoins: String(slab.rewardCoins),
      isActive: slab.isActive,
    });
    setFormErrors({});
    setViewMode('form');
  };

  const handleDelete = async (slab: RewardSlab) => {
    const isConfirmed = await showConfirm(`Are you sure you want to delete reward slab ₹${slab.minOrderAmount}–₹${slab.maxOrderAmount}?`, 'Delete Reward Slab');
    if (!isConfirmed) return;
    try {
      const res = await fetch(`/api/reward/slabs/${slab.id}`, {
        method: 'DELETE',
        headers: AdminAuthService.getAuthHeaders(),
      });
      if (res.ok) {
        showToastMsg('Reward slab deleted successfully');
        await loadSlabs();
      }
    } catch (e) {
      console.warn('Error deleting reward slab:', e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!form.minOrderAmount) {
      newErrors.minOrderAmount = 'Please enter minimum order amount';
    }
    if (!form.maxOrderAmount) {
      newErrors.maxOrderAmount = 'Please enter maximum order amount';
    }
    if (!form.rewardCoins) {
      newErrors.rewardCoins = 'Please enter reward coins earned';
    }

    const min = Number(form.minOrderAmount);
    const max = Number(form.maxOrderAmount);
    const coins = Number(form.rewardCoins);

    if (form.minOrderAmount && (Number.isNaN(min) || min < 0)) {
      newErrors.minOrderAmount = 'Please enter valid minimum order amount';
    }
    if (form.maxOrderAmount && (Number.isNaN(max) || max <= min)) {
      newErrors.maxOrderAmount = 'Please enter maximum amount greater than minimum amount';
    }
    if (form.rewardCoins && (Number.isNaN(coins) || coins <= 0)) {
      newErrors.rewardCoins = 'Please enter valid positive reward coins';
    }

    const overlapping = slabs.some(
      (s) =>
        s.id !== editingId &&
        s.isActive &&
        min <= s.maxOrderAmount &&
        max >= s.minOrderAmount
    );
    if (!newErrors.minOrderAmount && !newErrors.maxOrderAmount && overlapping) {
      newErrors.maxOrderAmount = 'Please select amount range that does not overlap with existing slab';
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }
    setFormErrors({});

    setSaving(true);
    try {
      const url = editingId ? `/api/reward/slabs/${editingId}` : '/api/reward/slabs';
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: AdminAuthService.getAuthHeaders(),
        body: JSON.stringify({
          minOrderAmount: min,
          maxOrderAmount: max,
          rewardCoins: coins,
          isActive: form.isActive,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormErrors({ submit: data.message || 'Failed to save reward slab. Please try again' });
        return;
      }
      showToastMsg(editingId ? 'Reward slab updated successfully' : 'Reward slab created successfully');
      setViewMode('list');
      await loadSlabs();
    } catch (e) {
      console.warn('Error saving reward slab:', e);
      setFormErrors({ submit: 'Failed to save reward slab. Please check your connection' });
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnDef<RewardSlab>[] = [
    { key: 'range', label: 'Order Amount Range', render: (s) => <span>₹{s.minOrderAmount} — ₹{s.maxOrderAmount}</span> },
    { key: 'rewardCoins', label: 'Coins Earned' },
    {
      key: 'isActive',
      label: 'Status',
      render: (s) => (
        <span style={{ color: s.isActive ? '#2d6a4f' : '#667085', fontWeight: 700 }}>
          {s.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  return (
    <div>
      {viewMode === 'list' ? (
        <DataTable<RewardSlab>
          title="Order Reward Slabs"
          addButtonText="+ Add Slab"
          columns={columns}
          data={slabs}
          loading={loading}
          canAdd={currentMenuPermission.canAdd}
          canEdit={currentMenuPermission.canEdit}
          canDelete={currentMenuPermission.canDelete}
          onAddClick={openAdd}
          onEditClick={openEdit}
          onDeleteClick={handleDelete}
        />
      ) : (
        <div className="hiyaghar-datatable-card">
          <div className="hiyaghar-datatable-top-header">
            <h2 className="hiyaghar-datatable-title">{editingId ? 'Edit Reward Slab' : 'Add Reward Slab'}</h2>
            <button type="button" className="hiyaghar-export-btn" onClick={() => setViewMode('list')}>
              ← Back to Slabs
            </button>
          </div>

          <form onSubmit={handleSubmit} className="hiyaghar-role-modal-body" style={{ padding: 0 }} noValidate>
            <div className="hiyaghar-form-group">
              <label>Minimum Order Amount (₹) *</label>
              <input
                type="number"
                value={form.minOrderAmount}
                className={formErrors.minOrderAmount ? 'input-error' : ''}
                onChange={(e) => {
                  setForm({ ...form, minOrderAmount: e.target.value });
                  if (formErrors.minOrderAmount) setFormErrors((prev) => ({ ...prev, minOrderAmount: '' }));
                }}
                placeholder="e.g. 500"
              />
              {formErrors.minOrderAmount && <span className="hiyaghar-field-error">{formErrors.minOrderAmount}</span>}
            </div>

            <div className="hiyaghar-form-group">
              <label>Maximum Order Amount (₹) *</label>
              <input
                type="number"
                value={form.maxOrderAmount}
                className={formErrors.maxOrderAmount ? 'input-error' : ''}
                onChange={(e) => {
                  setForm({ ...form, maxOrderAmount: e.target.value });
                  if (formErrors.maxOrderAmount) setFormErrors((prev) => ({ ...prev, maxOrderAmount: '' }));
                }}
                placeholder="e.g. 1000"
              />
              {formErrors.maxOrderAmount && <span className="hiyaghar-field-error">{formErrors.maxOrderAmount}</span>}
            </div>

            <div className="hiyaghar-form-group">
              <label>Reward Coins Earned *</label>
              <input
                type="number"
                value={form.rewardCoins}
                className={formErrors.rewardCoins ? 'input-error' : ''}
                onChange={(e) => {
                  setForm({ ...form, rewardCoins: e.target.value });
                  if (formErrors.rewardCoins) setFormErrors((prev) => ({ ...prev, rewardCoins: '' }));
                }}
                placeholder="e.g. 50"
              />
              {formErrors.rewardCoins && <span className="hiyaghar-field-error">{formErrors.rewardCoins}</span>}
            </div>

            <div className="hiyaghar-form-group">
              <label>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  style={{ width: 'auto', marginRight: '8px' }}
                />
                Active
              </label>
            </div>

            {formErrors.submit && <p style={{ color: '#b42318', fontSize: '0.85rem' }}>{formErrors.submit}</p>}

            <div className="hiyaghar-modal-footer" style={{ marginTop: '20px' }}>
              <button type="button" className="hiyaghar-btn-cancel" onClick={() => setViewMode('list')}>
                Cancel
              </button>
              <button type="submit" className="hiyaghar-btn-submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Slab'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
