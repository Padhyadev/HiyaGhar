import React, { useEffect, useState } from 'react';
import { GiftService, type AdminGiftBox } from '../../services/giftService';
import { showToast } from '../../utils/alertService';

// Store Settings → Gift Boxes. Each box has a capacity in "gift units"; every product size has a
// "Gift box units" value (Products page). The checkout picks the smallest box that fits, and uses
// more than one box when everything doesn't fit in the largest.

interface AdminGiftBoxSettingsProps {
  canEdit: boolean;
}

export const AdminGiftBoxSettings: React.FC<AdminGiftBoxSettingsProps> = ({ canEdit }) => {
  const [boxes, setBoxes] = useState<AdminGiftBox[]>([]);
  const [saved, setSaved] = useState<AdminGiftBox[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setState('loading');
    GiftService.getBoxesAdmin().then((list) => {
      if (!list) {
        setState('error');
        return;
      }
      setBoxes(list);
      setSaved(list);
      setState('ready');
    });
  };
  useEffect(load, []);

  const update = (index: number, patch: Partial<AdminGiftBox>) =>
    setBoxes((prev) => prev.map((b, i) => (i === index ? { ...b, ...patch } : b)));

  const validate = (): string | null => {
    if (boxes.length === 0) return 'Add at least one gift box.';
    for (const b of boxes) {
      if (!b.name.trim()) return 'Every box needs a name.';
      if (!Number.isInteger(b.capacity) || b.capacity < 1 || b.capacity > 100) return `'${b.name}': capacity must be a whole number from 1 to 100.`;
    }
    if (!boxes.some((b) => b.isActive)) return 'Keep at least one box active, or gift orders cannot be packed.';
    return null;
  };

  const save = async () => {
    const problem = validate();
    setError(problem);
    if (problem) return;
    setSaving(true);
    const result = await GiftService.saveBoxesAdmin(boxes.map((b, i) => ({ ...b, name: b.name.trim(), displayOrder: i + 1 })));
    setSaving(false);
    if (result.success) {
      showToast('Gift boxes saved.', 'success');
      setEditing(false);
      load();
    } else {
      setError(result.message);
    }
  };

  return (
    <div className={`hiyaghar-setting-card ${editing ? 'is-active-edit' : ''}`}>
      <div className="hiyaghar-setting-card-header">
        <h3 className="hiyaghar-setting-card-title">
          <i className="fa-solid fa-gift"></i>
          Gift Boxes
        </h3>
        {canEdit && state === 'ready' && (
          <div>
            {!editing ? (
              <button type="button" className="hiyaghar-section-btn-edit" onClick={() => setEditing(true)}>
                <i className="fa-solid fa-pen-to-square"></i>
                Edit Boxes
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="hiyaghar-section-btn-cancel"
                  onClick={() => {
                    setBoxes(saved);
                    setEditing(false);
                    setError(null);
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="button" className="hiyaghar-section-btn-save" onClick={save} disabled={saving}>
                  <i className="fa-solid fa-floppy-disk"></i>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#64748b' }}>
        Capacity is in <strong>gift units</strong>. Set each product size's units on the Products page (e.g. small bottle or soap = 1, big bottle = 2).
        The smallest box that fits is chosen automatically; Personalised Gifting costs ₹100 per box.
      </p>

      {state === 'loading' && <p style={{ color: '#64748b' }}>Loading gift boxes…</p>}
      {state === 'error' && (
        <p style={{ color: '#b42318' }}>
          Could not load gift boxes.{' '}
          <button type="button" className="hiyaghar-section-btn-edit" onClick={load}>Retry</button>
        </p>
      )}

      {state === 'ready' && (
        <div className="hiyaghar-table-responsive" style={{ border: '1px solid #EAE4D3', borderRadius: '10px', overflow: 'hidden' }}>
          <table className="hiyaghar-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '10px 14px' }}>Box name</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', width: '160px' }}>Capacity (units)</th>
                <th style={{ textAlign: 'center', padding: '10px 14px', width: '90px' }}>Active</th>
                {editing && <th style={{ width: '60px' }}><span className="sr-only">Remove</span></th>}
              </tr>
            </thead>
            <tbody>
              {boxes.map((b, i) => (
                <tr key={b.id ?? `new-${i}`}>
                  <td>
                    <input
                      type="text"
                      maxLength={100}
                      value={b.name}
                      disabled={!editing}
                      onChange={(e) => update(i, { name: e.target.value })}
                      className="hiyaghar-input-control"
                      aria-label="Box name"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      step={1}
                      value={b.capacity}
                      disabled={!editing}
                      onChange={(e) => update(i, { capacity: Math.trunc(Number(e.target.value)) })}
                      className="hiyaghar-input-control"
                      aria-label={`Capacity of ${b.name || 'box'} in gift units`}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={b.isActive}
                      disabled={!editing}
                      onChange={(e) => update(i, { isActive: e.target.checked })}
                      aria-label={`${b.name || 'Box'} active`}
                    />
                  </td>
                  {editing && (
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="hiyaghar-section-btn-cancel"
                        onClick={() => setBoxes((prev) => prev.filter((_, idx) => idx !== i))}
                        aria-label={`Remove ${b.name || 'box'}`}
                      >
                        <i className="fa-regular fa-trash-can"></i>
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <button
          type="button"
          className="hiyaghar-section-btn-edit"
          style={{ marginTop: '12px' }}
          onClick={() => setBoxes((prev) => [...prev, { name: '', capacity: 1, displayOrder: prev.length + 1, isActive: true }])}
        >
          <i className="fa-solid fa-plus"></i> Add box
        </button>
      )}
      {error && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px' }} role="alert">{error}</p>}
    </div>
  );
};
