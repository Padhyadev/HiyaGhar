import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  WebsiteAnalyticsService,
  type AiReferralsResponse,
  type VisitorDay,
  type VisitorHour,
  type VisitorPage,
  type VisitorRange,
  type VisitorRangeType,
  type VisitorExtendedSummaryWithPreviousResponse,
  type SessionChannel,
  type TrafficSource,
  type GeoLocationItem,
  type DeviceCategoryItem,
} from '../../services/websiteAnalyticsService';
import '../../pages/Admin/AdminDashboardPage.css';

// "Website Visitors" block used on the Dashboard and on the Website Analytics page:
// - Range buttons (Today / Yesterday / 7 / 14 / 30 Days / Custom)
// - Part 1 & 2: 8 Summary cards with previous-period comparisons
// - Hourly / Daily active users chart with explicit axis labels & tooltips
// - Part 3: Traffic Sources (channels + top sources)
// - Part 4: Visitors by Country and City
// - Part 5: Device category breakdown (Desktop, Mobile, Tablet)
// - Part 7: Cleaned-up AI Assistants table
// - Part 8: Polish, axis labels, last updated timestamp, loading & error states

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
  // Website Analytics page: also show visits from AI assistants (ChatGPT, Gemini…) for the same range.
  showAiReferrals?: boolean;
  // Website Analytics page: also show extended summary metrics (total users, sessions, events, etc.).
  showExtendedSummary?: boolean;
  // Website Analytics page: also show previous-period comparison below each metric card.
  showPreviousPeriodComparison?: boolean;
  // Website Analytics page: also show traffic sources section.
  showTrafficSources?: boolean;
  // Website Analytics page: also show visitors by country and city.
  showGeo?: boolean;
  // Website Analytics page: also show device category breakdown.
  showDevices?: boolean;
}

// Local YYYY-MM-DD (avoids the UTC shift of toISOString)
const toLocalDateStr = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const parseLocalDate = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const formatNumber = (n: number | undefined | null) =>
  n === undefined || n === null ? '0' : n.toLocaleString('en-IN');

// 0 -> "12 AM", 13 -> "1 PM"
const formatHour = (hour: number) => `${hour % 12 === 0 ? 12 : hour % 12} ${hour < 12 ? 'AM' : 'PM'}`;

