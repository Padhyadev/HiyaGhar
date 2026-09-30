import React, { useEffect, useState } from 'react';
import { WishlistService } from '../../services/wishlistService';
import type { WishlistItem } from '../../services/wishlistService';
import { CartService, triggerFlyingProductAnimation } from '../../cart';
import './AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(WishlistService.getItems());

  useEffect(() => {
    setWishlistItems(WishlistService.getItems());
  }, [isOpen]);

  useEffect(() => {
    const unsubWish = WishlistService.subscribe(() => {
      setWishlistItems(WishlistService.getItems());
    });
    return () => {
      unsubWish();
    };
  }, []);

  if (!isOpen) return null;

  const handleAddToCartFromWishlist = (e: React.MouseEvent<HTMLButtonElement>, item: WishlistItem) => {
    const btn = e.currentTarget;
    const itemId = CartService.addItem({
      productId: item.productId,
      name: item.name,
      image: item.image,
      price: item.price,
      originalPrice: item.originalPrice,
      weight: item.weight,
      quantity: 1,
    });

    triggerFlyingProductAnimation(btn, itemId, () => {
      // Remove from wishlist after moving to cart
      WishlistService.removeItem(item.id);
    });
  };

  const handleRemoveFromWishlist = (id: string) => {
    WishlistService.removeItem(id);
  };

  return (
    <div className="hiyaghar-auth-modal-overlay" onClick={onClose}>
      <div className="hiyaghar-auth-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="hiyaghar-auth-modal-header">
          <div className="hiyaghar-auth-title-group">
            <span className="hiyaghar-auth-icon">💖</span>
            <h3>Wishlist ({wishlistItems.length})</h3>
          </div>
          <button type="button" className="hiyaghar-auth-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <div className="hiyaghar-auth-body">
          {wishlistItems.length === 0 ? (
            <div className="hiyaghar-empty-wishlist">
              <h4>Your Wishlist is Empty</h4>
              <p>Explore our gourmet Mukhwas collection and save your favorite treats here!</p>
              <button
                type="button"
                className="hiyaghar-auth-submit-btn"
                onClick={() => {
                  onClose();
                  window.location.hash = '#mukhwas';
                }}
              >
                Explore Mukhwas Collection
              </button>
            </div>
          ) : (
            <div className="hiyaghar-wishlist-items-list">
              {wishlistItems.map((item) => (
                <div key={item.id} className="hiyaghar-wishlist-item-card">
                  <img src={item.image} alt={item.name} className="img" />
                  <div className="details">
                    <span className="name">{item.name}</span>
                    <span className="weight">Size: {item.weight}</span>
                    <span className="price">₹{item.price}</span>
                  </div>
                  <div className="actions">
                    <button
                      type="button"
                      className="add-cart-btn"
                      onClick={(e) => handleAddToCartFromWishlist(e, item)}
                    >
                      + Add to Cart
                    </button>
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => handleRemoveFromWishlist(item.id)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
