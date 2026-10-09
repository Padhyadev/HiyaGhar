import React, { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header/Header';
import { Footer } from '../../components/layout/Footer/Footer';
import { ScrollReveal } from '../../components/common/ScrollReveal/ScrollReveal';
import { ShippingService, type ShippingSettings } from '../../services/shippingService';
import { navigateTo } from '../../utils/navigation';
import './OurStoryPage.css';

interface OurStoryPageProps {
  onNavigateHome?: () => void;
}

export const OurStoryPage: React.FC<OurStoryPageProps> = ({ onNavigateHome }) => {
  const [storeSettings, setStoreSettings] = useState<ShippingSettings>(ShippingService.getSettings());

  useEffect(() => {
    ShippingService.loadSettingsFromApi().then((settings) => {
      if (settings) setStoreSettings(settings);
    });
  }, []);

  return (
    <div className="hiyaghar-story-page-wrapper">
      <Header />
      <main id="main-content" tabIndex={-1} className="hiyaghar-story-main">
        {/* PREMIUM HERO BANNER WITH BACKGROUND PICTURE */}
        <section className="hiyaghar-story-hero-banner" aria-label="Our Story Hero Banner">
          <div className="hiyaghar-story-hero-banner-card">
            {/* SEO-friendly crawlable hero background image */}
            <img
              className="hiyaghar-story-hero-banner-bg"
              src="/image/hiya_ghar_story_banner.webp"
              alt="Hiya Ghar heritage story banner — traditional Indian mukhwas, pure spices and warm family hospitality"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />

            {/* Dark & Gold Tint Overlay for clear typography */}
            <div className="hiyaghar-story-hero-banner-overlay" />

            <div className="hiyaghar-story-hero-container">
              <ScrollReveal variant="fade-up">
                {/* Breadcrumbs */}
                <nav className="hiyaghar-story-banner-breadcrumb" aria-label="Breadcrumb">
                  <ol className="hiyaghar-story-breadcrumb-list">
                    <li>
                      <a href="#/" onClick={(e) => { e.preventDefault(); if (onNavigateHome) onNavigateHome(); else navigateTo('/'); }}>
                        Home
                      </a>
                    </li>
                    <li className="sep">/</li>
                    <li className="current">Our Story</li>
                  </ol>
                </nav>

                <h1 className="hiyaghar-story-hero-title">Every Good Thing Has a Heartfelt Story.</h1>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* STATS RIBBON */}
        <div className="hiyaghar-story-stats-container">
          <div className="hiyaghar-story-stat-item">
            <span className="hiyaghar-story-stat-num">100%</span>
            <span className="hiyaghar-story-stat-label">Natural & Chemical-Free</span>
          </div>
          <div className="hiyaghar-story-stat-divider" />
          <div className="hiyaghar-story-stat-item">
            <span className="hiyaghar-story-stat-num">0%</span>
            <span className="hiyaghar-story-stat-label">Tobacco & Artificial Colors</span>
          </div>
          <div className="hiyaghar-story-stat-divider" />
          <div className="hiyaghar-story-stat-item">
            <span className="hiyaghar-story-stat-num">Micro-Batch</span>
            <span className="hiyaghar-story-stat-label">Slow Roasted with Love</span>
          </div>
          {storeSettings.enableFssaiDisplay && Boolean(storeSettings.fssaiLicenseNumber?.trim()) ? (
            <>
              <div className="hiyaghar-story-stat-divider" />
              <div className="hiyaghar-story-stat-item">
                <span className="hiyaghar-story-stat-num">FSSAI Certified</span>
                <span className="hiyaghar-story-stat-label">Lic. No. {storeSettings.fssaiLicenseNumber}</span>
              </div>
            </>
          ) : (
            <>
              <div className="hiyaghar-story-stat-divider" />
              <div className="hiyaghar-story-stat-item">
                <span className="hiyaghar-story-stat-num">Pure & Safe</span>
                <span className="hiyaghar-story-stat-label">Grandma's Heritage Recipes</span>
              </div>
            </>
          )}
        </div>

        {/* DETAILED 4-CHAPTER STORY CONTENT SECTIONS */}
        <div className="hiyaghar-story-container">
          {/* Chapter 1: The Ahmedabad Kitchen & Heritage */}
          <div className="hiyaghar-story-block">
            <ScrollReveal variant="fade-right" className="hiyaghar-story-image-wrap">
              <div className="hiyaghar-story-img-container">
                <img
                  src="/image/our_story_heritage_kitchen.webp"
                  alt="Traditional Gujarati kitchen with brass spice dabba and pure natural ingredients"
                  className="hiyaghar-story-img-cover"
                />
              </div>
              <div className="hiyaghar-story-image-badge">
                <span>✦ Chapter 01: The Heritage Beginning</span>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="fade-left" className="hiyaghar-story-text-wrap">
              <span className="hiyaghar-story-tag">OUR ROOTS</span>
              <h2 className="hiyaghar-story-heading">Born in an Ahmedabad Home Kitchen</h2>
              <p className="hiyaghar-story-para">
                Hiya Ghar was born out of a simple observation and an enduring longing for purity. In modern Indian households, the cherished tradition of having a genuine, wholesome digestive mouth freshener (mukhwas) after meals was slowly being overtaken by factory-made, sugary confectionery and chemically treated commercial alternatives.
              </p>
              <p className="hiyaghar-story-para">
                We set out to preserve and revive timeless recipes passed down through generations right from our home in Gujarat. Sourcing wholesome digestive treasures like sun-dried Jamun seeds, crisp Fennel (saunf), hand-cured Amla, Dhana Dal, and fragrant Betel leaves (paan), we recreated the authentic aromas that once graced Indian dining tables.
              </p>
            </ScrollReveal>
          </div>

          {/* Chapter 2: The Art of Slow Roasting & Purity */}
          <div className="hiyaghar-story-block reversed">
            <ScrollReveal variant="fade-left" className="hiyaghar-story-image-wrap">
              <div className="hiyaghar-story-img-container">
                <img
                  src="/image/our_story_crafting_process.webp"
                  alt="Artisan micro-batch roasting and sorting of seeds and spices on brass thali"
                  className="hiyaghar-story-img-cover"
                />
              </div>
              <div className="hiyaghar-story-image-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--hiya-gold-text, #855F0F)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>✦ Chapter 02: Artisan Craftsmanship</span>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="fade-right" className="hiyaghar-story-text-wrap">
              <span className="hiyaghar-story-tag">OUR PROCESS</span>
              <h2 className="hiyaghar-story-heading">Micro-Batch Roasting, Zero Compromise</h2>
              <p className="hiyaghar-story-para">
                Every blend at Hiya Ghar is prepared with meticulous patience. Unlike mass-manufactured brands that rely on artificial flavors, synthetic food coloring, preservatives, or harmful additives, we craft everything in artisanal small batches.
              </p>
              <p className="hiyaghar-story-para">
                Our seeds and botanical herbs are slow-roasted at precise, low temperatures in traditional vessels. This delicate method activates the natural digestive essential oils, preserves essential nutrients, and produces that unforgettable golden crunch in every single bite.
              </p>
            </ScrollReveal>
          </div>

          {/* Chapter 3: Family Hospitality & Generous Traditions */}
          <div className="hiyaghar-story-block">
            <ScrollReveal variant="fade-right" className="hiyaghar-story-image-wrap">
              <div className="hiyaghar-story-img-container">
                <img
                  src="/image/our_story_family_tradition.webp"
                  alt="Warm family gathering sharing traditional digestive mukhwas with royal hospitality"
                  className="hiyaghar-story-img-cover"
                />
              </div>
              <div className="hiyaghar-story-image-badge">
                <span>✦ Chapter 03: The Warmth of Hospitality</span>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="fade-left" className="hiyaghar-story-text-wrap">
              <span className="hiyaghar-story-tag">CULTURE & KINSHIP</span>
              <h2 className="hiyaghar-story-heading">A Ritual of Warm Hospitality & Love</h2>
              <p className="hiyaghar-story-para">
                In Indian culture, hospitality isn’t merely hosting — it is a heartfelt blessing. Offering mukhwas after lunch or dinner represents affection, gratitude, and good health for every guest that walks through our doors.
              </p>
              <p className="hiyaghar-story-para">
                From festive Diwali gatherings and wedding celebrations to quiet evening conversations over chai with elders, Hiya Ghar carries forward this sacred bond of warmth, togetherness, and heartfelt sharing across thousands of Indian homes.
              </p>
            </ScrollReveal>
          </div>

          {/* Chapter 4: Beyond Mukhwas - Wholesome Living */}
          <div className="hiyaghar-story-block reversed">
            <ScrollReveal variant="fade-left" className="hiyaghar-story-image-wrap">
              <div className="hiyaghar-story-img-container">
                <img
                  src="/image/lifestyle_chai.webp"
                  alt="Aromatic Traditional Tea Masala and Chai experience"
                  className="hiyaghar-story-img-cover"
                />
              </div>
              <div className="hiyaghar-story-image-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--hiya-gold-text, #855F0F)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                  <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                  <line x1="6" y1="1" x2="6" y2="4" />
                  <line x1="10" y1="1" x2="10" y2="4" />
                  <line x1="14" y1="1" x2="14" y2="4" />
                </svg>
                <span>✦ Chapter 04: Daily Wellness Rituals</span>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="fade-right" className="hiyaghar-story-text-wrap">
              <span className="hiyaghar-story-tag">EXPANDING GOODNESS</span>
              <h2 className="hiyaghar-story-heading">From Mukhwas to Holistic Daily Wellness</h2>
              <p className="hiyaghar-story-para">
                What began with artisan digestive mukhwas has naturally blossomed into a broader philosophy of mindful, chemical-free living.
              </p>
              <p className="hiyaghar-story-para">
                Today, Hiya Ghar also offers our signature <strong>Royal Tea Masala</strong> hand-ground with sun-dried green cardamom, sun-cured ginger, cloves, and cinnamon, alongside nourishing cold-pressed <strong>Herbal Hair Oils</strong> and pure botanical <strong>Handmade Soaps</strong> — seamlessly weaving Ayurvedic care into your daily lifestyle.
              </p>
            </ScrollReveal>
          </div>

          {/* Core Pillars / Values Section */}
          <ScrollReveal variant="fade-up" className="hiyaghar-story-values-section">
            <div className="hiyaghar-story-values-header">
              <span className="hiyaghar-story-tag">WHAT GUIDES US</span>
              <h2>Our Four Guiding Pillars</h2>
              <p>Everything we create at Hiya Ghar is shaped by these enduring principles.</p>
            </div>

            <div className="hiyaghar-story-values-grid">
              <div className="hiyaghar-story-value-card">
                <div className="hiyaghar-story-value-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--hiya-gold-text, #855F0F)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                  </svg>
                </div>
                <h3>1. Pure Botanical Ingredients</h3>
                <p>No synthetic colors or chemical shortcuts. Only farm-fresh seeds, organic spices, and pure herbal extracts.</p>
              </div>

              <div className="hiyaghar-story-value-card">
                <div className="hiyaghar-story-value-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--hiya-gold-text, #855F0F)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                </div>
                <h3>2. Handcrafted Micro-Batches</h3>
                <p>Prepared in small batches with strict hygiene protocols to preserve natural crunch, aroma, and essential oils.</p>
              </div>

              <div className="hiyaghar-story-value-card">
                <div className="hiyaghar-story-value-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--hiya-gold-text, #855F0F)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 12 20 22 4 22 4 12" />
                    <rect x="2" y="7" width="20" height="5" />
                    <line x1="12" y1="22" x2="12" y2="7" />
                    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                  </svg>
                </div>
                <h3>3. Meaningful Gifting</h3>
                <p>Luxuriously curated gift hampers crafted for festive celebrations, weddings, and corporate milestones.</p>
              </div>

              <div className="hiyaghar-story-value-card">
                <div className="hiyaghar-story-value-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--hiya-gold-text, #855F0F)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <h3>4. Absolute Trust & Quality</h3>
                <p>FSSAI registered brand from Ahmedabad, Gujarat delivering heartfelt goodness to doorsteps all across India.</p>
              </div>
            </div>
          </ScrollReveal>

          {/* CTA Box */}
          <ScrollReveal variant="scale-up" className="hiyaghar-story-cta-box">
            <h2>Experience The Authentic Goodness</h2>
            <p>
              Explore our wide variety of artisan digestive Mukhwas, Royal Tea Masala, Herbal Hair Care, and Festive Gift Hampers.
            </p>
            <div className="hiyaghar-story-cta-btns">
              <button
                type="button"
                className="hiyaghar-story-btn-primary"
                onClick={() => navigateTo('/mukhwas')}
              >
                Explore Mukhwas Collection →
              </button>
              <button
                type="button"
                className="hiyaghar-story-btn-secondary"
                onClick={() => navigateTo('/combos')}
              >
                Build Custom Combo Box
              </button>
              <button
                type="button"
                className="hiyaghar-story-btn-secondary"
                onClick={() => navigateTo('/contact-us')}
              >
                Contact Our Team
              </button>
            </div>
          </ScrollReveal>
        </div>
      </main>
      <Footer />
    </div>
  );
};