const formatEngagementTime = (sec: number | undefined | null) => {
  if (!sec || sec <= 0) return '0s';
  const totalSeconds = Math.round(sec);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

const formatRangeDate = (dateStr: string) =>
  parseLocalDate(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const getComparisonLabel = (filter: ChartFilterType): string => {
  switch (filter) {
    case 'today':
    case 'yesterday':
      return 'previous day';
    case '7days':
      return 'previous 7 days';
    case '14days':
      return 'previous 14 days';
    case '30days':
      return 'previous 30 days';
    case 'custom':
    default:
      return 'previous period';
  }
};

const getChannelColor = (channel: string): string => {
  switch (channel.toLowerCase()) {
    case 'direct':
      return '#2563eb';
    case 'organic search':
      return '#16a34a';
    case 'referral':
      return '#d97706';
    case 'organic social':
      return '#ec4899';
    case 'paid social':
      return '#8b5cf6';
    case 'ai assistant':
      return '#0d9488';
    case 'unassigned':
      return '#94a3b8';
    default:
      return '#6366f1';
  }
};

export const WebsiteVisitorsSection: React.FC<WebsiteVisitorsSectionProps> = ({
  onCardClick,
  pagesTop,
  renderPages,
  showAiReferrals = false,
  showExtendedSummary = false,
  showPreviousPeriodComparison = false,
  showTrafficSources = false,
  showGeo = false,
  showDevices = false,
}) => {
  const [chartFilter, setChartFilter] = useState<ChartFilterType>('today');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return toLocalDateStr(d);
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => toLocalDateStr(new Date()));

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ rangeType: VisitorRangeType; activeUsers: number; pageViews: number; startDate: string; endDate: string } | null>(null);
  const [extendedSummaryWithPrev, setExtendedSummaryWithPrev] = useState<VisitorExtendedSummaryWithPreviousResponse | null>(null);
  const [sessionChannels, setSessionChannels] = useState<SessionChannel[]>([]);
  const [sessionChannelsTotal, setSessionChannelsTotal] = useState<number>(0);
  const [sessionChannelsError, setSessionChannelsError] = useState<string | null>(null);
  const [topSources, setTopSources] = useState<TrafficSource[]>([]);
  const [topSourcesError, setTopSourcesError] = useState<string | null>(null);
  const [geoCountries, setGeoCountries] = useState<GeoLocationItem[]>([]);
  const [geoCities, setGeoCities] = useState<GeoLocationItem[]>([]);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [deviceCategories, setDeviceCategories] = useState<DeviceCategoryItem[]>([]);
  const [deviceTotalUsers, setDeviceTotalUsers] = useState<number>(0);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const [days, setDays] = useState<VisitorDay[]>([]);
  // Today / Yesterday: the chart is per hour.
  const [hours, setHours] = useState<VisitorHour[] | null>(null);
  const [pages, setPages] = useState<VisitorPage[]>([]);
  const [pagesError, setPagesError] = useState<string | null>(null);
  const [aiReport, setAiReport] = useState<AiReferralsResponse | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const todayStr = toLocalDateStr(new Date());
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
    setAiError(null);
    setSessionChannelsError(null);
    setTopSourcesError(null);
    setGeoError(null);
    setDeviceError(null);

    const fetchSummary = WebsiteAnalyticsService.getSummary(range);
    const fetchDaily = WebsiteAnalyticsService.getDaily(range);
    const fetchPages = wantPages ? WebsiteAnalyticsService.getPages(range, pagesTop) : Promise.resolve(null);
    const fetchAi = showAiReferrals ? WebsiteAnalyticsService.getAiReferrals(range) : Promise.resolve(null);
    const fetchAllWithPrev = (showExtendedSummary || showPreviousPeriodComparison)
      ? WebsiteAnalyticsService.getAllMetricsWithPrevious(range)
      : Promise.resolve(null);
    const fetchChannels = showTrafficSources ? WebsiteAnalyticsService.getSessionChannels(range) : Promise.resolve(null);
    const fetchSources = showTrafficSources ? WebsiteAnalyticsService.getTopTrafficSources(range, 10) : Promise.resolve(null);
    const fetchGeo = showGeo ? WebsiteAnalyticsService.getGeoReport(range, 10) : Promise.resolve(null);
    const fetchDevices = showDevices ? WebsiteAnalyticsService.getDeviceReport(range) : Promise.resolve(null);

    Promise.all([
      fetchSummary,
      fetchDaily,
      fetchPages,
      fetchAi,
      fetchAllWithPrev,
      fetchChannels,
      fetchSources,
      fetchGeo,
      fetchDevices,
    ]).then(([summaryRes, dailyRes, pagesRes, aiRes, allWithPrevRes, channelsRes, sourcesRes, geoRes, devicesRes]) => {
      if (requestId !== requestIdRef.current) return;

      setLastUpdated(
        new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
      );

      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data);
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

      if (allWithPrevRes) {
        if (allWithPrevRes.success && allWithPrevRes.data) {
          setExtendedSummaryWithPrev(allWithPrevRes.data);
        } else {
          setExtendedSummaryWithPrev(null);
        }
      }

      if (channelsRes) {
        if (channelsRes.success && channelsRes.data) {
          setSessionChannels(channelsRes.data.channels);
          setSessionChannelsTotal(channelsRes.data.totalSessions);
        } else {
          setSessionChannels([]);
          setSessionChannelsTotal(0);
          setSessionChannelsError(channelsRes.message || 'Could not load session channels right now.');
        }
      }

      if (sourcesRes) {
        if (sourcesRes.success && sourcesRes.data) {
          setTopSources(sourcesRes.data.sources);
        } else {
          setTopSources([]);
          setTopSourcesError(sourcesRes.message || 'Could not load top traffic sources right now.');
        }
      }

      if (geoRes) {
        if (geoRes.success && geoRes.data) {
          setGeoCountries(geoRes.data.countries);
          setGeoCities(geoRes.data.cities);
        } else {
          setGeoCountries([]);
          setGeoCities([]);
          setGeoError(geoRes.message || 'Could not load geographic data right now.');
        }
      }

      if (devicesRes) {
        if (devicesRes.success && devicesRes.data) {
          setDeviceCategories(devicesRes.data.categories);
          setDeviceTotalUsers(devicesRes.data.totalUsers);
        } else {
          setDeviceCategories([]);
          setDeviceTotalUsers(0);
          setDeviceError(devicesRes.message || 'Could not load device data right now.');
        }
      }

      if (pagesRes) {
        if (pagesRes.success && pagesRes.data) {
          setPages(pagesRes.data.pages);
        } else {
          setPages([]);
          setPagesError(pagesRes.message || 'Could not load page data right now.');
        }
      }

      if (aiRes) {
        if (aiRes.success && aiRes.data) {
          setAiReport(aiRes.data);
        } else {
          setAiReport(null);
          setAiError(aiRes.message || 'Could not load AI assistant visits right now.');
        }
      }

      setLoading(false);
    });
  }, [rangeState, pagesTop, wantPages, showAiReferrals, showExtendedSummary, showPreviousPeriodComparison, showTrafficSources, showGeo, showDevices]);

  // Chart points: same layout maths as the Sales & Revenue Trend chart.
  const chartData = useMemo(() => {
    // Hours (Today / Yesterday): 0-23
    if (hours) {
      const items = hours.map((h) => ({
        label: formatHour(h.hour),
        value: h.activeUsers,
        pending: !!h.pending,
      }));
      const maxValue = Math.max(5, ...items.map((i) => i.value));
      const pendingItems = items.filter((i) => i.pending);
      // e.g. "2 PM – 5 PM": the hours Google Analytics has not processed yet (today only).
      const pendingLabel =
        pendingItems.length === 0
          ? null
          : pendingItems.length === 1
            ? pendingItems[0].label
            : `${pendingItems[0].label} – ${pendingItems[pendingItems.length - 1].label}`;
      return { items, maxValue, pendingLabel };
    }

    // Days: 7, 14, 30 days or custom
    const items = days.map((d) => {
      const date = parseLocalDate(d.date);
      const label = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      return { label, value: d.activeUsers, pending: false };
    });
    const maxValue = Math.max(5, ...items.map((i) => i.value));
    return { items, maxValue, pendingLabel: null as string | null };
  }, [days, hours]);

  const cardClass = `hiyaghar-dash-metric-card${onCardClick ? ' cursor-pointer' : ''}`;
  const cardValue = (val: number | undefined) => (val === undefined ? '—' : formatNumber(val));

  const compLabel = getComparisonLabel(chartFilter);
  const curr = extendedSummaryWithPrev?.current;
  const prev = extendedSummaryWithPrev?.previous;

  const renderTrend = (currentVal?: number, previousVal?: number) => {
    if (!showPreviousPeriodComparison || loading || currentVal === undefined || previousVal === undefined) {
      return null;
    }
    if (previousVal === 0 && currentVal === 0) {
      return <span className="hiyaghar-metric-comparison text-neutral">-</span>;
    }
    if (previousVal === 0) {
      return (
        <span className="hiyaghar-metric-comparison text-green-dark">
          <i className="fa-solid fa-arrow-trend-up mr-1" />
          +100% vs {compLabel}
        </span>
      );
    }
    const change = ((currentVal - previousVal) / previousVal) * 100;
    if (Math.abs(change) < 0.1) {
      return <span className="hiyaghar-metric-comparison text-neutral">0% vs {compLabel}</span>;
    }
    const isUp = change > 0;
    return (
      <span className={`hiyaghar-metric-comparison ${isUp ? 'text-green-dark' : 'text-red-dark'}`}>
        <i className={`fa-solid ${isUp ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'} mr-1`} />
        {isUp ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`} vs {compLabel}
      </span>
    );
  };

  return (
    <>
      {/* Visitors block card: title + filters + metrics + chart */}
      <div className="hiyaghar-dash-card">
        {/* Header row: title on the left, date filter pills on the right */}
        <div className="chart-header-row">
          <div className="chart-title-block">
            <h3>
              <i className="fa-solid fa-globe mr-2 text-gold" />
              Website Visitors
            </h3>
            <p className="chart-subtitle">
              HiyaGhar website visitors from Google Analytics
              {summary && <> · {summary.rangeType === 'today' ? `Today, ${formatRangeDate(summary.startDate)}` : summary.rangeType === 'yesterday' ? `Yesterday, ${formatRangeDate(summary.startDate)}` : `${formatRangeDate(summary.startDate)} – ${formatRangeDate(summary.endDate)}`}</>}
            </p>
          </div>

          <div className="chart-filter-controls">
            <div className="chart-pill-group">
              <button
                type="button"
                className={`chart-pill-btn ${chartFilter === 'today' ? 'active' : ''}`}
                onClick={() => setChartFilter('today')}
              >
                Today
              </button>
              <button
                type="button"
                className={`chart-pill-btn ${chartFilter === 'yesterday' ? 'active' : ''}`}
                onClick={() => setChartFilter('yesterday')}
              >
                Yesterday
              </button>
              <button
                type="button"
                className={`chart-pill-btn ${chartFilter === '7days' ? 'active' : ''}`}
                onClick={() => setChartFilter('7days')}
              >
                7 Days
              </button>
              <button
                type="button"
                className={`chart-pill-btn ${chartFilter === '14days' ? 'active' : ''}`}
                onClick={() => setChartFilter('14days')}
              >
                14 Days
              </button>
              <button
                type="button"
                className={`chart-pill-btn ${chartFilter === '30days' ? 'active' : ''}`}
                onClick={() => setChartFilter('30days')}
              >
                30 Days
              </button>
              <button
                type="button"
                className={`chart-pill-btn ${chartFilter === 'custom' ? 'active' : ''}`}
                onClick={() => setChartFilter('custom')}
              >
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
                    max={customEndDate || todayStr}
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

        {/* Part 1 & Part 2: Summary Cards */}
        <div className="hiyaghar-metrics-grid">
          {/* 1. Active Users */}
          <div className={cardClass} onClick={onCardClick}>
            <div className="hiyaghar-metric-icon bg-blue-light text-blue">
              <i className="fa-solid fa-user-group" />
            </div>
            <div className="hiyaghar-metric-info">
              <span className="hiyaghar-metric-label">Active Users</span>
              <span className="hiyaghar-metric-value">
                {cardValue(error ? undefined : curr ? curr.activeUsers : summary?.activeUsers)}
              </span>
              <span className="hiyaghar-metric-subtext text-blue">Visitors in selected range</span>
              {renderTrend(curr?.activeUsers, prev?.activeUsers)}
            </div>
          </div>

          {/* 2. Page Views */}
          <div className={cardClass} onClick={onCardClick}>
            <div className="hiyaghar-metric-icon bg-purple-light text-purple">
              <i className="fa-solid fa-eye" />
            </div>
            <div className="hiyaghar-metric-info">
              <span className="hiyaghar-metric-label">Page Views</span>
              <span className="hiyaghar-metric-value">
                {cardValue(error ? undefined : curr ? curr.pageViews : summary?.pageViews)}
              </span>
              <span className="hiyaghar-metric-subtext text-purple">Pages viewed in selected range</span>
              {renderTrend(curr?.pageViews, prev?.pageViews)}
            </div>
          </div>

          {showExtendedSummary && (
            <>
              {/* 3. Total Users */}
              <div className={cardClass}>
                <div className="hiyaghar-metric-icon bg-green-light text-green">
                  <i className="fa-solid fa-users" />
                </div>
                <div className="hiyaghar-metric-info">
                  <span className="hiyaghar-metric-label">Total Users</span>
                  <span className="hiyaghar-metric-value">
                    {cardValue(error ? undefined : curr?.totalUsers)}
                  </span>
                  <span className="hiyaghar-metric-subtext text-green">All unique visitors</span>
                  {renderTrend(curr?.totalUsers, prev?.totalUsers)}
                </div>
              </div>

              {/* 4. New Users */}
              <div className={cardClass}>
                <div className="hiyaghar-metric-icon bg-teal-light text-teal">
                  <i className="fa-solid fa-user-plus" />
                </div>
                <div className="hiyaghar-metric-info">
                  <span className="hiyaghar-metric-label">New Users</span>
                  <span className="hiyaghar-metric-value">
                    {cardValue(error ? undefined : curr?.newUsers)}
                  </span>
                  <span className="hiyaghar-metric-subtext text-teal">First-time visitors</span>
                  {renderTrend(curr?.newUsers, prev?.newUsers)}
                </div>
              </div>

              {/* 5. Returning Users */}
              <div className={cardClass}>
                <div className="hiyaghar-metric-icon bg-orange-light text-orange">
                  <i className="fa-solid fa-rotate" />
                </div>
                <div className="hiyaghar-metric-info">
                  <span className="hiyaghar-metric-label">Returning Users</span>
                  <span className="hiyaghar-metric-value">
                    {cardValue(error ? undefined : curr?.returningUsers)}
                  </span>
                  <span className="hiyaghar-metric-subtext text-orange">Repeat visitors</span>
                  {renderTrend(curr?.returningUsers, prev?.returningUsers)}
                </div>
              </div>

              {/* 6. Sessions */}
              <div className={cardClass}>
                <div className="hiyaghar-metric-icon bg-red-light text-red">
                  <i className="fa-solid fa-calendar-check" />
                </div>
                <div className="hiyaghar-metric-info">
                  <span className="hiyaghar-metric-label">Sessions</span>
                  <span className="hiyaghar-metric-value">
                    {cardValue(error ? undefined : curr?.sessions)}
                  </span>
                  <span className="hiyaghar-metric-subtext text-red">Total site visits</span>
                  {renderTrend(curr?.sessions, prev?.sessions)}
                </div>
              </div>

              {/* 7. Event Count */}
              <div className={cardClass}>
                <div className="hiyaghar-metric-icon bg-indigo-light text-indigo">
                  <i className="fa-solid fa-chart-simple" />
                </div>
                <div className="hiyaghar-metric-info">
                  <span className="hiyaghar-metric-label">Event Count</span>
                  <span className="hiyaghar-metric-value">
                    {cardValue(error ? undefined : curr?.eventCount)}
                  </span>
                  <span className="hiyaghar-metric-subtext text-indigo">Total events tracked</span>
                  {renderTrend(curr?.eventCount, prev?.eventCount)}
                </div>
              </div>

              {/* 8. Average Engagement Time */}
              <div className={cardClass}>
                <div className="hiyaghar-metric-icon bg-pink-light text-pink">
                  <i className="fa-solid fa-clock" />
                </div>
                <div className="hiyaghar-metric-info">
                  <span className="hiyaghar-metric-label">Avg. Engagement</span>
                  <span className="hiyaghar-metric-value">
                    {error ? '—' : formatEngagementTime(curr?.averageEngagementTimeSeconds)}
                  </span>
                  <span className="hiyaghar-metric-subtext text-pink">Time spent per user</span>
                  {renderTrend(curr?.averageEngagementTimeSeconds, prev?.averageEngagementTimeSeconds)}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Part 8: Active users chart with axis labels & rich tooltips */}
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
                  <pattern id="visitorsPendingPattern" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="8" height="8" fill="#f8fafc" />
                    <line x1="0" y1="0" x2="0" y2="8" stroke="#e2e8f0" strokeWidth="3" />
                  </pattern>
                  <linearGradient id="visitorsLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#D19A27" />
                    <stop offset="100%" stopColor="#10243E" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid Lines */}
                <line x1="45" y1="20" x2="880" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="45" y1="75" x2="880" y2="75" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="45" y1="130" x2="880" y2="130" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="45" y1="185" x2="880" y2="185" stroke="#e2e8f0" strokeWidth="1" />

                {/* Y-Axis Value Labels & Title */}
                <text x="40" y="24" textAnchor="end" className="svg-axis-label">{formatNumber(chartData.maxValue)}</text>
                <text x="40" y="105" textAnchor="end" className="svg-axis-label">{formatNumber(Math.round(chartData.maxValue / 2))}</text>
                <text x="40" y="188" textAnchor="end" className="svg-axis-label">0</text>
                <text x="45" y="12" className="svg-axis-label" fontWeight="600" fill="#64748b" fontSize="10">Active Users</text>
                <text x="880" y="232" textAnchor="end" className="svg-axis-label" fontWeight="600" fill="#64748b" fontSize="10">
                  {hours ? 'Hour (IST)' : 'Date'}
                </text>

                {(() => {
                  const points = chartData.items.map((item, idx) => {
                    const total = chartData.items.length;
                    const x = 55 + (idx / Math.max(total - 1, 1)) * 810;
                    const y = 185 - (item.value / chartData.maxValue) * 165;
                    return { x, y, item };
                  });

                  // Today: hours Google has not processed yet are not drawn as 0 - the line stops at the
                  // last processed hour and the rest is shaded as "processing".
                  const solid = points.filter((p) => !p.item.pending);
                  const pathD = solid.reduce((acc, p, i) => {
                    if (i === 0) return `M ${p.x},${p.y}`;
                    const prevPt = solid[i - 1];
                    const cx = prevPt.x + (p.x - prevPt.x) / 2;
                    return `${acc} C ${cx},${prevPt.y} ${cx},${p.y} ${p.x},${p.y}`;
                  }, '');
                  const areaD = solid.length > 0 ? `${pathD} L ${solid[solid.length - 1].x},185 L ${solid[0].x},185 Z` : '';
                  const firstPendingIdx = points.findIndex((p) => p.item.pending);
                  const halfStep = points.length > 1 ? (points[1].x - points[0].x) / 2 : 20;
                  const pendingStartX = firstPendingIdx < 0 ? 0 : Math.max(45, points[firstPendingIdx].x - halfStep);
                  const pendingWidth = 880 - pendingStartX;

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
                      {firstPendingIdx >= 0 && (
                        <g>
                          <rect x={pendingStartX} y="20" width={pendingWidth} height="165" rx="6" fill="url(#visitorsPendingPattern)" stroke="#cbd5e1" strokeDasharray="4 4" />
                          {pendingWidth >= 90 && (
                            <>
                              <text x={pendingStartX + pendingWidth / 2} y="96" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="700">
                                Processing
                              </text>
                              <text x={pendingStartX + pendingWidth / 2} y="112" textAnchor="middle" fill="#94a3b8" fontSize="10">
                                by Google Analytics
                              </text>
                            </>
                          )}
                        </g>
                      )}
                      {areaD && <path d={areaD} fill="url(#visitorsAreaGradient)" />}
                      {pathD && <path d={pathD} fill="none" stroke="url(#visitorsLineGradient)" strokeWidth="3.5" strokeLinecap="round" />}

                      {points.map((p, i) => (
                        <g key={i} className="chart-svg-node">
                          {p.item.pending ? (
                            <circle cx={p.x} cy={185} r="3.5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="2 2" className="chart-point-dot" />
                          ) : (
                            <>
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
                            </>
                          )}

                          {visibleLabels.has(i) && (
                            <text x={p.x} y="215" textAnchor="middle" className="svg-x-axis-label">
                              {p.item.label}
                            </text>
                          )}

                          <g className="chart-hover-overlay">
                            <line x1={p.x} y1="20" x2={p.x} y2="185" stroke="#10243E" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                            <rect
                              x={Math.min(Math.max(p.x - 75, 10), 750)}
                              y={Math.max(p.y - 58, 8)}
                              width="150"
                              height="48"
                              rx="8"
                              fill="#10243E"
                              className="chart-tooltip-bg"
                            />
                            <text
                              x={Math.min(Math.max(p.x, 85), 825)}
                              y={Math.max(p.y - 36, 30)}
                              textAnchor="middle"
                              fill="#eab308"
                              fontSize="11"
                              fontWeight="700"
                            >
                              {p.item.label}
                            </text>
                            <text
                              x={Math.min(Math.max(p.x, 85), 825)}
                              y={Math.max(p.y - 18, 48)}
                              textAnchor="middle"
                              fill="#ffffff"
                              fontSize="11"
                              fontWeight="600"
                            >
                              {p.item.pending ? 'Not processed yet' : `Active users: ${formatNumber(p.item.value)}`}
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

        {/* Part 8: Footer with status & last updated timestamp */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <p className="hiyaghar-card-subtitle" style={{ margin: 0 }}>
            {chartFilter === 'today' ? (
              <>
                <i className="fa-solid fa-circle-info mr-1 text-amber" />
                {chartData.pendingLabel ? (
                  <>
                    <strong>{chartData.pendingLabel}</strong> is still being processed by Google Analytics (usually a few hours),
                    so it is shaded instead of shown as 0.
                  </>
                ) : (
                  <>Recent hours can take a few hours to appear in Google Analytics.</>
                )}{' '}
                For who is on the site right now, see <strong>Live Visitors</strong> on the Website Analytics page.
              </>
            ) : (
              <>
                <i className="fa-solid fa-circle-check mr-1 text-green-dark" />
                Data processed and reported via Google Analytics 4 Data API.
              </>
            )}
          </p>
          {lastUpdated && (
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              <i className="fa-regular fa-clock mr-1" />
              Data last updated: {lastUpdated}
            </span>
          )}
        </div>
      </div>

      {/* Part 3: Traffic Sources Section */}
      {showTrafficSources && !rangeState.invalid && (
        <div className="hiyaghar-dash-card">
          <div className="hiyaghar-card-header">
            <h3>
              <i className="fa-solid fa-chart-pie mr-2 text-gold" />
              Traffic Sources
            </h3>
            <p className="hiyaghar-card-subtitle">
              Visitor acquisition channels and top referring domains
              {sessionChannelsTotal > 0 && (
                <> · <strong>{formatNumber(sessionChannelsTotal)}</strong> total session(s)</>
              )}
            </p>
          </div>

          {loading ? (
            <div className="chart-no-data">
              <i className="fa-solid fa-spinner fa-spin text-gold" />
              <span>Loading traffic sources...</span>
            </div>
          ) : sessionChannelsError || topSourcesError ? (
            <div className="chart-no-data">
              <i className="fa-solid fa-triangle-exclamation text-amber" />
              <span>{sessionChannelsError || topSourcesError}</span>
            </div>
          ) : (
            <div className="traffic-two-col" style={{ marginTop: '16px' }}>
              {/* Left Column: Channels with visual progress bar */}
              <div className="traffic-sources-channel-col">
                <h4 className="traffic-section-subhead">
                  <i className="fa-solid fa-layer-group mr-2 text-blue" />
                  Sessions by Channel Grouping
                </h4>
                <div className="hiyaghar-table-responsive">
                  <table className="hiyaghar-dash-table">
                    <thead>
                      <tr>
                        <th>Channel</th>
                        <th style={{ textAlign: 'right' }}>Sessions</th>
                        <th style={{ width: '42%' }}>Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessionChannels.map((ch) => (
                        <tr key={ch.channel}>
                          <td><strong>{ch.channel}</strong></td>
                          <td style={{ textAlign: 'right' }}>{formatNumber(ch.sessions)}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div
                                style={{
                                  flex: 1,
                                  height: '8px',
                                  background: '#e2e8f0',
                                  borderRadius: '4px',
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    width: `${Math.min(100, Math.max(0, ch.percentage))}%`,
                                    height: '100%',
                                    background: getChannelColor(ch.channel),
                                    borderRadius: '4px',
                                    transition: 'width 0.4s ease',
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: '0.8rem', minWidth: '42px', textAlign: 'right', fontWeight: 600 }}>
                                {ch.percentage.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Top Traffic Sources (Source / Medium) */}
              <div className="traffic-sources-top-col">
                <h4 className="traffic-section-subhead">
                  <i className="fa-solid fa-arrow-up-right-from-square mr-2 text-purple" />
                  Top Traffic Sources (Source / Medium)
                </h4>
                {topSources.length === 0 ? (
                  <div className="chart-no-data" style={{ padding: '32px 0' }}>
                    <span>No traffic sources recorded in this period.</span>
                  </div>
                ) : (
                  <div className="hiyaghar-table-responsive">
                    <table className="hiyaghar-dash-table">
                      <thead>
                        <tr>
                          <th>Source / Medium</th>
                          <th style={{ textAlign: 'right' }}>Sessions</th>
                          <th style={{ textAlign: 'right' }}>Active Users</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topSources.map((s, idx) => (
                          <tr key={idx}>
                            <td>
                              <strong>{s.source}</strong>
                              <span style={{ color: '#64748b', marginLeft: '4px' }}>/ {s.medium}</span>
                            </td>
                            <td style={{ textAlign: 'right' }}>{formatNumber(s.sessions)}</td>
                            <td style={{ textAlign: 'right' }}>{formatNumber(s.activeUsers)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Part 4: Country and City Section */}
      {showGeo && !rangeState.invalid && (
        <div className="hiyaghar-dash-card">
          <div className="hiyaghar-card-header">
            <h3>
              <i className="fa-solid fa-map-location-dot mr-2 text-gold" />
              Visitors by Geography
            </h3>
            <p className="hiyaghar-card-subtitle">
              Top countries and cities by active visitors (Top 10 each)
            </p>
          </div>

          {loading ? (
            <div className="chart-no-data">
              <i className="fa-solid fa-spinner fa-spin text-gold" />
              <span>Loading geography data...</span>
            </div>
          ) : geoError ? (
            <div className="chart-no-data">
              <i className="fa-solid fa-triangle-exclamation text-amber" />
              <span>{geoError}</span>
            </div>
          ) : (
            <div className="traffic-two-col" style={{ marginTop: '16px' }}>
              {/* Countries */}
              <div>
                <h4 className="traffic-section-subhead">
                  <i className="fa-solid fa-earth-americas mr-2 text-blue" />
                  Visitors by Country
                </h4>
                {geoCountries.length === 0 ? (
                  <div className="chart-no-data" style={{ padding: '24px 0' }}>
                    <span>No country data for this period.</span>
                  </div>
                ) : (
                  <div className="hiyaghar-table-responsive">
                    <table className="hiyaghar-dash-table">
                      <thead>
                        <tr>
                          <th style={{ width: '48px' }}>#</th>
                          <th>Country</th>
                          <th style={{ textAlign: 'right' }}>Active Users</th>
                        </tr>
                      </thead>
                      <tbody>
                        {geoCountries.map((c, i) => (
                          <tr key={i}>
                            <td className="td-srno">{i + 1}</td>
                            <td><strong>{c.name}</strong></td>
                            <td style={{ textAlign: 'right' }}>{formatNumber(c.activeUsers)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Cities */}
              <div>
                <h4 className="traffic-section-subhead">
                  <i className="fa-solid fa-city mr-2 text-purple" />
                  Visitors by City
                </h4>
                {geoCities.length === 0 ? (
                  <div className="chart-no-data" style={{ padding: '24px 0' }}>
                    <span>No city data for this period.</span>
                  </div>
                ) : (
                  <div className="hiyaghar-table-responsive">
                    <table className="hiyaghar-dash-table">
                      <thead>
                        <tr>
                          <th style={{ width: '48px' }}>#</th>
                          <th>City</th>
                          <th style={{ textAlign: 'right' }}>Active Users</th>
                        </tr>
                      </thead>
                      <tbody>
                        {geoCities.map((c, i) => (
                          <tr key={i}>
                            <td className="td-srno">{i + 1}</td>
                            <td><strong>{c.name}</strong></td>
                            <td style={{ textAlign: 'right' }}>{formatNumber(c.activeUsers)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Part 5: Device Category Section */}
      {showDevices && !rangeState.invalid && (
        <div className="hiyaghar-dash-card">
          <div className="hiyaghar-card-header">
            <h3>
              <i className="fa-solid fa-laptop mr-2 text-gold" />
              Device Category
            </h3>
            <p className="hiyaghar-card-subtitle">
              Active visitors by device type: Desktop, Mobile, and Tablet
              {deviceTotalUsers > 0 && <> · <strong>{formatNumber(deviceTotalUsers)}</strong> total user(s)</>}
            </p>
          </div>

          {loading ? (
            <div className="chart-no-data">
              <i className="fa-solid fa-spinner fa-spin text-gold" />
              <span>Loading device data...</span>
            </div>
          ) : deviceError ? (
            <div className="chart-no-data">
              <i className="fa-solid fa-triangle-exclamation text-amber" />
              <span>{deviceError}</span>
            </div>
          ) : (
            <div style={{ marginTop: '16px' }}>
              <div className="hiyaghar-metrics-grid" style={{ marginBottom: '16px' }}>
                {deviceCategories.map((d) => {
                  const isMob = d.category.toLowerCase() === 'mobile';
                  const isTab = d.category.toLowerCase() === 'tablet';
                  const icon = isMob ? 'fa-mobile-screen' : isTab ? 'fa-tablet-screen-button' : 'fa-desktop';
                  const colorClass = isMob
                    ? 'bg-blue-light text-blue'
                    : isTab
                    ? 'bg-teal-light text-teal'
                    : 'bg-purple-light text-purple';

                  return (
                    <div key={d.category} className="hiyaghar-dash-metric-card">
                      <div className={`hiyaghar-metric-icon ${colorClass}`}>
                        <i className={`fa-solid ${icon}`} />
                      </div>
                      <div className="hiyaghar-metric-info">
                        <span className="hiyaghar-metric-label">{d.category}</span>
                        <span className="hiyaghar-metric-value">{formatNumber(d.activeUsers)}</span>
                        <span className="hiyaghar-metric-subtext" style={{ color: '#64748b' }}>
                          {d.percentage.toFixed(1)}% of visitors
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Combined percentage distribution bar */}
              <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px 18px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', height: '14px', borderRadius: '7px', overflow: 'hidden', background: '#e2e8f0', marginBottom: '10px' }}>
                  {deviceCategories.map((d) => {
                    const isMob = d.category.toLowerCase() === 'mobile';
                    const isTab = d.category.toLowerCase() === 'tablet';
                    const color = isMob ? '#2563eb' : isTab ? '#0d9488' : '#7c3aed';
                    return (
                      <div
                        key={d.category}
                        style={{
                          width: `${Math.max(0, d.percentage)}%`,
                          background: color,
                          height: '100%',
                          transition: 'width 0.4s ease',
                        }}
                        title={`${d.category}: ${d.percentage.toFixed(1)}%`}
                      />
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                  {deviceCategories.map((d) => {
                    const isMob = d.category.toLowerCase() === 'mobile';
                    const isTab = d.category.toLowerCase() === 'tablet';
                    const color = isMob ? '#2563eb' : isTab ? '#0d9488' : '#7c3aed';
                    return (
                      <div key={d.category} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
                        <span><strong>{d.category}</strong>: {formatNumber(d.activeUsers)} ({d.percentage.toFixed(1)}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Part 7: Cleaned up AI Assistants Table */}
      {showAiReferrals && !rangeState.invalid && (
        <div className="hiyaghar-dash-card">
          <div className="hiyaghar-card-header">
            <h3><i className="fa-solid fa-robot mr-2 text-gold" /> Visits from AI Assistants</h3>
            <p className="hiyaghar-card-subtitle">
              Visitors who clicked a link to hiyaghar.com inside ChatGPT, Perplexity, Gemini, Copilot or Claude
              {aiReport && <> · <strong>{formatNumber(aiReport.totalSessions)}</strong> visit(s) by <strong>{formatNumber(aiReport.totalUsers)}</strong> user(s)</>}
            </p>
          </div>
          {loading ? (
            <div className="chart-no-data">
              <i className="fa-solid fa-spinner fa-spin text-gold" />
              <span>Loading AI assistant visits...</span>
            </div>
          ) : aiError ? (
            <div className="chart-no-data">
              <i className="fa-solid fa-triangle-exclamation text-amber" />
              <span>{aiError}</span>
            </div>
          ) : (() => {
            const activeAiTools = aiReport?.tools.filter((t) => t.sessions > 0 || t.activeUsers > 0) ?? [];
            if (activeAiTools.length === 0) {
              return (
                <div className="chart-no-data" style={{ padding: '24px 0' }}>
                  <i className="fa-solid fa-robot text-neutral" />
                  <span>No visits from AI assistants in this period</span>
                </div>
              );
            }
            return (
              <div className="hiyaghar-table-responsive">
                <table className="hiyaghar-dash-table">
                  <thead>
                    <tr>
                      <th>AI Assistant</th>
                      <th style={{ textAlign: 'right' }}>Visits</th>
                      <th style={{ textAlign: 'right' }}>Users</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeAiTools.map((t) => (
                      <tr key={t.tool}>
                        <td><strong>{t.tool}</strong></td>
                        <td style={{ textAlign: 'right' }}>{formatNumber(t.sessions)}</td>
                        <td style={{ textAlign: 'right' }}>{formatNumber(t.activeUsers)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}

      {/* Pages list / table, rendered by the parent as its own card below this one */}
      {renderPages && !rangeState.invalid && renderPages({ pages, loading, error: pagesError })}
    </>
  );
};
