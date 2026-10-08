import React from 'react';
import { usePermission } from '../../context/PermissionContext';

interface GenericModulePageProps {
  moduleKey: string;
  moduleName: string;
  onNavigateDashboard?: () => void;
}

export const GenericModulePage: React.FC<GenericModulePageProps> = ({
  moduleKey,
  moduleName,
  onNavigateDashboard,
}) => {
  const { currentMenuPermission } = usePermission(moduleKey);

  return (
    <div className="hiyaghar-admin-page-container">
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        border: '1px solid #e9ecef'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{
            fontSize: '24px',
            color: '#2d6a4f',
            background: '#e6f4ea',
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #c8e6c9',
            flexShrink: 0
          }}>
            <i className="fa-solid fa-gear"></i>
          </div>
          <div>
            <h2 style={{ margin: 0, color: '#10243E', fontSize: '24px', fontWeight: 700 }}>{moduleName} Management</h2>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
              Dynamic Administrative Control Module ({moduleKey})
            </p>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #1e4d3b' }}>
            <span style={{ fontSize: '12px', color: '#6c757d', textTransform: 'uppercase' }}>View Access</span>
            <h4 style={{ margin: '4px 0 0', color: currentMenuPermission.canView ? '#2e7d32' : '#c62828' }}>
              {currentMenuPermission.canView ? 'Granted ✓' : 'Denied ✕'}
            </h4>
          </div>
          <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #1e4d3b' }}>
            <span style={{ fontSize: '12px', color: '#6c757d', textTransform: 'uppercase' }}>Create Access</span>
            <h4 style={{ margin: '4px 0 0', color: currentMenuPermission.canAdd ? '#2e7d32' : '#c62828' }}>
              {currentMenuPermission.canAdd ? 'Granted ✓' : 'Denied ✕'}
            </h4>
          </div>
          <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #1e4d3b' }}>
            <span style={{ fontSize: '12px', color: '#6c757d', textTransform: 'uppercase' }}>Edit Access</span>
            <h4 style={{ margin: '4px 0 0', color: currentMenuPermission.canEdit ? '#2e7d32' : '#c62828' }}>
              {currentMenuPermission.canEdit ? 'Granted ✓' : 'Denied ✕'}
            </h4>
          </div>
          <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #1e4d3b' }}>
            <span style={{ fontSize: '12px', color: '#6c757d', textTransform: 'uppercase' }}>Delete Access</span>
            <h4 style={{ margin: '4px 0 0', color: currentMenuPermission.canDelete ? '#2e7d32' : '#c62828' }}>
              {currentMenuPermission.canDelete ? 'Granted ✓' : 'Denied ✕'}
            </h4>
          </div>
        </div>

        <div style={{
          background: '#f1f8f5',
          border: '1px border #c8e6c9',
          padding: '24px',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <h4 style={{ margin: '0 0 8px', color: '#1e4d3b' }}>Module Dashboard & Status</h4>
          <p style={{ margin: 0, color: '#333' }}>
            The <strong>{moduleName}</strong> module is currently active in the HiyaGhar Dynamic RBAC security system. All permission controls for this module are dynamically evaluated against your role.
          </p>
        </div>

        {onNavigateDashboard && (
          <button
            type="button"
            className="hiyaghar-btn-secondary"
            onClick={onNavigateDashboard}
            style={{ padding: '10px 20px', cursor: 'pointer' }}
          >
            ← Return to Main Dashboard
          </button>
        )}
      </div>
    </div>
  );
};
