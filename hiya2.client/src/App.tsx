import { useState, useEffect } from 'react';
import { Home } from './pages/Home/Home';
import { CustomizeComboPage } from './pages/CustomizeCombo/CustomizeComboPage';
import { MukhwasPage } from './pages/Mukhwas/MukhwasPage';
import { ProductDetailPage } from './pages/ProductDetail/ProductDetailPage';
import { CartPage } from './pages/Cart/CartPage';
import { CheckoutPage } from './pages/Checkout/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmation/OrderConfirmationPage';
import { TrackOrderPage } from './pages/TrackOrder/TrackOrderPage';
import { ProfilePage } from './pages/Profile/ProfilePage';
import { WishlistPage } from './pages/Wishlist/WishlistPage';
import { AuthPage } from './pages/Auth/AuthPage';
import { TeaMasalaPage } from './pages/TeaMasala/TeaMasalaPage';
import { HandmadeSoapPage } from './pages/HandmadeSoap/HandmadeSoapPage';
import { HairOilPage } from './pages/HairOil/HairOilPage';
import { GiftHampersPage } from './pages/GiftHampers/GiftHampersPage';
import { OurStoryPage } from './pages/OurStory/OurStoryPage';
import {
  PrivacyPolicyPage,
  TermsConditionsPage,
  RefundPolicyPage,
  ShippingPolicyPage,
} from './pages/Legal/LegalPages';
import { ContactUsPage } from './pages/ContactUs/ContactUsPage';
import { FaqPage } from './pages/Faq/FaqPage';
import { NotFoundPage } from './pages/NotFound/NotFoundPage';
import { RoleManagementPage } from './pages/Admin/RoleManagementPage';
import { UserManagementPage } from './pages/Admin/UserManagementPage';
import { MenuManagementPage } from './pages/Admin/MenuManagementPage';
import { CategoryManagementPage } from './pages/Admin/CategoryManagementPage';
import { ProductManagementPage } from './pages/Admin/ProductManagementPage';
import { CustomerManagementPage } from './pages/Admin/CustomerManagementPage';
import { AttributeManagementPage } from './pages/Admin/AttributeManagementPage';
import { AdminDashboardPage } from './pages/Admin/AdminDashboardPage';
import { HomePageComponentManagementPage } from './pages/Admin/HomePageComponentManagementPage';
import { GiftHamperManagementPage } from './pages/Admin/GiftHamperManagementPage';
import { ReviewManagementPage } from './pages/Admin/ReviewManagementPage';
import { ContactQueryManagementPage } from './pages/Admin/ContactQueryManagementPage';
import { FaqManagementPage } from './pages/Admin/FaqManagementPage';
import { StockModulePage } from './pages/Admin/StockModulePage';
import { RewardModulePage } from './pages/Admin/RewardModulePage';
import { OrderManagementPage } from './pages/Admin/OrderManagementPage';
import { ShippingSettingsPage } from './pages/Admin/ShippingSettingsPage';
import { ComboPackManagementPage } from './pages/Admin/ComboPackManagementPage';
import { CouponManagementPage } from './pages/Admin/CouponManagementPage';
import { LovManagementPage } from './pages/Admin/LovManagementPage';
import { GenericModulePage } from './pages/Admin/GenericModulePage';
import { AccessDeniedPage } from './pages/Admin/AccessDeniedPage';
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

interface RouteMeta {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
}

const DEFAULT_TITLE = 'HIYAGHAR - Handcrafted Natural Mukhwas & Wellness';
const DEFAULT_DESCRIPTION = 'Discover handcrafted natural mukhwas, authentic Gujarati digestive treats, traditional tea masala, handmade soap, and artisan gifting from HIYAGHAR.';

