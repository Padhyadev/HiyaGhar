import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Header } from '../../components/layout/Header/Header';
import { Footer } from '../../components/layout/Footer/Footer';
import { HeroSection } from '../../components/story/HeroSection/HeroSection';
import { FounderSection } from '../../components/story/FounderSection/FounderSection';
import { StorySection } from '../../components/story/StorySection/StorySection';
import { HowWeMakeSection } from '../../components/story/HowWeMakeSection/HowWeMakeSection';
import './OurStoryPage.css';

interface OurStoryPageProps {
  onNavigateHome?: () => void;
}

export const OurStoryPage: React.FC<OurStoryPageProps> = () => {
  const pageTitle = 'Our Story: Meet Founder Priti Shah | HIYA Ghar';
  const metaDescription =
    'HIYA Ghar began two years ago in a home kitchen in Ahmedabad. Meet founder Priti Shah and discover our handmade, small-batch mukhwas made from family recipes.';

  const aboutSchema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: pageTitle,
    description: metaDescription,
    mainEntity: {
      '@type': 'Person',
      name: 'Priti Shah',
      jobTitle: 'Founder',
      worksFor: {
        '@type': 'Organization',
        name: 'HIYAGHAR',
        url: 'https://hiyaghar.com',
      },
      image: 'https://hiyaghar.com/image/founder-priti-shah.webp',
    },
  };

  return (
    <div className="hg-story-wrapper">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href="https://hiyaghar.com/our-story" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://hiyaghar.com/our-story" />
        <meta property="og:image" content="https://hiyaghar.com/image/founder-priti-shah.webp" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content="https://hiyaghar.com/image/founder-priti-shah.webp" />
      </Helmet>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
      />

      <Header />

      <main id="main-content" tabIndex={-1} className="hg-story-main">
        {/* SECTION 1: HERO */}
        <HeroSection />

        {/* REASSURANCE RIBBON (Trust signals) */}
        <div className="hg-trust-ribbon" aria-label="Brand Guarantees">
          <div className="hg-trust-ribbon-inner">
            <div className="hg-trust-item">
              <span className="hg-trust-val">100% Pure</span>
              <span className="hg-trust-desc">Natural & Chemical-Free</span>
            </div>
            <div className="hg-trust-sep" aria-hidden="true" />
            <div className="hg-trust-item">
              <span className="hg-trust-val">Small Batches</span>
              <span className="hg-trust-desc">Slow Roasted by Hand</span>
            </div>
            <div className="hg-trust-sep" aria-hidden="true" />
            <div className="hg-trust-item">
              <span className="hg-trust-val">Ahmedabad Kitchen</span>
              <span className="hg-trust-desc">Family Heritage Recipes</span>
            </div>
            <div className="hg-trust-sep" aria-hidden="true" />
            <div className="hg-trust-item">
              <span className="hg-trust-val">FSSAI Certified</span>
              <span className="hg-trust-desc">Guaranteed Food Safety</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: MEET THE FOUNDER */}
        <FounderSection />

        {/* SECTION 3: OUR STORY (FROM OUR GHAR TO YOURS) */}
        <StorySection />

        {/* SECTION 4: HOW WE MAKE IT (THE HIYA WAY) */}
        <HowWeMakeSection />
      </main>

      <Footer />
    </div>
  );
};
