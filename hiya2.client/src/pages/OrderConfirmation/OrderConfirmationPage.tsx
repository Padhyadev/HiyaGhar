import React, { useEffect, useState } from 'react';
import { Header } from '../../components/layout/Header/Header';
import { Footer } from '../../components/layout/Footer/Footer';
import { OrderService } from '../../services/orderService';
import type { Order } from '../../services/orderService';
import './OrderConfirmationPage.css';

interface OrderConfirmationPageProps {
  orderId?: string;
  onNavigateHome: () => void;
  onNavigateMukhwas: () => void;
  onNavigateTrackOrder: (orderId: string) => void;
}

export const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({
  orderId,
  onNavigateHome,
  onNavigateMukhwas,
  onNavigateTrackOrder,
}) => {
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    // Read orderId from prop or window hash URL search params
    const hash = window.location.hash;
    let targetId = orderId;

    if (!targetId) {
      const match = hash.match(/orderId=([^&]+)/);
      if (match) targetId = match[1];
    }

    if (targetId) {
      const found = OrderService.getOrderById(targetId);
      setOrder(found);
    } else {
      OrderService.fetchMyOrders().then((all) => {
        if (all.length > 0) setOrder(all[0]);
      });
    }

    window.scrollTo(0, 0);
  }, [orderId]);

  if (!order) {
    return (
      <div className="hiyaghar-confirmation-page-layout">
        <Header />
        <main id="main-content" tabIndex={-1} className="hiyaghar-confirmation-main">
          <div className="hiyaghar-container">
            <div className="hiyaghar-no-order-card">
              <h2>No Recent Order Found</h2>
              <p>Looks like you haven't placed an order recently.</p>
              <button type="button" className="hiyaghar-btn-primary" onClick={onNavigateMukhwas}>
                Start Shopping
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="hiyaghar-confirmation-page-layout">
      <Header />

      <main id="main-content" tabIndex={-1} className="hiyaghar-confirmation-main">
        <div className="hiyaghar-container">
          <div className="hiyaghar-confirmation-card">
            {/* 20. SUBTLE ELEGANT GOLD SUCCESS CHECKMARK ANIMATION */}
            <div className="hiyaghar-success-animation-wrapper">
              <div className="hiyaghar-gold-checkmark-circle">
                <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>

            {/* 19. THANK YOU HEADING */}
            <h1 className="hiyaghar-thankyou-heading">Thank You</h1>
            <p className="hiyaghar-thankyou-subtitle">Your order has been placed successfully.</p>

            <div className="hiyaghar-order-meta-banner">
              <div className="hiyaghar-meta-item">
                <span className="label">Order Number</span>
                <span className="value order-id">#{order.id}</span>
              </div>
              <div className="hiyaghar-meta-item">
                <span className="label">Estimated Delivery</span>
                <span className="value">{order.estimatedDeliveryDate}</span>
              </div>
            </div>

            {/* ORDER SUMMARY CARDS GRID */}
            <div className="hiyaghar-confirmation-details-grid">
              {/* Address Box */}
              <div className="hiyaghar-conf-info-box">
                <h3 className="box-title">Shipping Address</h3>
                <p className="box-text">
                  <strong>{order.shippingAddress.fullName}</strong><br />
                  {order.shippingAddress.address}<br />
                  {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}<br />
                  Mobile: {order.shippingAddress.mobile}
                </p>
              </div>

              {/* Payment Box */}
              <div className="hiyaghar-conf-info-box">
                <h3 className="box-title">Payment & Delivery</h3>
                <p className="box-text">
                  <strong>Payment Mode:</strong> {order.paymentMethod.name}<br />
                  <strong>Delivery Service:</strong> {order.deliveryOption.name}<br />
                  <strong>Status:</strong> {order.status}<br />
                  <strong>Items:</strong> {order.items.reduce((acc, i) => acc + i.quantity, 0)} Items
                </p>
              </div>
            </div>

            {/* ITEMS LIST & BILL SUMMARY */}
            <div className="hiyaghar-conf-items-section">
              <div className="hiyaghar-conf-items-header">
                <h3 className="section-title">Order Items & Bill Details</h3>
                <div className="hiyaghar-conf-bill-badge">
                  <span className="badge-dot"></span>
                  {order.paymentStatus === 'Paid' ? 'Paid' : (order.paymentMethod.id === 'cod' ? 'Cash on Delivery' : 'Confirmed')}
                </div>
              </div>

              {/* Items List */}
              <div className="hiyaghar-conf-items-list">
                {order.items.map((item) => (
                  <div key={item.id} className="hiyaghar-conf-item-row">
                    <img src={item.image} alt={item.name} className="hiyaghar-conf-item-img" />
                    <div className="hiyaghar-conf-item-info">
                      <span className="name">{item.name}</span>
                      <span className="meta">Pack Size: {item.weight} • Qty: {item.quantity} (₹{item.price} each)</span>
                    </div>
                    <span className="price">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Detailed Bill Breakdown */}
              <div className="hiyaghar-conf-bill-breakdown">
                <h4 className="bill-breakdown-title">
                  <i className="fa-solid fa-file-invoice-dollar" style={{ color: 'var(--hiya-gold, #CB992C)', marginRight: '8px' }}></i>
                  Bill Summary
                </h4>
                
                <div className="bill-row">
                  <span className="bill-label">Items Subtotal:</span>
                  <span className="bill-value">
                    ₹{order.subtotal || order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
                  </span>
                </div>

                {order.discount > 0 && (
                  <div className="bill-row discount-row">
                    <span className="bill-label">
                      {order.couponCode ? `Coupon Discount (${order.couponCode}):` : 'Promo Discount:'}
                    </span>
                    <span className="bill-value discount-value">-₹{order.discount}</span>
                  </div>
                )}

                <div className="bill-row">
                  <span className="bill-label">Delivery & Handling:</span>
                  <span className="bill-value">
                    {order.shippingFee === 0 || !order.shippingFee ? (
                      <span className="free-shipping-text">FREE</span>
                    ) : (
                      `₹${order.shippingFee}`
                    )}
                  </span>
                </div>

                {order.tax > 0 && (
                  <div className="bill-row">
                    <span className="bill-label">Estimated GST / Taxes:</span>
                    <span className="bill-value">₹{order.tax}</span>
                  </div>
                )}

                <div className="bill-divider"></div>

                <div className="bill-row total-row">
                  <span className="bill-total-label">
                    {order.paymentMethod.id === 'cod' ? 'Total Payable (COD):' : 'Total Amount Paid:'}
                  </span>
                  <span className="bill-total-value">₹{order.total}</span>
                </div>
              </div>

              {/* Bill & Invoice Download / Print Actions */}
              <div className="hiyaghar-conf-invoice-actions">
                <button
                  type="button"
                  className="hiyaghar-btn-invoice-download"
                  onClick={async () => {
                    await OrderService.downloadInvoicePdf(order);
                  }}
                  title="Download Tax Invoice PDF"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Download Bill / Invoice (PDF)</span>
                </button>

                <button
                  type="button"
                  className="hiyaghar-btn-invoice-print"
                  onClick={() => {
                    OrderService.printInvoice(order);
                  }}
                  title="Print Bill"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
                  <span>Print Bill</span>
                </button>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="hiyaghar-conf-actions">
              <button
                type="button"
                className="hiyaghar-btn-primary track-btn"
                onClick={() => onNavigateTrackOrder(order.id)}
              >
                Track Order →
              </button>
              <button
                type="button"
                className="hiyaghar-btn-secondary"
                onClick={onNavigateHome}
              >
                Return to Home
              </button>
              <button
                type="button"
                className="hiyaghar-btn-secondary"
                onClick={onNavigateMukhwas}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
