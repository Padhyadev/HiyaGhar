import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { Home } from './pages/Home/Home';
import { ChunkErrorBoundary } from './components/common/ChunkErrorBoundary';
import { RouteLoader } from './components/common/RouteLoader';
import { AdminLayout } from './components/admin/AdminLayout';
import { RequireAdminAuth } from './components/admin/RequireAdminAuth';
import { PermissionGuard } from './components/common/PermissionGuard';
import { PermissionProvider } from './context/PermissionContext';
import { CustomerAuthService } from './services/customerAuthService';
import { AdminAuthService } from './services/adminAuthService';
import { showToast } from './utils/alertService';
import { Preloader } from './components/common/Preloader/Preloader';
import { PageTransition } from './components/common/PageTransition/PageTransition';
import { FloatingWidgets } from './components/common/FloatingWidgets/FloatingWidgets';
import { preloadCriticalImages } from './services/imagePreloaderService';
import { SEO } from './components/common/SEO/SEO';
import { findRouteMeta, type RouteMeta } from './seo/routeSeo';

// ─── Lazy-loaded storefront pages ──────────────────────────────────────────
const CustomizeComboPage = lazy(() => import('./pages/CustomizeCombo/CustomizeComboPage').then(m => ({ default: m.CustomizeComboPage })));
const MukhwasPage = lazy(() => import('./pages/Mukhwas/MukhwasPage').then(m => ({ default: m.MukhwasPage })));
const ProductDetailPage = lazy(() => import('./pages/ProductDetail/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const CartPage = lazy(() => import('./pages/Cart/CartPage').then(m => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('./pages/Checkout/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmation/OrderConfirmationPage').then(m => ({ default: m.OrderConfirmationPage })));
const TrackOrderPage = lazy(() => import('./pages/TrackOrder/TrackOrderPage').then(m => ({ default: m.TrackOrderPage })));
const ProfilePage = lazy(() => import('./pages/Profile/ProfilePage').then(m => ({ default: m.ProfilePage })));
const WishlistPage = lazy(() => import('./pages/Wishlist/WishlistPage').then(m => ({ default: m.WishlistPage })));
const AuthPage = lazy(() => import('./pages/Auth/AuthPage').then(m => ({ default: m.AuthPage })));
const TeaMasalaPage = lazy(() => import('./pages/TeaMasala/TeaMasalaPage').then(m => ({ default: m.TeaMasalaPage })));
const HandmadeSoapPage = lazy(() => import('./pages/HandmadeSoap/HandmadeSoapPage').then(m => ({ default: m.HandmadeSoapPage })));
const HairOilPage = lazy(() => import('./pages/HairOil/HairOilPage').then(m => ({ default: m.HairOilPage })));
const GiftHampersPage = lazy(() => import('./pages/GiftHampers/GiftHampersPage').then(m => ({ default: m.GiftHampersPage })));
const OurStoryPage = lazy(() => import('./pages/OurStory/OurStoryPage').then(m => ({ default: m.OurStoryPage })));
const ContactUsPage = lazy(() => import('./pages/ContactUs/ContactUsPage').then(m => ({ default: m.ContactUsPage })));
const FaqPage = lazy(() => import('./pages/Faq/FaqPage').then(m => ({ default: m.FaqPage })));
const NotFoundPage = lazy(() => import('./pages/NotFound/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

// Legal pages (one chunk for all 4 — named exports from LegalPages.tsx)
const PrivacyPolicyPage = lazy(() => import('./pages/Legal/LegalPages').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsConditionsPage = lazy(() => import('./pages/Legal/LegalPages').then(m => ({ default: m.TermsConditionsPage })));
const RefundPolicyPage = lazy(() => import('./pages/Legal/LegalPages').then(m => ({ default: m.RefundPolicyPage })));
const ShippingPolicyPage = lazy(() => import('./pages/Legal/LegalPages').then(m => ({ default: m.ShippingPolicyPage })));

// ─── Lazy-loaded admin pages ────────────────────────────────────────────────
const RoleManagementPage = lazy(() => import('./pages/Admin/RoleManagementPage').then(m => ({ default: m.RoleManagementPage })));
const UserManagementPage = lazy(() => import('./pages/Admin/UserManagementPage').then(m => ({ default: m.UserManagementPage })));
const MenuManagementPage = lazy(() => import('./pages/Admin/MenuManagementPage').then(m => ({ default: m.MenuManagementPage })));
const CategoryManagementPage = lazy(() => import('./pages/Admin/CategoryManagementPage').then(m => ({ default: m.CategoryManagementPage })));
const ProductManagementPage = lazy(() => import('./pages/Admin/ProductManagementPage').then(m => ({ default: m.ProductManagementPage })));
const CustomerManagementPage = lazy(() => import('./pages/Admin/CustomerManagementPage').then(m => ({ default: m.CustomerManagementPage })));
const AttributeManagementPage = lazy(() => import('./pages/Admin/AttributeManagementPage').then(m => ({ default: m.AttributeManagementPage })));
const AdminDashboardPage = lazy(() => import('./pages/Admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const HomePageComponentManagementPage = lazy(() => import('./pages/Admin/HomePageComponentManagementPage').then(m => ({ default: m.HomePageComponentManagementPage })));
const GiftHamperManagementPage = lazy(() => import('./pages/Admin/GiftHamperManagementPage').then(m => ({ default: m.GiftHamperManagementPage })));
const ReviewManagementPage = lazy(() => import('./pages/Admin/ReviewManagementPage').then(m => ({ default: m.ReviewManagementPage })));
const ContactQueryManagementPage = lazy(() => import('./pages/Admin/ContactQueryManagementPage').then(m => ({ default: m.ContactQueryManagementPage })));
const FaqManagementPage = lazy(() => import('./pages/Admin/FaqManagementPage').then(m => ({ default: m.FaqManagementPage })));
const StockModulePage = lazy(() => import('./pages/Admin/StockModulePage').then(m => ({ default: m.StockModulePage })));
const RewardModulePage = lazy(() => import('./pages/Admin/RewardModulePage').then(m => ({ default: m.RewardModulePage })));
const OrderManagementPage = lazy(() => import('./pages/Admin/OrderManagementPage').then(m => ({ default: m.OrderManagementPage })));
const ShippingSettingsPage = lazy(() => import('./pages/Admin/ShippingSettingsPage').then(m => ({ default: m.ShippingSettingsPage })));
const ComboPackManagementPage = lazy(() => import('./pages/Admin/ComboPackManagementPage').then(m => ({ default: m.ComboPackManagementPage })));
const CouponManagementPage = lazy(() => import('./pages/Admin/CouponManagementPage').then(m => ({ default: m.CouponManagementPage })));
const LovManagementPage = lazy(() => import('./pages/Admin/LovManagementPage').then(m => ({ default: m.LovManagementPage })));
const GenericModulePage = lazy(() => import('./pages/Admin/GenericModulePage').then(m => ({ default: m.GenericModulePage })));
const AccessDeniedPage = lazy(() => import('./pages/Admin/AccessDeniedPage').then(m => ({ default: m.AccessDeniedPage })));

// ─── Helpers ────────────────────────────────────────────────────────────────

function getNormalizedRoute(): string {
  const hash = window.location.hash;
  const path = window.location.pathname;

  let current = path || '/';

  // If hash is a SPA route (e.g. #/mukhwas), use it; if it's an in-page anchor (#bestsellers-section), do not treat as a route path
  if (hash && hash.startsWith('#/')) {
    let clean = hash.replace(/^#\/?/, '/');
    if (!clean.startsWith('/')) clean = '/' + clean;
    current = clean;
  }

  // Strip query string and in-page anchor if present
  if (current.includes('?')) {
    current = current.split('?')[0];
  }
  if (current.includes('#')) {
    current = current.split('#')[0];
  }

  // Normalise trailing slash (e.g. /mukhwas/ -> /mukhwas, /combos/ -> /combos)
  if (current.length > 1 && current.endsWith('/')) {
    current = current.replace(/\/+$/, '');
  }

  return current || '/';
}

const ACCOUNT_TABS = ['profile', 'orders', 'addresses', 'password', 'account', 'rewards', 'reward', 'coins'];

function isAccountRoute(route: string): boolean {
  return (
    ACCOUNT_TABS.includes(route.replace(/^\//, '')) ||
    route.startsWith('/profile') ||
    route.startsWith('/orders') ||
    route.startsWith('/rewards') ||
    route.startsWith('/reward')
  );
}

// Old alias URLs -> canonical path. The server answers these with a 301; this covers client-side navigation.
const ROUTE_ALIASES: Record<string, string> = {
  '/combo': '/combos',
  '/customize-combo': '/combos',
  '/ourstory': '/our-story',
  '/about': '/our-story',
  '/about-us': '/our-story',
  '/gifting': '/gift-hampers',
  '/home-made-soap': '/handmade-soap',
  '/hand-made-soap': '/handmade-soap',
  '/soap': '/handmade-soap',
  '/hair-oils': '/hair-oil',
  '/hairoil': '/hair-oil',
  '/privacy': '/privacy-policy',
  '/terms': '/terms-conditions',
  '/terms-and-conditions': '/terms-conditions',
  '/refund': '/refund-policy',
  '/cancellation': '/refund-policy',
  '/shipping': '/shipping-policy',
  '/contact': '/contact-us',
  '/faqs': '/faq',
};

// Per-route meta comes from public/seo/routes.json (shared with the server). Returns null for
// /product/* (the product page sets its own) and for unknown routes (NotFoundPage sets its own).
// Account tab routes not listed individually reuse the /account entry.
function getRouteMeta(route: string): RouteMeta | null {
  const lower = route.toLowerCase().split('?')[0];
  return findRouteMeta(lower, isAccountRoute(lower) ? '/account' : undefined);
}

// Prefetch a lazy chunk on hover/focus without triggering a download of images.
function prefetchChunk(importFn: () => Promise<unknown>) {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => { importFn(); }, { timeout: 2000 });
  } else {
    setTimeout(() => { importFn(); }, 200);
  }
}

function App() {
  const [currentRoute, setCurrentRoute] = useState<string>(getNormalizedRoute());

  useEffect(() => {
    preloadCriticalImages();

    const handleLocationChange = () => {
      setCurrentRoute(getNormalizedRoute());
      window.scrollTo(0, 0);
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // The server-injected JSON-LD describes the URL that was loaded; keep it for that page
  // (crawlers read it after rendering) and drop it on the first in-app navigation.
  const initialRouteRef = useRef(currentRoute);
  useEffect(() => {
    if (currentRoute === initialRouteRef.current) return;
    document.querySelectorAll('script[type="application/ld+json"][data-server-seo]').forEach((el) => el.remove());
  }, [currentRoute]);

  // Client-side fallback for the server's 301s: replace an alias URL with its canonical path.
  useEffect(() => {
    const target = ROUTE_ALIASES[currentRoute.toLowerCase().split('?')[0]];
    if (!target) return;
    window.history.replaceState(null, '', target + window.location.search);
    setCurrentRoute(target);
  }, [currentRoute]);

  // Signed-out visitors on an account route are sent to the sign-in route, returning here after login.
  useEffect(() => {
    const lower = currentRoute.toLowerCase();
    // The pathname check also skips a repeat run (StrictMode) after the URL was already replaced.
    if (!isAccountRoute(lower) || !isAccountRoute(window.location.pathname.toLowerCase()) || CustomerAuthService.isLoggedIn()) return;
    const returnTo = window.location.pathname + window.location.hash;
    window.history.replaceState(null, '', `/login?redirect=${encodeURIComponent(returnTo)}`);
    // Re-runs the popstate handler so the route state and page title/meta follow the new URL.
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, [currentRoute]);

  const navigateTo = (target: string) => {
    let clean = target;
    if (clean.startsWith('#')) {
      clean = '/' + clean.replace(/^#\/?/, '');
    }
    if (!clean.startsWith('/')) {
      clean = '/' + clean;
    }
    window.history.pushState(null, '', clean);
    setCurrentRoute(clean);
    window.scrollTo(0, 0);
  };

  const handleNavigateHome = () => { navigateTo('/'); };
  const handleNavigateMukhwas = () => { navigateTo('/mukhwas'); };
  const handleNavigateToDetail = (productId: string) => { navigateTo(`/product/${productId}`); };
  const handleNavigateCart = () => { navigateTo('/cart'); };
  const handleNavigateCheckout = () => { navigateTo('/checkout'); };
  const handleNavigateConfirmation = (orderId: string) => { navigateTo(`/order-confirmation?orderId=${orderId}`); };
  const handleNavigateTrackOrder = (orderId?: string) => {
    navigateTo(orderId ? `/track-order?orderId=${orderId}` : '/track-order');
  };

  const handleAdminLogout = () => {
    AdminAuthService.logout();
    showToast('Logout successfully', 'info');
    navigateTo('/admin/login');
  };

  const renderRouteContent = () => {
    const route = currentRoute.toLowerCase();

    // ADMIN PANEL ROUTING
    if (
      route === '/admin' ||
      route === '/admin/' ||
      route === '/admin/login'
    ) {
      return (
        <RequireAdminAuth onLoginSuccess={() => navigateTo('/admin/dashboard')} onNavigateHome={handleNavigateHome}>
          <AdminLayout currentHash="/admin/dashboard" onNavigate={navigateTo} onLogout={handleAdminLogout}>
            <AdminDashboardPage onNavigate={navigateTo} />
          </AdminLayout>
        </RequireAdminAuth>
      );
    }

    if (route.startsWith('/admin/')) {
      let adminChild = <AdminDashboardPage onNavigate={navigateTo} />;

      if (route.includes('roles') || route.includes('users-roles') || route.includes('security')) {
        adminChild = (
          <PermissionGuard
            menuKey="ROLE"
            action="canView"
            fallback={
              <AccessDeniedPage
                moduleName="Role & Permission Security"
                onNavigateDashboard={() => navigateTo('/admin/dashboard')}
                onNavigateHome={handleNavigateHome}
              />
            }
          >
            <RoleManagementPage onNavigateHome={handleNavigateHome} />
          </PermissionGuard>
        );
      } else if (route.includes('users')) {
        adminChild = (
          <PermissionGuard
            menuKey="USER"
            action="canView"
            fallback={
              <AccessDeniedPage
                moduleName="User Management"
                onNavigateDashboard={() => navigateTo('/admin/dashboard')}
                onNavigateHome={handleNavigateHome}
              />
            }
          >
            <UserManagementPage />
          </PermissionGuard>
        );
      } else if (route.includes('menus')) {
        adminChild = (
          <PermissionGuard
            menuKey="MENU"
            action="canView"
            fallback={
              <AccessDeniedPage
                moduleName="Menu Registry"
                onNavigateDashboard={() => navigateTo('/admin/dashboard')}
                onNavigateHome={handleNavigateHome}
              />
            }
          >
            <MenuManagementPage />
          </PermissionGuard>
        );
      } else if (route.includes('categories')) {
        adminChild = (
          <PermissionGuard
            menuKey="CATEGORY"
            action="canView"
            fallback={
              <AccessDeniedPage
                moduleName="Store Categories"
                onNavigateDashboard={() => navigateTo('/admin/dashboard')}
                onNavigateHome={handleNavigateHome}
              />
            }
          >
            <CategoryManagementPage />
          </PermissionGuard>
        );
      } else if (route.includes('products')) {
        adminChild = (
          <PermissionGuard
            menuKey="PRODUCT"
            action="canView"
            fallback={
              <AccessDeniedPage
                moduleName="Products Catalog"
                onNavigateDashboard={() => navigateTo('/admin/dashboard')}
                onNavigateHome={handleNavigateHome}
              />
            }
          >
            <ProductManagementPage />
          </PermissionGuard>
        );
      } else if (route.includes('customers')) {
        adminChild = (
          <PermissionGuard
            menuKey="CUSTOMER"
            action="canView"
            fallback={
              <AccessDeniedPage
                moduleName="Customer Accounts"
                onNavigateDashboard={() => navigateTo('/admin/dashboard')}
                onNavigateHome={handleNavigateHome}
              />
            }
          >
            <CustomerManagementPage />
          </PermissionGuard>
        );
      } else if (route.includes('attributes')) {
        adminChild = (
          <PermissionGuard
            menuKey="ATTRIBUTE"
            action="canView"
            fallback={
              <AccessDeniedPage
                moduleName="Attribute Masters"
                onNavigateDashboard={() => navigateTo('/admin/dashboard')}
                onNavigateHome={handleNavigateHome}
              />
            }
          >
            <AttributeManagementPage />
          </PermissionGuard>
        );
      } else if (route.includes('homepage') || route.includes('home-page') || route.includes('homepagecomponent')) {
        adminChild = (
          <PermissionGuard
            menuKey="HOMEPAGECOMPONENT"
            action="canView"
            fallback={
              <AccessDeniedPage
                moduleName="Home Page Components"
                onNavigateDashboard={() => navigateTo('/admin/dashboard')}
                onNavigateHome={handleNavigateHome}
              />
            }
          >
            <HomePageComponentManagementPage />
          </PermissionGuard>
        );
      } else if (route.includes('gift-hamper')) {
        adminChild = (
          <PermissionGuard
            menuKey="GIFTHAMPER"
            action="canView"
            fallback={
              <AccessDeniedPage
                moduleName="Gift Hampers"
                onNavigateDashboard={() => navigateTo('/admin/dashboard')}
                onNavigateHome={handleNavigateHome}
              />
            }
          >
            <GiftHamperManagementPage />
          </PermissionGuard>
        );
      } else if (route.includes('stock')) {
        adminChild = (
          <PermissionGuard
            menuKey="STOCK"
            action="canView"
            fallback={
              <AccessDeniedPage
                moduleName="Stock Management"
                onNavigateDashboard={() => navigateTo('/admin/dashboard')}
                onNavigateHome={handleNavigateHome}
              />
            }
          >
            <StockModulePage />
          </PermissionGuard>
        );
      } else if (route.includes('reward')) {
        adminChild = (
          <PermissionGuard
            menuKey="REWARD"
            action="canView"
            fallback={
              <AccessDeniedPage
                moduleName="Reward Coins"
                onNavigateDashboard={() => navigateTo('/admin/dashboard')}
                onNavigateHome={handleNavigateHome}
              />
            }
          >
            <RewardModulePage />
          </PermissionGuard>
        );
      } else if (route.includes('review')) {
        adminChild = (
          <PermissionGuard
            menuKey="REVIEW"
            action="canView"
            fallback={
              <AccessDeniedPage
                moduleName="Reviews"
                onNavigateDashboard={() => navigateTo('/admin/dashboard')}
                onNavigateHome={handleNavigateHome}
              />
            }
          >
            <ReviewManagementPage />
          </PermissionGuard>
        );
      } else if (route.includes('contact-quer') || route.includes('contactquer') || route.includes('inquir')) {
        adminChild = (
          <PermissionGuard
            menuKey="CONTACT_QUERY"
            action="canView"
            fallback={
              <AccessDeniedPage
                moduleName="Contact Inquiries"
                onNavigateDashboard={() => navigateTo('/admin/dashboard')}
                onNavigateHome={handleNavigateHome}
              />
            }
          >
            <ContactQueryManagementPage />
          </PermissionGuard>
        );
      } else if (route.includes('faq')) {
        adminChild = (
          <PermissionGuard
            menuKey="FAQ"
            action="canView"
            fallback={
              <AccessDeniedPage
                moduleName="FAQ Management"
                onNavigateDashboard={() => navigateTo('/admin/dashboard')}
                onNavigateHome={handleNavigateHome}
              />
            }
          >
            <FaqManagementPage />
          </PermissionGuard>
        );
      } else if (route.includes('orders')) {
        adminChild = (
          <PermissionGuard
            menuKey="ORDER"
            action="canView"
            fallback={
              <AccessDeniedPage
                moduleName="Orders"
                onNavigateDashboard={() => navigateTo('/admin/dashboard')}
                onNavigateHome={handleNavigateHome}
              />
            }
          >
            <OrderManagementPage />
          </PermissionGuard>
        );
      } else if (route.includes('shipping')) {
        adminChild = (
          <PermissionGuard
            menuKey="SHIPPING"
            action="canView"
            fallback={
              <AccessDeniedPage
                moduleName="Shipping Settings"
                onNavigateDashboard={() => navigateTo('/admin/dashboard')}
                onNavigateHome={handleNavigateHome}
              />
            }
          >
            <ShippingSettingsPage />
          </PermissionGuard>
        );
      } else if (route.includes('combo-pack') || route.includes('combopack')) {
        adminChild = (
          <PermissionGuard
            menuKey="COMBOPACK"
            action="canView"
            fallback={
              <AccessDeniedPage
                moduleName="Combo Packs"
                onNavigateDashboard={() => navigateTo('/admin/dashboard')}
                onNavigateHome={handleNavigateHome}
              />
            }
          >
            <ComboPackManagementPage />
          </PermissionGuard>
        );
      } else if (route.includes('coupon')) {
        adminChild = (
          <PermissionGuard
            menuKey="COUPON"
            action="canView"
            fallback={
              <AccessDeniedPage
                moduleName="Coupons & Vouchers"
                onNavigateDashboard={() => navigateTo('/admin/dashboard')}
                onNavigateHome={handleNavigateHome}
              />
            }
          >
            <CouponManagementPage />
          </PermissionGuard>
        );
      } else if (route.includes('lov')) {
        adminChild = (
          <PermissionGuard
            menuKey="LOV"
            action="canView"
            fallback={
              <AccessDeniedPage
                moduleName="Dropdown & Status Master"
                onNavigateDashboard={() => navigateTo('/admin/dashboard')}
                onNavigateHome={handleNavigateHome}
              />
            }
          >
            <LovManagementPage />
          </PermissionGuard>
        );
      } else if (route.includes('test-menu') || route.includes('testmenu')) {
        adminChild = (
          <PermissionGuard
            menuKey="TESTMENU"
            action="canView"
            fallback={
              <AccessDeniedPage
                moduleName="Test Menu Module"
                onNavigateDashboard={() => navigateTo('/admin/dashboard')}
                onNavigateHome={handleNavigateHome}
              />
            }
          >
            <GenericModulePage
              moduleKey="TESTMENU"
              moduleName="Test Menu Module"
              onNavigateDashboard={() => navigateTo('/admin/dashboard')}
            />
          </PermissionGuard>
        );
      } else if (route !== '/admin' && route !== '/admin/' && route !== '/admin/dashboard') {
        const rawModuleName = route.replace(/^\/admin\//, '').replace(/-/g, ' ');
        const formattedModuleName = rawModuleName.charAt(0).toUpperCase() + rawModuleName.slice(1);
        const moduleKey = rawModuleName.toUpperCase().replace(/\s+/g, '_');
        adminChild = (
          <PermissionGuard
            menuKey={moduleKey}
            action="canView"
            fallback={
              <AccessDeniedPage
                moduleName={formattedModuleName}
                onNavigateDashboard={() => navigateTo('/admin/dashboard')}
                onNavigateHome={handleNavigateHome}
              />
            }
          >
            <GenericModulePage
              moduleKey={moduleKey}
              moduleName={formattedModuleName}
              onNavigateDashboard={() => navigateTo('/admin/dashboard')}
            />
          </PermissionGuard>
        );
      }

      return (
        <RequireAdminAuth onLoginSuccess={() => navigateTo(currentRoute)} onNavigateHome={handleNavigateHome}>
          <AdminLayout currentHash={currentRoute} onNavigate={navigateTo} onLogout={handleAdminLogout}>
            {adminChild}
          </AdminLayout>
        </RequireAdminAuth>
      );
    }

    if (route === '/login' || route === '/signup' || route === '/auth') {
      const isSignup = route.includes('signup');
      return (
        <AuthPage
          initialMode={isSignup ? 'signup' : 'login'}
          onNavigateHome={handleNavigateHome}
        />
      );
    }

    if (
      route === '/our-story' ||
      route === '/ourstory' ||
      route === '/about' ||
      route === '/about-us'
    ) {
      return <OurStoryPage onNavigateHome={handleNavigateHome} />;
    }

    if (
      route === '/combo' ||
      route === '/combos' ||
      route === '/customize-combo'
    ) {
      return <CustomizeComboPage onNavigateHome={handleNavigateHome} />;
    }

    if (route === '/gift-hampers' || route === '/gifting') {
      return (
        <GiftHampersPage
          onNavigateHome={handleNavigateHome}
          onNavigateToDetail={handleNavigateToDetail}
        />
      );
    }

    if (route === '/mukhwas') {
      return (
        <MukhwasPage
          onNavigateHome={handleNavigateHome}
          onNavigateToDetail={handleNavigateToDetail}
        />
      );
    }

    if (route === '/tea-masala') {
      return (
        <TeaMasalaPage
          onNavigateHome={handleNavigateHome}
          onNavigateToDetail={handleNavigateToDetail}
        />
      );
    }

    if (
      route === '/handmade-soap' ||
      route === '/home-made-soap' ||
      route === '/hand-made-soap' ||
      route === '/soap'
    ) {
      return (
        <HandmadeSoapPage
          onNavigateHome={handleNavigateHome}
          onNavigateToDetail={handleNavigateToDetail}
        />
      );
    }

    if (
      route === '/hair-oil' ||
      route === '/hair-oils' ||
      route === '/hairoil'
    ) {
      return (
        <HairOilPage
          onNavigateHome={handleNavigateHome}
          onNavigateToDetail={handleNavigateToDetail}
        />
      );
    }

    if (route.startsWith('/product/')) {
      const productId = route.replace(/^\/product\//, '');
      return (
        <ProductDetailPage
          productId={productId}
          onNavigateHome={handleNavigateHome}
          onNavigateMukhwas={handleNavigateMukhwas}
          onNavigateToDetail={handleNavigateToDetail}
        />
      );
    }

    if (route === '/cart') {
      return (
        <CartPage
          onNavigateHome={handleNavigateHome}
          onNavigateMukhwas={handleNavigateMukhwas}
          onNavigateToDetail={handleNavigateToDetail}
          onNavigateCheckout={handleNavigateCheckout}
        />
      );
    }

    if (route === '/checkout') {
      if (!CustomerAuthService.isLoggedIn()) {
        return (
          <AuthPage
            initialMode="login"
            onNavigateHome={handleNavigateHome}
          />
        );
      }
      return (
        <CheckoutPage
          onNavigateHome={handleNavigateHome}
          onNavigateCart={handleNavigateCart}
          onNavigateConfirmation={handleNavigateConfirmation}
        />
      );
    }

    if (route.startsWith('/order-confirmation')) {
      return (
        <OrderConfirmationPage
          onNavigateHome={handleNavigateHome}
          onNavigateMukhwas={handleNavigateMukhwas}
          onNavigateTrackOrder={handleNavigateTrackOrder}
        />
      );
    }

    if (route === '/wishlist') {
      return (
        <WishlistPage
          onNavigateHome={handleNavigateHome}
          onNavigateMukhwas={handleNavigateMukhwas}
        />
      );
    }

    if (route.startsWith('/track-order')) {
      return (
        <TrackOrderPage
          onNavigateHome={handleNavigateHome}
          onNavigateMukhwas={handleNavigateMukhwas}
        />
      );
    }

    // PROFILE / ACCOUNT ROUTES
    const cleanTab = route.replace(/^\//, '');
    if (isAccountRoute(route)) {
      const mainTab: 'profile' | 'orders' | 'addresses' | 'password' | 'rewards' =
        cleanTab.startsWith('orders')
          ? 'orders'
          : cleanTab.startsWith('reward') || cleanTab === 'coins'
          ? 'rewards'
          : cleanTab === 'addresses'
          ? 'addresses'
          : cleanTab === 'password'
          ? 'password'
          : 'profile';

      // Signed-out visitors go straight to sign-in; ProfilePage is never mounted, so its
      // authenticated API calls (addresses, LOV, orders) never fire and 401.
      if (!CustomerAuthService.isLoggedIn()) {
        return (
          <AuthPage
            initialMode="login"
            onNavigateHome={handleNavigateHome}
          />
        );
      }

      return (
        <ProfilePage
          initialTab={mainTab}
          onNavigateHome={handleNavigateHome}
          onNavigateMukhwas={handleNavigateMukhwas}
          onNavigateTrackOrder={handleNavigateTrackOrder}
        />
      );
    }

    if (route === '/privacy-policy' || route === '/privacy') {
      return <PrivacyPolicyPage />;
    }

    if (route === '/terms-conditions' || route === '/terms' || route === '/terms-and-conditions') {
      return <TermsConditionsPage />;
    }

    if (route === '/refund-policy' || route === '/refund' || route === '/cancellation') {
      return <RefundPolicyPage />;
    }

    if (route === '/shipping-policy' || route === '/shipping') {
      return <ShippingPolicyPage />;
    }

    if (route === '/contact-us' || route === '/contact') {
      return <ContactUsPage />;
    }

    if (route === '/faq' || route === '/faqs') {
      return <FaqPage />;
    }

    if (route === '/' || route === '') {
      return <Home />;
    }

    // Catch-all for unknown URLs
    return <NotFoundPage />;
  };

  // Prefetch on hover helpers
  const prefetchProductDetail = () => prefetchChunk(() => import('./pages/ProductDetail/ProductDetailPage'));
  const prefetchMukhwas = () => prefetchChunk(() => import('./pages/Mukhwas/MukhwasPage'));

  void prefetchProductDetail;
  void prefetchMukhwas;

  const routeMeta = getRouteMeta(currentRoute);

  return (
    <PermissionProvider syncEnabled={currentRoute.toLowerCase().startsWith('/admin')}>
      {routeMeta && <SEO {...routeMeta} />}
      <Preloader />
      <PageTransition currentHash={currentRoute}>
        <ChunkErrorBoundary>
          <Suspense fallback={<RouteLoader />}>
            {renderRouteContent()}
          </Suspense>
        </ChunkErrorBoundary>
      </PageTransition>
      {!currentRoute.toLowerCase().startsWith('/admin') && <FloatingWidgets />}
    </PermissionProvider>
  );
}

export default App;