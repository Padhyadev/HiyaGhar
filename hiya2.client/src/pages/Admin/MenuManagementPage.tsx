import React, { useState, useEffect } from 'react';
import { DataTable, type ColumnDef } from '../../components/admin/DataTable';
import { AdminAuthService } from '../../services/adminAuthService';
import { usePermission } from '../../context/PermissionContext';
import { showConfirm, showError, showToast, extractApiErrorMessage } from '../../utils/alertService';
import { MenuIcon } from '../../utils/iconUtils';

interface MenuItem {
  menuId?: number;
  id?: number;
  parentId: number;
  name: string;
  controller: string;
  icon: string;
  displayOrder: number;
  superAdmin: boolean;
  isActive: boolean;
}

export const MenuManagementPage: React.FC = () => {
  const { currentMenuPermission } = usePermission('MENU');
  const [menus, setMenus] = useState<MenuItem[]>([]);

  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    parentId: 0,
    name: '',
    controller: '',
    icon: 'Layers',
    displayOrder: 1,
    superAdmin: true,
  });

  const showToastMsg = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    showToast(msg, type);
  };

  useEffect(() => {
    loadMenus();
  }, []);

  const getItemId = (m: MenuItem) => m.menuId || m.id || 0;

  const loadMenus = async () => {
    try {
      const res = await fetch('/api/menu', { headers: AdminAuthService.getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setMenus(data);
      } else {
        setMenus([]);
      }
    } catch (e) {
      console.warn('Error loading menus:', e);
      setMenus([]);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormErrors({});
    setFormData({
      parentId: 0,
      name: '',
      controller: '',
      icon: 'Layers',
      displayOrder: menus.length + 1,
      superAdmin: true,
    });
    setViewMode('form');
  };

  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormErrors({});
    setFormData({
      parentId: item.parentId || 0,
      name: item.name,
      controller: item.controller,
      icon: item.icon,
      displayOrder: item.displayOrder,
      superAdmin: Boolean(item.superAdmin),
    });
    setViewMode('form');
  };

  const syncPermissionsAfterChange = async () => {
    try {
      const user = AdminAuthService.getUser();
      const res = await fetch(`/api/auth/menu-permissions?userId=${user?.userId || 0}`, {
        headers: AdminAuthService.getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.permissions)) {
          const permMap: Record<string, any> = {
            DASHBOARD: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, menuName: 'Dashboard', displayOrder: 0, icon: 'fa-solid fa-chart-line' }
          };
          data.permissions.forEach((p: any) => {
            const rawKey = p.controller ? p.controller.replace(/Controller$/i, '') : p.menuName;
            const key = rawKey?.toUpperCase().replace(/\s+/g, '_');
            if (key) {
              const hasAccess = !!(p.canView || p.canAdd || p.canEdit || p.canDelete);
              permMap[key] = {
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
          AdminAuthService.setPermissions(permMap);
        }
      }
    } catch (e) {}
  };

  const handleDelete = async (item: MenuItem) => {
    const isConfirmed = await showConfirm(`Are you sure you want to delete '${item.name}' menu?`, 'Delete Menu');
    if (!isConfirmed) return;
    const itemId = getItemId(item);
    try {
      const res = await fetch(`/api/menu/${itemId}`, {
        method: 'DELETE',
        headers: AdminAuthService.getAuthHeaders(),
      });
      if (res.ok) {
        setMenus((prev) => prev.filter((m) => getItemId(m) !== itemId));
        showToastMsg(`Menu '${item.name}' deleted.`);
      } else {
        setMenus((prev) => prev.filter((m) => getItemId(m) !== itemId));
        showToastMsg(`Menu '${item.name}' removed.`);
      }
      syncPermissionsAfterChange();
    } catch (e) {
      setMenus((prev) => prev.filter((m) => getItemId(m) !== itemId));
      showToastMsg(`Menu '${item.name}' deleted.`);
      syncPermissionsAfterChange();
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Please enter menu name';
    }
    if (!formData.controller.trim()) {
      newErrors.controller = 'Please enter controller name';
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }
    setFormErrors({});

    if (editingItem) {
      const itemId = getItemId(editingItem);
      try {
        const res = await fetch(`/api/menu/${itemId}`, {
          method: 'PUT',
          headers: AdminAuthService.getAuthHeaders(),
          body: JSON.stringify({
            ...editingItem,
            parentId: formData.parentId,
            name: formData.name,
            controller: formData.controller,
            icon: formData.icon,
            displayOrder: formData.displayOrder,
            superAdmin: formData.superAdmin,
          }),
        });

        if (!res.ok) {
          const message = await extractApiErrorMessage(res, 'Failed to update menu. Please try again.');
          await showError(message, 'Save Error');
          return;
        }

        await loadMenus();
        await syncPermissionsAfterChange();
        showToastMsg(`Menu ${formData.name} updated successfully.`);
      } catch (e) {
        await showError('Failed to update menu. Please check your connection and try again.', 'Save Error');
        return;
      }
    } else {
      try {
        const payload = {
          parentId: formData.parentId,
          name: formData.name,
          controller: formData.controller,
          icon: formData.icon,
          displayOrder: formData.displayOrder,
          superAdmin: formData.superAdmin,
          isActive: true,
        };
        const res = await fetch('/api/menu', {
          method: 'POST',
          headers: AdminAuthService.getAuthHeaders(),
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const message = await extractApiErrorMessage(res, 'Failed to create menu. Please try again.');
          await showError(message, 'Save Error');
          return;
        }

        await loadMenus();
        await syncPermissionsAfterChange();
        showToastMsg(`Menu ${formData.name} created successfully.`);
      } catch (e) {
        await showError('Failed to create menu. Please check your connection and try again.', 'Save Error');
        return;
      }
    }

    setViewMode('list');
  };

  // Filter Parent Menus: Must have parentId === 0 AND exclude own menu item
  const parentMenuOptions = menus.filter((m) => {
    const id = getItemId(m);
    const editId = editingItem ? getItemId(editingItem) : null;
    return (m.parentId === 0 || !m.parentId) && (editId === null || id !== editId);
  });

  const columns: ColumnDef<MenuItem>[] = [
    { key: 'name', label: 'Menu Name' },
    {
      key: 'parentId',
      label: 'Parent Menu',
      render: (m) => {
        if (!m.parentId || m.parentId === 0) return <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>-- Top Level Menu --</span>;
        const parent = menus.find((pm) => getItemId(pm) === m.parentId);
        return parent ? (
          <span style={{ fontWeight: 700, color: '#2d6a4f', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <i className="fa-solid fa-folder-tree" style={{ color: '#D19A27' }}></i>
            {parent.name}
          </span>
        ) : (
          <span style={{ color: '#64748b' }}>Parent #{m.parentId}</span>
        );
      },
    },
    { key: 'controller', label: 'Controller' },
    {
      key: 'icon',
      label: 'Icon',
      render: (m) => {
        const dbValue = m.icon || 'fa-solid fa-cube';
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', whiteSpace: 'nowrap' }}>
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#e6f4ea',
                border: '1px solid #c8e6c9',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <MenuIcon icon={m.icon} menuKey={m.controller || m.name} style={{ fontSize: '1rem', color: '#2d6a4f' }} />
            </span>
            <span style={{ fontSize: '0.82rem', color: '#334155', fontFamily: 'monospace', fontWeight: 500, whiteSpace: 'nowrap' }}>
              {dbValue}
            </span>
          </div>
        );
      },
    },
    { key: 'displayOrder', label: 'Display Order' },
  ];

  return (
    <div>
      {viewMode === 'list' ? (
        <DataTable<MenuItem>
          title="Menu Registry Management"
          addButtonText="+ Add Menu"
          columns={columns}
          data={menus}
          onAddClick={handleOpenAdd}
          onEditClick={handleOpenEdit}
          onDeleteClick={handleDelete}
          canAdd={currentMenuPermission.canAdd}
          canEdit={currentMenuPermission.canEdit}
          canDelete={currentMenuPermission.canDelete}
        />
      ) : (
        <div className="hiyaghar-datatable-card">
          <div className="hiyaghar-datatable-top-header">
            <h2 className="hiyaghar-datatable-title">
              {editingItem ? `Update Menu: ${editingItem.name}` : 'Add New Menu Item'}
            </h2>
            <button
              type="button"
              className="hiyaghar-export-btn"
              onClick={() => setViewMode('list')}
            >
              ← Back to Menu Listing
            </button>
          </div>

          <form onSubmit={handleSaveForm} className="hiyaghar-role-modal-body" style={{ padding: 0 }} noValidate>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="hiyaghar-form-group">
                <label>Menu Name *</label>
                <input
                  type="text"
                  maxLength={100}
                  placeholder="e.g. Order"
                  className={formErrors.name ? 'input-error' : ''}
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: '' }));
                  }}
                />
                {formErrors.name && <span className="hiyaghar-field-error">{formErrors.name}</span>}
              </div>

              <div className="hiyaghar-form-group">
                <label>Select Parent Menu</label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: Number(e.target.value) })}
                  className="hiyaghar-select-pagesize"
                  style={{ padding: '10px 14px' }}
                >
                  <option value={0}>-- None (Top Level Menu) --</option>
                  {parentMenuOptions.map((pm) => (
                    <option key={getItemId(pm)} value={getItemId(pm)}>
                      {pm.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '16px' }}>
              <div className="hiyaghar-form-group">
                <label>Controller Name *</label>
                <input
                  type="text"
                  maxLength={50}
                  placeholder="e.g. OrderController"
                  className={formErrors.controller ? 'input-error' : ''}
                  value={formData.controller}
                  onChange={(e) => {
                    setFormData({ ...formData, controller: e.target.value });
                    if (formErrors.controller) setFormErrors((prev) => ({ ...prev, controller: '' }));
                  }}
                />
                {formErrors.controller && <span className="hiyaghar-field-error">{formErrors.controller}</span>}
              </div>

              <div className="hiyaghar-form-group">
                <label>FontAwesome Icon Class</label>
                <input
                  type="text"
                  maxLength={100}
                  placeholder="e.g. fa-solid fa-cart-shopping"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                />
              </div>

              <div className="hiyaghar-form-group">
                <label>Display Order</label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                />
              </div>
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
                {editingItem ? 'Update Menu Item' : 'Save New Menu'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
