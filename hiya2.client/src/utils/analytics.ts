// Google Analytics 4 (gtag.js). Off until VITE_GA4_MEASUREMENT_ID is set (see .env.production);
// with no ID every function here does nothing and no Google script is loaded.
// Admin pages are never tracked. Ecommerce events follow GA4's recommended names and
// parameters (view_item, add_to_cart, begin_checkout, purchase), prices in INR.

const MEASUREMENT_ID = (import.meta.env.VITE_GA4_MEASUREMENT_ID || '').trim();
const ENABLED = /^G-[A-Z0-9]+$/i.test(MEASUREMENT_ID);
const CURRENCY = 'INR';
const TRACKED_ORDERS_KEY = 'hiya_ga4_tracked_orders';

type GtagArgs = [string, ...unknown[]];

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: GtagArgs) => void;
  }
}

export interface AnalyticsItem {
  productId: string | number;
  name: string;
  price: number;
  quantity?: number;
  variant?: string;
  category?: string;
}

let started = false;

const isAdminPage = () => window.location.pathname.toLowerCase().startsWith('/admin');

function gtag(...args: GtagArgs) {
  if (!ENABLED || isAdminPage()) return;
  init();
  window.gtag?.(...args);
}

/** Loads gtag.js once. Page views are sent by trackPageView (single-page app routing). */
function init() {
  if (started) return;
  started = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtagShim() {
    // gtag.js reads the `arguments` object itself, not an array.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', MEASUREMENT_ID, { send_page_view: false });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`;
  document.head.appendChild(script);
}

const toGaItem = (item: AnalyticsItem, index?: number) => ({
  item_id: String(item.productId),
  item_name: item.name,
  price: Number(item.price) || 0,
  quantity: item.quantity ?? 1,
  ...(item.variant ? { item_variant: item.variant } : {}),
  ...(item.category ? { item_category: item.category } : {}),
  ...(index !== undefined ? { index } : {}),
});

const total = (items: AnalyticsItem[]) => items.reduce((sum, i) => sum + (Number(i.price) || 0) * (i.quantity ?? 1), 0);

export function trackPageView(path: string = window.location.pathname + window.location.search) {
  gtag('event', 'page_view', { page_path: path, page_location: window.location.href, page_title: document.title });
}

export function trackViewItem(item: AnalyticsItem) {
  gtag('event', 'view_item', { currency: CURRENCY, value: total([item]), items: [toGaItem(item)] });
}

export function trackAddToCart(item: AnalyticsItem) {
  gtag('event', 'add_to_cart', { currency: CURRENCY, value: total([item]), items: [toGaItem(item)] });
}

export function trackBeginCheckout(items: AnalyticsItem[], coupon?: string) {
  if (items.length === 0) return;
  gtag('event', 'begin_checkout', {
    currency: CURRENCY,
    value: total(items),
    ...(coupon ? { coupon } : {}),
    items: items.map(toGaItem),
  });
}

/**
 * Sent once per order id (remembered in localStorage), and only for orders placed in the last
 * 24 hours, so reopening an old confirmation page never counts a sale twice.
 */
export function trackPurchase(order: {
  id: string;
  createdAt?: string;
  total: number;
  tax?: number;
  shippingFee?: number;
  couponCode?: string;
  items: AnalyticsItem[];
}) {
  if (!ENABLED || !order?.id) return;
  const placed = order.createdAt ? Date.parse(order.createdAt) : NaN;
  if (!Number.isNaN(placed) && Date.now() - placed > 24 * 60 * 60 * 1000) return;

  let tracked: string[] = [];
  try {
    tracked = JSON.parse(localStorage.getItem(TRACKED_ORDERS_KEY) || '[]');
  } catch {
    tracked = [];
  }
  if (tracked.includes(order.id)) return;

  gtag('event', 'purchase', {
    transaction_id: order.id,
    currency: CURRENCY,
    value: Number(order.total) || 0,
    tax: Number(order.tax) || 0,
    shipping: Number(order.shippingFee) || 0,
    ...(order.couponCode ? { coupon: order.couponCode } : {}),
    items: order.items.map(toGaItem),
  });

  try {
    localStorage.setItem(TRACKED_ORDERS_KEY, JSON.stringify([...tracked, order.id].slice(-50)));
  } catch {
    // storage unavailable: the event was still sent
  }
}
