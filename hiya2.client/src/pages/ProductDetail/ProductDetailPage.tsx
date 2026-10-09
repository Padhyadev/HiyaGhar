import React, { useState, useEffect, useRef } from 'react';
import { Header } from '../../components/layout/Header/Header';
import { Footer } from '../../components/layout/Footer/Footer';
import { mukhwasProducts } from '../../data/mukhwasData';
import { fallbackTeaMasalaProductsData } from '../TeaMasala/TeaMasalaPage';
import { fallbackHandmadeSoapProducts } from '../HandmadeSoap/HandmadeSoapPage';
import { fallbackHairOilProductsData } from '../HairOil/HairOilPage';
import { CartService, triggerFlyingProductAnimation } from '../../cart';
import { WishlistService } from '../../services/wishlistService';
import { AnimatedNumber } from '../../components/common/AnimatedNumber';
import { ProductService, type Product as ApiProduct } from '../../services/productService';
import { ProductReviews } from '../../components/ProductReviews/ProductReviews';
import { navigateTo } from '../../utils/navigation';
import { formatVariantLabel } from '../../utils/productFormat';
import { parseProductFullDescription } from '../../utils/productMetaStore';
import { showToast } from '../../utils/alertService';
import { SEO } from '../../components/common/SEO/SEO';
import { buildProductSeoDescription, seoConfig } from '../../seo/routeSeo';
import './ProductDetailPage.css';


