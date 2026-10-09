import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Header } from '../../components/layout/Header/Header';
import { Footer } from '../../components/layout/Footer/Footer';
import { ScrollReveal } from '../../components/common/ScrollReveal/ScrollReveal';
import { FaqService } from '../../services/faqService';
import { navigateTo } from '../../utils/navigation';
import './FaqPage.css';

interface FaqItem {
  id: string | number;
  category: string;
  question: string;
  answer: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    id: 'gen-1',
    category: 'general',
    question: 'What is HIYAGHAR all about?',
    answer:
      'HIYAGHAR is a premium Indian heritage & wellness lifestyle brand founded with the philosophy "From Our Ghar, With Heart." We craft 100% natural, artisanal mukhwas, traditional tea masalas, cold-processed herbal soaps, Ayurvedic hair oils, and curated festive hampers in small batches using time-tested recipes.',
  },
  {
    id: 'gen-2',
    category: 'general',
    question: 'Are HIYAGHAR products 100% natural and preservative-free?',
    answer:
      'Yes, absolutely. All our mukhwas and spice blends contain zero artificial colors, synthetic flavors, or chemical preservatives. Our skincare and hair wellness range is crafted using pure botanical extracts, cold-pressed oils, and natural herbs.',
  },
  {
    id: 'prod-1',
    category: 'products',
    question: 'How should I store HIYAGHAR Mukhwas and Tea Masala?',
    answer:
      'Store your mukhwas and tea masala in a cool, dry place away from direct sunlight. Always keep the container tightly sealed to preserve the rich aroma, crunch, and authentic essential oils.',
  },
  {
    id: 'prod-2',
    category: 'products',
    question: 'What is the shelf life of your digestive mukhwas and soaps?',
    answer:
      'Our artisanal mukhwas typically have a shelf life of 6 to 9 months from the date of manufacture. Our cold-processed soaps and herbal hair oils have a shelf life of 12 to 24 months.',
  },
  {
    id: 'prod-3',
    category: 'products',
    question: 'Are your handmade soaps suitable for sensitive skin?',
    answer:
      'Yes! Our soaps are made through traditional cold-process saponification without SLS, parabens, or harsh sulfates. They retain natural glycerin that deeply moisturizes even sensitive skin types.',
  },
  {
    id: 'ord-1',
    category: 'orders',
    question: 'How long will it take to receive my order?',
    answer:
      'Orders are usually packed and dispatched within 24–48 hours. Delivery across major metro cities takes 2–4 business days, and 4–7 business days for other locations across India.',
  },
  {
    id: 'ord-2',
    category: 'orders',
    question: 'How can I track my shipment?',
    answer:
      'Once your package is shipped, you will receive an SMS and email notification with your tracking details. You can also visit our dedicated "Track Order" page and enter your Order ID anytime.',
  },
  {
    id: 'ord-3',
    category: 'orders',
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major UPI apps (Google Pay, PhonePe, Paytm), Credit & Debit Cards, Net Banking, and Cash on Delivery (COD) across eligible pin codes.',
  },
  {
    id: 'gift-1',
    category: 'gifting',
    question: 'Can I customize a combo or gift hamper for weddings/festivals?',
    answer:
      'Yes! You can use our interactive "Customize Combo" builder online, or contact us directly via WhatsApp / Contact Us page for bulk wedding favors, corporate gifting, and bespoke luxury gift hampers.',
  },
  {
    id: 'gift-2',
    category: 'gifting',
    question: 'Do you provide personalized gift notes inside the box?',
    answer:
      'Yes, you can add a personalized gift message during checkout, and our team will hand-inscribe your thoughtful greeting card inside the premium gift hamper.',
  },
];

const CATEGORIES = [
  { key: 'all', label: 'All Questions' },
  { key: 'general', label: 'About HIYAGHAR' },
  { key: 'products', label: 'Products & Ingredients' },
  { key: 'orders', label: 'Orders & Shipping' },
  { key: 'gifting', label: 'Gifting & Combos' },
];

