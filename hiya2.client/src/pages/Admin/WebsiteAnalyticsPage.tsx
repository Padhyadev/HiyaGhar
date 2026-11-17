import React from 'react';
import { DataTable, type ColumnDef } from '../../components/admin/DataTable';
import { WebsiteVisitorsSection } from '../../components/admin/WebsiteVisitorsSection';
import { usePermission } from '../../context/PermissionContext';
import type { VisitorPage } from '../../services/websiteAnalyticsService';
import './AdminDashboardPage.css';

// Website & Content > Website Analytics: visitor cards + daily chart (same as the Dashboard) and
// every page of the HiyaGhar website with its views and active users, like Google Analytics
// "Pages and screens" filtered to the HiyaGhar stream.
export const WebsiteAnalyticsPage: React.FC = () => {
  const { hasPermission } = usePermission();

  const columns: ColumnDef<VisitorPage>[] = [
    {
      key: 'pagePath',
      label: 'Page Path',
      render: (p) => <strong className="order-number-tag">{p.pagePath}</strong>,
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
  ];

  return (
    <div className="hiyaghar-admin-dashboard">
      <WebsiteVisitorsSection
        showAiReferrals
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
                searchFields={(p) => [p.pagePath]}
                searchPlaceholder="Search page path..."
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
