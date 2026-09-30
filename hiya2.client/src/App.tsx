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
import { StockModulePage } from './pages/Admin/StockModulePage';
import { RewardModulePage } from './pages/Admin/RewardModulePage';
import { OrderManagementPage } from './pages/Admin/OrderManagementPage';
import { LovManagementPage } from './pages/Admin/LovManagementPage';
import { GenericModulePage } from './pages/Admin/GenericModulePage';
import { AccessDeniedPage } from './pages/Admin/AccessDeniedPage';
import { AdminLayout } from './components/admin/AdminLayout';
import { RequireAdminAuth } from './components/admin/RequireAdminAuth';
import { PermissionGuard } from './components/common/PermissionGuard';
import { PermissionProvider } from './context/PermissionContext';
import { AdminAuthService } from './services/adminAuthService';
import { Preloader } from './components/common/Preloader/Preloader';
import { PageTransition } from './components/common/PageTransition/PageTransition';
import { FloatingWidgets } from './components/common/FloatingWidgets/FloatingWidgets';
import { preloadCriticalImages } from './services/imagePreloaderService';

function getNormalizedRoute(): string {
  const hash = window.location.hash;
  const path = window.location.pathname;

  if (hash && hash.length > 1) {
    let clean = hash.replace(/^#\/?/, '/');
    if (!clean.startsWith('/')) clean = '/' + clean;
    const search = window.location.search;
    window.history.replaceState(null, '', clean + search);
    return clean;
  }

  return path || '/';
}

function App() {
  const [currentRoute, setCurrentRoute] = useState<string>(getNormalizedRoute());

  useEffect(() => {
    preloadCriticalImages();

    const handleLocationChange = () => {
      const route = getNormalizedRoute();
      setCurrentRoute(route);
      window.scrollTo(0, 0);
    };

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
      } else if (route.includes('lov')) {
        adminChild = (
          <PermissionGuard
            menuKey="LOV"
            action="canView"
            fallback={
              <AccessDeniedPage
                moduleName="List of Values"
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
    const accountTabs = ['profile', 'orders', 'addresses', 'password', 'account'];
    const cleanTab = route.replace(/^\//, '');
    if (
      accountTabs.includes(cleanTab) ||
      route.startsWith('/profile') ||
      route.startsWith('/orders')
    ) {
      const mainTab = cleanTab.startsWith('orders') ? 'orders' : cleanTab === 'account' ? 'profile' : (cleanTab.split('/')[0] as any);
      return (
        <ProfilePage
          initialTab={mainTab}
          onNavigateHome={handleNavigateHome}
          onNavigateMukhwas={handleNavigateMukhwas}
          onNavigateTrackOrder={handleNavigateTrackOrder}
        />
      );
    }

    return <Home />;
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