import React, { useEffect, useState } from 'react';
import { AdminAuthService } from '../../services/adminAuthService';

interface RewardSettingsForm {
  signupCoins: number;
  loginCoins: number;
  referralCoins: number;
  referralJoinCoins: number;
  coinToRupeeRate: number;
  maxCoinUsagePercent: number;
}

const emptyForm: RewardSettingsForm = {
  signupCoins: 0,
  loginCoins: 0,
  referralCoins: 0,
  referralJoinCoins: 0,
  coinToRupeeRate: 1,
  maxCoinUsagePercent: 10,
};

export const RewardSettingsPage: React.FC = () => {
  const [form, setForm] = useState<RewardSettingsForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reward/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setForm({
            signupCoins: data.settings.signupCoins ?? 0,
            loginCoins: data.settings.loginCoins ?? 0,
            referralCoins: data.settings.referralCoins ?? 0,
            referralJoinCoins: data.settings.referralJoinCoins ?? 0,
            coinToRupeeRate: data.settings.coinToRupeeRate ?? 1,
            maxCoinUsagePercent: data.settings.maxCoinUsagePercent ?? 10,
          });
        }
      }
    } catch (e) {
      console.warn('Error loading reward settings:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setError(null);
    setIsEditing(false);
    load();
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (field: keyof RewardSettingsForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: Number(value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.coinToRupeeRate <= 0) {
      setError('Coin to Rupee rate must be greater than 0.');
      return;
    }
    if (form.maxCoinUsagePercent < 0 || form.maxCoinUsagePercent > 100) {
      setError('Max coin usage percent must be between 0 and 100.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/reward/settings', {
        method: 'POST',
        headers: AdminAuthService.getAuthHeaders(),
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || 'Failed to save reward settings.');
        return;
      }
      showToastMsg('Reward settings saved.');
      setIsEditing(false);
    } catch (e) {
      console.warn('Error saving reward settings:', e);
      setError('Failed to save reward settings. Please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="hiyaghar-datatable-card">Loading reward settings...</div>;
  }

  return (
    <div className="hiyaghar-datatable-card">
      {toast && <div className="hiyaghar-role-toast">{toast}</div>}

      <div className="hiyaghar-datatable-top-header">
        <h2 className="hiyaghar-datatable-title">Reward Coin Settings</h2>
        {!isEditing && (
          <button type="button" className="hiyaghar-add-entity-btn" onClick={() => setIsEditing(true)}>
            ✏️ Edit Settings
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="hiyaghar-role-modal-body" style={{ padding: '16px 0' }}>
        <fieldset disabled={!isEditing} style={{ border: 'none', padding: 0, margin: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="hiyaghar-form-group">
              <label>Signup Bonus (coins)</label>
              <input
                type="number"
                min={0}
                value={form.signupCoins}
                onChange={(e) => handleChange('signupCoins', e.target.value)}
              />
            </div>

            <div className="hiyaghar-form-group">
              <label>Daily Login Bonus (coins)</label>
              <input
                type="number"
                min={0}
                value={form.loginCoins}
                onChange={(e) => handleChange('loginCoins', e.target.value)}
              />
            </div>

            <div className="hiyaghar-form-group">
              <label>Referral Bonus — Referrer (coins)</label>
              <input
                type="number"
                min={0}
                value={form.referralCoins}
                onChange={(e) => handleChange('referralCoins', e.target.value)}
              />
            </div>

            <div className="hiyaghar-form-group">
              <label>Referral Bonus — New Joiner (coins)</label>
              <input
                type="number"
                min={0}
                value={form.referralJoinCoins}
                onChange={(e) => handleChange('referralJoinCoins', e.target.value)}
              />
            </div>

            <div className="hiyaghar-form-group">
              <label>Coins per ₹1 (conversion rate) *</label>
              <input
                type="number"
                min={0.01}
                step="0.01"
                value={form.coinToRupeeRate}
                onChange={(e) => handleChange('coinToRupeeRate', e.target.value)}
                required
              />
            </div>

            <div className="hiyaghar-form-group">
              <label>Max Coin Usage at Checkout (%) *</label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.maxCoinUsagePercent}
                onChange={(e) => handleChange('maxCoinUsagePercent', e.target.value)}
                required
              />
            </div>
          </div>
        </fieldset>

        {error && <p style={{ color: '#b42318', fontSize: '0.85rem', marginTop: '12px' }}>{error}</p>}

        {isEditing && (
          <div className="hiyaghar-modal-footer" style={{ marginTop: '20px' }}>
            <button type="button" className="hiyaghar-btn-cancel" onClick={handleCancel} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="hiyaghar-btn-submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
