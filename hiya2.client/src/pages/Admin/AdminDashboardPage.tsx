import React, { useState, useEffect, useMemo } from 'react';
import { AdminAuthService } from '../../services/adminAuthService';
import './AdminDashboardPage.css';

interface AdminDashboardPageProps {
  onNavigate: (routeHash: string) => void;
}

interface RawOrder {
  id: number;
  orderNumber: string;
  recipientName: string;
  totalAmount: number;
  orderStatus: string;
  orderDate: string;
  paymentMode?: string;
  items?: Array<{
    productName: string;
    quantity: number;
    totalPrice: number;
  }>;
}

type TimeFilterType = 'today' | 'week' | 'month' | 'all';

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onNavigate }) => {
  const user = AdminAuthService.getUser();
  const [loading, setLoading] = useState<boolean>(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>('week');

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [orders, setOrders] = useState<RawOrder[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<{ outOfStockCount: number; lowStockCount: number }>({
    outOfStockCount: 0,
    lowStockCount: 0,
  });

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    setLoading(true);
    try {
      const headers = AdminAuthService.getAuthHeaders();
      const [productsRes, categoriesRes, customersRes, ordersRes, stockRes] = await Promise.allSettled([
        fetch('/api/product', { headers }),
        fetch('/api/category', { headers }),
        fetch('/api/customer', { headers }),
        fetch('/api/order/admin?page=1&pageSize=200', { headers }),
        fetch('/api/stock', { headers }),
      ]);

      const stockMap: Record<number, number> = {};
      let outCount = 0;
      let lowCount = 0;
      if (stockRes.status === 'fulfilled' && stockRes.value.ok) {
        const stockData = await stockRes.value.json();
        const items = stockData.items || [];
        items.forEach((s: any) => {
          stockMap[s.productId] = (stockMap[s.productId] || 0) + (s.availableStock ?? 0);
          const sellable = typeof s.sellableStock === 'number' ? s.sellableStock : ((s.availableStock ?? 0) - (s.reservedStock ?? 0));
          if (sellable <= 0) {
            outCount++;
          } else if (sellable <= 5) {
            lowCount++;
          }
        });
        setInventoryAlerts({ outOfStockCount: outCount, lowStockCount: lowCount });
      }

      if (productsRes.status === 'fulfilled' && productsRes.value.ok) {
        const data = await productsRes.value.json();
        if (Array.isArray(data)) {
          const mapped = data.map((p: any) => ({
            ...p,
            stockQuantity: stockMap[p.id] !== undefined ? stockMap[p.id] : (p.stockQuantity ?? 0),
          }));
          setProducts(mapped);
        }
      }

      if (categoriesRes.status === 'fulfilled' && categoriesRes.value.ok) {
        const data = await categoriesRes.value.json();
        if (Array.isArray(data)) setCategories(data);
      }

      if (customersRes.status === 'fulfilled' && customersRes.value.ok) {
        const data = await customersRes.value.json();
        if (Array.isArray(data)) setCustomers(data);
      }

      if (ordersRes.status === 'fulfilled' && ordersRes.value.ok) {
        const data = await ordersRes.value.json();
        const list = data?.isSuccess && Array.isArray(data.orders) ? data.orders : Array.isArray(data) ? data : [];
        setOrders(list);
      }
    } catch (e) {
      console.warn('Dashboard stats load notice:', e);
    } finally {
      setLoading(false);
    }
  };

  // Helper: get local YYYY-MM-DD from a date (avoids UTC shift from toISOString)
  const toLocalDateStr = (d: Date): string => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Helper: parse server orderDate (no timezone = local IST) to local-time Date
  const parseOrderDate = (dateStr: string): Date => new Date(dateStr);

  // Filtered Orders & Metrics based on active Time Filter
  const filteredMetrics = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = startOfToday - 6 * 24 * 60 * 60 * 1000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const filtered = orders.filter((o) => {
      if (!o.orderDate) return timeFilter === 'all';
      const orderTime = parseOrderDate(o.orderDate).getTime();
      if (timeFilter === 'today') return orderTime >= startOfToday;
      if (timeFilter === 'week') return orderTime >= startOfWeek;
      if (timeFilter === 'month') return orderTime >= startOfMonth;
      return true;
    });

    const totalOrders = filtered.length;
    const pendingOrders = filtered.filter((o) => ['Placed', 'Confirmed', 'Processing'].includes(o.orderStatus)).length;
    const totalRevenue = filtered
      .filter((o) => o.orderStatus !== 'Cancelled')
      .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

    const lowStockCount = products.filter((p) => (p.stockQuantity ?? 0) <= 5 && !p.isDeleted).length;

    return {
      filteredOrders: filtered,
      totalOrders,
      pendingOrders,
      totalRevenue,
      lowStockCount,
    };
  }, [orders, products, timeFilter]);

  // Chart timeframe filter state
  type ChartFilterType = '7days' | '14days' | '30days' | 'custom';
  const [chartFilter, setChartFilter] = useState<ChartFilterType>('7days');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Chart data calculation based on chart date filter
  const chartData = useMemo(() => {
    const days: Array<{ label: string; dateStr: string; amount: number; count: number }> = [];
    const now = new Date();

    if (chartFilter === 'custom') {
      const [sYear, sMonth, sDay] = customStartDate.split('-').map(Number);
      const [eYear, eMonth, eDay] = customEndDate.split('-').map(Number);
      const start = new Date(sYear, sMonth - 1, sDay);
      const end = new Date(eYear, eMonth - 1, eDay);

      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
        const diffDays = Math.min(Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1, 365);
        for (let i = 0; i < diffDays; i++) {
          const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
          const dayLabel = `${d.getDate()} ${d.toLocaleDateString('en-IN', { month: 'short' })}`;
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

          const dayOrders = orders.filter((o) => {
            if (!o.orderDate || o.orderStatus === 'Cancelled') return false;
            const orderLocalDate = toLocalDateStr(parseOrderDate(o.orderDate));
            return orderLocalDate === dateStr;
          });
          const dayRevenue = dayOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
          days.push({ label: dayLabel, dateStr, amount: dayRevenue, count: dayOrders.length });
        }
      }
    } else {
        const numDays = chartFilter === '30days' ? 30 : chartFilter === '14days' ? 14 : 7;
        for (let i = numDays - 1; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
          const dayLabel = numDays === 30 
            ? `${d.getDate()} ${d.toLocaleDateString('en-IN', { month: 'short' })}`
            : numDays === 14 
            ? `${d.getDate()} ${d.toLocaleDateString('en-IN', { month: 'short' })}`
            : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
          // Use local date string (not toISOString which converts to UTC)
          const dateStr = toLocalDateStr(d);

          const dayOrders = orders.filter((o) => {
            if (!o.orderDate || o.orderStatus === 'Cancelled') return false;
            // Compare local date strings; server sends datetime without timezone (local IST)
            const orderLocalDate = toLocalDateStr(parseOrderDate(o.orderDate));
            return orderLocalDate === dateStr;
          });

          const dayRevenue = dayOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
          days.push({ label: dayLabel, dateStr, amount: dayRevenue, count: dayOrders.length });
        }
    }

    const maxAmount = Math.max(...days.map((d) => d.amount), 1000);
    const totalChartRevenue = days.reduce((sum, d) => sum + d.amount, 0);
    const totalChartOrders = days.reduce((sum, d) => sum + d.count, 0);

    return { days, maxAmount, totalChartRevenue, totalChartOrders };
  }, [orders, chartFilter, customStartDate, customEndDate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="hiyaghar-admin-dashboard">
      {/* Welcome Banner */}
      <div className="hiyaghar-dashboard-welcome-banner">
        <div className="hiyaghar-welcome-text">
          <h2>
            Welcome back, <span className="hiyaghar-highlight">{user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : (user?.firstName === 'Super' ? 'Super Admin' : (user?.firstName || 'Super Admin'))}</span>
          </h2>
          <p>Here is what's happening with your store today. Manage orders, inventory, and analytics.</p>
        </div>
        <div className="hiyaghar-welcome-actions">
          <button className="hiyaghar-btn-primary" onClick={() => onNavigate('#admin/products')}>
            <i className="fa-solid fa-plus mr-2" /> Add Product
          </button>
          <button className="hiyaghar-btn-outline" onClick={loadDashboardStats} title="Refresh Data">
            <i className={`fa-solid fa-arrows-rotate ${loading ? 'fa-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Time Filter Bar */}
      <div className="hiyaghar-time-filter-row">
        <div className="hiyaghar-filter-label">
          <i className="fa-solid fa-calendar-days text-gold mr-2" />
          <span>Analytics Timeframe:</span>
        </div>
        <div className="hiyaghar-filter-pills">
          <button
            className={`filter-pill-btn ${timeFilter === 'today' ? 'active' : ''}`}
            onClick={() => setTimeFilter('today')}
          >
            Today
          </button>
          <button
            className={`filter-pill-btn ${timeFilter === 'week' ? 'active' : ''}`}
            onClick={() => setTimeFilter('week')}
          >
            This Week
          </button>
          <button
            className={`filter-pill-btn ${timeFilter === 'month' ? 'active' : ''}`}
            onClick={() => setTimeFilter('month')}
          >
            This Month
          </button>
          <button
            className={`filter-pill-btn ${timeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setTimeFilter('all')}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="hiyaghar-metrics-grid">
        {/* Filtered Revenue */}
        <div className="hiyaghar-metric-card revenue-card">
          <div className="hiyaghar-metric-icon bg-emerald-light text-emerald">
            <i className="fa-solid fa-indian-rupee-sign" />
          </div>
          <div className="hiyaghar-metric-info">
            <span className="hiyaghar-metric-label">
              {timeFilter === 'today' ? "Today's Revenue" : timeFilter === 'week' ? 'Weekly Revenue' : timeFilter === 'month' ? 'Monthly Revenue' : 'Total Revenue'}
            </span>
            <span className="hiyaghar-metric-value">{formatCurrency(filteredMetrics.totalRevenue)}</span>
            <span className="hiyaghar-metric-subtext text-emerald">
              {filteredMetrics.totalOrders} total orders placed
            </span>
          </div>
        </div>

        {/* Filtered Orders */}
        <div className="hiyaghar-metric-card" onClick={() => onNavigate(`#admin/orders?timeframe=${timeFilter}`)}>
          <div className="hiyaghar-metric-icon bg-blue-light text-blue">
            <i className="fa-solid fa-bag-shopping" />
          </div>
          <div className="hiyaghar-metric-info">
            <span className="hiyaghar-metric-label">Orders ({timeFilter})</span>
            <span className="hiyaghar-metric-value">{filteredMetrics.totalOrders}</span>
            <span className="hiyaghar-metric-subtext text-blue">
              <i className="fa-solid fa-arrow-right mr-1" /> View all orders
            </span>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="hiyaghar-metric-card" onClick={() => onNavigate(`#admin/orders?timeframe=${timeFilter}&statusGroup=pending`)}>
          <div className="hiyaghar-metric-icon bg-amber-light text-amber">
            <i className="fa-solid fa-clock" />
          </div>
          <div className="hiyaghar-metric-info">
            <span className="hiyaghar-metric-label">Pending / To Ship</span>
            <span className="hiyaghar-metric-value">{filteredMetrics.pendingOrders}</span>
            <span className="hiyaghar-metric-subtext text-amber">Requires action</span>
          </div>
        </div>

        {/* Live Products */}
        <div className="hiyaghar-metric-card" onClick={() => onNavigate('#admin/products')}>
          <div className="hiyaghar-metric-icon bg-purple-light text-purple">
            <i className="fa-solid fa-boxes-stacked" />
          </div>
          <div className="hiyaghar-metric-info">
            <span className="hiyaghar-metric-label">Live Products</span>
            <span className="hiyaghar-metric-value">{products.length}</span>
            <span className="hiyaghar-metric-subtext text-purple">In {categories.length} categories</span>
          </div>
        </div>
      </div>

      {/* Interactive Sales Trend Graph */}
      <div className="hiyaghar-dash-card">
        <div className="hiyaghar-card-header flex-between flex-wrap-gap">
          <div>
            <h3><i className="fa-solid fa-chart-area text-gold mr-2" /> Sales & Revenue Trend</h3>
            <p className="hiyaghar-card-subtitle">
              Total Revenue: <strong>{formatCurrency(chartData.totalChartRevenue)}</strong> across{' '}
              <strong>{chartData.totalChartOrders}</strong> order(s) in selected range
            </p>
          </div>

          {/* Graph Date Filter Controls */}
          <div className="chart-filter-controls">
            <div className="chart-pill-group">
              <button
                className={`chart-pill-btn ${chartFilter === '7days' ? 'active' : ''}`}
                onClick={() => setChartFilter('7days')}
              >
                7 Days
              </button>
              <button
                className={`chart-pill-btn ${chartFilter === '14days' ? 'active' : ''}`}
                onClick={() => setChartFilter('14days')}
              >
                14 Days
              </button>
              <button
                className={`chart-pill-btn ${chartFilter === '30days' ? 'active' : ''}`}
                onClick={() => setChartFilter('30days')}
              >
                30 Days
              </button>
              <button
                className={`chart-pill-btn ${chartFilter === 'custom' ? 'active' : ''}`}
                onClick={() => setChartFilter('custom')}
              >
                <i className="fa-solid fa-sliders mr-1" /> Custom
              </button>
            </div>

            {/* Custom Date Range Picker */}
            {chartFilter === 'custom' && (
              <div className="chart-date-picker-row">
                <div className="date-input-group">
                  <label>From:</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="chart-date-input"
                  />
                </div>
                <div className="date-input-group">
                  <label>To:</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="chart-date-input"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Professional SVG Area & Line Chart Container */}
        <div className="hiyaghar-chart-container">
          {chartData.days.length === 0 ? (
            <div className="chart-no-data">
              <i className="fa-solid fa-calendar-xmark text-amber" />
              <span>No orders found for the selected date range.</span>
            </div>
          ) : (
            <div className="modern-svg-chart-wrapper">
              <svg
                viewBox="0 0 900 240"
                className="modern-svg-chart"
                preserveAspectRatio="none"
              >
                <defs>
                  {/* Smooth Gold-Navy Gradient Fill */}
                  <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#D19A27" stopOpacity="0.45" />
                    <stop offset="60%" stopColor="#D19A27" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#D19A27" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#D19A27" />
                    <stop offset="100%" stopColor="#10243E" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid Lines */}
                <line x1="40" y1="20" x2="880" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="40" y1="75" x2="880" y2="75" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="40" y1="130" x2="880" y2="130" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="40" y1="185" x2="880" y2="185" stroke="#e2e8f0" strokeWidth="1" />

                {/* Y-Axis Value Labels */}
                <text x="35" y="24" textAnchor="end" className="svg-axis-label">₹{chartData.maxAmount.toLocaleString()}</text>
                <text x="35" y="105" textAnchor="end" className="svg-axis-label">₹{Math.round(chartData.maxAmount / 2).toLocaleString()}</text>
                <text x="35" y="188" textAnchor="end" className="svg-axis-label">₹0</text>

                {/* Area & Line Calculation */}
                {(() => {
                  const points = chartData.days.map((item, idx) => {
                    const totalDays = chartData.days.length;
                    const x = 50 + (idx / Math.max(totalDays - 1, 1)) * 820;
                    const y = 185 - (item.amount / chartData.maxAmount) * 165;
                    return { x, y, item, idx };
                  });

                  if (points.length === 0) return null;

                  const pathD = points.reduce((acc, p, i) => {
                    if (i === 0) return `M ${p.x},${p.y}`;
                    const prev = points[i - 1];
                    const cx1 = prev.x + (p.x - prev.x) / 2;
                    const cy1 = prev.y;
                    const cx2 = prev.x + (p.x - prev.x) / 2;
                    const cy2 = p.y;
                    return `${acc} C ${cx1},${cy1} ${cx2},${cy2} ${p.x},${p.y}`;
                  }, '');

                  const areaD = `${pathD} L ${points[points.length - 1].x},185 L ${points[0].x},185 Z`;

                  return (
                    <g>
                      {/* Gradient Filled Area */}
                      <path d={areaD} fill="url(#areaGradient)" />

                      {/* Smooth Foreground Trend Line */}
                      <path d={pathD} fill="none" stroke="url(#lineGradient)" strokeWidth="3.5" strokeLinecap="round" />

                      {/* Data Point Dots and Interactive Hover Nodes */}
                      {(() => {
                        const visibleLabelIndices = new Set<number>();

                        // Pass 1: Select nicely spaced labels (at least 75px apart)
                        const step = Math.max(1, Math.floor(points.length / 6));
                        for (let i = 0; i < points.length; i += step) {
                          visibleLabelIndices.add(i);
                        }
                        // Always ensure the very last date is included if not too close to the previous one
                        const lastIdx = points.length - 1;
                        const secondLastVisible = Array.from(visibleLabelIndices).filter(idx => idx !== lastIdx).pop();
                        if (secondLastVisible !== undefined) {
                          if (points[lastIdx].x - points[secondLastVisible].x < 70) {
                            visibleLabelIndices.delete(secondLastVisible);
                          }
                        }
                        visibleLabelIndices.add(lastIdx);

                        return points.map((p, i) => {
                          const showText = visibleLabelIndices.has(i);

                          return (
                            <g key={i} className="chart-svg-node">
                              {/* Outer Pulse Circle on data days */}
                              {p.item.amount > 0 && (
                                <circle cx={p.x} cy={p.y} r="8" fill="#D19A27" fillOpacity="0.2" className="chart-pulse-circle" />
                              )}
                              {/* Main Point */}
                              <circle
                                cx={p.x}
                                cy={p.y}
                                r={p.item.amount > 0 ? "5" : "3.5"}
                                fill={p.item.amount > 0 ? "#D19A27" : "#cbd5e1"}
                                stroke="#ffffff"
                                strokeWidth="2"
                                className="chart-point-dot"
                              />

                              {/* X-Axis Date Label */}
                              {showText && (
                                <text x={p.x} y="215" textAnchor="middle" className="svg-x-axis-label">
                                  {p.item.label}
                                </text>
                              )}

                            {/* Interactive Hover Tooltip */}
                            <g className="chart-hover-overlay">
                              <line x1={p.x} y1="20" x2={p.x} y2="185" stroke="#10243E" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                              <rect
                                x={Math.min(Math.max(p.x - 65, 10), 770)}
                                y={Math.max(p.y - 58, 8)}
                                width="130"
                                height="46"
                                rx="8"
                                fill="#10243E"
                                className="chart-tooltip-bg"
                              />
                              <text
                                x={Math.min(Math.max(p.x, 75), 835)}
                                y={Math.max(p.y - 38, 28)}
                                textAnchor="middle"
                                fill="#eab308"
                                fontSize="11"
                                fontWeight="700"
                              >
                                {p.item.label}: ₹{p.item.amount.toLocaleString()}
                              </text>
                              <text
                                x={Math.min(Math.max(p.x, 75), 835)}
                                y={Math.max(p.y - 22, 44)}
                                textAnchor="middle"
                                fill="#ffffff"
                                fontSize="10"
                                fontWeight="500"
                              >
                                {p.item.count} order(s) placed
                              </text>
                            </g>
                          </g>
                        );
                      });
                    })()}
                    </g>
                  );
                })()}
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Secondary Row: Quick Actions & Alerts */}
      <div className="hiyaghar-dash-two-col">
        {/* Quick Shortcuts */}
        <div className="hiyaghar-dash-card">
          <div className="hiyaghar-card-header">
            <h3><i className="fa-solid fa-bolt text-gold mr-2" /> Quick Management</h3>
          </div>
          <div className="hiyaghar-dash-actions-grid">
            <div className="hiyaghar-quick-btn" onClick={() => onNavigate('#admin/products')}>
              <div className="quick-btn-icon bg-purple-light text-purple">
                <i className="fa-solid fa-box-open" />
              </div>
              <div className="quick-btn-text">
                <strong>Products & Stock</strong>
                <span>Manage {products.length} products</span>
              </div>
            </div>

            <div className="hiyaghar-quick-btn" onClick={() => onNavigate('#admin/orders')}>
              <div className="quick-btn-icon bg-blue-light text-blue">
                <i className="fa-solid fa-truck-fast" />
              </div>
              <div className="quick-btn-text">
                <strong>Order Fulfillment</strong>
                <span>Process & dispatch orders</span>
              </div>
            </div>

            <div className="hiyaghar-quick-btn" onClick={() => onNavigate('#admin/categories')}>
              <div className="quick-btn-icon bg-amber-light text-amber">
                <i className="fa-solid fa-tags" />
              </div>
              <div className="quick-btn-text">
                <strong>Categories</strong>
                <span>Manage {categories.length} collections</span>
              </div>
            </div>

            <div className="hiyaghar-quick-btn" onClick={() => onNavigate('#admin/customers')}>
              <div className="quick-btn-icon bg-emerald-light text-emerald">
                <i className="fa-solid fa-users" />
              </div>
              <div className="quick-btn-text">
                <strong>Customers</strong>
                <span>{customers.length} Registered buyers</span>
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock & System Alert */}
        <div className="hiyaghar-dash-card">
          <div className="hiyaghar-card-header">
            <h3><i className="fa-solid fa-triangle-exclamation text-amber mr-2" /> Inventory Alert</h3>
          </div>
          <div className="hiyaghar-inventory-alert-box">
            {(inventoryAlerts.outOfStockCount > 0 || inventoryAlerts.lowStockCount > 0) ? (
              <div className="alert-badge-warning">
                <div className="alert-badge-icon">
                  <i className="fa-solid fa-bell" />
                </div>
                <div>
                  <strong>
                    {inventoryAlerts.outOfStockCount > 0 && inventoryAlerts.lowStockCount > 0
                      ? `${inventoryAlerts.outOfStockCount} Out of Stock, ${inventoryAlerts.lowStockCount} Low in Stock`
                      : inventoryAlerts.outOfStockCount > 0
                      ? `${inventoryAlerts.outOfStockCount} Variants Out of Stock!`
                      : `${inventoryAlerts.lowStockCount} Variants Low in Stock!`}
                  </strong>
                  <p>
                    {inventoryAlerts.outOfStockCount > 0
                      ? 'Some item variants have 0 available stock. Restock to avoid losing orders.'
                      : 'Stock count is 5 or below. Restock soon to avoid stockout.'}
                  </p>
                  <button className="btn-link-action" onClick={() => onNavigate('#admin/stock')}>
                    Manage Stock Inventory &rarr;
                  </button>
                </div>
              </div>
            ) : (
              <div className="alert-badge-success">
                <div className="alert-badge-icon">
                  <i className="fa-solid fa-circle-check" />
                </div>
                <div>
                  <strong>All Inventory Healthy</strong>
                  <p>No products currently below minimum stock threshold.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      {orders.length > 0 && (
        <div className="hiyaghar-dash-card">
          <div className="hiyaghar-card-header flex-between">
            <h3><i className="fa-solid fa-receipt mr-2 text-gold" /> Recent Orders</h3>
            <button className="btn-link-header" onClick={() => onNavigate('#admin/orders')}>
              View All Orders &rarr;
            </button>
          </div>
          <div className="hiyaghar-table-responsive">
            <table className="hiyaghar-dash-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 6).map((ord) => (
                  <tr key={ord.id}>
                    <td><strong className="order-number-tag">{ord.orderNumber}</strong></td>
                    <td>{ord.recipientName || 'Customer'}</td>
                    <td>{formatDate(ord.orderDate)}</td>
                    <td><strong>{formatCurrency(ord.totalAmount)}</strong></td>
                    <td>
                      <span className={`status-pill pill-${ord.orderStatus?.toLowerCase() || 'pending'}`}>
                        {ord.orderStatus}
                      </span>
                    </td>
                    <td>
                      <button
                        className="table-action-btn"
                        onClick={() => onNavigate(`#admin/orders?orderNumber=${encodeURIComponent(ord.orderNumber)}`)}
                      >
                        <i className="fa-solid fa-eye mr-1" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
