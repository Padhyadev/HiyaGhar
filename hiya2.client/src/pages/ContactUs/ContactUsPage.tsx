import React, { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header/Header';
import { Footer } from '../../components/layout/Footer/Footer';
import { ScrollReveal } from '../../components/common/ScrollReveal/ScrollReveal';
import { showToast } from '../../utils/alertService';
import { ContactQueryService } from '../../services/contactQueryService';
import { ShippingService, type ShippingSettings } from '../../services/shippingService';
import { navigateTo } from '../../utils/navigation';
import './ContactUsPage.css';

export const ContactUsPage: React.FC = () => {
  const [storeSettings, setStoreSettings] = useState<ShippingSettings>(ShippingService.getSettings());
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Load store details dynamically from backend/settings
    ShippingService.loadSettingsFromApi().then((settings) => {
      if (settings) {
        setStoreSettings(settings);
      }
    });

    const handleStorageChange = () => {
      setStoreSettings(ShippingService.getSettings());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // For phone number: only allow numbers and leading + symbol
    if (name === 'phone') {
      const sanitizedPhone = value.replace(/[^\d+]/g, '');
      setFormData((prev) => ({ ...prev, phone: sanitizedPhone }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear individual field error on change
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    setIsSubmitting(true);
    const res = await ContactQueryService.submitQuery({
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone || undefined,
      subject: formData.subject,
      message: formData.message,
    });
    setIsSubmitting(false);

    if (res.success) {
      setSubmitted(true);
      setErrors({});
      showToast(res.message || 'Thank you! Your message has been sent.', 'success');
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        subject: 'General Inquiry',
        message: '',
      });

      // Auto dismiss success alert after 5 seconds
      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    } else {
      if (res.errors && Object.keys(res.errors).length > 0) {
        setErrors(res.errors);
      } else {
        showToast(res.message || 'Failed to send message. Please try again.', 'error');
      }
    }
  };

  return (
    <div className="hiyaghar-contact-page-wrapper">
      <Header />
      <main id="main-content" tabIndex={-1} className="hiyaghar-contact-main">
        {/* PREMIUM HERO BANNER WITH BACKGROUND PICTURE */}
        <section className="hiyaghar-contact-hero-banner" aria-label="Contact Us Hero Banner">
          <div className="hiyaghar-contact-hero-banner-card">
            {/* Dark & Brand Overlay */}
            <div className="hiyaghar-contact-hero-banner-overlay" />

            <div className="hiyaghar-contact-hero-container">
              <ScrollReveal variant="fade-up">
                {/* Breadcrumbs */}
                <nav className="hiyaghar-contact-banner-breadcrumb" aria-label="Breadcrumb">
                  <ol className="hiyaghar-contact-breadcrumb-list">
                    <li>
                      <a href="#/" onClick={(e) => { e.preventDefault(); navigateTo('/'); }}>
                        Home
                      </a>
                    </li>
                    <li className="sep">/</li>
                    <li className="current">Contact Us</li>
                  </ol>
                </nav>

                <span className="hiyaghar-contact-eyebrow">GET IN TOUCH & CONNECT</span>
                <h1 className="hiyaghar-contact-hero-title">We’d Love To Hear From You</h1>
                <p className="hiyaghar-contact-hero-subtitle">
                  Have questions about our handcrafted natural mukhwas, custom combo boxes, corporate gift hampers, or your delivery? We’re always here to assist you.
                </p>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* MAIN CONTENT GRID */}
        <div className="hiyaghar-contact-container">
          <div className="hiyaghar-contact-grid">
            {/* LEFT COLUMN: CONTACT DETAILS & INFO */}
            <ScrollReveal variant="fade-right" className="hiyaghar-contact-info-col">
              <div className="hiyaghar-contact-info-card">
                <h2>Contact Information</h2>
                <p className="hiyaghar-contact-info-desc">
                  Reach out to us directly through any of the following channels or send us a message through the form.
                </p>

                <div className="hiyaghar-contact-details-list">
                  {/* WhatsApp & Phone */}
                  <div className="hiyaghar-contact-item">
                    <div className="hiyaghar-contact-icon whatsapp-icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </div>
                    <div className="hiyaghar-contact-item-content">
                      <span className="hiyaghar-contact-label">Customer Support & WhatsApp</span>
                      <a href={`tel:${storeSettings.contactPhone || '+91 92744 43617'}`} className="hiyaghar-contact-val">
                        {storeSettings.contactPhone || '+91 92744 43617'}
                      </a>
                      <a
                        href={`https://wa.me/${(storeSettings.contactPhone || '919274443617').replace(/[^0-9]/g, '')}?text=Hello%20HiyaGhar,%20I%20have%20an%20inquiry.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hiyaghar-whatsapp-badge"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.541 1.761.817 2.796.818h.005c3.179 0 5.767-2.587 5.768-5.766.001-3.187-2.578-5.805-5.773-5.805zm0 10.457c-.896 0-1.637-.247-2.397-.704l-.171-.103-1.776.465.474-1.732-.113-.179c-.508-.813-.807-1.625-.807-2.438 0-2.544 2.072-4.615 4.622-4.615 2.546 0 4.618 2.071 4.618 4.618 0 2.546-2.072 4.688-4.449 4.688z"/>
                        </svg>
                        <span>Chat on WhatsApp</span>
                      </a>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="hiyaghar-contact-item">
                    <div className="hiyaghar-contact-icon email-icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </div>
                    <div className="hiyaghar-contact-item-content">
                      <span className="hiyaghar-contact-label">Email Support</span>
                      <a href={`mailto:${storeSettings.contactEmail || 'support@hiyaghar.com'}`} className="hiyaghar-contact-val">
                        {storeSettings.contactEmail || 'support@hiyaghar.com'}
                      </a>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="hiyaghar-contact-item">
                    <div className="hiyaghar-contact-icon loc-icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <div className="hiyaghar-contact-item-content">
                      <span className="hiyaghar-contact-label">Origin & Operating Address</span>
                      <p className="hiyaghar-contact-text">
                        {storeSettings.contactAddress || 'Ahmedabad, Gujarat, India - 380015'}
                      </p>
                    </div>
                  </div>

                  {/* Working Hours */}
                  <div className="hiyaghar-contact-item">
                    <div className="hiyaghar-contact-icon time-icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <div className="hiyaghar-contact-item-content">
                      <span className="hiyaghar-contact-label">Operating Hours</span>
                      <p className="hiyaghar-contact-text">
                        Monday – Saturday: 10:00 AM – 7:00 PM IST
                      </p>
                    </div>
                  </div>
                </div>

                {/* Trust & License info (Only display if admin has entered an FSSAI number and enabled display) */}
                {storeSettings.enableFssaiDisplay && Boolean(storeSettings.fssaiLicenseNumber?.trim()) && (
                  <div className="hiyaghar-fssai-pill">
                    <span className="fssai-tag">FSSAI REGISTERED</span>
                    <span className="fssai-num">Lic. No: {storeSettings.fssaiLicenseNumber}</span>
                  </div>
                )}
              </div>
            </ScrollReveal>

            {/* RIGHT COLUMN: CONTACT INQUIRY FORM */}
            <ScrollReveal variant="fade-left" className="hiyaghar-contact-form-col">
              <div className="hiyaghar-contact-form-card">
                <h2>Send Us A Message</h2>
                <p className="hiyaghar-form-desc">
                  Fill out the form below and our team will get back to you within 24 hours.
                </p>

                {submitted && (
                  <div className="hiyaghar-form-success">
                    <div className="success-icon">✓</div>
                    <div>
                      <h4>Message Sent Successfully!</h4>
                      <p>Thank you for reaching out. We will connect with you shortly.</p>
                    </div>
                  </div>
                )}

                {/* noValidate disables default browser tooltip popup */}
                <form onSubmit={handleSubmit} className="hiyaghar-contact-form" noValidate>
                  <div className="hiyaghar-form-row">
                    <div className={`hiyaghar-form-group ${errors.fullName ? 'has-error' : ''}`}>
                      <label htmlFor="fullName">Your Full Name <span className="req">*</span></label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        placeholder="e.g. Rahul Sharma"
                        minLength={2}
                        maxLength={100}
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                      />
                      {errors.fullName && <span className="field-error-msg">{errors.fullName}</span>}
                    </div>
                    <div className={`hiyaghar-form-group ${errors.email ? 'has-error' : ''}`}>
                      <label htmlFor="email">Email Address <span className="req">*</span></label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="e.g. rahul@example.com"
                        minLength={5}
                        maxLength={100}
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                      {errors.email && <span className="field-error-msg">{errors.email}</span>}
                    </div>
                  </div>

                  <div className="hiyaghar-form-row">
                    <div className={`hiyaghar-form-group ${errors.phone ? 'has-error' : ''}`}>
                      <label htmlFor="phone">Phone / WhatsApp Number</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        placeholder="e.g. +91 98765 43210"
                        minLength={10}
                        maxLength={15}
                        value={formData.phone}
                        onChange={handleChange}
                      />
                      {errors.phone && <span className="field-error-msg">{errors.phone}</span>}
                    </div>
                    <div className="hiyaghar-form-group">
                      <label htmlFor="subject">Inquiry Type</label>
                      <select
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                      >
                        <option value="General Inquiry">General Inquiry</option>
                        <option value="Order Tracking & Support">Order Tracking & Support</option>
                        <option value="Custom Combo Box">Custom Combo Box Query</option>
                        <option value="Corporate & Wedding Gifting">Corporate & Wedding Gifting</option>
                        <option value="Bulk & Wholesale Orders">Bulk & Wholesale Orders</option>
                        <option value="Feedback / Suggestion">Feedback / Suggestion</option>
                      </select>
                    </div>
                  </div>

                  <div className={`hiyaghar-form-group full-width ${errors.message ? 'has-error' : ''}`}>
                    <label htmlFor="message">Your Message / Query <span className="req">*</span></label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      minLength={5}
                      maxLength={2000}
                      placeholder="Please let us know how we can help you..."
                      value={formData.message}
                      onChange={handleChange}
                      required
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      {errors.message ? (
                        <span className="field-error-msg">{errors.message}</span>
                      ) : <span />}
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {formData.message.length}/2000
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="hiyaghar-contact-submit-btn"
                    disabled={isSubmitting}
                  >
                    <span>{isSubmitting ? 'Sending Message...' : 'Send Message'}</span>
                    {!isSubmitting && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    )}
                  </button>
                </form>
              </div>
            </ScrollReveal>
          </div>

          {/* FAQ OR QUICK HELP SECTION */}
          <ScrollReveal variant="fade-up" className="hiyaghar-contact-faq-preview">
            <div className="hiyaghar-faq-box">
              <h3>Have a quick question about Orders or Delivery?</h3>
              <p>
                You can easily track your parcel live with your Order ID or phone number, or check our shipping policy.
              </p>
              <div className="hiyaghar-faq-links">
                <a href="/track-order" className="hiyaghar-faq-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <span>Live Order Tracking</span>
                </a>
                <a href="/shipping-policy" className="hiyaghar-faq-btn secondary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                  <span>Shipping & Delivery Policy</span>
                </a>
                <a href="/refund-policy" className="hiyaghar-faq-btn secondary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 4 1 10 7 10" />
                    <polyline points="23 20 23 14 17 14" />
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
                  </svg>
                  <span>Return & Refund Policy</span>
                </a>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </main>
      <Footer />
    </div>
  );
};
