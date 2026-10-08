import React, { useState, useEffect } from 'react';
import { MukhwasProductCard } from '../../mukhwas/MukhwasProductCard/MukhwasProductCard';
import type { MukhwasProduct } from '../../../data/mukhwasData';
import { ScrollReveal } from '../../common/ScrollReveal/ScrollReveal';
import { ProductService, type Product as ApiProduct, type ProductVariant, type ProductImage } from '../../../services/productService';
import { HomePageService } from '../../../services/homePageService';
import { CartService } from '../../../cart';
import { navigateTo } from '../../../utils/navigation';
import { formatVariantLabel } from '../../../utils/productFormat';
import { showToast } from '../../../utils/alertService';
import './BestSellerProductsSection.css';

function mapApiToMukhwas(p: ApiProduct): MukhwasProduct {
  const defaultVariant = p.variants?.find((v: ProductVariant) => v.isDefault) || p.variants?.[0];
  const weightOpts = p.variants?.map((v: ProductVariant) => formatVariantLabel(v.variantName)) || [];
  const currentPrice = defaultVariant ? defaultVariant.price : p.basePrice;
  const origPrice = defaultVariant?.originalPrice || p.discountPrice || Math.round(currentPrice * 1.15);

  return {
    id: p.id.toString(),
    name: p.productName,
    category: 'special',
    categoryLabel: 'Special / Premium',
    price: currentPrice,
    originalPrice: origPrice,
    discountPercentage: origPrice > currentPrice ? Math.round(((origPrice - currentPrice) / origPrice) * 100) : 12,
    rating: p.rating || 4.9,
    reviewsCount: p.reviewCount || 120,
    image: p.mainImagePath || p.images?.find((img: ProductImage) => img.isPrimary)?.imagePath || '/image/ImageforMukhwash/Shahi Pan.webp',
    shortDescription: p.shortDescription || 'Handcrafted pure organic product.',
    longDescription: p.fullDescription || '100% natural organic product.',
    weightOptions: weightOpts.length > 0 ? weightOpts : ['100g', '250g'],
    variants: p.variants || [],
    badge: p.isFeatured ? 'Best Seller' : undefined,
    isBestSeller: p.isFeatured,
    isNewArrival: false,
    ingredients: ['Natural Betel Leaves', 'Gulkand', 'Dry Dates', 'Digestive Spices'],
    benefits: ['100% Natural freshness', 'Aids post-meal digestion', 'Tobacco-free'],
    nutritionalInfo: { energy: '380 kcal', carbs: '65 g', protein: '5.5 g', fat: '8 g', fiber: '12 g' },
  };
}

export const BestSellerProductsSection: React.FC = () => {
  const [productsList, setProductsList] = useState<MukhwasProduct[]>([]);

  // Fetch Bestseller Products dynamically from API
  useEffect(() => {
    let isMounted = true;

    async function loadBestsellerProducts() {
      // 1. Fetch Bestsellers component config
      const comp = await HomePageService.getComponentByKey('Bestsellers');
      const item = comp?.items?.[0];

      // 2. Fetch all products
      const allProducts: ApiProduct[] = await ProductService.getProducts();

      if (!isMounted) return;

      if (item && item.refId) {
        const pairs = HomePageService.parseProductVariantRefIds(item.refId);
        const mappedList: MukhwasProduct[] = [];

        pairs.forEach((pair: { productId: number; variantId?: number }) => {
          const prod = allProducts.find((p) => p.id === pair.productId);
          if (prod && !mappedList.some((m) => m.id === prod.id.toString())) {
            mappedList.push(mapApiToMukhwas(prod));
          }
        });

        if (mappedList.length > 0) {
          setProductsList(mappedList);
          return;
        }
      }

      // Fallback: load first 6 products
      if (allProducts && allProducts.length > 0) {
        setProductsList(allProducts.slice(0, 6).map(mapApiToMukhwas));
      }
    }

    loadBestsellerProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddToCart = (product: MukhwasProduct, weight: string) => {
    CartService.addItem({
      productId: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      originalPrice: product.originalPrice,
      weight: weight,
      quantity: 1,
    });
    showToast(`Added ${product.name} (${weight}) to your cart!`);
  };

  const handleBuyNow = (product: MukhwasProduct, weight: string) => {
    CartService.addItem({
      productId: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      originalPrice: product.originalPrice,
      weight: weight,
      quantity: 1,
    });
    navigateTo('/checkout');
  };

  const handleNavigateToDetail = (productId: string) => {
    navigateTo(`/product/${productId}`);
  };

  if (productsList.length === 0) {
    return null;
  }

  return (
    <section className="hiyaghar-bestseller-products-section" aria-label="Best Seller Products Section">
      <div className="hiyaghar-bestseller-products-container">
        {/* Section Header */}
        <ScrollReveal variant="fade-up">
          <div className="hiyaghar-bestseller-products-header">
            <span className="hiyaghar-bestseller-products-pill">OUR BESTSELLERS</span>
            <h2 className="hiyaghar-bestseller-products-title">Best Seller Products</h2>
            <p className="hiyaghar-bestseller-products-subtitle">
              Handcrafted with pure organic ingredients, loved by thousands across India.
            </p>
          </div>
        </ScrollReveal>

        {/* Dynamic Products Grid with Mukhwas Card Format */}
        <div className="hiyaghar-mukhwas-products-grid">
          {productsList.map((product, idx) => (
            <ScrollReveal key={product.id} variant="fade-up" delay={(idx % 3) * 100}>
              <MukhwasProductCard
                product={product}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                onNavigateToDetail={handleNavigateToDetail}
              />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
