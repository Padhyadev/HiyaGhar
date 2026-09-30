import React, { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header/Header';
import { Footer } from '../../components/layout/Footer/Footer';
import { CartService } from '../../cart';
import type { CartItem } from '../../cart';
import { ShippingService } from '../../services/shippingService';
import type { DeliveryOption } from '../../services/shippingService';
import { OrderService } from '../../services/orderService';
import type { ShippingAddress } from '../../services/orderService';
import { AddressService } from '../../services/addressService';
import type { UserAddress } from '../../services/addressService';
import { CustomerAuthService } from '../../services/customerAuthService';
import { MukhwasHero } from '../../components/mukhwas/MukhwasHero/MukhwasHero';
import { AnimatedNumber } from '../../components/common/AnimatedNumber';
import { allowOnlyDigits, sanitizeDigits } from '../../utils/validationUtils';
import './CheckoutPage.css';

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
  const [cartItems, setCartItems] = useState<CartItem[]>(CartService.getItems());
  const [subtotal, setSubtotal] = useState<number>(CartService.getSubtotal());

  // 4-Step Checkout Progress: 1 = Address, 2 = Delivery, 3 = Payment, 4 = Review
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Saved Addresses State (Shipping Addresses ONLY)
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>(AddressService.getShippingAddresses());
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isAddNewAddressOpen, setIsAddNewAddressOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Address Form Fields
  const [newAddressForm, setNewAddressForm] = useState({
    fullName: '',
    mobileNo: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: 'Ahmedabad',
    state: 'Gujarat',
    postalCode: '',
    addressType: 'SHIPPING' as const,
    isDefault: false,
  });

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

  // Delivery Options for Step 2
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOption | null>(null);

  // Payment Options for Step 3 — only Cash on Delivery is wired up to the backend right now;
  // the other methods remain visible but disabled until online payment is implemented.
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('cod');
  const [upiId, setUpiId] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');
  const [cardName, setCardName] = useState<string>('');
  const [selectedBank, setSelectedBank] = useState<string>('HDFC Bank');
  const [selectedWallet, setSelectedWallet] = useState<string>('Paytm');

  // Place Order Loading & Error State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Coupon (server-validated)
  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState<boolean>(false);

  // Reward coins
  const [rewardBalance, setRewardBalance] = useState<number>(0);
  const [coinToRupeeRate, setCoinToRupeeRate] = useState<number>(1);
  const [maxCoinUsagePercent, setMaxCoinUsagePercent] = useState<number>(10);
  const [useRewardCoins, setUseRewardCoins] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Helper to sync selected saved address into addressForm
  const selectSavedAddress = (addr: UserAddress) => {
    setSelectedAddressId(addr.id);
    setAddressForm({
      fullName: addr.fullName,
      mobile: addr.mobileNo,
      email: 'vmgami33333@gmail.com',
      pincode: addr.postalCode,
      address: addr.addressLine1 + (addr.addressLine2 ? `, ${addr.addressLine2}` : ''),
      city: addr.city,
      state: addr.state,
    });
    // Check pincode serviceability
    if (addr.postalCode && addr.postalCode.length === 6) {
      handlePincodeBlur(addr.postalCode);
    }
  };

  useEffect(() => {
    const items = CartService.getItems();
    const currentSubtotal = CartService.getSubtotal();
    setCartItems(items);
    setSubtotal(currentSubtotal);

    const options = ShippingService.getDeliveryOptions(currentSubtotal);
    setDeliveryOptions(options);
    if (options.length > 0 && !selectedDelivery) {
      setSelectedDelivery(options[0]);
    }

    const customer = CustomerAuthService.getCustomer();

    // Load shipping addresses — from the server when logged in, otherwise local-only.
    const loadAddresses = async () => {
      const shippingAddrs = customer
        ? (await AddressService.fetchAddressesFromApi(customer.customerId)).filter((a) => a.addressType === 'SHIPPING')
        : AddressService.getShippingAddresses();
      setSavedAddresses(shippingAddrs);
      if (shippingAddrs.length > 0) {
        const defaultAddr = shippingAddrs.find((a) => a.isDefault) || shippingAddrs[0];
        selectSavedAddress(defaultAddr);
      }
    };
    loadAddresses();

    // Load reward balance + settings when logged in.
    if (customer) {
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
  }, []);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    setCouponMessage(null);
    try {
      const res = await fetch('/api/cart/coupon/preview', {
        method: 'POST',
        headers: CustomerAuthService.getAuthHeaders(),
        body: JSON.stringify({ code: couponCode.trim() }),
      });
      const data = await res.json();
      if (data.isSuccess) {
        setAppliedCoupon({ code: couponCode.trim().toUpperCase(), discountAmount: data.discountAmount });
        setCouponMessage(`Coupon applied! You saved ₹${data.discountAmount.toFixed(2)}.`);
      } else {
        setAppliedCoupon(null);
        setCouponMessage(data.message || 'This coupon could not be applied.');
      }
    } catch {
      setCouponMessage('Could not validate coupon right now. Please try again.');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const discountAmount = appliedCoupon?.discountAmount || 0;
  const maxRedeemableCoins = Math.min(
    rewardBalance,
    Math.floor(Math.max(0, subtotal - discountAmount) * (maxCoinUsagePercent / 100) / Math.max(coinToRupeeRate, 0.01))
  );
  const coinDiscount = useRewardCoins ? Math.round(maxRedeemableCoins * coinToRupeeRate * 100) / 100 : 0;

  // Dropdown Change Handler
  const handleDropdownAddressChange = (val: string) => {
    if (val === 'NEW_ADDRESS') {
      setSelectedAddressId('NEW_ADDRESS');
      setIsAddNewAddressOpen(true);
    } else {
      setIsAddNewAddressOpen(false);
      const chosen = savedAddresses.find((a) => a.id === val);
      if (chosen) {
        selectSavedAddress(chosen);
      }
    }
  };

  // Submit New Address Handler
  const handleSaveNewAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressForm.fullName || !newAddressForm.mobileNo || !newAddressForm.addressLine1 || !newAddressForm.city || !newAddressForm.postalCode) {
      showToast('Please fill all required new address fields.');
      return;
    }

    const customer = CustomerAuthService.getCustomer();
    const addressPayload = {
      fullName: newAddressForm.fullName,
      mobileNo: newAddressForm.mobileNo,
      addressLine1: newAddressForm.addressLine1,
      addressLine2: newAddressForm.addressLine2,
      city: newAddressForm.city,
      state: newAddressForm.state,
      postalCode: newAddressForm.postalCode,
      addressType: 'SHIPPING' as const,
      isDefault: newAddressForm.isDefault,
    };

    if (customer) {
      const ok = await AddressService.saveAddressApi(addressPayload, customer.customerId);
      if (!ok) {
        showToast('Could not save address to your account. Please try again.');
        return;
      }
      const updated = (await AddressService.fetchAddressesFromApi(customer.customerId)).filter((a) => a.addressType === 'SHIPPING');
      setSavedAddresses(updated);
      const newlySelected = updated.find((a) => a.addressLine1 === addressPayload.addressLine1 && a.postalCode === addressPayload.postalCode) || updated[0];
      if (newlySelected) selectSavedAddress(newlySelected);
    } else {
      const created = AddressService.addAddress(addressPayload);
      const updated = AddressService.getShippingAddresses();
      setSavedAddresses(updated);
      selectSavedAddress(created);
    }

    setIsAddNewAddressOpen(false);
    showToast('✨ New shipping address saved & selected!');
  };

  // Handle Pincode Check
  const handlePincodeBlur = (pin: string) => {
    if (pin.trim().length === 6) {
      const res = ShippingService.checkPincode(pin);
      if (res.serviceable && res.cityState) {
        // Auto-fill city/state if available
        if (pin.startsWith('380')) { setAddressForm((prev) => ({ ...prev, city: 'Ahmedabad', state: 'Gujarat' })); }
        else if (pin.startsWith('400')) { setAddressForm((prev) => ({ ...prev, city: 'Mumbai', state: 'Maharashtra' })); }
        else if (pin.startsWith('110')) { setAddressForm((prev) => ({ ...prev, city: 'New Delhi', state: 'Delhi' })); }
        else if (pin.startsWith('560')) { setAddressForm((prev) => ({ ...prev, city: 'Bengaluru', state: 'Karnataka' })); }
      }
    }
  };

  // Step 1 Validation
  const validateAddressForm = (): boolean => {
    if (!addressForm.fullName.trim()) return false;
    if (!addressForm.mobile.trim()) return false;
    if (!addressForm.address.trim()) return false;
    if (!addressForm.city.trim()) return false;
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
    if (selectedDelivery) {
      setCurrentStep(3);
      window.scrollTo(0, 200);
    }
  };

  const handleStep3Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep(4);
    window.scrollTo(0, 200);
  };

  // PLACE ORDER SUBMISSION — Cash on Delivery only for now; other payment
  // methods in Step 3 are visible but disabled until online payment is built.
  const handlePlaceOrder = async () => {
    if (!selectedDelivery) return;

    const customer = CustomerAuthService.getCustomer();
    if (!customer) {
      setSubmitError('Please log in to place an order.');
      return;
    }

    const numericAddressId = Number(selectedAddressId);
    if (!selectedAddressId || Number.isNaN(numericAddressId) || selectedAddressId === 'NEW_ADDRESS') {
      setSubmitError('Please select a saved delivery address.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/order/checkout', {
        method: 'POST',
        headers: CustomerAuthService.getAuthHeaders(),
        body: JSON.stringify({
          customerAddressId: numericAddressId,
          couponCode: appliedCoupon?.code,
          useRewardCoins: useRewardCoins ? maxRedeemableCoins : 0,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.isSuccess) {
        setIsSubmitting(false);
        setSubmitError(data.message || 'Failed to place order. Please try again.');
        return;
      }

      // Use the server-authoritative totals (it may compute delivery fee
      // differently than the client-side estimate shown during the flow).
      const serverShippingFee = data.deliveryFee ?? selectedDelivery.price;
      const serverSubtotal = data.subtotal ?? subtotal;
      const serverDiscount = (data.discountAmount ?? discountAmount) + (data.coinDiscountAmount ?? coinDiscount);
      const serverTotal = data.totalAmount ?? finalTotal;
      const tax = Math.round(Math.max(0, serverSubtotal - serverDiscount) * 0.05);

      // Bridge into the existing local order-history/tracking display using
      // the real backend order number and totals.
      OrderService.createOrder({
        items: cartItems,
        shippingAddress: addressForm,
        deliveryOption: {
          id: selectedDelivery.id,
          name: selectedDelivery.name,
          estimatedDays: selectedDelivery.estimatedDays,
          price: serverShippingFee,
        },
        paymentMethod: { id: 'cod', name: 'Cash on Delivery', details: 'Cash on Delivery (COD)' },
        subtotal: serverSubtotal,
        discount: serverDiscount,
        couponCode: appliedCoupon?.code,
        shippingFee: serverShippingFee,
        tax,
        total: serverTotal,
        orderNumber: data.orderNumber,
      });

      CartService.clearCart();
      onNavigateConfirmation(data.orderNumber);
    } catch (err: any) {
      setIsSubmitting(false);
      setSubmitError('Failed to place order. Please check your connection and try again.');
    }
  };

  // Calculations for Order Summary
  const shippingFee = selectedDelivery ? selectedDelivery.price : 0;
  const taxAmount = Math.round(subtotal * 0.05);
  const finalTotal = Math.max(0, subtotal - discountAmount - coinDiscount + shippingFee);

  return (
    <div className="hiyaghar-checkout-page-layout">
      {toastMessage && (
        <div className="hiyaghar-checkout-toast-banner" role="status">
          <span>{toastMessage}</span>
        </div>
      )}
      <Header />

      <main className="hiyaghar-checkout-main">
        <MukhwasHero
          onNavigateHome={onNavigateHome}
          breadcrumbCurrent="Checkout"
          title="Checkout"
          bgImage="/image/Banner_image/Checkout.jfif"
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
              <span className="hiyaghar-step-label">Delivery</span>
            </div>
            <div className="hiyaghar-step-line" />
            <div className={`hiyaghar-step-item ${currentStep === 3 ? 'is-active' : currentStep > 3 ? 'is-complete' : ''}`}>
              <span className="hiyaghar-step-num">{currentStep > 3 ? '✓' : '03'}</span>
              <span className="hiyaghar-step-label">Payment</span>
            </div>
            <div className="hiyaghar-step-line" />
            <div className={`hiyaghar-step-item ${currentStep === 4 ? 'is-active' : ''}`}>
              <span className="hiyaghar-step-num">04</span>
              <span className="hiyaghar-step-label">Review</span>
            </div>
          </div>

          <div className="hiyaghar-checkout-grid">
            {/* LEFT COLUMN — Step Forms */}
            <div className="hiyaghar-checkout-left-col">
              {/* STEP 1: ADDRESS */}
              {currentStep === 1 && (
                <div className="hiyaghar-checkout-card">
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
                  <div className="hiyaghar-address-dropdown-wrapper">
                    <label className="hiyaghar-field-label">Select Saved Shipping Address:</label>
                    <select
                      className="hiyaghar-address-select-control"
                      value={selectedAddressId}
                      onChange={(e) => handleDropdownAddressChange(e.target.value)}
                    >
                      {savedAddresses.map((addr) => (
                        <option key={addr.id} value={addr.id}>
                          🚚 {addr.fullName} — {addr.addressLine1}, {addr.city} ({addr.postalCode}) {addr.isDefault ? ' [DEFAULT]' : ''}
                        </option>
                      ))}
                      <option value="NEW_ADDRESS">➕ + Add New Delivery Address...</option>
                    </select>
                  </div>

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
                              {isSelected && <span className="selected-badge">✓ SELECTED</span>}
                            </div>
                            <h4 className="addr-name">{addr.fullName}</h4>
                            <p className="addr-text">
                              {addr.addressLine1}
                              {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}<br />
                              {addr.city}, {addr.state} - {addr.postalCode}
                            </p>
                            <span className="addr-mobile">📱 {addr.mobileNo}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* FORM A: NEW DELIVERY ADDRESS FORM (When clicking + Add Delivery Address) */}
                  {(isAddNewAddressOpen || selectedAddressId === 'NEW_ADDRESS') ? (
                    <form onSubmit={handleSaveNewAddressSubmit} className="hiyaghar-new-address-inline-form animate-fade-in">
                      <div className="hiyaghar-new-form-header">
                        <h3>Add New Delivery Address</h3>
                        <button
                          type="button"
                          className="hiyaghar-cancel-new-addr-btn"
                          onClick={() => {
                            setIsAddNewAddressOpen(false);
                            if (savedAddresses.length > 0) selectSavedAddress(savedAddresses[0]);
                          }}
                        >
                          ✕ Cancel
                        </button>
                      </div>

                      <div className="hiyaghar-form-row">
                        <div className="hiyaghar-form-group">
                          <label>Full Name *</label>
                          <input
                            type="text"
                            placeholder="e.g. Vishal Gami"
                            value={newAddressForm.fullName}
                            onChange={(e) => setNewAddressForm({ ...newAddressForm, fullName: e.target.value })}
                            required
                          />
                        </div>

                        <div className="hiyaghar-form-group">
                          <label>Mobile Number *</label>
                          <input
                            type="tel"
                            maxLength={10}
                            placeholder="10-digit mobile number"
                            value={newAddressForm.mobileNo}
                            onKeyDown={allowOnlyDigits}
                            onChange={(e) => setNewAddressForm({ ...newAddressForm, mobileNo: sanitizeDigits(e.target.value) })}
                            required
                          />
                        </div>
                      </div>

                      <div className="hiyaghar-form-row">
                        <div className="hiyaghar-form-group">
                          <label>Address Line 1 *</label>
                          <input
                            type="text"
                            placeholder="House / Flat No., Building, Street"
                            value={newAddressForm.addressLine1}
                            onChange={(e) => setNewAddressForm({ ...newAddressForm, addressLine1: e.target.value })}
                            required
                          />
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
                            onChange={(e) => setNewAddressForm({ ...newAddressForm, postalCode: e.target.value.replace(/\D/g, '') })}
                            required
                          />
                        </div>

                        <div className="hiyaghar-form-group">
                          <label>City *</label>
                          <input
                            type="text"
                            placeholder="e.g. Ahmedabad"
                            value={newAddressForm.city}
                            onChange={(e) => setNewAddressForm({ ...newAddressForm, city: e.target.value })}
                            required
                          />
                        </div>

                        <div className="hiyaghar-form-group">
                          <label>State *</label>
                          <input
                            type="text"
                            placeholder="e.g. Gujarat"
                            value={newAddressForm.state}
                            onChange={(e) => setNewAddressForm({ ...newAddressForm, state: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                        <div className="hiyaghar-checkbox-group" style={{ alignSelf: 'center', marginTop: '8px' }}>
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={newAddressForm.isDefault}
                              onChange={(e) => setNewAddressForm({ ...newAddressForm, isDefault: e.target.checked })}
                            />
                            Make this my default shipping address
                          </label>
                        </div>

                      <button type="submit" className="hiyaghar-save-address-btn">
                        💾 Save & Use This Address →
                      </button>
                    </form>
                  ) : (
                    /* FORM B: CONFIRM SELECTED ADDRESS FORM */
                    <form onSubmit={handleStep1Submit} className="hiyaghar-address-form" style={{ marginTop: '20px' }}>
                      <div className="hiyaghar-selected-summary-box">
                        <span className="summary-title">Selected Delivery Destination:</span>
                        <p className="summary-details">
                          <strong>{addressForm.fullName}</strong> • 📱 {addressForm.mobile}<br />
                          {addressForm.address}, {addressForm.city}, {addressForm.state} - {addressForm.pincode}
                        </p>
                      </div>

                      <button type="submit" className="hiyaghar-step-continue-btn">
                        Continue to Delivery Options →
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* STEP 2: DELIVERY OPTIONS */}
              {currentStep === 2 && (
                <div className="hiyaghar-checkout-card">
                  <div className="hiyaghar-checkout-card-header">
                    <h2 className="hiyaghar-card-title">02. Select Delivery Method</h2>
                  </div>

                  <form onSubmit={handleStep2Submit} className="hiyaghar-delivery-form">
                    <div className="hiyaghar-delivery-options-list">
                      {deliveryOptions.map((option) => (
                        <label
                          key={option.id}
                          className={`hiyaghar-delivery-option-card ${selectedDelivery?.id === option.id ? 'is-selected' : ''}`}
                        >
                          <input
                            type="radio"
                            name="deliveryMethod"
                            checked={selectedDelivery?.id === option.id}
                            onChange={() => setSelectedDelivery(option)}
                          />
                          <div className="hiyaghar-delivery-option-info">
                            <span className="hiyaghar-delivery-name">{option.name}</span>
                            <span className="hiyaghar-delivery-est">Estimated: {option.estimatedDays}</span>
                            <span className="hiyaghar-delivery-desc">{option.description}</span>
                          </div>
                          <div className="hiyaghar-delivery-price-col">
                            {option.price === 0 ? (
                              <span className="free-badge">FREE</span>
                            ) : (
                              <span className="price">₹{option.price}</span>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>

                    <div className="hiyaghar-step-actions-row">
                      <button type="button" className="hiyaghar-back-btn" onClick={() => setCurrentStep(1)}>
                        ← Back to Address
                      </button>
                      <button type="submit" className="hiyaghar-step-continue-btn">
                        Continue to Payment →
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* STEP 3: PAYMENT METHOD */}
              {currentStep === 3 && (
                <div className="hiyaghar-checkout-card">
                  <div className="hiyaghar-checkout-card-header">
                    <h2 className="hiyaghar-card-title">03. Select Payment Method</h2>
                    <span className="hiyaghar-secure-badge">🔒 256-Bit Encrypted</span>
                  </div>

                  <form onSubmit={handleStep3Submit} className="hiyaghar-payment-form">
                    <div className="hiyaghar-payment-methods-grid">
                      {/* UPI - not wired up yet, COD only for now */}
                      <label className="hiyaghar-payment-method-item is-disabled" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                        <input type="radio" name="paymentMethod" checked={false} disabled />
                        <div className="hiyaghar-pm-content">
                          <span className="hiyaghar-pm-title">UPI / QR Code (Coming Soon)</span>
                          <span className="hiyaghar-pm-sub">Instant payment via Google Pay, PhonePe, Paytm, BHIM</span>
                        </div>
                      </label>

                      {selectedPaymentMethod === 'upi' && (
                        <div className="hiyaghar-pm-details-box">
                          <label>Enter VPA / UPI ID</label>
                          <input
                            type="text"
                            placeholder="e.g. mobileNumber@upi / username@okaxis"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                          />
                          <span className="hiyaghar-upi-note">You will receive a payment request on your UPI app</span>
                        </div>
                      )}

                      {/* CARD - not wired up yet, COD only for now */}
                      <label className="hiyaghar-payment-method-item is-disabled" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                        <input type="radio" name="paymentMethod" checked={false} disabled />
                        <div className="hiyaghar-pm-content">
                          <span className="hiyaghar-pm-title">Credit / Debit Card (Coming Soon)</span>
                          <span className="hiyaghar-pm-sub">Visa, MasterCard, RuPay, Maestro</span>
                        </div>
                      </label>

                      {selectedPaymentMethod === 'card' && (
                        <div className="hiyaghar-pm-details-box">
                          <div className="hiyaghar-form-group">
                            <label>Cardholder Name</label>
                            <input
                              type="text"
                              placeholder="Name as printed on card"
                              value={cardName}
                              onChange={(e) => setCardName(e.target.value)}
                            />
                          </div>
                          <div className="hiyaghar-form-group">
                            <label>Card Number</label>
                            <input
                              type="text"
                              maxLength={19}
                              placeholder="1234 5678 9101 1121"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.target.value)}
                            />
                          </div>
                          <div className="hiyaghar-form-row">
                            <div className="hiyaghar-form-group">
                              <label>Expiry Date</label>
                              <input
                                type="text"
                                placeholder="MM/YY"
                                maxLength={5}
                                value={cardExpiry}
                                onChange={(e) => setCardExpiry(e.target.value)}
                              />
                            </div>
                            <div className="hiyaghar-form-group">
                              <label>CVV</label>
                              <input
                                type="password"
                                maxLength={4}
                                placeholder="123"
                                value={cardCvv}
                                onChange={(e) => setCardCvv(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* NET BANKING - not wired up yet, COD only for now */}
                      <label className="hiyaghar-payment-method-item is-disabled" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                        <input type="radio" name="paymentMethod" checked={false} disabled />
                        <div className="hiyaghar-pm-content">
                          <span className="hiyaghar-pm-title">Net Banking (Coming Soon)</span>
                          <span className="hiyaghar-pm-sub">All major Indian banks supported</span>
                        </div>
                      </label>

                      {selectedPaymentMethod === 'netbanking' && (
                        <div className="hiyaghar-pm-details-box">
                          <label>Select Bank</label>
                          <select value={selectedBank} onChange={(e) => setSelectedBank(e.target.value)}>
                            <option value="HDFC Bank">HDFC Bank</option>
                            <option value="State Bank of India">State Bank of India (SBI)</option>
                            <option value="ICICI Bank">ICICI Bank</option>
                            <option value="Axis Bank">Axis Bank</option>
                            <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                          </select>
                        </div>
                      )}

                      {/* WALLETS - not wired up yet, COD only for now */}
                      <label className="hiyaghar-payment-method-item is-disabled" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                        <input type="radio" name="paymentMethod" checked={false} disabled />
                        <div className="hiyaghar-pm-content">
                          <span className="hiyaghar-pm-title">Mobile Wallet (Coming Soon)</span>
                          <span className="hiyaghar-pm-sub">Paytm, PhonePe Wallet, Amazon Pay</span>
                        </div>
                      </label>

                      {selectedPaymentMethod === 'wallet' && (
                        <div className="hiyaghar-pm-details-box">
                          <label>Select Mobile Wallet</label>
                          <select value={selectedWallet} onChange={(e) => setSelectedWallet(e.target.value)}>
                            <option value="Paytm">Paytm Wallet</option>
                            <option value="PhonePe">PhonePe Wallet</option>
                            <option value="Amazon Pay">Amazon Pay</option>
                            <option value="Mobikwik">Mobikwik</option>
                          </select>
                        </div>
                      )}

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
                          <span className="hiyaghar-pm-sub">Pay cash upon delivery at your doorstep</span>
                        </div>
                      </label>
                    </div>

                    <div className="hiyaghar-step-actions-row">
                      <button type="button" className="hiyaghar-back-btn" onClick={() => setCurrentStep(2)}>
                        ← Back to Delivery
                      </button>
                      <button type="submit" className="hiyaghar-step-continue-btn">
                        Review Order →
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* STEP 4: REVIEW YOUR ORDER */}
              {currentStep === 4 && (
                <div className="hiyaghar-checkout-card">
                  <div className="hiyaghar-checkout-card-header">
                    <h2 className="hiyaghar-card-title">04. Review Your Order</h2>
                  </div>

                  {submitError && (
                    <div className="hiyaghar-checkout-error-banner">
                      <span>⚠️ {submitError}</span>
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

                    {/* Delivery Method Summary */}
                    <div className="hiyaghar-review-block">
                      <div className="hiyaghar-review-block-header">
                        <h3>Delivery Method</h3>
                        <button type="button" className="hiyaghar-edit-step-btn" onClick={() => setCurrentStep(2)}>
                          Edit
                        </button>
                      </div>
                      <p className="hiyaghar-review-text">
                        <strong>{selectedDelivery?.name}</strong> ({selectedDelivery?.estimatedDays}) —{' '}
                        {selectedDelivery?.price === 0 ? 'FREE Shipping' : `₹${selectedDelivery?.price}`}
                      </p>
                    </div>

                    {/* Payment Method Summary */}
                    <div className="hiyaghar-review-block">
                      <div className="hiyaghar-review-block-header">
                        <h3>Payment Method</h3>
                        <button type="button" className="hiyaghar-edit-step-btn" onClick={() => setCurrentStep(3)}>
                          Edit
                        </button>
                      </div>
                      <p className="hiyaghar-review-text">
                        <strong>
                          {selectedPaymentMethod === 'upi'
                            ? 'UPI / QR Code'
                            : selectedPaymentMethod === 'card'
                            ? 'Credit / Debit Card'
                            : selectedPaymentMethod === 'netbanking'
                            ? 'Net Banking'
                            : selectedPaymentMethod === 'wallet'
                            ? 'Mobile Wallet'
                            : 'Cash on Delivery'}
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
                    <span className="hiyaghar-cta-subtext">
                      🔒 Guaranteed Secure Checkout • Easy Returns • 100% Authentic Quality
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

                {/* Coupon code */}
                <div className="hiyaghar-summary-coupon-row" style={{ display: 'flex', gap: '8px', margin: '12px 0' }}>
                  <input
                    type="text"
                    placeholder="Have a coupon code?"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                    disabled={!!appliedCoupon}
                  />
                  {appliedCoupon ? (
                    <button
                      type="button"
                      onClick={() => { setAppliedCoupon(null); setCouponCode(''); setCouponMessage(null); }}
                      className="hiyaghar-back-btn"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon || !couponCode.trim()}
                      className="hiyaghar-step-continue-btn"
                    >
                      {isApplyingCoupon ? '...' : 'Apply'}
                    </button>
                  )}
                </div>
                {couponMessage && (
                  <div className="hiyaghar-summary-row subtle" style={{ color: appliedCoupon ? '#1a7f37' : '#b42318' }}>
                    {couponMessage}
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
                      <span>Coupon Discount ({appliedCoupon?.code})</span>
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
                  <div className="hiyaghar-summary-row subtle">
                    <span>Estimated GST (5% Included)</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>₹<AnimatedNumber value={taxAmount} /></span>
                  </div>
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
