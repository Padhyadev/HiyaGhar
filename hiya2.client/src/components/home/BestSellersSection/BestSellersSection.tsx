import React, { useState, useEffect } from 'react';
import { ProductCarousel } from './ProductCarousel';
import { ScrollReveal } from '../../common/ScrollReveal/ScrollReveal';
import { HomePageService } from '../../../services/homePageService';
import './BestSellersSection.css';

interface BestSellersSectionProps {
  componentKey?: 'Category' | 'Bestsellers' | string;
}

export const BestSellersSection: React.FC<BestSellersSectionProps> = ({ componentKey = 'Category' }) => {
  const [badgeText, setBadgeText] = useState<string>(
    componentKey === 'Category' ? 'EXPLORE CATEGORIES' : 'BESTSELLERS'
  );
  const [headingText, setHeadingText] = useState<string>(
    componentKey === 'Category' ? 'Squeeze in Some Goodness' : 'Our Most Popular Products'
  );

  useEffect(() => {
    let isMounted = true;
    HomePageService.getComponentByKey(componentKey).then((comp) => {
      if (!isMounted || !comp || !comp.items || comp.items.length === 0) return;
      const item = comp.items[0];
      if (item.title) setBadgeText(item.title);
      if (item.subtitle) setHeadingText(item.subtitle);
    });

    return () => {
      isMounted = false;
    };
  }, [componentKey]);

  return (
    <section
      id={componentKey === 'Bestsellers' ? 'bestsellers-section' : undefined}
      className="hiyaghar-bestsellers-section"
      aria-label="Product Showcase Section"
    >
      {/* Main Section Container */}
      <div className="hiyaghar-bestsellers-curved-container">
        <div className="hiyaghar-container">
          <ScrollReveal variant="fade-up">
            <div className="hiyaghar-bestsellers-header-content">
              {/* Pill Badge */}
              <div className="hiyaghar-bestsellers-pill">
                <span>{badgeText}</span>
              </div>

              {/* Main Display Heading */}
              <h2 className="hiyaghar-bestsellers-title">
                {headingText}
              </h2>
            </div>
          </ScrollReveal>

          {/* Product Carousel */}
          <ScrollReveal variant="scale-up" delay={150}>
            <div className="hiyaghar-bestsellers-carousel-container">
              <ProductCarousel componentKey={componentKey} />
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};