interface ProductDetailPageProps {
  productId: string;
  onNavigateHome: () => void;
  onNavigateMukhwas: () => void;
  onNavigateToDetail?: (id: string) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  productId,
  onNavigateHome,
  onNavigateMukhwas,
}) => {
  const allStaticProducts: any[] = [
    ...mukhwasProducts,
    ...fallbackTeaMasalaProductsData,
    ...fallbackHandmadeSoapProducts,
    ...fallbackHairOilProductsData,
  ];

  const staticMatch = allStaticProducts.find(
    (p) => p.id === productId || p.id === productId.toLowerCase()
  );

  const numericId = Number(productId);
  const isNumericId = !isNaN(numericId) && numericId > 0;

  // For a real numeric catalog id, don't show ANY product until the live fetch
  // resolves. If neither the live product nor static data exists, show a clean Not Found page.
  const [productData, setProductData] = useState<any>(isNumericId ? null : (staticMatch || null));
  const [isLoadingProduct, setIsLoadingProduct] = useState<boolean>(isNumericId);
  const [productNotFound, setProductNotFound] = useState<boolean>(!isNumericId && !staticMatch);
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'description' | 'ingredients' | 'nutrition' | 'reviews'>('description');

  // Frequently Bought Together (FBT) cross-sell state
  const [fbtCrossSells, setFbtCrossSells] = useState<any[]>([]);
  const [selectedFbtIds, setSelectedFbtIds] = useState<Record<string, boolean>>({});

  const mainImgRef = useRef<HTMLImageElement>(null);

  const isVariantInStock = (v: any) =>
    v && (typeof v.sellableStock === 'number' ? v.sellableStock > 0 : (typeof v.stockQuantity === 'number' ? v.stockQuantity > 0 : true));

  // Bundle items are added with their default (or first) variant, so that variant must be in stock.
  const isCrossSellInStock = (p: ApiProduct) => {
    const v = p.variants?.find((x) => x.isDefault) || p.variants?.[0];
    return !v || isVariantInStock(v);
  };

  useEffect(() => {
    setIsLoadingProduct(true);
    ProductService.getProductByIdOrSlug(productId).then((apiProd: ApiProduct | null) => {
      if (apiProd) {
        setProductNotFound(false);
        const inStockVar = apiProd.variants?.find(isVariantInStock);
        const defaultVar = (apiProd.variants?.find((v) => v.isDefault && isVariantInStock(v)))
          || inStockVar
          || apiProd.variants?.find((v) => v.isDefault)
          || apiProd.variants?.[0];
        const rawLabels = apiProd.variants?.map((v) => formatVariantLabel(v.variantName)).filter(Boolean) || [];
        const weightOpts = rawLabels.length > 0 ? rawLabels : [];
        const curPrice = defaultVar ? defaultVar.price : (apiProd.discountPrice || apiProd.basePrice);
        const origPrice = defaultVar?.originalPrice || (apiProd.basePrice > curPrice ? apiProd.basePrice : Math.round(curPrice * 1.25));

        const imgs: string[] = [];
        if (apiProd.images && apiProd.images.length > 0) {
          apiProd.images.forEach((img) => {
            if (img.imagePath && !imgs.includes(img.imagePath)) {
              imgs.push(img.imagePath);
            }
          });
        }
        if (imgs.length === 0 && apiProd.mainImagePath) {
          imgs.push(apiProd.mainImagePath);
        }
        const finalImgs = imgs.length > 0 ? imgs : ['/image/ImageforMukhwash/Shahi Pan.webp'];

        const parsed = parseProductFullDescription(
          apiProd.fullDescription,
          apiProd.id,
          apiProd.category?.categoryName,
          apiProd.productName
        );

        setProductData({
          id: apiProd.id.toString(),
          name: apiProd.productName,
          category: 'special',
          categoryLabel: apiProd.category?.categoryName || 'Natural Product',
          shortDescription: apiProd.shortDescription || '100% natural organic product.',
          longDescription: parsed.cleanDescription,
          seoDescription: buildProductSeoDescription(
            apiProd.productName,
            apiProd.category?.categoryName || (apiProd as any).categoryName,
            apiProd.shortDescription,
            apiProd.fullDescription,
          ),
          seoImage: apiProd.mainImagePath || finalImgs[0],
          price: curPrice,
          originalPrice: origPrice,
          rating: apiProd.rating || 0,
          reviewsCount: apiProd.reviewCount || 0,
          image: finalImgs[0],
          gallery: finalImgs,
          weightOptions: weightOpts,
          variants: apiProd.variants || [],
          badge: apiProd.isFeatured ? 'Best Seller' : undefined,
          ingredients: parsed.ingredients,
          benefits: parsed.benefits,
          servingSize: parsed.servingSize || '100g',
          nutritionalInfo: parsed.nutritionalInfo,
        });

        setSelectedImage(finalImgs[0]);
        setGalleryImages(finalImgs);
        const defaultAttrs = (defaultVar as any)?.attributes;
        if (Array.isArray(defaultAttrs) && defaultAttrs.length > 0) {
          setSelectedAttrs(Object.fromEntries(defaultAttrs.map((a: any) => [a.attributeName, a.attributeValue])));
        } else {
          const defaultVarLabel = defaultVar ? formatVariantLabel(defaultVar.variantName) : '';
          const initialWt = defaultVarLabel || (weightOpts[0] || '');
          if (initialWt) {
            setSelectedAttrs({ Weight: initialWt });
          } else {
            setSelectedAttrs({});
          }
        }
        setIsLoadingProduct(false);

        // Load real cross-sell items from Database/API for Frequently Bought Together bundle
        ProductService.getProducts().then((liveProducts) => {
          const currentIdStr = apiProd.id.toString();
          const customIds: number[] = Array.isArray(parsed?.crossSellProductIds) ? parsed.crossSellProductIds : [];
          let pickedItems: ApiProduct[] = [];

          if (customIds.length > 0) {
            pickedItems = (liveProducts || []).filter((p) => customIds.includes(p.id) && p.isActive && isCrossSellInStock(p) && p.id.toString() !== currentIdStr);
          }

          if (pickedItems.length < 2) {
            const remainingNeeded = 2 - pickedItems.length;
            const pickedIds = new Set(pickedItems.map((p) => p.id));
            const autoCandidates = (liveProducts || []).filter((p) => {
              const pIdStr = p.id.toString();
              return p.isActive && isCrossSellInStock(p) && pIdStr !== currentIdStr && !pickedIds.has(p.id);
            });
            pickedItems = [...pickedItems, ...autoCandidates.slice(0, remainingNeeded)];
          }

          const picks = pickedItems.map((item) => {
            const defVar = item.variants?.find((v) => v.isDefault) || item.variants?.[0];
            const vPrice = defVar ? defVar.price : (item.discountPrice || item.basePrice || 199);
            const vOrigPrice = defVar ? (defVar.originalPrice || defVar.price) : (item.basePrice || vPrice);
            const img = item.images?.[0]?.imagePath || item.mainImagePath || '/image/ImageforMukhwash/Shahi Pan.webp';
            const vWeight = defVar?.variantName ? formatVariantLabel(defVar.variantName) : 'Standard';

            return {
              id: item.id.toString(),
              name: item.productName,
              price: vPrice,
              originalPrice: vOrigPrice,
              image: img,
              weight: vWeight,
            };
          });

          setFbtCrossSells(picks);
          const initialFbtSelection: Record<string, boolean> = {};
          picks.forEach((p) => {
            initialFbtSelection[p.id] = true;
          });
          setSelectedFbtIds(initialFbtSelection);
        }).catch(() => {
          setFbtCrossSells([]);
          setSelectedFbtIds({});
        });
      } else if (staticMatch) {
        setProductData(staticMatch);
        setProductNotFound(false);
        const defaultImg = staticMatch.image || '/image/ImageforMukhwash/Kalkatti-Pan 1.webp';
        const secondImg = staticMatch.secondaryImage || '/image/ImageforMukhwash/Shahi Pan.webp';
        const imgs = defaultImg === secondImg ? [defaultImg] : [defaultImg, secondImg];
        setSelectedImage(defaultImg);
        setGalleryImages(imgs);

        const initialWt = staticMatch.weightOptions && staticMatch.weightOptions.length > 0
          ? (staticMatch.weightOptions.includes('250g') ? '250g' : staticMatch.weightOptions[0])
          : '100g';
        setSelectedAttrs({ Weight: initialWt });

        ProductService.getProducts().then((liveProducts) => {
          const currentIdStr = productId.toString();
          const autoCandidates = (liveProducts || []).filter((p) => p.isActive && isCrossSellInStock(p) && p.id.toString() !== currentIdStr);
          const picks = autoCandidates.slice(0, 2).map((item) => {
            const defVar = item.variants?.find((v) => v.isDefault) || item.variants?.[0];
            const vPrice = defVar ? defVar.price : (item.discountPrice || item.basePrice || 199);
            const vOrigPrice = defVar ? (defVar.originalPrice || defVar.price) : (item.basePrice || vPrice);
            const img = item.images?.[0]?.imagePath || item.mainImagePath || '/image/ImageforMukhwash/Shahi Pan.webp';
            const vWeight = defVar?.variantName ? formatVariantLabel(defVar.variantName) : 'Standard';

            return {
              id: item.id.toString(),
              name: item.productName,
              price: vPrice,
              originalPrice: vOrigPrice,
              image: img,
              weight: vWeight,
            };
          });

          setFbtCrossSells(picks);
          const initialFbtSelection: Record<string, boolean> = {};
          picks.forEach((p) => {
            initialFbtSelection[p.id] = true;
          });
          setSelectedFbtIds(initialFbtSelection);
        });

        setIsLoadingProduct(false);
      } else {
        setProductData(null);
        setProductNotFound(true);
        setFbtCrossSells([]);
        setSelectedFbtIds({});
        setIsLoadingProduct(false);
      }
    });
  }, [productId]);

  // `product` is null while the real fetch for a numeric id is still in flight
  // (see isLoadingProduct/isNumericId above) — every direct `product.x` read below
  // uses optional chaining so this component never crashes during that window;
  // the JSX further down renders a loading skeleton instead of this real content
  // whenever isLoadingProduct/!product is true, so these derived values are simply
  // unused (but still safely computed, since hooks must run unconditionally) then.
  const product = productData;

  // Attribute groups: use the real, structured per-variant attributes when the API provided
  // them; otherwise fall back to treating the whole weightOptions list as one "Weight" group
  // (older/static products that only ever had a single flat attribute).
  const hasStructuredAttributes = (product?.variants || []).some(
    (v: any) => Array.isArray(v.attributes) && v.attributes.length > 0
  );

  const rawWeightOptions = (product?.weightOptions || [])
    .map((w: string) => formatVariantLabel(w))
    .filter((w: string) => w && w.trim().length > 0);

  const attributeGroups: { name: string; values: string[] }[] = hasStructuredAttributes
    ? (() => {
        const groups: Record<string, string[]> = {};
        (product?.variants || []).forEach((v: any) => {
          (v.attributes || []).forEach((a: any) => {
            if (a.attributeValue && a.attributeValue.trim()) {
              if (!groups[a.attributeName]) groups[a.attributeName] = [];
              if (!groups[a.attributeName].includes(a.attributeValue.trim())) {
                groups[a.attributeName].push(a.attributeValue.trim());
              }
            }
          });
        });
        return Object.keys(groups)
          .sort((a, b) => a.localeCompare(b))
          .map((name) => ({ name, values: groups[name] }))
          .filter((g) => g.values.length > 0);
      })()
    : (rawWeightOptions.length > 0 ? [{ name: 'Weight', values: rawWeightOptions }] : []);

  const matchedVariant = hasStructuredAttributes
    ? (product?.variants || []).find((v: any) => {
        const attrs = v.attributes || [];
        const selectedKeys = Object.keys(selectedAttrs);
        if (attrs.length === 0 || attrs.length !== selectedKeys.length) return false;
        return attrs.every((a: any) => selectedAttrs[a.attributeName] === a.attributeValue);
      })
    : undefined;

  const selectedWeight = hasStructuredAttributes
    ? (matchedVariant ? formatVariantLabel(matchedVariant.variantName) : Object.values(selectedAttrs).join(' • '))
    : (selectedAttrs['Weight'] || (product?.weightOptions && product.weightOptions[0]) || '100g');

  const isAttrPillInStock = (groupName: string, val: string) => {
    if (!product?.variants || product.variants.length === 0) return true;

    // If currently matched variant is in-stock and this pill is part of the active selection, it's in stock
    if (matchedVariant && isVariantInStock(matchedVariant) && selectedAttrs[groupName] === val) {
      return true;
    }

    // Check variant that would result from picking this pill
    const candidate = { ...selectedAttrs, [groupName]: val };
    const candidateKeys = Object.keys(candidate);

    const directMatch = (product.variants || []).find((v: any) => {
      const attrs = v.attributes || [];
      return attrs.length === candidateKeys.length && attrs.every((a: any) => candidate[a.attributeName] === a.attributeValue);
    });
    if (directMatch) return isVariantInStock(directMatch);

    const fallbackVariant = (product.variants || []).find((v: any) => {
      const attrs = v.attributes || [];
      if (attrs.length > 0) {
        return attrs.some((a: any) => a.attributeName === groupName && a.attributeValue === val);
      }
      const label = formatVariantLabel(v.variantName);
      return label === val || v.variantName === val || v.attributeValue === val;
    });
    if (fallbackVariant) return isVariantInStock(fallbackVariant);

    return true;
  };

  // Picking a value shouldn't be able to land on a combination that was never saved as a
  // real variant. If the current picks + the new value don't match anything, snap the OTHER
  // groups to whatever a real variant that has this value actually pairs it with, instead of
  // leaving the shopper stuck on an unavailable combination.
  const handleSelectAttrValue = (groupName: string, value: string) => {
    if (!hasStructuredAttributes) {
      setSelectedAttrs((prev) => ({ ...prev, [groupName]: value }));
      return;
    }

    const candidate = { ...selectedAttrs, [groupName]: value };
    const candidateKeys = Object.keys(candidate);
    const existsAsIs = (product.variants || []).some((v: any) => {
      const attrs = v.attributes || [];
      return attrs.length === candidateKeys.length && attrs.every((a: any) => candidate[a.attributeName] === a.attributeValue);
    });
    if (existsAsIs) {
      setSelectedAttrs(candidate);
      return;
    }

    const fallbackVariant = (product.variants || []).find((v: any) =>
      (v.attributes || []).some((a: any) => a.attributeName === groupName && a.attributeValue === value)
    );
    if (fallbackVariant) {
      const snapped: Record<string, string> = {};
      (fallbackVariant.attributes || []).forEach((a: any) => { snapped[a.attributeName] = a.attributeValue; });
      setSelectedAttrs(snapped);
    } else {
      setSelectedAttrs(candidate);
    }
  };

  const [cartItems, setCartItems] = useState(CartService.getItems());

  useEffect(() => {
    if (!product) return;
    setIsWishlisted(WishlistService.isInWishlist(product.id, selectedWeight));
    const unsubWishlist = WishlistService.subscribe(() => {
      setIsWishlisted(WishlistService.isInWishlist(product.id, selectedWeight));
    });
    const unsubCart = CartService.subscribe(() => {
      setCartItems(CartService.getItems());
    });
    return () => {
      unsubWishlist();
      unsubCart();
    };
  }, [product?.id, selectedWeight]);

  const handleToast = (msg: string) => {
    showToast(msg, 'success');
  };

  const getVariantPrice = (weight: string) => {
    if (product?.variants && product.variants.length > 0) {
      if (weight) {
        const match = product.variants.find((v: any) => {
          const vName = (v.variantName || '').toLowerCase().replace(/[\s\-\>:]+/g, '');
          const vAttr = (v.attributeValue || '').toLowerCase().replace(/[\s\-\>:]+/g, '');
          const target = (weight || '').toLowerCase().replace(/[\s\-\>:]+/g, '');
          return vName === target || vAttr === target || (vName && target && vName.includes(target)) || (vAttr && target && target.includes(vAttr));
        });
        if (match) {
          return {
            price: match.price,
            originalPrice: match.originalPrice || match.price
          };
        }
      }
      const defaultVar = product.variants.find((v: any) => v.isDefault) || product.variants[0];
      if (defaultVar) {
        return {
          price: defaultVar.price,
          originalPrice: defaultVar.originalPrice || defaultVar.price
        };
      }
    }
    const p = product?.price || 199;
    const orig = product?.originalPrice || Math.round(p * 1.25);
    return {
      price: p,
      originalPrice: orig
    };
  };

  // When the API gave us real structured attributes, price comes from the exact matched
  // variant (or null if the current picks don't correspond to any saved variant). Otherwise
  // fall back to the legacy fuzzy-match/heuristic pricing for older single-attribute data.
  const currentPrices = hasStructuredAttributes
    ? (matchedVariant ? { price: matchedVariant.price, originalPrice: matchedVariant.originalPrice || matchedVariant.price } : null)
    : getVariantPrice(selectedWeight);
  const isCombinationAvailable = currentPrices !== null;
  const totalStockUnits = matchedVariant
    ? (typeof matchedVariant.sellableStock === 'number'
        ? matchedVariant.sellableStock
        : (typeof matchedVariant.stockQuantity === 'number' ? matchedVariant.stockQuantity : 99))
    : (product?.variants?.length ? 0 : 99);
  
  const cartItemId = `${product?.id}-${selectedWeight}`;
  const existingInCart = cartItems.find((i) => i.id === cartItemId)?.quantity || 0;
  const availableStockUnits = Math.max(0, totalStockUnits - existingInCart);
  const isOutOfStock = totalStockUnits <= 0;
  const isAllInCart = !isOutOfStock && availableStockUnits <= 0;
  const currentPrice = currentPrices?.price ?? 0;
  const currentOriginalPrice = currentPrices?.originalPrice ?? 0;
  const discountPercentage = currentOriginalPrice > currentPrice
    ? Math.round(((currentOriginalPrice - currentPrice) / currentOriginalPrice) * 100)
    : 13;

  const handleWishlistToggle = () => {
    if (!isCombinationAvailable) return;
    const added = WishlistService.toggleWishlist({
      id: `${product.id}-${selectedWeight}`,
      productId: product.id,
      name: product.name,
      image: selectedImage || product.image,
      price: currentPrice,
      originalPrice: currentOriginalPrice,
      weight: selectedWeight,
    });
    if (added) {
      handleToast(`Saved ${product.name} (${selectedWeight}) to Wishlist!`);
    } else {
      handleToast(`Removed ${product.name} (${selectedWeight}) from Wishlist`);
    }
  };

  const handleAddToCart = () => {
    if (!isCombinationAvailable) return;
    if (isOutOfStock) {
      showToast(`${product.name} (${selectedWeight}) is currently out of stock.`, 'error');
      return;
    }
    if (isAllInCart || quantity > availableStockUnits) {
      showToast(
        `All ${totalStockUnits} available units are already in your cart.`,
        'error'
      );
      return;
    }

    const itemId = CartService.addItem({
      productId: product.id,
      name: product.name,
      image: selectedImage || product.image,
      price: currentPrice,
      originalPrice: currentOriginalPrice,
      weight: selectedWeight,
      quantity: quantity,
    });
    if (!itemId) return; // blocked (not logged in) - CartService already showed why

    if (mainImgRef.current) {
      triggerFlyingProductAnimation(mainImgRef.current, product.id.toString());
    }

    handleToast(`Added ${quantity} x ${product.name} (${selectedWeight}) to Cart!`);
  };

  const handleBuyNow = () => {
    if (!isCombinationAvailable) return;
    if (isOutOfStock) {
      showToast(`${product.name} (${selectedWeight}) is currently out of stock.`, 'error');
      return;
    }
    if (isAllInCart || quantity > availableStockUnits) {
      showToast(
        `All ${totalStockUnits} available units are already in your cart.`,
        'error'
      );
      return;
    }

    const itemId = CartService.addItem({
      productId: product.id,
      name: product.name,
      image: selectedImage || product.image,
      price: currentPrice,
      originalPrice: currentOriginalPrice,
      weight: selectedWeight,
      quantity: quantity,
    });
    if (!itemId) return; // blocked (not logged in) - CartService already showed why
    navigateTo('/checkout');
  };

  // Frequently Bought Together Total & Add Handler
  const activeFbtItems = fbtCrossSells.filter((item) => selectedFbtIds[item.id]);
  const fbtTotalPrice = currentPrice + activeFbtItems.reduce((sum, item) => sum + item.price, 0);
  const fbtTotalOriginalPrice = currentOriginalPrice + activeFbtItems.reduce((sum, item) => sum + item.originalPrice, 0);
  const fbtTotalSavings = fbtTotalOriginalPrice > fbtTotalPrice ? fbtTotalOriginalPrice - fbtTotalPrice : 0;

  const handleAddFbtBundleToCart = () => {
    // 1. Add current main product
    CartService.addItem({
      productId: product.id,
      name: product.name,
      image: selectedImage || product.image,
      price: currentPrice,
      originalPrice: currentOriginalPrice,
      weight: selectedWeight,
      quantity: 1,
    });

    // 2. Add all selected cross-sell items
    activeFbtItems.forEach((crossItem) => {
      CartService.addItem({
        productId: crossItem.id,
        name: crossItem.name,
        image: crossItem.image,
        price: crossItem.price,
        originalPrice: crossItem.originalPrice,
        weight: crossItem.weight,
        quantity: 1,
      });
    });

    if (mainImgRef.current) {
      triggerFlyingProductAnimation(mainImgRef.current, product.id.toString());
    }

    showToast(`Added ${1 + activeFbtItems.length} items to your cart!`, 'success');
  };

  return (
    <div className="hiyaghar-product-detail-layout">
      {!isLoadingProduct && product && !productNotFound ? (
        <SEO
          title={`${product.name} | HIYAGHAR`}
          description={product.seoDescription || buildProductSeoDescription(product.name, undefined)}
          path={`/product/${productId}`}
          image={product.seoImage || product.image}
          type="product"
          noindex={!isNumericId}
        />
      ) : !isLoadingProduct ? (
        <SEO
          title={seoConfig.productNotFound.title}
          description={seoConfig.productNotFound.description}
          path={`/product/${productId}`}
          noindex
        />
      ) : null}
      <Header />

      <main id="main-content" tabIndex={-1} className="hiyaghar-product-detail-main">
        {isLoadingProduct ? (
          <div className="hiyaghar-container">
            <div className="hiyaghar-detail-hero-grid">
              <div className="hiyaghar-detail-gallery-col">
                <div className="hiyaghar-detail-skeleton-img" aria-hidden="true" />
              </div>
              <div className="hiyaghar-detail-info-col">
                <div className="hiyaghar-detail-skeleton-line hiyaghar-w-30" aria-hidden="true" />
                <div className="hiyaghar-detail-skeleton-line hiyaghar-w-70 hiyaghar-h-lg" aria-hidden="true" />
                <div className="hiyaghar-detail-skeleton-line hiyaghar-w-40" aria-hidden="true" />
                <div className="hiyaghar-detail-skeleton-line hiyaghar-w-25 hiyaghar-h-lg" aria-hidden="true" />
                <div className="hiyaghar-detail-skeleton-line hiyaghar-w-90" aria-hidden="true" />
                <div className="hiyaghar-detail-skeleton-line hiyaghar-w-60" aria-hidden="true" />
                <div className="hiyaghar-detail-skeleton-block" aria-hidden="true" />
              </div>
            </div>
          </div>
        ) : productNotFound || !product ? (
          <div className="hiyaghar-container" style={{ padding: '80px 24px', textAlign: 'center' }}>
            <div className="hiyaghar-no-page-card" style={{ maxWidth: '520px', margin: '0 auto', padding: '40px 32px', background: '#ffffff', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(111, 0, 36, 0.08)', color: 'var(--hiya-primary, #6F0024)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#11223A', marginBottom: '12px' }}>Product Not Found</h1>
              <p style={{ fontSize: '15px', color: '#64748B', lineHeight: '1.6', marginBottom: '28px' }}>
                The product you are looking for might have been removed, had its name changed, or is temporarily unavailable.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <a
                  href="/mukhwas"
                  onClick={(e) => { e.preventDefault(); onNavigateMukhwas(); }}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '12px 24px', borderRadius: '999px', background: 'var(--hiya-primary, #6F0024)', color: '#ffffff', fontWeight: '700', textDecoration: 'none' }}
                >
                  Browse Mukhwas
                </a>
                <a
                  href="/"
                  onClick={(e) => { e.preventDefault(); onNavigateHome(); }}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '12px 24px', borderRadius: '999px', background: '#f1f5f9', color: '#1e293b', fontWeight: '700', textDecoration: 'none' }}
                >
                  Return Home
                </a>
              </div>
            </div>
          </div>
        ) : (
        <div className="hiyaghar-container">
          {/* Breadcrumbs */}
          <nav className="hiyaghar-detail-breadcrumb" aria-label="Breadcrumb navigation">
            <ul className="hiyaghar-detail-breadcrumb-list">
              <li>
                <a href="/" onClick={(e) => { e.preventDefault(); onNavigateHome(); }}>Home</a>
              </li>
              <li className="sep">/</li>
              <li>
                {(() => {
                  const catName = product.categoryLabel || 'Mukhwas';
                  const catLower = catName.toLowerCase();
                  let catPath = '/mukhwas';
                  if (catLower.includes('soap')) catPath = '/handmade-soap';
                  else if (catLower.includes('tea') || catLower.includes('masala')) catPath = '/tea-masala';
                  else if (catLower.includes('hair') || catLower.includes('oil')) catPath = '/hair-oil';
                  else if (catLower.includes('hamper') || catLower.includes('gift')) catPath = '/gift-hampers';

                  return (
                    <a
                      href={catPath}
                      onClick={(e) => {
                        e.preventDefault();
                        navigateTo(catPath);
                      }}
                    >
                      {catName}
                    </a>
                  );
                })()}
              </li>
              <li className="sep">/</li>
              <li className="current">{product.name}</li>
            </ul>
          </nav>

          {/* Hero Two-Column Container */}
          <div className="hiyaghar-detail-hero-grid">
            {/* Gallery Column */}
            <div className="hiyaghar-detail-gallery-col">
              <div className="hiyaghar-detail-main-img-card">
                {product.badge && (
                  <span className="hiyaghar-detail-badge">{product.badge}</span>
                )}
                <button
                  type="button"
                  className={`hiyaghar-detail-image-wishlist-btn ${isWishlisted ? 'is-active' : ''}`}
                  onClick={handleWishlistToggle}
                  title={isWishlisted ? 'Remove from Wishlist' : 'Save to Wishlist'}
                  aria-label={isWishlisted ? 'Remove from Wishlist' : 'Save to Wishlist'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={isWishlisted ? '#ef4444' : 'none'} stroke={isWishlisted ? '#ef4444' : 'currentColor'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
                <img
                  ref={mainImgRef}
                  src={selectedImage || product.image}
                  alt={product.name}
                  className="hiyaghar-detail-main-img"
                />
              </div>

              {galleryImages.length > 1 && (
                <div className="hiyaghar-detail-thumbnails-row">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`hiyaghar-thumbnail-btn ${selectedImage === img ? 'is-active' : ''}`}
                      onClick={() => setSelectedImage(img)}
                    >
                      <img src={img} alt={`${product.name} view ${idx + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info Column */}
            <div className="hiyaghar-detail-info-col">
              <span className="hiyaghar-detail-cat">{product.categoryLabel || 'Natural Product'}</span>
              <h1 className="hiyaghar-detail-title">{product.name}</h1>

              {/* Price Box */}

              <div className="hiyaghar-detail-price-box">
                <span className="hiyaghar-detail-price">
                  ₹<AnimatedNumber value={currentPrice} />
                </span>
                {currentOriginalPrice > currentPrice && (
                  <>
                    <span className="hiyaghar-detail-original-price">
                      ₹{currentOriginalPrice}
                    </span>
                    <span className="hiyaghar-detail-discount-tag">
                      {discountPercentage}% OFF
                    </span>
                  </>
                )}
                <div className="hiyaghar-tax-note">(Inclusive of all taxes)</div>
              </div>

              <p className="hiyaghar-detail-lead">{product.shortDescription}</p>

              {/* Attribute Selector - one labeled row per attribute (Weight, Packing, ...), alphabetical, all on one line */}
              {attributeGroups.length > 0 && (
                <div className="hiyaghar-detail-option-group">
                  {attributeGroups.map((group) => (
                    <div key={group.name} className="hiyaghar-attr-group-row">
                      <span className="hiyaghar-attr-group-label">{group.name}:</span>
                      {group.values.map((val) => {
                        const inStock = isAttrPillInStock(group.name, val);
                        return (
                          <button
                            type="button"
                            key={val}
                            className={`hiyaghar-attr-pill ${selectedAttrs[group.name] === val ? 'is-selected' : ''} ${!inStock ? 'is-pill-out-of-stock' : ''}`}
                            onClick={() => handleSelectAttrValue(group.name, val)}
                            title={!inStock ? `${val} is out of stock` : undefined}
                          >
                            <span>{val}</span>
                            {!inStock && <span className="hiyaghar-pill-stock-tag"> (Out of Stock)</span>}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                  {!isCombinationAvailable && (
                    <div style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: 700 }}>
                      This combination isn't available.
                    </div>
                  )}
                  {isCombinationAvailable && isOutOfStock && (
                    <div className="hiyaghar-stock-status-box is-out-of-stock">
                      <span className="stock-dot"></span>
                      <span>Currently Out of Stock</span>
                    </div>
                  )}
                  {isCombinationAvailable && isAllInCart && (
                    <div className="hiyaghar-stock-status-box is-out-of-stock">
                      <span className="stock-dot"></span>
                      <span>All available stock ({totalStockUnits}) is in your Cart</span>
                    </div>
                  )}
                  {isCombinationAvailable && !isOutOfStock && !isAllInCart && availableStockUnits > 0 && availableStockUnits <= 10 && (
                    <div className="hiyaghar-stock-status-box is-low-stock">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>
                        {Math.max(0, availableStockUnits - quantity) > 0 ? (
                          <>Hurry! Only <strong>{Math.max(0, availableStockUnits - quantity)}</strong> left in stock!</>
                        ) : (
                          <>Maximum available stock (<strong>{availableStockUnits}</strong>) selected!</>
                        )}
                      </span>
                    </div>
                  )}
                  {isCombinationAvailable && !isOutOfStock && !isAllInCart && availableStockUnits > 10 && (
                    <div className="hiyaghar-stock-status-box is-in-stock">
                      <span className="stock-dot in-stock"></span>
                      <span>In Stock</span>
                    </div>
                  )}
                </div>
              )}

              {/* Quantity Stepper */}
              <div className="hiyaghar-detail-option-group">
                <label className="hiyaghar-option-label">Quantity:</label>
                <div className="hiyaghar-qty-stepper">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || isOutOfStock || isAllInCart}
                    title={quantity <= 1 ? 'Minimum quantity is 1' : 'Decrease quantity'}
                  >
                    -
                  </button>
                  <span className="qty-val">{quantity}</span>
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => setQuantity((q) => Math.min(Math.max(1, availableStockUnits), q + 1))}
                    disabled={isOutOfStock || isAllInCart || quantity >= availableStockUnits}
                    title={availableStockUnits <= 0 ? 'No more units available' : quantity >= availableStockUnits ? `Only ${availableStockUnits} more available` : 'Increase quantity'}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              {/* Exactly one state: a single disabled "Out of Stock" button, or Add to Cart + Buy Now */}
              <div className="hiyaghar-detail-actions-row">
                {isOutOfStock ? (
                  <button
                    type="button"
                    className="hiyaghar-detail-btn-cart"
                    disabled
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    Out of Stock
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="hiyaghar-detail-btn-cart"
                      onClick={handleAddToCart}
                      disabled={!isCombinationAvailable || isAllInCart}
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                      </svg>
                      {isAllInCart ? 'In Cart (Max Limit)' : 'Add to Cart'}
                    </button>

                    <button
                      type="button"
                      className="hiyaghar-detail-btn-buy"
                      onClick={handleBuyNow}
                      disabled={!isCombinationAvailable}
                    >
                      Buy Now
                    </button>
                  </>
                )}
              </div>

              {/* Trust Micro Badges */}
              <div className="hiyaghar-detail-trust-pills">
                <div className="trust-pill">
                  <span className="icon" style={{ color: '#16a34a', display: 'flex', alignItems: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
                      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
                    </svg>
                  </span>
                  <span>100% Natural</span>
                </div>
                {(() => {
                  const catL = (product.categoryLabel || '').toLowerCase();
                  const isSoap = catL.includes('soap');
                  const isOil = catL.includes('oil');
                  return (
                    <div className="trust-pill">
                      <span className="icon" style={{ color: '#d97706', display: 'flex', alignItems: 'center' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                      </span>
                      <span>{isSoap ? 'Gentle On Skin' : isOil ? 'Root Nourishing' : 'Airtight Moisture Seal'}</span>
                    </div>
                  );
                })()}
                <div className="trust-pill">
                  <span className="icon" style={{ color: '#2563eb', display: 'flex', alignItems: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="3" width="15" height="13"></rect>
                      <polygon points="16 8 20 8 23 11 23 16 16 16 8"></polygon>
                      <circle cx="5.5" cy="18.5" r="2.5"></circle>
                      <circle cx="18.5" cy="18.5" r="2.5"></circle>
                    </svg>
                  </span>
                  <span>{isOutOfStock ? 'Made in Small Batches' : 'Dispatched in 24 Hrs'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Frequently Bought Together / Cross-Sell Bundle Section */}
          {/* The bundle always includes this item, so hide it (and its "Add N Items to Cart") when out of stock */}
          {fbtCrossSells.length > 0 && !isOutOfStock && (
            <section className="hiyaghar-fbt-section" aria-label="Frequently Bought Together">
              <div className="hiyaghar-fbt-header">
                <span className="hiyaghar-fbt-badge">Curated Bundle & Save</span>
                <h2 className="hiyaghar-fbt-title">Frequently Bought Together</h2>
              </div>

              <div className="hiyaghar-fbt-grid">
                {/* Bundle Items Cards */}
                <div className="hiyaghar-fbt-items-row">
                  {/* Main Product */}
                  <div className="hiyaghar-fbt-item-card is-active">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled={true}
                      className="hiyaghar-fbt-item-checkbox"
                      aria-label={product.name}
                    />
                    <img
                      src={selectedImage || product.image}
                      alt={product.name}
                      className="hiyaghar-fbt-item-img"
                    />
                    <div className="hiyaghar-fbt-item-details">
                      <span className="hiyaghar-fbt-item-name" title={product.name}>
                        {product.name}
                      </span>
                      <span className="hiyaghar-fbt-item-sub">This Item ({selectedWeight})</span>
                      <div className="hiyaghar-fbt-item-price-wrap">
                        <span className="hiyaghar-fbt-item-price">₹{currentPrice}</span>
                        {currentOriginalPrice > currentPrice && (
                          <span className="hiyaghar-fbt-item-orig-price">₹{currentOriginalPrice}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {fbtCrossSells.map((crossItem) => {
                    const isSelected = !!selectedFbtIds[crossItem.id];
                    return (
                      <React.Fragment key={crossItem.id}>
                        <div className="hiyaghar-fbt-plus-sign">+</div>
                        <div
                          className={`hiyaghar-fbt-item-card ${isSelected ? 'is-active' : ''}`}
                          onClick={() => {
                            setSelectedFbtIds((prev) => ({
                              ...prev,
                              [crossItem.id]: !prev[crossItem.id],
                            }));
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              setSelectedFbtIds((prev) => ({
                                ...prev,
                                [crossItem.id]: e.target.checked,
                              }));
                            }}
                            className="hiyaghar-fbt-item-checkbox"
                            aria-label={crossItem.name}
                          />
                          <img
                            src={crossItem.image}
                            alt={crossItem.name}
                            className="hiyaghar-fbt-item-img"
                          />
                          <div className="hiyaghar-fbt-item-details">
                            <span className="hiyaghar-fbt-item-name" title={crossItem.name}>
                              {crossItem.name}
                            </span>
                            <span className="hiyaghar-fbt-item-sub">{crossItem.weight}</span>
                            <div className="hiyaghar-fbt-item-price-wrap">
                              <span className="hiyaghar-fbt-item-price">₹{crossItem.price}</span>
                              {crossItem.originalPrice > crossItem.price && (
                                <span className="hiyaghar-fbt-item-orig-price">
                                  ₹{crossItem.originalPrice}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Bundle Summary & CTA Box */}
                <div className="hiyaghar-fbt-summary-card">
                  <span className="hiyaghar-fbt-summary-label">
                    Bundle Total ({1 + activeFbtItems.length} Products):
                  </span>
                  <div className="hiyaghar-fbt-summary-pricing">
                    <span className="hiyaghar-fbt-summary-total">₹{fbtTotalPrice}</span>
                    {fbtTotalOriginalPrice > fbtTotalPrice && (
                      <span className="hiyaghar-fbt-summary-orig">₹{fbtTotalOriginalPrice}</span>
                    )}
                  </div>
                  {fbtTotalSavings > 0 && (
                    <span className="hiyaghar-fbt-summary-save">
                      Save ₹{fbtTotalSavings} with this bundle
                    </span>
                  )}
                  <button
                    type="button"
                    className="hiyaghar-fbt-add-btn"
                    onClick={handleAddFbtBundleToCart}
                    disabled={!isCombinationAvailable || isOutOfStock || isAllInCart}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="21" r="1"></circle>
                      <circle cx="20" cy="21" r="1"></circle>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    Add {1 + activeFbtItems.length} Items to Cart
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Description & Details Tabs Section */}
          <div className="hiyaghar-detail-tabs-container">
            <div className="hiyaghar-detail-tabs-header">
              <button
                type="button"
                className={`hiyaghar-tab-btn ${activeTab === 'description' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('description')}
              >
                Product Description
              </button>
              {product.ingredients && product.ingredients.length > 0 && (
                <button
                  type="button"
                  className={`hiyaghar-tab-btn ${activeTab === 'ingredients' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('ingredients')}
                >
                  Ingredients & Benefits
                </button>
              )}
              {product.nutritionalInfo && (
                <button
                  type="button"
                  className={`hiyaghar-tab-btn ${activeTab === 'nutrition' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('nutrition')}
                >
                  Nutritional Facts
                </button>
              )}
              <button
                type="button"
                className={`hiyaghar-tab-btn ${activeTab === 'reviews' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('reviews')}
              >
                Reviews
              </button>
            </div>

            <div className="hiyaghar-detail-tab-content">
              {activeTab === 'description' && (
                <div>
                  <p className="hiyaghar-tab-paragraph">
                    {product.longDescription || product.shortDescription}
                  </p>

                  <div className="hiyaghar-highlights-grid">
                    <div className="highlight-item">
                      <strong>Authentic Craftsmanship</strong>
                      <p>Handcrafted using traditional Kathiawadi & Ayurvedic methodologies.</p>
                    </div>

                    <div className="highlight-item">
                      <strong>Zero Artificial Additives</strong>
                      <p>Free from artificial colors, chemical preservatives, or synthetic flavors.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ingredients' && product.ingredients && (
                <div>
                  <h4 className="pane-subheading">Key Ingredients:</h4>
                  <div className="ingredients-pills-list" style={{ marginBottom: '24px' }}>
                    {product.ingredients?.map((ing: string, i: number) => (
                      <span key={i} className="ing-pill">{ing}</span>
                    ))}
                  </div>

                  {product.benefits && product.benefits.length > 0 && (
                    <>
                      <h4 className="pane-subheading">Health & Wellness Benefits:</h4>
                      <ul className="benefits-checklist">
                        {product.benefits?.map((b: string, i: number) => (
                          <li key={i}>
                            <span className="check-icon">✓</span> {b}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'nutrition' && product.nutritionalInfo && (
                <div>
                  <h4 className="pane-subheading">
                    Nutritional Values (per {selectedAttrs.Weight || product.servingSize || '100g'} serving):
                  </h4>
                  <table className="hiyaghar-nutrition-table">
                    <tbody>
                      {Object.entries(product.nutritionalInfo).map(([nutrientName, nutrientValue]) => (
                        <tr key={nutrientName}>
                          <td><strong>{nutrientName}</strong></td>
                          <td>{String(nutrientValue ?? '')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'reviews' && (
                <ProductReviews productId={product.id} />
              )}
            </div>
          </div>
        </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
