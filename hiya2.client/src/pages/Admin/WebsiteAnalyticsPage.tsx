import React from 'react';
import { DataTable, type ColumnDef } from '../../components/admin/DataTable';
import { WebsiteVisitorsSection } from '../../components/admin/WebsiteVisitorsSection';
import { LiveVisitorsSection } from '../../components/admin/LiveVisitorsSection';
import { usePermission } from '../../context/PermissionContext';
import type { VisitorPage } from '../../services/websiteAnalyticsService';
import './AdminDashboardPage.css';

// Website & Content > Website Analytics: visitor cards + previous comparisons +
// hourly visitors chart + Traffic Sources + Geography + Device Categories +
// AI Assistants and Pages and Screens with page title, engagement time, search, and CSV export.

const formatEngagement = (sec: number | undefined | null) => {
  if (!sec || sec <= 0) return '0s';
  const total = Math.round(sec);
  if (total < 60) return `${total}s`;
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}m ${s}s`;
};

export const WebsiteAnalyticsPage: React.FC = () => {
  const { hasPermission } = usePermission();

  const columns: ColumnDef<VisitorPage>[] = [
    {
      key: 'pagePath',
      label: 'Page Path',
      render: (p) => <strong className="order-number-tag">{p.pagePath}</strong>,
    },
    {
      key: 'pageTitle',
      label: 'Page Title',
      render: (p) => (
        <span
          title={p.pageTitle}
          style={{
            maxWidth: '300px',
            display: 'inline-block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {p.pageTitle || '(untitled)'}
        </span>
      ),
    },
    {
      key: 'views',
      label: 'Views',
      render: (p) => p.views.toLocaleString('en-IN'),
    },
    {
      key: 'activeUsers',
      label: 'Active Users',
      render: (p) => p.activeUsers.toLocaleString('en-IN'),
    },
    {
      key: 'averageEngagementTimeSeconds',
      label: 'Avg. Engagement Time',
      render: (p) => formatEngagement(p.averageEngagementTimeSeconds),
    },
  ];

  return (
    <div className="hiyaghar-admin-dashboard">
      <LiveVisitorsSection />
      <WebsiteVisitorsSection
        showAiReferrals
        showExtendedSummary
        showPreviousPeriodComparison
        showTrafficSources
        showGeo
        showDevices
        liveVisitorsHint="above"
        renderPages={({ pages, loading, error }) => (
          <>
            {error && (
              <div className="hiyaghar-dash-card">
                <div className="chart-no-data">
                  <i className="fa-solid fa-triangle-exclamation text-amber" />
                  <span>{error}</span>
                </div>
              </div>
            )}
            {!error && (
              <DataTable<VisitorPage>
                title="Pages and Screens"
                columns={columns}
                data={pages}
                loading={loading}
                defaultSortKey="views"
                defaultSortDirection="desc"
                searchFields={(p) => [p.pagePath, p.pageTitle]}
                searchPlaceholder="Search page path or title..."
                canAdd={false}
                canEdit={false}
                canDelete={false}
                canExport={hasPermission('WEBSITE_ANALYTICS', 'canExport')}
              />
            )}
          </>
        )}
      />
    </div>
  );
};
