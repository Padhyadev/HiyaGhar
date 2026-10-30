import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '../../components/layout/Header/Header';
import { Footer } from '../../components/layout/Footer/Footer';
import { CartService } from '../../cart';
import type { CartItem } from '../../cart';
import { ShippingService, DELIVERY_AREA_MESSAGE } from '../../services/shippingService';
import type { DeliveryOption, ShippingSettings } from '../../services/shippingService';
import { OrderService } from '../../services/orderService';
import type { ShippingAddress } from '../../services/orderService';
import { AddressService } from '../../services/addressService';
import type { UserAddress } from '../../services/addressService';
import { CustomerAuthService } from '../../services/customerAuthService';
import { CouponService } from '../../services/couponService';
import { CartApiService } from '../../services/cartApiService';
import type { AutoOfferResult } from '../../services/couponService';
import { MukhwasHero } from '../../components/mukhwas/MukhwasHero/MukhwasHero';
import { AnimatedNumber } from '../../components/common/AnimatedNumber';
import { allowOnlyDigits, sanitizeDigits } from '../../utils/validationUtils';
import { showToast } from '../../utils/alertService';
import { loadRazorpayScript } from '../../utils/razorpayLoader';
import { navigateTo } from '../../utils/navigation';
import { trackBeginCheckout } from '../../utils/analytics';
import './CheckoutPage.css';

const EMPTY_NEW_ADDRESS_FORM = {
  fullName: '',
  mobileNo: '',
  email: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  addressType: 'SHIPPING' as const,
  isDefault: false,
};

type BuyNowItem = NonNullable<Awaited<ReturnType<typeof CartApiService.resolveBuyNowItem>>> & { quantity: number };

const getItemsSubtotal = (items: CartItem[]) => items.reduce((acc, item) => acc + item.price * item.quantity, 0);

// Sent with the order request so the server orders just the Buy Now product
// (it is not in the server cart). Returns undefined for a normal whole-cart checkout.
const resolveBuyNowItem = async (items: CartItem[]): Promise<BuyNowItem | undefined> => {
  if (!CartService.isBuyNowCheckout() || items.length === 0) return undefined;
  const line = await CartApiService.resolveBuyNowItem(items[0].productId, items[0].weight);
  return line ? { ...line, quantity: items[0].quantity } : undefined;
};