export const FaqPage: React.FC = () => {
  const [faqs, setFaqs] = useState<FaqItem[]>(FAQ_DATA);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    FaqService.getPublicFaqs().then((res) => {
      if (res.success && res.data && res.data.length > 0) {
        setFaqs(res.data);
        if (res.data[0]?.id) {
          setOpenItems({ [String(res.data[0].id)]: true });
        }
      } else {
        setOpenItems({ 'gen-1': true });
      }
    });
  }, []);

  const toggleItem = (id: string | number) => {
    const key = String(id);
    setOpenItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const filteredFaqs = faqs.filter((item) => {
    const matchesCategory =
      activeCategory === 'all' || item.category?.toLowerCase() === activeCategory.toLowerCase();
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="hiyaghar-faq-page">
      <Helmet>
        <title>Frequently Asked Questions (FAQ) | HIYAGHAR</title>
        <meta
          name="description"
          content="Find answers to common questions about HIYAGHAR handcrafted natural mukhwas, traditional tea masala, handmade soaps, shipping, orders, and custom gifting."
        />
        <link rel="canonical" href="https://hiyaghar.com/faq" />
      </Helmet>

      <Header />

      <main id="main-content" tabIndex={-1} className="hiyaghar-faq-main">
        {/* HERO BANNER */}
        <section className="hiyaghar-faq-hero">
          <div className="hiyaghar-faq-hero-inner">
            <span className="hiyaghar-faq-badge">Help & Support</span>
            <h1 className="hiyaghar-faq-title">Frequently Asked Questions</h1>
            <p className="hiyaghar-faq-subtitle">
              Everything you need to know about our handcrafted products, ingredients, shipping, and custom gifting.
            </p>

            {/* SEARCH BAR */}
            <div className="hiyaghar-faq-search-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="hiyaghar-faq-search-input"
                aria-label="Search frequently asked questions"
                placeholder="Search questions (e.g., mukhwas, shipping, gift hamper)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="hiyaghar-faq-clear-btn"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </section>

        {/* FAQ CONTENT */}
        <div className="hiyaghar-faq-container">
          {/* CATEGORY TABS */}
          <div className="hiyaghar-faq-tabs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                className={`hiyaghar-faq-tab ${activeCategory === cat.key ? 'active' : ''}`}
                onClick={() => {
                  setActiveCategory(cat.key);
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* FAQ LIST */}
          <ScrollReveal variant="fade-up" delay={100}>
            {filteredFaqs.length > 0 ? (
              <div className="hiyaghar-faq-list">
                {filteredFaqs.map((item) => {
                  const isOpen = !!openItems[item.id];
                  return (
                    <div
                      key={item.id}
                      className={`hiyaghar-faq-item ${isOpen ? 'open' : ''}`}
                    >
                      <button
                        type="button"
                        className="hiyaghar-faq-question"
                        onClick={() => toggleItem(item.id)}
                        aria-expanded={isOpen}
                      >
                        <span>{item.question}</span>
                        <span className="hiyaghar-faq-icon">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </span>
                      </button>
                      {isOpen && (
                        <div className="hiyaghar-faq-answer">
                          {item.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="hiyaghar-faq-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
                <h3>No answers found</h3>
                <p>We couldn't find any questions matching "{searchQuery}".</p>
                <button
                  type="button"
                  className="hiyaghar-faq-btn-secondary"
                  onClick={() => setSearchQuery('')}
                >
                  Clear Search
                </button>
              </div>
            )}
          </ScrollReveal>

          {/* CONTACT CTA */}
          <ScrollReveal variant="fade-up" delay={200}>
            <div className="hiyaghar-faq-cta">
              <h3>Still have questions?</h3>
              <p>
                Can't find the answer you're looking for? Our dedicated team is here to assist you with any inquiries.
              </p>
              <div className="hiyaghar-faq-cta-btns">
                <a
                  href="/contact-us"
                  className="hiyaghar-faq-btn-primary"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo('/contact-us');
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  Contact Our Team
                </a>
                <a
                  href="/mukhwas"
                  className="hiyaghar-faq-btn-secondary"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo('/mukhwas');
                  }}
                >
                  Explore Products
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
