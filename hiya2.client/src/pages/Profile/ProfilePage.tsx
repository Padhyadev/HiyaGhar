import React, { useState, useEffect, useRef } from 'react';
import { Header } from '../../components/layout/Header/Header';
import { Footer } from '../../components/layout/Footer/Footer';
import { CustomerAuthService } from '../../services/customerAuthService';
import type { CustomerProfile } from '../../services/customerAuthService';
import { OrderService, resolveStatusLabel } from '../../services/orderService';
import type { Order } from '../../services/orderService';
import { LovService } from '../../services/lovService';
import { AddressService } from '../../services/addressService';
import type { UserAddress } from '../../services/addressService';
import { WishlistService } from '../../services/wishlistService';
import type { WishlistItem } from '../../services/wishlistService';
import { RewardService } from '../../services/rewardService';
import type { RewardSettingsInfo, RewardLedgerEntry } from '../../services/rewardService';
import { ShippingService } from '../../services/shippingService';
import { MukhwasHero } from '../../components/mukhwas/MukhwasHero/MukhwasHero';
import { AnimatedNumber } from '../../components/common/AnimatedNumber';
import { allowOnlyDigits, sanitizeDigits } from '../../utils/validationUtils';
import { showToast } from '../../utils/alertService';
import './ProfilePage.css';

interface ProfilePageProps {
  initialTab?: 'profile' | 'orders' | 'addresses' | 'password' | 'rewards';
  onNavigateHome: () => void;
  onNavigateMukhwas: () => void;
  onNavigateTrackOrder: (orderId: string) => void;
}

// Inline SVG (not emoji) so the icon renders identically on every PC/browser,
// instead of depending on the OS's installed emoji font.
const EyeIcon: React.FC<{ open: boolean }> = ({ open }) =>
  open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a17.7 17.7 0 0 1-3.16 4.4M6.61 6.61C3.87 8.36 2 12 2 12s4 8 11 8a9.1 9.1 0 0 0 4.24-1.02" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

