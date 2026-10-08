import React, { useEffect, useState } from 'react';
import { DataTable, type ColumnDef } from '../../components/admin/DataTable';
import { ContactQueryService, type ContactQueryItem } from '../../services/contactQueryService';
import { usePermission } from '../../context/PermissionContext';
import { showConfirm, showError, showToast } from '../../utils/alertService';
import './ContactQueryManagementPage.css';

export const ContactQueryManagementPage: React.FC = () => {
  const { currentMenuPermission } = usePermission('CONTACT_QUERY');
  const [queries, setQueries] = useState<ContactQueryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedQuery, setSelectedQuery] = useState<ContactQueryItem | null>(null);
  const [modalStatus, setModalStatus] = useState<string>('Pending');
  const [modalNotes, setModalNotes] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const loadQueries = async () => {
    setLoading(true);
    try {
      const res = await ContactQueryService.getQueries(statusFilter);
      if (res.success) {
        setQueries(res.data);
      } else {
        setQueries([]);
      }
    } catch (e) {
      console.warn('Error loading queries:', e);
      setQueries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueries();
  }, [statusFilter]);

  const handleOpenDetailModal = (item: ContactQueryItem) => {
    setSelectedQuery(item);
    setModalStatus(item.status);
    setModalNotes(item.adminNotes || '');
  };

  const handleCloseModal = () => {
    setSelectedQuery(null);
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuery) return;

    setIsUpdating(true);
    const res = await ContactQueryService.updateStatus(selectedQuery.id, modalStatus, modalNotes);
    setIsUpdating(false);

    if (res.success) {
      showToast('Inquiry status updated successfully.', 'success');
      setQueries((prev) =>
        prev.map((q) =>
          q.id === selectedQuery.id
            ? { ...q, status: modalStatus, adminNotes: modalNotes, resolvedDate: (modalStatus === 'Resolved' || modalStatus === 'Closed') ? new Date().toISOString() : q.resolvedDate }
            : q
        )
      );
      handleCloseModal();
    } else {
      showError(res.message || 'Failed to update status.');
    }
  };

  const handleDelete = async (item: ContactQueryItem) => {
    const isConfirmed = await showConfirm(
      `Are you sure you want to delete inquiry #${item.id} from ${item.fullName}?`,
      'Delete Inquiry'
    );
    if (!isConfirmed) return;

    const res = await ContactQueryService.deleteQuery(item.id);
    if (res.success) {
      setQueries((prev) => prev.filter((q) => q.id !== item.id));
      showToast('Inquiry deleted successfully.', 'success');
    } else {
      showError(res.message || 'Failed to delete inquiry.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Resolved':
        return <span className="query-status-badge status-resolved">Resolved</span>;
      case 'In Progress':
        return <span className="query-status-badge status-progress">In Progress</span>;
      case 'Closed':
        return <span className="query-status-badge status-closed">Closed</span>;
      default:
        return <span className="query-status-badge status-pending">Pending</span>;
    }
  };

  const columns: ColumnDef<ContactQueryItem>[] = [
    {
      key: 'id',
      label: 'ID',
      render: (q) => <span className="query-id-tag">#{q.id}</span>,
    },
    {
      key: 'fullName',
      label: 'Sender Name',
      render: (q) => (
        <div className="query-user-cell">
          <strong>{q.fullName}</strong>
          <span className="query-user-email">{q.email}</span>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Phone / WA',
      render: (q) =>
        q.phone ? (
          <a
            href={`https://wa.me/${q.phone.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="query-phone-link"
            title="Open WhatsApp chat"
          >
            {q.phone}
          </a>
        ) : (
          <span style={{ color: '#94a3b8' }}>—</span>
        ),
    },
    {
      key: 'subject',
      label: 'Subject',
      render: (q) => <span className="query-subject-badge">{q.subject}</span>,
    },
    {
      key: 'message',
      label: 'Message',
      render: (q) => (
        <span className="query-message-cell" title={q.message}>
          {q.message}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (q) => getStatusBadge(q.status),
    },
    {
      key: 'createdDate',
      label: 'Submitted Date',
      render: (q) => (
        <span className="query-date-text">
          {new Date(q.createdDate).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (q) => (
        <div className="query-actions-btns">
          <button
            type="button"
            className="query-btn-view"
            onClick={() => handleOpenDetailModal(q)}
            title="View & Reply / Update Status"
          >
            <i className="fa-solid fa-eye" /> View
          </button>
          {currentMenuPermission.canDelete && (
            <button
              type="button"
              className="query-btn-del"
              onClick={() => handleDelete(q)}
              title="Delete Inquiry"
            >
              <i className="fa-solid fa-trash-can" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="contact-queries-page-container">
      {/* HEADER & FILTERS */}
      <div className="contact-queries-header">
        <div className="contact-queries-title-group">
          <h1>Customer Contact Queries</h1>
          <p>Manage and respond to messages submitted from the website Contact Us page.</p>
        </div>

        <div className="contact-queries-filter-tabs">
          {['All', 'Pending', 'In Progress', 'Resolved', 'Closed'].map((st) => (
            <button
              key={st}
              type="button"
              className={`query-filter-tab ${statusFilter === st ? 'active' : ''}`}
              onClick={() => setStatusFilter(st)}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="contact-queries-table-card">
        <DataTable
          title="Contact Inquiries"
          data={queries}
          columns={columns}
          loading={loading}
          canAdd={false}
          canEdit={false}
          canDelete={false}
        />
      </div>

      {/* DETAIL & STATUS UPDATE MODAL */}
      {selectedQuery && (
        <div className="query-modal-backdrop" onClick={handleCloseModal}>
          <div className="query-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="query-modal-header">
              <h3>Inquiry #{selectedQuery.id} Details</h3>
              <button type="button" className="query-modal-close-btn" onClick={handleCloseModal}>
                &times;
              </button>
            </div>

            <div className="query-modal-body">
              <div className="query-detail-row">
                <span className="query-label">Sender Name:</span>
                <span className="query-value font-bold">{selectedQuery.fullName}</span>
              </div>
              <div className="query-detail-row">
                <span className="query-label">Email:</span>
                <span className="query-value">
                  <a href={`mailto:${selectedQuery.email}`} className="text-link">
                    {selectedQuery.email}
                  </a>
                </span>
              </div>
              {selectedQuery.phone && (
                <div className="query-detail-row">
                  <span className="query-label">Phone / WhatsApp:</span>
                  <span className="query-value">
                    <a
                      href={`https://wa.me/${selectedQuery.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-link"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <i className="fa-brands fa-whatsapp" style={{ color: '#25D366', fontSize: '1.1rem' }}></i>
                      <span>{selectedQuery.phone} (Open WhatsApp)</span>
                    </a>
                  </span>
                </div>
              )}
              <div className="query-detail-row">
                <span className="query-label">Subject:</span>
                <span className="query-value query-subject-badge">{selectedQuery.subject}</span>
              </div>
              <div className="query-detail-row">
                <span className="query-label">Submitted On:</span>
                <span className="query-value">
                  {new Date(selectedQuery.createdDate).toLocaleString()}
                </span>
              </div>
              <div className="query-detail-row full-col">
                <span className="query-label">Message:</span>
                <div className="query-message-box">{selectedQuery.message}</div>
              </div>

              {/* Status Update Form */}
              <form onSubmit={handleSaveStatus} className="query-status-form">
                <hr className="query-divider" />
                <h4>Update Status & Internal Notes</h4>

                <div className="query-form-group">
                  <label htmlFor="modalStatus">Inquiry Status:</label>
                  <select
                    id="modalStatus"
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value)}
                  >
                    <option value="Pending">Pending (New)</option>
                    <option value="In Progress">In Progress (Reviewing)</option>
                    <option value="Resolved">Resolved (Customer Assisted)</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div className="query-form-group">
                  <label htmlFor="modalNotes">Admin Internal Notes:</label>
                  <textarea
                    id="modalNotes"
                    rows={3}
                    placeholder="Add follow-up notes, call details, or resolution comments here..."
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                  />
                </div>

                <div className="query-modal-footer">
                  <button
                    type="button"
                    className="query-btn-secondary"
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="query-btn-primary"
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
