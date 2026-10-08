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

function App() {
  const [currentRoute, setCurrentRoute] = useState<string>(getNormalizedRoute());

  useEffect(() => {
    preloadCriticalImages();

    const updateRouteMeta = (route: string) => {
      const lower = route.toLowerCase();
      let title = 'HIYAGHAR - Handcrafted Natural Mukhwas & Wellness';
      let description = 'Discover handcrafted natural mukhwas, authentic Gujarati digestive treats, traditional tea masala, handmade soap, and artisan gifting from HIYAGHAR.';

      if (lower === '/mukhwas' || lower.startsWith('/mukhwas/')) {
        title = 'Artisanal Natural Mukhwas Collection | HIYAGHAR';
        description = 'Explore our premium selection of traditional handcrafted digestive mukhwas made with 100% natural ingredients.';
      } else if (lower === '/tea-masala' || lower.startsWith('/tea-masala/')) {
        title = 'Authentic Traditional Tea Masala | HIYAGHAR';
        description = 'Rich aromatic spice blend for the perfect Indian chai experience.';
      } else if (lower === '/handmade-soap' || lower.startsWith('/handmade-soap/')) {
        title = 'Natural Handmade Cold Process Soaps | HIYAGHAR';
        description = 'Pure plant-based, chemical-free artisan soaps crafted for nourished, glowing skin.';
      } else if (lower === '/hair-oil' || lower.startsWith('/hair-oil/')) {
        title = 'Ayurvedic Herbal Hair Oil | HIYAGHAR';
        description = 'Nourishing herbal hair oil formulated with pure botanical extracts for strong, healthy hair.';
      } else if (lower === '/gift-hampers' || lower.startsWith('/gift-hampers/')) {
        title = 'Festive & Celebration Gift Hampers | HIYAGHAR';
        description = 'Thoughtfully curated luxury gift boxes filled with handcrafted natural wellness treats.';
      } else if (lower === '/combos' || lower.startsWith('/combos/')) {
        title = 'Value Wellness Combo Packs | HIYAGHAR';
        description = 'Save more on our most popular handcrafted mukhwas, tea masala, and personal care combinations.';
      } else if (lower === '/cart') {
        title = 'Shopping Cart | HIYAGHAR';
        description = 'Review your shopping cart items and proceed to fast, secure checkout.';
      } else if (lower === '/checkout') {
        title = 'Secure Checkout | HIYAGHAR';
        description = 'Fast and secure checkout with free shipping on qualifying orders across India.';
      } else if (lower === '/login') {
        title = 'Sign In to Your Account | HIYAGHAR';
        description = 'Log in to track orders, manage your wishlist, and save your delivery addresses.';
      } else if (lower === '/signup') {
        title = 'Create a New Account | HIYAGHAR';
        description = 'Join the HIYAGHAR family to enjoy seamless ordering, exclusive discounts, and easy tracking.';
      } else if (lower.startsWith('/track-order')) {
        title = 'Track Your Order | HIYAGHAR';
        description = 'Track the real-time shipping and delivery status of your HIYAGHAR order.';
      } else if (lower === '/wishlist') {
        title = 'My Wishlist | HIYAGHAR';
        description = 'View and manage your saved favorite items on HIYAGHAR.';
      } else if (lower === '/privacy-policy') {
        title = 'Privacy Policy | HIYAGHAR';
        description = 'Read our privacy policy to understand how HIYAGHAR protects your personal data.';
      } else if (lower === '/terms-conditions') {
        title = 'Terms & Conditions | HIYAGHAR';
        description = 'Review the official terms and conditions for using the HIYAGHAR website and services.';
      } else if (lower === '/refund-policy') {
        title = 'Refund & Cancellation Policy | HIYAGHAR';
        description = 'Information about HIYAGHAR cancellation, return, and refund policies.';
      } else if (lower === '/shipping-policy') {
        title = 'Shipping Policy | HIYAGHAR';
        description = 'Delivery timeframes, shipping charges, and order tracking information.';
      } else if (lower === '/contact-us') {
        title = 'Contact Us | HIYAGHAR';
        description = 'Get in touch with HIYAGHAR for inquiries, bulk orders, and customer support.';
      } else if (lower === '/faq' || lower === '/faqs') {
        title = 'Frequently Asked Questions (FAQ) | HIYAGHAR';
        description = 'Find answers to common questions about HIYAGHAR handcrafted natural mukhwas, tea masala, soaps, shipping, and custom gifting.';
      } else if (lower === '/our-story') {
        title = 'Our Story & Heritage | HIYAGHAR';
        description = 'Learn about HIYAGHAR’s journey, our commitment to natural ingredients, and authentic taste.';
      } else if (lower === '/profile') {
        title = 'My Account Profile | HIYAGHAR';
      } else if (lower.startsWith('/admin')) {
        title = 'HIYAGHAR Admin Portal';
      }

      document.title = title;
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);

      // BUG-006: Canonical URL tag to prevent split canonical on duplicate alias routes
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      const canonicalPath = lower === '/ourstory' || lower === '/about' || lower === '/about-us'
        ? '/our-story'
        : lower === '/combo' || lower === '/customize-combo'
        ? '/combos'
        : lower === '/gifting'
        ? '/gift-hampers'
        : lower;
      canonicalLink.setAttribute('href', `https://hiyaghar.com${canonicalPath}`);
    };

    const handleLocationChange = () => {
      const route = getNormalizedRoute();
      setCurrentRoute(route);
      updateRouteMeta(route);
      window.scrollTo(0, 0);
    };

    updateRouteMeta(getNormalizedRoute());
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

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
    const accountTabs = ['profile', 'orders', 'addresses', 'password', 'account', 'rewards', 'reward', 'coins'];
    const cleanTab = route.replace(/^\//, '');
    if (
      accountTabs.includes(cleanTab) ||
      route.startsWith('/profile') ||
      route.startsWith('/orders') ||
      route.startsWith('/rewards') ||
      route.startsWith('/reward')
    ) {
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

  return (
    <PermissionProvider>
      <Preloader />
      <PageTransition currentHash={currentRoute}>
        {renderRouteContent()}
      </PageTransition>
      {!currentRoute.toLowerCase().startsWith('/admin') && <FloatingWidgets />}
    </PermissionProvider>
  );
}

export default App;