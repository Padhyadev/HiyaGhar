import React, { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header/Header';
import { Footer } from '../../components/layout/Footer/Footer';
import { OrderService } from '../../services/orderService';
import type { Order } from '../../services/orderService';
import { AnimatedNumber } from '../../components/common/AnimatedNumber';
import './TrackOrderPage.css';

interface TrackOrderPageProps {
  orderId?: string;
  onNavigateHome: () => void;
  onNavigateMukhwas: () => void;
}

export const TrackOrderPage: React.FC<TrackOrderPageProps> = ({
  orderId,
  onNavigateHome,
  onNavigateMukhwas,
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [searchInput, setSearchInput] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSupportOpen, setIsSupportOpen] = useState<boolean>(false);

  useEffect(() => {
    let targetId = orderId;

    if (!targetId) {
      const match = window.location.hash.match(/orderId=([^&]+)/);
      if (match) targetId = match[1];
    }

    OrderService.fetchMyOrders().then((all) => {
      if (targetId) {
        const found = OrderService.getOrderById(targetId);
        if (found) {
          setOrder(found);
          setSearchInput(found.id);
        }
      } else if (all.length > 0) {
        setOrder(all[0]);
        setSearchInput(all[0].id);
      }
    });

    window.scrollTo(0, 0);
  }, [orderId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSearchOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    const found = OrderService.getOrderById(searchInput.trim());
    if (found) {
      setOrder(found);
      showToast(`Loaded tracking status for #${found.id}`);
    } else {
      showToast(`No order found matching "${searchInput}". Please check Order #.`);
    }
  };

  const handleCopyTrackingId = () => {
    if (!order) return;
    navigator.clipboard.writeText(order.trackingId);
    showToast(`Tracking ID "${order.trackingId}" copied to clipboard!`);
  };

  const handleDownloadInvoice = () => {
    if (!order) return;
    OrderService.printInvoice(order);
    showToast('Preparing tax invoice for printing/download...');
  };

  return (
    <div className="hiyaghar-track-page-layout">
      <Header />

      <main className="hiyaghar-track-main">
        {/* Subtle Toast Banner */}
        {toastMessage && (
          <div className="hiyaghar-track-toast" role="status">
            <span>✨ {toastMessage}</span>
          </div>
        )}

        <div className="hiyaghar-container">
          {/* Breadcrumb */}
          <nav className="hiyaghar-track-breadcrumb" aria-label="Breadcrumb">
            <ol className="hiyaghar-track-breadcrumb-list">
              <li>
                <a href="#/" onClick={(e) => { e.preventDefault(); onNavigateHome(); }}>
                  Home
                </a>
              </li>
              <li className="sep">/</li>
              <li className="current">Track Order</li>
            </ol>
          </nav>

          {/* Heading & Search Bar */}
          <div className="hiyaghar-track-header-section">
            <h1 className="hiyaghar-track-title">Track Your Order</h1>

            <form onSubmit={handleSearchOrder} className="hiyaghar-track-search-form">
              <input
                type="text"
                placeholder="Enter Order # (e.g. HY-89241)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button type="submit" className="hiyaghar-track-search-btn">
                Track
              </button>
            </form>
          </div>

          {!order ? (
            <div className="hiyaghar-no-track-card">
              <div className="icon">📦</div>
              <h2>Search For Your Order</h2>
              <p>Enter your Order Number above to view real-time shipping progress and courier updates.</p>
              <button type="button" className="hiyaghar-btn-primary" onClick={onNavigateMukhwas}>
                Explore Products
              </button>
            </div>
          ) : (
            <div className="hiyaghar-track-content-card">
              {/* Order Meta Header */}
              <div className="hiyaghar-track-order-header">
                <div>
                  <span className="hiyaghar-track-sub">Order Number</span>
                  <h2 className="hiyaghar-track-order-id">#{order.id}</h2>
                </div>
                <div className="hiyaghar-track-est-box">
                  <span className="hiyaghar-track-sub">Expected Delivery</span>
                  <span className="hiyaghar-track-est-date">📅 {order.estimatedDeliveryDate}</span>
                </div>
              </div>

              {/* 21. & 23. VERTICAL / HORIZONTAL TIMELINE */}
              <div className="hiyaghar-timeline-container">
                <h3 className="hiyaghar-timeline-heading">Shipping Progress</h3>

                <div className="hiyaghar-timeline-steps">
                  {order.timeline.map((step, idx) => {
                    const isCompleted = step.completed;
                    const isCurrent = step.current;

                    return (
                      <div
                        key={step.id}
                        className={`hiyaghar-timeline-step ${isCompleted ? 'is-completed' : ''} ${isCurrent ? 'is-current' : ''}`}
                      >
                        <div className="hiyaghar-timeline-node">
                          {isCompleted ? (
                            <span className="check-mark">✓</span>
                          ) : isCurrent ? (
                            <span className="current-dot">●</span>
                          ) : (
                            <span className="future-dot">○</span>
                          )}
                        </div>

                        {idx < order.timeline.length - 1 && (
                          <div className={`hiyaghar-timeline-line ${isCompleted ? 'is-completed' : ''}`} />
                        )}

                        <div className="hiyaghar-timeline-content">
                          <div className="hiyaghar-timeline-title-row">
                            <h4 className="hiyaghar-step-title">{step.title}</h4>
                            {step.timestamp && (
                              <span className="hiyaghar-step-time">{step.timestamp}</span>
                            )}
                          </div>
                          <p className="hiyaghar-step-desc">{step.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 22. COURIER & TRACKING DETAILS CARD */}
              <div className="hiyaghar-courier-info-card">
                <div className="hiyaghar-courier-grid">
                  {/* Courier Name */}
                  <div className="hiyaghar-courier-item">
                    <span className="label">Courier Partner</span>
                    <span className="val highlight">{order.courierName}</span>
                  </div>

                  {/* Tracking ID */}
                  <div className="hiyaghar-courier-item">
                    <span className="label">Tracking ID / AWB</span>
                    <div className="val-row">
                      <span className="val code">{order.trackingId}</span>
                      <button
                        type="button"
                        className="hiyaghar-copy-btn"
                        onClick={handleCopyTrackingId}
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  {/* Invoice Download */}
                  <div className="hiyaghar-courier-item">
                    <span className="label">Tax Invoice</span>
                    <button
                      type="button"
                      className="hiyaghar-invoice-btn"
                      onClick={handleDownloadInvoice}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Download Invoice
                    </button>
                  </div>
                </div>

                {/* Support Option */}
                <div className="hiyaghar-support-row">
                  <span>Need assistance with this shipment?</span>
                  <button
                    type="button"
                    className="hiyaghar-support-btn"
                    onClick={() => setIsSupportOpen(true)}
                  >
                    💬 Contact Support
                  </button>
                </div>
              </div>

              {/* ORDER ITEMS SUMMARY */}
              <div className="hiyaghar-track-items-summary">
                <h4 className="title">Items in this shipment</h4>
                <div className="items-grid">
                  {order.items.map((item) => (
                    <div key={item.id} className="item-card">
                      <img src={item.image} alt={item.name} />
                      <div className="details">
                        <span className="name">{item.name}</span>
                        <span className="meta" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>Pack Size: {item.weight} • Qty: <AnimatedNumber value={item.quantity} /></span>
                      </div>
                      <span className="price" style={{ display: 'inline-flex', alignItems: 'center' }}>₹<AnimatedNumber value={item.price * item.quantity} /></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* SUPPORT MODAL */}
      {isSupportOpen && (
        <div className="hiyaghar-modal-overlay" onClick={() => setIsSupportOpen(false)}>
          <div className="hiyaghar-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="hiyaghar-modal-header">
              <h3>HIYA Customer Care 💛</h3>
              <button type="button" className="close-btn" onClick={() => setIsSupportOpen(false)}>
                ✕
              </button>
            </div>
            <div className="hiyaghar-modal-body">
              <p>Our concierge team is available Mon–Sat (9:00 AM – 7:00 PM IST) to assist with your order.</p>

              <div className="support-channels">
                <a
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noreferrer"
                  className="channel-card whatsapp"
                >
                  <span className="icon">💬</span>
                  <div>
                    <strong>WhatsApp Support</strong>
                    <span>+91 98765 43210 (Instant reply)</span>
                  </div>
                </a>

                <a
                  href="mailto:support@hiyamukhwas.com"
                  className="channel-card email"
                  onClick={() => {
                    navigator.clipboard.writeText('support@hiyamukhwas.com').catch(() => {});
                    showToast('support@hiyamukhwas.com copied to clipboard — reach out anytime!');
                  }}
                >
                  <span className="icon">✉️</span>
                  <div>
                    <strong>Email Support</strong>
                    <span>support@hiyamukhwas.com</span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
