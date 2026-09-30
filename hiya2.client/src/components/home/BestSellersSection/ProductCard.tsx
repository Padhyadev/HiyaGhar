import React from 'react';

export interface Product {
  id: string;
  name: string;
  subtitle: string;
  rating: number;
  bgColor: string;
  accentColor: string;
  badgeText: string;
}

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <article
      className="hiyaghar-product-card"
      style={{ backgroundColor: product.bgColor }}
      aria-label={`${product.name} - ${product.subtitle}`}
    >
      {/* 5-Star Accessible Rating */}
      <div className="hiyaghar-card-rating" aria-label={`${product.rating} out of 5 stars`}>
        {Array.from({ length: 5 }).map((_, index) => (
          <svg
            key={index}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="hiyaghar-star-icon"
            aria-hidden="true"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>

      {/* Product Title & Subtitle */}
      <h3 className="hiyaghar-card-title">{product.name}</h3>
      <p className="hiyaghar-card-subtitle">{product.subtitle}</p>

      {/* Visual Product Image Container */}
      <div className="hiyaghar-card-image-wrapper">
        <div className="hiyaghar-card-pouch-illustration" aria-hidden="true">
          <svg viewBox="0 0 160 210" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', objectFit: 'contain' }}>
            {/* Pouch Cap */}
            <rect x="68" y="5" width="24" height="18" rx="3" fill="#ffffff" fillOpacity="0.95" />
            <rect x="64" y="21" width="32" height="6" rx="2" fill="#e2e8f0" />
            {/* Pouch Neck */}
            <path d="M60 27H100L108 45H52L60 27Z" fill="#ffffff" fillOpacity="0.85" />
            {/* Main Pouch Body */}
            <path d="M30 45C30 45 15 62 15 95V175C15 188 25 198 38 198H122C135 198 145 188 145 175V95C145 62 130 45 130 45H30Z" fill="white" fillOpacity="0.22" stroke="white" strokeWidth="2" />
            {/* Shiny Gloss Overlay */}
            <path d="M30 45C30 45 15 62 15 95V175C15 188 25 198 38 198H65V45H30Z" fill="white" fillOpacity="0.15" />
            {/* Internal Label Details */}
            <text x="80" y="82" textAnchor="middle" fill="white" fontSize="16" fontWeight="900" letterSpacing="1">HIYAGHAR</text>
            <text x="80" y="98" textAnchor="middle" fill="white" fillOpacity="0.9" fontSize="8" fontWeight="700" letterSpacing="1">ORGANIC</text>
            
            {/* White Flavor Badge Pill */}
            <rect x="25" y="112" width="110" height="28" rx="14" fill="white" />
            <text x="80" y="130" textAnchor="middle" fill={product.bgColor} fontSize="9" fontWeight="800">{product.name.toUpperCase()}</text>

            <text x="80" y="160" textAnchor="middle" fill="white" fontSize="9" fontWeight="700">SUPERFOOD</text>
            <text x="80" y="176" textAnchor="middle" fill="white" fillOpacity="0.85" fontSize="8" fontWeight="600">{product.badgeText}</text>
          </svg>
        </div>
      </div>
    </article>
  );
};
