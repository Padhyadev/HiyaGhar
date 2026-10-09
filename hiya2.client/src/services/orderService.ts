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
  orderNumber?: string;
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
  paymentStatus?: 'Pending' | 'Paid' | 'Failed' | 'Refunded' | string;
  paymentMode?: string;
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
    paymentMethod: {
      id: (api.paymentMode || 'COD').toLowerCase(),
      name: api.paymentMode === 'ONLINE' ? 'Online Payment (Razorpay)' : 'Cash on Delivery (COD)',
      details: api.paymentMode === 'ONLINE' ? 'Razorpay Online' : 'Cash on Delivery',
    },
    paymentStatus: api.paymentStatus || (api.paymentMode === 'ONLINE' ? 'Paid' : 'Pending'),
    paymentMode: api.paymentMode || 'COD',
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

  public static getInvoiceHtml(order: Order): string {
    const itemsHTML = (order.items || [])
      .map(
        (item) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; text-align: left;">
          <strong style="color: #11223A; font-size: 14px;">${item.name}</strong><br/>
          <span style="font-size:12px; color:#666;">Pack Size: ${item.weight || 'Standard'}</span>
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; text-align: left; font-size: 14px;">${item.quantity}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; text-align: left; font-size: 14px;">₹${item.price.toFixed(2)}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; text-align: left; font-weight: bold; font-size: 14px;">₹${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `
      )
      .join('');

    return `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; color: #11223A; background: #ffffff; max-width: 750px; margin: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #CB992C; padding-bottom: 16px;">
          <div>
            <div style="font-size: 24px; font-weight: bold; color: #11223A; letter-spacing: 1.5px;">HIYAGHAR</div>
            <div style="font-size: 12px; color: #666; margin-top: 2px;">Premium Authentic Delicacies & Traditional Products</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 18px; font-weight: bold; color: var(--hiya-gold-text, #855F0F);">TAX INVOICE</div>
            <div style="font-size: 13px; margin-top: 2px;">Order #${order.orderNumber || order.id}</div>
            <div style="font-size: 12px; color: #666; margin-top: 2px;">Date: ${new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN')}</div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin: 20px 0; gap: 16px;">
          <div style="flex: 1; background: #FDFBF7; padding: 14px; border-radius: 8px; border: 1px solid #E8E2C9; font-size: 13px; line-height: 1.5;">
            <h4 style="margin: 0 0 8px 0; color: #11223A; font-size: 14px; font-weight: bold;">Billed & Shipped To:</h4>
            <strong>${order.shippingAddress?.fullName || 'Customer'}</strong><br/>
            ${order.shippingAddress?.address || ''}<br/>
            ${order.shippingAddress?.city || ''}${order.shippingAddress?.state ? `, ${order.shippingAddress.state}` : ''}${order.shippingAddress?.pincode ? ` - ${order.shippingAddress.pincode}` : ''}<br/>
            Phone: ${order.shippingAddress?.mobile || 'N/A'}<br/>
            Email: ${order.shippingAddress?.email || 'N/A'}
          </div>
          <div style="flex: 1; background: #FDFBF7; padding: 14px; border-radius: 8px; border: 1px solid #E8E2C9; font-size: 13px; line-height: 1.5;">
            <h4 style="margin: 0 0 8px 0; color: #11223A; font-size: 14px; font-weight: bold;">Order Summary:</h4>
            <strong>Payment Method:</strong> ${order.paymentMethod?.name || 'Cash on Delivery'}<br/>
            <strong>Delivery Mode:</strong> ${order.deliveryOption?.name || 'Standard Delivery'}<br/>
            <strong>Courier:</strong> ${order.courierName || 'Standard Courier'}<br/>
            <strong>AWB / Tracking:</strong> ${order.trackingId || order.orderNumber || order.id}
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <thead>
            <tr>
              <th style="background: #11223A; color: white; padding: 10px 12px; text-align: left; font-size: 13px; border-top-left-radius: 4px;">Item Description</th>
              <th style="background: #11223A; color: white; padding: 10px 12px; text-align: left; font-size: 13px;">Qty</th>
              <th style="background: #11223A; color: white; padding: 10px 12px; text-align: left; font-size: 13px;">Unit Price</th>
              <th style="background: #11223A; color: white; padding: 10px 12px; text-align: left; font-size: 13px; border-top-right-radius: 4px;">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div style="margin-top: 20px; float: right; width: 280px; font-size: 13px;">
          <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee;">
            <span>Subtotal:</span>
            <span>₹${order.subtotal}</span>
          </div>
          ${order.discount > 0 ? `<div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee; color: #16a34a;"><span>Discount (${order.couponCode || 'Coupon'}):</span><span>-₹${order.discount}</span></div>` : ''}
          <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee;">
            <span>Shipping Fee:</span>
            <span>${order.shippingFee === 0 ? 'FREE' : `₹${order.shippingFee}`}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 10px 0; font-size: 16px; font-weight: bold; color: #11223A; border-top: 2px solid #CB992C;">
            <span>Grand Total:</span>
            <span>₹${order.total}</span>
          </div>
        </div>

        <div style="clear: both;"></div>

        <div style="margin-top: 40px; text-align: center; font-size: 12px; color: var(--hiya-muted, #475467); border-top: 1px solid #eee; padding-top: 15px; line-height: 1.5;">
          Thank you for choosing HIYAGHAR. For customer care, email support@hiyaghar.com or call +91 98765 43210.<br/>
          This is a computer-generated tax invoice and requires no signature.
        </div>
      </div>
    `;
  }

  public static async downloadInvoicePdf(order: Order): Promise<void> {
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const orderNumber = order.orderNumber || order.id || 'N/A';
      const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      // --- Header Brand ---
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(17, 34, 58); // #11223A
      doc.text('HIYAGHAR', 14, 18);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Premium Authentic Delicacies & Traditional Products', 14, 23);

      // --- Header Right (Invoice Details) ---
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(180, 130, 30); // Refined Gold
      doc.text('TAX INVOICE', 196, 16, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`Order #${orderNumber}`, 196, 21.5, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Date: ${orderDate}`, 196, 26, { align: 'right' });

      // --- Divider Line ---
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(14, 29, 196, 29);

      // --- Customer & Order Info Boxes ---
      const infoBoxY = 33;
      const boxHeight = 28;
      const boxWidth = 88;

      // Box 1: Billed & Shipped To
      doc.setFillColor(248, 250, 252); // Soft slate light
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(14, infoBoxY, boxWidth, boxHeight, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text('BILLED & SHIPPED TO', 18, infoBoxY + 5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      const recipient = order.shippingAddress?.fullName || 'Valued Customer';
      doc.text(recipient, 18, infoBoxY + 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      const address = order.shippingAddress?.address || '';
      const cityState = `${order.shippingAddress?.city || ''}${order.shippingAddress?.state ? ', ' + order.shippingAddress.state : ''}${order.shippingAddress?.pincode ? ' - ' + order.shippingAddress.pincode : ''}`;
      const contact = `Phone: ${order.shippingAddress?.mobile || 'N/A'}`;

      const splitAddress = doc.splitTextToSize(`${address}${address ? ', ' : ''}${cityState}`, 80);
      doc.text(splitAddress, 18, infoBoxY + 14.5);
      doc.text(contact, 18, infoBoxY + 24.5);

      // Box 2: Order Summary
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(108, infoBoxY, boxWidth, boxHeight, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text('ORDER & DISPATCH SUMMARY', 112, infoBoxY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);

      doc.text('Payment Mode:', 112, infoBoxY + 10.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(order.paymentMethod?.name || 'Cash on Delivery', 140, infoBoxY + 10.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('Delivery Method:', 112, infoBoxY + 15);
      doc.setTextColor(15, 23, 42);
      doc.text(order.deliveryOption?.name || 'Standard Delivery', 140, infoBoxY + 15);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('Courier / AWB:', 112, infoBoxY + 19.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${order.courierName || 'Standard'} (${order.trackingId || orderNumber})`, 140, infoBoxY + 19.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('Invoice Status:', 112, infoBoxY + 24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 149, 193);
      doc.text('CONFIRMED', 140, infoBoxY + 24);

      // --- Table of Items ---
      const tableRows = (order.items || []).map((item, idx) => [
        (idx + 1).toString(),
        item.name || 'Product',
        item.weight && item.weight !== 'No Variant' && item.weight !== 'Standard' ? item.weight : '-',
        item.quantity.toString(),
        `Rs. ${item.price.toFixed(2)}`,
        `Rs. ${(item.price * item.quantity).toFixed(2)}`,
      ]);

      autoTable(doc, {
        startY: infoBoxY + boxHeight + 5,
        head: [['#', 'Item Description', 'Pack Size', 'Qty', 'Unit Price', 'Amount']],
        body: tableRows,
        theme: 'plain',
        headStyles: {
          fillColor: [17, 34, 58],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'left',
          cellPadding: { top: 2.5, right: 3, bottom: 2.5, left: 3 },
        },
        bodyStyles: {
          fontSize: 7.8,
          textColor: [51, 65, 85],
          halign: 'left',
          cellPadding: { top: 2.2, right: 3, bottom: 2.2, left: 3 },
        },
        alternateRowStyles: {
          fillColor: [250, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 'auto', halign: 'left', fontStyle: 'bold' },
          2: { cellWidth: 26, halign: 'center' },
          3: { cellWidth: 16, halign: 'center' },
          4: { cellWidth: 26, halign: 'right' },
          5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
        },
        didDrawPage: () => {
          // Table borders
        },
        margin: { left: 14, right: 14 },
      });

      // --- Summary / Totals ---
      const finalY = (doc as any).lastAutoTable?.finalY || 130;
      let totalsY = finalY + 6;

      const subtotal = order.subtotal || 0;
      const discount = order.discount || 0;
      const shipping = order.shippingFee || 0;
      const total = order.total || subtotal - discount + shipping;

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(125, totalsY - 2, 71, (discount > 0 ? 32 : 26), 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);

      doc.text('Subtotal:', 129, totalsY + 3);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text(`Rs. ${subtotal.toFixed(2)}`, 192, totalsY + 3, { align: 'right' });

      if (discount > 0) {
        totalsY += 5.5;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(22, 163, 74);
        doc.text(`Discount (${order.couponCode || 'Coupon'}):`, 129, totalsY + 3);
        doc.setFont('helvetica', 'bold');
        doc.text(`-Rs. ${discount.toFixed(2)}`, 192, totalsY + 3, { align: 'right' });
      }

      totalsY += 5.5;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Delivery Fee:', 129, totalsY + 3);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text(shipping === 0 ? 'FREE' : `Rs. ${shipping.toFixed(2)}`, 192, totalsY + 3, { align: 'right' });

      totalsY += 4.5;
      doc.setDrawColor(203, 153, 44);
      doc.setLineWidth(0.4);
      doc.line(129, totalsY + 2, 192, totalsY + 2);

      totalsY += 7;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(17, 34, 58);
      doc.text('Grand Total:', 129, totalsY + 2);
      doc.setFontSize(10);
      doc.setTextColor(180, 130, 30);
      doc.text(`Rs. ${total.toFixed(2)}`, 192, totalsY + 2, { align: 'right' });

      // --- Footer ---
      const pageHeight = doc.internal.pageSize.getHeight();
      const footerY = pageHeight - 16;

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(14, footerY - 4, 196, footerY - 4);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        'Thank you for shopping with HIYAGHAR! Customer Care: support@hiyaghar.com | +91 98765 43210',
        105,
        footerY,
        { align: 'center' }
      );
      doc.text(
        'This is a computer-generated tax invoice and requires no signature.',
        105,
        footerY + 3.5,
        { align: 'center' }
      );

      // Save PDF file to trigger browser download
      doc.save(`Invoice-${orderNumber}.pdf`);
    } catch (err) {
      console.error('Failed to generate vector PDF invoice, falling back to print:', err);
      this.printInvoice(order);
    }
  }

  public static printInvoice(order: Order): void {
    const windowPrint = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
    if (!windowPrint) return;

    const invoiceContent = this.getInvoiceHtml(order);
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice #${order.orderNumber || order.id} - HIYAGHAR</title>
        </head>
        <body>
          ${invoiceContent}
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
