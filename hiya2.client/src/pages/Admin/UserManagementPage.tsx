import React, { useState, useEffect } from 'react';
import { DataTable, type ColumnDef } from '../../components/admin/DataTable';
import { AdminAuthService } from '../../services/adminAuthService';
import { usePermission } from '../../context/PermissionContext';
import { showConfirm, showError, showToast, extractApiErrorMessage } from '../../utils/alertService';
import { allowOnlyDigits, allowOnlyLetters, sanitizeDigits, sanitizeLetters } from '../../utils/validationUtils';

interface UserItem {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  mobileNo: string;
  username?: string;
  roleName?: string;
  roleId?: number;
  roles?: { roleId: number; roleName: string; roleCode?: string; RoleId?: number; RoleName?: string }[];
  isActive: boolean;
}

interface RoleOption {
  roleId: number;
  roleName: string;
  roleCode?: string;
  isActive?: boolean;
}

export const UserManagementPage: React.FC = () => {
  const { currentMenuPermission } = usePermission('USER');
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);

  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingItem, setEditingItem] = useState<UserItem | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobileNo: '',
    username: '',
    password: '',
    confirmPassword: '',
    roleId: 1,
  });

  const showToastMsg = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    showToast(msg, type);
  };

  useEffect(() => {
    loadUsers();
    loadRoleOptions();
  }, []);

  const loadRoleOptions = async () => {
    try {
      const res = await fetch('/api/role', { headers: AdminAuthService.getAuthHeaders() });
      if (res.ok) {
        const data: RoleOption[] = await res.json();
        const activeRoles = data.filter((r) => r.isActive !== false);
        setRoleOptions(activeRoles.length > 0 ? activeRoles : data);
      } else {
        setRoleOptions([]);
      }
    } catch (e) {
      setRoleOptions([]);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/user', { headers: AdminAuthService.getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        setUsers([]);
      }
    } catch (e) {
      console.warn('Error loading users:', e);
      setUsers([]);
    }
  };

  const getRoleNameForUser = (user: UserItem): string => {
    if (user.roles && user.roles.length > 0) {
      const r = user.roles[0];
      return r.roleName || r.RoleName || user.roleName || 'Super Admin';
    }
    if (user.roleName) return user.roleName;
    if (user.roleId) {
      const matched = roleOptions.find((r) => r.roleId === user.roleId);
      if (matched) return matched.roleName;
    }
    return 'Super Admin';
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    const defaultRoleId = roleOptions.length > 0 ? roleOptions[0].roleId : 1;
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      mobileNo: '',
      username: '',
      password: '',
      confirmPassword: '',
      roleId: defaultRoleId,
    });
    setViewMode('form');
  };

  const handleOpenEdit = (item: UserItem) => {
    setEditingItem(item);
    setFormErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    const currentRoleId = item.roles && item.roles.length > 0 ? (item.roles[0].roleId || item.roles[0].RoleId || 1) : (item.roleId || 1);
    setFormData({
      firstName: item.firstName,
      lastName: item.lastName,
      email: item.email,
      mobileNo: item.mobileNo,
      username: item.username || '',
      password: '',
      confirmPassword: '',
      roleId: currentRoleId,
    });
    setViewMode('form');

    fetch(`/api/user/${item.userId}`, { headers: AdminAuthService.getAuthHeaders() })
      .then((res) => (res.ok ? res.json() : null))
      .then((fresh: UserItem | null) => {
        if (!fresh) return;
        setEditingItem((prevEditing) => {
          if (!prevEditing || prevEditing.userId !== item.userId) return prevEditing;
          const freshRoleId = fresh.roles && fresh.roles.length > 0 ? (fresh.roles[0].roleId || fresh.roles[0].RoleId || 1) : (fresh.roleId || 1);
          setFormData({
            firstName: fresh.firstName,
            lastName: fresh.lastName,
            email: fresh.email,
            mobileNo: fresh.mobileNo,
            username: fresh.username || '',
            password: '',
            confirmPassword: '',
            roleId: freshRoleId,
          });
          return fresh;
        });
      })
      .catch(() => {});
  };

  const handleDelete = async (item: UserItem) => {
    const isConfirmed = await showConfirm(`Are you sure you want to delete '${item.firstName} ${item.lastName}' user?`, 'Delete User');
    if (!isConfirmed) return;
    try {
      await fetch(`/api/user/${item.userId}`, {
        method: 'DELETE',
        headers: AdminAuthService.getAuthHeaders(),
      });
      setUsers((prev) => prev.filter((u) => u.userId !== item.userId));
      showToastMsg(`User ${item.firstName} deleted.`);
    } catch (e) {
      setUsers((prev) => prev.filter((u) => u.userId !== item.userId));
      showToastMsg(`User ${item.firstName} deleted.`);
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Please enter first name';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Please enter last name';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Please enter email address';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter valid email address';
    }
    if (!formData.roleId || formData.roleId === 0) {
      newErrors.roleId = 'Please select assigned system role';
    }
    if (!editingItem) {
      if (!formData.password) {
        newErrors.password = 'Please enter password';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Please enter at least 8 characters';
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please enter confirm password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Please enter matching confirm password';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }
    setFormErrors({});

    const payload = {
      userId: editingItem ? editingItem.userId : 0,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      mobileNo: formData.mobileNo,
      username: formData.username,
      password: formData.password,
      roleIds: [formData.roleId],
      isActive: true,
    };

    try {
      const url = editingItem ? `/api/user/${editingItem.userId}` : '/api/user';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: AdminAuthService.getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const message = await extractApiErrorMessage(res, 'Failed to save user. Please try again.');
        await showError(message, 'Save Error');
        return;
      }
    } catch (err) {
      await showError('Failed to save user. Please check your connection and try again.', 'Save Error');
      return;
    }

    await loadUsers();
    showToastMsg(editingItem ? `User ${formData.firstName} updated successfully.` : `User ${formData.firstName} created successfully.`);
    setViewMode('list');
  };

  const columns: ColumnDef<UserItem>[] = [
    {
      key: 'name',
      label: 'Full Name',
      render: (u) => `${u.firstName} ${u.lastName}`,
    },
    { key: 'email', label: 'Email Address' },
    { key: 'mobileNo', label: 'Mobile No' },
    {
      key: 'username',
      label: 'Username',
      render: (u) => u.username || '—',
    },
    {
      key: 'roleName',
      label: 'Assigned Role',
      render: (u) => (
        <span className="hiyaghar-role-badge system">{getRoleNameForUser(u)}</span>
      ),
    },
  ];

  return (
    <div>
      {viewMode === 'list' ? (
        <DataTable<UserItem>
          title="User Accounts Management"
          addButtonText="+ Add User"
          columns={columns}
          data={users}
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
              {editingItem ? `Edit User: ${editingItem.firstName} ${editingItem.lastName}` : 'Add New Staff User'}
            </h2>
            <button
              type="button"
              className="hiyaghar-export-btn"
              onClick={() => setViewMode('list')}
            >
              ← Back to User Listing
            </button>
          </div>

          <form onSubmit={handleSaveForm} className="hiyaghar-role-modal-body" style={{ padding: 0 }} noValidate>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="hiyaghar-form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  maxLength={100}
                  placeholder="e.g. Vishal"
                  className={formErrors.firstName ? 'input-error' : ''}
                  value={formData.firstName}
                  onKeyDown={allowOnlyLetters}
                  onChange={(e) => {
                    setFormData({ ...formData, firstName: sanitizeLetters(e.target.value) });
                    if (formErrors.firstName) setFormErrors((prev) => ({ ...prev, firstName: '' }));
                  }}
                />
                {formErrors.firstName && <span className="hiyaghar-field-error">{formErrors.firstName}</span>}
              </div>

              <div className="hiyaghar-form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  maxLength={100}
                  placeholder="e.g. Gami"
                  className={formErrors.lastName ? 'input-error' : ''}
                  value={formData.lastName}
                  onKeyDown={allowOnlyLetters}
                  onChange={(e) => {
                    setFormData({ ...formData, lastName: sanitizeLetters(e.target.value) });
                    if (formErrors.lastName) setFormErrors((prev) => ({ ...prev, lastName: '' }));
                  }}
                />
                {formErrors.lastName && <span className="hiyaghar-field-error">{formErrors.lastName}</span>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="hiyaghar-form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  maxLength={150}
                  placeholder="e.g. user@hiyaghar.com"
                  className={formErrors.email ? 'input-error' : ''}
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: '' }));
                  }}
                />
                {formErrors.email && <span className="hiyaghar-field-error">{formErrors.email}</span>}
              </div>

              <div className="hiyaghar-form-group">
                <label>Mobile Number</label>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="e.g. 9876543210"
                  value={formData.mobileNo}
                  onKeyDown={allowOnlyDigits}
                  onChange={(e) => setFormData({ ...formData, mobileNo: sanitizeDigits(e.target.value) })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="hiyaghar-form-group">
                <label>Username</label>
                <input
                  type="text"
                  maxLength={100}
                  placeholder="e.g. vishal.gami"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
            </div>

            {!editingItem && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="hiyaghar-form-group">
                  <label>Password *</label>
                  <div className="hiyaghar-password-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      maxLength={50}
                      placeholder="••••••••"
                      className={formErrors.password ? 'input-error' : ''}
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value });
                        if (formErrors.password) setFormErrors((prev) => ({ ...prev, password: '' }));
                      }}
                    />
                    <button
                      type="button"
                      className="hiyaghar-password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {formErrors.password && <span className="hiyaghar-field-error">{formErrors.password}</span>}
                </div>

                <div className="hiyaghar-form-group">
                  <label>Confirm Password *</label>
                  <div className="hiyaghar-password-wrapper">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      maxLength={50}
                      placeholder="••••••••"
                      className={formErrors.confirmPassword ? 'input-error' : ''}
                      value={formData.confirmPassword}
                      onChange={(e) => {
                        setFormData({ ...formData, confirmPassword: e.target.value });
                        if (formErrors.confirmPassword) setFormErrors((prev) => ({ ...prev, confirmPassword: '' }));
                      }}
                    />
                    <button
                      type="button"
                      className="hiyaghar-password-toggle-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      title={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {formErrors.confirmPassword && <span className="hiyaghar-field-error">{formErrors.confirmPassword}</span>}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              <div className="hiyaghar-form-group">
                <label>Assigned System Role *</label>
                <select
                  value={formData.roleId}
                  onChange={(e) => {
                    setFormData({ ...formData, roleId: Number(e.target.value) });
                    if (formErrors.roleId) setFormErrors((prev) => ({ ...prev, roleId: '' }));
                  }}
                  className={`hiyaghar-select-pagesize ${formErrors.roleId ? 'input-error' : ''}`}
                  style={{ padding: '10px 14px', width: '100%' }}
                >
                  {roleOptions.map((r) => (
                    <option key={r.roleId} value={r.roleId}>
                      {r.roleName}
                    </option>
                  ))}
                </select>
                {formErrors.roleId && <span className="hiyaghar-field-error">{formErrors.roleId}</span>}
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
                {editingItem ? 'Update User Account' : 'Save New User'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