// Per-route meta for every route the router renders. Returns null for /product/* (the product page
// sets its own) and for unknown routes (NotFoundPage sets its own).
function getRouteMeta(route: string): RouteMeta | null {
  const lower = route.toLowerCase().split('?')[0];
  const meta = (title: string, description: string, noindex = false): RouteMeta => ({ title, description, path: lower, noindex });

  if (lower === '/') return meta(DEFAULT_TITLE, DEFAULT_DESCRIPTION);
  if (lower === '/mukhwas') return meta('Artisanal Natural Mukhwas Collection | HIYAGHAR', 'Explore our premium selection of traditional handcrafted digestive mukhwas made with 100% natural ingredients.');
  if (lower === '/tea-masala') return meta('Authentic Traditional Tea Masala | HIYAGHAR', 'Rich aromatic spice blend for the perfect Indian chai experience.');
  if (lower === '/handmade-soap') return meta('Natural Handmade Cold Process Soaps | HIYAGHAR', 'Pure plant-based, chemical-free artisan soaps crafted for nourished, glowing skin.');
  if (lower === '/hair-oil') return meta('Ayurvedic Herbal Hair Oil | HIYAGHAR', 'Nourishing herbal hair oil formulated with pure botanical extracts for strong, healthy hair.');
  if (lower === '/gift-hampers') return meta('Festive & Celebration Gift Hampers | HIYAGHAR', 'Thoughtfully curated luxury gift boxes filled with handcrafted natural wellness treats.');
  if (lower === '/combos') return meta('Customize Your Combo Pack | HIYAGHAR', 'Save more on our most popular handcrafted mukhwas, tea masala, and personal care combinations.');
  if (lower === '/our-story') return meta('Our Story & Heritage | HIYAGHAR', 'Learn about HIYAGHAR’s journey, our commitment to natural ingredients, and authentic taste.');
  if (lower === '/contact-us') return meta('Contact Us | HIYAGHAR', 'Get in touch with HIYAGHAR for inquiries, bulk orders, and customer support.');
  if (lower === '/faq') return meta('Frequently Asked Questions (FAQ) | HIYAGHAR', 'Find answers to common questions about HIYAGHAR handcrafted natural mukhwas, tea masala, soaps, shipping, and custom gifting.');
  if (lower === '/privacy-policy') return meta('Privacy Policy | HIYAGHAR', 'Read our privacy policy to understand how HIYAGHAR protects your personal data.');
  if (lower === '/terms-conditions') return meta('Terms & Conditions | HIYAGHAR', 'Review the official terms and conditions for using the HIYAGHAR website and services.');
  if (lower === '/refund-policy') return meta('Refund & Cancellation Policy | HIYAGHAR', 'Information about HIYAGHAR cancellation, return, and refund policies.');
  if (lower === '/shipping-policy') return meta('Shipping Policy | HIYAGHAR', 'Delivery timeframes, shipping charges, and order tracking information.');

  // Private / utility routes: noindex,follow
  if (lower === '/cart') return meta('Shopping Cart | HIYAGHAR', 'Review your shopping cart items and proceed to fast, secure checkout.', true);
  if (lower === '/checkout') return meta('Secure Checkout | HIYAGHAR', 'Fast and secure checkout with free shipping on qualifying orders across India.', true);
  if (lower === '/login' || lower === '/auth') return meta('Sign In to Your Account | HIYAGHAR', 'Log in to track orders, manage your wishlist, and save your delivery addresses.', true);
  if (lower === '/signup') return meta('Create a New Account | HIYAGHAR', 'Join the HIYAGHAR family to enjoy seamless ordering, exclusive discounts, and easy tracking.', true);
  if (lower.startsWith('/track-order')) return meta('Track Your Order | HIYAGHAR', 'Track the real-time shipping and delivery status of your HIYAGHAR order.', true);
  if (lower === '/wishlist') return meta('My Wishlist | HIYAGHAR', 'View and manage your saved favorite items on HIYAGHAR.', true);
  if (lower.startsWith('/order-confirmation')) return meta(DEFAULT_TITLE, DEFAULT_DESCRIPTION, true);
  if (lower === '/profile') return meta('My Account Profile | HIYAGHAR', DEFAULT_DESCRIPTION, true);
  if (isAccountRoute(lower)) return meta(DEFAULT_TITLE, DEFAULT_DESCRIPTION, true);
  if (lower === '/admin' || lower.startsWith('/admin/')) return meta('HIYAGHAR Admin Portal', DEFAULT_DESCRIPTION, true);

  return null;
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

  const handleNavigateHome = () => {
    navigateTo('/');
  };

  const handleNavigateMukhwas = () => {
    navigateTo('/mukhwas');
  };

  const handleNavigateToDetail = (productId: string) => {
    navigateTo(`/product/${productId}`);
  };

  const handleNavigateCart = () => {
    navigateTo('/cart');
  };

  const handleNavigateCheckout = () => {
    navigateTo('/checkout');
  };

  const handleNavigateConfirmation = (orderId: string) => {
    navigateTo(`/order-confirmation?orderId=${orderId}`);
  };

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

  const routeMeta = getRouteMeta(currentRoute);

  return (
    <PermissionProvider syncEnabled={currentRoute.toLowerCase().startsWith('/admin')}>
      {routeMeta && <SEO {...routeMeta} />}
      <Preloader />
      <PageTransition currentHash={currentRoute}>
        {renderRouteContent()}
      </PageTransition>
      {!currentRoute.toLowerCase().startsWith('/admin') && <FloatingWidgets />}
    </PermissionProvider>
  );
}

export default App;