import React, { useCallback, useEffect, useRef, useState } from 'react';
import { WebsiteAnalyticsService, type RealtimeItem, type RealtimeResponse } from '../../services/websiteAnalyticsService';

// "Live now" panel: people on hiyaghar.com right now (Google Analytics Realtime).
// Refreshes every 60 seconds while the browser tab is visible.

const REFRESH_MS = 60_000;

const formatNumber = (n: number) => n.toLocaleString('en-IN');

const deviceIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n === 'mobile') return 'fa-mobile-screen';
  if (n === 'tablet') return 'fa-tablet-screen-button';
  return 'fa-desktop';
};

const RealtimeTable: React.FC<{ title: string; icon: string; label: string; items: RealtimeItem[] }> = ({ title, icon, label, items }) => (
  <div>
    <h4 className="traffic-section-subhead">
      <i className={`fa-solid ${icon} mr-2 text-gold`} />
      {title}
    </h4>
    {items.length === 0 ? (
      <div className="chart-no-data" style={{ padding: '24px 0' }}>
        <span>Nobody right now.</span>
      </div>
    ) : (
      <div className="hiyaghar-table-responsive">
        <table className="hiyaghar-dash-table">
          <thead>
            <tr>
              <th style={{ width: '48px' }}>#</th>
              <th>{label}</th>
              <th style={{ textAlign: 'right' }}>Active Users</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={`${it.name}-${i}`}>
                <td className="td-srno">{i + 1}</td>
                <td>
                  <strong className="live-visitors-name" title={it.name}>{it.name}</strong>
                </td>
                <td style={{ textAlign: 'right' }}>{formatNumber(it.activeUsers)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

export const LiveVisitorsSection: React.FC = () => {
  const [data, setData] = useState<RealtimeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    const res = await WebsiteAnalyticsService.getRealtime();
    if (res.success && res.data) {
      setData(res.data);
      setError(null);
    } else {
      setError(res.message || 'Could not load live visitors.');
    }
    setLoading(false);
    inFlight.current = false;
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, REFRESH_MS);
    // Coming back to the tab: refresh straight away instead of waiting for the next tick.
    const onVisible = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [load]);

  const perMinute = data?.perMinute ?? [];
  const maxMinute = Math.max(1, ...perMinute);
  const updatedAt = data ? new Date(data.fetchedAtUtc).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : null;

  return (
    <div className="hiyaghar-dash-card">
      <div className="hiyaghar-card-header live-visitors-header">
        <div>
          <h3>
            <span className="live-visitors-dot" />
            Live Visitors Right Now
          </h3>
          <p className="hiyaghar-card-subtitle">
            People on the website in the last 30 minutes (Google Analytics Realtime) · refreshes every minute
            {updatedAt && <> · updated {updatedAt}</>}
          </p>
        </div>
        <button type="button" className="live-visitors-refresh" onClick={load} disabled={loading} title="Refresh now">
          <i className={`fa-solid fa-rotate-right ${loading ? 'fa-spin' : ''}`} />
        </button>
      </div>

      {!data && loading ? (
        <div className="chart-no-data">
          <i className="fa-solid fa-spinner fa-spin text-gold" />
          <span>Loading live visitors...</span>
        </div>
      ) : !data && error ? (
        <div className="chart-no-data">
          <i className="fa-solid fa-triangle-exclamation text-amber" />
          <span>{error}</span>
        </div>
      ) : data ? (
        <>
          {error && (
            <p className="live-visitors-stale">
              <i className="fa-solid fa-triangle-exclamation text-amber mr-2" />
              {error} Showing the last numbers.
            </p>
          )}

          <div className="hiyaghar-metrics-grid" style={{ marginTop: '16px' }}>
            <div className="hiyaghar-metric-card live-visitors-card">
              <div className="hiyaghar-metric-icon bg-green-light text-green">
                <i className="fa-solid fa-signal" />
              </div>
              <div className="hiyaghar-metric-info">
                <span className="hiyaghar-metric-label">Active Users (30 min)</span>
                <span className="hiyaghar-metric-value">{formatNumber(data.activeUsers30Min)}</span>
                <span className="hiyaghar-metric-subtext text-green">On the website in the last 30 minutes</span>
              </div>
            </div>
            <div className="hiyaghar-metric-card live-visitors-card">
              <div className="hiyaghar-metric-icon bg-blue-light text-blue">
                <i className="fa-solid fa-user-clock" />
              </div>
              <div className="hiyaghar-metric-info">
                <span className="hiyaghar-metric-label">Active Users (5 min)</span>
                <span className="hiyaghar-metric-value">{formatNumber(data.activeUsers5Min)}</span>
                <span className="hiyaghar-metric-subtext text-blue">Closest to "on the site right now"</span>
              </div>
            </div>
            <div className="hiyaghar-metric-card live-visitors-card">
              <div className="hiyaghar-metric-icon bg-purple-light text-purple">
                <i className="fa-solid fa-eye" />
              </div>
              <div className="hiyaghar-metric-info">
                <span className="hiyaghar-metric-label">Page Views (30 min)</span>
                <span className="hiyaghar-metric-value">{formatNumber(data.pageViews30Min)}</span>
                <span className="hiyaghar-metric-subtext text-purple">Pages opened in the last 30 minutes</span>
              </div>
            </div>
            {data.devices.map((d) => (
              <div key={d.name} className="hiyaghar-metric-card live-visitors-card">
                <div className="hiyaghar-metric-icon bg-teal-light text-teal">
                  <i className={`fa-solid ${deviceIcon(d.name)}`} />
                </div>
                <div className="hiyaghar-metric-info">
                  <span className="hiyaghar-metric-label">{d.name}</span>
                  <span className="hiyaghar-metric-value">{formatNumber(d.activeUsers)}</span>
                  <span className="hiyaghar-metric-subtext" style={{ color: '#64748b' }}>Live visitors on {d.name.toLowerCase()}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Active users per minute, last 30 minutes (oldest on the left). */}
          <div className="live-visitors-minutes" role="img" aria-label="Active users per minute in the last 30 minutes">
            {perMinute.map((v, i) => {
              const minsAgo = perMinute.length - 1 - i;
              return (
                <div
                  key={i}
                  className="live-visitors-bar"
                  style={{ height: `${v === 0 ? 2 : Math.max(8, (v / maxMinute) * 100)}%` }}
                  title={`${minsAgo === 0 ? 'This minute' : `${minsAgo} min ago`}: ${formatNumber(v)} user(s)`}
                />
              );
            })}
          </div>
          <div className="live-visitors-axis">
            <span>30 min ago</span>
            <span>Now</span>
          </div>

          <div className="traffic-two-col" style={{ marginTop: '16px' }}>
            <RealtimeTable title="Pages being viewed" icon="fa-file-lines" label="Page Title" items={data.pages} />
            <RealtimeTable title="Countries" icon="fa-earth-asia" label="Country" items={data.countries} />
          </div>
          <div className="traffic-two-col" style={{ marginTop: '16px' }}>
            <RealtimeTable title="Cities" icon="fa-city" label="City" items={data.cities} />
          </div>
        </>
      ) : null}
    </div>
  );
};
