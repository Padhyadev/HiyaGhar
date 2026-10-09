import React, { useEffect, useState } from 'react';
import { AdminAuthService } from '../../services/adminAuthService';
import { showToast } from '../../utils/alertService';

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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);

  const showToastMsg = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    showToast(msg, type);
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
    setFormErrors({});
    setIsEditing(false);
    load();
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (field: keyof RewardSettingsForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: Number(value) }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (form.coinToRupeeRate <= 0) {
      newErrors.coinToRupeeRate = 'Please enter coin to rupee rate greater than 0';
    }
    if (form.maxCoinUsagePercent < 0 || form.maxCoinUsagePercent > 100) {
      newErrors.maxCoinUsagePercent = 'Please enter max coin usage percent between 0 and 100';
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }
    setFormErrors({});

    setSaving(true);
    try {
      const res = await fetch('/api/reward/settings', {
        method: 'POST',
        headers: AdminAuthService.getAuthHeaders(),
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormErrors({ submit: data.message || 'Failed to save reward settings. Please try again' });
        return;
      }
      showToastMsg('Reward settings saved successfully');
      setIsEditing(false);
    } catch (e) {
      console.warn('Error saving reward settings:', e);
      setFormErrors({ submit: 'Failed to save reward settings. Please check your connection' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="hiyaghar-datatable-card">Loading reward settings...</div>;
  }

  return (
    <div className="hiyaghar-datatable-card">
      <div className="hiyaghar-datatable-top-header">
        <h2 className="hiyaghar-datatable-title">Reward Coin Settings</h2>
        {!isEditing && (
          <button type="button" className="hiyaghar-add-entity-btn" onClick={() => setIsEditing(true)}>
            Edit Settings
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="hiyaghar-role-modal-body" style={{ padding: '16px 0' }} noValidate>
        <fieldset disabled={!isEditing} style={{ border: 'none', padding: 0, margin: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', alignItems: 'start' }}>
            <div className="hiyaghar-form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
                </svg>
                Signup Bonus (coins)
              </label>
              <input
                type="number"
                min={0}
                value={form.signupCoins}
                onChange={(e) => handleChange('signupCoins', e.target.value)}
              />
            </div>

            <div className="hiyaghar-form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Daily Login Bonus (coins)
              </label>
              <input
                type="number"
                min={0}
                value={form.loginCoins}
                onChange={(e) => handleChange('loginCoins', e.target.value)}
              />
            </div>

            <div className="hiyaghar-form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Referral Bonus — Referrer (coins)
              </label>
              <input
                type="number"
                min={0}
                value={form.referralCoins}
                onChange={(e) => handleChange('referralCoins', e.target.value)}
              />
            </div>

            <div className="hiyaghar-form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                Referral Bonus — New Joiner (coins)
              </label>
              <input
                type="number"
                min={0}
                value={form.referralJoinCoins}
                onChange={(e) => handleChange('referralJoinCoins', e.target.value)}
              />
            </div>

            <div className="hiyaghar-form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" /><line x1="12" y1="7" x2="12" y2="17" /><path d="M15 9.5H10.5a2 2 0 0 0 0 4h3a2 2 0 0 1 0 4H9" />
                </svg>
                1 Coin = ₹ (Rupee value per 1 Coin) *
              </label>
              <input
                type="number"
                min={0.01}
                step="0.01"
                className={formErrors.coinToRupeeRate ? 'input-error' : ''}
                value={form.coinToRupeeRate}
                onChange={(e) => handleChange('coinToRupeeRate', e.target.value)}
              />
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12px', color: '#475467', marginTop: '6px', background: '#F8FAFC', padding: '8px 10px', borderRadius: '6px', border: '1px solid #E2E8F0', lineHeight: 1.4 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span>
                  <strong>Example:</strong> If set to <strong>1</strong>, 100 coins = ₹100. If set to <strong>0.1</strong>, 100 coins = ₹10.
                </span>
              </div>
              {formErrors.coinToRupeeRate && <span className="hiyaghar-field-error">{formErrors.coinToRupeeRate}</span>}
            </div>

            <div className="hiyaghar-form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="9" y1="15" x2="15" y2="9" /><circle cx="9.5" cy="9.5" r=".5" fill="#b45309" /><circle cx="14.5" cy="14.5" r=".5" fill="#b45309" />
                </svg>
                Max Coin Usage at Checkout (%) *
              </label>
              <input
                type="number"
                min={0}
                max={100}
                className={formErrors.maxCoinUsagePercent ? 'input-error' : ''}
                value={form.maxCoinUsagePercent}
                onChange={(e) => handleChange('maxCoinUsagePercent', e.target.value)}
              />
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12px', color: '#475467', marginTop: '6px', background: '#FEFDF8', padding: '8px 10px', borderRadius: '6px', border: '1px solid #FEF08A', lineHeight: 1.45 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>
                  <strong>Live Example:</strong> On a <strong>₹500 order</strong> ({form.maxCoinUsagePercent}%), user can use up to <strong>₹{(500 * (form.maxCoinUsagePercent / 100)).toFixed(0)} ({Math.round((500 * (form.maxCoinUsagePercent / 100)) / Math.max(form.coinToRupeeRate, 0.01))} Coins)</strong> discount, paying remaining <strong>₹{(500 - 500 * (form.maxCoinUsagePercent / 100)).toFixed(0)}</strong>.
                </span>
              </div>
              {formErrors.maxCoinUsagePercent && <span className="hiyaghar-field-error">{formErrors.maxCoinUsagePercent}</span>}
            </div>
          </div>
        </fieldset>

        {formErrors.submit && <p style={{ color: '#b42318', fontSize: '0.85rem', marginTop: '12px' }}>{formErrors.submit}</p>}

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
