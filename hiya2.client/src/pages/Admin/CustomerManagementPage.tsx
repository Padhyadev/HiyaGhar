import React, { useState, useEffect } from 'react';
import { DataTable, type ColumnDef } from '../../components/admin/DataTable';
import { AdminAuthService } from '../../services/adminAuthService';
import { usePermission } from '../../context/PermissionContext';
import { showConfirm } from '../../utils/alertService';
import { allowOnlyDigits, allowOnlyLetters, sanitizeDigits, sanitizeLetters } from '../../utils/validationUtils';

interface CustomerItem {
  customerId: number;
  firstName: string;
  lastName: string;
  email: string;
  mobileNo: string;
  city?: string;
  isActive: boolean;
}

export const CustomerManagementPage: React.FC = () => {
  const { currentMenuPermission } = usePermission('CUSTOMER');
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingItem, setEditingItem] = useState<CustomerItem | null>(null);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', mobileNo: '' });

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => { loadCustomers(); }, []);

  const loadCustomers = async () => {
    try {
      const res = await fetch('/api/customer', { headers: AdminAuthService.getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      } else {
        setCustomers([]);
      }
    } catch (e) {
      console.warn('Error loading customers:', e);
      setCustomers([]);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ firstName: '', lastName: '', email: '', mobileNo: '' });
    setViewMode('form');
  };

  const handleOpenEdit = (item: CustomerItem) => {
    setEditingItem(item);
    setFormData({ firstName: item.firstName, lastName: item.lastName, email: item.email, mobileNo: item.mobileNo });
    setViewMode('form');
  };

  const handleDelete = async (item: CustomerItem) => {
    const isConfirmed = await showConfirm(`Are you sure you want to delete '${item.firstName} ${item.lastName}' customer?`, 'Delete Customer');
    if (!isConfirmed) return;
    setCustomers((prev) => prev.filter((c) => c.customerId !== item.customerId));
    showToastMsg(`Customer '${item.firstName}' deleted.`);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.email) return;

    if (editingItem) {
      const updated: CustomerItem = { ...editingItem, ...formData };
      setCustomers((prev) => prev.map((c) => (c.customerId === editingItem.customerId ? updated : c)));
      showToastMsg(`Customer '${formData.firstName}' updated!`);
    } else {
      const newCust: CustomerItem = { customerId: Date.now(), ...formData, isActive: true };
      setCustomers((prev) => [...prev, newCust]);
      showToastMsg(`Customer '${formData.firstName}' created!`);
    }

    setViewMode('list');
  };

  const columns: ColumnDef<CustomerItem>[] = [
    { key: 'name', label: 'Customer Name', render: (c) => `${c.firstName} ${c.lastName}` },
    { key: 'email', label: 'Email Address' },
    { key: 'mobileNo', label: 'Mobile No' },
  ];

  return (
    <div>
      {toast && <div className="hiyaghar-role-toast">{toast}</div>}

      {viewMode === 'list' ? (
        <DataTable<CustomerItem>
          title="Customer Accounts Management"
          addButtonText="+ Add Customer"
          columns={columns}
          data={customers}
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
            <h2 className="hiyaghar-datatable-title">{editingItem ? `Update Customer: ${editingItem.firstName}` : 'Add New Customer'}</h2>
            <button type="button" className="hiyaghar-export-btn" onClick={() => setViewMode('list')}>← Back to Listing</button>
          </div>

          <form onSubmit={handleSaveForm} className="hiyaghar-role-modal-body" style={{ padding: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="hiyaghar-form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  maxLength={50}
                  placeholder="e.g. Vishal"
                  value={formData.firstName}
                  onKeyDown={allowOnlyLetters}
                  onChange={(e) => setFormData({ ...formData, firstName: sanitizeLetters(e.target.value) })}
                  required
                />
              </div>
              <div className="hiyaghar-form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  maxLength={50}
                  placeholder="e.g. Gami"
                  value={formData.lastName}
                  onKeyDown={allowOnlyLetters}
                  onChange={(e) => setFormData({ ...formData, lastName: sanitizeLetters(e.target.value) })}
                  required
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="hiyaghar-form-group">
                <label>Email *</label>
                <input type="email" maxLength={150} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              </div>
              <div className="hiyaghar-form-group">
                <label>Mobile No</label>
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
            <div className="hiyaghar-modal-footer" style={{ marginTop: '20px' }}>
              <button type="button" className="hiyaghar-btn-cancel" onClick={() => setViewMode('list')}>Cancel</button>
              <button type="submit" className="hiyaghar-btn-submit">{editingItem ? 'Update Customer' : 'Save Customer'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
