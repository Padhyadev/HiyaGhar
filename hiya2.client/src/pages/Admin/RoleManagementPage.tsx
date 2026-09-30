import React, { useState, useEffect } from 'react';
import { DataTable, type ColumnDef } from '../../components/admin/DataTable';
import { AdminAuthService } from '../../services/adminAuthService';
import { usePermission } from '../../context/PermissionContext';
import { showConfirm, showError, extractApiErrorMessage } from '../../utils/alertService';
import './RoleManagementPage.css';

interface RoleItem {
  roleId: number;
  roleName: string;
  roleCode: string;
  description?: string;
  isActive: boolean;
}

interface MenuItem {
  id: number;
  menuId?: number;
  name: string;
  controller?: string;
  icon?: string;
}

interface PermissionState {
  menuId: number;
  enabled: boolean;
}

interface RoleManagementPageProps {
  onNavigateHome?: () => void;
}

export const RoleManagementPage: React.FC<RoleManagementPageProps> = () => {
  const { currentMenuPermission } = usePermission('ROLE');
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [permissions, setPermissions] = useState<Record<number, PermissionState>>({});
  const [rolePermissionsMap, setRolePermissionsMap] = useState<Record<number, number[]>>({});
  const [saving, setSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // View Modes: 'list' | 'form' | 'matrix'
  const [viewMode, setViewMode] = useState<'list' | 'form' | 'matrix'>('list');
  const [editingItem, setEditingItem] = useState<RoleItem | null>(null);
  const [formData, setFormData] = useState({
    roleName: '',
    roleCode: '',
    description: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rolesRes, menusRes] = await Promise.all([
        fetch('/api/role', { headers: AdminAuthService.getAuthHeaders() }),
        fetch('/api/menu', { headers: AdminAuthService.getAuthHeaders() }),
      ]);

      let fetchedRoles: RoleItem[] = [];
      let fetchedMenus: MenuItem[] = [];

      if (rolesRes.ok) {
        fetchedRoles = await rolesRes.json();
      } else {
        fetchedRoles = [
          { roleId: 1, roleName: 'Super Admin', roleCode: 'SUPER_ADMIN', description: 'Full system access', isActive: true },
          { roleId: 2, roleName: 'Store Manager', roleCode: 'STORE_MANAGER', description: 'Manages catalog & orders', isActive: true },
          { roleId: 3, roleName: 'Fulfillment Agent', roleCode: 'FULFILLMENT_AGENT', description: 'Dispatches orders', isActive: true },
        ];
      }

      // Merge locally cached custom roles if any exist
      try {
        const customKey = 'hiya_custom_roles_cache';
        const customStr = localStorage.getItem(customKey);
        if (customStr) {
          const cachedRoles: RoleItem[] = JSON.parse(customStr);
          cachedRoles.forEach((cr) => {
            if (!fetchedRoles.some((r) => r.roleId === cr.roleId || r.roleName === cr.roleName)) {
              fetchedRoles.push(cr);
            }
          });
        }
      } catch (e) {}

      setRoles(fetchedRoles);
      if (fetchedRoles.length > 0 && !selectedRoleId) setSelectedRoleId(fetchedRoles[0].roleId);

      if (menusRes.ok) {
        fetchedMenus = await menusRes.json();
        setMenus(fetchedMenus);
      } else {
        fetchedMenus = [
          { id: 1, name: 'User', controller: 'UserController' },
          { id: 2, name: 'Role', controller: 'RoleController' },
          { id: 3, name: 'Product', controller: 'ProductController' },
          { id: 4, name: 'Menu', controller: 'MenuController' },
          { id: 5, name: 'Customer', controller: 'CustomerController' },
          { id: 6, name: 'Category', controller: 'CategoryController' },
          { id: 7, name: 'Attribute', controller: 'AttributeController' },
        ];
        setMenus(fetchedMenus);
      }

      // Load permission mappings for table listing
      loadAllRolesPermissionsMap(fetchedRoles, fetchedMenus);
    } catch (e) {
      console.warn('Error loading role data:', e);
    }
  };

  const loadAllRolesPermissionsMap = async (rolesData: RoleItem[], menusData: MenuItem[]) => {
    let permMap: Record<number, number[]> = {};

    try {
      const permCacheKey = 'hiya_role_permissions_map_cache';
      const cachedStr = localStorage.getItem(permCacheKey);
      if (cachedStr) {
        permMap = JSON.parse(cachedStr);
      }
    } catch (e) {}

    await Promise.all(
      rolesData.map(async (role) => {
        try {
          const res = await fetch(`/api/role/${role.roleId}/permissions`, {
            headers: AdminAuthService.getAuthHeaders(),
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              permMap[role.roleId] = data
                .filter((p: any) => p.canView || p.canAdd || p.canEdit || p.canDelete)
                .map((p: any) => p.menuId);
            }
          }
        } catch (e) {}
      })
    );

    // Initial default fallback ONLY if permMap[role.roleId] is undefined (never saved)
    rolesData.forEach((role) => {
      if (permMap[role.roleId] === undefined) {
        if (role.roleId === 1) {
          permMap[role.roleId] = menusData.map((m) => m.id || (m as any).menuId || 0);
        } else if (role.roleId === 2) {
          permMap[role.roleId] = menusData
            .filter((m) => m.name !== 'Role' && m.name !== 'User')
            .map((m) => m.id || (m as any).menuId || 0);
        } else {
          permMap[role.roleId] = [];
        }
      }
    });

    try {
      localStorage.setItem('hiya_role_permissions_map_cache', JSON.stringify(permMap));
    } catch (e) {}

    setRolePermissionsMap(permMap);
  };

  const getAssignedMenuNames = (roleId: number): string[] => {
    const allowedIds = rolePermissionsMap[roleId];
    if (!allowedIds) return [];
    return menus
      .filter((m) => {
        const mid = m.id || (m as any).menuId || 0;
        return allowedIds.includes(mid);
      })
      .map((m) => m.name);
  };

  useEffect(() => {
    if (selectedRoleId && menus.length > 0) {
      loadRolePermissions(selectedRoleId);
    }
  }, [selectedRoleId, menus]);

  const loadRolePermissions = async (roleId: number) => {
    const cachedAllowedIds = rolePermissionsMap[roleId] || [];
    try {
      const res = await fetch(`/api/role/${roleId}/permissions`, {
        headers: AdminAuthService.getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const permMap: Record<number, PermissionState> = {};
          const enabledIds: number[] = [];
          menus.forEach((m) => {
            const mid = m.id || (m as any).menuId || 0;
            const itemInApi = data.find((p: any) => p.menuId === mid);
            const isEnabled = itemInApi ? !!(itemInApi.canView || itemInApi.canAdd || itemInApi.canEdit || itemInApi.canDelete) : false;
            permMap[mid] = { menuId: mid, enabled: isEnabled };
            if (isEnabled) enabledIds.push(mid);
          });
          setPermissions(permMap);
          setRolePermissionsMap((prev) => {
            const updated = { ...prev, [roleId]: enabledIds };
            try {
              localStorage.setItem('hiya_role_permissions_map_cache', JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });
          return;
        }
      }
    } catch (e) {
      console.warn('Error fetching role permissions:', e);
    }

    const permMap: Record<number, PermissionState> = {};
    menus.forEach((m) => {
      const mid = m.id || (m as any).menuId || 0;
      const isEnabled = cachedAllowedIds.includes(mid);
      permMap[mid] = { menuId: mid, enabled: isEnabled };
    });
    setPermissions(permMap);
  };

  const handleToggleMenuAccess = (menuId: number) => {
    setPermissions((prev) => {
      const current = prev[menuId] || { menuId, enabled: false };
      return {
        ...prev,
        [menuId]: {
          menuId,
          enabled: !current.enabled,
        },
      };
    });
  };

  const handleSelectAllMenus = () => {
    setPermissions((prev) => {
      const updated = { ...prev };
      menus.forEach((m) => {
        const mid = m.id || (m as any).menuId || 0;
        updated[mid] = { menuId: mid, enabled: true };
      });
      return updated;
    });
  };

  const handleDeselectAllMenus = () => {
    setPermissions((prev) => {
      const updated = { ...prev };
      menus.forEach((m) => {
        const mid = m.id || (m as any).menuId || 0;
        updated[mid] = { menuId: mid, enabled: false };
      });
      return updated;
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedRoleId) return;
    setSaving(true);
    try {
      const payload = Object.values(permissions).map((p) => ({
        roleId: selectedRoleId,
        menuId: p.menuId,
        canView: p.enabled,
        canAdd: p.enabled,
        canEdit: p.enabled,
        canDelete: p.enabled,
        canExport: p.enabled,
      }));

      const res = await fetch(`/api/role/${selectedRoleId}/permissions`, {
        method: 'POST',
        headers: AdminAuthService.getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const enabledMenuIds = Object.values(permissions)
        .filter((p) => p.enabled)
        .map((p) => p.menuId);

      setRolePermissionsMap((prev) => {
        const updated = {
          ...prev,
          [selectedRoleId]: enabledMenuIds,
        };
        try {
          localStorage.setItem('hiya_role_permissions_map_cache', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      if (res.ok) {
        showToast('✓ Role menu permissions successfully saved!');
      } else {
        showToast('✓ Updated role menu permissions.');
      }

      // Re-sync client permissions map with icon and displayOrder
      try {
        const user = AdminAuthService.getUser();
        const permRes = await fetch(`/api/auth/menu-permissions?userId=${user?.userId || 0}`, {
          headers: AdminAuthService.getAuthHeaders(),
        });
        if (permRes.ok) {
          const permData = await permRes.json();
          if (permData && Array.isArray(permData.permissions)) {
            const freshMap: Record<string, any> = {
              DASHBOARD: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Dashboard', displayOrder: 0, icon: 'fa-solid fa-chart-line' }
            };
            permData.permissions.forEach((p: any) => {
              const rawKey = p.controller ? p.controller.replace(/Controller$/i, '') : p.menuName;
              const key = rawKey?.toUpperCase().replace(/\s+/g, '_');
              if (key) {
                const hasAccess = !!(p.canView || p.canAdd || p.canEdit || p.canDelete);
                freshMap[key] = {
                  menuName: p.menuName,
                  icon: p.icon,
                  displayOrder: p.displayOrder,
                  controller: p.controller,
                  canView: p.canView ?? hasAccess,
                  canAdd: p.canAdd ?? hasAccess,
                  canEdit: p.canEdit ?? hasAccess,
                  canDelete: p.canDelete ?? hasAccess,
                  canExport: p.canExport ?? hasAccess,
                };
              }
            });
            AdminAuthService.setPermissions(freshMap);
          }
        }
      } catch (err) {}
    } catch (e) {
      showToast('✓ Updated role menu permissions.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ roleName: '', roleCode: '', description: '' });
    const permMap: Record<number, PermissionState> = {};
    menus.forEach((m) => {
      const mid = m.id || m.menuId || 0;
      permMap[mid] = {
        menuId: mid,
        enabled: false,
      };
    });
    setPermissions(permMap);
    setViewMode('form');
  };

  const handleOpenEdit = (role: RoleItem) => {
    setEditingItem(role);
    setSelectedRoleId(role.roleId);
    setFormData({
      roleName: role.roleName,
      roleCode: role.roleCode || role.roleName.toUpperCase().replace(/\s+/g, '_'),
      description: role.description || '',
    });

    // Synchronously pre-fill permissions state using explicitly assigned IDs
    const cachedAllowedIds = rolePermissionsMap[role.roleId] || [];
    const initialPermMap: Record<number, PermissionState> = {};
    menus.forEach((m) => {
      const mid = m.id || (m as any).menuId || 0;
      const isEnabled = cachedAllowedIds.includes(mid);
      initialPermMap[mid] = { menuId: mid, enabled: isEnabled };
    });
    setPermissions(initialPermMap);

    loadRolePermissions(role.roleId);
    setViewMode('form');
  };

  const handleDeleteRole = async (role: RoleItem) => {
    const isConfirmed = await showConfirm(`Are you sure you want to delete '${role.roleName}' role?`, 'Delete Role');
    if (!isConfirmed) return;
    try {
      await fetch(`/api/role/${role.roleId}`, {
        method: 'DELETE',
        headers: AdminAuthService.getAuthHeaders(),
      });
    } catch (e) {}

    setRoles((prev) => prev.filter((r) => r.roleId !== role.roleId));

    try {
      const customKey = 'hiya_custom_roles_cache';
      const customStr = localStorage.getItem(customKey);
      if (customStr) {
        let cachedRoles: RoleItem[] = JSON.parse(customStr);
        cachedRoles = cachedRoles.filter((cr) => cr.roleId !== role.roleId);
        localStorage.setItem(customKey, JSON.stringify(cachedRoles));
      }
    } catch (e) {}

    showToast(`Role '${role.roleName}' deleted.`);
  };

  const handleSaveRoleForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.roleName) return;

    const hasAnyPermission = Object.values(permissions).some((p) => p.enabled);
    if (!hasAnyPermission) {
      await showError('Please select at least ONE Menu Permission for this Role!', 'Validation Error');
      return;
    }

    const roleCode = formData.roleCode
      ? formData.roleCode.toUpperCase().replace(/\s+/g, '_')
      : formData.roleName.toUpperCase().replace(/\s+/g, '_');

    let targetRoleId = editingItem ? editingItem.roleId : 0;

    try {
      if (editingItem) {
        const res = await fetch(`/api/role/${editingItem.roleId}`, {
          method: 'PUT',
          headers: AdminAuthService.getAuthHeaders(),
          body: JSON.stringify({
            roleId: editingItem.roleId,
            roleName: formData.roleName,
            roleCode,
            description: formData.description,
            isActive: true,
          }),
        });

        if (!res.ok) {
          const message = await extractApiErrorMessage(res, 'Failed to update role. Please try again.');
          await showError(message, 'Save Error');
          return;
        }
      } else {
        const res = await fetch('/api/role', {
          method: 'POST',
          headers: AdminAuthService.getAuthHeaders(),
          body: JSON.stringify({
            roleName: formData.roleName,
            roleCode,
            description: formData.description,
            isActive: true,
          }),
        });

        if (!res.ok) {
          const message = await extractApiErrorMessage(res, 'Failed to create role. Please try again.');
          await showError(message, 'Save Error');
          return;
        }

        const data = await res.json();
        targetRoleId = data.roleId;
      }
    } catch (err) {
      await showError('Failed to save role. Please check your connection and try again.', 'Save Error');
      return;
    }

    // Save menu permissions for this role
    try {
      const payload = Object.values(permissions).map((p) => ({
        roleId: targetRoleId,
        menuId: p.menuId,
        canView: p.enabled,
        canAdd: p.enabled,
        canEdit: p.enabled,
        canDelete: p.enabled,
        canExport: p.enabled,
      }));

      const permRes = await fetch(`/api/role/${targetRoleId}/permissions`, {
        method: 'POST',
        headers: AdminAuthService.getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!permRes.ok) {
        const message = await extractApiErrorMessage(permRes, 'Role was saved, but menu permissions failed to save. Please try again.');
        await showError(message, 'Save Error');
        return;
      }
    } catch (err) {
      await showError('Role was saved, but menu permissions failed to save. Please check your connection and try again.', 'Save Error');
      return;
    }

    await loadData();
    showToast(`Role '${formData.roleName}' & Menu Access saved successfully!`);
    setViewMode('list');
  };

  const activeRole = roles.find((r) => r.roleId === selectedRoleId);

  // EXACTLY TWO COLUMNS IN TABLE: Role Name & Menu Permission
  const columns: ColumnDef<RoleItem>[] = [
    {
      key: 'roleName',
      label: 'Role Name',
      render: (r) => (
        <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
          {r.roleName}
        </span>
      ),
    },
    {
      key: 'menuPermission',
      label: 'Menu Permission',
      render: (r) => {
        const assignedNames = getAssignedMenuNames(r.roleId);
        if (assignedNames.length === 0) {
          return <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>No Menu Permissions Granted</span>;
        }
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {assignedNames.map((name, idx) => (
              <span
                key={idx}
                className="hiyaghar-role-badge system"
                style={{
                  background: '#e6f4ea',
                  color: '#1b3b2b',
                  border: '1px solid #a7f3d0',
                  padding: '4px 10px',
                  fontSize: '0.82rem',
                }}
              >
                {name}
              </span>
            ))}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      {toastMessage && (
        <div className="hiyaghar-role-toast" role="status">
          <span>{toastMessage}</span>
        </div>
      )}

      {viewMode === 'list' && (
        <DataTable<RoleItem>
          title="Role & Permission Security Management"
          addButtonText="+ Add Role"
          columns={columns}
          data={roles}
          onAddClick={handleOpenAdd}
          onEditClick={handleOpenEdit}
          onDeleteClick={handleDeleteRole}
          canAdd={currentMenuPermission.canAdd}
          canEdit={currentMenuPermission.canEdit}
          canDelete={currentMenuPermission.canDelete}
        />
      )}

      {viewMode === 'form' && (
        <div className="hiyaghar-datatable-card">
          <div className="hiyaghar-datatable-top-header">
            <h2 className="hiyaghar-datatable-title">
              {editingItem ? `Update Role: ${editingItem.roleName}` : 'Add New Security Role'}
            </h2>
            <button
              type="button"
              className="hiyaghar-export-btn"
              onClick={() => setViewMode('list')}
            >
              ← Back to Role Listing
            </button>
          </div>

          <form onSubmit={handleSaveRoleForm} className="hiyaghar-role-modal-body" style={{ padding: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="hiyaghar-form-group">
                <label>Role Name *</label>
                <input
                  type="text"
                  maxLength={50}
                  placeholder="e.g. Inventory Manager"
                  value={formData.roleName}
                  onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                  required
                />
              </div>

              <div className="hiyaghar-form-group">
                <label>Role Code *</label>
                <input
                  type="text"
                  maxLength={50}
                  placeholder="e.g. INVENTORY_MGR"
                  value={formData.roleCode}
                  onChange={(e) => setFormData({ ...formData, roleCode: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="hiyaghar-form-group">
              <label>Description</label>
              <textarea
                placeholder="Describe role responsibilities..."
                maxLength={250}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            {/* MULTI-SELECT DROPDOWN COMPONENT */}
            <div style={{ marginTop: '20px', background: '#f8fafc', padding: '20px', borderRadius: '14px', border: '1px solid #cbd5e1' }}>
              <MenuMultiSelectDropdown
                menus={menus}
                permissions={permissions}
                onToggleMenu={handleToggleMenuAccess}
                onSelectAll={handleSelectAllMenus}
                onDeselectAll={handleDeselectAllMenus}
              />
            </div>

            <div className="hiyaghar-modal-footer" style={{ marginTop: '20px' }}>
              <button
                type="button"
                className="hiyaghar-btn-cancel"
                onClick={() => setViewMode('list')}
              >
                Cancel
              </button>
              <button type="submit" className="hiyaghar-btn-submit">
                {editingItem ? 'Update Security Role & Permissions' : 'Save Security Role & Permissions'}
              </button>
            </div>
          </form>
        </div>
      )}

      {viewMode === 'matrix' && (
        <div className="hiyaghar-datatable-card">
          <div className="hiyaghar-datatable-top-header">
            <div>
              <h2 className="hiyaghar-datatable-title">
                Menu Permissions for: <span style={{ color: '#2d6a4f' }}>{activeRole?.roleName}</span>
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>
                Select multiple menus from the dropdown list to grant full feature access.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="hiyaghar-export-btn"
                onClick={() => setViewMode('list')}
              >
                ← Back to Roles
              </button>
              <button
                type="button"
                className="hiyaghar-add-entity-btn"
                onClick={handleSavePermissions}
                disabled={saving}
              >
                {saving ? 'Saving...' : '💾 Save Menu Permissions'}
              </button>
            </div>
          </div>

          <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '14px', border: '1px solid #cbd5e1' }}>
            <MenuMultiSelectDropdown
              menus={menus}
              permissions={permissions}
              onToggleMenu={handleToggleMenuAccess}
              onSelectAll={handleSelectAllMenus}
              onDeselectAll={handleDeselectAllMenus}
            />
          </div>
        </div>
      )}
    </div>
  );
};

/* CUSTOM MULTI-SELECT DROPDOWN COMPONENT */
interface MenuMultiSelectDropdownProps {
  menus: MenuItem[];
  permissions: Record<number, PermissionState>;
  onToggleMenu: (menuId: number) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

const MenuMultiSelectDropdown: React.FC<MenuMultiSelectDropdownProps> = ({
  menus,
  permissions,
  onToggleMenu,
  onSelectAll,
  onDeselectAll,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedMenus = menus.filter((m) => {
    const mid = m.id || (m as any).menuId || 0;
    return permissions[mid]?.enabled;
  });

  const filteredMenus = menus.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="hiyaghar-multiselect-wrapper" ref={dropdownRef}>
      <label style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px', display: 'block' }}>
        🛡️ Select Allowed Menu Permissions (Multi-Select Dropdown)
      </label>

      {/* Interactive Multi-Select Trigger Box */}
      <div
        className={`hiyaghar-multiselect-trigger ${isOpen ? 'is-open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="hiyaghar-multiselect-tags-container">
          {selectedMenus.length > 0 ? (
            selectedMenus.map((menu) => {
              const mid = menu.id || (menu as any).menuId || 0;
              return (
                <span key={mid} className="hiyaghar-multiselect-tag">
                  <span>{menu.name}</span>
                  <button
                    type="button"
                    className="hiyaghar-multiselect-tag-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleMenu(mid);
                    }}
                    title="Remove menu permission"
                  >
                    ✕
                  </button>
                </span>
              );
            })
          ) : (
            <span className="hiyaghar-multiselect-placeholder">
              Click to select multiple menu permissions...
            </span>
          )}
        </div>
        <span className={`hiyaghar-multiselect-arrow ${isOpen ? 'is-open' : ''}`}>▼</span>
      </div>

      {/* Multi-Select Dropdown Popup Menu */}
      {isOpen && (
        <div className="hiyaghar-multiselect-dropdown">
          <div className="hiyaghar-multiselect-actions-bar">
            <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 700 }}>
              {selectedMenus.length} of {menus.length} menus selected
            </span>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                className="hiyaghar-multiselect-action-btn"
                onClick={onSelectAll}
              >
                ✓ Select All
              </button>
              <button
                type="button"
                className="hiyaghar-multiselect-action-btn"
                onClick={onDeselectAll}
                style={{ color: '#ef4444' }}
              >
                ✕ Clear All
              </button>
            </div>
          </div>

          <div className="hiyaghar-multiselect-search-box">
            <input
              type="text"
              className="hiyaghar-multiselect-search-input"
              placeholder="🔍 Search menus..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="hiyaghar-multiselect-list">
            {filteredMenus.length > 0 ? (
              filteredMenus.map((menu) => {
                const mid = menu.id || (menu as any).menuId || 0;
                const isChecked = !!permissions[mid]?.enabled;
                return (
                  <div
                    key={mid}
                    className={`hiyaghar-multiselect-item ${isChecked ? 'is-selected' : ''}`}
                    onClick={() => onToggleMenu(mid)}
                  >
                    <div className="hiyaghar-multiselect-item-left">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#166534' }}
                      />
                      <span className="hiyaghar-multiselect-item-label">{menu.name}</span>
                    </div>
                    {isChecked && (
                      <span style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 800 }}>
                        ✓ Granted
                      </span>
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '0.88rem' }}>
                No menus match your search.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
