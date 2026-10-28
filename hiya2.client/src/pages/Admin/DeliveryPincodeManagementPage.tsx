import React, { useEffect, useMemo, useState } from 'react';
import { DataTable, type ColumnDef } from '../../components/admin/DataTable';
import { DeliveryPincodeService, type DeliveryPincodeItem } from '../../services/deliveryPincodeService';
import { usePermission } from '../../context/PermissionContext';
import { showConfirm, showToast } from '../../utils/alertService';
import './DeliveryPincodeManagementPage.css';

// Row shape for the table: deliveryStatus is the text shown in search and the CSV export.
interface PincodeRow extends DeliveryPincodeItem {
  deliveryStatus: 'Allowed' | 'Not Allowed';
}

// The pincode list is fixed (all Ahmedabad pincodes): no add / edit / delete, only the
// Allowed / Not Allowed switch on each row.
export const DeliveryPincodeManagementPage: React.FC = () => {
  const { currentMenuPermission } = usePermission('DELIVERY_PINCODE');
  const [pincodes, setPincodes] = useState<DeliveryPincodeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'allowed' | 'notAllowed'>('all');
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    DeliveryPincodeService.getAll().then((res) => {
      if (res.success) {
        setPincodes(res.data);
      } else {
        showToast('Failed to load delivery pincodes.', 'error');
      }
      setLoading(false);
    });
  }, []);

  const allowedCount = pincodes.filter((p) => p.isAllowed).length;

  const rows = useMemo<PincodeRow[]>(
    () =>
      pincodes
        .filter((p) => (statusFilter === 'allowed' ? p.isAllowed : statusFilter === 'notAllowed' ? !p.isAllowed : true))
        .map((p) => ({ ...p, deliveryStatus: p.isAllowed ? 'Allowed' : 'Not Allowed' })),
    [pincodes, statusFilter]
  );

  const handleDeliveryChange = async (item: DeliveryPincodeItem, nextAllowed: boolean) => {
    if (item.isAllowed === nextAllowed) return;

    // The switch is controlled by item.isAllowed, so a cancelled confirmation leaves it on Allowed.
    if (!nextAllowed) {
      const confirmed = await showConfirm(
        `Customers with pincode ${item.pincode} (${item.areaName}) will not be able to place new orders. Orders already placed are not affected.`,
        'Stop delivery to this pincode?',
        'Yes, Not Allow',
        'Cancel'
      );
      if (!confirmed) return;
    }

    setSavingId(item.id);
    const res = await DeliveryPincodeService.setAllowed(item.id, nextAllowed);
    setSavingId(null);

    if (res.success) {
      setPincodes((prev) => prev.map((p) => (p.id === item.id ? { ...p, isAllowed: nextAllowed } : p)));
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  const columns: ColumnDef<PincodeRow>[] = [
    {
      key: 'pincode',
      label: 'Pincode',
      render: (p) => <strong>{p.pincode}</strong>,
    },
    { key: 'areaName', label: 'Area' },
    {
      key: 'deliveryStatus',
      label: 'Delivery',
      sortValue: (p) => p.isAllowed,
      render: (p) => (
        <label className={`pincode-switch ${p.isAllowed ? 'is-on' : ''}`}>
          <input
            type="checkbox"
            role="switch"
            checked={p.isAllowed}
            disabled={savingId === p.id || !currentMenuPermission.canEdit}
            onChange={(e) => handleDeliveryChange(p, e.target.checked)}
            aria-label={`Delivery for ${p.pincode}`}
          />
          <span className="pincode-switch-track" aria-hidden="true">
            <span className="pincode-switch-thumb" />
          </span>
          <span className="pincode-switch-label">{p.deliveryStatus}</span>
        </label>
      ),
    },
  ];

  return (
    <div>
      <DataTable<PincodeRow>
        title="Delivery Pincodes Management"
        columns={columns}
        data={rows}
        loading={loading}
        canAdd={false}
        canEdit={false}
        canDelete={false}
        canExport={currentMenuPermission.canExport}
        defaultSortKey="pincode"
        extraControls={
          <div className="hiyaghar-entries-control">
            <span>Delivery</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="hiyaghar-select-pagesize"
            >
              <option value="all">All ({pincodes.length})</option>
              <option value="allowed">Allowed ({allowedCount})</option>
              <option value="notAllowed">Not Allowed ({pincodes.length - allowedCount})</option>
            </select>
          </div>
        }
      />
    </div>
  );
};
