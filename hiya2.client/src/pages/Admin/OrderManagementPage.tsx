import React, { useState, useEffect } from 'react';
import { DataTable, type ColumnDef } from '../../components/admin/DataTable';
import { AdminAuthService } from '../../services/adminAuthService';
import { usePermission } from '../../context/PermissionContext';
import { LovService } from '../../services/lovService';
import './OrderManagementPage.css';

interface AdminOrderItem {
  id: number;
  productId: number;
  variantId?: number | null;
  productName: string;
  variantName?: string | null;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

interface AdminOrder {
  id: number;
  orderNumber: string;
  orderDate: string;
  subtotal: number;
  discountAmount: number;
  couponCode?: string | null;
  coinsUsed: number;
  coinDiscountAmount: number;
  deliveryFee: number;
  totalAmount: number;
  orderStatus: string;
  orderStatusDisplay: string;
  paymentStatus: string;
  paymentMode: string;
  recipientName: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  mobileNo: string;
  cancelReason?: string | null;
  cancelledDate?: string | null;
  items: AdminOrderItem[];
}

// Forward-only statuses an admin can pick from a dropdown. Backend
// (OrderService.AllowedTransitions) is still the source of truth for what's
// actually a valid move from the order's current status - an invalid pick
// just surfaces the backend's own rejection message.
const FORWARD_STATUS_OPTIONS = ['Confirmed', 'Processing', 'Packed', 'Shipped', 'OutForDelivery', 'Delivered'];

const STATUS_LABELS: Record<string, string> = {
  Placed: 'Placed',
  Confirmed: 'Confirmed',
  Processing: 'Processing',
  Packed: 'Packed',
  Shipped: 'Shipped',
  OutForDelivery: 'Out for Delivery',
  Delivered: 'Delivered',
  Cancelled: 'Cancelled',
  Returned: 'Returned',
};

// Mirrors the backend's cancellable-from set (OrderService.AllowedTransitions):
// only orders that haven't shipped yet can still be cancelled.
const CANCELLABLE_STATUSES = ['Placed', 'Confirmed', 'Processing', 'Packed'];
const TERMINAL_STATUSES = ['Cancelled', 'Returned', 'Delivered'];

// Pill color is keyed off the raw status CODE, never the resolved label -
// if an admin renames "Delivered" to something else via LOV, the styling
// must keep working.
const statusPillClass = (status: string) => {
  if (status === 'Delivered') return 'status-delivered';
  if (status === 'Cancelled' || status === 'Returned') return 'status-cancelled';
  return 'status-progress';
};

export const OrderManagementPage: React.FC = () => {
  const { currentMenuPermission } = usePermission('ORDER');
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<string | null>(null);

  // Admin-editable labels (LovMaster column "OrderStatus") for the status
  // dropdown's option text - falls back to STATUS_LABELS if the fetch fails
  // or a code has no LOV row yet.
  const [statusLabelMap, setStatusLabelMap] = useState<Record<string, string>>({});
  const formatDropdownStatus = (code: string) => statusLabelMap[code] || STATUS_LABELS[code] || code;

  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  const [statusChoice, setStatusChoice] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadOrders = async (): Promise<AdminOrder[]> => {
    try {
      const res = await fetch('/api/order/admin?page=1&pageSize=200', {
        headers: AdminAuthService.getAuthHeaders(),
      });
      const data = await res.json();
      const list: AdminOrder[] = data?.isSuccess ? data.orders || [] : [];
      setOrders(list);
      return list;
    } catch (err) {
      console.warn('Failed to load orders:', err);
      return [];
    }
  };

  useEffect(() => {
    setLoading(true);
    loadOrders().finally(() => setLoading(false));
    LovService.getPublicLabels('OrderStatus').then(setStatusLabelMap);
  }, []);

  const handleViewOrder = (order: AdminOrder) => {
    setSelectedOrder(order);
    setStatusChoice('');
    setStatusError(null);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setSelectedOrder(null);
    setViewMode('list');
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !statusChoice) return;
    setIsUpdatingStatus(true);
    setStatusError(null);
    try {
      const res = await fetch(`/api/order/admin/${selectedOrder.id}/status`, {
        method: 'POST',
        headers: AdminAuthService.getAuthHeaders(),
        body: JSON.stringify({ status: statusChoice }),
      });
      const data = await res.json();
      if (res.ok && data.isSuccess) {
        await loadOrders();
        showToastMsg('Order status updated.');
        // Keep the loading overlay up through this short delay so the toast
        // is visible before we drop back to the list - no flash of the
        // now-stale detail view in between.
        setTimeout(() => {
          setIsUpdatingStatus(false);
          handleBackToList();
        }, 900);
      } else {
        setStatusError(data.message || 'Failed to update status.');
        setIsUpdatingStatus(false);
      }
    } catch (err: any) {
      setStatusError(err.message || 'Network error while updating status.');
      setIsUpdatingStatus(false);
    }
  };

