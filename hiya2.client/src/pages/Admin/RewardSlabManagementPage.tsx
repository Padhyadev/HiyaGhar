import React, { useEffect, useState } from 'react';
import { DataTable, type ColumnDef } from '../../components/admin/DataTable';
import { AdminAuthService } from '../../services/adminAuthService';
import { usePermission } from '../../context/PermissionContext';

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
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
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
    setError(null);
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
    setError(null);
    setViewMode('form');
  };

  const handleDelete = async (slab: RewardSlab) => {
    if (!window.confirm(`Delete the slab ₹${slab.minOrderAmount}–₹${slab.maxOrderAmount}?`)) return;
    try {
      const res = await fetch(`/api/reward/slabs/${slab.id}`, {
        method: 'DELETE',
        headers: AdminAuthService.getAuthHeaders(),
      });
      if (res.ok) {
        showToastMsg('Reward slab deleted.');
        await loadSlabs();
      }
    } catch (e) {
      console.warn('Error deleting reward slab:', e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const min = Number(form.minOrderAmount);
    const max = Number(form.maxOrderAmount);
    const coins = Number(form.rewardCoins);

    if (Number.isNaN(min) || min < 0) {
      setError('Please enter a valid minimum order amount.');
      return;
    }
    if (Number.isNaN(max) || max <= min) {
      setError('Maximum order amount must be greater than the minimum.');
      return;
    }
    if (Number.isNaN(coins) || coins <= 0) {
      setError('Reward coins must be a positive number.');
      return;
    }

    const overlapping = slabs.some(
      (s) =>
        s.id !== editingId &&
        s.isActive &&
        min <= s.maxOrderAmount &&
        max >= s.minOrderAmount
    );
    if (overlapping) {
      setError('This amount range overlaps an existing active slab.');
      return;
    }

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
        setError(data.message || 'Failed to save reward slab.');
        return;
      }
      showToastMsg(editingId ? 'Reward slab updated.' : 'Reward slab created.');
      setViewMode('list');
      await loadSlabs();
    } catch (e) {
      console.warn('Error saving reward slab:', e);
      setError('Failed to save reward slab. Please check your connection.');
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
      {toast && <div className="hiyaghar-role-toast">{toast}</div>}

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

          <form onSubmit={handleSubmit} className="hiyaghar-role-modal-body" style={{ padding: 0 }}>
            <div className="hiyaghar-form-group">
              <label>Minimum Order Amount (₹) *</label>
              <input
                type="number"
                value={form.minOrderAmount}
                onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                required
              />
            </div>

            <div className="hiyaghar-form-group">
              <label>Maximum Order Amount (₹) *</label>
              <input
                type="number"
                value={form.maxOrderAmount}
                onChange={(e) => setForm({ ...form, maxOrderAmount: e.target.value })}
                required
              />
            </div>

            <div className="hiyaghar-form-group">
              <label>Reward Coins Earned *</label>
              <input
                type="number"
                value={form.rewardCoins}
                onChange={(e) => setForm({ ...form, rewardCoins: e.target.value })}
                required
              />
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

            {error && <p style={{ color: '#b42318', fontSize: '0.85rem' }}>{error}</p>}

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
