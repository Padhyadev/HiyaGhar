import React, { useState, useEffect } from 'react';
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
    question: 'What is HIYAGHAR?',
    answer:
      'HIYAGHAR is a family brand bringing you 100% natural, handmade mukhwas, traditional tea masala, natural soaps, and herbal hair oils. Everything is freshly made in small batches with zero chemicals.',
  },
  {
    id: 'gen-2',
    category: 'general',
    question: 'Are HIYAGHAR products 100% natural and preservative-free?',
    answer:
      'Yes, 100%! We do not use any artificial food colors, synthetic flavors, or chemical preservatives. All our mukhwas, spices, and soaps are made using pure natural ingredients.',
  },
  {
    id: 'prod-1',
    category: 'products',
    question: 'How should I store HIYAGHAR Mukhwas and Tea Masala?',
    answer:
      'Keep the jar in a cool, dry place away from direct sunlight. Always close the lid tightly after use to keep the mukhwas crunchy and the aroma fresh.',
  },
  {
    id: 'prod-2',
    category: 'products',
    question: 'What is the shelf life of your mukhwas, soaps, and hair oils?',
    answer:
      'Our mukhwas stays fresh and crunchy for 6 to 9 months from the date of packing. Our handmade soaps and herbal hair oils stay good for 1 to 2 years.',
  },
  {
    id: 'prod-3',
    category: 'products',
    question: 'Are your handmade soaps suitable for sensitive skin?',
    answer:
      'Yes! Our soaps are made with natural oils and herbs without any harsh chemicals, SLS, or parabens. They are gentle and deeply moisturize even sensitive skin.',
  },
  {
    id: 'ord-1',
    category: 'orders',
    question: 'Where do you deliver, and how long does it take?',
    answer:
      'We currently deliver across Ahmedabad (around Ghatlodiya). Orders placed before 1:00 PM are prepared and dispatched the same day. Delivery usually takes 3 to 5 business days.',
  },
  {
    id: 'ord-2',
    category: 'orders',
    question: 'How can I check my order status?',
    answer:
      "You will receive an email confirmation as soon as your order is placed. You can also view your live order status anytime by logging in and going to 'My Account → Orders'.",
  },
  {
    id: 'ord-3',
    category: 'orders',
    question: 'What payment methods do you accept?',
    answer:
      'We accept UPI (Google Pay, PhonePe, Paytm), all Debit and Credit Cards, Net Banking, and Cash on Delivery (COD) across eligible pin codes.',
  },
  {
    id: 'gift-1',
    category: 'gifting',
    question: 'Can I customize a combo or gift hamper for weddings or festivals?',
    answer:
      'Yes! You can build your own gift box directly on our website, or contact us on WhatsApp for bulk orders for weddings, festivals, and corporate gifting.',
  },
  {
    id: 'gift-2',
    category: 'gifting',
    question: 'Can I add a personalized message and photo to the gift box?',
    answer:
      'Yes! While building your gift box, you can type your personal message and upload photos. We print a personalized gift insert letter and place it inside the gift box.',
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
      <Header />

      <main id="main-content" tabIndex={-1} className="hiyaghar-faq-main">
        {/* HERO BANNER WITH BACKGROUND IMAGE */}
        <section className="hiyaghar-faq-hero" aria-label="FAQ Hero Banner">
          <div className="hiyaghar-faq-hero-card">
            {/* Background Image */}
            <img
              className="hiyaghar-faq-hero-bg"
              src="/image/our_story_heritage_kitchen.webp"
              alt="HIYAGHAR handcrafted wellness & FAQ support banner"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
            <div className="hiyaghar-faq-hero-overlay" />

            <div className="hiyaghar-faq-hero-inner">
              

              <span className="hiyaghar-faq-badge">HELP & SUPPORT CENTER</span>
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
                  placeholder="Search questions (e.g. shipping, mukhwas)..."
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
                        aria-controls={`faq-answer-${item.id}`}
                      >
                        <span>{item.question}</span>
                        <span className="hiyaghar-faq-icon">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </span>
                      </button>
                      {/* Always in the DOM (crawlers read closed answers too); `hidden` until opened. */}
                      <div id={`faq-answer-${item.id}`} className="hiyaghar-faq-answer" hidden={!isOpen}>
                        {item.answer}
                      </div>
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
                <h2>No answers found</h2>
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
              <h2>Still have questions?</h2>
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