  const handleOpenCancelModal = () => {
    setCancelReason('');
    setCancelError(null);
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedOrder) return;
    if (!cancelReason.trim()) {
      setCancelError('Please provide a reason for cancelling this order.');
      return;
    }

    setIsCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch(`/api/order/admin/${selectedOrder.id}/status`, {
        method: 'POST',
        headers: AdminAuthService.getAuthHeaders(),
        body: JSON.stringify({ status: 'Cancelled', reason: cancelReason.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.isSuccess) {
        setIsCancelModalOpen(false);
        await loadOrders();
        showToastMsg('Order cancelled.');
        // Keep the loading overlay up through this short delay so the toast
        // is visible before we drop back to the list.
        setTimeout(() => {
          setIsCancelling(false);
          handleBackToList();
        }, 900);
      } else {
        setCancelError(data.message || 'Failed to cancel order.');
        setIsCancelling(false);
      }
    } catch (err: any) {
      setCancelError(err.message || 'Network error while cancelling order.');
      setIsCancelling(false);
    }
  };

  const columns: ColumnDef<AdminOrder>[] = [
    { key: 'orderNumber', label: 'Order Number' },
    { key: 'recipientName', label: 'Recipient' },
    { key: 'mobileNo', label: 'Mobile' },
    { key: 'totalAmount', label: 'Total', render: (o) => `₹${o.totalAmount.toFixed(2)}` },
    {
      key: 'paymentStatus',
      label: 'Payment',
      render: (o) => (
        <span className={`hiyaghar-order-status-pill ${o.paymentStatus === 'Paid' ? 'status-delivered' : 'status-progress'}`}>
          {o.paymentStatus}
        </span>
      ),
    },
    {
      key: 'orderStatus',
      label: 'Status',
      render: (o) => (
        <span className={`hiyaghar-order-status-pill ${statusPillClass(o.orderStatus)}`}>
          {o.orderStatusDisplay}
        </span>
      ),
    },
    {
      key: 'orderDate',
      label: 'Order Date',
      render: (o) => new Date(o.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    },
  ];

  return (
    <div className="hiyaghar-admin-page-container">
      {toast && <div className="hiyaghar-admin-toast">{toast}</div>}

      {viewMode === 'list' ? (
        <DataTable
          title="Order Management"
          columns={columns}
          data={orders}
          loading={loading}
          canAdd={false}
          canDelete={false}
          canEdit={currentMenuPermission.canView}
          onEditClick={handleViewOrder}
        />
      ) : selectedOrder ? (
        <div className="hiyaghar-order-detail-wrapper">
        <div className={`hiyaghar-datatable-card ${(isUpdatingStatus || isCancelling) ? 'is-blurred' : ''}`}>
          <div className="hiyaghar-datatable-top-header">
            <h2 className="hiyaghar-datatable-title">Order #{selectedOrder.orderNumber}</h2>
            <button type="button" className="hiyaghar-export-btn" onClick={handleBackToList}>
              ← Back to Orders
            </button>
          </div>

          <div className="hiyaghar-order-detail-grid">
            <div className="hiyaghar-order-detail-block">
              <h4>Shipping Details</h4>
              <p>{selectedOrder.recipientName}</p>
              <p>{selectedOrder.mobileNo}</p>
              <p>{selectedOrder.addressLine1}{selectedOrder.addressLine2 ? `, ${selectedOrder.addressLine2}` : ''}</p>
              <p>{selectedOrder.city}, {selectedOrder.state} - {selectedOrder.postalCode}</p>
            </div>

            <div className="hiyaghar-order-detail-block">
              <h4>Order Summary</h4>
              <p>Subtotal: ₹{selectedOrder.subtotal.toFixed(2)}</p>
              {selectedOrder.discountAmount > 0 && <p>Discount: -₹{selectedOrder.discountAmount.toFixed(2)}</p>}
              {selectedOrder.coinDiscountAmount > 0 && <p>Coin Discount: -₹{selectedOrder.coinDiscountAmount.toFixed(2)}</p>}
              <p>Delivery Fee: ₹{selectedOrder.deliveryFee.toFixed(2)}</p>
              <p><strong>Total: ₹{selectedOrder.totalAmount.toFixed(2)}</strong></p>
              <p>Payment: {selectedOrder.paymentMode} ({selectedOrder.paymentStatus})</p>
              <p>
                Current Status:{' '}
                <span className={`hiyaghar-order-status-pill ${statusPillClass(selectedOrder.orderStatus)}`}>
                  {selectedOrder.orderStatusDisplay}
                </span>
              </p>
              {selectedOrder.cancelReason && (
                <p style={{ color: '#c0392b' }}>Cancel Reason: {selectedOrder.cancelReason}</p>
              )}
            </div>
          </div>

          <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.4px', color: '#667085', margin: '0 0 10px 0' }}>
            Items
          </h4>
          <div className="hiyaghar-table-responsive">
            <table className="hiyaghar-datatable">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Variant</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.productName}</td>
                    <td>{item.variantName || '-'}</td>
                    <td>{item.quantity}</td>
                    <td>₹{item.unitPrice.toFixed(2)}</td>
                    <td>₹{item.totalPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!TERMINAL_STATUSES.includes(selectedOrder.orderStatus) && (
            <div className="hiyaghar-order-actions-row">
              <select
                value={statusChoice}
                onChange={(e) => setStatusChoice(e.target.value)}
                className="hiyaghar-select-pagesize"
              >
                <option value="">-- Change Status To --</option>
                {FORWARD_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{formatDropdownStatus(s)}</option>
                ))}
              </select>
              <button
                type="button"
                className="hiyaghar-btn-submit"
                disabled={!statusChoice || isUpdatingStatus}
                onClick={handleUpdateStatus}
              >
                {isUpdatingStatus ? 'Updating...' : 'Update Status'}
              </button>

              {CANCELLABLE_STATUSES.includes(selectedOrder.orderStatus) && (
                <button type="button" className="hiyaghar-panel-btn danger" onClick={handleOpenCancelModal}>
                  Cancel Order
                </button>
              )}
            </div>
          )}
          {statusError && <p className="hiyaghar-order-error-text">{statusError}</p>}
        </div>

        {(isUpdatingStatus || isCancelling) && (
          <div className="hiyaghar-order-loading-overlay">
            <div className="hiyaghar-order-spinner" />
            <span className="hiyaghar-order-loading-text">
              {isCancelling ? 'Cancelling order...' : 'Updating status...'}
            </span>
          </div>
        )}
        </div>
      ) : null}

      {isCancelModalOpen && selectedOrder && (
        <div className="hiyaghar-modal-overlay" onClick={() => setIsCancelModalOpen(false)}>
          <div className="hiyaghar-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="hiyaghar-modal-header">
              <h3>Cancel Order #{selectedOrder.orderNumber}</h3>
              <button type="button" className="close-btn" onClick={() => setIsCancelModalOpen(false)}>
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#667085', margin: '0 0 14px 0' }}>
              Please provide a reason for cancelling this order. This can't be undone.
            </p>

            <textarea
              className="hiyaghar-order-cancel-textarea"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Out of stock, customer requested, fraud check failed..."
            />

            {cancelError && <p className="hiyaghar-order-error-text">{cancelError}</p>}

            <div className="hiyaghar-modal-footer">
              <button
                type="button"
                className="hiyaghar-btn-cancel"
                onClick={() => setIsCancelModalOpen(false)}
                disabled={isCancelling}
              >
                Keep Order
              </button>
              <button
                type="button"
                className="hiyaghar-panel-btn danger"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
