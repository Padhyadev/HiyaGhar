import React, { useEffect, useState } from 'react';
import { DataTable, type ColumnDef } from '../../components/admin/DataTable';
import { AdminAuthService } from '../../services/adminAuthService';
import { usePermission } from '../../context/PermissionContext';
import { showConfirm, showError } from '../../utils/alertService';
import './ReviewManagementPage.css';

interface ReviewItem {
  id: number;
  productId: number;
  productName: string;
  customerName: string;
  rating: number;
  reviewText: string;
  createdDate: string;
  isActive: boolean;
}

export const ReviewManagementPage: React.FC = () => {
  const { currentMenuPermission } = usePermission('REVIEW');
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/review/admin', { headers: AdminAuthService.getAuthHeaders() });
      if (res.ok) {
        setReviews(await res.json());
      } else {
        setReviews([]);
      }
    } catch (e) {
      console.warn('Error loading reviews:', e);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleToggleActive = async (item: ReviewItem) => {
    const nextActive = !item.isActive;
    try {
      const res = await fetch(`/api/review/${item.id}/status`, {
        method: 'PUT',
        headers: AdminAuthService.getAuthHeaders(),
        body: JSON.stringify({ isActive: nextActive }),
      });
      if (!res.ok) {
        showError('Failed to update the review status.');
        return;
      }
      setReviews((prev) => prev.map((r) => (r.id === item.id ? { ...r, isActive: nextActive } : r)));
      showToastMsg(nextActive ? 'Review activated.' : 'Review deactivated.');
    } catch (e) {
      console.warn('Error updating review status:', e);
      showError('Failed to update the review status.');
    }
  };

  const handleDelete = async (item: ReviewItem) => {
    const isConfirmed = await showConfirm(
      `Are you sure you want to delete this review by '${item.customerName}'?`,
      'Delete Review'
    );
    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/review/${item.id}`, {
        method: 'DELETE',
        headers: AdminAuthService.getAuthHeaders(),
      });
      if (!res.ok) {
        showError('Failed to delete the review.');
        return;
      }
      setReviews((prev) => prev.filter((r) => r.id !== item.id));
      showToastMsg('Review deleted.');
    } catch (e) {
      console.warn('Error deleting review:', e);
      showError('Failed to delete the review.');
    }
  };

  const columns: ColumnDef<ReviewItem>[] = [
    { key: 'productName', label: 'Product' },
    { key: 'customerName', label: 'Customer' },
    {
      key: 'rating',
      label: 'Rating',
      render: (r) => <span>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>,
    },
    {
      key: 'reviewText',
      label: 'Review',
      render: (r) => (
        <span title={r.reviewText}>
          {r.reviewText.length > 80 ? `${r.reviewText.slice(0, 80)}…` : r.reviewText}
        </span>
      ),
    },
    {
      key: 'createdDate',
      label: 'Date',
      render: (r) => <span>{new Date(r.createdDate).toLocaleDateString()}</span>,
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (r) => (
        <div className="review-status-toggle">
          <label
            className={`review-toggle-switch ${!currentMenuPermission.canEdit ? 'disabled' : ''}`}
            title={r.isActive ? 'Deactivate (hide from storefront)' : 'Activate (show on storefront)'}
          >
            <input
              type="checkbox"
              checked={r.isActive}
              onChange={() => currentMenuPermission.canEdit && handleToggleActive(r)}
              disabled={!currentMenuPermission.canEdit}
            />
            <span className="review-toggle-slider"></span>
          </label>
          <span className="review-status-label" style={{ color: r.isActive ? '#D19A27' : '#ef4444' }}>
            {r.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div>
      {toast && <div className="hiyaghar-role-toast">{toast}</div>}

      <DataTable<ReviewItem>
        title="Product Reviews"
        columns={columns}
        data={reviews}
        loading={loading}
        onDeleteClick={handleDelete}
        canAdd={false}
        canEdit={false}
        canDelete={currentMenuPermission.canDelete}
      />
    </div>
  );
};
