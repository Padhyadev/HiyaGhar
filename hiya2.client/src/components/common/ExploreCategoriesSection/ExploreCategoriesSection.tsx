import React, { useEffect, useState } from 'react';
import { ScrollReveal } from '../ScrollReveal/ScrollReveal';
import { navigateTo } from '../../../utils/navigation';
import { CategoryService } from '../../../services/categoryService';
import type { ApiCategory } from '../../../services/categoryService';
import { ProductService } from '../../../services/productService';
import './ExploreCategoriesSection.css';

interface CategoryWithCount extends ApiCategory {
  productCount: number;
}

export const ExploreCategoriesSection: React.FC = () => {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const cats = await CategoryService.getCategories();
      const allProducts = await ProductService.getProducts();

      const topCats = cats.filter(c => {
        const name = c.categoryName.toLowerCase();
        return name.includes('mukhwas') || name.includes('tea') || name.includes('soap') || name.includes('hair');
      }).slice(0, 4);
      
      const catsWithCount = topCats.map(cat => ({
        ...cat,
        productCount: allProducts.filter(p => p.categoryId === cat.id).length
      }));

      setCategories(catsWithCount);
    };

    fetchCategories();
  }, []);

  if (categories.length === 0) return null;

  return (
    <section className="hiyaghar-explore-categories" aria-label="Explore Categories">
      <div className="hiyaghar-explore-inner">
        <ScrollReveal variant="fade-up">
          <header className="hiyaghar-explore-header">
            <h2 className="hiyaghar-explore-title">Explore More from Hiya</h2>
            <p className="hiyaghar-explore-subtitle">Discover our full range of handcrafted, natural products.</p>
          </header>
        </ScrollReveal>

        <div className="hiyaghar-explore-grid">
          {categories.map((cat, idx) => {
            const nameLower = cat.categoryName.toLowerCase();
            let slug = '';
            let bgImage = '/image/jamunbottole_clean.webp';

            if (nameLower.includes('mukhwas') || nameLower.includes('mukhwash')) {
              slug = 'mukhwas';
              bgImage = '/image/mukhwas_hero_bg.webp';
            } else if (nameLower.includes('tea')) {
              slug = 'tea-masala';
              bgImage = '/image/Banner_image/Tea-Masala.webp';
            } else if (nameLower.includes('soap')) {
              slug = 'handmade-soap';
              bgImage = '/image/Banner_image/Soap.webp';
            } else if (nameLower.includes('hair')) {
              slug = 'hair-oil';
              bgImage = '/image/Banner_image/Hair_Oil.webp';
            }
            
            return (
              <ScrollReveal key={cat.id} variant="fade-up" delay={idx * 100}>
                <div 
                  className="hiyaghar-explore-card"
                  onClick={() => navigateTo(`/${slug}`)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="hiyaghar-explore-card-bg" style={{ backgroundImage: `url('${bgImage}')` }} />
                  <div className="hiyaghar-explore-card-overlay" />
                  <div className="hiyaghar-explore-card-content">
                    <h3 className="hiyaghar-explore-card-title">{cat.categoryName}</h3>
                    <span className="hiyaghar-explore-card-count">{cat.productCount} Product{cat.productCount !== 1 ? 's' : ''}</span>
                    
                    <div className="hiyaghar-explore-card-arrow">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};
