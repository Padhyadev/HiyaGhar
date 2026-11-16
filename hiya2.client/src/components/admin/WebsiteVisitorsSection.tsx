import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  WebsiteAnalyticsService,
  type VisitorDay,
  type VisitorHour,
  type VisitorPage,
  type VisitorRange,
  type VisitorRangeType,
} from '../../services/websiteAnalyticsService';
import '../../pages/Admin/AdminDashboardPage.css';

// "Website Visitors" block used on the Dashboard and on the Website Analytics page: range buttons
// (Today / Yesterday / 7 / 14 / 30 Days / Custom), Active Users + Page Views cards and the active
// users chart (per day; per hour for Today and Yesterday), in the same style as the Sales & Revenue Trend chart. Numbers come from Google Analytics through
// our server; if Google fails only this block shows an error.

type ChartFilterType = 'today' | 'yesterday' | '7days' | '14days' | '30days' | 'custom';

export interface VisitorPagesState {
  pages: VisitorPage[];
  loading: boolean;
  error: string | null;
}

interface WebsiteVisitorsSectionProps {
  // Clicking a summary card (Dashboard: open the full report). Cards are not clickable without it.
  onCardClick?: () => void;
  // Most viewed pages to load (leave out for every page).
  pagesTop?: number;
  // Renders the pages list / table below the visitors card (as a sibling, so the parent picks its card).
  renderPages?: (state: VisitorPagesState) => React.ReactNode;
}

// Local YYYY-MM-DD (avoids the UTC shift of toISOString)
const toLocalDateStr = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const parseLocalDate = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const formatNumber = (n: number) => n.toLocaleString('en-IN');

// 0 -> "12 AM", 13 -> "1 PM"
const formatHour = (hour: number) => `${hour % 12 === 0 ? 12 : hour % 12} ${hour < 12 ? 'AM' : 'PM'}`;

