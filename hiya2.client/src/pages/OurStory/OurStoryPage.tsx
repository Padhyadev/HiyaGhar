import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Header } from '../../components/layout/Header/Header';
import { Footer } from '../../components/layout/Footer/Footer';
import { HeroSection } from '../../components/story/HeroSection/HeroSection';
import { FounderSection } from '../../components/story/FounderSection/FounderSection';
import { StorySection } from '../../components/story/StorySection/StorySection';
import { JourneyTimeline } from '../../components/story/JourneyTimeline/JourneyTimeline';
import { HowWeMakeSection } from '../../components/story/HowWeMakeSection/HowWeMakeSection';
import { BehindTheScenes } from '../../components/story/BehindTheScenes/BehindTheScenes';
import { ClosingCtaSection } from '../../components/story/ClosingCtaSection/ClosingCtaSection';
import '../../components/story/storyShared.css';
import './OurStoryPage.css';

interface OurStoryPageProps {
  onNavigateHome?: () => void;
}

export const OurStoryPage: React.FC<OurStoryPageProps> = () => {
  // Title, description, canonical and OG tags come from seo/routes.json (App <SEO>), and the
  // AboutPage + founder JSON-LD from the server (Seo/SeoPageRenderer.cs). Only the share image
  // is specific to this page: the founder's photo instead of the default.
  const shareImage = 'https://hiyaghar.com/image/founder-priti-shah.webp';

  return (
    <div className="hg-story-wrapper">
      <Helmet>
        <meta property="og:image" content={shareImage} />
        <meta name="twitter:image" content={shareImage} />
      </Helmet>

      <Header />

      <main id="main-content" tabIndex={-1} className="hg-story-main">
        {/* SECTION 1: HERO */}
        <HeroSection />

        {/* SECTION 2: MEET THE FOUNDER */}
        <FounderSection />

        {/* SECTION 3: OUR STORY (FROM OUR GHAR TO YOURS) */}
        <StorySection />

        {/* SECTION 4: OUR JOURNEY (TIMELINE) */}
        <JourneyTimeline />

        {/* SECTION 5: HOW WE MAKE IT (THE HIYA WAY) */}
        <HowWeMakeSection />

        {/* SECTION 6: BEHIND THE SCENES (shown once kitchen photos are added) */}
        <BehindTheScenes />

        {/* SECTION 7: CLOSING CTA (WELCOME TO OUR GHAR) */}
        <ClosingCtaSection />
      </main>

      <Footer />
    </div>
  );
};