interface CheckoutPageProps {
  onNavigateHome: () => void;
  onNavigateCart: () => void;
  onNavigateConfirmation: (orderId: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  onNavigateHome,
  onNavigateCart,
  onNavigateConfirmation,
}) => {
  // "Buy Now" (/checkout?buyNow=...) orders only that one item; otherwise the whole cart.
  const [cartItems, setCartItems] = useState<CartItem[]>(CartService.getCheckoutItems());
  const [subtotal, setSubtotal] = useState<number>(getItemsSubtotal(CartService.getCheckoutItems()));
  const loginRedirectPath = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;

  // 3-Step Checkout Progress: 1 = Address, 2 = Payment, 3 = Review
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Guest checkout: a signed-out shopper first gives contact details, which
  // starts a guest session; after that the normal address/order flow runs on it.
  const isGuest = !CustomerAuthService.isLoggedIn();
  const [guestReady, setGuestReady] = useState<boolean>(CustomerAuthService.isGuestSession());
  const [guestForm, setGuestForm] = useState(() => {
    const guest = CustomerAuthService.getGuestCustomer();
    return {
      firstName: guest?.firstName || '',
      lastName: guest?.lastName || '',
      email: guest?.email || '',
      mobileNo: guest?.mobileNo || '',
    };
  });
  const [guestErrors, setGuestErrors] = useState<Record<string, string>>({});
  const [guestNotice, setGuestNotice] = useState<{ message: string; accountExists: boolean } | null>(null);
  const [isStartingGuest, setIsStartingGuest] = useState<boolean>(false);

  // Saved Addresses State (Shipping Addresses ONLY)
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>(AddressService.getShippingAddresses());
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isAddNewAddressOpen, setIsAddNewAddressOpen] = useState<boolean>(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // New Address Form Fields
  const [newAddressForm, setNewAddressForm] = useState({
    fullName: '',
    mobileNo: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    addressType: 'SHIPPING' as const,
    isDefault: false,
  });
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});

  // Form Fields for Step 1 Address
  const [addressForm, setAddressForm] = useState<ShippingAddress>({
    fullName: '',
    mobile: '',
    email: '',
    pincode: '',
    address: '',
    city: '',
    state: '',
  });

  // Live shipping settings state (refreshed from localStorage on every change)
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>(ShippingService.getSettings());

  // Delivery State (Standard Delivery)
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOption | null>(null);

  // Payment Options for Step 3: 'razorpay' (Online: UPI, Cards, NetBanking) vs 'cod' (Cash on Delivery)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');

  // Place Order Loading & Error State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Automatic offer (no coupon code); the server prices it again when the order is placed.
  const [offer, setOffer] = useState<AutoOfferResult>({ applied: null, next: null });
  const appliedOffer = offer.applied;
  const nextOffer = offer.next;

  // Reward coins
  const [rewardBalance, setRewardBalance] = useState<number>(0);
  const [coinToRupeeRate, setCoinToRupeeRate] = useState<number>(1);
  const [maxCoinUsagePercent, setMaxCoinUsagePercent] = useState<number>(10);
  const [useRewardCoins, setUseRewardCoins] = useState<boolean>(false);

  // Helper to sync selected saved address into addressForm
  const selectSavedAddress = (addr: UserAddress) => {
    setSelectedAddressId(addr.id);
    const customer = CustomerAuthService.getCheckoutCustomer();
    setAddressForm({
      fullName: addr.fullName,
      mobile: addr.mobileNo,
      email: customer?.email || '',
      pincode: addr.postalCode,
      address: addr.addressLine1 + (addr.addressLine2 ? `, ${addr.addressLine2}` : ''),
      city: addr.city,
      state: addr.state,
    });
    // Check pincode serviceability without modifying city/state
    if (addr.postalCode && addr.postalCode.length === 6) {
      if (!ShippingService.isDeliverablePincode(addr.postalCode.trim())) {
        setAddressErrors((prev) => ({
          ...prev,
          postalCode: DELIVERY_AREA_MESSAGE,
        }));
      } else {
        setAddressErrors((prev) => ({
          ...prev,
          postalCode: '',
        }));
      }
    }
  };

  // Helper: reload delivery options fresh from current localStorage settings
  const reloadDeliveryOptions = useCallback((currentSubtotal: number) => {
    const freshSettings = ShippingService.getSettings();
    setShippingSettings(freshSettings);
    const options = ShippingService.getDeliveryOptions(currentSubtotal);
    return options;
  }, []);

  useEffect(() => {
    const items = CartService.getCheckoutItems();
    const currentSubtotal = getItemsSubtotal(items);
    setCartItems(items);
    setSubtotal(currentSubtotal);
    trackBeginCheckout(items.map((i) => ({ productId: i.productId, name: i.name, price: i.price, quantity: i.quantity, variant: i.weight })));

    // Load shipping settings from DB API (so customer sees latest admin-configured values)
    ShippingService.loadSettingsFromApi().then((freshSettings) => {
      setShippingSettings(freshSettings);
      const options = ShippingService.getDeliveryOptions(currentSubtotal);
      setSelectedDelivery((prev) => {
        if (prev) return options.find((o) => o.id === prev.id) || options[0] || null;
        return options[0] || null;
      });
    });

    // Also load from cache immediately for instant display
    const options = reloadDeliveryOptions(currentSubtotal);
    if (options.length > 0 && !selectedDelivery) {
      setSelectedDelivery(options[0]);
    }

    const customer = CustomerAuthService.getCheckoutCustomer();

    // Load shipping addresses — from the server when logged in (or mid guest
    // checkout), otherwise none: a new guest enters one after their contact details.
    const loadAddresses = async () => {
      if (!customer) return;
      const shippingAddrs = (await AddressService.fetchAddressesFromApi(customer.customerId)).filter((a) => a.addressType === 'SHIPPING');
      setSavedAddresses(shippingAddrs);
      if (shippingAddrs.length > 0) {
        const defaultAddr = shippingAddrs.find((a) => a.isDefault) || shippingAddrs[0];
        selectSavedAddress(defaultAddr);
      }
    };
    loadAddresses();

    // Load reward balance + settings when logged in (guests have no coins).
    if (CustomerAuthService.isLoggedIn()) {
      fetch('/api/reward/settings')
        .then((r) => r.json())
        .then((data) => {
          if (data?.isSuccess && data.settings) {
            setCoinToRupeeRate(data.settings.coinToRupeeRate || 1);
            setMaxCoinUsagePercent(data.settings.maxCoinUsagePercent || 10);
          }
        })
        .catch(() => {});

      fetch('/api/reward/my-ledger', { headers: CustomerAuthService.getAuthHeaders() })
        .then((r) => r.json())
        .then((data) => {
          if (data?.isSuccess) setRewardBalance(data.balance || 0);
        })
        .catch(() => {});
    }

    // Redirect to cart if cart is empty
    if (items.length === 0) {
      onNavigateCart();
    }

    window.scrollTo(0, 0);

    // Listen for shipping settings changes (e.g. admin updates in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hiyaghar_shipping_settings') {
        const freshOpts = reloadDeliveryOptions(getItemsSubtotal(CartService.getCheckoutItems()));
        setSelectedDelivery((prev) => {
          if (!prev) return freshOpts[0] || null;
          const updated = freshOpts.find((o) => o.id === prev.id);
          return updated || freshOpts[0] || null;
        });
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Re-price the offer when the cart changes or a guest session starts (the token decides
  // first-order-only and per-customer limits).
  useEffect(() => {
    let cancelled = false;
    CouponService.getAutoOffer(subtotal).then((result) => {
      if (!cancelled) setOffer(result);
    });
    return () => { cancelled = true; };
  }, [subtotal, guestReady]);

  const handleGuestContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = {
      firstName: guestForm.firstName.trim(),
      lastName: guestForm.lastName.trim(),
      email: guestForm.email.trim(),
      mobileNo: guestForm.mobileNo.trim(),
    };
    const errors: Record<string, string> = {};
    if (!form.firstName) errors.firstName = 'Please enter first name';
    if (!form.lastName) errors.lastName = 'Please enter last name';
    if (!form.email) {
      errors.email = 'Please enter email address';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!form.mobileNo) {
      errors.mobileNo = 'Please enter mobile number';
    } else if (form.mobileNo.length !== 10) {
      errors.mobileNo = 'Please enter valid 10-digit mobile number';
    }
    setGuestErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsStartingGuest(true);
    setGuestNotice(null);
    const countItems = () => CartService.getCheckoutItems().reduce((acc, item) => acc + item.quantity, 0);
    const itemCountBefore = countItems();
    const result = await CustomerAuthService.startGuestCheckout(form);
    setIsStartingGuest(false);

    if (!result.success) {
      setGuestNotice({ message: result.message || 'Could not continue as guest. Please try again.', accountExists: !!result.accountExists });
      return;
    }

    // The cart now comes from the server, which only holds what is in stock.
    const items = CartService.getCheckoutItems();
    setCartItems(items);
    setSubtotal(getItemsSubtotal(items));
    if (items.length === 0) {
      showToast('Sorry, the items in your cart are no longer available.', 'error');
      onNavigateCart();
      return;
    }
    if (countItems() < itemCountBefore) {
      showToast('Some items in your cart were updated to match available stock.', 'info');
    }

    setGuestReady(true);
    setSavedAddresses([]);
    setNewAddressForm({ ...EMPTY_NEW_ADDRESS_FORM, fullName: `${form.firstName} ${form.lastName}`, mobileNo: form.mobileNo });
    setAddressErrors({});
    setEditingAddressId(null);
    setSelectedAddressId('NEW_ADDRESS');
    setIsAddNewAddressOpen(true);
  };

  // Lets a guest go back and change their contact details (starts a fresh guest session).
  const handleEditGuestDetails = () => {
    CustomerAuthService.endGuestSession();
    setGuestReady(false);
    setSavedAddresses([]);
    setSelectedAddressId('');
    setIsAddNewAddressOpen(false);
    setAddressForm({ fullName: '', mobile: '', email: '', pincode: '', address: '', city: '', state: '' });
  };

  const discountAmount = appliedOffer?.discountAmount || 0;

  // Free shipping is judged on the price after coupon discount, so re-evaluate
  // the delivery options whenever the subtotal, coupon or settings change.
  useEffect(() => {
    if (subtotal <= 0) return;
    const options = ShippingService.getDeliveryOptions(Math.max(0, subtotal - discountAmount));
    setSelectedDelivery((prev) => (prev ? options.find((o) => o.id === prev.id) || options[0] || null : options[0] || null));
  }, [subtotal, discountAmount, shippingSettings]);

  const maxRedeemableCoins = Math.min(
    rewardBalance,
    Math.floor(Math.max(0, subtotal - discountAmount) * (maxCoinUsagePercent / 100) / Math.max(coinToRupeeRate, 0.01))
  );
  const coinDiscount = useRewardCoins ? Math.round(maxRedeemableCoins * coinToRupeeRate * 100) / 100 : 0;

  // Dropdown Change Handler
  const handleDropdownAddressChange = (val: string) => {
    if (val === 'NEW_ADDRESS') {
      setSelectedAddressId('NEW_ADDRESS');
      setEditingAddressId(null);
      setNewAddressForm({
        fullName: '',
        mobileNo: '',
        email: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        addressType: 'SHIPPING' as const,
        isDefault: false,
      });
      setIsAddNewAddressOpen(true);
    } else {
      setIsAddNewAddressOpen(false);
      setEditingAddressId(null);
      const chosen = savedAddresses.find((a) => a.id === val);
      if (chosen) {
        selectSavedAddress(chosen);
      }
    }
  };

  // Open Edit Form for an existing address
  const handleEditAddressClick = (addr: UserAddress, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAddressId(addr.id);
    setNewAddressForm({
      fullName: addr.fullName,
      mobileNo: addr.mobileNo,
      email: '',
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || '',
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      addressType: 'SHIPPING',
      isDefault: addr.isDefault,
    });
    setAddressErrors({});
    setIsAddNewAddressOpen(true);
  };

  // Submit New or Edited Address Handler
  const handleSaveNewAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!newAddressForm.fullName.trim()) {
      errors.fullName = 'Please enter full name';
    }
    if (!newAddressForm.mobileNo.trim()) {
      errors.mobileNo = 'Please enter mobile number';
    } else if (newAddressForm.mobileNo.trim().length !== 10) {
      errors.mobileNo = 'Please enter valid 10-digit mobile number';
    }
    if (!newAddressForm.addressLine1.trim()) {
      errors.addressLine1 = 'Please enter address line 1';
    }
    if (!newAddressForm.postalCode.trim()) {
      errors.postalCode = 'Please enter pincode';
    } else if (newAddressForm.postalCode.trim().length !== 6) {
      errors.postalCode = 'Please enter valid 6-digit pincode';
    } else if (!ShippingService.isDeliverablePincode(newAddressForm.postalCode.trim())) {
      errors.postalCode = DELIVERY_AREA_MESSAGE;
    }
    if (!newAddressForm.city.trim()) {
      errors.city = 'Please enter city';
    }
    if (!newAddressForm.state.trim()) {
      errors.state = 'Please enter state';
    }

    if (Object.keys(errors).length > 0) {
      setAddressErrors(errors);
      if (errors.postalCode && !ShippingService.isDeliverablePincode(newAddressForm.postalCode.trim())) {
        showToast(DELIVERY_AREA_MESSAGE, 'error');
      }
      return;
    }
    setAddressErrors({});

    const customer = CustomerAuthService.getCheckoutCustomer();
    const addressPayload = {
      id: editingAddressId || undefined,
      fullName: newAddressForm.fullName.trim(),
      mobileNo: newAddressForm.mobileNo.trim(),
      addressLine1: newAddressForm.addressLine1.trim(),
      addressLine2: newAddressForm.addressLine2.trim(),
      city: newAddressForm.city.trim(),
      state: newAddressForm.state.trim(),
      postalCode: newAddressForm.postalCode.trim(),
      addressType: 'SHIPPING' as const,
      isDefault: newAddressForm.isDefault,
    };

    if (customer) {
      const ok = await AddressService.saveAddressApi(addressPayload, customer.customerId);
      if (!ok) {
        showToast(customer.isGuest ? 'Could not save this address. Please try again.' : 'Could not save address to your account. Please try again.');
        return;
      }
      const updated = (await AddressService.fetchAddressesFromApi(customer.customerId)).filter((a) => a.addressType === 'SHIPPING');
      setSavedAddresses(updated);
      const newlySelected = updated.find((a) => (editingAddressId ? a.id === editingAddressId : a.addressLine1 === addressPayload.addressLine1 && a.postalCode === addressPayload.postalCode)) || updated[0];
      if (newlySelected) selectSavedAddress(newlySelected);
    } else {
      if (editingAddressId) {
        AddressService.updateAddress(editingAddressId, addressPayload);
      } else {
        AddressService.addAddress(addressPayload);
      }
      const updated = AddressService.getShippingAddresses();
      setSavedAddresses(updated);
      const newlySelected = updated.find((a) => (editingAddressId ? a.id === editingAddressId : a.addressLine1 === addressPayload.addressLine1 && a.postalCode === addressPayload.postalCode)) || updated[0];
      if (newlySelected) selectSavedAddress(newlySelected);
    }

    setIsAddNewAddressOpen(false);
    const wasEditing = !!editingAddressId;
    setEditingAddressId(null);
    showToast(wasEditing ? 'Address updated successfully!' : 'New shipping address saved & selected!');
  };

  // Handle Pincode Check & Auto-Fill City & State
  const handlePincodeBlur = async (pin: string) => {
    if (pin.trim().length === 6) {
      if (!ShippingService.isDeliverablePincode(pin.trim())) {
        setAddressErrors((prev) => ({
          ...prev,
          postalCode: DELIVERY_AREA_MESSAGE,
        }));
        showToast(DELIVERY_AREA_MESSAGE, 'error');
      }
      const res = await ShippingService.lookupPincode(pin);
      if (res.found && (res.city || res.state)) {
        setAddressForm((prev) => ({
          ...prev,
          city: res.city || prev.city,
          state: res.state || prev.state,
        }));
        setNewAddressForm((prev) => ({
          ...prev,
          city: res.city || prev.city,
          state: res.state || prev.state,
        }));
      }
    }
  };

  // Step 1 Validation
  const validateAddressForm = (): boolean => {
    if (!addressForm.fullName.trim()) return false;
    if (!addressForm.mobile.trim()) return false;
    if (!addressForm.address.trim()) return false;
    if (!addressForm.city.trim()) return false;
    if (!addressForm.pincode.trim()) {
      showToast('Please enter delivery pincode.', 'error');
      return false;
    }
    if (!ShippingService.isDeliverablePincode(addressForm.pincode.trim())) {
      showToast(DELIVERY_AREA_MESSAGE, 'error');
      return false;
    }
    return true;
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateAddressForm()) {
      setCurrentStep(2);
      window.scrollTo(0, 200);
    }
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep(3);
    window.scrollTo(0, 200);
  };

  // Online Razorpay Payment handler
  const handleOnlineRazorpayPayment = async (numericAddressId: number, customer: any, buyNowItem: BuyNowItem | undefined) => {
    try {
      // 1. Create Razorpay order on backend
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: CustomerAuthService.getAuthHeaders(),
        body: JSON.stringify({
          customerAddressId: numericAddressId,
          useRewardCoins: useRewardCoins ? maxRedeemableCoins : 0,
          deliveryType: selectedDelivery?.id || 'standard',
          buyNowItem,
        }),
      });

      const orderData = await res.json();
      if (!res.ok || !orderData.isSuccess) {
        setIsSubmitting(false);
        setSubmitError(orderData.message || 'Could not initiate online payment. Please try again.');
        return;
      }

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !(window as any).Razorpay) {
        setIsSubmitting(false);
        setSubmitError('Razorpay payment gateway failed to load. Please check your connection and try again.');
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amountInPaise,
        currency: orderData.currency || 'INR',
        name: 'HIYAGHAR',
        description: 'Authentic Traditional Delicacies & Handmade Products',
        order_id: orderData.razorpayOrderId,
        prefill: {
          name: addressForm.fullName || `${customer.firstName} ${customer.lastName}`,
          email: addressForm.email || customer.email || '',
          contact: addressForm.mobile || customer.mobileNo || '',
        },
        theme: {
          color: '#11223A',
        },
        handler: async function (response: any) {
          try {
            // 2. Verify signature on backend & place order
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: CustomerAuthService.getAuthHeaders(),
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                customerAddressId: numericAddressId,
                useRewardCoins: useRewardCoins ? maxRedeemableCoins : 0,
                deliveryType: selectedDelivery?.id || 'standard',
                buyNowItem,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.isSuccess) {
              const serverShippingFee = verifyData.deliveryFee ?? selectedDelivery?.price ?? 0;
              const serverSubtotal = verifyData.subtotal ?? subtotal;
              const serverDiscount = (verifyData.discountAmount ?? discountAmount) + (verifyData.coinDiscountAmount ?? coinDiscount);
              const serverTotal = verifyData.totalAmount ?? finalTotal;
              const tax = Math.round(Math.max(0, serverSubtotal - serverDiscount) * 0.05);

              OrderService.createOrder({
                items: cartItems,
                shippingAddress: addressForm,
                deliveryOption: {
                  id: selectedDelivery?.id || 'standard',
                  name: selectedDelivery?.name || 'Standard Delivery',
                  estimatedDays: selectedDelivery?.estimatedDays || '2-3 Days',
                  price: serverShippingFee,
                },
                paymentMethod: { id: 'online', name: 'Razorpay Online Payment', details: `Payment ID: ${response.razorpay_payment_id}` },
                subtotal: serverSubtotal,
                discount: serverDiscount,
                couponCode: appliedOffer?.label,
                shippingFee: serverShippingFee,
                tax,
                total: serverTotal,
                orderNumber: verifyData.orderNumber,
              });

              CartService.finishCheckout();
              showToast('Payment successful! Your order has been placed.', 'success');
              onNavigateConfirmation(verifyData.orderNumber);
            } else {
              setIsSubmitting(false);
              setSubmitError(verifyData.message || 'Payment verification failed. Please contact support.');
            }
          } catch (verErr: any) {
            setIsSubmitting(false);
            setSubmitError('Failed to verify payment with server. Please contact support.');
          }
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
            showToast('Payment was cancelled.', 'info');
          },
        },
      };

      const rzpInstance = new (window as any).Razorpay(options);
      rzpInstance.on('payment.failed', function (resp: any) {
        setIsSubmitting(false);
        setSubmitError(resp.error?.description || 'Payment transaction failed. Please try again.');
        showToast('Payment failed: ' + (resp.error?.description || 'Transaction error'), 'error');
      });
      rzpInstance.open();
    } catch (err: any) {
      setIsSubmitting(false);
      setSubmitError('An error occurred during payment processing: ' + err.message);
    }
  };

  // Cash on Delivery handler
  const handleCodPayment = async (numericAddressId: number, buyNowItem: BuyNowItem | undefined) => {
    try {
      const res = await fetch('/api/order/checkout', {
        method: 'POST',
        headers: CustomerAuthService.getAuthHeaders(),
        body: JSON.stringify({
          customerAddressId: numericAddressId,
          useRewardCoins: useRewardCoins ? maxRedeemableCoins : 0,
          deliveryType: selectedDelivery?.id || 'standard',
          buyNowItem,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.isSuccess) {
        setIsSubmitting(false);
        setSubmitError(data.message || 'Failed to place order. Please try again.');
        return;
      }

      const serverShippingFee = data.deliveryFee ?? selectedDelivery?.price ?? 0;
      const serverSubtotal = data.subtotal ?? subtotal;
      const serverDiscount = (data.discountAmount ?? discountAmount) + (data.coinDiscountAmount ?? coinDiscount);
      const serverTotal = data.totalAmount ?? finalTotal;
      const tax = Math.round(Math.max(0, serverSubtotal - serverDiscount) * 0.05);

      OrderService.createOrder({
        items: cartItems,
        shippingAddress: addressForm,
        deliveryOption: {
          id: selectedDelivery?.id || 'standard',
          name: selectedDelivery?.name || 'Standard Delivery',
          estimatedDays: selectedDelivery?.estimatedDays || '2-3 Days',
          price: serverShippingFee,
        },
        paymentMethod: { id: 'cod', name: 'Cash on Delivery', details: 'Cash on Delivery (COD)' },
        subtotal: serverSubtotal,
        discount: serverDiscount,
        couponCode: appliedOffer?.label,
        shippingFee: serverShippingFee,
        tax,
        total: serverTotal,
        orderNumber: data.orderNumber,
      });

      CartService.finishCheckout();
      showToast('Order placed successfully!', 'success');
      onNavigateConfirmation(data.orderNumber);
    } catch (err: any) {
      setIsSubmitting(false);
      setSubmitError('Failed to place order. Please check your connection and try again.');
    }
  };

  // PLACE ORDER SUBMISSION
  const handlePlaceOrder = async () => {
    if (!selectedDelivery) return;

    const customer = CustomerAuthService.getCheckoutCustomer();
    if (!customer) {
      setSubmitError('Your checkout session has expired. Please enter your details again.');
      setGuestReady(false);
      setCurrentStep(1);
      return;
    }

    const numericAddressId = Number(selectedAddressId);
    if (!selectedAddressId || Number.isNaN(numericAddressId) || selectedAddressId === 'NEW_ADDRESS') {
      setSubmitError('Please select a saved delivery address.');
      return;
    }

    const currentSelectedAddr = savedAddresses.find((a) => a.id === selectedAddressId);
    if (currentSelectedAddr && !ShippingService.isDeliverablePincode(currentSelectedAddr.postalCode)) {
      setSubmitError(`${DELIVERY_AREA_MESSAGE} Please select an address in our delivery area.`);
      showToast(DELIVERY_AREA_MESSAGE, 'error');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    // Never fall back to ordering the whole cart when this is a Buy Now checkout.
    const buyNowItem = await resolveBuyNowItem(cartItems);
    if (CartService.isBuyNowCheckout() && !buyNowItem) {
      setIsSubmitting(false);
      setSubmitError('Could not load this item. Please refresh the page and try again.');
      return;
    }

    if (selectedPaymentMethod === 'razorpay') {
      await handleOnlineRazorpayPayment(numericAddressId, customer, buyNowItem);
    } else {
      await handleCodPayment(numericAddressId, buyNowItem);
    }
  };

  // Dynamic Calculations for Order Summary (GST settings from Admin — reactive via shippingSettings state)
  const gstPercent = shippingSettings.gstPercent ?? 5;
  const enableGstDisplay = shippingSettings.enableGstDisplay ?? true;
  const gstLabel = shippingSettings.gstLabel || `Estimated GST (${gstPercent}% Included)`;
  const shippingFee = selectedDelivery ? selectedDelivery.price : 0;
  const taxableSubtotal = Math.max(0, subtotal - discountAmount - coinDiscount);
  const taxAmount = Math.round(taxableSubtotal * (gstPercent / 100));
  const finalTotal = Math.max(0, subtotal - discountAmount - coinDiscount + shippingFee);

  return (
    <div className="hiyaghar-checkout-page-layout">
      <Header />

      <main id="main-content" tabIndex={-1} className="hiyaghar-checkout-main">
        <MukhwasHero
          onNavigateHome={onNavigateHome}
          breadcrumbCurrent="Checkout"
          title="Checkout"
          bgImage="/image/Banner_image/Checkout.webp"
        />

        <div className="hiyaghar-container">
          {/* Breadcrumb */}
          <nav className="hiyaghar-checkout-breadcrumb" aria-label="Breadcrumb">
            <ol className="hiyaghar-checkout-breadcrumb-list">
              <li>
                <a href="#/" onClick={(e) => { e.preventDefault(); onNavigateHome(); }}>
                  Home
                </a>
              </li>
              <li className="sep">/</li>
              <li>
                <a href="#/cart" onClick={(e) => { e.preventDefault(); onNavigateCart(); }}>
                  Cart
                </a>
              </li>
              <li className="sep">/</li>
              <li className="current">Checkout</li>
            </ol>
          </nav>

          {/* 12. STEP PROGRESS INDICATOR */}
          <div className="hiyaghar-checkout-stepper">
            <div className={`hiyaghar-step-item ${currentStep === 1 ? 'is-active' : currentStep > 1 ? 'is-complete' : ''}`}>
              <span className="hiyaghar-step-num">{currentStep > 1 ? '✓' : '01'}</span>
              <span className="hiyaghar-step-label">Address</span>
            </div>
            <div className="hiyaghar-step-line" />
            <div className={`hiyaghar-step-item ${currentStep === 2 ? 'is-active' : currentStep > 2 ? 'is-complete' : ''}`}>
              <span className="hiyaghar-step-num">{currentStep > 2 ? '✓' : '02'}</span>
              <span className="hiyaghar-step-label">Payment</span>
            </div>
            <div className="hiyaghar-step-line" />
            <div className={`hiyaghar-step-item ${currentStep === 3 ? 'is-active' : ''}`}>
              <span className="hiyaghar-step-num">03</span>
              <span className="hiyaghar-step-label">Review</span>
            </div>
          </div>

          <div className="hiyaghar-checkout-grid">
            {/* LEFT COLUMN — Step Forms */}
            <div className="hiyaghar-checkout-left-col">
              {/* STEP 1 (SIGNED-OUT): LOG IN OR CONTINUE AS GUEST */}
              {currentStep === 1 && isGuest && !guestReady && (
                <div className="hiyaghar-checkout-card">
                  <div className="hiyaghar-checkout-card-header">
                    <h2 className="hiyaghar-card-title">01. Contact Details</h2>
                  </div>

                  <div className="hiyaghar-guest-login-prompt">
                    <span>Already have an account? Log in to use your saved addresses and reward coins.</span>
                    <button
                      type="button"
                      className="hiyaghar-guest-login-btn"
                      onClick={() => navigateTo(loginRedirectPath)}
                    >
                      Log In
                    </button>
                  </div>

                  <p className="hiyaghar-guest-intro">Or check out as a guest. We'll send your order updates to this email and mobile number.</p>

                  <form onSubmit={handleGuestContinue} className="hiyaghar-new-address-inline-form" noValidate>
                    <div className="hiyaghar-form-row">
                      <div className="hiyaghar-form-group">
                        <label htmlFor="guest-first-name">First Name *</label>
                        <input
                          id="guest-first-name"
                          type="text"
                          autoComplete="given-name"
                          value={guestForm.firstName}
                          className={guestErrors.firstName ? 'has-error' : ''}
                          onChange={(e) => {
                            setGuestForm({ ...guestForm, firstName: e.target.value });
                            if (guestErrors.firstName) setGuestErrors((prev) => ({ ...prev, firstName: '' }));
                          }}
                        />
                        {guestErrors.firstName && <span className="field-error">{guestErrors.firstName}</span>}
                      </div>

                      <div className="hiyaghar-form-group">
                        <label htmlFor="guest-last-name">Last Name *</label>
                        <input
                          id="guest-last-name"
                          type="text"
                          autoComplete="family-name"
                          value={guestForm.lastName}
                          className={guestErrors.lastName ? 'has-error' : ''}
                          onChange={(e) => {
                            setGuestForm({ ...guestForm, lastName: e.target.value });
                            if (guestErrors.lastName) setGuestErrors((prev) => ({ ...prev, lastName: '' }));
                          }}
                        />
                        {guestErrors.lastName && <span className="field-error">{guestErrors.lastName}</span>}
                      </div>
                    </div>

                    <div className="hiyaghar-form-row">
                      <div className="hiyaghar-form-group">
                        <label htmlFor="guest-email">Email *</label>
                        <input
                          id="guest-email"
                          type="email"
                          autoComplete="email"
                          placeholder="you@example.com"
                          value={guestForm.email}
                          className={guestErrors.email ? 'has-error' : ''}
                          onChange={(e) => {
                            setGuestForm({ ...guestForm, email: e.target.value });
                            if (guestErrors.email) setGuestErrors((prev) => ({ ...prev, email: '' }));
                          }}
                        />
                        {guestErrors.email && <span className="field-error">{guestErrors.email}</span>}
                      </div>

                      <div className="hiyaghar-form-group">
                        <label htmlFor="guest-mobile">Mobile Number *</label>
                        <input
                          id="guest-mobile"
                          type="tel"
                          autoComplete="tel-national"
                          maxLength={10}
                          placeholder="10-digit mobile number"
                          value={guestForm.mobileNo}
                          className={guestErrors.mobileNo ? 'has-error' : ''}
                          onKeyDown={allowOnlyDigits}
                          onChange={(e) => {
                            setGuestForm({ ...guestForm, mobileNo: sanitizeDigits(e.target.value) });
                            if (guestErrors.mobileNo) setGuestErrors((prev) => ({ ...prev, mobileNo: '' }));
                          }}
                        />
                        {guestErrors.mobileNo && <span className="field-error">{guestErrors.mobileNo}</span>}
                      </div>
                    </div>

                    {guestNotice && (
                      <div className="hiyaghar-guest-notice" role="alert">
                        <span>{guestNotice.message}</span>
                        {guestNotice.accountExists && (
                          <button
                            type="button"
                            className="hiyaghar-guest-login-btn"
                            onClick={() => navigateTo(loginRedirectPath)}
                          >
                            Log In
                          </button>
                        )}
                      </div>
                    )}

                    <button type="submit" className="hiyaghar-step-continue-btn" disabled={isStartingGuest}>
                      {isStartingGuest ? 'Please wait...' : 'Continue as Guest →'}
                    </button>
                  </form>
                </div>
              )}

              {/* STEP 1: ADDRESS */}
              {currentStep === 1 && (!isGuest || guestReady) && (
                <div className="hiyaghar-checkout-card">
                  {isGuest && (
                    <div className="hiyaghar-guest-login-prompt">
                      <span>
                        Checking out as guest: <strong>{guestForm.firstName} {guestForm.lastName}</strong> · {guestForm.email} · {guestForm.mobileNo}
                      </span>
                      <button type="button" className="hiyaghar-guest-login-btn" onClick={handleEditGuestDetails}>
                        Change
                      </button>
                    </div>
                  )}
                  <div className="hiyaghar-checkout-card-header">
                    <h2 className="hiyaghar-card-title">01. Delivery Address</h2>
                    <button
                      type="button"
                      className="hiyaghar-add-address-quick-btn"
                      onClick={() => {
                        setSelectedAddressId('NEW_ADDRESS');
                        setIsAddNewAddressOpen(true);
                      }}
                    >
                      + Add Delivery Address
                    </button>
                  </div>

                  {/* ADDRESS SELECTOR DROPDOWN (Shipping Addresses Only) */}
                  {savedAddresses.length > 0 && (
                  <div className="hiyaghar-address-dropdown-wrapper">
                    <label className="hiyaghar-field-label">Select Saved Shipping Address:</label>
                    <select
                      className="hiyaghar-address-select-control"
                      value={selectedAddressId}
                      onChange={(e) => handleDropdownAddressChange(e.target.value)}
                    >
                      {savedAddresses.map((addr) => (
                        <option key={addr.id} value={addr.id}>
                          {addr.fullName} — {addr.addressLine1}, {addr.city} ({addr.postalCode}) {addr.isDefault ? ' [DEFAULT]' : ''}
                        </option>
                      ))}
                      <option value="NEW_ADDRESS">+ Add New Delivery Address...</option>
                    </select>
                  </div>
                  )}

                  {/* SAVED ADDRESSES CARDS (Quick Select Grid) */}
                  {!isAddNewAddressOpen && selectedAddressId !== 'NEW_ADDRESS' && savedAddresses.length > 0 && (
                    <div className="hiyaghar-checkout-address-cards-grid">
                      {savedAddresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <div
                            key={addr.id}
                            className={`hiyaghar-checkout-addr-card ${isSelected ? 'is-selected' : ''}`}
                            onClick={() => handleDropdownAddressChange(addr.id)}
                          >
                            <div className="addr-card-top">
                              <span className={`addr-tag ${addr.addressType.toLowerCase()}`}>{addr.addressType}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                  type="button"
                                  className="hiyaghar-addr-edit-trigger"
                                  title="Edit this address"
                                  onClick={(e) => handleEditAddressClick(addr, e)}
                                >
                                  <i className="fa-solid fa-pen-to-square" style={{ marginRight: '4px' }}></i>
                                  Edit
                                </button>
                                {isSelected && <span className="selected-badge"><i className="fa-solid fa-check" aria-hidden="true"></i> SELECTED</span>}
                              </div>
                            </div>
                            <h4 className="addr-name">{addr.fullName}</h4>
                            <p className="addr-text">
                              {addr.addressLine1}
                              {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}<br />
                              {addr.city}, {addr.state} - {addr.postalCode}
                            </p>
                            <span className="addr-mobile">
                              <i className="fa-solid fa-phone" aria-hidden="true" style={{ marginRight: '6px', color: 'var(--hiya-gold-text, #855F0F)' }}></i>
                              {addr.mobileNo}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* FORM A: NEW OR EDIT DELIVERY ADDRESS FORM */}
                  {(isAddNewAddressOpen || selectedAddressId === 'NEW_ADDRESS') ? (
                    <form onSubmit={handleSaveNewAddressSubmit} className="hiyaghar-new-address-inline-form animate-fade-in" noValidate>
                      <div className="hiyaghar-new-form-header">
                        <h3>{editingAddressId ? 'Edit Delivery Address' : 'Add New Delivery Address'}</h3>
                        {!(isGuest && savedAddresses.length === 0) && (
                        <button
                          type="button"
                          className="hiyaghar-cancel-new-addr-btn"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsAddNewAddressOpen(false);
                            setEditingAddressId(null);
                            setAddressErrors({});
                            setNewAddressForm({
                              fullName: '',
                              mobileNo: '',
                              email: '',
                              addressLine1: '',
                              addressLine2: '',
                              city: '',
                              state: '',
                              postalCode: '',
                              addressType: 'SHIPPING' as const,
                              isDefault: false,
                            });
                            if (savedAddresses.length > 0) {
                              const fallbackAddr = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
                              selectSavedAddress(fallbackAddr);
                            } else {
                              setSelectedAddressId('');
                            }
                          }}
                        >
                          ✕ Cancel
                        </button>
                        )}
                      </div>

                      <div className="hiyaghar-form-row">
                        <div className="hiyaghar-form-group">
                          <label>Full Name *</label>
                          <input
                            type="text"
                            placeholder="e.g. Vishal Gami"
                            value={newAddressForm.fullName}
                            className={addressErrors.fullName ? 'has-error' : ''}
                            onChange={(e) => {
                              setNewAddressForm({ ...newAddressForm, fullName: e.target.value });
                              if (addressErrors.fullName) setAddressErrors((prev) => ({ ...prev, fullName: '' }));
                            }}
                          />
                          {addressErrors.fullName && <span className="field-error">{addressErrors.fullName}</span>}
                        </div>

                        <div className="hiyaghar-form-group">
                          <label>Mobile Number *</label>
                          <input
                            type="tel"
                            maxLength={10}
                            placeholder="10-digit mobile number"
                            value={newAddressForm.mobileNo}
                            className={addressErrors.mobileNo ? 'has-error' : ''}
                            onKeyDown={allowOnlyDigits}
                            onChange={(e) => {
                              setNewAddressForm({ ...newAddressForm, mobileNo: sanitizeDigits(e.target.value) });
                              if (addressErrors.mobileNo) setAddressErrors((prev) => ({ ...prev, mobileNo: '' }));
                            }}
                          />
                          {addressErrors.mobileNo && <span className="field-error">{addressErrors.mobileNo}</span>}
                        </div>
                      </div>

                      <div className="hiyaghar-form-row">
                        <div className="hiyaghar-form-group">
                          <label>Address Line 1 *</label>
                          <input
                            type="text"
                            placeholder="House / Flat No., Building, Street"
                            value={newAddressForm.addressLine1}
                            className={addressErrors.addressLine1 ? 'has-error' : ''}
                            onChange={(e) => {
                              setNewAddressForm({ ...newAddressForm, addressLine1: e.target.value });
                              if (addressErrors.addressLine1) setAddressErrors((prev) => ({ ...prev, addressLine1: '' }));
                            }}
                          />
                          {addressErrors.addressLine1 && <span className="field-error">{addressErrors.addressLine1}</span>}
                        </div>

                        <div className="hiyaghar-form-group">
                          <label>Address Line 2 (Optional)</label>
                          <input
                            type="text"
                            placeholder="Locality, Area, Landmark"
                            value={newAddressForm.addressLine2}
                            onChange={(e) => setNewAddressForm({ ...newAddressForm, addressLine2: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="hiyaghar-form-row">
                        <div className="hiyaghar-form-group">
                          <label>Pincode *</label>
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="6-digit pincode"
                            value={newAddressForm.postalCode}
                            className={addressErrors.postalCode ? 'has-error' : ''}
                            onKeyDown={allowOnlyDigits}
                            onBlur={(e) => handlePincodeBlur(e.target.value)}
                            onChange={(e) => {
                              const clean = sanitizeDigits(e.target.value);
                              if (clean.length < 6) {
                                setNewAddressForm((prev) => ({
                                  ...prev,
                                  postalCode: clean,
                                  city: '',
                                  state: '',
                                }));
                              } else {
                                setNewAddressForm((prev) => ({ ...prev, postalCode: clean }));
                                handlePincodeBlur(clean);
                              }
                              if (addressErrors.postalCode) setAddressErrors((prev) => ({ ...prev, postalCode: '' }));
                            }}
                          />
                          {addressErrors.postalCode && <span className="field-error">{addressErrors.postalCode}</span>}
                        </div>

                        <div className="hiyaghar-form-group">
                          <label>City *</label>
                          <input
                            type="text"
                            placeholder="e.g. Ahmedabad"
                            value={newAddressForm.city}
                            className={addressErrors.city ? 'has-error' : ''}
                            onChange={(e) => {
                              setNewAddressForm({ ...newAddressForm, city: e.target.value });
                              if (addressErrors.city) setAddressErrors((prev) => ({ ...prev, city: '' }));
                            }}
                          />
                          {addressErrors.city && <span className="field-error">{addressErrors.city}</span>}
                        </div>
                      </div>

                      <div className="hiyaghar-form-row">
                        <div className="hiyaghar-form-group">
                          <label>State *</label>
                          <input
                            type="text"
                            placeholder="e.g. Gujarat"
                            value={newAddressForm.state}
                            className={addressErrors.state ? 'has-error' : ''}
                            onChange={(e) => {
                              setNewAddressForm({ ...newAddressForm, state: e.target.value });
                              if (addressErrors.state) setAddressErrors((prev) => ({ ...prev, state: '' }));
                            }}
                          />
                          {addressErrors.state && <span className="field-error">{addressErrors.state}</span>}
                        </div>
                        <div />
                      </div>

                      {!isGuest && (
                      <div className="hiyaghar-checkbox-group" style={{ alignSelf: 'flex-start', marginTop: '4px', marginBottom: '8px' }}>
                        <label className="checkbox-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: 'var(--hiya-navy, #11223A)' }}>
                          <input
                            type="checkbox"
                            checked={newAddressForm.isDefault}
                            onChange={(e) => setNewAddressForm({ ...newAddressForm, isDefault: e.target.checked })}
                            style={{ width: '16px', height: '16px', accentColor: 'var(--hiya-gold-text, #855F0F)', cursor: 'pointer' }}
                          />
                          Make this my default shipping address
                        </label>
                      </div>
                      )}

                      <button type="submit" className="hiyaghar-save-address-btn">
                        <i className="fa-solid fa-floppy-disk" style={{ marginRight: '8px' }} aria-hidden="true"></i>
                        Save & Use This Address →
                      </button>
                    </form>
                  ) : (
                    /* FORM B: CONFIRM SELECTED ADDRESS FORM */
                    <form onSubmit={handleStep1Submit} className="hiyaghar-address-form" style={{ marginTop: '20px' }}>
                      {addressForm.fullName || addressForm.address ? (
                        <div className="hiyaghar-selected-summary-box">
                          <span className="summary-title">Selected Delivery Destination:</span>
                          <p className="summary-details">
                            <strong>{addressForm.fullName}</strong>
                            {addressForm.mobile && (
                              <>
                                {' • '}
                                <i className="fa-solid fa-phone" aria-hidden="true" style={{ color: 'var(--hiya-gold-text, #855F0F)', fontSize: '12px' }}></i>{' '}
                                {addressForm.mobile}
                              </>
                            )}
                            <br />
                            {[addressForm.address, addressForm.city, addressForm.state].filter(Boolean).join(', ')}
                            {addressForm.pincode ? ` - ${addressForm.pincode}` : ''}
                          </p>
                        </div>
                      ) : null}

                      <button type="submit" className="hiyaghar-step-continue-btn">
                        Continue to Payment →
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* STEP 2: PAYMENT METHOD */}
              {currentStep === 2 && (
                <div className="hiyaghar-checkout-card">
                  <div className="hiyaghar-checkout-card-header">
                    <h2 className="hiyaghar-card-title">02. Select Payment Method</h2>
                    <span className="hiyaghar-secure-badge">
                      <i className="fa-solid fa-lock" aria-hidden="true" style={{ color: 'var(--hiya-gold-text, #855F0F)', marginRight: '6px' }}></i>
                      256-Bit Razorpay Encrypted
                    </span>
                  </div>

                  <form onSubmit={handleStep2Submit} className="hiyaghar-payment-form">
                    <div className="hiyaghar-payment-methods-grid">
                      {/* RAZORPAY ONLINE PAYMENT (UPI, Cards, NetBanking, Wallets) */}
                      <label className={`hiyaghar-payment-method-item ${selectedPaymentMethod === 'razorpay' ? 'is-selected' : ''}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={selectedPaymentMethod === 'razorpay'}
                          onChange={() => setSelectedPaymentMethod('razorpay')}
                        />
                        <div className="hiyaghar-pm-content" style={{ width: '100%' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <span className="hiyaghar-pm-title">Pay Online (Instant & Secure)</span>
                            <span style={{ fontSize: '12px', background: '#E8F8F5', color: '#117A65', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                              RECOMMENDED
                            </span>
                          </div>
                          <span className="hiyaghar-pm-sub">
                            UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, Net Banking & Wallets
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 700, color: '#0c2340', background: '#eef2f6', padding: '3px 8px', borderRadius: '4px', border: '1px solid #d5dfea' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0c2340" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                              Razorpay Trusted Business
                            </span>
                            <span style={{ fontSize: '12px', color: '#556987', fontWeight: 600, background: '#f8fafc', padding: '3px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                              UPI • Cards • NetBanking
                            </span>
                          </div>
                        </div>
                      </label>

                      {/* COD */}
                      <label className={`hiyaghar-payment-method-item ${selectedPaymentMethod === 'cod' ? 'is-selected' : ''}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={selectedPaymentMethod === 'cod'}
                          onChange={() => setSelectedPaymentMethod('cod')}
                        />
                        <div className="hiyaghar-pm-content">
                          <span className="hiyaghar-pm-title">Cash on Delivery (COD)</span>
                          <span className="hiyaghar-pm-sub">Pay in cash or UPI directly to delivery partner at your doorstep</span>
                        </div>
                      </label>
                    </div>

                    <div className="hiyaghar-step-actions-row">
                      <button type="button" className="hiyaghar-back-btn" onClick={() => setCurrentStep(1)}>
                        ← Back to Address
                      </button>
                      <button type="submit" className="hiyaghar-step-continue-btn">
                        Review Order →
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* STEP 3: REVIEW YOUR ORDER */}
              {currentStep === 3 && (
                <div className="hiyaghar-checkout-card">
                  <div className="hiyaghar-checkout-card-header">
                    <h2 className="hiyaghar-card-title">03. Review Your Order</h2>
                  </div>

                  {submitError && (
                    <div className="hiyaghar-checkout-error-banner" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div className="hiyaghar-review-sections">
                    {/* Delivery Address Summary */}
                    <div className="hiyaghar-review-block">
                      <div className="hiyaghar-review-block-header">
                        <h3>Delivery Address</h3>
                        <button type="button" className="hiyaghar-edit-step-btn" onClick={() => setCurrentStep(1)}>
                          Edit
                        </button>
                      </div>
                      <p className="hiyaghar-review-text">
                        <strong>{addressForm.fullName}</strong> ({addressForm.mobile})<br />
                        {addressForm.address}, {addressForm.city}, {addressForm.state} - {addressForm.pincode}<br />
                        Email: {addressForm.email}
                      </p>
                    </div>

                    {/* Payment Method Summary */}
                    <div className="hiyaghar-review-block">
                      <div className="hiyaghar-review-block-header">
                        <h3>Payment Method</h3>
                        <button type="button" className="hiyaghar-edit-step-btn" onClick={() => setCurrentStep(2)}>
                          Edit
                        </button>
                      </div>
                      <p className="hiyaghar-review-text">
                        <strong>
                          {selectedPaymentMethod === 'razorpay'
                            ? 'Pay Online (Razorpay: UPI, Cards, NetBanking, Wallets)'
                            : 'Cash on Delivery (COD)'}
                        </strong>
                      </p>
                    </div>

                    {/* Order Items */}
                    <div className="hiyaghar-review-block">
                      <div className="hiyaghar-review-block-header">
                        <h3>Order Items ({cartItems.length})</h3>
                      </div>
                      <div className="hiyaghar-review-items-list">
                        {cartItems.map((item) => (
                          <div key={item.id} className="hiyaghar-review-item-row">
                            <img src={item.image} alt={item.name} className="hiyaghar-review-item-img" />
                            <div className="hiyaghar-review-item-info">
                              <span className="hiyaghar-review-item-name">{item.name}</span>
                              <span className="hiyaghar-review-item-meta" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>Size: {item.weight} • Qty: <AnimatedNumber value={item.quantity} /></span>
                            </div>
                            <span className="hiyaghar-review-item-price" style={{ display: 'inline-flex', alignItems: 'center' }}>₹<AnimatedNumber value={item.price * item.quantity} /></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* FINAL STRONGEST CTA */}
                  <div className="hiyaghar-place-order-cta-wrapper">
                    <button
                      type="button"
                      className="hiyaghar-place-order-btn"
                      disabled={isSubmitting}
                      onClick={handlePlaceOrder}
                    >
                      {isSubmitting ? (
                        <span className="hiyaghar-loading-spinner-row">
                          <span className="hiyaghar-spinner" /> Processing Order...
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>Place Order • ₹<AnimatedNumber value={finalTotal} /></span>
                      )}
                    </button>
                    <span className="hiyaghar-checkout-security-subtext">
                      <i className="fa-solid fa-shield-halved" aria-hidden="true" style={{ color: 'var(--hiya-gold-text, #855F0F)', marginRight: '6px' }}></i>
                      Guaranteed Secure Checkout • Easy Returns • 100% Authentic Quality
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN — Sticky Order Summary */}
            <div className="hiyaghar-checkout-right-col">
              <div className="hiyaghar-checkout-summary-card">
                <h3 className="hiyaghar-summary-title">Order Items ({cartItems.length})</h3>

                <div className="hiyaghar-summary-items-preview">
                  {cartItems.map((item) => (
                    <div key={item.id} className="hiyaghar-summary-item-preview">
                      <img src={item.image} alt={item.name} />
                      <div className="info">
                        <span className="name">{item.name}</span>
                        <span className="meta" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{item.weight} × <AnimatedNumber value={item.quantity} /></span>
                      </div>
                      <span className="price" style={{ display: 'inline-flex', alignItems: 'center' }}>₹<AnimatedNumber value={item.price * item.quantity} /></span>
                    </div>
                  ))}
                </div>

                <div className="hiyaghar-summary-divider" />

                {/* Automatic offer (no coupon code). The server applies the same offer when the order is placed. */}
                {appliedOffer && (
                  <div className="hiyaghar-summary-row subtle" style={{ color: '#1a7f37', margin: '12px 0 6px' }}>
                    <span>✓ {appliedOffer.label} applied automatically</span>
                  </div>
                )}
                {nextOffer && (
                  <div
                    role="status"
                    aria-live="polite"
                    style={{ margin: '8px 0 12px', fontSize: '12.5px', background: '#FFF9E6', border: '1px dashed #D19A27', color: '#855F0F', padding: '8px 10px', borderRadius: '6px' }}
                  >
                    🎁 Add <strong>₹{Math.ceil(nextOffer.amountNeeded)}</strong> more to get <strong>{nextOffer.benefit}</strong> on your order
                  </div>
                )}

                {/* Reward coins */}
                {rewardBalance > 0 && (
                  <div className="hiyaghar-summary-row" style={{ margin: '8px 0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={useRewardCoins}
                        onChange={(e) => setUseRewardCoins(e.target.checked)}
                      />
                      <span>
                        Use {maxRedeemableCoins} of your {rewardBalance} reward coins (−₹{(maxRedeemableCoins * coinToRupeeRate).toFixed(2)})
                      </span>
                    </label>
                  </div>
                )}

                <div className="hiyaghar-summary-rows">
                  <div className="hiyaghar-summary-row">
                    <span>Subtotal</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>₹<AnimatedNumber value={subtotal} /></span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="hiyaghar-summary-row">
                      <span>Offer Discount</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>−₹<AnimatedNumber value={discountAmount} /></span>
                    </div>
                  )}
                  {coinDiscount > 0 && (
                    <div className="hiyaghar-summary-row">
                      <span>Reward Coins</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>−₹<AnimatedNumber value={coinDiscount} /></span>
                    </div>
                  )}
                  <div className="hiyaghar-summary-row">
                    <span>Shipping</span>
                    <span className="highlight">
                      {shippingFee === 0 ? 'FREE' : <span style={{ display: 'inline-flex', alignItems: 'center' }}>₹<AnimatedNumber value={shippingFee} /></span>}
                    </span>
                  </div>
                  {enableGstDisplay && (
                    <div className="hiyaghar-summary-row subtle">
                      <span>{gstLabel}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>₹<AnimatedNumber value={taxAmount} /></span>
                    </div>
                  )}
                  <div className="hiyaghar-summary-divider" />
                  <div className="hiyaghar-summary-row total">
                    <span>Total Amount</span>
                    <span className="val" style={{ display: 'inline-flex', alignItems: 'center' }}>₹<AnimatedNumber value={finalTotal} /></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