export const ProfilePage: React.FC<ProfilePageProps> = ({
  initialTab = 'profile',
  onNavigateHome,
  onNavigateMukhwas: _onNavigateMukhwas,
  onNavigateTrackOrder: _onNavigateTrackOrder,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses' | 'password' | 'rewards'>(initialTab);
  const [customer, setCustomer] = useState<CustomerProfile | null>(CustomerAuthService.getCustomer());
  const [orders, setOrders] = useState<Order[]>(OrderService.getAllOrders());
  const [statusLabelMap, setStatusLabelMap] = useState<Record<string, string>>({});
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(true);
  const [addresses, setAddresses] = useState<UserAddress[]>(AddressService.getAddresses());
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(WishlistService.getItems());

  // Rewards Tab State
  const [rewardSettings, setRewardSettings] = useState<RewardSettingsInfo | null>(null);
  const [rewardBalance, setRewardBalance] = useState<number>(customer?.rewardCoins ?? 0);
  const [rewardLedger, setRewardLedger] = useState<RewardLedgerEntry[]>([]);
  const [isLoadingRewards, setIsLoadingRewards] = useState<boolean>(false);
  const [referralCopied, setReferralCopied] = useState<boolean>(false);

  // Profile Form Edit State
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [profileForm, setProfileForm] = useState({
    firstName: customer?.firstName || '',
    lastName: customer?.lastName || '',
    email: customer?.email || '',
    phone: customer?.mobileNo || '',
    gender: customer?.gender || 'Male',
  });

  // Order History Filter & Selected View State
  const [orderSearch, setOrderSearch] = useState<string>('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');
  const [orderTimeFilter, setOrderTimeFilter] = useState<string>('All');
  const [draftStatusFilter, setDraftStatusFilter] = useState<string>('All');
  const [draftTimeFilter, setDraftTimeFilter] = useState<string>('All');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(0);
  const [orderDetailTab, setOrderDetailTab] = useState<'history' | 'items'>('history');
  const [visibleOrdersCount, setVisibleOrdersCount] = useState<number>(6);

  // An order id named directly in the URL (path or hash) that we couldn't
  // resolve yet because the real order list hasn't loaded from the server -
  // retried once fetchMyOrders() resolves (see the effect below).
  const pendingOrderIdRef = useRef<string | null>(null);

  // Cancel Order Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Orders in these statuses can still be cancelled (mirrors the backend's
  // OrderService.AllowedTransitions - only pre-shipment orders are cancellable).
  const isOrderCancellable = (order: Order) => order.status === 'Confirmed' || order.status === 'Packed';

  const handleOpenCancelModal = () => {
    setCancelReason('');
    setCancelError(null);
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancelOrder = async () => {
    if (!selectedOrder) return;
    if (!cancelReason.trim()) {
      setCancelError('Please select or specify a reason for cancellation.');
      return;
    }

    setIsCancelling(true);
    setCancelError(null);
    const res = await OrderService.cancelOrder(selectedOrder.id, cancelReason.trim());
    setIsCancelling(false);

    if (res.success) {
      setIsCancelModalOpen(false);
      const refreshed = await OrderService.fetchMyOrders();
      setOrders(refreshed);
      setSelectedOrder(refreshed.find((o) => o.id === selectedOrder.id) || null);
      showToast('Order cancelled successfully.');
    } else {
      setCancelError(res.message || 'Failed to cancel order. Please try again.');
    }
  };

  const handleOpenMobileFilter = () => {
    setDraftStatusFilter(orderStatusFilter);
    setDraftTimeFilter(orderTimeFilter);
    setIsMobileFilterOpen(true);
  };

  const handleApplyMobileFilters = () => {
    setOrderStatusFilter(draftStatusFilter);
    setOrderTimeFilter(draftTimeFilter);
    setIsMobileFilterOpen(false);
  };

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setSelectedItemIndex(0);
    setOrderDetailTab('history');
    window.location.hash = `#orders/${order.id}`;
  };

  const handleBackToOrders = () => {
    setSelectedOrder(null);
    setOrderDetailTab('history');
    window.location.hash = '#orders';
  };

  // Address Modal State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState<boolean>(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});
  const [addressForm, setAddressForm] = useState<Partial<UserAddress>>({
    fullName: (customer?.firstName || '') + ' ' + (customer?.lastName || ''),
    mobileNo: customer?.mobileNo || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    addressType: 'SHIPPING',
    isDefault: false,
  });

  // Password / Security Form State
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);


  useEffect(() => {
    const handleHashChange = () => {
      const rawHash = window.location.hash.replace('#/', '').replace('#', '');

      // Deep link via hash (in-app navigation, e.g. handleViewOrderDetails)
      // or via a plain URL path like /orders/ORD-XXXX (what a user would
      // actually type, bookmark, or get from a shared link) - App.tsx's own
      // router normalizes any hash into a path before this ever mounts, so
      // the path form is what we'll usually see on a fresh page load.
      const pathMatch = window.location.pathname.match(/^\/orders\/(.+)$/);

      let orderId = '';
      if (rawHash.startsWith('orders/')) {
        orderId = rawHash.replace('orders/', '');
      } else if (rawHash.includes('order=')) {
        orderId = rawHash.split('order=')[1];
      } else if (pathMatch) {
        orderId = decodeURIComponent(pathMatch[1]);
      }

      if (orderId) {
        setActiveTab('orders');
        const found = OrderService.getOrderById(orderId);
        if (found) {
          setSelectedOrder(found);
          pendingOrderIdRef.current = null;
          return;
        }
        // Order list may not be loaded yet (fresh page load) - retry once
        // fetchMyOrders() resolves, in the effect below.
        pendingOrderIdRef.current = orderId;
        return;
      }

      const mainTab = rawHash.split('/')[0];
      if (['profile', 'orders', 'addresses', 'password', 'rewards'].includes(mainTab)) {
        setActiveTab(mainTab as any);
        if (mainTab !== 'orders') {
          setSelectedOrder(null);
        }
      } else {
        setActiveTab(initialTab);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    window.scrollTo(0, 0);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [initialTab]);

  useEffect(() => {
    if (activeTab !== 'rewards' || !customer) return;

    let cancelled = false;
    setIsLoadingRewards(true);
    Promise.all([RewardService.getSettings(), RewardService.getMyLedger()]).then(([settings, ledger]) => {
      if (cancelled) return;
      setRewardSettings(settings);
      if (ledger) {
        setRewardBalance(ledger.balance);
        setRewardLedger(ledger.transactions);
      }
      setIsLoadingRewards(false);
    });

    return () => {
      cancelled = true;
    };
  }, [activeTab, customer]);

  const [genderOptions, setGenderOptions] = useState<Array<{ code: string; desc: string }>>([
    { code: 'Male', desc: 'Male' },
    { code: 'Female', desc: 'Female' },
    { code: 'Other', desc: 'Other' },
  ]);
  const [addressTypeOptions, setAddressTypeOptions] = useState<Array<{ code: string; desc: string }>>([
    { code: 'SHIPPING', desc: 'Shipping / Home' },
    { code: 'WORK', desc: 'Work / Office' },
    { code: 'OTHER', desc: 'Other' },
  ]);

  useEffect(() => {
    const unsubAuth = CustomerAuthService.subscribe(() => setCustomer(CustomerAuthService.getCustomer()));
    const unsubAddr = AddressService.subscribe(() => setAddresses(AddressService.getAddresses()));
    const unsubWish = WishlistService.subscribe(() => setWishlistItems(WishlistService.getItems()));

    AddressService.fetchAddressesFromApi().then((data) => setAddresses(data));

    LovService.getPublicLabels('OrderStatus').then(setStatusLabelMap);

    LovService.getItems('Gender').then((items) => {
      if (Array.isArray(items) && items.length > 0) {
        const active = items.filter((it) => it.isActive).sort((a, b) => a.displayOrder - b.displayOrder);
        if (active.length > 0) setGenderOptions(active.map((it) => ({ code: it.lovCode, desc: it.lovDesc })));
      }
    }).catch(() => {});

    LovService.getItems('AddressType').then((items) => {
      if (Array.isArray(items) && items.length > 0) {
        const active = items.filter((it) => it.isActive).sort((a, b) => a.displayOrder - b.displayOrder);
        if (active.length > 0) setAddressTypeOptions(active.map((it) => ({ code: it.lovCode, desc: it.lovDesc })));
      }
    }).catch(() => {});

    setIsLoadingOrders(true);
    OrderService.fetchMyOrders()
      .then((data) => {
        setOrders(data);
        if (pendingOrderIdRef.current) {
          const cleanId = pendingOrderIdRef.current.trim().toUpperCase().replace('#', '');
          const found = data.find((o) => o.id.toUpperCase() === cleanId) || null;
          if (found) {
            setSelectedOrder(found);
          }
          pendingOrderIdRef.current = null;
        }
      })
      .finally(() => setIsLoadingOrders(false));

    return () => {
      unsubAuth();
      unsubAddr();
      unsubWish();
    };
  }, []);

  // Tab 1: Profile Save Handler
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = CustomerAuthService.updateLocalProfile({
      firstName: profileForm.firstName,
      lastName: profileForm.lastName,
      email: profileForm.email,
      mobileNo: profileForm.phone,
      gender: profileForm.gender,
    });
    setCustomer(updated);
    setIsEditingProfile(false);
    showToast('Account profile details updated successfully!', 'success');
  };

  // Tab 3: Address Form Submit Handler
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!addressForm.fullName?.trim()) {
      errors.fullName = 'Please enter full name';
    }
    if (!addressForm.mobileNo?.trim()) {
      errors.mobileNo = 'Please enter mobile number';
    } else if (addressForm.mobileNo.trim().length !== 10) {
      errors.mobileNo = 'Please enter 10 digit mobile number';
    }
    if (!addressForm.addressLine1?.trim()) {
      errors.addressLine1 = 'Please enter address line 1';
    }
    if (!addressForm.city?.trim()) {
      errors.city = 'Please enter city';
    }
    if (!addressForm.postalCode?.trim()) {
      errors.postalCode = 'Please enter pincode';
    } else if (addressForm.postalCode.trim().length !== 6) {
      errors.postalCode = 'Please enter valid 6 digit pincode';
    } else if (!ShippingService.isAhmedabadPincode(addressForm.postalCode.trim())) {
      errors.postalCode = 'Order place only in Ahmedabad. We currently deliver only to Ahmedabad addresses.';
    }
    if (!addressForm.state?.trim()) {
      errors.state = 'Please enter state';
    }

    if (Object.keys(errors).length > 0) {
      setAddressErrors(errors);
      if (errors.postalCode && addressForm.postalCode && !ShippingService.isAhmedabadPincode(addressForm.postalCode.trim())) {
        showToast('Order place only in Ahmedabad.', 'error');
      }
      return;
    }
    setAddressErrors({});

    const payload = {
      ...addressForm,
      fullName: addressForm.fullName?.trim() || (customer?.firstName || '') + ' ' + (customer?.lastName || ''),
      mobileNo: addressForm.mobileNo?.trim() || customer?.mobileNo || '',
      addressLine1: addressForm.addressLine1?.trim() || '',
      addressLine2: addressForm.addressLine2?.trim() || '',
      city: addressForm.city?.trim() || '',
      state: addressForm.state?.trim() || '',
      postalCode: addressForm.postalCode?.trim() || '',
      addressType: addressForm.addressType || 'SHIPPING',
    };

    if (editingAddress) {
      AddressService.updateAddress(editingAddress.id, payload);
      await AddressService.saveAddressApi({ ...payload, id: editingAddress.id });
      showToast('Address updated successfully.', 'success');
    } else {
      const added = AddressService.addAddress(payload as any);
      await AddressService.saveAddressApi(added);
      showToast('New address saved to address book!', 'success');
    }

    const latest = await AddressService.fetchAddressesFromApi();
    setAddresses(latest);

    setIsAddressModalOpen(false);
    setEditingAddress(null);
    setAddressErrors({});
  };

  // Security: Change Password Submit Handler
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast('Please enter your current password.', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New password and confirm password do not match.', 'error');
      return;
    }
    showToast('Password updated successfully!', 'success');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Stable filter categorization - deliberately independent of the
  // admin-editable LOV display text below, so renaming a status label never
  // breaks the filter buttons' matching logic.
  const getFilterCategory = (status: Order['status']): string => {
    if (status === 'Delivered') return 'Delivered';
    if (status === 'Out for Delivery') return 'Out for Delivery';
    if (status === 'Shipped') return 'Shipped';
    if (status === 'Cancelled') return 'Cancelled';
    return 'Ordered'; // Confirmed, Packed, Returned, Refunded
  };

  const formatOrderStatus = (status: Order['status']): string => resolveStatusLabel(status, statusLabelMap);

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    const searchLower = orderSearch.toLowerCase().trim();
    const matchSearch =
      !searchLower ||
      o.id.toLowerCase().includes(searchLower) ||
      o.items.some((i) => i.name.toLowerCase().includes(searchLower));

    let matchStatus = true;
    const formattedStatus = getFilterCategory(o.status);
    if (orderStatusFilter === 'Active') {
      matchStatus = formattedStatus !== 'Delivered' && formattedStatus !== 'Cancelled';
    } else if (orderStatusFilter !== 'All') {
      matchStatus = formattedStatus.toLowerCase() === orderStatusFilter.toLowerCase();
    }

    let matchTime = true;
    const orderDate = new Date(o.createdAt);
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    if (orderTimeFilter === 'Last 30 days') {
      matchTime = orderDate >= thirtyDaysAgo;
    } else if (orderTimeFilter === 'Last 3 months') {
      matchTime = orderDate >= threeMonthsAgo;
    } else if (orderTimeFilter === '2026') {
      matchTime = orderDate.getFullYear() === 2026;
    } else if (orderTimeFilter === '2025') {
      matchTime = orderDate.getFullYear() === 2025;
    } else if (orderTimeFilter === 'Older') {
      matchTime = orderDate.getFullYear() < 2025;
    }

    return matchSearch && matchStatus && matchTime;
  });

  const getSalutation = (gender: string) => {
    if (gender === 'Male') return 'Mr. ';
    if (gender === 'Female') return 'Ms. ';
    return '';
  };

  return (
    <div className="hiyaghar-profile-page-layout">
      {/* DEDICATED FULL MOBILE FILTER PAGE OVERLAY */}
      {isMobileFilterOpen && (
        <div className="hiyaghar-full-mobile-filter-page animate-fade-in">
          <div className="full-filter-page-header">
            <h2 className="page-title">Filter Orders</h2>
            <button
              type="button"
              className="close-circle-btn"
              onClick={() => setIsMobileFilterOpen(false)}
              aria-label="Close filters"
            >
              ✕
            </button>
          </div>

          <div className="full-filter-page-body">
            {/* Section 1: Filter by Order Status */}
            <div className="filter-block">
              <h4 className="filter-block-heading">First: Filter by Order Status</h4>
              <div className="vertical-options-list">
                {['All', 'Ordered', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    className={`vertical-option-btn ${draftStatusFilter === st ? 'is-selected' : ''}`}
                    onClick={() => setDraftStatusFilter(st)}
                  >
                    <span>{st}</span>
                    {draftStatusFilter === st && <span className="check-mark">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Section 2: Filter by Order Date */}
            <div className="filter-block" style={{ marginTop: '28px' }}>
              <h4 className="filter-block-heading">Second: Filter by Order Date</h4>
              <div className="vertical-options-list">
                {['All Time', 'Last 30 days', 'Last 3 months', '2026', '2025'].map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    className={`vertical-option-btn ${draftTimeFilter === tf ? 'is-selected' : ''}`}
                    onClick={() => setDraftTimeFilter(tf)}
                  >
                    <span>{tf}</span>
                    {draftTimeFilter === tf && <span className="check-mark">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="full-filter-page-footer">
            <button
              type="button"
              className="full-filter-btn reset-btn"
              onClick={() => {
                setDraftStatusFilter('All');
                setDraftTimeFilter('All');
              }}
            >
              Reset Filters
            </button>
            <button
              type="button"
              className="full-filter-btn apply-btn"
              onClick={handleApplyMobileFilters}
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      <Header />

      <main className="hiyaghar-profile-main">
        <MukhwasHero
          onNavigateHome={onNavigateHome}
          breadcrumbCurrent="My Account"
          title="My Account"
          bgImage="/image/Banner_image/accountimage.jfif"
        />

        <div className="hiyaghar-container">

          {/* 2. COMPACT ACCOUNT HEADER */}
          <header className="hiyaghar-account-header">
            <div className="hiyaghar-account-header-left">
              <div className="hiyaghar-customer-name-row">
                <span className="hiyaghar-customer-name">
                  {getSalutation(customer?.gender || '')}{customer?.firstName} {customer?.lastName}
                </span>
              </div>
              <div className="hiyaghar-contact-line">
                <span>{customer?.email}</span>
                <span className="dot">•</span>
                <span>{customer?.mobileNo}</span>
              </div>
            </div>

            <div className="hiyaghar-account-header-stats">
              <div className="hiyaghar-header-stat-box">
                <span className="stat-num"><AnimatedNumber value={orders.length} /></span>
                <span className="stat-lbl">Orders</span>
              </div>
              <div className="hiyaghar-header-stat-divider" />
              <div className="hiyaghar-header-stat-box">
                <span className="stat-num"><AnimatedNumber value={addresses.length} /></span>
                <span className="stat-lbl">Addresses</span>
              </div>
              <div className="hiyaghar-header-stat-divider" />
              <div
                className="hiyaghar-header-stat-box hiyaghar-header-stat-box-link"
                role="button"
                tabIndex={0}
                onClick={() => { window.location.hash = '#wishlist'; }}
                onKeyDown={(e) => { if (e.key === 'Enter') window.location.hash = '#wishlist'; }}
              >
                <span className="stat-num"><AnimatedNumber value={wishlistItems.length} /></span>
                <span className="stat-lbl">Wishlist</span>
              </div>
            </div>
          </header>

          {/* 3. HORIZONTAL ACCOUNT NAVIGATION */}
          <nav className="hiyaghar-account-nav-bar" aria-label="Account Navigation">
            <button
              type="button"
              className={`hiyaghar-nav-pill ${activeTab === 'profile' ? 'is-active' : ''}`}
              onClick={() => { setActiveTab('profile'); setSelectedOrder(null); window.history.pushState(null, '', '/profile'); }}
            >
              Profile
            </button>
            <button
              type="button"
              className={`hiyaghar-nav-pill ${activeTab === 'orders' ? 'is-active' : ''}`}
              onClick={() => { setActiveTab('orders'); setSelectedOrder(null); window.history.pushState(null, '', '/orders'); }}
            >
              Orders
            </button>
            <button
              type="button"
              className={`hiyaghar-nav-pill ${activeTab === 'addresses' ? 'is-active' : ''}`}
              onClick={() => { setActiveTab('addresses'); setSelectedOrder(null); window.history.pushState(null, '', '/addresses'); }}
            >
              Addresses
            </button>
            <button
              type="button"
              className={`hiyaghar-nav-pill ${activeTab === 'password' ? 'is-active' : ''}`}
              onClick={() => { setActiveTab('password'); setSelectedOrder(null); window.history.pushState(null, '', '/password'); }}
            >
              Security
            </button>
            <button
              type="button"
              className={`hiyaghar-nav-pill ${activeTab === 'rewards' ? 'is-active' : ''}`}
              onClick={() => { setActiveTab('rewards'); setSelectedOrder(null); window.history.pushState(null, '', '/rewards'); }}
            >
              <span>Rewards</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="hiyaghar-pill-icon">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 6v12M15 9.5a3.5 3.5 0 0 0-5 0c0 2 5 2 5 4a3.5 3.5 0 0 1-5 0" />
              </svg>
            </button>
            <button
              type="button"
              className="hiyaghar-nav-pill logout-pill"
              onClick={() => {
                CustomerAuthService.logout();
                showToast('Logout successfully', 'info');
                onNavigateHome();
                window.location.hash = '#/';
              }}
            >
              <span>Logout</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="hiyaghar-pill-icon">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </nav>

          {/* 4. ACTIVE ACCOUNT CONTENT AREA */}
          <div className={`hiyaghar-account-content-card ${activeTab === 'profile' ? 'has-flush-side-img' : ''}`}>
            {/* TAB 1: PROFILE DETAILS */}
            {activeTab === 'profile' && (
              <div className="hiyaghar-panel animate-fade-in hiyaghar-profile-panel">
                <div className="hiyaghar-profile-left-content">
                  <div className="hiyaghar-panel-header">
                    <div>
                      <h2 className="hiyaghar-panel-heading">Profile Details</h2>
                      <p className="hiyaghar-panel-subheading">Manage your personal information and preferences.</p>
                    </div>
                    {!isEditingProfile && (
                      <button
                        type="button"
                        className="hiyaghar-panel-btn secondary"
                        onClick={() => setIsEditingProfile(true)}
                      >
                        Edit Profile
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSaveProfile} className="hiyaghar-profile-form">
                    <div className="hiyaghar-form-grid-2col">
                      <div className="hiyaghar-field-group">
                        <label>First Name *</label>
                        <input
                          type="text"
                          disabled={!isEditingProfile}
                          value={profileForm.firstName}
                          onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                          required
                        />
                      </div>

                      <div className="hiyaghar-field-group">
                        <label>Last Name *</label>
                        <input
                          type="text"
                          disabled={!isEditingProfile}
                          value={profileForm.lastName}
                          onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                          required
                        />
                      </div>

                      <div className="hiyaghar-field-group">
                        <label>Email Address *</label>
                        <input
                          type="email"
                          disabled={!isEditingProfile}
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                          required
                        />
                      </div>

                      <div className="hiyaghar-field-group">
                        <label>Mobile Number *</label>
                        <input
                          type="tel"
                          disabled={!isEditingProfile}
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          required
                        />
                      </div>

                      <div className="hiyaghar-field-group full-width">
                        <label>Gender</label>
                        <select
                          disabled={!isEditingProfile}
                          value={profileForm.gender}
                          onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value as any })}
                        >
                          {genderOptions.map((g) => (
                            <option key={g.code} value={g.code}>
                              {g.desc}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {isEditingProfile && (
                      <div className="hiyaghar-form-actions-centered">
                        <button type="submit" className="hiyaghar-panel-btn primary">
                          Save Changes
                        </button>
                        <button
                          type="button"
                          className="hiyaghar-panel-btn secondary"
                          onClick={() => {
                            setProfileForm({
                              firstName: customer?.firstName || '',
                              lastName: customer?.lastName || '',
                              email: customer?.email || '',
                              phone: customer?.mobileNo || '',
                              gender: customer?.gender || 'Male',
                            });
                            setIsEditingProfile(false);
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </form>
                </div>

                <div className="hiyaghar-profile-side-image-container">
                  <img
                    src="/image/Accoutimage/SideimageOfAccount.webp"
                    alt="Profile Account Details"
                    className="hiyaghar-profile-side-img"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: ORDERS */}
            {activeTab === 'orders' && (
              <div className="hiyaghar-panel animate-fade-in">
                {selectedOrder ? (
                  /* ==========================================================================
                     FULL E-COMMERCE ORDER DETAILS VIEW FORMAT
                     ========================================================================== */
                  <div className="hiyaghar-redesigned-order-details animate-fade-in">
                    {/* 1. Back to Orders Context Bar */}
                    <div className="hiyaghar-order-context-bar">
                      <button type="button" className="hiyaghar-back-to-orders-btn" onClick={handleBackToOrders}>
                        ← Back to Orders
                      </button>
                    </div>

                    <div className="hiyaghar-order-header-row">
                      <div className="order-main-title-block">
                        <div className="status-badge-container">
                          <span className={`ecom-status-badge ${getFilterCategory(selectedOrder.status).toLowerCase().replace(/\s+/g, '-')}`}>
                            {formatOrderStatus(selectedOrder.status).toUpperCase()}
                          </span>
                        </div>
                        <h1 className="order-id-heading">Order #{selectedOrder.id}</h1>
                      </div>
                      <div className="order-header-right-block">
                        <button
                          type="button"
                          className="hiyaghar-panel-btn ecom-btn-black"
                          onClick={() => OrderService.downloadInvoicePdf(selectedOrder)}
                        >
                          Export Invoice (PDF)
                        </button>
                        {isOrderCancellable(selectedOrder) && (
                          <button
                            type="button"
                            className="hiyaghar-panel-btn ecom-btn-danger"
                            onClick={handleOpenCancelModal}
                          >
                            Cancel Order
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Quick stats row - Total Items / Payment Status / Order Date / Order Total */}
                    <div className="hiyaghar-courier-compact-bar order-quick-stats-bar">
                      <div className="courier-item">
                        <span className="lbl">Total Items</span>
                        <span className="val">{selectedOrder.items.length}</span>
                      </div>
                      <div className="courier-item">
                        <span className="lbl">Payment Status</span>
                        <span className="val status-paid">Paid ({selectedOrder.paymentMethod?.name || 'UPI'})</span>
                      </div>
                      <div className="courier-item">
                        <span className="lbl">Order Date</span>
                        <span className="val">{new Date(selectedOrder.createdAt).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="courier-item">
                        <span className="lbl">Order Total</span>
                        <span className="val">₹{selectedOrder.total}</span>
                      </div>
                    </div>

                    {/* Order Progress - horizontal stepper, always visible above the tabs */}
                    {(() => {
                      const timeline = selectedOrder.timeline;
                      const currentStep = timeline.find((s) => s.current) || timeline[timeline.length - 1];
                      const currentIndex = timeline.findIndex((s) => s === currentStep);
                      const progressPercent = timeline.length > 1 ? (currentIndex / (timeline.length - 1)) * 100 : 100;

                      return (
                        <div className="single-line-status-stepper">
                          <div className="stepper-heading-block">
                            <h4 className="stepper-title">{currentStep.title}</h4>
                            <p className="stepper-subtitle">{currentStep.description}</p>
                          </div>
                          <div className="stepper-track-container">
                            <div className="stepper-track-bg" />
                            <div className="stepper-track-fill" style={{ width: `${progressPercent}%` }} />
                            <div className="stepper-nodes-row">
                              {timeline.map((step) => (
                                <div
                                  key={step.id}
                                  className={`stepper-node ${step.completed ? 'is-completed' : ''} ${step.current ? 'is-current' : ''}`}
                                >
                                  <div className="node-icon">
                                    {step.completed ? (
                                      <span className="chk-mark">✓</span>
                                    ) : (
                                      <span className="hollow-dot" />
                                    )}
                                  </div>
                                  <span className="node-label">{step.title}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Tabs - Order History / Item Details */}
                    <div className="order-detail-tabs">
                      <div className="order-detail-tabs-nav ecom-tabs-nav">
                        {([
                          { key: 'history', label: 'Order History' },
                          { key: 'items', label: 'Item Details' },
                        ] as const).map((tab) => (
                          <button
                            key={tab.key}
                            type="button"
                            className={`order-detail-tab-btn ${orderDetailTab === tab.key ? 'is-active' : ''}`}
                            onClick={() => setOrderDetailTab(tab.key)}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      <div className="order-detail-tab-panel animate-fade-in">
                        {orderDetailTab === 'history' && (
                          <div className="history-tab-container">
                            <div className="ecom-order-info-body">
                              <div className="ecom-order-info-col">
                                <h4 className="panel-inner-heading">Order Details</h4>
                                <div className="ecom-order-summary-box">
                                  <p className="order-summary-row">
                                    <span className="row-lbl">Order Number:</span>
                                    <span className="row-val font-mono">{selectedOrder.id}</span>
                                  </p>
                                  <p className="order-summary-row">
                                    <span className="row-lbl">Status:</span>
                                    <span className="row-val status-badge-inline">{formatOrderStatus(selectedOrder.status)}</span>
                                  </p>
                                  <p className="order-summary-row">
                                    <span className="row-lbl">Payment:</span>
                                    <span className="row-val">
                                      {selectedOrder.paymentStatus || (selectedOrder.paymentMethod?.id === 'online' ? 'Paid' : 'Pending')} ({selectedOrder.paymentMethod?.name || 'Cash on Delivery'})
                                    </span>
                                  </p>
                                  <p className="order-summary-row">
                                    <span className="row-lbl">Amount:</span>
                                    <span className="row-val">₹{selectedOrder.subtotal || selectedOrder.total}</span>
                                  </p>
                                  <p className="order-summary-row">
                                    <span className="row-lbl">Discount:</span>
                                    <span className="row-val text-success">-₹{selectedOrder.discount || 0}</span>
                                  </p>
                                  {(selectedOrder.shippingFee !== undefined && selectedOrder.shippingFee > 0) && (
                                    <p className="order-summary-row">
                                      <span className="row-lbl">Delivery Fee:</span>
                                      <span className="row-val">₹{selectedOrder.shippingFee}</span>
                                    </p>
                                  )}
                                  <p className="order-summary-row total-row">
                                    <span className="row-lbl"><strong>Total:</strong></span>
                                    <span className="row-val total-val">₹{selectedOrder.total}</span>
                                  </p>
                                  <p className="order-summary-row">
                                    <span className="row-lbl">Order Date:</span>
                                    <span className="row-val">{new Date(selectedOrder.createdAt).toLocaleString('en-IN')}</span>
                                  </p>
                                </div>
                              </div>

                              <div className="ecom-order-info-col">
                                <h4 className="panel-inner-heading">Delivery Address &amp; Payment</h4>
                                <div className="ecom-order-summary-box ecom-order-info-box">
                                  <ul className="receiver-details-list">
                                    <li className="receiver-name"><strong>{selectedOrder.shippingAddress.fullName}</strong></li>
                                    <li className="receiver-contact-row">
                                      <span className="receiver-contact-icon-badge">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                        </svg>
                                      </span>
                                      <span>{selectedOrder.shippingAddress.mobile}</span>
                                    </li>
                                    {selectedOrder.shippingAddress.email && (
                                      <li className="receiver-contact-row">
                                        <span className="receiver-contact-icon-badge">
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                            <polyline points="22,6 12,13 2,6"></polyline>
                                          </svg>
                                        </span>
                                        <span>{selectedOrder.shippingAddress.email}</span>
                                      </li>
                                    )}
                                    <li style={{ marginTop: '4px' }}>{selectedOrder.shippingAddress.address}</li>
                                    <li>
                                      {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}
                                    </li>
                                  </ul>
                                  <div className="ecom-financial-totals-block">
                                    <div className="order-summary-row" style={{ borderBottom: '1px solid #f1f5f9', padding: '8px 0' }}>
                                      <span className="row-lbl">Payment Method</span>
                                      <span className="row-val font-medium">{selectedOrder.paymentMethod?.name || 'Cash on Delivery (COD)'}</span>
                                    </div>
                                    <div className="order-summary-row" style={{ borderBottom: 'none', padding: '8px 0 0 0' }}>
                                      <span className="row-lbl">Payment Status</span>
                                      <span className="row-val" style={{ color: selectedOrder.paymentStatus === 'Paid' ? '#16a34a' : '#d97706', fontWeight: 800 }}>
                                        {selectedOrder.paymentStatus || (selectedOrder.paymentMethod?.id === 'online' ? 'Paid' : 'Pending')}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {orderDetailTab === 'items' && (
                          <div className="ecom-item-details-panel">
                            <h4 className="panel-inner-heading">Item Details</h4>

                            {/* Row of item thumbnail selector buttons */}
                            <div className="item-thumbnails-selector-row">
                              {selectedOrder.items.map((item, idx) => (
                                <button
                                  key={item.id || idx}
                                  type="button"
                                  className={`item-thumb-selector-btn ${selectedItemIndex === idx ? 'is-active' : ''}`}
                                  onClick={() => setSelectedItemIndex(idx)}
                                >
                                  <img
                                    src={item.image || '/image/ImageforMukhwash/Shahi Pan.webp'}
                                    alt={item.name}
                                    onError={(e) => {
                                      e.currentTarget.src = '/image/ImageforMukhwash/Shahi Pan.webp';
                                    }}
                                  />
                                </button>
                              ))}
                            </div>

                            {/* Active item details card */}
                            {selectedOrder.items[selectedItemIndex] && (() => {
                              const currentItem = selectedOrder.items[selectedItemIndex];
                              return (
                                <div className="ecom-selected-item-card">
                                  <div className="item-card-media">
                                    <img
                                      src={currentItem.image || '/image/ImageforMukhwash/Shahi Pan.webp'}
                                      alt={currentItem.name}
                                      onError={(e) => {
                                        e.currentTarget.src = '/image/ImageforMukhwash/Shahi Pan.webp';
                                      }}
                                    />
                                  </div>
                                  <div className="item-card-details">
                                    <h4 className="item-title">{currentItem.name}</h4>
                                    <p className="item-info"><strong>Variant :</strong> {currentItem.weight || 'Standard'}</p>
                                    <p className="item-info"><strong>Quantity :</strong> {currentItem.quantity}</p>
                                    <p className="item-info"><strong>Unit Price :</strong> ₹{currentItem.price}</p>
                                    <p className="item-info"><strong>Amount :</strong> ₹{currentItem.price * currentItem.quantity}</p>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Financial totals summary */}
                            <div className="ecom-financial-totals-block">
                              <div className="totals-row">
                                <span>Amount</span>
                                <span className="val">₹{selectedOrder.subtotal || selectedOrder.total}</span>
                              </div>
                              <div className="totals-row discount">
                                <span>Discount</span>
                                <span className="val text-success">₹{selectedOrder.discount || 0}</span>
                              </div>
                              <div className="totals-row">
                                <span>Delivery Fee</span>
                                <span className="val">{selectedOrder.shippingFee === 0 ? 'FREE' : `₹${selectedOrder.shippingFee}`}</span>
                              </div>
                              <div className="totals-divider" />
                              <div className="totals-row total">
                                <span>Total</span>
                                <span className="val">₹{selectedOrder.total}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Customer Support Bar */}
                    <div className="hiyaghar-support-bar">
                      <div className="support-text">
                        <h4>Need Help With This Order?</h4>
                        <p>Our customer-care team is available Mon–Sat, 9:00 AM–7:00 PM.</p>
                      </div>
                      <div className="support-actions">
                        <a
                          href="mailto:support@hiyaghar.com"
                          className="hiyaghar-panel-btn secondary"
                          onClick={() => {
                            navigator.clipboard.writeText('support@hiyaghar.com').catch(() => {});
                            showToast('support@hiyaghar.com copied to clipboard — reach out anytime!');
                          }}
                        >
                          Contact Support
                        </a>
                        <a href="https://wa.me/919274443617?text=Hello%20HiyaGhar,%20I%20need%20help%20with%20my%20order." target="_blank" rel="noopener noreferrer" className="hiyaghar-panel-btn primary">
                          WhatsApp Support
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ORDERS LISTING VIEW */
                  <div>
                    <div className="hiyaghar-panel-header">
                      <div>
                        <h2 className="hiyaghar-panel-heading">Your Orders</h2>
                        <p className="hiyaghar-panel-subheading">View your purchases and track your deliveries.</p>
                      </div>
                    </div>

                    {/* Search & Filters */}
                    {(() => {
                      const activeCount = (orderStatusFilter !== 'All' ? 1 : 0) + (orderTimeFilter !== 'All' ? 1 : 0);
                      return (
                        <div className="hiyaghar-orders-filter-bar">
                          <div className="hiyaghar-search-filter-row">
                            <div className="hiyaghar-search-box">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                              </svg>
                              <input
                                type="text"
                                placeholder="Search your orders..."
                                value={orderSearch}
                                onChange={(e) => setOrderSearch(e.target.value)}
                              />
                              {orderSearch && (
                                <button type="button" className="clear-btn" onClick={() => setOrderSearch('')}>✕</button>
                              )}
                            </div>

                            <button
                              type="button"
                              className={`hiyaghar-mobile-filter-toggle-btn ${isMobileFilterOpen || activeCount > 0 ? 'is-active' : ''}`}
                              onClick={handleOpenMobileFilter}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                              </svg>
                              <span>Filters</span>
                              {activeCount > 0 && <span className="active-badge">{activeCount}</span>}
                              <span className="chevron-icon">{isMobileFilterOpen ? '▲' : '▼'}</span>
                            </button>
                          </div>

                          {/* Desktop Inline Filter Bar */}
                          <div className="hiyaghar-desktop-filter-options-panel">
                            <div className="hiyaghar-filter-pills-row">
                              {['All', 'Ordered', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].map((st) => (
                                <button
                                  key={st}
                                  type="button"
                                  className={`hiyaghar-filter-pill ${orderStatusFilter === st ? 'is-active' : ''}`}
                                  onClick={() => setOrderStatusFilter(st)}
                                >
                                  {st}
                                </button>
                              ))}
                              <select
                                className="hiyaghar-time-filter-select"
                                value={orderTimeFilter}
                                onChange={(e) => setOrderTimeFilter(e.target.value)}
                              >
                                <option value="All">All Time</option>
                                <option value="Last 30 days">Last 30 days</option>
                                <option value="Last 3 months">Last 3 months</option>
                                <option value="2026">2026</option>
                                <option value="2025">2025</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Orders Cards List */}
                    {isLoadingOrders ? (
                      <div className="hiyaghar-empty-orders">
                        <p>Loading your orders…</p>
                      </div>
                    ) : filteredOrders.length === 0 ? (
                      <div className="hiyaghar-empty-orders">
                        <p>No orders found matching your search.</p>
                      </div>
                    ) : (
                      <div className="hiyaghar-orders-cards-list">
                        {filteredOrders.slice(0, visibleOrdersCount).map((ord) => {
                          const firstItem = ord.items[0];
                          const extraCount = ord.items.length - 1;
                          const summaryText = firstItem
                            ? `${firstItem.name}${extraCount > 0 ? ` + ${extraCount} more` : ''}`
                            : 'Artisanal Mukhwas';
                          const formattedDate = new Date(ord.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          });
                          const cardStatusClass = getFilterCategory(ord.status);
                          const cardStatusLabel = formatOrderStatus(ord.status);

                          const isCancelled = ord.status === 'Cancelled' || ord.status === 'Returned' || ord.status === 'Refunded';
                          const stepStatus = ord.status;
                          const isPlaced = true;
                          const isShipped = stepStatus === 'Shipped' || stepStatus === 'Out for Delivery' || stepStatus === 'Delivered';
                          const isDelivered = stepStatus === 'Delivered';

                          return (
                            <div key={ord.id} className="hiyaghar-order-card" onClick={() => handleSelectOrder(ord)}>
                              <div className="card-top-header-row">
                                <img
                                  src={firstItem?.image || '/image/ImageforMukhwash/Shahi Pan.webp'}
                                  alt={firstItem?.name || 'Order'}
                                  className="card-thumb"
                                  onError={(e) => {
                                    e.currentTarget.src = '/image/ImageforMukhwash/Shahi Pan.webp';
                                  }}
                                />
                                <div className="card-info">
                                  <h4 className="order-title">{summaryText}</h4>
                                  <div className="order-num-line">Order #{ord.id}</div>
                                  <div className="order-date-line">
                                    {ord.status === 'Delivered'
                                      ? `Delivered on ${formattedDate}`
                                      : `Placed on ${formattedDate}`}
                                  </div>
                                </div>
                              </div>

                              {/* Customer Mini Order Status Timeline */}
                              {!isCancelled && (
                                <div className="card-mini-timeline">
                                  <div className={`mini-timeline-step ${isPlaced ? 'active' : ''}`}>
                                    <div className="step-circle">{isShipped ? '✓' : '1'}</div>
                                    <span className="step-text">Placed</span>
                                  </div>
                                  <div className={`mini-timeline-line ${isShipped ? 'active' : ''}`} />
                                  <div className={`mini-timeline-step ${isShipped ? 'active' : ''}`}>
                                    <div className="step-circle">{isDelivered ? '✓' : '2'}</div>
                                    <span className="step-text">Shipped</span>
                                  </div>
                                  <div className={`mini-timeline-line ${isDelivered ? 'active' : ''}`} />
                                  <div className={`mini-timeline-step ${isDelivered ? 'active' : ''}`}>
                                    <div className="step-circle">{isDelivered ? '✓' : '3'}</div>
                                    <span className="step-text">Delivered</span>
                                  </div>
                                </div>
                              )}

                              <div className="card-inline-row">
                                <div className="card-amount">
                                  <span className="price-val">₹{ord.total}</span>
                                </div>
                                <div className="card-status">
                                  <span className={`hiyaghar-status-badge ${cardStatusClass.toLowerCase().replace(/\s+/g, '-')}`}>
                                    {cardStatusLabel}
                                  </span>
                                </div>
                                <div className="card-action">
                                  <span className="details-link">View Details →</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {filteredOrders.length > visibleOrdersCount && (
                      <div className="hiyaghar-load-more-orders" style={{ textAlign: 'center', marginTop: '20px' }}>
                        <button
                          type="button"
                          className="hiyaghar-panel-btn secondary"
                          onClick={() => setVisibleOrdersCount((prev) => prev + 6)}
                        >
                          Load More Orders
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ADDRESSES */}
            {activeTab === 'addresses' && (
              <div className="hiyaghar-panel animate-fade-in">
                <div className="hiyaghar-panel-header">
                  <div>
                    <h2 className="hiyaghar-panel-heading">Saved Addresses</h2>
                    <p className="hiyaghar-panel-subheading">Manage your saved delivery addresses.</p>
                  </div>
                  <button
                    type="button"
                    className="hiyaghar-panel-btn primary"
                    onClick={() => {
                      setEditingAddress(null);
                      setAddressForm({
                        fullName: (customer?.firstName || '') + ' ' + (customer?.lastName || ''),
                        mobileNo: customer?.mobileNo || '',
                        addressLine1: '',
                        addressLine2: '',
                        city: '',
                        state: '',
                        postalCode: '',
                        addressType: 'SHIPPING',
                        isDefault: false,
                      });
                      setIsAddressModalOpen(true);
                    }}
                  >
                    + Add New Address
                  </button>
                </div>

                <div className="hiyaghar-addresses-grid">
                  {addresses.map((addr) => (
                    <div key={addr.id} className={`hiyaghar-address-card ${addr.isDefault ? 'is-default' : ''}`}>
                      <div className="card-top-row">
                        <span className="type-badge">{addr.addressType}</span>
                        {addr.isDefault && <span className="default-badge">Default Address</span>}
                      </div>
                      <h4 className="person-name">{addr.fullName}</h4>
                      <p className="street-address">
                        {addr.addressLine1}
                        {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}<br />
                        {addr.city}, {addr.state} - {addr.postalCode}
                      </p>
                      <span className="phone-line">
                        <i className="fa-solid fa-phone" aria-hidden="true" style={{ marginRight: '6px', color: 'var(--hiya-gold, #CB992C)' }}></i>
                        {addr.mobileNo}
                      </span>

                      <div className="card-actions-row">
                        {!addr.isDefault && (
                          <button
                            type="button"
                            className="addr-action-btn set-default-btn"
                            title="Set as default address"
                            onClick={() => {
                              AddressService.setDefault(addr.id);
                              showToast('Set as default delivery address');
                            }}
                          >
                            Set Default
                          </button>
                        )}
                        <div className="addr-icon-actions-group">
                          <button
                            type="button"
                            className="addr-icon-action-btn edit-btn"
                            title="Edit Address"
                            aria-label="Edit Address"
                            onClick={() => {
                              setEditingAddress(addr);
                              setAddressForm(addr);
                              setIsAddressModalOpen(true);
                            }}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="addr-icon-action-btn delete-btn"
                            title="Delete Address"
                            aria-label="Delete Address"
                            onClick={() => {
                              AddressService.deleteAddress(addr.id);
                              showToast('Address removed');
                            }}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: SECURITY */}
            {activeTab === 'password' && (
              <div className="hiyaghar-panel animate-fade-in">
                <div className="hiyaghar-panel-header">
                  <div>
                    <h2 className="hiyaghar-panel-heading">Account Security</h2>
                    <p className="hiyaghar-panel-subheading">Keep your HIYA account secure.</p>
                  </div>
                </div>

                <form onSubmit={handleChangePassword} className="hiyaghar-security-form">
                  <div className="hiyaghar-field-group">
                    <label>Current Password *</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="pass-toggle-btn"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                      >
                        <EyeIcon open={showCurrentPassword} />
                      </button>
                    </div>
                  </div>

                  <div className="hiyaghar-field-group">
                    <label>New Password *</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="At least 8 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="pass-toggle-btn"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      >
                        <EyeIcon open={showNewPassword} />
                      </button>
                    </div>
                  </div>

                  <div className="hiyaghar-field-group">
                    <label>Confirm New Password *</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="pass-toggle-btn"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        <EyeIcon open={showConfirmPassword} />
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="hiyaghar-panel-btn primary">
                    Update Password
                  </button>

                  <div className="hiyaghar-security-info-badge">
                    <span className="lock-icon" style={{ color: 'var(--hiya-gold, #CB992C)' }}>
                      <i className="fa-solid fa-lock" aria-hidden="true"></i>
                    </span>
                    <div>
                      <h4 className="info-title">Your account is protected.</h4>
                      <p className="info-text">We recommend updating your password periodically for optimal account safety.</p>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* TAB: REWARDS */}
            {activeTab === 'rewards' && (
              <div className="hiyaghar-panel animate-fade-in">
                <div className="hiyaghar-panel-header">
                  <div>
                    <h2 className="hiyaghar-panel-heading">My Rewards</h2>
                    <p className="hiyaghar-panel-subheading">Earn coins on signup, daily login, referrals, and every delivered order.</p>
                  </div>
                </div>

                {isLoadingRewards ? (
                  <p>Loading your rewards...</p>
                ) : (
                  <>
                    {/* TOP STATS CARDS */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                      {/* Card 1: Balance & Equivalent Cash Value */}
                      <div style={{ padding: '22px 24px', borderRadius: '16px', background: 'linear-gradient(135deg, #11223A 0%, #1d3a5f 100%)', color: '#fff', boxShadow: '0 8px 24px rgba(17,34,58,0.12)' }}>
                        <div style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.8, fontWeight: 700 }}>
                          Available Reward Balance
                        </div>
                        <div style={{ fontSize: '2.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px', margin: '8px 0 4px' }}>
                          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#CB992C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="9" fill="rgba(203, 153, 44, 0.25)" />
                            <path d="M12 7v10M15 9.5a3.5 3.5 0 0 0-5 0c0 2 5 2 5 4a3.5 3.5 0 0 1-5 0" />
                          </svg>
                          <span>{rewardBalance}</span>
                          <span style={{ fontSize: '1rem', fontWeight: 600, opacity: 0.85 }}>Coins</span>
                        </div>
                        <div style={{ display: 'inline-block', background: 'rgba(203, 153, 44, 0.2)', border: '1px solid rgba(203, 153, 44, 0.4)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, color: '#FCD34D' }}>
                          Worth ₹{(rewardBalance * (rewardSettings?.coinToRupeeRate || 1)).toFixed(2)} in shopping discount
                        </div>
                      </div>

                      {/* Card 2: Referral Code */}
                      {customer?.referralCode && (
                        <div style={{ padding: '22px 24px', borderRadius: '16px', background: '#FFFDF5', border: '1.5px solid #F0E6C8', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
                          <div>
                            <div style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#667085', fontWeight: 700 }}>
                              Invite Friends & Earn
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#11223A', letterSpacing: '1px', marginTop: '6px' }}>
                              {customer.referralCode}
                            </div>
                            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#5A6A7D' }}>
                              Share code to give your friend coins and earn <strong>+{rewardSettings?.referralCoins || 200} coins</strong> when they join!
                            </p>
                          </div>
                          <button
                            type="button"
                            className="hiyaghar-panel-btn"
                            style={{ marginTop: '12px', width: 'fit-content' }}
                            onClick={() => {
                              navigator.clipboard.writeText(customer.referralCode || '').catch(() => {});
                              setReferralCopied(true);
                              setTimeout(() => setReferralCopied(false), 2000);
                            }}
                          >
                            {referralCopied ? '✓ Copied to Clipboard!' : 'Copy Referral Code'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* SIMPLE 3-STEP "HOW IT WORKS" VISUAL GUIDE */}
                    <div style={{ background: '#ffffff', border: '1px solid #EAE4D5', borderRadius: '16px', padding: '20px 24px', marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#11223A', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ background: '#CB992C', color: '#fff', width: '22px', height: '22px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>i</span>
                        How Do Hiya Reward Coins Work? (Simple Guide)
                      </h3>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                        {/* Step 1: Earn */}
                        <div style={{ background: '#FAF8F2', padding: '16px', borderRadius: '12px', border: '1px solid #EFEAE0' }}>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: '#CB992C', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>Step 1: Earn Coins</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 12 20 22 4 22 4 12" />
                              <rect x="2" y="7" width="20" height="5" />
                              <line x1="12" y1="22" x2="12" y2="7" />
                              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                            </svg>
                          </div>
                          <p style={{ margin: 0, fontSize: '13px', color: '#4A5568', lineHeight: 1.5 }}>
                            Get <strong>{rewardSettings?.signupCoins || 500} coins</strong> on signup, daily login bonus, and cashback on every order!
                          </p>
                        </div>

                        {/* Step 2: Rate */}
                        <div style={{ background: '#FAF8F2', padding: '16px', borderRadius: '12px', border: '1px solid #EFEAE0' }}>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: '#CB992C', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>Step 2: Conversion Rate</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="9" />
                              <path d="M14.8 9A2 2 0 0 0 13 8h-2a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4h-2a2 2 0 0 1-1.8-1" />
                              <path d="M12 6v2m0 8v2" />
                            </svg>
                          </div>
                          <p style={{ margin: 0, fontSize: '13px', color: '#4A5568', lineHeight: 1.5 }}>
                            <strong>1 Coin = ₹{rewardSettings?.coinToRupeeRate || 1}</strong>.
                            <br />
                            Your <strong>{rewardBalance} Coins</strong> = <strong>₹{(rewardBalance * (rewardSettings?.coinToRupeeRate || 1)).toFixed(2)}</strong> real discount.
                          </p>
                        </div>

                        {/* Step 3: Checkout */}
                        <div style={{ background: '#FAF8F2', padding: '16px', borderRadius: '12px', border: '1px solid #EFEAE0' }}>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: '#CB992C', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>Step 3: Pay Less at Checkout</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                              <line x1="3" y1="6" x2="21" y2="6" />
                              <path d="M16 10a4 4 0 0 1-8 0" />
                            </svg>
                          </div>
                          <p style={{ margin: 0, fontSize: '13px', color: '#4A5568', lineHeight: 1.5 }}>
                            During checkout, simply tick the <em>"Use Coins"</em> box to reduce your bill by up to <strong>{rewardSettings?.maxCoinUsagePercent || 10}%</strong> instantly!
                          </p>
                        </div>
                      </div>

                      {/* Live Example Box */}
                      <div style={{ marginTop: '16px', padding: '12px 16px', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '10px', fontSize: '13px', color: '#0369A1', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                          <path d="M9 18h6" />
                          <path d="M10 22h4" />
                        </svg>
                        <span>
                          <strong>Example:</strong> On a <strong>₹500</strong> order, you can use <strong>{Math.min(rewardBalance, Math.floor(500 * ((rewardSettings?.maxCoinUsagePercent || 10) / 100)))} coins</strong> to instantly get a <strong>₹{(Math.min(rewardBalance, Math.floor(500 * ((rewardSettings?.maxCoinUsagePercent || 10) / 100))) * (rewardSettings?.coinToRupeeRate || 1)).toFixed(0)} OFF</strong> discount!
                        </span>
                      </div>
                    </div>

                    <h3 className="hiyaghar-panel-heading" style={{ fontSize: '1.1rem' }}>Coin History</h3>
                    {rewardLedger.length === 0 ? (
                      <p style={{ color: '#667085' }}>No reward coin activity yet.</p>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table className="hiyaghar-datatable" style={{ width: '100%' }}>
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Type</th>
                              <th>Coins</th>
                              <th>Balance After</th>
                              <th>Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rewardLedger.map((t) => {
                              const isDebit = String(t.type).toLowerCase() === 'spent' || String(t.type).toLowerCase() === 'debit' || t.coins < 0;
                              const absCoins = Math.abs(t.coins);
                              return (
                                <tr key={t.id}>
                                  <td>{new Date(t.createdDate).toLocaleDateString()}</td>
                                  <td>{t.type}</td>
                                  <td style={{ color: isDebit ? '#b42318' : '#2d6a4f', fontWeight: 700 }}>
                                    {isDebit ? `-${absCoins}` : `+${absCoins}`}
                                  </td>
                                  <td>{t.balanceAfter}</td>
                                  <td>{t.remarks || '-'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* 5. SMALL SUPPORT SECTION STRIP (Shown when not viewing an active order detail to avoid duplication) */}
          {!selectedOrder && (
            <section className="hiyaghar-support-strip">
              <div className="hiyaghar-support-content">
                <h3 className="hiyaghar-support-title">Need help?</h3>
                <p className="hiyaghar-support-desc">Our HIYA support team is here for you.</p>
              </div>
              <div className="hiyaghar-support-actions">
                <a
                  href="mailto:support@hiyaghar.com"
                  className="hiyaghar-support-btn secondary"
                  onClick={() => {
                    navigator.clipboard.writeText('support@hiyaghar.com').catch(() => {});
                    showToast('support@hiyaghar.com copied to clipboard — reach out anytime!');
                  }}
                >
                  Contact Support →
                </a>
                <a href="https://wa.me/919274443617?text=Hello%20HiyaGhar,%20I%20need%20assistance." target="_blank" rel="noopener noreferrer" className="hiyaghar-support-btn primary">
                  Chat with HIYA →
                </a>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* ADDRESS MODAL FORM */}
      {isAddressModalOpen && (
        <div className="hiyaghar-modal-overlay" onClick={() => setIsAddressModalOpen(false)}>
          <div className="hiyaghar-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="hiyaghar-modal-header">
              <h3>{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
              <button type="button" className="close-btn" onClick={() => setIsAddressModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="hiyaghar-address-modal-form" noValidate>
              <div className="hiyaghar-form-row-2col">
                <div className="hiyaghar-field-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Pranav Gadani"
                    value={addressForm.fullName || ''}
                    className={addressErrors.fullName ? 'input-error' : ''}
                    onChange={(e) => {
                      setAddressForm({ ...addressForm, fullName: e.target.value });
                      if (addressErrors.fullName) setAddressErrors((prev) => ({ ...prev, fullName: '' }));
                    }}
                  />
                  {addressErrors.fullName && <span className="hiyaghar-field-error">{addressErrors.fullName}</span>}
                </div>

                <div className="hiyaghar-field-group">
                  <label>Mobile Number *</label>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    value={addressForm.mobileNo || ''}
                    className={addressErrors.mobileNo ? 'input-error' : ''}
                    onKeyDown={allowOnlyDigits}
                    onChange={(e) => {
                      setAddressForm({ ...addressForm, mobileNo: sanitizeDigits(e.target.value) });
                      if (addressErrors.mobileNo) setAddressErrors((prev) => ({ ...prev, mobileNo: '' }));
                    }}
                  />
                  {addressErrors.mobileNo && <span className="hiyaghar-field-error">{addressErrors.mobileNo}</span>}
                </div>
              </div>

              <div className="hiyaghar-field-group">
                <label>Address Line 1 *</label>
                <input
                  type="text"
                  placeholder="House/Flat No., Street, Landmark"
                  value={addressForm.addressLine1 || ''}
                  className={addressErrors.addressLine1 ? 'input-error' : ''}
                  onChange={(e) => {
                    setAddressForm({ ...addressForm, addressLine1: e.target.value });
                    if (addressErrors.addressLine1) setAddressErrors((prev) => ({ ...prev, addressLine1: '' }));
                  }}
                />
                {addressErrors.addressLine1 && <span className="hiyaghar-field-error">{addressErrors.addressLine1}</span>}
              </div>

              <div className="hiyaghar-field-group">
                <label>Address Line 2</label>
                <input
                  type="text"
                  placeholder="Locality, Area (Optional)"
                  value={addressForm.addressLine2 || ''}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                />
              </div>

              <div className="hiyaghar-form-row-2col">
                <div className="hiyaghar-field-group">
                  <label>City *</label>
                  <input
                    type="text"
                    placeholder="e.g. Ahmedabad"
                    value={addressForm.city || ''}
                    className={addressErrors.city ? 'input-error' : ''}
                    onChange={(e) => {
                      setAddressForm({ ...addressForm, city: e.target.value });
                      if (addressErrors.city) setAddressErrors((prev) => ({ ...prev, city: '' }));
                    }}
                  />
                  {addressErrors.city && <span className="hiyaghar-field-error">{addressErrors.city}</span>}
                </div>

                <div className="hiyaghar-field-group">
                  <label>Pincode *</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="6-digit Pincode"
                    value={addressForm.postalCode || ''}
                    className={addressErrors.postalCode ? 'input-error' : ''}
                    onKeyDown={allowOnlyDigits}
                    onBlur={async (e) => {
                      const pin = e.target.value.trim();
                      if (pin.length === 6) {
                        const res = await ShippingService.lookupPincode(pin);
                        if (res.found && (res.city || res.state)) {
                          setAddressForm((prev) => ({
                            ...prev,
                            city: res.city || prev.city,
                            state: res.state || prev.state,
                          }));
                        }
                      } else {
                        setAddressForm((prev) => ({
                          ...prev,
                          city: '',
                          state: '',
                        }));
                      }
                    }}
                    onChange={async (e) => {
                      const clean = sanitizeDigits(e.target.value);
                      if (clean.length < 6) {
                        setAddressForm((prev) => ({
                          ...prev,
                          postalCode: clean,
                          city: '',
                          state: '',
                        }));
                      } else {
                        setAddressForm((prev) => ({ ...prev, postalCode: clean }));
                        const res = await ShippingService.lookupPincode(clean);
                        if (res.found && (res.city || res.state)) {
                          setAddressForm((prev) => ({
                            ...prev,
                            city: res.city || prev.city,
                            state: res.state || prev.state,
                          }));
                        }
                      }
                      if (addressErrors.postalCode) setAddressErrors((prev) => ({ ...prev, postalCode: '' }));
                    }}
                  />
                  {addressErrors.postalCode && <span className="hiyaghar-field-error">{addressErrors.postalCode}</span>}
                </div>
              </div>

              <div className="hiyaghar-form-row-2col">
                <div className="hiyaghar-field-group">
                  <label>State *</label>
                  <input
                    type="text"
                    placeholder="e.g. Gujarat"
                    value={addressForm.state || ''}
                    className={addressErrors.state ? 'input-error' : ''}
                    onChange={(e) => {
                      setAddressForm({ ...addressForm, state: e.target.value });
                      if (addressErrors.state) setAddressErrors((prev) => ({ ...prev, state: '' }));
                    }}
                  />
                  {addressErrors.state && <span className="hiyaghar-field-error">{addressErrors.state}</span>}
                </div>

                <div className="hiyaghar-field-group">
                  <label>Address Type</label>
                  <select
                    value={addressForm.addressType || 'SHIPPING'}
                    onChange={(e) => setAddressForm({ ...addressForm, addressType: e.target.value as any })}
                  >
                    {addressTypeOptions.map((addr) => (
                      <option key={addr.code} value={addr.code}>
                        {addr.desc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="hiyaghar-checkbox-label">
                <input
                  type="checkbox"
                  checked={!!addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                />
                Set as default delivery address
              </label>

              <button type="submit" className="hiyaghar-panel-btn primary full">
                Save Address
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL ORDER MODAL */}
      {isCancelModalOpen && selectedOrder && (
        <div className="hiyaghar-modal-overlay" onClick={() => setIsCancelModalOpen(false)}>
          <div className="hiyaghar-modal-card hiyaghar-cancel-order-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="hiyaghar-modal-header">
              <h3>Cancel Order #{selectedOrder.id}</h3>
              <button type="button" className="close-btn" onClick={() => setIsCancelModalOpen(false)}>
                ✕
              </button>
            </div>

            <div className="cancel-order-modal-body">
              <h4 className="reason-heading">Reason For Cancellation</h4>
              <div className="cancellation-reasons-list">
                {[
                  'I have changed my mind',
                  'Expected delivery time is very long',
                  'I want to change address for the order',
                  'I want to convert my order to Prepaid',
                  'Price for the product has decreased',
                  'I have purchased the product elsewhere',
                ].map((reasonText) => (
                  <label key={reasonText} className="cancel-radio-option">
                    <input
                      type="radio"
                      name="cancelReasonRadio"
                      value={reasonText}
                      checked={cancelReason === reasonText}
                      onChange={() => setCancelReason(reasonText)}
                    />
                    <span>{reasonText}</span>
                  </label>
                ))}
              </div>

              <div className="refund-status-notice mt-3">
                <h4>Refund status</h4>
                <p>
                  {selectedOrder.paymentMethod.name === 'Cash on Delivery'
                    ? 'There will be no refund as the order is purchased using Cash-On-Delivery'
                    : 'Refund will be initiated to your original payment method upon cancellation confirmation.'}
                </p>
              </div>

              {cancelError && <p className="hiyaghar-cancel-order-modal-error">{cancelError}</p>}

              <div className="hiyaghar-cancel-order-modal-actions mt-3">
                <button
                  type="button"
                  className="hiyaghar-panel-btn secondary"
                  onClick={() => setIsCancelModalOpen(false)}
                  disabled={isCancelling}
                >
                  Keep Order
                </button>
                <button
                  type="button"
                  className="hiyaghar-panel-btn danger"
                  onClick={handleConfirmCancelOrder}
                  disabled={isCancelling}
                >
                  {isCancelling ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
