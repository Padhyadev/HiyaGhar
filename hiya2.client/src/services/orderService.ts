import type { CartItem } from '../cart';
import { CustomerAuthService } from './customerAuthService';
import { ProductService } from './productService';
import { LovService } from './lovService';

export interface ShippingAddress {
  fullName: string;
  mobile: string;
  email: string;
  pincode: string;
  address: string;
  city: string;
  state: string;
}

export interface TrackingStep {
  id: 'confirmed' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered';
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
  timestamp?: string;
}

export interface Order {
  id: string; // e.g., 'HY-84920' for legacy demo orders, or a real backend 'ORD-...' number
  backendOrderId?: number; // numeric id used for API calls (cancel, etc.) against real orders
  createdAt: string;
  items: CartItem[];
  shippingAddress: ShippingAddress;
  deliveryOption: {
    id: string;
    name: string;
    estimatedDays: string;
    price: number;
  };
  paymentMethod: {
    id: string;
    name: string;
    details?: string;
  };
  subtotal: number;
  discount: number;
  couponCode?: string;
  shippingFee: number;
  tax: number;
  total: number;
  status: 'Confirmed' | 'Packed' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Returned' | 'Refunded';
  estimatedDeliveryDate: string;
  courierName: string;
  trackingId: string;
  timeline: TrackingStep[];
}

const ORDERS_STORAGE_KEY = 'hiya_customer_orders';

// Best-effort image cache so repeated products across orders only fetch once.
const productImageCache = new Map<number, string>();

async function resolveProductImage(productId: number): Promise<string> {
  if (productImageCache.has(productId)) {
    return productImageCache.get(productId)!;
  }
  try {
    const product = await ProductService.getProductById(productId);
    const image = product?.mainImagePath || product?.images?.[0]?.imagePath || '';
    productImageCache.set(productId, image);
    return image;
  } catch {
    return '';
  }
}

function mapApiStatusToLocal(apiStatus: string): Order['status'] {
  switch (apiStatus) {
    case 'Placed':
    case 'Confirmed':
      return 'Confirmed';
    case 'Processing':
    case 'Packed':
      return 'Packed';
    case 'Shipped':
      return 'Shipped';
    case 'OutForDelivery':
      return 'Out for Delivery';
    case 'Delivered':
      return 'Delivered';
    case 'CancelRequested':
    case 'Cancelled':
    case 'CancelRejected':
      return 'Cancelled';
    case 'ReturnRequested':
    case 'Returned':
      return 'Returned';
    case 'RefundInitiated':
    case 'Refunded':
      return 'Refunded';
    default:
      return 'Confirmed';
  }
}

// Every place in the app that shows an order status bucket resolves its
// label through this same code -> LovMaster("OrderStatus") lookup, so
// renaming a label in the admin LOV screen changes it everywhere (emails,
// admin order list, and here) with no code change. The bucket name itself
// (already human-readable) is the fallback if a code has no LOV row.
const STATUS_BUCKET_TO_LOV_CODE: Record<Order['status'], string> = {
  Confirmed: 'Confirmed',
  Packed: 'Packed',
  Shipped: 'Shipped',
  'Out for Delivery': 'OutForDelivery',
  Delivered: 'Delivered',
  Cancelled: 'Cancelled',
  Returned: 'Returned',
  Refunded: 'Refunded',
};

export function resolveStatusLabel(bucket: Order['status'], labels: Record<string, string>): string {
  const code = STATUS_BUCKET_TO_LOV_CODE[bucket];
  return labels[code] || bucket;
}