const formatRangeDate = (dateStr: string) =>
  parseLocalDate(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const WebsiteVisitorsSection: React.FC<WebsiteVisitorsSectionProps> = ({
  onCardClick,
  pagesTop,
  renderPages,
}) => {
  const [chartFilter, setChartFilter] = useState<ChartFilterType>('7days');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return toLocalDateStr(d);
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => toLocalDateStr(new Date()));

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ rangeType: VisitorRangeType; activeUsers: number; pageViews: number; startDate: string; endDate: string } | null>(null);
  const [days, setDays] = useState<VisitorDay[]>([]);
  // Today / Yesterday: the chart is per hour.
  const [hours, setHours] = useState<VisitorHour[] | null>(null);
  const [pages, setPages] = useState<VisitorPage[]>([]);
  const [pagesError, setPagesError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const todayStr = toLocalDateStr(new Date());
  // renderPages is usually an inline function (new on every render), so only whether it is
  // given decides if pages are loaded.
  const wantPages = renderPages !== undefined;

  // Selected range for the API, or a message when the custom dates are not usable yet.
  const rangeState = useMemo<{ range: VisitorRange | null; invalid: string | null }>(() => {
    if (chartFilter === 'today' || chartFilter === 'yesterday') {
      return { range: { preset: chartFilter }, invalid: null };
    }
    if (chartFilter !== 'custom') {
      const preset = chartFilter === '30days' ? 30 : chartFilter === '14days' ? 14 : 7;
      return { range: { preset }, invalid: null };
    }
    if (!customStartDate || !customEndDate) return { range: null, invalid: 'Choose a start and end date.' };
    if (customStartDate > customEndDate) return { range: null, invalid: 'Start date must be on or before the end date.' };
    if (customEndDate > todayStr) return { range: null, invalid: 'End date cannot be in the future.' };
    return { range: { startDate: customStartDate, endDate: customEndDate }, invalid: null };
  }, [chartFilter, customStartDate, customEndDate, todayStr]);

  useEffect(() => {
    const range = rangeState.range;
    if (!range) {
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    setPagesError(null);

    Promise.all([
      WebsiteAnalyticsService.getSummary(range),
      WebsiteAnalyticsService.getDaily(range),
      wantPages ? WebsiteAnalyticsService.getPages(range, pagesTop) : Promise.resolve(null),
    ]).then(([summaryRes, dailyRes, pagesRes]) => {
      if (requestId !== requestIdRef.current) return; // a newer range was chosen meanwhile

      if (summaryRes.success && summaryRes.data) {
        const { rangeType, activeUsers, pageViews, startDate, endDate } = summaryRes.data;
        setSummary({ rangeType, activeUsers, pageViews, startDate, endDate });
      } else {
        setSummary(null);
      }

      if (dailyRes.success && dailyRes.data) {
        const isHourly = dailyRes.data.granularity === 'hour';
        setDays(isHourly ? [] : dailyRes.data.days ?? []);
        setHours(isHourly ? dailyRes.data.hours ?? [] : null);
      } else {
        setDays([]);
        setHours(null);
      }

      if (!summaryRes.success || !dailyRes.success) {
        setError(summaryRes.message || dailyRes.message || 'Could not load website analytics right now.');
      }

      if (pagesRes) {
        if (pagesRes.success && pagesRes.data) {
          setPages(pagesRes.data.pages);
        } else {
          setPages([]);
          setPagesError(pagesRes.message || 'Could not load page data right now.');
        }
      }

      setLoading(false);
    });
  }, [rangeState, pagesTop, wantPages]);

  // Chart points: same layout maths as the Sales & Revenue Trend chart.
  const chartData = useMemo(() => {
    if (hours) {
      const hourItems = hours.map((h) => ({ label: formatHour(h.hour), value: h.activeUsers }));
      return { items: hourItems, maxValue: Math.max(...hourItems.map((i) => i.value), 5) };
    }
    const isWeek = chartFilter === '7days';
    const items = days.map((d) => {
      const date = parseLocalDate(d.date);
      const label = isWeek
        ? date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })
        : `${date.getDate()} ${date.toLocaleDateString('en-IN', { month: 'short' })}`;
      return { label, value: d.activeUsers };
    });
    const maxValue = Math.max(...items.map((i) => i.value), 5);
    return { items, maxValue };
  }, [days, hours, chartFilter]);

  const cardClass = `hiyaghar-metric-card${onCardClick ? '' : ' revenue-card'}`;
  const rangeText = !summary
    ? ''
    : summary.rangeType === 'today'
    ? `Today, ${formatRangeDate(summary.startDate)}`
    : summary.rangeType === 'yesterday'
    ? `Yesterday, ${formatRangeDate(summary.startDate)}`
    : `${formatRangeDate(summary.startDate)} – ${formatRangeDate(summary.endDate)}`;
  const cardValue = (value: number | undefined) =>
    loading ? <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.2rem' }} /> : value === undefined ? '—' : formatNumber(value);

  return (
    <>
    <div className="hiyaghar-dash-card">
      <div className="hiyaghar-card-header flex-between flex-wrap-gap">
        <div>
          <h3><i className="fa-solid fa-globe text-gold mr-2" /> Website Visitors</h3>
          <p className="hiyaghar-card-subtitle">
            HiyaGhar website visitors from Google Analytics
            {rangeText && <> · <strong>{rangeText}</strong></>}
          </p>
        </div>

        {/* Date Filter Controls (same as the Sales & Revenue Trend chart) */}
        <div className="chart-filter-controls">
          <div className="chart-pill-group">
            <button className={`chart-pill-btn ${chartFilter === 'today' ? 'active' : ''}`} onClick={() => setChartFilter('today')}>
              Today
            </button>
            <button className={`chart-pill-btn ${chartFilter === 'yesterday' ? 'active' : ''}`} onClick={() => setChartFilter('yesterday')}>
              Yesterday
            </button>
            <button className={`chart-pill-btn ${chartFilter === '7days' ? 'active' : ''}`} onClick={() => setChartFilter('7days')}>
              7 Days
            </button>
            <button className={`chart-pill-btn ${chartFilter === '14days' ? 'active' : ''}`} onClick={() => setChartFilter('14days')}>
              14 Days
            </button>
            <button className={`chart-pill-btn ${chartFilter === '30days' ? 'active' : ''}`} onClick={() => setChartFilter('30days')}>
              30 Days
            </button>
            <button className={`chart-pill-btn ${chartFilter === 'custom' ? 'active' : ''}`} onClick={() => setChartFilter('custom')}>
              <i className="fa-solid fa-sliders mr-1" /> Custom
            </button>
          </div>

          {chartFilter === 'custom' && (
            <div className="chart-date-picker-row">
              <div className="date-input-group">
                <label>From:</label>
                <input
                  type="date"
                  value={customStartDate}
                  max={todayStr}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="chart-date-input"
                />
              </div>
              <div className="date-input-group">
                <label>To:</label>
                <input
                  type="date"
                  value={customEndDate}
                  max={todayStr}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="chart-date-input"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="hiyaghar-metrics-grid">
        <div className={cardClass} onClick={onCardClick}>
          <div className="hiyaghar-metric-icon bg-blue-light text-blue">
            <i className="fa-solid fa-user-group" />
          </div>
          <div className="hiyaghar-metric-info">
            <span className="hiyaghar-metric-label">Active Users</span>
            <span className="hiyaghar-metric-value">{cardValue(error ? undefined : summary?.activeUsers)}</span>
            <span className="hiyaghar-metric-subtext text-blue">Visitors in selected range</span>
          </div>
        </div>

        <div className={cardClass} onClick={onCardClick}>
          <div className="hiyaghar-metric-icon bg-purple-light text-purple">
            <i className="fa-solid fa-eye" />
          </div>
          <div className="hiyaghar-metric-info">
            <span className="hiyaghar-metric-label">Page Views</span>
            <span className="hiyaghar-metric-value">{cardValue(error ? undefined : summary?.pageViews)}</span>
            <span className="hiyaghar-metric-subtext text-purple">Pages viewed in selected range</span>
          </div>
        </div>
      </div>

      {chartFilter === 'today' && (
        <p className="hiyaghar-card-subtitle" style={{ marginTop: '12px' }}>
          <i className="fa-solid fa-circle-info mr-1" /> Today's data may take a few hours to fully update in Google Analytics.
        </p>
      )}

      {/* Active users chart: per day, or per hour for Today / Yesterday */}
      <div className="hiyaghar-chart-container">
        {rangeState.invalid ? (
          <div className="chart-no-data">
            <i className="fa-solid fa-calendar-xmark text-amber" />
            <span>{rangeState.invalid}</span>
          </div>
        ) : loading ? (
          <div className="chart-no-data">
            <i className="fa-solid fa-spinner fa-spin text-gold" />
            <span>Loading website visitors...</span>
          </div>
        ) : error ? (
          <div className="chart-no-data">
            <i className="fa-solid fa-triangle-exclamation text-amber" />
            <span>{error}</span>
          </div>
        ) : chartData.items.length === 0 ? (
          <div className="chart-no-data">
            <i className="fa-solid fa-calendar-xmark text-amber" />
            <span>No visitors found for the selected date range.</span>
          </div>
        ) : (
          <div className="modern-svg-chart-wrapper">
            <svg viewBox="0 0 900 240" className="modern-svg-chart" preserveAspectRatio="none">
              <defs>
                <linearGradient id="visitorsAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#D19A27" stopOpacity="0.45" />
                  <stop offset="60%" stopColor="#D19A27" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#D19A27" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="visitorsLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
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
              <text x="35" y="24" textAnchor="end" className="svg-axis-label">{formatNumber(chartData.maxValue)}</text>
              <text x="35" y="105" textAnchor="end" className="svg-axis-label">{formatNumber(Math.round(chartData.maxValue / 2))}</text>
              <text x="35" y="188" textAnchor="end" className="svg-axis-label">0</text>

              {(() => {
                const points = chartData.items.map((item, idx) => {
                  const total = chartData.items.length;
                  const x = 50 + (idx / Math.max(total - 1, 1)) * 820;
                  const y = 185 - (item.value / chartData.maxValue) * 165;
                  return { x, y, item };
                });

                const pathD = points.reduce((acc, p, i) => {
                  if (i === 0) return `M ${p.x},${p.y}`;
                  const prev = points[i - 1];
                  const cx = prev.x + (p.x - prev.x) / 2;
                  return `${acc} C ${cx},${prev.y} ${cx},${p.y} ${p.x},${p.y}`;
                }, '');
                const areaD = `${pathD} L ${points[points.length - 1].x},185 L ${points[0].x},185 Z`;

                // Nicely spaced x-axis labels, always including the last day.
                const visibleLabels = new Set<number>();
                const step = Math.max(1, Math.floor(points.length / 6));
                for (let i = 0; i < points.length; i += step) visibleLabels.add(i);
                const lastIdx = points.length - 1;
                const secondLast = Array.from(visibleLabels).filter((i) => i !== lastIdx).pop();
                if (secondLast !== undefined && points[lastIdx].x - points[secondLast].x < 70) visibleLabels.delete(secondLast);
                visibleLabels.add(lastIdx);

                return (
                  <g>
                    <path d={areaD} fill="url(#visitorsAreaGradient)" />
                    <path d={pathD} fill="none" stroke="url(#visitorsLineGradient)" strokeWidth="3.5" strokeLinecap="round" />

                    {points.map((p, i) => (
                      <g key={i} className="chart-svg-node">
                        {p.item.value > 0 && (
                          <circle cx={p.x} cy={p.y} r="8" fill="#D19A27" fillOpacity="0.2" className="chart-pulse-circle" />
                        )}
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={p.item.value > 0 ? '5' : '3.5'}
                          fill={p.item.value > 0 ? '#D19A27' : '#cbd5e1'}
                          stroke="#ffffff"
                          strokeWidth="2"
                          className="chart-point-dot"
                        />

                        {visibleLabels.has(i) && (
                          <text x={p.x} y="215" textAnchor="middle" className="svg-x-axis-label">
                            {p.item.label}
                          </text>
                        )}

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
                            {p.item.label}
                          </text>
                          <text
                            x={Math.min(Math.max(p.x, 75), 835)}
                            y={Math.max(p.y - 22, 44)}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="10"
                            fontWeight="500"
                          >
                            {formatNumber(p.item.value)} active user(s)
                          </text>
                        </g>
                      </g>
                    ))}
                  </g>
                );
              })()}
            </svg>
          </div>
        )}
      </div>
    </div>

    {/* Pages list / table, rendered by the parent as its own card below this one */}
    {renderPages && !rangeState.invalid && renderPages({ pages, loading, error: pagesError })}
    </>
  );
};
