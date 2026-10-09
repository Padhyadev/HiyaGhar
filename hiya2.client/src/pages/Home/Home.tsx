import React from 'react';
import { Header } from '../../components/layout/Header/Header';
import { Hero } from '../../components/home/Hero/Hero';
import { BestSellersSection } from '../../components/home/BestSellersSection/BestSellersSection';
import { CustomizeComboSection } from '../../components/home/CustomizeComboSection/CustomizeComboSection';
import { WhyHiyaSection } from '../../components/home/WhyHiyaSection/WhyHiyaSection';
import { FeaturedStorySection } from '../../components/home/FeaturedStorySection/FeaturedStorySection';
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

        <CustomizeComboSection />
        <WhyHiyaSection />
        <FeaturedStorySection />
        <GiftingHampersSection />
        <ReviewsSection />
        <HiyaAtHomeSection />
      </main>
      <Footer />
    </div>
  );
};