function buildTimelineForStatus(status: Order['status'], orderDate: string, labels: Record<string, string>): TrackingStep[] {
  const order: Order['status'][] = ['Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
  const currentIndex = order.indexOf(status);
  const dateStr = new Date(orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  const steps: Array<{ id: TrackingStep['id']; title: string; description: string }> = [
    { id: 'confirmed', title: resolveStatusLabel('Confirmed', labels), description: 'Order successfully placed & verified' },
    { id: 'packed', title: resolveStatusLabel('Packed', labels), description: 'Your order has been packed' },
    { id: 'shipped', title: resolveStatusLabel('Shipped', labels), description: 'Your order has left our facility' },
    { id: 'out_for_delivery', title: resolveStatusLabel('Out for Delivery', labels), description: 'Courier executive is on the way to your door' },
    { id: 'delivered', title: resolveStatusLabel('Delivered', labels), description: 'Handed over safely to you' },
  ];

  if (status === 'Cancelled' || status === 'Returned' || status === 'Refunded') {
    const terminalTitle = resolveStatusLabel(status, labels);
    return [
      { id: 'confirmed', title: resolveStatusLabel('Confirmed', labels), description: 'Order successfully placed & verified', completed: true, current: false, timestamp: dateStr },
      { id: 'delivered', title: terminalTitle, description: `Order was ${terminalTitle.toLowerCase()}`, completed: true, current: true, timestamp: dateStr },
    ];
  }

  return steps.map((s, i) => ({
    ...s,
    completed: i <= currentIndex,
    current: i === currentIndex,
    timestamp: i <= currentIndex ? dateStr : undefined,
  }));
}

async function mapApiOrderToLocal(api: any, labels: Record<string, string>): Promise<Order> {
  const status = mapApiStatusToLocal(api.orderStatus);

  const items: CartItem[] = await Promise.all(
    (api.items || []).map(async (item: any) => ({
      id: `${item.productId}-${item.variantName || item.id}`,
      productId: String(item.productId),
      name: item.productName,
      image: await resolveProductImage(item.productId),
      price: item.unitPrice,
      weight: item.variantName || '',
      quantity: item.quantity,
    }))
  );

  const now = new Date(api.orderDate);
  const estDateEnd = new Date(now);
  estDateEnd.setDate(now.getDate() + 5);
  const formatDate = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return {
    id: api.orderNumber,
    backendOrderId: api.id,
    createdAt: api.orderDate,
    items,
    shippingAddress: {
      fullName: api.recipientName || '',
      mobile: api.mobileNo || '',
      email: '',
      pincode: api.postalCode || '',
      address: [api.addressLine1, api.addressLine2].filter(Boolean).join(', '),
      city: api.city || '',
      state: api.state || '',
    },
    deliveryOption: { id: 'std', name: 'Standard Delivery', estimatedDays: '3-5 Days', price: api.deliveryFee || 0 },
    paymentMethod: { id: 'cod', name: 'Cash on Delivery', details: 'Cash on Delivery (COD)' },
    subtotal: api.subtotal,
    discount: (api.discountAmount || 0) + (api.coinDiscountAmount || 0),
    couponCode: api.couponCode || undefined,
    shippingFee: api.deliveryFee || 0,
    tax: Math.round(Math.max(0, api.subtotal - (api.discountAmount || 0)) * 0.05),
    total: api.totalAmount,
    status,
    estimatedDeliveryDate: formatDate(estDateEnd),
    courierName: 'Standard Courier',
    trackingId: api.orderNumber,
    timeline: buildTimelineForStatus(status, api.orderDate, labels),
  };
}

export class OrderService {
  // Synchronous read of whatever's currently cached locally. Use fetchMyOrders()
  // to get the current customer's real, up-to-date order list from the server.
  public static getAllOrders(): Order[] {
    try {
      const data = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fall through
    }
    return [];
  }

  public static saveOrders(orders: Order[]): void {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch (e) {
      console.error('Failed to save orders to localStorage', e);
    }
  }

  // Fetches the logged-in customer's real orders from the backend (scoped by
  // JWT, so it's always specific to whoever is currently signed in) and
  // replaces the local cache with them.
  public static async fetchMyOrders(): Promise<Order[]> {
    if (!CustomerAuthService.isLoggedIn()) {
      this.saveOrders([]);
      return [];
    }

    try {
      const res = await fetch('/api/order', { headers: CustomerAuthService.getAuthHeaders() });
      if (!res.ok) return this.getAllOrders();
      const data = await res.json();
      if (!data?.isSuccess || !Array.isArray(data.orders)) return this.getAllOrders();

      const labels = await LovService.getPublicLabels('OrderStatus');
      const mapped = await Promise.all(data.orders.map((o: any) => mapApiOrderToLocal(o, labels)));
      mapped.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      this.saveOrders(mapped);
      return mapped;
    } catch (err) {
      console.warn('Failed to fetch orders from server:', err);
      return this.getAllOrders();
    }
  }

  public static async cancelOrder(orderId: string, reason: string): Promise<{ success: boolean; message?: string }> {
    const order = this.getOrderById(orderId);
    if (!order) return { success: false, message: 'Order not found.' };
    if (!order.backendOrderId) return { success: false, message: 'This order cannot be cancelled.' };

    try {
      const res = await fetch(`/api/order/${order.backendOrderId}/cancel`, {
        method: 'POST',
        headers: CustomerAuthService.getAuthHeaders(),
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (res.ok && data.isSuccess) {
        await this.fetchMyOrders();
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to cancel order.' };
    }
  }

  public static getOrderById(orderId: string): Order | null {
    const cleanId = orderId.trim().toUpperCase().replace('#', '');
    const orders = this.getAllOrders();
    return (
      orders.find(
        (o) => o.id.toUpperCase() === cleanId || o.id.toUpperCase() === `HY-${cleanId}` || o.id.toUpperCase() === `#${cleanId}`
      ) || null
    );
  }

  public static createOrder(orderPayload: {
    items: CartItem[];
    shippingAddress: ShippingAddress;
    deliveryOption: { id: string; name: string; estimatedDays: string; price: number };
    paymentMethod: { id: string; name: string; details?: string };
    subtotal: number;
    discount: number;
    couponCode?: string;
    shippingFee: number;
    tax: number;
    total: number;
    orderNumber?: string;
  }): Order {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const orderId = orderPayload.orderNumber || `HY-${randomNum}`;

    const now = new Date();
    const estDateStart = new Date(now);
    estDateStart.setDate(now.getDate() + 3);
    const estDateEnd = new Date(now);
    estDateEnd.setDate(now.getDate() + 5);

    const formatDate = (d: Date) =>
      d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    const estimatedDeliveryStr = `${formatDate(estDateStart)} – ${formatDate(estDateEnd)}`;

    const timeline: TrackingStep[] = [
      {
        id: 'confirmed',
        title: 'Order Confirmed',
        description: 'Order successfully placed & verified',
        completed: true,
        current: false,
        timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      {
        id: 'packed',
        title: 'Packed',
        description: 'Your order has been packed in airtight gourmet glass containers',
        completed: true,
        current: true,
        timestamp: 'Estimated today 6:00 PM',
      },
      {
        id: 'shipped',
        title: 'Shipped',
        description: 'Your order has left our Gujarat craft facility',
        completed: false,
        current: false,
      },
      {
        id: 'out_for_delivery',
        title: 'Out for Delivery',
        description: 'Courier executive is on the way to your door',
        completed: false,
        current: false,
      },
      {
        id: 'delivered',
        title: 'Delivered',
        description: 'Handed over safely to you',
        completed: false,
        current: false,
      },
    ];

    const newOrder: Order = {
      id: orderId,
      createdAt: now.toISOString(),
      items: orderPayload.items,
      shippingAddress: orderPayload.shippingAddress,
      deliveryOption: orderPayload.deliveryOption,
      paymentMethod: orderPayload.paymentMethod,
      subtotal: orderPayload.subtotal,
      discount: orderPayload.discount,
      couponCode: orderPayload.couponCode,
      shippingFee: orderPayload.shippingFee,
      tax: orderPayload.tax,
      total: orderPayload.total,
      status: 'Packed',
      estimatedDeliveryDate: estimatedDeliveryStr,
      courierName: 'BlueDart Express',
      trackingId: `BD${Math.floor(100000000 + Math.random() * 900000000)}IN`,
      timeline,
    };

    const orders = this.getAllOrders();
    orders.unshift(newOrder); // Newest first
    this.saveOrders(orders);

    return newOrder;
  }

  public static printInvoice(order: Order): void {
    const windowPrint = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
    if (!windowPrint) return;

    const itemsHTML = order.items
      .map(
        (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <strong>${item.name}</strong><br/>
          <span style="font-size:12px; color:#666;">Pack Size: ${item.weight}</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">₹${item.price * item.quantity}</td>
      </tr>
    `
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice #${order.id} - HIYA Mukhwas</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #11223A; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #CB992C; padding-bottom: 20px; }
            .brand { font-size: 28px; font-weight: bold; color: #11223A; letter-spacing: 2px; }
            .subtitle { font-size: 13px; color: #666; }
            .invoice-title { font-size: 20px; font-weight: bold; color: #CB992C; text-align: right; }
            .info-grid { display: flex; justify-content: space-between; margin: 30px 0; }
            .info-box { width: 48%; background: #FDFBF7; padding: 16px; border-radius: 8px; border: 1px solid #E8E2C9; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #11223A; color: white; padding: 12px; text-align: left; font-size: 13px; }
            .totals { margin-top: 30px; float: right; width: 300px; }
            .totals-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .totals-row.grand { font-size: 18px; font-weight: bold; color: #11223A; border-top: 2px solid #CB992C; border-bottom: none; }
            .footer { margin-top: 100px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">HIYA MUKHWAS</div>
              <div class="subtitle">Premium Authentic Indian Gourmet Mukhwas & Refreshers</div>
            </div>
            <div>
              <div class="invoice-title">TAX INVOICE</div>
              <div style="font-size:13px; text-align:right;">Order #${order.id}</div>
              <div style="font-size:12px; color:#666; text-align:right;">Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}</div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-box">
              <h4 style="margin:0 0 10px 0; color:#11223A;">Billed & Shipped To:</h4>
              <strong>${order.shippingAddress.fullName}</strong><br/>
              ${order.shippingAddress.address}<br/>
              ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}<br/>
              Phone: ${order.shippingAddress.mobile}<br/>
              Email: ${order.shippingAddress.email}
            </div>
            <div class="info-box">
              <h4 style="margin:0 0 10px 0; color:#11223A;">Order Summary Info:</h4>
              <strong>Payment Method:</strong> ${order.paymentMethod.name}<br/>
              <strong>Delivery Mode:</strong> ${order.deliveryOption.name}<br/>
              <strong>Courier:</strong> ${order.courierName}<br/>
              <strong>AWB / Tracking:</strong> ${order.trackingId}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-row">
              <span>Subtotal:</span>
              <span>₹${order.subtotal}</span>
            </div>
            ${order.discount > 0 ? `<div class="totals-row"><span>Discount (${order.couponCode || 'Coupon'}):</span><span>-₹${order.discount}</span></div>` : ''}
            <div class="totals-row">
              <span>Shipping Fee:</span>
              <span>${order.shippingFee === 0 ? 'FREE' : `₹${order.shippingFee}`}</span>
            </div>
            <div class="totals-row grand">
              <span>Grand Total:</span>
              <span>₹${order.total}</span>
            </div>
          </div>

          <div style="clear: both;"></div>

          <div class="footer">
            Thank you for choosing HIYA Mukhwas. For customer care, email support@hiyamukhwas.com or call +91 98765 43210.<br/>
            This is a computer-generated tax invoice.
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    windowPrint.document.write(html);
    windowPrint.document.close();
  }
}
