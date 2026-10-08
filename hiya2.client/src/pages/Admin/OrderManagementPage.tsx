import React, { useState, useEffect } from 'react';
import { DataTable, type ColumnDef } from '../../components/admin/DataTable';
import { AdminAuthService } from '../../services/adminAuthService';
import { usePermission } from '../../context/PermissionContext';
import { LovService } from '../../services/lovService';
import { showToast } from '../../utils/alertService';
import './OrderManagementPage.css';

interface AdminOrderItem {
  id: number;
  productId: number;
  variantId?: number | null;
  productName: string;
  variantName?: string | null;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

interface AdminOrder {
  id: number;
  orderNumber: string;
  orderDate: string;
  subtotal: number;
  discountAmount: number;
  couponCode?: string | null;
  coinsUsed: number;
  coinDiscountAmount: number;
  deliveryFee: number;
  totalAmount: number;
  orderStatus: string;
  orderStatusDisplay: string;
  paymentStatus: string;
  paymentMode: string;
  recipientName: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  mobileNo: string;
  cancelReason?: string | null;
  cancelledDate?: string | null;
  courierName?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  items: AdminOrderItem[];
}

const FORWARD_STATUS_OPTIONS = ['Confirmed', 'Processing', 'Packed', 'Shipped', 'OutForDelivery', 'Delivered'];

const STATUS_LABELS: Record<string, string> = {
  Placed: 'Placed',
  Confirmed: 'Confirmed',
  Processing: 'Processing',
  Packed: 'Packed',
  Shipped: 'Shipped',
  OutForDelivery: 'Out for Delivery',
  Delivered: 'Delivered',
  Cancelled: 'Cancelled',
  Returned: 'Returned',
};

const COURIER_PARTNERS = [
  'DTDC Express',
  'Delhivery',
  'Blue Dart',
  'Ekart Logistics',
  'India Post (Speed Post)',
  'Shadowfax',
  'Xpressbees',
  'Ecom Express',
  'Professional Couriers',
  'Self Pickup / Local Delivery',
];

const statusPillClass = (status: string) => {
  if (status === 'Delivered') return 'status-delivered';
  if (status === 'Cancelled' || status === 'Returned') return 'status-cancelled';
  return 'status-progress';
};

export const OrderManagementPage: React.FC = () => {
  const { currentMenuPermission } = usePermission('ORDER');
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [statusLabelMap, setStatusLabelMap] = useState<Record<string, string>>({});
  const [lovStatuses, setLovStatuses] = useState<Array<{ code: string; desc: string }>>([]);
  const [lovCouriers, setLovCouriers] = useState<string[]>([]);
  const formatDropdownStatus = (code: string) => statusLabelMap[code] || STATUS_LABELS[code] || code;

  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  const [statusChoice, setStatusChoice] = useState<string>('');
  const [timeframeFilter, setTimeframeFilter] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState<boolean>(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const handleUpdatePaymentStatus = async (newPaymentStatus: string) => {
    if (!selectedOrder || !newPaymentStatus) return;
    setIsUpdatingPayment(true);
    try {
      const res = await fetch(`/api/order/admin/${selectedOrder.id}/payment-status`, {
        method: 'POST',
        headers: AdminAuthService.getAuthHeaders(),
        body: JSON.stringify({ paymentStatus: newPaymentStatus }),
      });
      const data = await res.json();
      if (res.ok && data.isSuccess) {
        showToast(`Payment status updated to ${newPaymentStatus}`, 'success');
        setSelectedOrder((prev) => prev ? { ...prev, paymentStatus: newPaymentStatus } : null);
        await loadOrders();
      } else {
        showToast(data.message || 'Failed to update payment status', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error updating payment status', 'error');
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  // Shipping Modal State
  const [isShippingModalOpen, setIsShippingModalOpen] = useState<boolean>(false);
  const [shippingModalMode, setShippingModalMode] = useState<'shipped' | 'edit_tracking'>('shipped');
  const [courierName, setCourierName] = useState<string>('DTDC Express');
  const [customCourier, setCustomCourier] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [trackingUrl, setTrackingUrl] = useState<string>('');
  const [shippingErrors, setShippingErrors] = useState<Record<string, string>>({});

  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const loadOrders = async (): Promise<AdminOrder[]> => {
    try {
      const res = await fetch('/api/order/admin?page=1&pageSize=200', {
        headers: AdminAuthService.getAuthHeaders(),
      });
      const data = await res.json();
      const list: AdminOrder[] = data?.isSuccess ? data.orders || [] : [];
      setOrders(list);
      return list;
    } catch (err) {
      console.warn('Failed to load orders:', err);
      return [];
    }
  };

  useEffect(() => {
    setLoading(true);
    // Parse URL params for initial filters
    const params = new URLSearchParams(window.location.search);
    const targetOrderNumber = params.get('orderNumber');
    const tfParam = params.get('timeframe');
    const statusParam = params.get('status');
    const statusGroupParam = params.get('statusGroup');

    if (tfParam && ['today', 'week', 'month', 'all'].includes(tfParam)) {
      setTimeframeFilter(tfParam);
    }
    if (statusParam) {
      setFilterStatus(statusParam);
    } else if (statusGroupParam === 'pending') {
      setFilterStatus('pending_group');
    }

    loadOrders().then((list) => {
      if (targetOrderNumber && list.length > 0) {
        const found = list.find((o) => o.orderNumber === targetOrderNumber);
        if (found) {
          setSelectedOrder(found);
          setViewMode('detail');
        }
      }
    }).finally(() => setLoading(false));

    LovService.getItems('OrderStatus').then((items) => {
      if (Array.isArray(items) && items.length > 0) {
        const activeItems = items
          .filter((it) => it.isActive)
          .sort((a, b) => a.displayOrder - b.displayOrder);
        setLovStatuses(activeItems.map((it) => ({ code: it.lovCode, desc: it.lovDesc })));
        
        const map: Record<string, string> = {};
        items.forEach((it) => { map[it.lovCode] = it.lovDesc; });
        setStatusLabelMap(map);
      } else {
        LovService.getPublicLabels('OrderStatus').then(setStatusLabelMap);
      }
    }).catch(() => {
      LovService.getPublicLabels('OrderStatus').then(setStatusLabelMap);
    });

    LovService.getItems('CourierPartner').then((items) => {
      if (Array.isArray(items) && items.length > 0) {
        const activeCouriers = items
          .filter((it) => it.isActive)
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((it) => it.lovDesc);
        if (activeCouriers.length > 0) {
          setLovCouriers(activeCouriers);
        }
      }
    }).catch((e) => console.warn('Failed to load couriers from LOV', e));
  }, []);

  const handleViewOrder = (order: AdminOrder) => {
    setSelectedOrder(order);
    setStatusChoice('');
    setStatusError(null);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    // Clear query params if present when returning to list
    if (window.location.search.includes('orderNumber')) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    setSelectedOrder(null);
    setViewMode('list');
  };

  const handleOpenEditTrackingModal = () => {
    if (!selectedOrder) return;
    setShippingModalMode('edit_tracking');
    const existingCourier = selectedOrder.courierName || '';
    if (COURIER_PARTNERS.includes(existingCourier)) {
      setCourierName(existingCourier);
      setCustomCourier('');
    } else if (existingCourier) {
      setCourierName('Other');
      setCustomCourier(existingCourier);
    } else {
      setCourierName('DTDC Express');
      setCustomCourier('');
    }
    setTrackingNumber(selectedOrder.trackingNumber || '');
    setTrackingUrl(selectedOrder.trackingUrl || '');
    setShippingErrors({});
    setIsShippingModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !statusChoice) return;

    if (statusChoice === 'Shipped') {
      setShippingModalMode('shipped');
      const existingCourier = selectedOrder.courierName || '';
      if (COURIER_PARTNERS.includes(existingCourier)) {
        setCourierName(existingCourier);
        setCustomCourier('');
      } else if (existingCourier) {
        setCourierName('Other');
        setCustomCourier(existingCourier);
      } else {
        setCourierName('DTDC Express');
        setCustomCourier('');
      }
      setTrackingNumber(selectedOrder.trackingNumber || '');
      setTrackingUrl(selectedOrder.trackingUrl || '');
      setShippingErrors({});
      setIsShippingModalOpen(true);
      return;
    }

    await performStatusUpdate({ status: statusChoice });
  };

  const handleConfirmShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const errors: Record<string, string> = {};
    const effectiveCourier = courierName === 'Other' ? customCourier.trim() : courierName;
    if (!effectiveCourier) {
      errors.courierName = 'Please enter courier partner name';
    }
    if (!trackingNumber.trim()) {
      errors.trackingNumber = 'Please enter tracking number / AWB';
    }

    if (Object.keys(errors).length > 0) {
      setShippingErrors(errors);
      return;
    }
    setShippingErrors({});

    setIsShippingModalOpen(false);

    if (shippingModalMode === 'edit_tracking') {
      await performTrackingUpdate({
        courierName: effectiveCourier,
        trackingNumber: trackingNumber.trim(),
        trackingUrl: trackingUrl.trim() || undefined,
      });
    } else {
      await performStatusUpdate({
        status: 'Shipped',
        courierName: effectiveCourier,
        trackingNumber: trackingNumber.trim(),
        trackingUrl: trackingUrl.trim() || undefined,
      });
    }
  };

  const performTrackingUpdate = async (payload: {
    courierName: string;
    trackingNumber: string;
    trackingUrl?: string;
  }) => {
    if (!selectedOrder) return;
    setIsUpdatingStatus(true);
    setStatusError(null);
    try {
      const res = await fetch(`/api/order/admin/${selectedOrder.id}/tracking`, {
        method: 'POST',
        headers: AdminAuthService.getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.isSuccess) {
        const updatedList = await loadOrders();
        const refreshed = updatedList.find((o) => o.id === selectedOrder.id);
        if (refreshed) {
          setSelectedOrder(refreshed);
        }
        showToast('Tracking details updated successfully.', 'success');
      } else {
        setStatusError(data.message || 'Failed to update tracking details.');
      }
    } catch (err: any) {
      setStatusError(err.message || 'Network error while updating tracking.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const performStatusUpdate = async (payload: {
    status: string;
    reason?: string;
    courierName?: string;
    trackingNumber?: string;
    trackingUrl?: string;
  }) => {
    if (!selectedOrder) return;
    setIsUpdatingStatus(true);
    setStatusError(null);
    try {
      const res = await fetch(`/api/order/admin/${selectedOrder.id}/status`, {
        method: 'POST',
        headers: AdminAuthService.getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.isSuccess) {
        await loadOrders();
        showToast('Order status updated successfully.', 'success');
        setTimeout(() => {
          setIsUpdatingStatus(false);
          handleBackToList();
        }, 900);
      } else {
        setStatusError(data.message || 'Failed to update status.');
        setIsUpdatingStatus(false);
      }
    } catch (err: any) {
      setStatusError(err.message || 'Network error while updating status.');
      setIsUpdatingStatus(false);
    }
  };

  const handleDownloadInvoicePdf = async () => {
    if (!selectedOrder) return;
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const orderNumber = selectedOrder.orderNumber || 'N/A';
      const orderDate = new Date(selectedOrder.orderDate || Date.now()).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      // Brand Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(17, 34, 58); // #11223A
      doc.text('HIYAGHAR', 14, 18);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Premium Authentic Delicacies & Traditional Products', 14, 23);

      // Header Right
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

      // Divider Line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(14, 29, 196, 29);

      // Info Boxes
      const infoBoxY = 33;
      const boxHeight = 28;
      const boxWidth = 88;

      // Box 1: Billed & Shipped To
      doc.setFillColor(248, 250, 252);
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
      const recipient = selectedOrder.recipientName || 'Valued Customer';
      doc.text(recipient, 18, infoBoxY + 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      const address = [selectedOrder.addressLine1, selectedOrder.addressLine2].filter(Boolean).join(', ');
      const cityState = `${selectedOrder.city || ''}${selectedOrder.state ? ', ' + selectedOrder.state : ''}${selectedOrder.postalCode ? ' - ' + selectedOrder.postalCode : ''}`;
      const contact = `Phone: ${selectedOrder.mobileNo || 'N/A'}`;

      const splitAddress = doc.splitTextToSize(`${address}${address ? ', ' : ''}${cityState}`, 80);
      doc.text(splitAddress, 18, infoBoxY + 14.5);
      doc.text(contact, 18, infoBoxY + 24.5);

      // Box 2: Order & Courier Info
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
      doc.text(`${selectedOrder.paymentMode || 'COD'} (${selectedOrder.paymentStatus || 'Pending'})`, 140, infoBoxY + 10.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('Order Status:', 112, infoBoxY + 15);
      doc.setTextColor(15, 23, 42);
      doc.text(selectedOrder.orderStatusDisplay || 'Placed', 140, infoBoxY + 15);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('Courier / AWB:', 112, infoBoxY + 19.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${selectedOrder.courierName || 'Standard'} (${selectedOrder.trackingNumber || selectedOrder.orderNumber})`, 140, infoBoxY + 19.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('Invoice Status:', 112, infoBoxY + 24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 149, 193);
      doc.text('CONFIRMED', 140, infoBoxY + 24);

      // Table of Items
      const tableRows = (selectedOrder.items || []).map((item, idx) => [
        (idx + 1).toString(),
        item.productName || 'Product',
        item.variantName && item.variantName !== 'No Variant' && item.variantName !== 'Standard' ? item.variantName : '-',
        item.quantity.toString(),
        `Rs. ${item.unitPrice.toFixed(2)}`,
        `Rs. ${item.totalPrice.toFixed(2)}`,
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
        margin: { left: 14, right: 14 },
      });

      // Totals summary
      const finalY = (doc as any).lastAutoTable?.finalY || 130;
      let totalsY = finalY + 6;

      const subtotal = selectedOrder.subtotal || 0;
      const discount = (selectedOrder.discountAmount || 0) + (selectedOrder.coinDiscountAmount || 0);
      const shipping = selectedOrder.deliveryFee || 0;
      const total = selectedOrder.totalAmount || subtotal - discount + shipping;

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
        doc.text(`Discount (${selectedOrder.couponCode || 'Coupon'}):`, 129, totalsY + 3);
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

      // Footer
      const pageHeight = doc.internal.pageSize.getHeight();
      const footerY = pageHeight - 16;

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(14, footerY - 4, 196, footerY - 4);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        'Thank you for choosing HIYAGHAR! For support, email support@hiyaghar.com or call +91 98765 43210.',
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

      doc.save(`Invoice-${orderNumber}.pdf`);
      showToast('Invoice PDF downloaded successfully.', 'success');
    } catch (err) {
      console.error('Failed to generate PDF, falling back to window.print():', err);
      handlePrintInvoice();
    }
  };

  const handlePrintInvoice = () => {
    if (!selectedOrder) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the invoice.');
      return;
    }

    const itemsHtml = (selectedOrder.items || [])
      .map(
        (it, idx) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${idx + 1}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>${it.productName}</strong> ${it.variantName ? `<span style="color: #64748b;">(${it.variantName})</span>` : ''}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">₹${it.unitPrice.toFixed(2)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${it.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">₹${it.totalPrice.toFixed(2)}</td>
        </tr>
      `
      )
      .join('');

    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${selectedOrder.orderNumber} - HIYAGHAR</title>
        <meta charset="utf-8" />
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; margin: 0; padding: 25px; background: #fff; }
          .invoice-box { max-width: 800px; margin: auto; border: 1px solid #e2e8f0; padding: 30px; border-radius: 8px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #D19A27; padding-bottom: 15px; margin-bottom: 20px; }
          .logo { font-size: 26px; font-weight: 900; color: #10243E; letter-spacing: 1px; }
          .logo span { color: #D19A27; }
          .invoice-title { font-size: 20px; font-weight: 700; color: #64748b; text-align: right; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
          .block h4 { margin: 0 0 8px 0; color: #10243E; font-size: 14px; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
          .block p { margin: 4px 0; font-size: 13.5px; color: #334155; line-height: 1.4; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13.5px; }
          th { background: #f8fafc; color: #475569; padding: 10px; border-bottom: 2px solid #cbd5e1; text-align: left; }
          .summary-table { width: 320px; margin-left: auto; margin-top: 20px; border-collapse: collapse; font-size: 14px; }
          .summary-table td { padding: 6px 10px; }
          .total-row td { border-top: 2px solid #10243E; font-size: 16px; font-weight: 800; color: #10243E; padding-top: 10px; }
          .footer { margin-top: 40px; padding-top: 15px; border-top: 1px dashed #cbd5e1; text-align: center; font-size: 12px; color: #94a3b8; }
          .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; background: #e0f2fe; color: #0369a1; }
          @media print {
            body { padding: 0; }
            .invoice-box { border: none; padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="header">
            <div>
              <div class="logo">HIYA<span>GHAR</span></div>
              <p style="margin: 4px 0; font-size: 12px; color: #64748b;">Premium Mukhwas & Traditional Delicacies</p>
            </div>
            <div class="invoice-title">
              TAX INVOICE / RECEIPT<br />
              <span style="font-size: 13px; font-weight: 500; color: #1e293b;">Order: #${selectedOrder.orderNumber}</span>
            </div>
          </div>

          <div class="grid">
            <div class="block">
              <h4>Billed & Shipped To:</h4>
              <p><strong>${selectedOrder.recipientName}</strong></p>
              <p>${selectedOrder.addressLine1} ${selectedOrder.addressLine2 || ''}</p>
              <p>${selectedOrder.city}, ${selectedOrder.state} - ${selectedOrder.postalCode}</p>
              <p>Mobile: +91 ${selectedOrder.mobileNo}</p>
            </div>
            <div class="block">
              <h4>Order & Payment Details:</h4>
              <p><strong>Order Date:</strong> ${new Date(selectedOrder.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              <p><strong>Payment Mode:</strong> ${selectedOrder.paymentMode} (${selectedOrder.paymentStatus})</p>
              <p><strong>Order Status:</strong> ${selectedOrder.orderStatusDisplay}</p>
              ${selectedOrder.courierName ? `<p><strong>Courier:</strong> ${selectedOrder.courierName} (AWB: ${selectedOrder.trackingNumber || '-'})</p>` : ''}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">#</th>
                <th>Item Description</th>
                <th style="text-align: right; width: 100px;">Rate</th>
                <th style="text-align: center; width: 70px;">Qty</th>
                <th style="text-align: right; width: 110px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <table class="summary-table">
            <tr>
              <td style="color: #64748b;">Subtotal:</td>
              <td style="text-align: right; font-weight: 600;">₹${selectedOrder.subtotal.toFixed(2)}</td>
            </tr>
            ${selectedOrder.discountAmount > 0 ? `
              <tr>
                <td style="color: #16a34a;">Discount ${selectedOrder.couponCode ? `(${selectedOrder.couponCode})` : ''}:</td>
                <td style="text-align: right; color: #16a34a; font-weight: 600;">-₹${selectedOrder.discountAmount.toFixed(2)}</td>
              </tr>
            ` : ''}
            ${selectedOrder.coinsUsed > 0 ? `
              <tr>
                <td style="color: #d97706;">Coins Redeemed (${selectedOrder.coinsUsed}):</td>
                <td style="text-align: right; color: #d97706; font-weight: 600;">-₹${selectedOrder.coinDiscountAmount.toFixed(2)}</td>
              </tr>
            ` : ''}
            <tr>
              <td style="color: #64748b;">Delivery Charges:</td>
              <td style="text-align: right; font-weight: 600;">₹${selectedOrder.deliveryFee.toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td>Grand Total:</td>
              <td style="text-align: right;">₹${selectedOrder.totalAmount.toFixed(2)}</td>
            </tr>
          </table>

          <div class="footer">
            <p>Thank you for choosing <strong>HIYAGHAR</strong>! For support, contact support@hiyaghar.com</p>
            <p style="margin-top: 4px;">This is a computer generated invoice and does not require physical signature.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 400);
  };

  const handleOpenCancelModal = () => {
    setCancelReason('');
    setCancelError(null);
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedOrder) return;
    if (!cancelReason.trim()) {
      setCancelError('Please enter a cancellation reason');
      return;
    }

    setIsCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch(`/api/order/admin/${selectedOrder.id}/status`, {
        method: 'POST',
        headers: AdminAuthService.getAuthHeaders(),
        body: JSON.stringify({ status: 'Cancelled', reason: cancelReason.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.isSuccess) {
        setIsCancelModalOpen(false);
        await loadOrders();
        showToast('Order cancelled successfully.', 'success');
        setTimeout(() => {
          setIsCancelling(false);
          handleBackToList();
        }, 900);
      } else {
        setCancelError(data.message || 'Failed to cancel order.');
        setIsCancelling(false);
      }
    } catch (err: any) {
      setCancelError(err.message || 'Network error while cancelling order.');
      setIsCancelling(false);
    }
  };

  const columns: ColumnDef<AdminOrder>[] = [
    { key: 'orderNumber', label: 'Order Number' },
    { key: 'recipientName', label: 'Recipient' },
    { key: 'mobileNo', label: 'Mobile' },
    { key: 'totalAmount', label: 'Total', render: (o) => `₹${o.totalAmount.toFixed(2)}` },
    {
      key: 'paymentStatus',
      label: 'Payment',
      render: (o) => (
        <span className={`hiyaghar-order-status-pill ${o.paymentStatus === 'Paid' ? 'status-delivered' : 'status-progress'}`}>
          {o.paymentStatus}
        </span>
      ),
    },
    {
      key: 'orderStatus',
      label: 'Status',
      render: (o) => (
        <span className={`hiyaghar-order-status-pill ${statusPillClass(o.orderStatus)}`}>
          {o.orderStatusDisplay}
        </span>
      ),
    },
    {
      key: 'orderDate',
      label: 'Order Date',
      render: (o) => new Date(o.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    },
  ];

  // Helper to parse order date
  const parseOrderDate = (dateStr: string): Date => new Date(dateStr);

  const filteredOrders = orders.filter((o) => {
    // Timeframe filter
    if (timeframeFilter !== 'all' && o.orderDate) {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const startOfWeek = startOfToday - 6 * 24 * 60 * 60 * 1000;
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      const orderTime = parseOrderDate(o.orderDate).getTime();

      if (timeframeFilter === 'today' && orderTime < startOfToday) return false;
      if (timeframeFilter === 'week' && orderTime < startOfWeek) return false;
      if (timeframeFilter === 'month' && orderTime < startOfMonth) return false;
    }

    // Status filter (including pending_group)
    if (filterStatus === 'pending_group') {
      if (!['Placed', 'Confirmed', 'Processing'].includes(o.orderStatus)) return false;
    } else if (filterStatus !== 'all' && o.orderStatus !== filterStatus) {
      return false;
    }

    // Payment filter
    if (filterPayment !== 'all' && o.paymentStatus !== filterPayment) return false;

    return true;
  });

  const orderFilters = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Timeframe:</span>
        <select
          value={timeframeFilter}
          onChange={(e) => setTimeframeFilter(e.target.value)}
          className="hiyaghar-select-pagesize"
          style={{ padding: '4px 8px', fontSize: '0.85rem', minWidth: '110px' }}
          aria-label="Filter by Timeframe"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Status:</span>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="hiyaghar-select-pagesize"
          style={{ padding: '4px 8px', fontSize: '0.85rem', minWidth: '130px' }}
          aria-label="Filter by Order Status"
        >
          <option value="all">All Statuses</option>
          <option value="pending_group">Pending / To Ship</option>
          {Object.entries(STATUS_LABELS).map(([code, label]) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Payment:</span>
        <select
          value={filterPayment}
          onChange={(e) => setFilterPayment(e.target.value)}
          className="hiyaghar-select-pagesize"
          style={{ padding: '4px 8px', fontSize: '0.85rem', minWidth: '120px' }}
          aria-label="Filter by Payment Status"
        >
          <option value="all">All Payments</option>
          <option value="Pending">Pending</option>
          <option value="Paid">Paid</option>
          <option value="Refunded">Refunded</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="hiyaghar-admin-page-container">
      {viewMode === 'list' ? (
        <DataTable
          title="Order Management"
          columns={columns}
          data={filteredOrders}
          extraControls={orderFilters}
          loading={loading}
          canAdd={false}
          canDelete={false}
          canEdit={currentMenuPermission.canView}
          onEditClick={handleViewOrder}
        />
      ) : selectedOrder ? (
        <div className="hiyaghar-order-detail-wrapper">
        <div className={`hiyaghar-datatable-card ${(isUpdatingStatus || isCancelling) ? 'is-blurred' : ''}`}>
          <div className="hiyaghar-datatable-top-header">
            <h2 className="hiyaghar-datatable-title">Order #{selectedOrder.orderNumber}</h2>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="hiyaghar-panel-btn"
                onClick={handleDownloadInvoicePdf}
                style={{ background: '#D19A27', color: '#10243E', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Download Invoice (PDF)</span>
              </button>
              <button
                type="button"
                className="hiyaghar-panel-btn"
                onClick={handlePrintInvoice}
                style={{ background: '#10243E', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                <span>Print Bill</span>
              </button>
              <button type="button" className="hiyaghar-export-btn" onClick={handleBackToList}>
                ← Back to Orders
              </button>
            </div>
          </div>

          <div className="hiyaghar-order-detail-grid">
            <div className="hiyaghar-order-detail-block">
              <h4>Shipping Details</h4>
              <p>{selectedOrder.recipientName}</p>
              <p>{selectedOrder.mobileNo}</p>
              <p>{selectedOrder.addressLine1}{selectedOrder.addressLine2 ? `, ${selectedOrder.addressLine2}` : ''}</p>
              <p>{selectedOrder.city}, {selectedOrder.state} - {selectedOrder.postalCode}</p>
            </div>

            <div className="hiyaghar-order-detail-block">
              <h4>Order Summary</h4>
              <p>Subtotal: ₹{selectedOrder.subtotal.toFixed(2)}</p>
              {selectedOrder.discountAmount > 0 && (
                <p>Discount: -₹{selectedOrder.discountAmount.toFixed(2)} {selectedOrder.couponCode ? `(${selectedOrder.couponCode})` : ''}</p>
              )}
              {selectedOrder.coinsUsed > 0 && (
                <p>Coins Redeemed: {selectedOrder.coinsUsed} (-₹{selectedOrder.coinDiscountAmount.toFixed(2)})</p>
              )}
              <p>Delivery: ₹{selectedOrder.deliveryFee.toFixed(2)}</p>
              <p style={{ fontWeight: 700, fontSize: '1.05rem', marginTop: '6px' }}>
                Total: ₹{selectedOrder.totalAmount.toFixed(2)}
              </p>
            </div>

            <div className="hiyaghar-order-detail-block">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #EAE4D3', paddingBottom: '6px', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, borderBottom: 'none', paddingBottom: 0 }}>Status & Courier Info</h4>
                {currentMenuPermission.canEdit && selectedOrder.orderStatus !== 'Cancelled' && (
                  <button
                    type="button"
                    onClick={handleOpenEditTrackingModal}
                    style={{
                      background: '#FFFDF0',
                      border: '1px solid #D19A27',
                      color: '#D19A27',
                      padding: '3px 9px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    <span>Edit Tracking</span>
                  </button>
                )}
              </div>
              <p>Payment Mode: <strong>{selectedOrder.paymentMode}</strong></p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
                <span>Payment Status:</span>
                <span className={`hiyaghar-order-status-pill ${selectedOrder.paymentStatus === 'Paid' ? 'status-delivered' : 'status-progress'}`}>
                  {selectedOrder.paymentStatus}
                </span>
                {currentMenuPermission.canEdit && (
                  <select
                    value={selectedOrder.paymentStatus}
                    onChange={(e) => handleUpdatePaymentStatus(e.target.value)}
                    disabled={isUpdatingPayment}
                    className="hiyaghar-select-pagesize"
                    style={{ padding: '2px 8px', fontSize: '0.8rem', height: '28px', marginLeft: '4px' }}
                    aria-label="Change Payment Status"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                )}
              </div>
              <p>Order Status: {selectedOrder.orderStatusDisplay}</p>
              {selectedOrder.courierName && (
                <p style={{ color: '#0369a1', fontWeight: 600, marginTop: '4px' }}>
                  Courier: {selectedOrder.courierName}
                </p>
              )}
              {selectedOrder.trackingNumber && (
                <p style={{ color: '#0369a1', fontSize: '0.85rem' }}>
                  AWB / Tracking: <strong>{selectedOrder.trackingNumber}</strong>
                  {selectedOrder.trackingUrl && (
                    <a
                      href={selectedOrder.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ marginLeft: '8px', color: '#D19A27', textDecoration: 'underline' }}
                    >
                      Track Shipment ↗
                    </a>
                  )}
                </p>
              )}
              {selectedOrder.cancelReason && (
                <p style={{ color: '#b42318', marginTop: '4px' }}>Cancel Reason: {selectedOrder.cancelReason}</p>
              )}
            </div>
          </div>

          <div className="hiyaghar-order-items-table">
            <h4>Ordered Items ({selectedOrder.items?.length || 0})</h4>
            <div className="hiyaghar-table-responsive" style={{ border: '1px solid #EAE4D3', borderRadius: '10px', overflow: 'hidden' }}>
              <table className="hiyaghar-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>Product</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>Variant</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px' }}>Price</th>
                    <th style={{ textAlign: 'center', padding: '12px 16px' }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedOrder.items || []).map((it) => (
                    <tr key={it.id}>
                      <td style={{ fontWeight: 600, color: '#10243E' }}>{it.productName}</td>
                      <td style={{ color: '#64748b' }}>{it.variantName || '-'}</td>
                      <td style={{ textAlign: 'right' }}>₹{it.unitPrice.toFixed(2)}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{it.quantity}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#10243E' }}>₹{it.totalPrice.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {currentMenuPermission.canEdit && selectedOrder.orderStatus !== 'Cancelled' && selectedOrder.orderStatus !== 'Delivered' && (
            <div className="hiyaghar-order-status-actions">
              <div className="hiyaghar-order-status-select-wrap">
                <label>Change Status to:</label>
                <select
                  value={statusChoice}
                  onChange={(e) => setStatusChoice(e.target.value)}
                  className="hiyaghar-select-pagesize"
                >
                  <option value="">-- Choose New Status --</option>
                  {lovStatuses.length > 0
                    ? lovStatuses.map((st) => (
                        <option key={st.code} value={st.code} disabled={st.code === selectedOrder.orderStatus}>
                          {st.desc}
                        </option>
                      ))
                    : FORWARD_STATUS_OPTIONS.map((st) => (
                        <option key={st} value={st} disabled={st === selectedOrder.orderStatus}>
                          {formatDropdownStatus(st)}
                        </option>
                      ))}
                </select>
                <button
                  type="button"
                  className="hiyaghar-panel-btn primary"
                  disabled={!statusChoice || isUpdatingStatus}
                  onClick={handleUpdateStatus}
                >
                  {isUpdatingStatus ? 'Updating...' : 'Update Status'}
                </button>
              </div>

              {selectedOrder.orderStatus !== 'Cancelled' && (
                <button
                  type="button"
                  className="hiyaghar-panel-btn danger"
                  onClick={handleOpenCancelModal}
                  disabled={isCancelling}
                >
                  Cancel Order
                </button>
              )}
            </div>
          )}
          {statusError && <p className="hiyaghar-order-error-text">{statusError}</p>}
        </div>

        {(isUpdatingStatus || isCancelling) && (
          <div className="hiyaghar-order-loading-overlay">
            <div className="hiyaghar-order-spinner" />
            <span className="hiyaghar-order-loading-text">
              {isCancelling ? 'Cancelling order...' : 'Updating status...'}
            </span>
          </div>
        )}
        </div>
      ) : null}

      {/* Courier & Tracking Modal for Shipped status / Edit Tracking */}
      {isShippingModalOpen && selectedOrder && (
        <div className="hiyaghar-modal-overlay" onClick={() => setIsShippingModalOpen(false)}>
          <div className="hiyaghar-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="hiyaghar-modal-header">
              <h3>{shippingModalMode === 'edit_tracking' ? 'Edit Tracking Details' : 'Shipping & Courier Details'}</h3>
              <button type="button" className="close-btn" onClick={() => setIsShippingModalOpen(false)}>
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#667085', margin: '0 0 16px 0' }}>
              {shippingModalMode === 'edit_tracking'
                ? `Update the courier partner and tracking details for Order #${selectedOrder.orderNumber}.`
                : `Mark Order #${selectedOrder.orderNumber} as Shipped by providing tracking details.`}
            </p>

            <form onSubmit={handleConfirmShipping} noValidate>
              <div className="hiyaghar-form-group">
                <label>Courier Company / Partner *</label>
                <select
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="hiyaghar-search-input"
                  style={{ width: '100%', marginBottom: '8px' }}
                >
                  {(lovCouriers.length > 0 ? lovCouriers : COURIER_PARTNERS).map((cp) => (
                    <option key={cp} value={cp}>
                      {cp}
                    </option>
                  ))}
                  <option value="Other">Other Courier...</option>
                </select>
                {courierName === 'Other' && (
                  <input
                    type="text"
                    placeholder="Enter custom courier name"
                    className={`hiyaghar-search-input ${shippingErrors.courierName ? 'input-error' : ''}`}
                    style={{ width: '100%', marginTop: '6px' }}
                    value={customCourier}
                    onChange={(e) => setCustomCourier(e.target.value)}
                  />
                )}
                {shippingErrors.courierName && <span className="hiyaghar-field-error">{shippingErrors.courierName}</span>}
              </div>

              <div className="hiyaghar-form-group">
                <label>AWB / Tracking Number *</label>
                <input
                  type="text"
                  placeholder="e.g. DTDC12345678 or DELHIVERY9988"
                  className={`hiyaghar-search-input ${shippingErrors.trackingNumber ? 'input-error' : ''}`}
                  style={{ width: '100%' }}
                  value={trackingNumber}
                  onChange={(e) => {
                    setTrackingNumber(e.target.value);
                    if (shippingErrors.trackingNumber) setShippingErrors((prev) => ({ ...prev, trackingNumber: '' }));
                  }}
                />
                {shippingErrors.trackingNumber && <span className="hiyaghar-field-error">{shippingErrors.trackingNumber}</span>}
              </div>

              <div className="hiyaghar-form-group">
                <label>Tracking URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://track.dtdc.com/..."
                  className="hiyaghar-search-input"
                  style={{ width: '100%' }}
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                />
              </div>

              <div className="hiyaghar-modal-footer" style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  className="hiyaghar-btn-cancel"
                  onClick={() => setIsShippingModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="hiyaghar-panel-btn primary"
                >
                  {shippingModalMode === 'edit_tracking' ? 'Save Tracking Details' : 'Confirm & Mark Shipped'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {isCancelModalOpen && selectedOrder && (
        <div className="hiyaghar-modal-overlay" onClick={() => setIsCancelModalOpen(false)}>
          <div className="hiyaghar-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="hiyaghar-modal-header">
              <h3>Cancel Order #{selectedOrder.orderNumber}</h3>
              <button type="button" className="close-btn" onClick={() => setIsCancelModalOpen(false)}>
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#667085', margin: '0 0 14px 0' }}>
              Please provide a reason for cancelling this order. This can't be undone.
            </p>

            <textarea
              className={`hiyaghar-order-cancel-textarea ${cancelError ? 'input-error' : ''}`}
              value={cancelReason}
              onChange={(e) => {
                setCancelReason(e.target.value);
                if (cancelError) setCancelError(null);
              }}
              placeholder="e.g. Out of stock, customer requested, fraud check failed..."
            />

            {cancelError && <span className="hiyaghar-field-error">{cancelError}</span>}

            <div className="hiyaghar-modal-footer">
              <button
                type="button"
                className="hiyaghar-btn-cancel"
                onClick={() => setIsCancelModalOpen(false)}
                disabled={isCancelling}
              >
                Keep Order
              </button>
              <button
                type="button"
                className="hiyaghar-panel-btn danger"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
