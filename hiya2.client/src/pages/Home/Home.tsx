import React from 'react';
import { Header } from '../../components/layout/Header/Header';
import { Hero } from '../../components/home/Hero/Hero';
import { BestSellersSection } from '../../components/home/BestSellersSection/BestSellersSection';
import { CombosSection } from '../../components/home/CombosSection/CombosSection';
import { WhyHiyaSection } from '../../components/home/WhyHiyaSection/WhyHiyaSection';
import { FeaturedStorySection } from '../../components/home/FeaturedStorySection/FeaturedStorySection';
import { FounderStrip } from '../../components/story/FounderStrip/FounderStrip';
import { GiftingHampersSection } from '../../components/home/GiftingHampersSection/GiftingHampersSection';
import { ReviewsSection } from '../../components/home/ReviewsSection/ReviewsSection';
import { HiyaAtHomeSection } from '../../components/home/HiyaAtHomeSection/HiyaAtHomeSection';
import { Footer } from '../../components/layout/Footer/Footer';
import './Home.css';

export const Home: React.FC = () => {
  return (
    <div className="hiyaghar-home-layout">
      <Header />
      <main id="main-content" tabIndex={-1} className="hiyaghar-home-main">
        <Hero />
        {/* 1. Category Section (EXPLORE CATEGORIES / Squeeze in Some Goodness) */}
        <BestSellersSection componentKey="Category" />

        {/* 2. Bestsellers Product Section (BESTSELLERS / Our Most Popular Products) */}
        <BestSellersSection componentKey="Bestsellers" />

        <CombosSection />
        <WhyHiyaSection />
        <FeaturedStorySection />
        {/* Founder Strip below product categories and above footer */}
        <FounderStrip />
        <GiftingHampersSection />
        <ReviewsSection />
        <HiyaAtHomeSection />
      </main>
      <Footer />
    </div>
  );
};
