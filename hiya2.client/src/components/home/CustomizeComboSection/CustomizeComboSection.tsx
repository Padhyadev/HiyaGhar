import React, { useState, useEffect } from 'react';
import { navigateTo } from '../../../utils/navigation';
import { ProductService, type Product as ApiProduct } from '../../../services/productService';
import './CustomizeComboSection.css';

interface ComboShowcaseItem {
  id: string;
  name: string;
  image: string;
  priceFormatted: string;
}

function mapToShowcaseItem(p: ApiProduct): ComboShowcaseItem {
  const defaultVariant = p.variants?.find((v) => v.isDefault) || p.variants?.[0];
  const price = defaultVariant ? defaultVariant.price : (p.discountPrice ?? p.basePrice);
  const image = p.images?.find((i) => i.isPrimary)?.imagePath || p.mainImagePath || '/uploads/Noimage.png';
  return {
    id: p.id.toString(),
    name: p.productName,
    image,
    priceFormatted: `₹${price}`,
  };
}

export const CustomizeComboSection: React.FC = () => {
  // Same look as before — a real product marquee replaces the old hardcoded
  // comboData.ts array, spread across categories so it still reads as "mix and
  // match your favourites" rather than repeating one category's products.
  const [items, setItems] = useState<ComboShowcaseItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    ProductService.getProducts().then((apiProducts: ApiProduct[]) => {
      if (!isMounted || !apiProducts || apiProducts.length === 0) return;

      const byCategory = new Map<number, ApiProduct[]>();
      apiProducts.forEach((p) => {
        const list = byCategory.get(p.categoryId) || [];
        list.push(p);
        byCategory.set(p.categoryId, list);
      });
      const spread: ApiProduct[] = [];
      byCategory.forEach((prods) => spread.push(...prods.slice(0, 2)));

      setItems(spread.map(mapToShowcaseItem));
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenPage = () => {
    navigateTo('/combos');
  };

  // Nothing to show yet — skip rendering rather than flashing an empty marquee.
  if (items.length === 0) return null;

  return (
    <section className="hiyaghar-combo-section" aria-label="Create Your Hiya Combo Section">
      <div className="hiyaghar-combo-inner-container">
        {/* Section Header */}
        <header className="hiyaghar-combo-header">
          <h2 className="hiyaghar-combo-title">Create Your Hiya Combo</h2>
          <p className="hiyaghar-combo-subtitle">
            Pick your favourites. Mix, match and make it yours.
          </p>
        </header>

        {/* 1. First Line Continuous Infinite Loop Marquee Showcase (Clean Product Image + Price Tag) */}
        <div className="hiyaghar-combo-marquee-wrap" aria-label="Combo Showcase Continuous Loop">
          <div className="hiyaghar-combo-marquee-track">
            {[...items, ...items, ...items].map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="hiyaghar-combo-marquee-card" onClick={handleOpenPage}>
                <div className="hiyaghar-combo-marquee-img-wrap">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="hiyaghar-combo-marquee-img"
                  />
                </div>
                <div className="hiyaghar-combo-marquee-info">
                  <h4 className="hiyaghar-combo-marquee-name">{item.name}</h4>
                  <span className="hiyaghar-combo-marquee-price">{item.priceFormatted}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. 3 Interactive Step Cards */}
        <div className="hiyaghar-combo-steps-grid">
          <div className="hiyaghar-combo-step-card" onClick={handleOpenPage} style={{ cursor: 'pointer' }}>
            <div className="hiyaghar-step-icon-wrap">
              <span className="hiyaghar-step-num">1</span>
            </div>
            <h4 className="hiyaghar-step-card-title">Step 1</h4>
            <p className="hiyaghar-step-card-desc">Choose a combo size / budget</p>
          </div>

          <div className="hiyaghar-combo-step-card" onClick={handleOpenPage} style={{ cursor: 'pointer' }}>
            <div className="hiyaghar-step-icon-wrap">
              <span className="hiyaghar-step-num">2</span>
            </div>
            <h4 className="hiyaghar-step-card-title">Step 2</h4>
            <p className="hiyaghar-step-card-desc">Select products</p>
          </div>

          <div className="hiyaghar-combo-step-card" onClick={handleOpenPage} style={{ cursor: 'pointer' }}>
            <div className="hiyaghar-step-icon-wrap">
              <span className="hiyaghar-step-num">3</span>
            </div>
            <h4 className="hiyaghar-step-card-title">Step 3</h4>
            <p className="hiyaghar-step-card-desc">Review your combo + savings</p>
          </div>
        </div>

        {/* 3. Main Call to Action Button */}
        <div className="hiyaghar-combo-main-cta-wrapper">
          <button
            type="button"
            className="hiyaghar-combo-hero-cta-btn"
            onClick={handleOpenPage}
          >
            <span>Customize Your Combo</span>
            <svg width="20" height="16" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="1" y1="7" x2="15" y2="7" />
              <polyline points="10 2 15 7 10 12" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};
